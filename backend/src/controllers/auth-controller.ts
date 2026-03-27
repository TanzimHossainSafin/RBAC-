import type { Request, Response } from "express";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from "../schemas.js";
import type { AuthenticatedRequest } from "../types.js";
import { clearAuthCookies, writeAuthCookies } from "../utils/auth-cookies.js";
import { loginUser, logoutUser, refreshUserSession, requestPasswordReset, resetPassword, signupUser } from "../services/auth-service.js";

export async function loginHandler(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input, req.ip);
  writeAuthCookies(res, result.user, result.session, result.refreshToken);
  return res.json({
    accessToken: result.accessToken,
    user: result.user,
    demoCredentials: result.demoCredentials,
  });
}

export async function signupHandler(req: Request, res: Response) {
  const input = signupSchema.parse(req.body);
  const result = await signupUser(input);
  return res.status(201).json(result);
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const input = forgotPasswordSchema.parse(req.body);
  return res.json(await requestPasswordReset(input));
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const input = resetPasswordSchema.parse(req.body);
  const result = await resetPassword(input);
  clearAuthCookies(res);
  return res.json(result);
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const result = await refreshUserSession(req.cookies.refresh_token as string | undefined);
    writeAuthCookies(res, result.user, result.session, result.refreshToken);
    return res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    clearAuthCookies(res);
    throw error;
  }
}

export async function logoutHandler(req: Request, res: Response) {
  const authedReq = req as AuthenticatedRequest;
  const result = await logoutUser(authedReq.user, authedReq.sessionId);
  clearAuthCookies(res);
  return res.json(result);
}
