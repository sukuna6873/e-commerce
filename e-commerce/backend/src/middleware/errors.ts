import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { isProduction } from "../config.js";

/**
 * Terminal error handler. Duplicate-key errors from Mongoose's unique indexes
 * become 409s here rather than 500s — a person re-registering an address they
 * already used should see "already taken", not a server fault.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Check the highlighted fields.", fields: flatten(err) });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const fields: Record<string, string> = {};
    for (const [path, issue] of Object.entries(err.errors)) {
      fields[path] = issue.message;
    }
    res.status(400).json({ error: "Check the highlighted fields.", fields });
    return;
  }

  if (err instanceof mongoose.Error && "code" in err && err.code === 11000) {
    const keys = Object.keys((err as { keyPattern?: Record<string, unknown> }).keyPattern ?? {});
    const field = keys[0];
    res.status(409).json({
      error: field
        ? `That ${field === "email" ? "email address" : field} is already registered.`
        : "That record already exists.",
      fields: field ? { [field]: "Already taken." } : undefined,
    });
    return;
  }

  console.error("[error]", err);

  res.status(500).json({
    error: isProduction ? "Something went wrong. Please try again." : String(err),
  });
}

function flatten(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !out[field]) out[field] = issue.message;
  }
  return out;
}

/** 404 for any route the routers above did not claim. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "No such endpoint." });
}
