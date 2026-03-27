import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest, Permission } from "../types.js";

export function permissionGuard(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authedReq = req as AuthenticatedRequest;
    if (!authedReq.user.permissions.includes(permission)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
