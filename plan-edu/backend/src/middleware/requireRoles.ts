import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../types/roles.js";
import { AppError } from "./errorHandler.js";

export function requireRoles(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "Authentication required"));
      return;
    }
    if (!allowed.includes(req.user.role)) {
      next(new AppError(403, "Forbidden"));
      return;
    }
    next();
  };
}
