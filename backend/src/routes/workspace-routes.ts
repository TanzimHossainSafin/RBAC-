import { Router } from "express";
import {
  auditLogsHandler,
  customerPortalHandler,
  healthHandler,
  leadsHandler,
  meHandler,
  permissionsHandler,
  reportsHandler,
  tasksHandler,
} from "../controllers/workspace-controller.js";
import { authGuard } from "../middleware/auth-middleware.js";
import { permissionGuard } from "../middleware/permission-middleware.js";

export const workspaceRouter = Router();

workspaceRouter.get("/health", healthHandler);
workspaceRouter.get("/me", authGuard, meHandler);
workspaceRouter.get("/permissions", authGuard, permissionGuard("permissions.view"), permissionsHandler);
workspaceRouter.get("/audit-logs", authGuard, permissionGuard("audit.view"), auditLogsHandler);
workspaceRouter.get("/leads", authGuard, permissionGuard("leads.view"), leadsHandler);
workspaceRouter.get("/tasks", authGuard, permissionGuard("tasks.view"), tasksHandler);
workspaceRouter.get("/reports", authGuard, permissionGuard("reports.view"), reportsHandler);
workspaceRouter.get("/customer-portal", authGuard, permissionGuard("customer_portal.view"), customerPortalHandler);
