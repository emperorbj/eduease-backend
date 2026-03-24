import { Router } from "express";
import multer from "multer";
import { env } from "../../config/env.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as materialsController from "./materials.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});

export const materialsRouter = Router();
materialsRouter.use(authenticate);

materialsRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(materialsController.createMaterial)
);
materialsRouter.get("/", asyncHandler(materialsController.listMaterials));
materialsRouter.get("/:id/signed-url", asyncHandler(materialsController.signedUrl));
