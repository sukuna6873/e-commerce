import type { NextFunction, Request, Response } from "express";
import { Admin } from "../models/index.js";
import { readBearerToken, verifyAdminToken } from "../auth/tokens.js";
import type { AdminPrincipal } from "../types.js";

/**
 * Admin session guard.
 *
 * A valid signature is not enough on its own: the token could be one of a
 * deleted admin's, or belong to an account deactivated since it was issued. The
 * document is re-read on every request so deactivation takes effect at once
 * instead of at the next token expiry.
 */

function toPrincipal(doc: {
  _id: { toString(): string };
  email: string;
  username: string;
  role: AdminPrincipal["role"];
  permissions: string[];
}): AdminPrincipal {
  return {
    id: doc._id.toString(),
    email: doc.email,
    username: doc.username,
    role: doc.role,
    permissions: doc.permissions ?? [],
  };
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = readBearerToken(req.headers.authorization);
  const result = verifyAdminToken(token);

  if (!result.ok) {
    res.status(401).json({
      error:
        result.reason === "expired"
          ? "Your admin session has expired. Please sign in again."
          : "Sign in to continue.",
      code: result.reason,
    });
    return;
  }

  const admin = await Admin.findById(result.payload.sub);

  if (!admin) {
    res.status(401).json({ error: "This admin account no longer exists.", code: "invalid" });
    return;
  }

  if (!admin.isActive) {
    res.status(403).json({ error: "This admin account has been deactivated.", code: "inactive" });
    return;
  }

  req.admin = toPrincipal(admin);
  next();
}

/** Narrows a route to admins holding a given permission. */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ error: "Sign in to continue.", code: "missing" });
      return;
    }

    // Superadmin is the escape hatch for anything not explicitly delegated.
    const allowed = admin.role === "superadmin" || admin.permissions.includes(permission);
    if (!allowed) {
      res.status(403).json({
        error: `Your role does not include the "${permission}" permission.`,
        code: "forbidden",
      });
      return;
    }

    next();
  };
}
