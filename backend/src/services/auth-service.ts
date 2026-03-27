import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import {
  createPasswordResetToken,
  createSession,
  createUser,
  getPasswordResetToken,
  getSessionByToken,
  getUserByEmail,
  getUserById,
  markPasswordResetTokenUsed,
  revokeAllSessionsForUser,
  revokeSession,
  updateUserPassword,
} from "../db.js";
import { REFRESH_TOKEN_TTL_SECONDS } from "../config.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../auth.js";
import { ROLE_DEFAULT_PERMISSIONS } from "../permissions.js";
import type { SessionRecord, UserRecord } from "../types.js";
import { clearLoginAttempts, recordFailedLogin, assertLoginAllowed } from "../utils/login-attempts.js";
import { HttpError } from "../utils/http-error.js";
import { sanitizeUser } from "../utils/rbac.js";
import { appendAudit } from "./audit-service.js";

const demoCredentials = {
  admin: { email: "admin@obliq.app", password: "Admin123!" },
  manager: { email: "manager@obliq.app", password: "Manager123!" },
  agent: { email: "agent@obliq.app", password: "Agent123!" },
  customer: { email: "customer@obliq.app", password: "Customer123!" },
};

function assertUserCanAuthenticate(user: UserRecord) {
  if (user.status === "suspended") {
    throw new HttpError(403, "User is suspended");
  }

  if (user.status === "banned") {
    throw new HttpError(403, "User is banned");
  }
}

export async function loginUser(input: { email: string; password: string; rememberMe?: boolean }, ipAddress: string | undefined) {
  const email = input.email.toLowerCase();
  const key = `${ipAddress ?? "unknown"}:${email}`;
  assertLoginAllowed(key);

  const user = await getUserByEmail(email);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    recordFailedLogin(key);
    throw new HttpError(401, "Invalid credentials");
  }

  assertUserCanAuthenticate(user);
  clearLoginAttempts(key);

  const sessionId = uuid();
  const refreshToken = signRefreshToken(sessionId, user.id);
  const session: SessionRecord = {
    id: sessionId,
    userId: user.id,
    refreshToken,
    rememberMe: input.rememberMe ?? true,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
    revokedAt: null,
    createdAt: new Date().toISOString(),
  };

  await createSession(session);

  return {
    accessToken: signAccessToken(user, sessionId),
    refreshToken,
    session,
    user: sanitizeUser(user),
    demoCredentials,
  };
}

export async function signupUser(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase();

  if (await getUserByEmail(email)) {
    throw new HttpError(409, "Email already exists");
  }

  const timestamp = new Date().toISOString();
  const user: UserRecord = {
    id: uuid(),
    name: input.name,
    email,
    role: "customer",
    status: "active",
    managerId: null,
    createdBy: null,
    passwordHash: await bcrypt.hash(input.password, 10),
    permissions: ROLE_DEFAULT_PERMISSIONS.customer,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await createUser(user);
  await appendAudit(user, "auth.signup", user.id, `Public signup for ${email}`);
  return { message: "Account created. You can now sign in." };
}

export async function requestPasswordReset(input: { email: string }) {
  const email = input.email.toLowerCase();
  const user = await getUserByEmail(email);

  if (!user) {
    return { message: "If the account exists, a reset token has been generated." };
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

  return {
    message: "Password reset token generated.",
    resetToken: token,
  };
}

export async function resetPassword(input: { email: string; token: string; newPassword: string }) {
  const email = input.email.toLowerCase();
  const user = await getUserByEmail(email);
  const resetToken = await getPasswordResetToken(input.token);

  if (
    !user ||
    !resetToken ||
    resetToken.userId !== user.id ||
    resetToken.usedAt ||
    new Date(resetToken.expiresAt).getTime() < Date.now()
  ) {
    throw new HttpError(400, "Invalid or expired reset token");
  }

  await updateUserPassword(user.id, await bcrypt.hash(input.newPassword, 10));
  await markPasswordResetTokenUsed(resetToken.id);
  await revokeAllSessionsForUser(user.id);
  await appendAudit(user, "auth.reset_password", user.id, `Password reset completed for ${email}`);
  return { message: "Password updated. Please sign in again." };
}

export async function refreshUserSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new HttpError(401, "Missing refresh token");
  }

  const payload = verifyRefreshToken(refreshToken);
  const session = await getSessionByToken(refreshToken);
  const user = await getUserById(payload.sub);

  if (!session || !user || session.id !== payload.sid || session.revokedAt || new Date(session.expiresAt).getTime() < Date.now()) {
    throw new HttpError(401, "Refresh token expired");
  }

  assertUserCanAuthenticate(user);

  return {
    accessToken: signAccessToken(user, session.id),
    refreshToken,
    session,
    user: sanitizeUser(user),
  };
}

export async function logoutUser(user: UserRecord, sessionId: string) {
  await revokeSession(sessionId);
  await appendAudit(user, "auth.logout", user.id, "User logged out");
  return { ok: true };
}
