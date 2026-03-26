import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/requireRoles.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as adminController from "./admin.controller.js";

export const adminRouter = Router();

// Admin router contains both read-only "metadata" endpoints and write endpoints.
// We allow any authenticated role to read metadata, while restricting all write actions.
adminRouter.use(authenticate);

adminRouter.get("/users", requireRoles("ADMIN", "SUPER_ADMIN"), asyncHandler(adminController.listUsers));
adminRouter.get(
  "/users/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.getUser)
);
adminRouter.patch(
  "/users/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.updateUser)
);
adminRouter.delete(
  "/users/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.deleteUser)
);

adminRouter.get("/sessions", requireRoles("ADMIN", "SUPER_ADMIN"), asyncHandler(adminController.listSessions));
adminRouter.post(
  "/sessions",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.createSession)
);
adminRouter.patch(
  "/sessions/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.updateSession)
);
adminRouter.delete(
  "/sessions/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.deleteSession)
);

adminRouter.get("/terms", asyncHandler(adminController.listTerms));
adminRouter.post(
  "/terms",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.createTerm)
);
adminRouter.patch(
  "/terms/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.updateTerm)
);

adminRouter.get("/classes", asyncHandler(adminController.listClasses));
adminRouter.post(
  "/classes",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.createClass)
);
adminRouter.patch(
  "/classes/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.updateClass)
);
adminRouter.delete(
  "/classes/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.deleteClass)
);

adminRouter.get("/subjects", asyncHandler(adminController.listSubjects));
adminRouter.post(
  "/subjects",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.createSubject)
);
adminRouter.patch(
  "/subjects/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.updateSubject)
);
adminRouter.delete(
  "/subjects/:id",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.deleteSubject)
);

adminRouter.get(
  "/assignments/class-coverage",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.classCoverage)
);

adminRouter.post(
  "/assignments/teacher-subject",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.createTeachingAssignment)
);
adminRouter.post(
  "/assignments/teacher-subject/unassign",
  requireRoles("ADMIN", "SUPER_ADMIN"),
  asyncHandler(adminController.unassignTeachingAssignment)
);
