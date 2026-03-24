import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import {
  lowPerformanceAlertSchema,
  resultReleaseSchema,
} from "./notifications.schema.js";
import * as notificationsService from "./notifications.service.js";

function requireLeadership(req: Request) {
  if (!req.user) throw new AppError(401, "Authentication required");
  if (
    req.user.role !== "PRINCIPAL" &&
    req.user.role !== "HEADTEACHER" &&
    req.user.role !== "ADMIN" &&
    req.user.role !== "SUPER_ADMIN"
  ) {
    throw new AppError(403, "Forbidden");
  }
  return req.user;
}

function z400(e: ZodError): never {
  throw new AppError(400, "Validation failed", e.flatten());
}

export async function resultReleased(req: Request, res: Response): Promise<void> {
  const user = requireLeadership(req);
  try {
    const input = resultReleaseSchema.parse(req.body);
    const result = await notificationsService.sendResultReleased(
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

export async function lowPerformanceAlert(req: Request, res: Response): Promise<void> {
  const user = requireLeadership(req);
  try {
    const input = lowPerformanceAlertSchema.parse(req.body);
    const result = await notificationsService.sendLowPerformanceAlert(
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
