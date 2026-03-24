import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

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
  isActive: z.boolean().optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
  code: z.string().trim().min(2).max(16).optional(),
  isActive: z.boolean().optional(),
});

export const createTeachingAssignmentSchema = z.object({
  teacherUserId: objectId,
  classId: objectId,
  subjectId: objectId,
  termId: objectId,
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
