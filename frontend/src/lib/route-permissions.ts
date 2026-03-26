import type { Permission } from "./types";

export const routePermissions: Record<string, Permission> = {
  "/dashboard": "dashboard.view",
  "/users": "users.view",
  "/leads": "leads.view",
  "/tasks": "tasks.view",
  "/reports": "reports.view",
  "/audit-log": "audit.view",
  "/customer-portal": "customer_portal.view",
  "/settings": "settings.view",
};

export const defaultSidebarOrder = [
  "/dashboard",
  "/users",
  "/leads",
  "/tasks",
  "/reports",
  "/audit-log",
  "/customer-portal",
  "/settings",
];
