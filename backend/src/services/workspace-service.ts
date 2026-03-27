import {
  getCountsForUser,
  listAuditLogsForUser,
  listCustomerPortalForUser,
  listLeadsForUser,
  listReportsForUser,
  listTasksForUser,
} from "../db.js";
import { ALL_PERMISSIONS, PERMISSION_GROUPS, ROLE_DEFAULT_PERMISSIONS } from "../permissions.js";
import type { UserRecord } from "../types.js";
import { buildSidebar, sanitizeUser } from "../utils/rbac.js";

export async function getWorkspace(user: UserRecord) {
  const stats = await getCountsForUser(user);
  return {
    user: sanitizeUser(user),
    sidebar: buildSidebar(user),
    stats,
  };
}

export function getPermissionCatalog() {
  return {
    permissions: ALL_PERMISSIONS,
    groups: PERMISSION_GROUPS,
    defaultsByRole: ROLE_DEFAULT_PERMISSIONS,
  };
}

export async function getAuditLogs(user: UserRecord) {
  return { logs: await listAuditLogsForUser(user) };
}

export async function getLeads(user: UserRecord) {
  return { leads: await listLeadsForUser(user) };
}

export async function getTasks(user: UserRecord) {
  return { tasks: await listTasksForUser(user) };
}

export async function getReports(user: UserRecord) {
  return { reports: await listReportsForUser(user) };
}

export async function getCustomerPortal(user: UserRecord) {
  return { items: await listCustomerPortalForUser(user) };
}
