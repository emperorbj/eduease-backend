import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const resultReleaseSchema = z.object({
  termId: objectId,
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().trim().min(3).max(160).optional(),
  message: z.string().trim().min(3).max(5000),
});

export const lowPerformanceAlertSchema = z.object({
  termId: objectId,
  recipients: z.array(z.string().email()).min(1),
  thresholdAverage: z.number().min(0).max(100).default(50),
});

export type ResultReleaseInput = z.infer<typeof resultReleaseSchema>;
export type LowPerformanceAlertInput = z.infer<typeof lowPerformanceAlertSchema>;
