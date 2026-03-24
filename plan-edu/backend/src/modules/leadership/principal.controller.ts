import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import * as leadershipService from "./leadership.service.js";
import {
  approvePromotionsSchema,
  classStudentsParamsSchema,
  lockTermParamsSchema,
  overviewQuerySchema,
  promotionPreviewQuerySchema,
} from "./leadership.schema.js";

function requirePrincipal(req: Request) {
  if (!req.user) throw new AppError(401, "Authentication required");
  if (req.user.role !== "PRINCIPAL") throw new AppError(403, "Principal only");
  return req.user;
}

function z400(e: ZodError): never {
  throw new AppError(400, "Validation failed", e.flatten());
}

export async function overview(req: Request, res: Response): Promise<void> {
  const user = requirePrincipal(req);
  try {
    const query = overviewQuerySchema.parse(req.query);
    const row = await leadershipService.schoolOverview(user.schoolId, query);
    res.json(row);
  } catch (e) {
    if (e instanceof ZodError) z400(e);
    throw e;
  }
}

export async function classStudents(req: Request, res: Response): Promise<void> {
  const user = requirePrincipal(req);
  try {
    const params = classStudentsParamsSchema.parse({
      classId: req.params.classId,
      termId: req.query.termId,
    });
    const rows = await leadershipService.classStudents(user.schoolId, params);
    res.json({ students: rows });
  } catch (e) {
    if (e instanceof ZodError) z400(e);
    throw e;
  }
}

export async function promotionsPreview(req: Request, res: Response): Promise<void> {
  const user = requirePrincipal(req);
  try {
    const query = promotionPreviewQuerySchema.parse(req.query);
    const rows = await leadershipService.promotionPreview(user.schoolId, query);
    res.json({ suggestions: rows });
  } catch (e) {
    if (e instanceof ZodError) z400(e);
    throw e;
  }
}

export async function promotionsApprove(req: Request, res: Response): Promise<void> {
  const user = requirePrincipal(req);
  try {
    const input = approvePromotionsSchema.parse(req.body);
    const result = await leadershipService.approvePromotions(
      user.schoolId,
      user.id,
      input
    );
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) z400(e);
    throw e;
  }
}

export async function lockTerm(req: Request, res: Response): Promise<void> {
  const user = requirePrincipal(req);
  try {
    const params = lockTermParamsSchema.parse(req.params);
    const result = await leadershipService.lockTerm(user.schoolId, user.id, params.termId);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) z400(e);
    throw e;
  }
}
