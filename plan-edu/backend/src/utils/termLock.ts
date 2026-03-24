import { Types } from "mongoose";
import { AppError } from "../middleware/errorHandler.js";
import { TermLock } from "../models/TermLock.model.js";

function oid(id: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${label}`);
  }
  return new Types.ObjectId(id);
}

export async function assertTermUnlocked(schoolId: string, termId: string): Promise<void> {
  const lock = await TermLock.findOne({
    schoolId: oid(schoolId, "schoolId"),
    termId: oid(termId, "termId"),
    locked: true,
  }).lean();
  if (lock) {
    throw new AppError(409, "Term is locked by principal");
  }
}
