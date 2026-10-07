import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { AdminPrincipal, AdminTokenPayload } from "../types.js";

/**
 * Signing and verifying admin session tokens. Kept apart from the middleware so
 * the shape of a token has one definition — the login handler signs, the guard
 * verifies, and neither can drift.
 */

/** Issuer/audience pairs make a token minted here useless elsewhere. */
const ISSUER = "voltify-admin";
const AUDIENCE = "voltify-admin-console";

export function signAdminToken(admin: AdminPrincipal): string {
  const payload: AdminTokenPayload = {
    sub: admin.id,
    username: admin.username,
    role: admin.role,
  };

  return jwt.sign(payload, config.adminJwtSecret, {
    algorithm: "HS256",
    expiresIn: config.adminTokenTtl,
    issuer: ISSUER,
    audience: AUDIENCE,
  } as jwt.SignOptions);
}

export type VerifyResult =
  | { ok: true; payload: AdminTokenPayload }
  | { ok: false; reason: "missing" | "malformed" | "expired" | "invalid" };

export function verifyAdminToken(token: string): VerifyResult {
  if (!token.trim()) return { ok: false, reason: "missing" };

  try {
    const decoded = jwt.verify(token, config.adminJwtSecret, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (typeof decoded === "string" || typeof decoded.sub !== "string") {
      return { ok: false, reason: "malformed" };
    }

    return {
      ok: true,
      payload: {
        sub: decoded.sub,
        username: typeof decoded.username === "string" ? decoded.username : "",
        role: decoded.role as AdminTokenPayload["role"],
      },
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return { ok: false, reason: "expired" };
    return { ok: false, reason: "invalid" };
  }
}

/** Pulls the bearer token off the Authorization header. */
export function readBearerToken(header: string | undefined): string {
  if (!header) return "";
  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer") return "";
  return rest.join("");
}
