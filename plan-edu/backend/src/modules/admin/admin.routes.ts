import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/requireRoles.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as adminController from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRoles("ADMIN", "SUPER_ADMIN"));

adminRouter.get("/sessions", asyncHandler(adminController.listSessions));
adminRouter.post("/sessions", asyncHandler(adminController.createSession));
adminRouter.patch("/sessions/:id", asyncHandler(adminController.updateSession));

adminRouter.get("/terms", asyncHandler(adminController.listTerms));
adminRouter.post("/terms", asyncHandler(adminController.createTerm));
adminRouter.patch("/terms/:id", asyncHandler(adminController.updateTerm));

adminRouter.get("/classes", asyncHandler(adminController.listClasses));
adminRouter.post("/classes", asyncHandler(adminController.createClass));
adminRouter.patch("/classes/:id", asyncHandler(adminController.updateClass));

adminRouter.get("/subjects", asyncHandler(adminController.listSubjects));
adminRouter.post("/subjects", asyncHandler(adminController.createSubject));
adminRouter.patch("/subjects/:id", asyncHandler(adminController.updateSubject));

adminRouter.post(
  "/assignments/teacher-subject",
  asyncHandler(adminController.createTeachingAssignment)
);
