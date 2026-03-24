import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as notificationsController from "./notifications.controller.js";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.post(
  "/results-released",
  asyncHandler(notificationsController.resultReleased)
);
notificationsRouter.post(
  "/low-performance-alert",
  asyncHandler(notificationsController.lowPerformanceAlert)
);
