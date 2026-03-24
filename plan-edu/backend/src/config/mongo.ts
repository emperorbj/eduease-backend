import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectMongo(): Promise<void> {
  if (!env.MONGODB_URI) {
    console.warn("[mongo] MONGODB_URI not set — skipping connection");
    return;
  }
  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function mongoState(): "connected" | "disconnected" {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}
