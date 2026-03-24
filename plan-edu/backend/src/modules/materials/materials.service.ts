import { randomUUID } from "crypto";
import { Types } from "mongoose";
import { env } from "../../config/env.js";
import { getSupabase } from "../../config/supabase.js";
import { AppError } from "../../middleware/errorHandler.js";
import { Material } from "../../models/Material.model.js";
import type { CreateMaterialInput, ListMaterialsQuery } from "./materials.schema.js";

const MATERIALS_BUCKET = "materials";

function oid(id: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${label}`);
  }
  return new Types.ObjectId(id);
}

export async function createMaterial(
  schoolId: string,
  uploadedByUserId: string,
  input: CreateMaterialInput,
  file: Express.Multer.File
) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new AppError(500, "Supabase is not configured");
  }

  const safeName = file.originalname.replace(/[^\w.-]+/g, "_");
  const path = `${schoolId}/${input.classId}/${input.subjectId}/${Date.now()}-${randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
  if (error) {
    throw new AppError(502, `Material upload failed: ${error.message}`);
  }

  const row = await Material.create({
    schoolId: oid(schoolId, "schoolId"),
    title: input.title.trim(),
    classId: oid(input.classId, "classId"),
    subjectId: oid(input.subjectId, "subjectId"),
    bucket: MATERIALS_BUCKET,
    path,
    mimeType: file.mimetype || "application/octet-stream",
    size: file.size,
    uploadedByUserId: oid(uploadedByUserId, "uploadedByUserId"),
  });
  return {
    material: row,
    maxUploadMb: env.MAX_UPLOAD_MB,
  };
}

export async function listMaterials(schoolId: string, query: ListMaterialsQuery) {
  const filter: {
    schoolId: Types.ObjectId;
    classId?: Types.ObjectId;
    subjectId?: Types.ObjectId;
  } = {
    schoolId: oid(schoolId, "schoolId"),
  };
  if (query.classId) {
    filter.classId = oid(query.classId, "classId");
  }
  if (query.subjectId) {
    filter.subjectId = oid(query.subjectId, "subjectId");
  }
  return Material.find(filter).sort({ createdAt: -1 });
}

export async function createMaterialSignedUrl(schoolId: string, materialId: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new AppError(500, "Supabase is not configured");
  }
  const material = await Material.findOne({
    _id: oid(materialId, "material id"),
    schoolId: oid(schoolId, "schoolId"),
  });
  if (!material) {
    throw new AppError(404, "Material not found");
  }

  const { data, error } = await supabase.storage
    .from(material.bucket)
    .createSignedUrl(material.path, env.MATERIAL_SIGNED_URL_EXPIRES_SEC);
  if (error || !data?.signedUrl) {
    throw new AppError(502, `Unable to create signed URL: ${error?.message ?? "unknown"}`);
  }

  return {
    materialId: material._id.toString(),
    signedUrl: data.signedUrl,
    expiresInSeconds: env.MATERIAL_SIGNED_URL_EXPIRES_SEC,
  };
}
