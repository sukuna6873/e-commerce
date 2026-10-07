/**
 * Admin auth client.
 *
 * Talks to the Express admin API rather than the mock layer in `api.ts`, so
 * these are real network calls with real failure modes. The bearer token lives
 * in localStorage under its own namespace, kept apart from the shopper session
 * so signing in as an admin never disturbs a customer who is mid-checkout.
 */

import { NS, clear, read, write } from "../lib/storage";

export type AdminRole = "superadmin" | "admin" | "moderator";

export interface AdminAccount {
  id: string;
  email: string;
  username: string;
  role: AdminRole;
  permissions: string[];
}

export interface AdminSession {
  token: string;
  admin: AdminAccount;
}

/** Base URL; empty string so requests hit the Vite proxy in dev. */
const BASE = import.meta.env.VITE_API_URL ?? "";

export interface FieldErrors {
  [field: string]: string | undefined;
}

/** Normalises the several failure shapes fetch can produce into one Error. */
export class AdminApiError extends Error {
  status: number;
  fields: FieldErrors;

  constructor(message: string, status: number, fields: FieldErrors = {}) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.fields = fields;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** Set false for register/login, which are what mint the token. */
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const token = readAdminToken();
    if (!token) throw new AdminApiError("Sign in to continue.", 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}/api/admin${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects on a transport failure — the server being down is the
    // common case here, and "check your connection" beats "unknown error".
    throw new AdminApiError(
      "Could not reach the admin server. Is the backend running?",
      0,
    );
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    throw new AdminApiError(
      typeof payload.error === "string" ? payload.error : `Request failed (${response.status}).`,
      response.status,
      (payload.fields as FieldErrors) ?? {},
    );
  }

  return payload as T;
}

// ── Token storage ──────────────────────────────────────────────────────────

export function readAdminToken(): string | null {
  return readAdminSession()?.token ?? null;
}

export function readAdminSession(): AdminSession | null {
  const raw = read<AdminSession | null>(NS.adminSession, null);
  if (!raw?.token || !raw.admin) return null;
  return raw;
}

export function writeAdminSession(session: AdminSession): void {
  write(NS.adminSession, session);
}

export function clearAdminSession(): void {
  clear(NS.adminSession);
}

// ── Endpoints ──────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerAdmin(input: RegisterInput): Promise<AdminSession> {
  return request<AdminSession>("/register", { method: "POST", body: input, auth: false });
}

export async function loginAdmin(input: LoginInput): Promise<AdminSession> {
  return request<AdminSession>("/login", { method: "POST", body: input, auth: false });
}

/**
 * Confirms a stored token is still good. A token that expired while the tab sat
 * open would otherwise be treated as a live session until the first write.
 */
export async function fetchCurrentAdmin(): Promise<AdminAccount> {
  const { admin } = await request<{ admin: AdminAccount }>("/me");
  return admin;
}
