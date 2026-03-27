import type { Response } from "express";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "../config.js";
import { signHintToken } from "../auth.js";
import type { SessionRecord, UserRecord } from "../types.js";

type CookieUser = Pick<UserRecord, "id" | "role" | "permissions">;

export function writeAuthCookies(
  res: Response,
  user: CookieUser,
  session: Pick<SessionRecord, "id" | "rememberMe">,
  refreshToken: string,
) {
  const secure = process.env.NODE_ENV === "production";
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
  };

  res.cookie(
    "refresh_token",
    refreshToken,
    session.rememberMe ? { ...baseOptions, maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000 } : baseOptions,
  );

  res.cookie(
    "rbac_hint",
    signHintToken(user, session.id),
    session.rememberMe ? { ...baseOptions, maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000 } : baseOptions,
  );
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("refresh_token", { path: "/" });
  res.clearCookie("rbac_hint", { path: "/" });
}
