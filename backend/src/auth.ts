import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_TTL_SECONDS, HINT_TOKEN_TTL_SECONDS, JWT_SECRET, REFRESH_TOKEN_TTL_SECONDS } from "./config.js";
import type { Permission, UserRecord } from "./types.js";

interface AuthClaims {
  sub: string;
  role: UserRecord["role"];
  permissions: Permission[];
  sid: string;
  type: "access" | "hint";
}

export function signAccessToken(user: UserRecord, sessionId: string) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      permissions: user.permissions,
      sid: sessionId,
      type: "access",
    } satisfies AuthClaims,
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
  );
}

export function signHintToken(user: UserRecord, sessionId: string) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      permissions: user.permissions,
      sid: sessionId,
      type: "hint",
    } satisfies AuthClaims,
    JWT_SECRET,
    { expiresIn: HINT_TOKEN_TTL_SECONDS },
  );
}

export function signRefreshToken(sessionId: string, userId: string) {
  return jwt.sign(
    {
      sub: userId,
      sid: sessionId,
      type: "refresh",
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL_SECONDS },
  );
}

export function verifyJwt(token: string) {
  return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
}
