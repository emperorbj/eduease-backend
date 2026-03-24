import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const overviewQuerySchema = z.object({
  termId: objectId,
});

export const classStudentsParamsSchema = z.object({
  classId: objectId,
  termId: objectId,
});

export const studentPerformanceParamsSchema = z.object({
  studentId: objectId,
});

export const studentPerformanceQuerySchema = z.object({
  termId: objectId.optional(),
});

export const promotionPreviewQuerySchema = z.object({
  termId: objectId,
});

export const approvePromotionsSchema = z.object({
  termId: objectId,
  decisions: z
    .array(
      z.object({
        studentId: objectId,
        decision: z.enum(["PROMOTE", "REPEAT"]),
        reason: z.string().trim().max(300).optional(),
      })
    )
    .min(1),
});

export const lockTermParamsSchema = z.object({
  termId: objectId,
});

export type OverviewQuery = z.infer<typeof overviewQuerySchema>;
export type ClassStudentsParams = z.infer<typeof classStudentsParamsSchema>;
export type StudentPerformanceParams = z.infer<typeof studentPerformanceParamsSchema>;
export type StudentPerformanceQuery = z.infer<typeof studentPerformanceQuerySchema>;
export type PromotionPreviewQuery = z.infer<typeof promotionPreviewQuerySchema>;
export type ApprovePromotionsInput = z.infer<typeof approvePromotionsSchema>;
export type LockTermParams = z.infer<typeof lockTermParamsSchema>;
