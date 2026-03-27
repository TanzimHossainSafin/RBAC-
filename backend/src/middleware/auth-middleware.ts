import type { NextFunction, Request, Response } from "express";
import { getSessionById, getUserById } from "../db.js";
import { verifyAccessToken } from "../auth.js";
import type { AuthenticatedRequest } from "../types.js";

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyAccessToken(token);
    const user = await getUserById(payload.sub);
    const session = await getSessionById(payload.sid);

    if (!user || !session || session.userId !== user.id || session.revokedAt) {
      return res.status(401).json({ message: "Session expired" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "User suspended" });
    }

    if (user.status === "banned") {
      return res.status(403).json({ message: "User banned" });
    }

    const authedReq = req as AuthenticatedRequest;
    authedReq.user = user;
    authedReq.sessionId = session.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid access token" });
  }
}
