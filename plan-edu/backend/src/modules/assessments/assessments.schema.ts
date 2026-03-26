import { z } from "zod";
import { MAX_EXAM, MAX_TEST1, MAX_TEST2 } from "../../utils/grading.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const scoreSheetQuerySchema = z.object({
  classId: objectId,
  subjectId: objectId,
  termId: objectId,
});

export const scoreUpdateRowSchema = z.object({
  studentId: objectId,
  test1: z.number().min(0).max(MAX_TEST1),
  test2: z.number().min(0).max(MAX_TEST2),
  exam: z.number().min(0).max(MAX_EXAM),
});

export const putScoreSheetSchema = z.object({
  classId: objectId,
  subjectId: objectId,
  termId: objectId,
  rows: z.array(scoreUpdateRowSchema).min(1),
});

export const submissionSchema = z.object({
  classId: objectId,
  subjectId: objectId,
  termId: objectId,
});

export const submissionStatusQuerySchema = z.object({
  classId: objectId,
  termId: objectId,
});

export const studentCountsQuerySchema = z.object({
  subjectId: objectId,
  termId: objectId,
  classId: objectId.optional(),
});

export type ScoreSheetQuery = z.infer<typeof scoreSheetQuerySchema>;
export type PutScoreSheetInput = z.infer<typeof putScoreSheetSchema>;
export type SubmitInput = z.infer<typeof submissionSchema>;
export type SubmissionStatusQuery = z.infer<typeof submissionStatusQuerySchema>;
export type StudentCountsQuery = z.infer<typeof studentCountsQuerySchema>;
