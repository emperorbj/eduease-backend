import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const classTermParamsSchema = z.object({
  classId: objectId,
  termId: objectId,
});

export const subjectTermParamsSchema = z.object({
  classId: objectId,
  termId: objectId,
  subjectId: objectId,
});

export const reportCardParamsSchema = z.object({
  classId: objectId,
  termId: objectId,
  studentId: objectId,
});

export const updateCommentsSchema = z.object({
  comments: z
    .array(
      z.object({
        studentId: objectId,
        classTeacherComment: z.string().trim().max(300).optional(),
        headteacherComment: z.string().trim().max(300).optional(),
      })
    )
    .min(1),
});

export type ClassTermParams = z.infer<typeof classTermParamsSchema>;
export type SubjectTermParams = z.infer<typeof subjectTermParamsSchema>;
export type ReportCardParams = z.infer<typeof reportCardParamsSchema>;
export type UpdateCommentsInput = z.infer<typeof updateCommentsSchema>;
