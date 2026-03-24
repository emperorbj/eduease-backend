import { FilterQuery, Types } from "mongoose";
import { AppError } from "../../middleware/errorHandler.js";
import { Student, type StudentDoc } from "../../models/Student.model.js";
import type {
  CreateStudentInput,
  ListStudentsQuery,
  UpdateStudentInput,
} from "./students.schema.js";

function toObjectId(id: string, name: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${name}`);
  }
  return new Types.ObjectId(id);
}

function isMongoDuplicateKey(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: number }).code === 11000;
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
  return Student.find(filter).sort({ lastName: 1, firstName: 1 });
}

export async function createStudent(schoolId: string, input: CreateStudentInput) {
  try {
    return await Student.create({
      schoolId: toObjectId(schoolId, "schoolId"),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      admissionNumber: input.admissionNumber.trim(),
      classId: toObjectId(input.classId, "classId"),
    });
  } catch (e) {
    if (isMongoDuplicateKey(e)) {
      throw new AppError(409, "Student admission number already exists");
    }
    throw e;
  }
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
