import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import {
  createMaterialSchema,
  materialIdParamsSchema,
  listMaterialsQuerySchema,
} from "./materials.schema.js";
import * as materialsService from "./materials.service.js";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }
  return req.user;
}

function validation400(e: ZodError): never {
  throw new AppError(400, "Validation failed", e.flatten());
}

export async function createMaterial(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "HEADTEACHER" &&
    user.role !== "PRINCIPAL" &&
    user.role !== "SUBJECT_TEACHER"
  ) {
    throw new AppError(403, "Forbidden");
  }
  if (!req.file) {
    throw new AppError(400, "File is required");
  }

  try {
    const input = createMaterialSchema.parse(req.body);
    const result = await materialsService.createMaterial(
      user.schoolId,
      user.id,
      input,
      req.file
    );
    res.status(201).json(result);
  } catch (e) {
    if (e instanceof ZodError) validation400(e);
    throw e;
  }
}

export async function listMaterials(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  try {
    const query = listMaterialsQuerySchema.parse(req.query);
    const rows = await materialsService.listMaterials(user.schoolId, query);
    res.json({ materials: rows });
  } catch (e) {
    if (e instanceof ZodError) validation400(e);
    throw e;
  }
}

export async function signedUrl(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  try {
    const params = materialIdParamsSchema.parse(req.params);
    const result = await materialsService.createMaterialSignedUrl(user.schoolId, params.id);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) validation400(e);
    throw e;
  }
}
