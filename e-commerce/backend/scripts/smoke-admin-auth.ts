/**
 * End-to-end smoke test for the admin auth API.
 *
 * Boots a throwaway in-memory MongoDB and the real Express app against it, then
 * drives the endpoints the way the frontend does. Run with:
 *   npx tsx scripts/smoke-admin-auth.ts
 *
 * This is a script, not a test-suite run — there is no test runner configured in
 * this project — so it asserts via a small helper and exits non-zero on failure.
 */

process.env.MONGODB_URI = "placeholder";
process.env.ADMIN_JWT_SECRET = "smoke-test-secret-not-used-anywhere-real";

import assert from "node:assert/strict";
import type { Server } from "node:http";
import { MongoMemoryServer } from "mongodb-memory-server";

const BASE = "http://127.0.0.1:3999";

let passed = 0;
let failed = 0;

async function check(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL ${name}`);
    console.error(`       ${err instanceof Error ? err.message : String(err)}`);
  }
}

interface ApiResponse<T = Record<string, unknown>> {
  status: number;
  body: T;
}

async function call<T = Record<string, unknown>>(
  path: string,
  init: { method?: string; body?: unknown; token?: string } = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const text = await res.text();
  return {
    status: res.status,
    body: (text ? JSON.parse(text) : {}) as T,
  };
}

const REGISTER = {
  email: "sam@voltify.com",
  username: "sam.okafor",
  password: "Correct-Horse-9",
  confirmPassword: "Correct-Horse-9",
};

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("ecommerce");

  const { default: mongoose } = await import("mongoose");
  const { connectDatabase } = await import("../src/db.js");
  await connectDatabase();

  const { Admin } = await import("../src/models/index.js");
  const { createApp } = await import("../src/app.js");

  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(3999, "127.0.0.1", () => resolve(s));
  });

  console.log("\nadmin auth smoke test\n");

  let token = "";
  let adminId = "";

  await check("register creates a moderator and returns a token", async () => {
    const res = await call("/api/admin/register", { method: "POST", body: REGISTER });
    assert.equal(res.status, 201);
    assert.equal(res.body.admin.role, "moderator");
    assert.equal(res.body.admin.username, "sam.okafor");
    assert.ok(res.body.token, "expected a token");
    token = res.body.token as string;
    adminId = res.body.admin.id as string;
  });

  await check("password is stored as a bcrypt hash, never plaintext", async () => {
    const doc = await Admin.findById(adminId).lean();
    assert.ok(doc, "admin document not found");
    assert.notEqual(doc!.passwordHash, REGISTER.password);
    assert.match(doc!.passwordHash, /^\$2[aby]\$/, "not a bcrypt hash");
    assert.ok(!JSON.stringify(doc).includes(REGISTER.password), "plaintext leaked into document");
  });

  await check("register rejects a weak password", async () => {
    const res = await call("/api/admin/register", {
      method: "POST",
      body: { ...REGISTER, email: "weak@voltify.com", username: "weak.user", password: "short", confirmPassword: "short" },
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.fields.password, "expected a password field error");
  });

  await check("register rejects mismatched confirmation", async () => {
    const res = await call("/api/admin/register", {
      method: "POST",
      body: { ...REGISTER, email: "mm@voltify.com", username: "mm.user", confirmPassword: "Different-9" },
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.fields.confirmPassword);
  });

  await check("register rejects a duplicate email", async () => {
    const res = await call("/api/admin/register", {
      method: "POST",
      body: { ...REGISTER, username: "different.name" },
    });
    assert.equal(res.status, 409);
  });

  await check("login succeeds with the right password", async () => {
    const res = await call("/api/admin/login", {
      method: "POST",
      body: { email: REGISTER.email, password: REGISTER.password },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.admin.username, "sam.okafor");
    assert.ok(res.body.token);
  });

  await check("login is case-insensitive on the email", async () => {
    const res = await call("/api/admin/login", {
      method: "POST",
      body: { email: "SAM@VOLTIFY.COM", password: REGISTER.password },
    });
    assert.equal(res.status, 200);
  });

  await check("login rejects a wrong password", async () => {
    const res = await call("/api/admin/login", {
      method: "POST",
      body: { email: REGISTER.email, password: "Wrong-Password-9" },
    });
    assert.equal(res.status, 401);
  });

  await check("login for an unknown email is 401, not 500", async () => {
    const res = await call("/api/admin/login", {
      method: "POST",
      body: { email: "nobody@voltify.com", password: "Whatever-9" },
    });
    assert.equal(res.status, 401);
  });

  await check("/me returns the admin for a valid token", async () => {
    const res = await call("/api/admin/me", { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.admin.email, REGISTER.email);
  });

  await check("/me rejects a request with no token", async () => {
    const res = await call("/api/admin/me");
    assert.equal(res.status, 401);
  });

  await check("/me rejects a forged token", async () => {
    const forged = token.slice(0, -4) + "AAAA";
    const res = await call("/api/admin/me", { token: forged });
    assert.equal(res.status, 401);
  });

  await check("a token signed with the wrong secret is rejected", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const forged = jwt.sign({ sub: adminId, username: "sam.okafor", role: "superadmin" }, "some-other-secret", {
      algorithm: "HS256",
      issuer: "voltify-admin",
      audience: "voltify-admin-console",
    });
    const res = await call("/api/admin/me", { token: forged });
    assert.equal(res.status, 401, "a foreign-signed token was accepted");
  });

  await check("a deactivated account is refused even with a valid token", async () => {
    await Admin.updateOne({ _id: adminId }, { $set: { isActive: false } });
    const res = await call("/api/admin/me", { token });
    assert.equal(res.status, 403);
    await Admin.updateOne({ _id: adminId }, { $set: { isActive: true } });
  });

  await check("login records lastLoginAt", async () => {
    const before = await Admin.findById(adminId).lean();
    assert.ok(before!.lastLoginAt, "expected lastLoginAt to be set");
  });

  await check("unknown route returns 404 json", async () => {
    const res = await call("/api/admin/nope");
    assert.equal(res.status, 404);
  });

  await check("health endpoint responds", async () => {
    const res = await call("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  server.close();
  await mongoose.disconnect();
  await mongo.stop();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nsmoke test crashed:", err);
  process.exit(1);
});
