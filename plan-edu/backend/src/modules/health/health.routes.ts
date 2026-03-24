import { Router } from "express";
import mongoose from "mongoose";
import { mongoState } from "../../config/mongo.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const mongo =
    mongoState() === "connected"
      ? { state: "connected" as const }
      : { state: "disconnected" as const };
  res.json({
    ok: true,
    mongo,
    mongooseReadyState: mongoose.connection.readyState,
  });
});
