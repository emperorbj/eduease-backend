import { FilterQuery, Types } from "mongoose";
import { AppError } from "../../middleware/errorHandler.js";
import { Student, type StudentDoc } from "../../models/Student.model.js";
import type {
  CreateStudentInput,
  ListStudentsQuery,
  UpdateStudentInput,
} from "./students.schema.js";
import { User } from "../../models/User.model.js";
import { SubjectResult } from "../../models/SubjectResult.model.js";

function toObjectId(id: string, name: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${name}`);
  }
  return new Types.ObjectId(id);
}

function isMongoDuplicateKey(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: number }).code === 11000;
}

type StudentLike = {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  department?: "SCIENCE" | "ARTS" | "COMMERCIAL" | null;
  admissionNumber: string;
  classId: Types.ObjectId;
  isActive?: boolean | null;
};

/** Public student shape for API responses (includes portal link flag). */
export async function serializeStudentForClient(schoolId: string, row: StudentLike) {
  const linked = await User.findOne({
    schoolId: toObjectId(schoolId, "schoolId"),
    studentId: row._id,
    role: "STUDENT",
  })
    .select("_id")
    .lean();

  return {
    _id: row._id.toString(),
    firstName: row.firstName,
    lastName: row.lastName,
    gender: row.gender,
    department: row.department ?? null,
    admissionNumber: row.admissionNumber,
    classId: row.classId.toString(),
    isActive: row.isActive ?? true,
    hasPortalAccount: Boolean(linked),
  };
}

export async function listStudents(schoolId: string, query: ListStudentsQuery) {
  const filter: FilterQuery<StudentDoc> = {
    schoolId: toObjectId(schoolId, "schoolId"),
  };
  if (query.classId) {
    filter.classId = toObjectId(query.classId, "classId");
  }
  if (query.q) {
    filter.$or = [
      { firstName: { $regex: query.q, $options: "i" } },
      { lastName: { $regex: query.q, $options: "i" } },
      { admissionNumber: { $regex: query.q, $options: "i" } },
    ];
  }

  const rows = await Student.find(filter).sort({ lastName: 1, firstName: 1 }).lean();
  if (rows.length === 0) {
    return [];
  }

  const schoolOid = toObjectId(schoolId, "schoolId");
  const studentObjectIds = rows.map((r) => r._id);
  const linkedUsers = await User.find({
    schoolId: schoolOid,
    studentId: { $in: studentObjectIds },
    role: "STUDENT",
  })
    .select("studentId")
    .lean();

  const withPortal = new Set(linkedUsers.map((u) => String(u.studentId)));

  return rows.map((r) => ({
    _id: String(r._id),
    firstName: r.firstName,
    lastName: r.lastName,
    gender: r.gender,
    department: r.department ?? null,
    admissionNumber: r.admissionNumber,
    classId: String(r.classId),
    isActive: r.isActive ?? true,
    hasPortalAccount: withPortal.has(String(r._id)),
  }));
}

export async function createStudent(schoolId: string, input: CreateStudentInput) {
  try {
    const { loginEmail: _loginEmail, loginPassword: _loginPassword, ...studentFields } = input;
    return await Student.create({
      schoolId: toObjectId(schoolId, "schoolId"),
      firstName: studentFields.firstName.trim(),
      lastName: studentFields.lastName.trim(),
      gender: studentFields.gender,
      department: studentFields.department ?? null,
      admissionNumber: studentFields.admissionNumber.trim(),
      classId: toObjectId(studentFields.classId, "classId"),
    });
  } catch (e) {
    if (isMongoDuplicateKey(e)) {
      throw new AppError(409, "Student admission number already exists");
    }
    throw e;
  }
}

export async function getMyStudentResults(
  schoolId: string,
  studentUserId: string,
  query: { termId: string }
) {
  const user = await User.findOne({
    _id: toObjectId(studentUserId, "user id"),
    schoolId: toObjectId(schoolId, "schoolId"),
  }).select("studentId");

  if (!user?.studentId) {
    throw new AppError(403, "No student record linked to this account");
  }

  const student = await Student.findOne({
    _id: toObjectId(String(user.studentId), "studentId"),
    schoolId: toObjectId(schoolId, "schoolId"),
  }).select("firstName lastName gender department admissionNumber classId");

  if (!student) {
    throw new AppError(404, "Student record not found");
  }

  const results = await SubjectResult.find({
    schoolId: toObjectId(schoolId, "schoolId"),
    termId: toObjectId(query.termId, "termId"),
    classId: toObjectId(student.classId.toString(), "classId"),
    studentId: toObjectId(student._id.toString(), "studentId"),
  })
    .populate("subjectId", "name code")
    .sort({ "subjectId.code": 1 });

  const subjectResults = results.map((r) => ({
    subjectId: r.subjectId.toString(),
    subjectName: (r.subjectId as unknown as { name?: string }).name ?? "",
    subjectCode: (r.subjectId as unknown as { code?: string }).code ?? "",
    test1: r.test1,
    test2: r.test2,
    exam: r.exam,
    totalPercent: r.totalPercent,
    grade: r.grade,
    remark: r.remark,
    subjectPassed: r.subjectPassed,
    locked: r.locked,
    submittedAt: r.submittedAt,
  }));

  const subjectCount = subjectResults.length;
  const totalScore = subjectResults.reduce((sum, r) => sum + r.totalPercent, 0);
  const passedSubjects = subjectResults.reduce(
    (sum, r) => sum + (r.subjectPassed ? 1 : 0),
    0
  );
  const average = subjectCount > 0 ? totalScore / subjectCount : 0;

  return {
    termId: query.termId,
    classId: student.classId.toString(),
    student: {
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      department: student.department ?? null,
      admissionNumber: student.admissionNumber,
      studentId: student._id.toString(),
    },
    results: subjectResults,
    aggregate: {
      subjectCount,
      passedSubjects,
      totalScore: Math.round(totalScore),
      average: Math.round(average * 100) / 100,
    },
  };
}

export async function getStudent(schoolId: string, studentId: string) {
  const row = await Student.findOne({
    _id: toObjectId(studentId, "studentId"),
    schoolId: toObjectId(schoolId, "schoolId"),
  });
  if (!row) {
    throw new AppError(404, "Student not found");
  }
  return row;
}

export async function updateStudent(
  schoolId: string,
  studentId: string,
  input: UpdateStudentInput
) {
  const payload: Record<string, unknown> = { ...input };
  if (input.classId !== undefined) {
    payload.classId = toObjectId(input.classId, "classId");
  }
  const row = await Student.findOneAndUpdate(
    {
      _id: toObjectId(studentId, "studentId"),
      schoolId: toObjectId(schoolId, "schoolId"),
    },
    payload,
    { new: true, runValidators: true }
  );
  if (!row) {
    throw new AppError(404, "Student not found");
  }
  return row;
}

export async function deleteStudent(schoolId: string, studentId: string) {
  const row = await Student.findOneAndDelete({
    _id: toObjectId(studentId, "studentId"),
    schoolId: toObjectId(schoolId, "schoolId"),
  });
  if (!row) {
    throw new AppError(404, "Student not found");
  }
  return { deleted: true };
}
