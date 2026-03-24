import { Types } from "mongoose";
import { AppError } from "../../middleware/errorHandler.js";
import { AcademicClass } from "../../models/AcademicClass.model.js";
import { Session } from "../../models/Session.model.js";
import { Subject } from "../../models/Subject.model.js";
import { TeachingAssignment } from "../../models/TeachingAssignment.model.js";
import { Term } from "../../models/Term.model.js";
import {
  type CreateClassInput,
  type CreateSessionInput,
  type CreateSubjectInput,
  type CreateTeachingAssignmentInput,
  type CreateTermInput,
  type UpdateClassInput,
  type UpdateSessionInput,
  type UpdateSubjectInput,
  type UpdateTermInput,
} from "./admin.schema.js";

function toSchoolObjectId(schoolId: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(schoolId)) {
    throw new AppError(400, "Invalid school id");
  }
  return new Types.ObjectId(schoolId);
}

function toObjectId(id: string, fieldName = "id"): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${fieldName}`);
  }
  return new Types.ObjectId(id);
}

function isMongoDuplicateKey(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: number }).code === 11000;
}

export async function listSessions(schoolId: string) {
  return Session.find({ schoolId: toSchoolObjectId(schoolId) }).sort({ createdAt: -1 });
}

export async function createSession(schoolId: string, input: CreateSessionInput) {
  try {
    return await Session.create({
      schoolId: toSchoolObjectId(schoolId),
      name: input.name.trim(),
      isActive: input.isActive ?? false,
    });
  } catch (e) {
    if (isMongoDuplicateKey(e)) {
      throw new AppError(409, "Session name already exists");
    }
    throw e;
  }
}

export async function updateSession(schoolId: string, id: string, input: UpdateSessionInput) {
  const session = await Session.findOneAndUpdate(
    { _id: toObjectId(id), schoolId: toSchoolObjectId(schoolId) },
    input,
    { new: true, runValidators: true }
  );
  if (!session) {
    throw new AppError(404, "Session not found");
  }
  return session;
}

export async function listTerms(schoolId: string, sessionId?: string) {
  const filter: { schoolId: Types.ObjectId; sessionId?: Types.ObjectId } = {
    schoolId: toSchoolObjectId(schoolId),
  };
  if (sessionId) {
    filter.sessionId = toObjectId(sessionId, "sessionId");
  }
  return Term.find(filter).sort({ sessionId: 1, order: 1 });
}

export async function createTerm(schoolId: string, input: CreateTermInput) {
  try {
    return await Term.create({
      schoolId: toSchoolObjectId(schoolId),
      sessionId: toObjectId(input.sessionId, "sessionId"),
      name: input.name.trim(),
      order: input.order,
      isActive: input.isActive ?? false,
    });
  } catch (e) {
    if (isMongoDuplicateKey(e)) {
      throw new AppError(409, "Term order already exists for this session");
    }
    throw e;
  }
}

export async function updateTerm(schoolId: string, id: string, input: UpdateTermInput) {
  const payload: Record<string, unknown> = { ...input };
  if (input.order !== undefined) {
    payload.order = input.order;
  }
  const term = await Term.findOneAndUpdate(
    { _id: toObjectId(id), schoolId: toSchoolObjectId(schoolId) },
    payload,
    { new: true, runValidators: true }
  );
  if (!term) {
    throw new AppError(404, "Term not found");
  }
  return term;
}

export async function listClasses(schoolId: string) {
  return AcademicClass.find({ schoolId: toSchoolObjectId(schoolId) }).sort({ name: 1, arm: 1 });
}

export async function createClass(schoolId: string, input: CreateClassInput) {
  try {
    return await AcademicClass.create({
      schoolId: toSchoolObjectId(schoolId),
      name: input.name.trim(),
      arm: input.arm.trim(),
    });
  } catch (e) {
    if (isMongoDuplicateKey(e)) {
      throw new AppError(409, "Class with this name and arm already exists");
    }
    throw e;
  }
}

export async function updateClass(schoolId: string, id: string, input: UpdateClassInput) {
  const payload: Record<string, unknown> = { ...input };
  if (input.classTeacherUserId !== undefined) {
    payload.classTeacherUserId = input.classTeacherUserId
      ? toObjectId(input.classTeacherUserId, "classTeacherUserId")
      : null;
  }
  const row = await AcademicClass.findOneAndUpdate(
    { _id: toObjectId(id), schoolId: toSchoolObjectId(schoolId) },
    payload,
    { new: true, runValidators: true }
  );
  if (!row) {
    throw new AppError(404, "Class not found");
  }
  return row;
}

export async function listSubjects(schoolId: string) {
  return Subject.find({ schoolId: toSchoolObjectId(schoolId) }).sort({ name: 1 });
}

export async function createSubject(schoolId: string, input: CreateSubjectInput) {
  try {
    return await Subject.create({
      schoolId: toSchoolObjectId(schoolId),
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      isActive: input.isActive ?? true,
    });
  } catch (e) {
    if (isMongoDuplicateKey(e)) {
      throw new AppError(409, "Subject code already exists");
    }
    throw e;
  }
}

export async function updateSubject(schoolId: string, id: string, input: UpdateSubjectInput) {
  const payload: Record<string, unknown> = { ...input };
  if (input.code !== undefined) {
    payload.code = input.code.trim().toUpperCase();
  }
  const row = await Subject.findOneAndUpdate(
    { _id: toObjectId(id), schoolId: toSchoolObjectId(schoolId) },
    payload,
    { new: true, runValidators: true }
  );
  if (!row) {
    throw new AppError(404, "Subject not found");
  }
  return row;
}

export async function createTeachingAssignment(
  schoolId: string,
  input: CreateTeachingAssignmentInput
) {
  try {
    return await TeachingAssignment.create({
      schoolId: toSchoolObjectId(schoolId),
      teacherUserId: toObjectId(input.teacherUserId, "teacherUserId"),
      classId: toObjectId(input.classId, "classId"),
      subjectId: toObjectId(input.subjectId, "subjectId"),
      termId: toObjectId(input.termId, "termId"),
      isActive: input.isActive ?? true,
    });
  } catch (e) {
    if (isMongoDuplicateKey(e)) {
      throw new AppError(409, "Teaching assignment already exists");
    }
    throw e;
  }
}
