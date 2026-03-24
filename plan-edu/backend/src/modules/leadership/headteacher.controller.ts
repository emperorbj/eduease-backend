import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import * as leadershipService from "./leadership.service.js";
import {
  classStudentsParamsSchema,
  overviewQuerySchema,
  studentPerformanceParamsSchema,
  studentPerformanceQuerySchema,
} from "./leadership.schema.js";

function requireHeadteacher(req: Request) {
  if (!req.user) throw new AppError(401, "Authentication required");
  if (req.user.role !== "HEADTEACHER") throw new AppError(403, "Headteacher only");
  return req.user;
}

function z400(e: ZodError): never {
  throw new AppError(400, "Validation failed", e.flatten());
}

export async function overview(req: Request, res: Response): Promise<void> {
  const user = requireHeadteacher(req);
  try {
    const query = overviewQuerySchema.parse(req.query);
    const row = await leadershipService.schoolOverview(user.schoolId, query);
    res.json(row);
  } catch (e) {
    if (e instanceof ZodError) z400(e);
    throw e;
  }
}

export async function classes(req: Request, res: Response): Promise<void> {
  const user = requireHeadteacher(req);
  try {
    const query = overviewQuerySchema.parse(req.query);
    const rows = await leadershipService.classesOverview(user.schoolId, query);
    res.json({ classes: rows });
  } catch (e) {
    if (e instanceof ZodError) z400(e);
    throw e;
  }
}

export async function classStudents(req: Request, res: Response): Promise<void> {
  const user = requireHeadteacher(req);
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

export async function studentPerformance(req: Request, res: Response): Promise<void> {
  const user = requireHeadteacher(req);
  try {
    const params = studentPerformanceParamsSchema.parse(req.params);
    const query = studentPerformanceQuerySchema.parse(req.query);
    const rows = await leadershipService.studentPerformance(user.schoolId, params, query);
    res.json({ performance: rows });
  } catch (e) {
    if (e instanceof ZodError) z400(e);
    throw e;
  }
}
