import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import {
  createUser,
  getUserByEmail,
  getUserById,
  listUsersForActor,
  updateUserBasics,
  updateUserPermissions,
  updateUserStatus,
} from "../db.js";
import type { Permission, Role, SafeUser, UserRecord } from "../types.js";
import { HttpError } from "../utils/http-error.js";
import {
  assertCreatableRole,
  canManageUser,
  defaultPermissionsForRole,
  ensureCanGrantPermissions,
  normalizePermissions,
  sanitizeUser,
} from "../utils/rbac.js";
import { appendAudit } from "./audit-service.js";

async function findManager(managerId: string) {
  const manager = await getUserById(managerId);
  if (!manager || manager.role !== "manager") {
    throw new HttpError(400, "Assigned manager must be an existing manager");
  }
  return manager;
}

async function resolveManagerId(actor: UserRecord, role: Role, managerId: string | null | undefined, currentManagerId?: string | null) {
  if (role === "admin" || role === "manager") {
    return null;
  }

  if (actor.role === "manager") {
    return actor.id;
  }

  if (managerId === undefined) {
    return currentManagerId ?? null;
  }

  if (managerId === null) {
    return null;
  }

  await findManager(managerId);
  return managerId;
}

async function getManageableTarget(actor: UserRecord, userId: string) {
  const target = await getUserById(userId);
  if (!target || !canManageUser(actor, target)) {
    throw new HttpError(404, "User not found");
  }
  return target;
}

export async function listUsers(actor: UserRecord): Promise<SafeUser[]> {
  const users = await listUsersForActor(actor);
  return users.filter((target) => canManageUser(actor, target)).map(sanitizeUser);
}

export async function createManagedUser(
  actor: UserRecord,
  input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    managerId?: string | null;
    permissions?: Permission[];
  },
) {
  assertCreatableRole(actor, input.role);

  const email = input.email.toLowerCase();
  if (await getUserByEmail(email)) {
    throw new HttpError(409, "Email already exists");
  }

  const nextPermissions = normalizePermissions(input.permissions?.length ? input.permissions : defaultPermissionsForRole(input.role));
  ensureCanGrantPermissions(actor, nextPermissions);

  const managerId = await resolveManagerId(actor, input.role, input.managerId);
  const timestamp = new Date().toISOString();
  const user: UserRecord = {
    id: uuid(),
    name: input.name,
    email,
    role: input.role,
    status: "active",
    managerId,
    createdBy: actor.id,
    passwordHash: await bcrypt.hash(input.password, 10),
    permissions: nextPermissions,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await createUser(user);
  await appendAudit(actor, "users.create", user.id, `Created ${input.role} ${email}`);
  return { user: sanitizeUser(user) };
}

export async function updateManagedUser(
  actor: UserRecord,
  userId: string,
  input: { name?: string; role?: Role; managerId?: string | null },
) {
  const target = await getManageableTarget(actor, userId);
  const nextRole = input.role ?? target.role;
  assertCreatableRole(actor, nextRole);

  const managerId = await resolveManagerId(actor, nextRole, input.managerId, target.managerId);
  const updated = await updateUserBasics(target.id, {
    name: input.name ?? target.name,
    role: nextRole,
    managerId,
  });

  if (!updated) {
    throw new HttpError(404, "User not found");
  }

  await appendAudit(actor, "users.update", target.id, `Updated user ${target.email}`);
  return { user: sanitizeUser(updated) };
}

async function updateManagedUserStatus(actor: UserRecord, userId: string, status: UserRecord["status"], action: string, detail: string) {
  const target = await getManageableTarget(actor, userId);
  const updated = await updateUserStatus(target.id, status);
  if (!updated) {
    throw new HttpError(404, "User not found");
  }
  await appendAudit(actor, action, target.id, `${detail} ${target.email}`);
  return { user: sanitizeUser(updated) };
}

export async function suspendManagedUser(actor: UserRecord, userId: string) {
  return updateManagedUserStatus(actor, userId, "suspended", "users.suspend", "Suspended");
}

export async function banManagedUser(actor: UserRecord, userId: string) {
  return updateManagedUserStatus(actor, userId, "banned", "users.ban", "Banned");
}

export async function reactivateManagedUser(actor: UserRecord, userId: string) {
  const target = await getManageableTarget(actor, userId);
  if (target.status === "active") {
    throw new HttpError(400, "User is already active");
  }

  const updated = await updateUserStatus(target.id, "active");
  if (!updated) {
    throw new HttpError(404, "User not found");
  }

  await appendAudit(actor, "users.reactivate", target.id, `Reactivated ${target.email}`);
  return { user: sanitizeUser(updated) };
}

export async function getManagedUserPermissions(actor: UserRecord, userId: string) {
  const target = await getManageableTarget(actor, userId);
  return { permissions: target.permissions };
}

export async function updateManagedUserPermissions(actor: UserRecord, userId: string, permissions: Permission[]) {
  const target = await getManageableTarget(actor, userId);
  const nextPermissions = normalizePermissions(permissions);
  ensureCanGrantPermissions(actor, nextPermissions);

  const updated = await updateUserPermissions(target.id, nextPermissions);
  if (!updated) {
    throw new HttpError(404, "User not found");
  }

  await appendAudit(actor, "permissions.assign", target.id, `Updated permissions for ${target.email}`);
  return { user: sanitizeUser(updated) };
}
