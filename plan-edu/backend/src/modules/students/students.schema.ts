import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const listStudentsQuerySchema = z.object({
  classId: objectId.optional(),
  q: z.string().trim().min(1).max(64).optional(),
});

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(1).max(64),
  lastName: z.string().trim().min(1).max(64),
  admissionNumber: z.string().trim().min(1).max(32),
  classId: objectId,
  /**
   * Optional login credentials for student space.
   * If omitted, we only create the Student record (backwards compatible).
   */
  loginEmail: z.string().email().optional(),
  loginPassword: z.string().min(8).max(128).optional(),
});

export const myStudentResultsQuerySchema = z.object({
  termId: objectId,
});

export const updateStudentSchema = z.object({
  firstName: z.string().trim().min(1).max(64).optional(),
  lastName: z.string().trim().min(1).max(64).optional(),
  admissionNumber: z.string().trim().min(1).max(32).optional(),
  classId: objectId.optional(),
  isActive: z.boolean().optional(),
});

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type MyStudentResultsQuery = z.infer<typeof myStudentResultsQuerySchema>;
