import type { Request, Response } from "express";
import { assignPermissionsSchema, createUserSchema, updateUserSchema, uuidSchema } from "../schemas.js";
import type { AuthenticatedRequest } from "../types.js";
import {
  banManagedUser,
  createManagedUser,
  getManagedUserPermissions,
  listUsers,
  reactivateManagedUser,
  suspendManagedUser,
  updateManagedUser,
  updateManagedUserPermissions,
} from "../services/user-service.js";

export async function listUsersHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  return res.json({ users: await listUsers(authedReq.user) });
}

export async function createUserHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  const input = createUserSchema.parse(req.body);
  return res.status(201).json(await createManagedUser(authedReq.user, input));
}

export async function updateUserHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  const userId = uuidSchema.parse(req.params.id);
  const input = updateUserSchema.parse(req.body);
  return res.json(await updateManagedUser(authedReq.user, userId, input));
}

export async function suspendUserHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  const userId = uuidSchema.parse(req.params.id);
  return res.json(await suspendManagedUser(authedReq.user, userId));
}

export async function banUserHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  const userId = uuidSchema.parse(req.params.id);
  return res.json(await banManagedUser(authedReq.user, userId));
}

export async function reactivateUserHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  const userId = uuidSchema.parse(req.params.id);
  return res.json(await reactivateManagedUser(authedReq.user, userId));
}

export async function getUserPermissionsHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  const userId = uuidSchema.parse(req.params.id);
  return res.json(await getManagedUserPermissions(authedReq.user, userId));
}

export async function updateUserPermissionsHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  const userId = uuidSchema.parse(req.params.id);
  const input = assignPermissionsSchema.parse(req.body);
  return res.json(await updateManagedUserPermissions(authedReq.user, userId, input.permissions));
}
