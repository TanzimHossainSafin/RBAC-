import type { Permission, Role } from "./types.js";

export const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "users.view",
  "users.create",
  "users.edit",
  "users.suspend",
  "users.ban",
  "permissions.view",
  "permissions.assign",
  "leads.view",
  "tasks.view",
  "reports.view",
  "audit.view",
  "settings.view",
  "customer_portal.view",
];

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [...ALL_PERMISSIONS],
  manager: [
    "dashboard.view",
    "users.view",
    "users.create",
    "users.edit",
    "users.suspend",
    "permissions.view",
    "permissions.assign",
    "leads.view",
    "tasks.view",
    "reports.view",
    "audit.view",
    "settings.view",
  ],
  agent: ["dashboard.view", "leads.view", "tasks.view", "reports.view"],
  customer: ["customer_portal.view"],
};

export const PERMISSION_GROUPS = [
  {
    label: "Workspace",
    permissions: ["dashboard.view", "leads.view", "tasks.view", "reports.view"] satisfies Permission[],
  },
  {
    label: "User Management",
    permissions: [
      "users.view",
      "users.create",
      "users.edit",
      "users.suspend",
      "users.ban",
      "permissions.view",
      "permissions.assign",
    ] satisfies Permission[],
  },
  {
    label: "Administration",
    permissions: ["audit.view", "settings.view", "customer_portal.view"] satisfies Permission[],
  },
];
