import { Types } from "mongoose";
import { AppError } from "../../middleware/errorHandler.js";
import { Student } from "../../models/Student.model.js";
import { SubjectResult } from "../../models/SubjectResult.model.js";
import { TeachingAssignment } from "../../models/TeachingAssignment.model.js";
import { computeSubjectResult } from "../../utils/grading.js";
import { assertTermUnlocked } from "../../utils/termLock.js";
import type {
  PutScoreSheetInput,
  ScoreSheetQuery,
  SubmissionStatusQuery,
  SubmitInput,
} from "./assessments.schema.js";

function oid(id: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${label}`);
  }
  return new Types.ObjectId(id);
}

async function assertTeacherAssignment(
  schoolId: string,
  teacherUserId: string,
  classId: string,
  subjectId: string,
  termId: string
) {
  const row = await TeachingAssignment.findOne({
    schoolId: oid(schoolId, "schoolId"),
    teacherUserId: oid(teacherUserId, "teacherUserId"),
    classId: oid(classId, "classId"),
    subjectId: oid(subjectId, "subjectId"),
    termId: oid(termId, "termId"),
    isActive: true,
  });
  if (!row) {
    throw new AppError(403, "No teaching assignment for this class/subject/term");
  }
}

export async function listTeachingContexts(schoolId: string, teacherUserId: string) {
  return TeachingAssignment.find({
    schoolId: oid(schoolId, "schoolId"),
    teacherUserId: oid(teacherUserId, "teacherUserId"),
    isActive: true,
  })
    .populate("classId", "name arm")
    .populate("subjectId", "name code")
    .populate("termId", "name order")
    .sort({ createdAt: -1 });
}

export async function getScoreSheet(
  schoolId: string,
  teacherUserId: string,
  query: ScoreSheetQuery
) {
  await assertTeacherAssignment(
    schoolId,
    teacherUserId,
    query.classId,
    query.subjectId,
    query.termId
  );

  const students = await Student.find({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(query.classId, "classId"),
    isActive: true,
  }).sort({ lastName: 1, firstName: 1 });

  const results = await SubjectResult.find({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(query.classId, "classId"),
    subjectId: oid(query.subjectId, "subjectId"),
    termId: oid(query.termId, "termId"),
  });

  const byStudentId = new Map(results.map((r) => [r.studentId.toString(), r]));
  return students.map((s) => {
    const existing = byStudentId.get(s._id.toString());
    return {
      studentId: s._id.toString(),
      firstName: s.firstName,
      lastName: s.lastName,
      admissionNumber: s.admissionNumber,
      test1: existing?.test1 ?? 0,
      test2: existing?.test2 ?? 0,
      exam: existing?.exam ?? 0,
      totalPercent: existing?.totalPercent ?? 0,
      grade: existing?.grade ?? null,
      remark: existing?.remark ?? null,
      subjectPassed: existing?.subjectPassed ?? false,
      locked: existing?.locked ?? false,
      submittedAt: existing?.submittedAt ?? null,
    };
  });
}

export async function putScoreSheet(
  schoolId: string,
  teacherUserId: string,
  input: PutScoreSheetInput
) {
  await assertTermUnlocked(schoolId, input.termId);
  await assertTeacherAssignment(
    schoolId,
    teacherUserId,
    input.classId,
    input.subjectId,
    input.termId
  );

  const existing = await SubjectResult.find({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(input.classId, "classId"),
    subjectId: oid(input.subjectId, "subjectId"),
    termId: oid(input.termId, "termId"),
    studentId: { $in: input.rows.map((r) => oid(r.studentId, "studentId")) },
  });
  if (existing.some((r) => r.locked)) {
    throw new AppError(409, "Score sheet is already submitted and locked");
  }

  const ops = input.rows.map((row) => {
    const derived = computeSubjectResult({
      test1: row.test1,
      test2: row.test2,
      exam: row.exam,
    });
    return {
      updateOne: {
        filter: {
          schoolId: oid(schoolId, "schoolId"),
          classId: oid(input.classId, "classId"),
          subjectId: oid(input.subjectId, "subjectId"),
          termId: oid(input.termId, "termId"),
          studentId: oid(row.studentId, "studentId"),
        },
        update: {
          $set: {
            teacherUserId: oid(teacherUserId, "teacherUserId"),
            test1: derived.test1,
            test2: derived.test2,
            exam: derived.exam,
            totalPercent: derived.totalPercent,
            grade: derived.grade,
            remark: derived.remark,
            subjectPassed: derived.subjectPassed,
          },
          $setOnInsert: {
            schoolId: oid(schoolId, "schoolId"),
            classId: oid(input.classId, "classId"),
            subjectId: oid(input.subjectId, "subjectId"),
            termId: oid(input.termId, "termId"),
            studentId: oid(row.studentId, "studentId"),
          },
        },
        upsert: true,
      },
    };
  });

  await SubjectResult.bulkWrite(ops);
  return { updated: input.rows.length };
}

export async function submitScores(
  schoolId: string,
  teacherUserId: string,
  input: SubmitInput
) {
  await assertTermUnlocked(schoolId, input.termId);
  await assertTeacherAssignment(
    schoolId,
    teacherUserId,
    input.classId,
    input.subjectId,
    input.termId
  );

  const result = await SubjectResult.updateMany(
    {
      schoolId: oid(schoolId, "schoolId"),
      classId: oid(input.classId, "classId"),
      subjectId: oid(input.subjectId, "subjectId"),
      termId: oid(input.termId, "termId"),
      locked: { $ne: true },
    },
    { $set: { locked: true, submittedAt: new Date() } }
  );

  return { lockedRows: result.modifiedCount };
}

export async function submissionStatus(
  schoolId: string,
  classTeacherClassId: string,
  query: SubmissionStatusQuery
) {
  if (query.classId !== classTeacherClassId) {
    throw new AppError(403, "Class teacher can only view own class status");
  }
  const rows = await SubjectResult.aggregate<{
    subjectId: Types.ObjectId;
    total: number;
    lockedCount: number;
  }>([
    {
      $match: {
        schoolId: oid(schoolId, "schoolId"),
        classId: oid(query.classId, "classId"),
        termId: oid(query.termId, "termId"),
      },
    },
    {
      $group: {
        _id: "$subjectId",
        total: { $sum: 1 },
        lockedCount: { $sum: { $cond: ["$locked", 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        subjectId: "$_id",
        total: 1,
        lockedCount: 1,
        submitted: { $eq: ["$total", "$lockedCount"] },
      },
    },
  ]);
  return rows;
}
