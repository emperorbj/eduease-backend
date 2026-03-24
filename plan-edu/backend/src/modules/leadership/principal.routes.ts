import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as principalController from "./principal.controller.js";

export const principalRouter = Router();

principalRouter.use(authenticate);

principalRouter.get("/overview", asyncHandler(principalController.overview));
principalRouter.get(
  "/classes/:classId/students",
  asyncHandler(principalController.classStudents)
);
principalRouter.get(
  "/promotions/preview",
  asyncHandler(principalController.promotionsPreview)
);
principalRouter.post(
  "/promotions/approve",
  asyncHandler(principalController.promotionsApprove)
);
principalRouter.post("/terms/:termId/lock", asyncHandler(principalController.lockTerm));
