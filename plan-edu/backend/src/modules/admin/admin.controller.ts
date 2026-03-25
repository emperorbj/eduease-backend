import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import * as adminService from "./admin.service.js";
import {
  createClassSchema,
  createSessionSchema,
  createSubjectSchema,
  classCoverageQuerySchema,
  createTeachingAssignmentSchema,
  createTermSchema,
  unassignTeachingAssignmentSchema,
  updateClassSchema,
  updateSessionSchema,
  updateSubjectSchema,
  updateTermSchema,
  updateUserSchema,
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

export async function listUsers(req: Request, res: Response): Promise<void> {
  const rows = await adminService.listUsers(schoolIdOrThrow(req));
  res.json({ users: rows });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const row = await adminService.getUserById(
    schoolIdOrThrow(req),
    routeParamString(req.params.id, "user id")
  );
  res.json({ user: row });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const input = updateUserSchema.parse(req.body);
    const row = await adminService.updateUser(
      schoolIdOrThrow(req),
      routeParamString(req.params.id, "user id"),
      input
    );
    res.json({ user: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  await adminService.deleteUser(
    schoolIdOrThrow(req),
    routeParamString(req.params.id, "user id")
  );
  res.status(204).send();
}

export async function classCoverage(req: Request, res: Response): Promise<void> {
  try {
    const query = classCoverageQuerySchema.parse(req.query);
    const row = await adminService.getClassSubjectTeacherCoverage(
      schoolIdOrThrow(req),
      query
    );
    res.json(row);
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
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

export async function deleteSession(req: Request, res: Response): Promise<void> {
  await adminService.deleteSession(
    schoolIdOrThrow(req),
    routeParamString(req.params.id, "session id")
  );
  res.status(204).send();
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

export async function deleteClass(req: Request, res: Response): Promise<void> {
  await adminService.deleteClass(
    schoolIdOrThrow(req),
    routeParamString(req.params.id, "class id")
  );
  res.status(204).send();
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

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  await adminService.deleteSubject(
    schoolIdOrThrow(req),
    routeParamString(req.params.id, "subject id")
  );
  res.status(204).send();
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

export async function unassignTeachingAssignment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const input = unassignTeachingAssignmentSchema.parse(req.body);
    const row = await adminService.unassignTeachingAssignment(
      schoolIdOrThrow(req),
      input
    );
    res.json({ assignment: row });
  } catch (e) {
    if (e instanceof ZodError) badRequestFromZod(e);
    throw e;
  }
}
