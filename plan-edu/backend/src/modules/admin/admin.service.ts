import { Types } from "mongoose";
import { AppError } from "../../middleware/errorHandler.js";
import { AcademicClass } from "../../models/AcademicClass.model.js";
import { Session } from "../../models/Session.model.js";
import { Subject } from "../../models/Subject.model.js";
import { TeachingAssignment } from "../../models/TeachingAssignment.model.js";
import { Term } from "../../models/Term.model.js";
import { User } from "../../models/User.model.js";
import {
  type CreateClassInput,
  type CreateSessionInput,
  type CreateSubjectInput,
  type CreateTeachingAssignmentInput,
  type CreateTermInput,
  type UnassignTeachingAssignmentInput,
  type UpdateClassInput,
  type UpdateSessionInput,
  type UpdateSubjectInput,
  type UpdateTermInput,
  type UpdateUserInput,
  type ClassCoverageQuery,
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

interface PopulatedTeacher {
  _id: Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PopulatedSubject {
  _id: Types.ObjectId;
  name: string;
  code: string;
}

interface PopulatedTerm {
  _id: Types.ObjectId;
  name: string;
  order: number;
}

function isPopulatedTeacher(
  ref: Types.ObjectId | PopulatedTeacher | null
): ref is PopulatedTeacher {
  return typeof ref === "object" && ref !== null && "_id" in ref && "email" in ref;
}

function isPopulatedSubject(
  ref: Types.ObjectId | PopulatedSubject | null
): ref is PopulatedSubject {
  return typeof ref === "object" && ref !== null && "_id" in ref && "name" in ref && "code" in ref;
}

function isPopulatedTerm(ref: Types.ObjectId | PopulatedTerm | null): ref is PopulatedTerm {
  return typeof ref === "object" && ref !== null && "_id" in ref && "order" in ref;
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

export async function deleteSession(schoolId: string, id: string) {
  const row = await Session.findOneAndDelete({
    _id: toObjectId(id),
    schoolId: toSchoolObjectId(schoolId),
  });
  if (!row) {
    throw new AppError(404, "Session not found");
  }
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

export async function deleteClass(schoolId: string, id: string) {
  const row = await AcademicClass.findOneAndDelete({
    _id: toObjectId(id),
    schoolId: toSchoolObjectId(schoolId),
  });
  if (!row) {
    throw new AppError(404, "Class not found");
  }
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
      isCompulsoryForAll: input.isCompulsoryForAll ?? false,
      departmentsApplicable: input.departmentsApplicable ?? [
        "SCIENCE",
        "ARTS",
        "COMMERCIAL",
      ],
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

export async function deleteSubject(schoolId: string, id: string) {
  const row = await Subject.findOneAndDelete({
    _id: toObjectId(id),
    schoolId: toSchoolObjectId(schoolId),
  });
  if (!row) {
    throw new AppError(404, "Subject not found");
  }
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

export async function unassignTeachingAssignment(
  schoolId: string,
  input: UnassignTeachingAssignmentInput
) {
  const row = await TeachingAssignment.findOneAndUpdate(
    {
      schoolId: toSchoolObjectId(schoolId),
      teacherUserId: toObjectId(input.teacherUserId, "teacherUserId"),
      classId: toObjectId(input.classId, "classId"),
      subjectId: toObjectId(input.subjectId, "subjectId"),
      termId: toObjectId(input.termId, "termId"),
    },
    { $set: { isActive: false } },
    { new: true }
  );
  if (!row) {
    throw new AppError(404, "Teaching assignment not found");
  }
  return row;
}

export async function getClassSubjectTeacherCoverage(
  schoolId: string,
  query: ClassCoverageQuery
) {
  const klass = await AcademicClass.findOne({
    _id: toObjectId(query.classId, "classId"),
    schoolId: toSchoolObjectId(schoolId),
  });
  if (!klass) {
    throw new AppError(404, "Class not found");
  }

  const filter: {
    schoolId: Types.ObjectId;
    classId: Types.ObjectId;
    isActive: boolean;
    termId?: Types.ObjectId;
  } = {
    schoolId: toSchoolObjectId(schoolId),
    classId: toObjectId(query.classId, "classId"),
    isActive: true,
  };
  if (query.termId) {
    filter.termId = toObjectId(query.termId, "termId");
  }

  const assignments = (await TeachingAssignment.find(filter)
    .populate("teacherUserId", "email firstName lastName role")
    .populate("subjectId", "name code")
    .populate("termId", "name order")
    .sort({ teacherUserId: 1, subjectId: 1 })
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    teacherUserId: Types.ObjectId | PopulatedTeacher | null;
    classId: Types.ObjectId;
    subjectId: Types.ObjectId | PopulatedSubject | null;
    termId: Types.ObjectId | PopulatedTerm | null;
  }>;

  const assignedTeacherIds = new Set<string>();
  const assignmentRows = assignments.map((a) => {
    const rawTeacher = a.teacherUserId;
    const tid =
      rawTeacher &&
      typeof rawTeacher === "object" &&
      "_id" in rawTeacher &&
      rawTeacher._id
        ? rawTeacher._id.toString()
        : String(a.teacherUserId);
    assignedTeacherIds.add(tid);

    const rawSubject = a.subjectId;
    const rawTerm = a.termId;

    const teacherPop = isPopulatedTeacher(rawTeacher) ? rawTeacher : null;
    const subjectPop = isPopulatedSubject(rawSubject) ? rawSubject : null;
    const termPop = isPopulatedTerm(rawTerm) ? rawTerm : null;

    return {
      id: a._id.toString(),
      teacherUserId: tid,
      teacher: teacherPop
        ? {
            id: teacherPop._id.toString(),
            email: teacherPop.email,
            firstName: teacherPop.firstName,
            lastName: teacherPop.lastName,
            role: teacherPop.role,
          }
        : null,
      classId: a.classId.toString(),
      subjectId: subjectPop ? subjectPop._id.toString() : String(a.subjectId),
      subject: subjectPop
        ? {
            id: subjectPop._id.toString(),
            name: subjectPop.name,
            code: subjectPop.code,
          }
        : null,
      termId: termPop ? termPop._id.toString() : String(a.termId),
      term: termPop
        ? {
            id: termPop._id.toString(),
            name: termPop.name,
            order: termPop.order,
          }
        : null,
    };
  });

  const allSubjectTeachers = (await User.find({
    schoolId: toSchoolObjectId(schoolId),
    role: "SUBJECT_TEACHER",
    isActive: true,
  })
    .sort({ lastName: 1, firstName: 1 })
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;

  const unassignedSubjectTeachers = allSubjectTeachers
    .filter((u) => !assignedTeacherIds.has(u._id.toString()))
    .map((u) => ({
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
    }));

  const assignedSubjectTeachers = allSubjectTeachers
    .filter((u) => assignedTeacherIds.has(u._id.toString()))
    .map((u) => ({
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
    }));

  const assignedNotInSubjectTeacherRole = [...assignedTeacherIds].filter(
    (id) => !allSubjectTeachers.some((u) => u._id.toString() === id)
  );

  return {
    classId: query.classId,
    termId: query.termId ?? null,
    scopeNote: query.termId
      ? "Active assignments for this class and term only."
      : "Active assignments for this class across all terms.",
    assignments: assignmentRows,
    assignedSubjectTeachers,
    unassignedSubjectTeachers,
    assignedTeacherIdsNotSubjectTeacherRole: assignedNotInSubjectTeacherRole,
  };
}

export async function listUsers(schoolId: string) {
  const rows = await User.find({ schoolId: toSchoolObjectId(schoolId) }).sort({
    createdAt: -1,
  });
  return rows.map((u) => ({
    id: u._id.toString(),
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    schoolId: u.schoolId.toString(),
    classTeacherClassId: u.classTeacherClassId?.toString() ?? null,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

export async function getUserById(schoolId: string, userId: string) {
  const u = await User.findOne({
    _id: toObjectId(userId, "user id"),
    schoolId: toSchoolObjectId(schoolId),
  });
  if (!u) {
    throw new AppError(404, "User not found");
  }
  return {
    id: u._id.toString(),
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    schoolId: u.schoolId.toString(),
    classTeacherClassId: u.classTeacherClassId?.toString() ?? null,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export async function updateUser(
  schoolId: string,
  userId: string,
  input: UpdateUserInput
) {
  const payload: Record<string, unknown> = { ...input };
  if (input.email !== undefined) {
    payload.email = input.email.toLowerCase().trim();
  }
  if (input.classTeacherClassId !== undefined) {
    payload.classTeacherClassId = input.classTeacherClassId
      ? toObjectId(input.classTeacherClassId, "classTeacherClassId")
      : null;
  }
  try {
    const row = await User.findOneAndUpdate(
      {
        _id: toObjectId(userId, "user id"),
        schoolId: toSchoolObjectId(schoolId),
      },
      payload,
      { new: true, runValidators: true }
    );
    if (!row) {
      throw new AppError(404, "User not found");
    }
    return {
      id: row._id.toString(),
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      schoolId: row.schoolId.toString(),
      classTeacherClassId: row.classTeacherClassId?.toString() ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (e) {
    if (isMongoDuplicateKey(e)) {
      throw new AppError(409, "A user with this email already exists in this school");
    }
    throw e;
  }
}

export async function deleteUser(schoolId: string, userId: string) {
  const row = await User.findOneAndDelete({
    _id: toObjectId(userId, "user id"),
    schoolId: toSchoolObjectId(schoolId),
  });
  if (!row) {
    throw new AppError(404, "User not found");
  }
}
