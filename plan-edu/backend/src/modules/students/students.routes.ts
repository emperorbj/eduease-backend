import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as studentsController from "./students.controller.js";

export const studentsRouter = Router();

studentsRouter.use(authenticate);

studentsRouter.get("/", asyncHandler(studentsController.listStudents));
studentsRouter.post("/", asyncHandler(studentsController.createStudent));
studentsRouter.get("/me/results", asyncHandler(studentsController.myStudentResults));
studentsRouter.get("/:id", asyncHandler(studentsController.getStudent));
studentsRouter.patch("/:id", asyncHandler(studentsController.updateStudent));
studentsRouter.delete("/:id", asyncHandler(studentsController.deleteStudent));
