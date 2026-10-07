import "dotenv/config";

/**
 * Environment configuration, read once at import time.
 *
 * Anything secret is required rather than defaulted: an admin server that boots
 * with a fallback signing key would accept tokens anyone could forge. The
 * compose file supplies these; `.env` covers a bare `npm run dev`.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in backend/.env or in the docker-compose service definition.`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: int("PORT", 3001),

  mongoUri: required("MONGODB_URI"),
  adminJwtSecret: required("ADMIN_JWT_SECRET"),
  /** Admin sessions last a working shift, not a week. */
  adminTokenTtl: optional("ADMIN_TOKEN_TTL", "8h"),

  /** Origins allowed to send credentialed admin requests. */
  adminOrigins: optional("ADMIN_ORIGIN", "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
} as const;

export const isProduction = config.nodeEnv === "production";

/** Strips the credentials out of a mongodb:// URI so it is safe to log. */
export function redactMongoUri(uri: string): string {
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:****@");
}
