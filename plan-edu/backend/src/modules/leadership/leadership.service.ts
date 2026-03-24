import { Types } from "mongoose";
import { AppError } from "../../middleware/errorHandler.js";
import { AcademicClass } from "../../models/AcademicClass.model.js";
import { ClassTermAggregate } from "../../models/ClassTermAggregate.model.js";
import { PromotionDecision } from "../../models/PromotionDecision.model.js";
import { Student } from "../../models/Student.model.js";
import { SubjectResult } from "../../models/SubjectResult.model.js";
import { TermLock } from "../../models/TermLock.model.js";
import type {
  ApprovePromotionsInput,
  ClassStudentsParams,
  OverviewQuery,
  PromotionPreviewQuery,
  StudentPerformanceParams,
  StudentPerformanceQuery,
} from "./leadership.schema.js";

function oid(id: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new AppError(400, `Invalid ${label}`);
  return new Types.ObjectId(id);
}

interface AggregateRow {
  studentId: Types.ObjectId;
  average: number;
  position: number;
  totalScore: number;
  subjectCount: number;
  passedSubjects: number;
  classTeacherComment?: string;
  headteacherComment?: string;
}

interface AggregateDoc {
  classId: Types.ObjectId;
  rows: AggregateRow[];
}

interface LeanStudent {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  admissionNumber: string;
}

export async function schoolOverview(schoolId: string, query: OverviewQuery) {
  const termId = oid(query.termId, "termId");
  const aggregates = (await ClassTermAggregate.find({
    schoolId: oid(schoolId, "schoolId"),
    termId,
  }).lean()) as unknown as AggregateDoc[];

  let students = 0;
  let passRows = 0;
  let avgSum = 0;
  for (const ag of aggregates) {
    for (const row of ag.rows ?? []) {
      students += 1;
      avgSum += row.average ?? 0;
      if ((row.passedSubjects ?? 0) >= Math.max(1, Math.ceil((row.subjectCount ?? 0) / 2))) {
        passRows += 1;
      }
    }
  }
  return {
    classes: aggregates.length,
    students,
    avgPerformance: students === 0 ? 0 : Math.round((avgSum / students) * 100) / 100,
    passRatePercent: students === 0 ? 0 : Math.round((passRows / students) * 10000) / 100,
  };
}

export async function classesOverview(schoolId: string, query: OverviewQuery) {
  const classRows = await AcademicClass.find({
    schoolId: oid(schoolId, "schoolId"),
    isActive: true,
  }).sort({ name: 1, arm: 1 });

  const aggregates = (await ClassTermAggregate.find({
    schoolId: oid(schoolId, "schoolId"),
    termId: oid(query.termId, "termId"),
  }).lean()) as unknown as AggregateDoc[];

  const byClass = new Map(aggregates.map((a) => [a.classId.toString(), a]));
  return classRows.map((c) => {
    const ag = byClass.get(c._id.toString());
    const rows = ag?.rows ?? [];
    const avg = rows.length ? rows.reduce((s, r) => s + (r.average ?? 0), 0) / rows.length : 0;
    return {
      classId: c._id.toString(),
      name: c.name,
      arm: c.arm,
      rollCount: rows.length,
      avgPerformance: Math.round(avg * 100) / 100,
    };
  });
}

export async function classStudents(schoolId: string, params: ClassStudentsParams) {
  const aggregate = (await ClassTermAggregate.findOne({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
  }).lean()) as unknown as AggregateDoc | null;
  if (!aggregate) {
    throw new AppError(404, "Class aggregate not found");
  }

  const studentIds = (aggregate.rows ?? []).map((r) => r.studentId);
  const students = (await Student.find({
    _id: { $in: studentIds },
    schoolId: oid(schoolId, "schoolId"),
  }).lean()) as unknown as LeanStudent[];
  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

  return (aggregate.rows ?? []).map((r) => ({
    studentId: r.studentId.toString(),
    firstName: studentMap.get(r.studentId.toString())?.firstName ?? "",
    lastName: studentMap.get(r.studentId.toString())?.lastName ?? "",
    admissionNumber: studentMap.get(r.studentId.toString())?.admissionNumber ?? "",
    average: r.average,
    position: r.position,
    totalScore: r.totalScore,
    subjectCount: r.subjectCount,
    passedSubjects: r.passedSubjects,
    classTeacherComment: r.classTeacherComment ?? "",
    headteacherComment: r.headteacherComment ?? "",
  }));
}

export async function studentPerformance(
  schoolId: string,
  params: StudentPerformanceParams,
  query: StudentPerformanceQuery
) {
  const filter: {
    schoolId: Types.ObjectId;
    studentId: Types.ObjectId;
    termId?: Types.ObjectId;
  } = {
    schoolId: oid(schoolId, "schoolId"),
    studentId: oid(params.studentId, "studentId"),
  };
  if (query.termId) {
    filter.termId = oid(query.termId, "termId");
  }
  const rows = await SubjectResult.find(filter)
    .populate("subjectId", "name code")
    .sort({ termId: 1, subjectId: 1 })
    .lean();
  return rows.map((r) => ({
    termId: r.termId.toString(),
    subjectId: r.subjectId?._id?.toString?.() ?? "",
    subjectName: (r.subjectId as { name?: string } | undefined)?.name ?? "",
    test1: r.test1,
    test2: r.test2,
    exam: r.exam,
    totalPercent: r.totalPercent,
    grade: r.grade,
    remark: r.remark,
    subjectPassed: r.subjectPassed,
  }));
}

export async function promotionPreview(schoolId: string, query: PromotionPreviewQuery) {
  const aggregates = (await ClassTermAggregate.find({
    schoolId: oid(schoolId, "schoolId"),
    termId: oid(query.termId, "termId"),
  }).lean()) as unknown as AggregateDoc[];
  const output: Array<{
    studentId: string;
    classId: string;
    average: number;
    subjectCount: number;
    passedSubjects: number;
    suggestedDecision: "PROMOTE" | "REPEAT";
  }> = [];

  for (const ag of aggregates) {
    for (const row of ag.rows ?? []) {
      const minPasses = Math.ceil((row.subjectCount ?? 0) / 2);
      output.push({
        studentId: row.studentId.toString(),
        classId: ag.classId.toString(),
        average: row.average ?? 0,
        subjectCount: row.subjectCount ?? 0,
        passedSubjects: row.passedSubjects ?? 0,
        suggestedDecision: (row.passedSubjects ?? 0) >= minPasses ? "PROMOTE" : "REPEAT",
      });
    }
  }
  return output;
}

export async function approvePromotions(
  schoolId: string,
  principalUserId: string,
  input: ApprovePromotionsInput
) {
  const ops = input.decisions.map((d) => ({
    updateOne: {
      filter: {
        schoolId: oid(schoolId, "schoolId"),
        termId: oid(input.termId, "termId"),
        studentId: oid(d.studentId, "studentId"),
      },
      update: {
        $set: {
          decision: d.decision,
          reason: d.reason ?? "",
          approvedByUserId: oid(principalUserId, "principalUserId"),
        },
        $setOnInsert: {
          schoolId: oid(schoolId, "schoolId"),
          termId: oid(input.termId, "termId"),
          studentId: oid(d.studentId, "studentId"),
        },
      },
      upsert: true,
    },
  }));
  await PromotionDecision.bulkWrite(ops);
  return { approved: input.decisions.length };
}

export async function lockTerm(schoolId: string, principalUserId: string, termId: string) {
  const row = await TermLock.findOneAndUpdate(
    {
      schoolId: oid(schoolId, "schoolId"),
      termId: oid(termId, "termId"),
    },
    {
      $set: {
        locked: true,
        lockedByUserId: oid(principalUserId, "principalUserId"),
        lockedAt: new Date(),
      },
      $setOnInsert: {
        schoolId: oid(schoolId, "schoolId"),
        termId: oid(termId, "termId"),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { locked: row.locked, lockedAt: row.lockedAt };
}
