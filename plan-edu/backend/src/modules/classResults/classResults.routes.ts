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
classResultsRouter.get(
  "/:classId/:termId/subjects/:subjectId/positions",
  asyncHandler(classResultsController.subjectPositions)
);
classResultsRouter.get(
  "/:classId/:termId/report-cards/:studentId",
  asyncHandler(classResultsController.reportCard)
);
classResultsRouter.get(
  "/:classId/:termId/report-cards",
  asyncHandler(classResultsController.reportCards)
);
classResultsRouter.get(
  "/:classId/:termId/report-cards/:studentId/pdf",
  asyncHandler(classResultsController.reportCardPdf)
);
