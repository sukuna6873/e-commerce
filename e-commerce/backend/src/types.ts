import type { Request } from "express";

/** The subset of an admin document that is ever sent to the browser. */
export interface AdminPrincipal {
  id: string;
  email: string;
  username: string;
  role: "superadmin" | "admin" | "moderator";
  permissions: string[];
}

/** Payload carried by a signed admin session token. */
export interface AdminTokenPayload {
  sub: string;
  username: string;
  role: AdminPrincipal["role"];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminPrincipal;
    }
  }
}

export interface AdminSessionResponse {
  token: string;
  admin: AdminPrincipal;
  /** Sent once so a freshly registered account can be shown its own state. */
  isNewAccount?: boolean;
}

export type AdminRequest = Request;
