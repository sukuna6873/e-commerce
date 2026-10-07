import mongoose from "mongoose";
import { config, redactMongoUri } from "./config.js";

/**
 * Mongoose connection. Called once from the server bootstrap and awaited before
 * the listener opens, so the first request never races an unauthenticated pool.
 */
export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(`[db] connected to ${redactMongoUri(config.mongoUri)}`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
