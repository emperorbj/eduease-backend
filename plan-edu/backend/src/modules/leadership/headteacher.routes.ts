import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as headteacherController from "./headteacher.controller.js";

export const headteacherRouter = Router();

headteacherRouter.use(authenticate);

headteacherRouter.get("/overview", asyncHandler(headteacherController.overview));
headteacherRouter.get("/classes", asyncHandler(headteacherController.classes));
headteacherRouter.get(
  "/classes/:classId/students",
  asyncHandler(headteacherController.classStudents)
);
headteacherRouter.get(
  "/students/:studentId/performance",
  asyncHandler(headteacherController.studentPerformance)
);
