import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types.js";
import {
  getAuditLogs,
  getCustomerPortal,
  getLeads,
  getPermissionCatalog,
  getReports,
  getTasks,
  getWorkspace,
} from "../services/workspace-service.js";

export function healthHandler(_req: Request, res: Response) {
  return res.json({ ok: true });
}

export async function meHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  return res.json(await getWorkspace(authedReq.user));
}

export function permissionsHandler(_req: Request, res: Response) {
  return res.json(getPermissionCatalog());
}

export async function auditLogsHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  return res.json(await getAuditLogs(authedReq.user));
}

export async function leadsHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  return res.json(await getLeads(authedReq.user));
}

export async function tasksHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  return res.json(await getTasks(authedReq.user));
}

export async function reportsHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  return res.json(await getReports(authedReq.user));
}

export async function customerPortalHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  return res.json(await getCustomerPortal(authedReq.user));
}
