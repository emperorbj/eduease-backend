import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import { User } from "../../models/User.model.js";
import { TeachingAssignment } from "../../models/TeachingAssignment.model.js";
import {
  adminCreateUserSchema,
  bootstrapRegisterSchema,
  loginSchema,
} from "./auth.schema.js";
import * as authService from "./auth.service.js";

function handleZodError(e: ZodError): never {
  throw new AppError(400, "Validation failed", e.flatten());
}

export async function register(req: Request, res: Response): Promise<void> {
  const isEmpty = (await User.countDocuments()) === 0;

  if (isEmpty) {
    let input;
    try {
      input = bootstrapRegisterSchema.parse(req.body);
    } catch (e) {
      if (e instanceof ZodError) handleZodError(e);
      throw e;
    }
    const result = await authService.bootstrapRegister(input);
    res.status(201).json(result);
    return;
  }

  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    throw new AppError(403, "Only admins can create users");
  }

  let input;
  try {
    input = adminCreateUserSchema.parse(req.body);
  } catch (e) {
    if (e instanceof ZodError) handleZodError(e);
    throw e;
  }

  const result = await authService.adminCreateUser(
    req.user.schoolId,
    req.user.id,
    input
  );
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  let input;
  try {
    input = loginSchema.parse(req.body);
  } catch (e) {
    if (e instanceof ZodError) handleZodError(e);
    throw e;
  }
  const result = await authService.login(input);
  res.json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }
  const activeTeachingAssignments = await TeachingAssignment.countDocuments({
    schoolId: req.user.schoolId,
    teacherUserId: req.user.id,
    isActive: true,
  });
  const canUseAssessments =
    req.user.role === "SUBJECT_TEACHER" ||
    req.user.role === "ADMIN" ||
    req.user.role === "SUPER_ADMIN" ||
    activeTeachingAssignments > 0;
  res.json({
    user: req.user,
    permissions: {
      schoolId: req.user.schoolId,
      role: req.user.role,
      isClassTeacher: req.user.role === "CLASS_TEACHER",
      hasTeachingAssignments: activeTeachingAssignments > 0,
      activeTeachingAssignments,
      canUseAssessments,
      canViewAllClasses:
        req.user.role === "PRINCIPAL" ||
        req.user.role === "HEADTEACHER" ||
        req.user.role === "ADMIN" ||
        req.user.role === "SUPER_ADMIN",
    },
  });
}
