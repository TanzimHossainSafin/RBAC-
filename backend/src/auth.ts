import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_TTL_SECONDS, HINT_TOKEN_TTL_SECONDS, JWT_SECRET, REFRESH_TOKEN_TTL_SECONDS } from "./config.js";
import type { AuthTokenType, Permission, Role, UserRecord } from "./types.js";

type TokenUser = Pick<UserRecord, "id" | "role" | "permissions">;

export interface AccessTokenClaims extends jwt.JwtPayload {
  sub: string;
  role: Role;
  permissions: Permission[];
  sid: string;
  type: "access";
}

export interface HintTokenClaims extends jwt.JwtPayload {
  sub: string;
  role: Role;
  permissions: Permission[];
  sid: string;
  type: "hint";
}

export interface RefreshTokenClaims extends jwt.JwtPayload {
  sub: string;
  sid: string;
  type: "refresh";
}

function verifyTypedToken(token: string, expectedType: AuthTokenType) {
  const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { type?: AuthTokenType };
  if (payload.type !== expectedType) {
    throw new Error(`Unexpected token type: ${payload.type ?? "unknown"}`);
  }
  return payload;
}

export function signAccessToken(user: TokenUser, sessionId: string) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      permissions: user.permissions,
      sid: sessionId,
      type: "access",
    } satisfies AccessTokenClaims,
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
  );
}

export function signHintToken(user: TokenUser, sessionId: string) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      permissions: user.permissions,
      sid: sessionId,
      type: "hint",
    } satisfies HintTokenClaims,
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
    } satisfies RefreshTokenClaims,
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL_SECONDS },
  );
}

export function verifyAccessToken(token: string) {
  return verifyTypedToken(token, "access") as AccessTokenClaims;
}

export function verifyHintToken(token: string) {
  return verifyTypedToken(token, "hint") as HintTokenClaims;
}

export function verifyRefreshToken(token: string) {
  return verifyTypedToken(token, "refresh") as RefreshTokenClaims;
}
