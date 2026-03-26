export type Role = "admin" | "manager" | "agent" | "customer";
export type UserStatus = "active" | "suspended" | "banned";

export type Permission =
  | "dashboard.view"
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.suspend"
  | "users.ban"
  | "permissions.view"
  | "permissions.assign"
  | "leads.view"
  | "tasks.view"
  | "reports.view"
  | "audit.view"
  | "settings.view"
  | "customer_portal.view";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  managerId: string | null;
  createdBy: string | null;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface SidebarItem {
  label: string;
  href: string;
  permission: Permission;
}

export interface Stats {
  users: number;
  leads: number;
  tasks: number;
  reports: number;
}
