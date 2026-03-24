import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createMaterialSchema = z.object({
  title: z.string().trim().min(2).max(120),
  classId: objectId,
  subjectId: objectId,
});

export const listMaterialsQuerySchema = z.object({
  classId: objectId.optional(),
  subjectId: objectId.optional(),
});

export const materialIdParamsSchema = z.object({
  id: objectId,
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type ListMaterialsQuery = z.infer<typeof listMaterialsQuerySchema>;
export type MaterialIdParams = z.infer<typeof materialIdParamsSchema>;
