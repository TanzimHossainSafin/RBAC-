import { ROLE_DEFAULT_PERMISSIONS } from "../permissions.js";
import type { Permission, Role, SafeUser, SidebarItem, UserRecord } from "../types.js";
import { HttpError } from "./http-error.js";

export const WORKSPACE_SIDEBAR: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", permission: "dashboard.view" },
  { label: "Users", href: "/users", permission: "users.view" },
  { label: "Leads", href: "/leads", permission: "leads.view" },
  { label: "Tasks", href: "/tasks", permission: "tasks.view" },
  { label: "Reports", href: "/reports", permission: "reports.view" },
  { label: "Audit Log", href: "/audit-log", permission: "audit.view" },
  { label: "Customer Portal", href: "/customer-portal", permission: "customer_portal.view" },
  { label: "Settings", href: "/settings", permission: "settings.view" },
];

export function sanitizeUser(user: UserRecord): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function buildSidebar(user: Pick<UserRecord, "permissions">) {
  return WORKSPACE_SIDEBAR.filter((item) => user.permissions.includes(item.permission));
}

export function canManageUser(actor: UserRecord, target: UserRecord) {
  if (actor.role === "admin") return true;
  if (actor.role !== "manager") return actor.id === target.id;
  if (target.role === "admin" || target.role === "manager") return actor.id === target.id;
  return target.managerId === actor.id || target.createdBy === actor.id || target.id === actor.id;
}

export function ensureCanGrantPermissions(actor: UserRecord, nextPermissions: Permission[]) {
  const missing = nextPermissions.filter((permission) => !actor.permissions.includes(permission));
  if (missing.length > 0) {
    throw new HttpError(400, `Grant ceiling exceeded. Missing permissions: ${missing.join(", ")}`);
  }
}

export function assertCreatableRole(actor: UserRecord, role: Role) {
  if (actor.role === "manager" && !["agent", "customer"].includes(role)) {
    throw new HttpError(403, "Managers can only create or assign agent and customer roles");
  }
}

export function normalizePermissions(permissions: Permission[]) {
  return [...new Set(permissions)];
}

export function defaultPermissionsForRole(role: Role) {
  return [...ROLE_DEFAULT_PERMISSIONS[role]];
}
