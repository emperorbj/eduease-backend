import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { env } from "./env.js";

export async function connectMongo(): Promise<void> {
  if (!env.MONGODB_URI) {
    logger.warn("[mongo] MONGODB_URI not set — skipping connection");
    return;
  }
  await mongoose.connect(env.MONGODB_URI);
  const { host, name } = mongoose.connection;
  logger.info(
    `[mongo] connected (${host ?? "unknown host"} / db: ${name ?? "unknown"})`
  );
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function mongoState(): "connected" | "disconnected" {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}
