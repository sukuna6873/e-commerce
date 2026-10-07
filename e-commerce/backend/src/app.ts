import cors from "cors";
import express, { type Express } from "express";
import { config } from "./config.js";
import { adminAuthRouter } from "./routes/adminAuth.js";
import { errorHandler, notFound } from "./middleware/errors.js";

/**
 * Express app assembly, separate from the listener in index.ts.
 *
 * Keeping this exportable means the routes can be mounted in a test without
 * opening a port or going through the bootstrap.
 *
 * Auth is bearer-token only — no cookies — so CORS never needs credentials
 * enabled, and the allow-list can stay a plain array of origins.
 */

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: "100kb" }));

  app.use(
    cors({
      origin: config.adminOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "voltify-admin-api" });
  });

  app.use("/api/admin", adminAuthRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
