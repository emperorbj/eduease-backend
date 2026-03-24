import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as assessmentsController from "./assessments.controller.js";

export const assessmentsRouter = Router();

assessmentsRouter.use(authenticate);

assessmentsRouter.get(
  "/teaching-contexts",
  asyncHandler(assessmentsController.teachingContexts)
);
assessmentsRouter.get("/score-sheets", asyncHandler(assessmentsController.getScoreSheet));
assessmentsRouter.put("/score-sheets", asyncHandler(assessmentsController.putScoreSheet));
assessmentsRouter.post("/submissions", asyncHandler(assessmentsController.submit));
assessmentsRouter.get(
  "/submissions/status",
  asyncHandler(assessmentsController.submissionStatus)
);
