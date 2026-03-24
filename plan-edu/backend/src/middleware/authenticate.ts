import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User.model.js";
import { AppError } from "./errorHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) {
      throw new AppError(401, "Authentication required");
    }
    const { sub } = verifyAccessToken(token);
    const user = await User.findById(sub);
    if (!user || !user.isActive) {
      throw new AppError(401, "Invalid or inactive account");
    }
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      classTeacherClassId: user.classTeacherClassId?.toString() ?? null,
    };
    next();
  } catch (e) {
    if (e instanceof AppError) {
      next(e);
      return;
    }
    next(new AppError(401, "Invalid or expired token"));
  }
}
