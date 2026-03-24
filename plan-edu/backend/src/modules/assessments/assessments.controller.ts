import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import * as assessmentsService from "./assessments.service.js";
import {
  putScoreSheetSchema,
  scoreSheetQuerySchema,
  submissionSchema,
  submissionStatusQuerySchema,
} from "./assessments.schema.js";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }
  return req.user;
}

function zodTo400(e: ZodError): never {
  throw new AppError(400, "Validation failed", e.flatten());
}

export async function teachingContexts(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "SUBJECT_TEACHER") {
    throw new AppError(403, "Only subject teachers can access teaching contexts");
  }
  const rows = await assessmentsService.listTeachingContexts(user.schoolId, user.id);
  res.json({ contexts: rows });
}

export async function getScoreSheet(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "SUBJECT_TEACHER") {
    throw new AppError(403, "Only subject teachers can view score sheets");
  }
  try {
    const query = scoreSheetQuerySchema.parse(req.query);
    const rows = await assessmentsService.getScoreSheet(user.schoolId, user.id, query);
    res.json({ rows });
  } catch (e) {
    if (e instanceof ZodError) zodTo400(e);
    throw e;
  }
}

export async function putScoreSheet(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "SUBJECT_TEACHER") {
    throw new AppError(403, "Only subject teachers can update score sheets");
  }
  try {
    const input = putScoreSheetSchema.parse(req.body);
    const result = await assessmentsService.putScoreSheet(user.schoolId, user.id, input);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) zodTo400(e);
    throw e;
  }
}

export async function submit(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "SUBJECT_TEACHER") {
    throw new AppError(403, "Only subject teachers can submit results");
  }
  try {
    const input = submissionSchema.parse(req.body);
    const result = await assessmentsService.submitScores(user.schoolId, user.id, input);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) zodTo400(e);
    throw e;
  }
}

export async function submissionStatus(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "CLASS_TEACHER") {
    throw new AppError(403, "Only class teachers can view submission status");
  }
  if (!user.classTeacherClassId) {
    throw new AppError(403, "No class assigned");
  }
  try {
    const query = submissionStatusQuerySchema.parse(req.query);
    const rows = await assessmentsService.submissionStatus(
      user.schoolId,
      user.classTeacherClassId,
      query
    );
    res.json({ subjects: rows });
  } catch (e) {
    if (e instanceof ZodError) zodTo400(e);
    throw e;
  }
}
