import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/requireRoles.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as adminController from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRoles("ADMIN", "SUPER_ADMIN"));

adminRouter.get("/users", asyncHandler(adminController.listUsers));
adminRouter.get("/users/:id", asyncHandler(adminController.getUser));
adminRouter.patch("/users/:id", asyncHandler(adminController.updateUser));
adminRouter.delete("/users/:id", asyncHandler(adminController.deleteUser));

adminRouter.get("/sessions", asyncHandler(adminController.listSessions));
adminRouter.post("/sessions", asyncHandler(adminController.createSession));
adminRouter.patch("/sessions/:id", asyncHandler(adminController.updateSession));
adminRouter.delete("/sessions/:id", asyncHandler(adminController.deleteSession));

adminRouter.get("/terms", asyncHandler(adminController.listTerms));
adminRouter.post("/terms", asyncHandler(adminController.createTerm));
adminRouter.patch("/terms/:id", asyncHandler(adminController.updateTerm));

adminRouter.get("/classes", asyncHandler(adminController.listClasses));
adminRouter.post("/classes", asyncHandler(adminController.createClass));
adminRouter.patch("/classes/:id", asyncHandler(adminController.updateClass));
adminRouter.delete("/classes/:id", asyncHandler(adminController.deleteClass));

adminRouter.get("/subjects", asyncHandler(adminController.listSubjects));
adminRouter.post("/subjects", asyncHandler(adminController.createSubject));
adminRouter.patch("/subjects/:id", asyncHandler(adminController.updateSubject));
adminRouter.delete("/subjects/:id", asyncHandler(adminController.deleteSubject));

adminRouter.get(
  "/assignments/class-coverage",
  asyncHandler(adminController.classCoverage)
);

adminRouter.post(
  "/assignments/teacher-subject",
  asyncHandler(adminController.createTeachingAssignment)
);
adminRouter.post(
  "/assignments/teacher-subject/unassign",
  asyncHandler(adminController.unassignTeachingAssignment)
);
