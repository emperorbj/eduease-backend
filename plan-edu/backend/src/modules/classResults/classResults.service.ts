import { Types } from "mongoose";
import { AppError } from "../../middleware/errorHandler.js";
import { ClassTermAggregate } from "../../models/ClassTermAggregate.model.js";
import { Student } from "../../models/Student.model.js";
import { SubjectResult } from "../../models/SubjectResult.model.js";
import { TeachingAssignment } from "../../models/TeachingAssignment.model.js";
import { assertTermUnlocked } from "../../utils/termLock.js";
import type { ClassTermParams, UpdateCommentsInput } from "./classResults.schema.js";

interface CommentRow {
  studentId: Types.ObjectId;
  classTeacherComment?: string;
  headteacherComment?: string;
}

interface AggregateRow extends CommentRow {
  totalScore: number;
  average: number;
  subjectCount: number;
  passedSubjects: number;
  position: number;
}

interface StudentAggregateComputed {
  studentId: Types.ObjectId;
  totalScore: number;
  subjectCount: number;
  passedSubjects: number;
  average: number;
}

function oid(id: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${label}`);
  }
  return new Types.ObjectId(id);
}

export async function classSubmissionStatus(schoolId: string, params: ClassTermParams) {
  const assignments = await TeachingAssignment.aggregate<{
    subjectId: Types.ObjectId;
    teacherCount: number;
  }>([
    {
      $match: {
        schoolId: oid(schoolId, "schoolId"),
        classId: oid(params.classId, "classId"),
        termId: oid(params.termId, "termId"),
        isActive: true,
      },
    },
    { $group: { _id: "$subjectId", teacherCount: { $sum: 1 } } },
    { $project: { _id: 0, subjectId: "$_id", teacherCount: 1 } },
  ]);

  const lockedSubjects = await SubjectResult.aggregate<{
    subjectId: Types.ObjectId;
    total: number;
    lockedCount: number;
  }>([
    {
      $match: {
        schoolId: oid(schoolId, "schoolId"),
        classId: oid(params.classId, "classId"),
        termId: oid(params.termId, "termId"),
      },
    },
    {
      $group: {
        _id: "$subjectId",
        total: { $sum: 1 },
        lockedCount: { $sum: { $cond: ["$locked", 1, 0] } },
      },
    },
    { $project: { _id: 0, subjectId: "$_id", total: 1, lockedCount: 1 } },
  ]);

  const bySubject = new Map(
    lockedSubjects.map((s) => [
      s.subjectId.toString(),
      { total: s.total, lockedCount: s.lockedCount },
    ])
  );
  return assignments.map((a) => {
    const current = bySubject.get(a.subjectId.toString());
    const total = current?.total ?? 0;
    const lockedCount = current?.lockedCount ?? 0;
    return {
      subjectId: a.subjectId.toString(),
      totalRows: total,
      lockedRows: lockedCount,
      submitted: total > 0 && total === lockedCount,
    };
  });
}

export async function recomputeClassAggregate(schoolId: string, params: ClassTermParams) {
  await assertTermUnlocked(schoolId, params.termId);
  const rows = await SubjectResult.aggregate<StudentAggregateComputed>([
    {
      $match: {
        schoolId: oid(schoolId, "schoolId"),
        classId: oid(params.classId, "classId"),
        termId: oid(params.termId, "termId"),
      },
    },
    {
      $group: {
        _id: "$studentId",
        totalScore: { $sum: "$totalPercent" },
        subjectCount: { $sum: 1 },
        passedSubjects: { $sum: { $cond: ["$subjectPassed", 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        studentId: "$_id",
        totalScore: 1,
        subjectCount: 1,
        passedSubjects: 1,
        average: {
          $cond: [{ $eq: ["$subjectCount", 0] }, 0, { $divide: ["$totalScore", "$subjectCount"] }],
        },
      },
    },
    { $sort: { average: -1, totalScore: -1, studentId: 1 } },
  ]);

  const existing = await ClassTermAggregate.findOne({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
  });

  const existingRows = (existing?.rows ?? []) as CommentRow[];
  const commentMap = new Map<string, { classTeacherComment: string; headteacherComment: string }>(
    existingRows.map((r) => [
      r.studentId.toString(),
      {
        classTeacherComment: r.classTeacherComment ?? "",
        headteacherComment: r.headteacherComment ?? "",
      },
    ])
  );

  const normalized = rows.map((r, idx) => ({
    studentId: r.studentId,
    totalScore: Math.round(r.totalScore),
    average: Math.round(r.average * 100) / 100,
    subjectCount: r.subjectCount,
    passedSubjects: r.passedSubjects,
    position: idx + 1,
    classTeacherComment: commentMap.get(r.studentId.toString())?.classTeacherComment ?? "",
    headteacherComment: commentMap.get(r.studentId.toString())?.headteacherComment ?? "",
  }));

  const doc = await ClassTermAggregate.findOneAndUpdate(
    {
      schoolId: oid(schoolId, "schoolId"),
      classId: oid(params.classId, "classId"),
      termId: oid(params.termId, "termId"),
    },
    { $set: { generatedAt: new Date(), rows: normalized } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { generatedAt: doc.generatedAt, students: doc.rows.length };
}

export async function listClassStudentResults(schoolId: string, params: ClassTermParams) {
  const aggregate = await ClassTermAggregate.findOne({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
  });
  if (!aggregate) {
    throw new AppError(404, "Class aggregate not found. Run aggregate first.");
  }

  const aggregateRows = aggregate.rows as AggregateRow[];
  const studentIds = aggregateRows.map((r) => r.studentId);
  const students = await Student.find({
    _id: { $in: studentIds },
    schoolId: oid(schoolId, "schoolId"),
  });
  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

  return aggregateRows.map((r) => ({
    studentId: r.studentId.toString(),
    firstName: studentMap.get(r.studentId.toString())?.firstName ?? "",
    lastName: studentMap.get(r.studentId.toString())?.lastName ?? "",
    admissionNumber: studentMap.get(r.studentId.toString())?.admissionNumber ?? "",
    totalScore: r.totalScore,
    average: r.average,
    subjectCount: r.subjectCount,
    passedSubjects: r.passedSubjects,
    position: r.position,
    classTeacherComment: r.classTeacherComment ?? "",
    headteacherComment: r.headteacherComment ?? "",
  }));
}

export async function updateComments(
  schoolId: string,
  params: ClassTermParams,
  role: string,
  input: UpdateCommentsInput
) {
  await assertTermUnlocked(schoolId, params.termId);
  const aggregate = await ClassTermAggregate.findOne({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
  });
  if (!aggregate) {
    throw new AppError(404, "Class aggregate not found");
  }

  const aggregateRows = aggregate.rows as AggregateRow[];
  const byStudent = new Map(aggregateRows.map((r) => [r.studentId.toString(), r]));
  for (const row of input.comments) {
    const current = byStudent.get(row.studentId);
    if (!current) {
      continue;
    }
    if (role === "CLASS_TEACHER" && row.classTeacherComment !== undefined) {
      current.classTeacherComment = row.classTeacherComment;
    }
    if (role === "HEADTEACHER" && row.headteacherComment !== undefined) {
      current.headteacherComment = row.headteacherComment;
    }
  }
  aggregate.markModified("rows");
  await aggregate.save();
  return { updated: input.comments.length };
}
