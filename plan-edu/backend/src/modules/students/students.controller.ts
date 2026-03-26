import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import * as studentsService from "./students.service.js";
import * as authService from "../auth/auth.service.js";
import {
  createStudentSchema,
  listStudentsQuerySchema,
  myStudentResultsQuerySchema,
  updateStudentSchema,
} from "./students.schema.js";
import { User } from "../../models/User.model.js";

function ensureUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }
  return req.user;
}

function throwValidation(err: ZodError): never {
  throw new AppError(400, "Validation failed", err.flatten());
}

function routeParamString(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, `Invalid ${name}`);
  }
  return value;
}

function canViewAll(role: string): boolean {
  return (
    role === "PRINCIPAL" ||
    role === "HEADTEACHER" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

export async function listStudents(req: Request, res: Response): Promise<void> {
  const user = ensureUser(req);
  try {
    const query = listStudentsQuerySchema.parse(req.query);
    if (!canViewAll(user.role)) {
      if (user.role === "CLASS_TEACHER") {
        if (!user.classTeacherClassId) {
          throw new AppError(403, "No class assigned to class teacher");
        }
        if (query.classId && query.classId !== user.classTeacherClassId) {
          throw new AppError(403, "Forbidden class scope");
        }
        query.classId = user.classTeacherClassId;
      } else {
        throw new AppError(403, "Forbidden");
      }
    }

    const rows = await studentsService.listStudents(user.schoolId, query);
    res.json({ students: rows });
  } catch (e) {
    if (e instanceof ZodError) throwValidation(e);
    throw e;
  }
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const user = ensureUser(req);
  if (
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "HEADTEACHER" &&
    user.role !== "PRINCIPAL"
  ) {
    throw new AppError(403, "Only leadership/admin roles can create students");
  }
  try {
    const input = createStudentSchema.parse(req.body);
    const row = await studentsService.createStudent(user.schoolId, input);

    // Optional: if credentials are provided, create the login user and link it to this student record.
    if (input.loginEmail || input.loginPassword) {
      if (!input.loginEmail || !input.loginPassword) {
        throw new AppError(400, "Both loginEmail and loginPassword are required when using student login");
      }

      const existing = await User.findOne({
        schoolId: user.schoolId,
        email: input.loginEmail.toLowerCase().trim(),
      });
      if (existing) {
        throw new AppError(409, "A user with this email already exists in this school");
      }

      const created = await authService.adminCreateUser(user.schoolId, user.id, {
        email: input.loginEmail,
        password: input.loginPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "STUDENT",
      });

      await User.findOneAndUpdate(
        { _id: created.user.id, schoolId: user.schoolId },
        { studentId: row._id },
        { new: true }
      );
    }
    res.status(201).json({ student: row });
  } catch (e) {
    if (e instanceof ZodError) throwValidation(e);
    throw e;
  }
}

export async function myStudentResults(req: Request, res: Response): Promise<void> {
  const user = ensureUser(req);
  if (user.role !== "STUDENT") {
    throw new AppError(403, "Only students can view their results");
  }
  try {
    const query = myStudentResultsQuerySchema.parse(req.query);
    const result = await studentsService.getMyStudentResults(user.schoolId, user.id, query);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) throwValidation(e);
    throw e;
  }
}

export async function getStudent(req: Request, res: Response): Promise<void> {
  const user = ensureUser(req);
  const row = await studentsService.getStudent(
    user.schoolId,
    routeParamString(req.params.id, "student id")
  );

  if (!canViewAll(user.role)) {
    if (user.role === "CLASS_TEACHER") {
      if (!user.classTeacherClassId || row.classId.toString() !== user.classTeacherClassId) {
        throw new AppError(403, "Forbidden");
      }
    } else {
      throw new AppError(403, "Forbidden");
    }
  }

  res.json({ student: row });
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  const user = ensureUser(req);
  if (
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "HEADTEACHER" &&
    user.role !== "PRINCIPAL"
  ) {
    throw new AppError(403, "Only leadership/admin roles can update students");
  }
  try {
    const input = updateStudentSchema.parse(req.body);
    const row = await studentsService.updateStudent(
      user.schoolId,
      routeParamString(req.params.id, "student id"),
      input
    );
    res.json({ student: row });
  } catch (e) {
    if (e instanceof ZodError) throwValidation(e);
    throw e;
  }
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  const user = ensureUser(req);
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    throw new AppError(403, "Only admin roles can delete students");
  }
  await studentsService.deleteStudent(
    user.schoolId,
    routeParamString(req.params.id, "student id")
  );
  res.status(204).send();
}
