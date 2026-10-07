import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { createApp } from "./app.js";

/**
 * Server bootstrap.
 *
 * The database connection is awaited before the listener opens, so the service
 * never answers a request it cannot serve.
 */

async function start(): Promise<void> {
  await connectDatabase();

  createApp().listen(config.port, () => {
    console.log(`[api] admin server listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error("[api] failed to start:", err);
  process.exit(1);
});
