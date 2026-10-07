import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { Admin } from "../models/index.js";
import { signAdminToken } from "../auth/tokens.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { AdminPrincipal, AdminSessionResponse } from "../types.js";

/**
 * Admin registration and sign-in.
 *
 * Registration is open, but a self-registered account is deliberately weak: it
 * always lands as a `moderator` with the read-only permission set. Anything
 * stronger has to be granted in the database by an existing superadmin, so a
 * stranger who reaches the register page cannot hand themselves the store.
 */

const router = Router();

const BCRYPT_ROUNDS = 12;

/** What a brand-new moderator is allowed to touch. */
const DEFAULT_PERMISSIONS = ["dashboard:read", "orders:read", "products:read"];

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "That password is too long.");

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  username: z
    .string()
    .trim()
    .min(3, "Usernames are at least 3 characters.")
    .max(30, "Usernames are at most 30 characters.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores only."),
  password: passwordSchema,
  confirmPassword: z.string(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

/**
 * Flattens a ZodError into `{ field: message }` so the form can show each
 * message under the input it belongs to instead of one opaque banner.
 */
function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !out[field]) out[field] = issue.message;
  }
  return out;
}

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

// ── POST /api/admin/register ──────────────────────────────────────────────

router.post(
  "/register",
  asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the highlighted fields.", fields: fieldErrors(parsed.error) });
    return;
  }

  const { email, username, password, confirmPassword } = parsed.data;

  if (password !== confirmPassword) {
    res.status(400).json({
      error: "Check the highlighted fields.",
      fields: { confirmPassword: "Passwords do not match." },
    });
    return;
  }

  const clash = await Admin.findOne({
    $or: [{ email }, { username: new RegExp(`^${escapeRegex(username)}$`, "i") }],
  })
    .select("email username")
    .lean();

  if (clash) {
    // The same reply for both fields, so this cannot be used to discover which
    // emails or usernames are already registered.
    res.status(409).json({
      error: "That email or username is already registered.",
      fields: { email: "That email or username is already registered." },
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const created = await Admin.create({
    email,
    username,
    passwordHash,
    role: "moderator",
    permissions: DEFAULT_PERMISSIONS,
    isActive: true,
  });

  const principal = toPrincipal(created);
  const body: AdminSessionResponse = {
    token: signAdminToken(principal),
    admin: principal,
    isNewAccount: true,
  };

  res.status(201).json(body);
  }),
);

// ── POST /api/admin/login ─────────────────────────────────────────────────

router.post(
  "/login",
  asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter your email and password.", fields: fieldErrors(parsed.error) });
    return;
  }

  const { email, password } = parsed.data;
  const admin = await Admin.findOne({ email });

  // Hash a throwaway value when the account is missing so that a wrong email
  // and a wrong password take a comparable amount of time to answer.
  const passwordHash = admin?.passwordHash ?? DUMMY_HASH;
  const matches = await bcrypt.compare(password, passwordHash);

  if (!admin || !matches) {
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  if (!admin.isActive) {
    res.status(403).json({ error: "This admin account has been deactivated." });
    return;
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const principal = toPrincipal(admin);
  const body: AdminSessionResponse = { token: signAdminToken(principal), admin: principal };

  res.json(body);
  }),
);

// ── GET /api/admin/me ─────────────────────────────────────────────────────

router.get(
  "/me",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ admin: req.admin });
  }),
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A real bcrypt hash of a value nobody will submit. Compared against when no
 * account matches, so a wrong email costs the same time as a wrong password.
 */
const DUMMY_HASH = "$2b$12$Vb.EMgz.9Pk/4bhBx1RIT.tZjPfiPI7MYHqpjsdqlhKqNOT2TFoJm";

export { router as adminAuthRouter };
