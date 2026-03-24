import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import * as adminService from "./admin.service.js";
import {
  createClassSchema,
  createSessionSchema,
  createSubjectSchema,
  createTeachingAssignmentSchema,
  createTermSchema,
  updateClassSchema,
  updateSessionSchema,
  updateSubjectSchema,
  updateTermSchema,
} from "./admin.schema.js";

function schoolIdOrThrow(req: Request): string {
  if (!req.user?.schoolId) {
    throw new AppError(401, "Authentication required");
  }
  return req.user.schoolId;
}

function routeParamString(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, `Invalid ${name}`);
  }
  return value;
}

function badRequestFromZod(err: ZodError): never {
  throw new AppError(400, "Validation failed", err.flatten());
}

export async function listSessions(req: Request, res: Response): Promise<void> {
  const rows = await adminService.listSessions(schoolIdOrThrow(req));
  res.json({ sessions: rows });
}

export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    const input = createSessionSchema.parse(req.body);
    const row = await adminService.createSession(schoolIdOrThrow(req), input);
    res.status(201).json({ session: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}

export async function updateSession(req: Request, res: Response): Promise<void> {
  try {
    const input = updateSessionSchema.parse(req.body);
    const row = await adminService.updateSession(
      schoolIdOrThrow(req),
      routeParamString(req.params.id, "session id"),
      input
    );
    res.json({ session: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}

export async function listTerms(req: Request, res: Response): Promise<void> {
  const rows = await adminService.listTerms(
    schoolIdOrThrow(req),
    req.query.sessionId ? String(req.query.sessionId) : undefined
  );
  res.json({ terms: rows });
}

export async function createTerm(req: Request, res: Response): Promise<void> {
  try {
    const input = createTermSchema.parse(req.body);
    const row = await adminService.createTerm(schoolIdOrThrow(req), input);
    res.status(201).json({ term: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}

export async function updateTerm(req: Request, res: Response): Promise<void> {
  try {
    const input = updateTermSchema.parse(req.body);
    const row = await adminService.updateTerm(
      schoolIdOrThrow(req),
      routeParamString(req.params.id, "term id"),
      input
    );
    res.json({ term: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}

export async function listClasses(req: Request, res: Response): Promise<void> {
  const rows = await adminService.listClasses(schoolIdOrThrow(req));
  res.json({ classes: rows });
}

export async function createClass(req: Request, res: Response): Promise<void> {
  try {
    const input = createClassSchema.parse(req.body);
    const row = await adminService.createClass(schoolIdOrThrow(req), input);
    res.status(201).json({ class: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}

export async function updateClass(req: Request, res: Response): Promise<void> {
  try {
    const input = updateClassSchema.parse(req.body);
    const row = await adminService.updateClass(
      schoolIdOrThrow(req),
      routeParamString(req.params.id, "class id"),
      input
    );
    res.json({ class: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}

export async function listSubjects(req: Request, res: Response): Promise<void> {
  const rows = await adminService.listSubjects(schoolIdOrThrow(req));
  res.json({ subjects: rows });
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  try {
    const input = createSubjectSchema.parse(req.body);
    const row = await adminService.createSubject(schoolIdOrThrow(req), input);
    res.status(201).json({ subject: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}

export async function updateSubject(req: Request, res: Response): Promise<void> {
  try {
    const input = updateSubjectSchema.parse(req.body);
    const row = await adminService.updateSubject(
      schoolIdOrThrow(req),
      routeParamString(req.params.id, "subject id"),
      input
    );
    res.json({ subject: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}

export async function createTeachingAssignment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const input = createTeachingAssignmentSchema.parse(req.body);
    const row = await adminService.createTeachingAssignment(
      schoolIdOrThrow(req),
      input
    );
    res.status(201).json({ assignment: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}
