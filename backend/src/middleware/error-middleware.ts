import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const [firstIssue] = err.issues;
    return res.status(400).json({ message: firstIssue?.message ?? "Invalid request" });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  return res.status(500).json({ message });
}
