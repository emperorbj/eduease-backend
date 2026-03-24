import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as classResultsController from "./classResults.controller.js";

export const classResultsRouter = Router();

classResultsRouter.use(authenticate);

classResultsRouter.get(
  "/:classId/:termId/status",
  asyncHandler(classResultsController.status)
);
classResultsRouter.post(
  "/:classId/:termId/aggregate",
  asyncHandler(classResultsController.aggregate)
);
classResultsRouter.get(
  "/:classId/:termId/students",
  asyncHandler(classResultsController.students)
);
classResultsRouter.patch(
  "/:classId/:termId/comments",
  asyncHandler(classResultsController.comments)
);
