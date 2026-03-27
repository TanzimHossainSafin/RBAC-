import { HttpError } from "./http-error.js";

const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 5 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

export function assertLoginAllowed(key: string) {
  const attempt = loginAttempts.get(key);
  if (attempt?.lockedUntil && attempt.lockedUntil > Date.now()) {
    throw new HttpError(429, "Too many attempts. Please try again shortly.");
  }
}

export function recordFailedLogin(key: string) {
  const attempt = loginAttempts.get(key);
  const nextCount = (attempt?.count ?? 0) + 1;
  loginAttempts.set(key, {
    count: nextCount,
    lockedUntil: nextCount >= MAX_ATTEMPTS ? Date.now() + LOCK_WINDOW_MS : undefined,
  });
}

export function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}
