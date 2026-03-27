import { z } from "zod";
import { USER_ROLES } from "../../types/roles.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const departmentEnum = z.enum(["SCIENCE", "ARTS", "COMMERCIAL"]);

export const createSessionSchema = z.object({
  name: z.string().trim().min(3).max(64),
  isActive: z.boolean().optional(),
});

export const updateSessionSchema = z.object({
  name: z.string().trim().min(3).max(64).optional(),
  isActive: z.boolean().optional(),
});

export const createTermSchema = z.object({
  sessionId: objectId,
  name: z.string().trim().min(3).max(64),
  order: z.number().int().min(1).max(3),
  isActive: z.boolean().optional(),
});

export const updateTermSchema = z.object({
  name: z.string().trim().min(3).max(64).optional(),
  order: z.number().int().min(1).max(3).optional(),
  isActive: z.boolean().optional(),
});

export const createClassSchema = z.object({
  name: z.string().trim().min(1).max(64),
  arm: z.string().trim().min(1).max(32),
});

export const updateClassSchema = z.object({
  name: z.string().trim().min(1).max(64).optional(),
  arm: z.string().trim().min(1).max(32).optional(),
  classTeacherUserId: objectId.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2).max(64),
  code: z.string().trim().min(2).max(16),
  isCompulsoryForAll: z.boolean().optional(),
  departmentsApplicable: z.array(departmentEnum).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
  code: z.string().trim().min(2).max(16).optional(),
  isCompulsoryForAll: z.boolean().optional(),
  departmentsApplicable: z.array(departmentEnum).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const createTeachingAssignmentSchema = z.object({
  teacherUserId: objectId,
  classId: objectId,
  subjectId: objectId,
  termId: objectId,
  isActive: z.boolean().optional(),
});

export const unassignTeachingAssignmentSchema = z.object({
  teacherUserId: objectId,
  classId: objectId,
  subjectId: objectId,
  termId: objectId,
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  role: z.enum(USER_ROLES).optional(),
  classTeacherClassId: objectId.nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateTeachingAssignmentInput = z.infer<
  typeof createTeachingAssignmentSchema
>;
export type UnassignTeachingAssignmentInput = z.infer<
  typeof unassignTeachingAssignmentSchema
>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const classCoverageQuerySchema = z.object({
  classId: objectId,
  termId: objectId.optional(),
});

export type ClassCoverageQuery = z.infer<typeof classCoverageQuerySchema>;
