export const PORT = Number(process.env.PORT ?? 4000);
export const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3000";
export const JWT_SECRET = process.env.JWT_SECRET ?? "rbac-demo-secret";
export const DATABASE_URL = process.env.DATABASE_URL;
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
export const HINT_TOKEN_TTL_SECONDS = ACCESS_TOKEN_TTL_SECONDS;
