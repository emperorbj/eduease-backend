import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import * as classResultsService from "./classResults.service.js";
import { classTermParamsSchema, updateCommentsSchema } from "./classResults.schema.js";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }
  return req.user;
}

function validationError(e: ZodError): never {
  throw new AppError(400, "Validation failed", e.flatten());
}

function canAccessClass(role: string): boolean {
  return (
    role === "CLASS_TEACHER" ||
    role === "HEADTEACHER" ||
    role === "PRINCIPAL" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

function enforceClassTeacherScope(user: NonNullable<Request["user"]>, classId: string) {
  if (user.role === "CLASS_TEACHER" && user.classTeacherClassId !== classId) {
    throw new AppError(403, "Forbidden class scope");
  }
}

export async function status(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (!canAccessClass(user.role)) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = classTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const rows = await classResultsService.classSubmissionStatus(user.schoolId, params);
    res.json({ subjects: rows });
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function aggregate(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (
    user.role !== "CLASS_TEACHER" &&
    user.role !== "HEADTEACHER" &&
    user.role !== "PRINCIPAL" &&
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN"
  ) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = classTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const result = await classResultsService.recomputeClassAggregate(user.schoolId, params);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function students(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (!canAccessClass(user.role)) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = classTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const rows = await classResultsService.listClassStudentResults(user.schoolId, params);
    res.json({ students: rows });
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function comments(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "CLASS_TEACHER" && user.role !== "HEADTEACHER") {
    throw new AppError(403, "Only class teacher or headteacher can comment");
  }
  try {
    const params = classTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const input = updateCommentsSchema.parse(req.body);
    const result = await classResultsService.updateComments(
      user.schoolId,
      params,
      user.role,
      input
    );
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}
