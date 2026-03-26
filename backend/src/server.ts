import "./load-env.js";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { v4 as uuid } from "uuid";
import { ACCESS_TOKEN_TTL_SECONDS, APP_ORIGIN, PORT, REFRESH_TOKEN_TTL_SECONDS } from "./config.js";
import { signAccessToken, signHintToken, signRefreshToken, verifyJwt } from "./auth.js";
import {
  createSession,
  createPasswordResetToken,
  createUser,
  getCounts,
  getPasswordResetToken,
  getSessionById,
  getSessionByToken,
  getUserByEmail,
  getUserById,
  initDatabase,
  insertAuditLog,
  listAuditLogs,
  listCustomerPortalForUser,
  listLeadsForUser,
  listReportsForUser,
  listTasksForUser,
  listUsersForActor,
  markPasswordResetTokenUsed,
  revokeSession,
  revokeAllSessionsForUser,
  updateUserPassword,
  updateUserBasics,
  updateUserPermissions,
  updateUserStatus,
} from "./db.js";
import { ALL_PERMISSIONS, PERMISSION_GROUPS, ROLE_DEFAULT_PERMISSIONS } from "./permissions.js";
import type { Permission, Role, SessionRecord, UserRecord } from "./types.js";

const app = express();

app.use(cors({ origin: APP_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

type SafeUser = Omit<UserRecord, "passwordHash">;
type AuthedRequest = Request & { user: UserRecord; sessionId: string };

const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

function sanitizeUser(user: UserRecord): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function appendAudit(actor: UserRecord, action: string, targetUserId: string | null, details: string) {
  await insertAuditLog({
    id: uuid(),
    actorUserId: actor.id,
    actorEmail: actor.email,
    action,
    targetUserId,
    details,
    createdAt: new Date().toISOString(),
  });
}

function writeAuthCookies(res: Response, user: UserRecord, sessionId: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === "production";
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    path: "/",
  });
  res.cookie("rbac_hint", signHintToken(user, sessionId), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    path: "/",
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie("refresh_token", { path: "/" });
  res.clearCookie("rbac_hint", { path: "/" });
}

function canManage(actor: UserRecord, target: UserRecord) {
  if (actor.role === "admin") return true;
  if (actor.role !== "manager") return actor.id === target.id;
  if (target.role === "admin" || target.role === "manager") return actor.id === target.id;
  return target.managerId === actor.id || target.createdBy === actor.id || target.id === actor.id;
}

function ensureCanGrant(actor: UserRecord, nextPermissions: Permission[]) {
  const missing = nextPermissions.filter((permission) => !actor.permissions.includes(permission));
  if (missing.length > 0) {
    throw new Error(`Grant ceiling exceeded. Missing permissions: ${missing.join(", ")}`);
  }
}

function permissionGuard(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authedReq = req as AuthedRequest;
    if (!authedReq.user.permissions.includes(permission)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyJwt(token);
    const user = await getUserById(String(payload.sub));
    const session = await getSessionById(String(payload.sid));

    if (!user || !session || session.userId !== user.id || session.revokedAt) {
      return res.status(401).json({ message: "Session expired" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "User suspended" });
    }

    if (user.status === "banned") {
      return res.status(403).json({ message: "User banned" });
    }

    (req as AuthedRequest).user = user;
    (req as AuthedRequest).sessionId = session.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid access token" });
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const key = `${req.ip}:${email.toLowerCase()}`;
  const attempt = loginAttempts.get(key);
  if (attempt?.lockedUntil && attempt.lockedUntil > Date.now()) {
    return res.status(429).json({ message: "Too many attempts. Please try again shortly." });
  }

  const user = await getUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const nextCount = (attempt?.count ?? 0) + 1;
    loginAttempts.set(key, {
      count: nextCount,
      lockedUntil: nextCount >= 5 ? Date.now() + 5 * 60 * 1000 : undefined,
    });
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.status !== "active") {
    return res.status(403).json({ message: `User is ${user.status}` });
  }

  loginAttempts.delete(key);
  const sessionId = uuid();
  const refreshToken = signRefreshToken(sessionId, user.id);
  const accessToken = signAccessToken(user, sessionId);
  const session: SessionRecord = {
    id: sessionId,
    userId: user.id,
    refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
    revokedAt: null,
    createdAt: new Date().toISOString(),
  };
  await createSession(session);
  writeAuthCookies(res, user, sessionId, refreshToken);

  return res.json({
    accessToken,
    user: sanitizeUser(user),
    demoCredentials: {
      admin: { email: "admin@obliq.app", password: "Admin123!" },
      manager: { email: "manager@obliq.app", password: "Manager123!" },
      agent: { email: "agent@obliq.app", password: "Agent123!" },
      customer: { email: "customer@obliq.app", password: "Customer123!" },
    },
  });
});

app.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  if (await getUserByEmail(email)) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const timestamp = new Date().toISOString();
  const user: UserRecord = {
    id: uuid(),
    name,
    email,
    role: "customer",
    status: "active",
    managerId: null,
    createdBy: null,
    passwordHash: await bcrypt.hash(password, 10),
    permissions: ROLE_DEFAULT_PERMISSIONS.customer,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await createUser(user);
  await appendAudit(user, "auth.signup", user.id, `Public signup for ${email}`);
  return res.status(201).json({ message: "Account created. You can now sign in." });
});

app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return res.json({ message: "If the account exists, a reset token has been generated." });
  }

  const token = uuid().replace(/-/g, "");
  await createPasswordResetToken({
    id: uuid(),
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    usedAt: null,
    createdAt: new Date().toISOString(),
  });

  await appendAudit(user, "auth.forgot_password", user.id, `Password reset token generated for ${email}`);
  return res.json({
    message: "Password reset token generated.",
    resetToken: token,
  });
});

app.post("/auth/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body as { email?: string; token?: string; newPassword?: string };

  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: "email, token and newPassword are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const user = await getUserByEmail(email);
  const resetToken = await getPasswordResetToken(token);

  if (
    !user ||
    !resetToken ||
    resetToken.userId !== user.id ||
    resetToken.usedAt ||
    new Date(resetToken.expiresAt).getTime() < Date.now()
  ) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  await updateUserPassword(user.id, await bcrypt.hash(newPassword, 10));
  await markPasswordResetTokenUsed(resetToken.id);
  await revokeAllSessionsForUser(user.id);
  await appendAudit(user, "auth.reset_password", user.id, `Password reset completed for ${email}`);
  clearAuthCookies(res);
  return res.json({ message: "Password updated. Please sign in again." });
});

app.post("/auth/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token as string | undefined;
    if (!refreshToken) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    const payload = verifyJwt(refreshToken);
    const session = await getSessionByToken(refreshToken);
    const user = await getUserById(String(payload.sub));

    if (!session || !user || session.id !== payload.sid || session.revokedAt || new Date(session.expiresAt).getTime() < Date.now()) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token expired" });
    }

    if (user.status !== "active") {
      clearAuthCookies(res);
      return res.status(403).json({ message: `User is ${user.status}` });
    }

    writeAuthCookies(res, user, session.id, refreshToken);
    return res.json({
      accessToken: signAccessToken(user, session.id),
      user: sanitizeUser(user),
    });
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

app.post("/auth/logout", authGuard, async (req, res) => {
  const authedReq = req as AuthedRequest;
  await revokeSession(authedReq.sessionId);
  await appendAudit(authedReq.user, "auth.logout", authedReq.user.id, "User logged out");
  clearAuthCookies(res);
  res.json({ ok: true });
});

app.get("/me", authGuard, async (req, res) => {
  const authedReq = req as AuthedRequest;
  const stats = await getCounts();
  res.json({
    user: sanitizeUser(authedReq.user),
    sidebar: [
      { label: "Dashboard", href: "/dashboard", permission: "dashboard.view" },
      { label: "Users", href: "/users", permission: "users.view" },
      { label: "Leads", href: "/leads", permission: "leads.view" },
      { label: "Tasks", href: "/tasks", permission: "tasks.view" },
      { label: "Reports", href: "/reports", permission: "reports.view" },
      { label: "Audit Log", href: "/audit-log", permission: "audit.view" },
      { label: "Customer Portal", href: "/customer-portal", permission: "customer_portal.view" },
      { label: "Settings", href: "/settings", permission: "settings.view" },
    ].filter((item) => authedReq.user.permissions.includes(item.permission as Permission)),
    stats,
  });
});

app.get("/permissions", authGuard, permissionGuard("permissions.view"), (_req, res) => {
  res.json({
    permissions: ALL_PERMISSIONS,
    groups: PERMISSION_GROUPS,
    defaultsByRole: ROLE_DEFAULT_PERMISSIONS,
  });
});

app.get("/users", authGuard, permissionGuard("users.view"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  const users = (await listUsersForActor(authedReq.user)).filter((target) => canManage(authedReq.user, target)).map(sanitizeUser);
  res.json({ users });
});

app.post("/users", authGuard, permissionGuard("users.create"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  const { name, email, password, role, permissions } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    permissions?: Permission[];
  };

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "name, email, password and role are required" });
  }

  if (authedReq.user.role === "manager" && !["agent", "customer"].includes(role)) {
    return res.status(403).json({ message: "Managers can only create agents or customers" });
  }

  const nextPermissions = permissions && permissions.length > 0 ? permissions : ROLE_DEFAULT_PERMISSIONS[role];
  ensureCanGrant(authedReq.user, nextPermissions);

  if (await getUserByEmail(email)) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const timestamp = new Date().toISOString();
  const user: UserRecord = {
    id: uuid(),
    name,
    email,
    role,
    status: "active",
    managerId: authedReq.user.role === "manager" ? authedReq.user.id : null,
    createdBy: authedReq.user.id,
    passwordHash: await bcrypt.hash(password, 10),
    permissions: nextPermissions,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await createUser(user);
  await appendAudit(authedReq.user, "users.create", user.id, `Created ${role} ${email}`);
  res.status(201).json({ user: sanitizeUser(user) });
});

app.patch("/users/:id", authGuard, permissionGuard("users.edit"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  const target = await getUserById(String(req.params.id));
  if (!target || !canManage(authedReq.user, target)) {
    return res.status(404).json({ message: "User not found" });
  }

  const { name, role } = req.body as { name?: string; role?: Role };
  if (role && authedReq.user.role === "manager" && !["agent", "customer"].includes(role)) {
    return res.status(403).json({ message: "Managers can only assign agent or customer roles" });
  }

  const updated = await updateUserBasics(target.id, {
    name: name ?? target.name,
    role: role ?? target.role,
  });
  if (!updated) {
    return res.status(404).json({ message: "User not found" });
  }
  await appendAudit(authedReq.user, "users.update", target.id, `Updated user ${target.email}`);
  res.json({ user: sanitizeUser(updated) });
});

app.post("/users/:id/suspend", authGuard, permissionGuard("users.suspend"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  const target = await getUserById(String(req.params.id));
  if (!target || !canManage(authedReq.user, target)) {
    return res.status(404).json({ message: "User not found" });
  }

  const updated = await updateUserStatus(target.id, "suspended");
  if (!updated) {
    return res.status(404).json({ message: "User not found" });
  }
  await appendAudit(authedReq.user, "users.suspend", target.id, `Suspended ${target.email}`);
  res.json({ user: sanitizeUser(updated) });
});

app.post("/users/:id/ban", authGuard, permissionGuard("users.ban"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  const target = await getUserById(String(req.params.id));
  if (!target || !canManage(authedReq.user, target)) {
    return res.status(404).json({ message: "User not found" });
  }

  const updated = await updateUserStatus(target.id, "banned");
  if (!updated) {
    return res.status(404).json({ message: "User not found" });
  }
  await appendAudit(authedReq.user, "users.ban", target.id, `Banned ${target.email}`);
  res.json({ user: sanitizeUser(updated) });
});

app.get("/users/:id/permissions", authGuard, permissionGuard("permissions.view"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  const target = await getUserById(String(req.params.id));
  if (!target || !canManage(authedReq.user, target)) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ permissions: target.permissions });
});

app.patch("/users/:id/permissions", authGuard, permissionGuard("permissions.assign"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  const target = await getUserById(String(req.params.id));
  if (!target || !canManage(authedReq.user, target)) {
    return res.status(404).json({ message: "User not found" });
  }

  const { permissions } = req.body as { permissions?: Permission[] };
  if (!permissions || permissions.length === 0) {
    return res.status(400).json({ message: "permissions are required" });
  }

  ensureCanGrant(authedReq.user, permissions);
  const updated = await updateUserPermissions(target.id, permissions);
  if (!updated) {
    return res.status(404).json({ message: "User not found" });
  }
  await appendAudit(authedReq.user, "permissions.assign", target.id, `Updated permissions for ${target.email}`);
  res.json({ user: sanitizeUser(updated) });
});

app.get("/audit-logs", authGuard, permissionGuard("audit.view"), async (_req, res) => {
  res.json({ auditLogs: await listAuditLogs() });
});

app.get("/leads", authGuard, permissionGuard("leads.view"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  res.json({ leads: await listLeadsForUser(authedReq.user) });
});

app.get("/tasks", authGuard, permissionGuard("tasks.view"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  res.json({ tasks: await listTasksForUser(authedReq.user) });
});

app.get("/reports", authGuard, permissionGuard("reports.view"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  res.json({ reports: await listReportsForUser(authedReq.user) });
});

app.get("/customer-portal", authGuard, permissionGuard("customer_portal.view"), async (req, res) => {
  const authedReq = req as AuthedRequest;
  res.json({ items: await listCustomerPortalForUser(authedReq.user) });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const message = err.message || "Unexpected error";
  const status = message.startsWith("Grant ceiling exceeded") ? 400 : 500;
  res.status(status).json({ message });
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`RBAC API listening on http://localhost:${PORT}`);
    console.log(`Allowed frontend origin: ${APP_ORIGIN}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
