import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { studentsRouter } from "./modules/students/students.routes.js";
import { assessmentsRouter } from "./modules/assessments/assessments.routes.js";
import { classResultsRouter } from "./modules/classResults/classResults.routes.js";
import { headteacherRouter } from "./modules/leadership/headteacher.routes.js";
import { principalRouter } from "./modules/leadership/principal.routes.js";
import { materialsRouter } from "./modules/materials/materials.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: `${env.MAX_UPLOAD_MB}mb` }));
  app.use(cookieParser());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === "production" ? 300 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);

  app.get("/", (_req, res) => {
    res.json({ name: "plan-edu-api", version: "0.1.0" });
  });

  app.use("/health", healthRouter);
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/students", studentsRouter);
  app.use("/api/v1", assessmentsRouter);
  app.use("/api/v1/class-results", classResultsRouter);
  app.use("/api/v1/headteacher", headteacherRouter);
  app.use("/api/v1/principal", principalRouter);
  app.use("/api/v1/materials", materialsRouter);
  app.use("/api/v1/notifications", notificationsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
