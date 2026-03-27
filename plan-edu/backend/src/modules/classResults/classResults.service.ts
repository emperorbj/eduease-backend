import { Types } from "mongoose";
import { AppError } from "../../middleware/errorHandler.js";
import { ClassTermAggregate } from "../../models/ClassTermAggregate.model.js";
import { Student } from "../../models/Student.model.js";
import { SubjectResult } from "../../models/SubjectResult.model.js";
import { TeachingAssignment } from "../../models/TeachingAssignment.model.js";
import { assertTermUnlocked } from "../../utils/termLock.js";
import { Subject } from "../../models/Subject.model.js";
import { AcademicClass } from "../../models/AcademicClass.model.js";
import { Term } from "../../models/Term.model.js";
import type {
  ClassTermParams,
  ReportCardParams,
  SubjectTermParams,
  UpdateCommentsInput,
} from "./classResults.schema.js";

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

function rankRows<T>(
  rows: T[],
  scoreOf: (row: T) => number
): Array<T & { position: number }> {
  let position = 0;
  let index = 0;
  let lastScore: number | null = null;
  return rows.map((row) => {
    index += 1;
    const score = scoreOf(row);
    if (lastScore === null || score !== lastScore) {
      position = index;
      lastScore = score;
    }
    return { ...row, position };
  });
}

function normalizeSubjectRef(
  subjectRef: unknown
): { subjectId: string; subjectCode: string; subjectName: string } {
  if (subjectRef && typeof subjectRef === "object") {
    const s = subjectRef as { _id?: unknown; code?: unknown; name?: unknown };
    const subjectId = s._id ? String(s._id) : String(subjectRef);
    return {
      subjectId,
      subjectCode: typeof s.code === "string" ? s.code : "",
      subjectName: typeof s.name === "string" ? s.name : "",
    };
  }
  return {
    subjectId: String(subjectRef),
    subjectCode: "",
    subjectName: "",
  };
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

  const ranked = rankRows(rows, (r) => r.average);
  const normalized = ranked.map((r) => ({
    studentId: r.studentId,
    totalScore: Math.round(r.totalScore),
    average: Math.round(r.average * 100) / 100,
    subjectCount: r.subjectCount,
    passedSubjects: r.passedSubjects,
    position: r.position,
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

  const subjectRows = await SubjectResult.find({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
  })
    .select("studentId totalPercent subjectPassed")
    .lean();
  const byStudentStats = new Map<string, { totalScore: number; subjectCount: number; passedSubjects: number }>();
  for (const row of subjectRows) {
    const sid = String(row.studentId);
    const current = byStudentStats.get(sid) ?? { totalScore: 0, subjectCount: 0, passedSubjects: 0 };
    current.totalScore += row.totalPercent;
    current.subjectCount += 1;
    current.passedSubjects += row.subjectPassed ? 1 : 0;
    byStudentStats.set(sid, current);
  }

  return aggregateRows.map((r) => {
    const stats = byStudentStats.get(r.studentId.toString());
    const totalScore = Math.round(stats?.totalScore ?? r.totalScore);
    const subjectCount = stats?.subjectCount ?? r.subjectCount;
    const passedSubjects = stats?.passedSubjects ?? r.passedSubjects;
    const average = subjectCount > 0 ? Math.round((totalScore / subjectCount) * 100) / 100 : 0;
    return {
    studentId: r.studentId.toString(),
    firstName: studentMap.get(r.studentId.toString())?.firstName ?? "",
    lastName: studentMap.get(r.studentId.toString())?.lastName ?? "",
    admissionNumber: studentMap.get(r.studentId.toString())?.admissionNumber ?? "",
    totalScore,
    average,
    subjectCount,
    passedSubjects,
    position: r.position,
    classTeacherComment: r.classTeacherComment ?? "",
    headteacherComment: r.headteacherComment ?? "",
    };
  });
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

export async function subjectPositions(schoolId: string, params: SubjectTermParams) {
  const subject = await Subject.findOne({
    _id: oid(params.subjectId, "subjectId"),
    schoolId: oid(schoolId, "schoolId"),
  }).select("name code");
  if (!subject) {
    throw new AppError(404, "Subject not found");
  }

  const rows = await SubjectResult.find({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
    subjectId: oid(params.subjectId, "subjectId"),
  })
    .select("studentId totalPercent grade remark subjectPassed")
    .sort({ totalPercent: -1, studentId: 1 })
    .lean();

  const studentIds = rows.map((r) => r.studentId);
  const students = await Student.find({
    _id: { $in: studentIds },
    schoolId: oid(schoolId, "schoolId"),
  })
    .select("firstName lastName admissionNumber")
    .lean();
  const byStudent = new Map(students.map((s) => [String(s._id), s]));

  const ranked = rankRows(rows, (r) => r.totalPercent);
  return {
    subject: {
      id: String(subject._id),
      name: subject.name,
      code: subject.code,
    },
    rankings: ranked.map((r) => ({
      studentId: r.studentId.toString(),
      firstName: byStudent.get(r.studentId.toString())?.firstName ?? "",
      lastName: byStudent.get(r.studentId.toString())?.lastName ?? "",
      admissionNumber: byStudent.get(r.studentId.toString())?.admissionNumber ?? "",
      totalPercent: r.totalPercent,
      grade: r.grade,
      remark: r.remark,
      subjectPassed: r.subjectPassed,
      position: r.position,
    })),
  };
}

export async function getReportCard(schoolId: string, params: ReportCardParams) {
  const aggregate = await ClassTermAggregate.findOne({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
  });
  if (!aggregate) {
    throw new AppError(404, "Class aggregate not found. Run aggregate first.");
  }

  const aggregateRows = aggregate.rows as AggregateRow[];
  const row = aggregateRows.find((r) => r.studentId.toString() === params.studentId);
  if (!row) {
    throw new AppError(404, "Student aggregate row not found in class/term");
  }

  const student = await Student.findOne({
    _id: oid(params.studentId, "studentId"),
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
  }).select("firstName lastName admissionNumber gender");
  if (!student) {
    throw new AppError(404, "Student not found in class");
  }

  const subjectResults = await SubjectResult.find({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
    studentId: oid(params.studentId, "studentId"),
  })
    .populate("subjectId", "name code")
    .sort({ "subjectId.code": 1 });

  const allInClassBySubject = await SubjectResult.find({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
    subjectId: { $in: subjectResults.map((s) => s.subjectId) },
  })
    .select("subjectId studentId totalPercent")
    .lean();

  const grouped = new Map<string, Array<{ studentId: string; totalPercent: number }>>();
  for (const r of allInClassBySubject) {
    const key = String(r.subjectId);
    const arr = grouped.get(key) ?? [];
    arr.push({ studentId: String(r.studentId), totalPercent: r.totalPercent });
    grouped.set(key, arr);
  }

  const subjects = subjectResults.map((r) => {
    const normalizedSubject = normalizeSubjectRef(r.subjectId);
    const key = normalizedSubject.subjectId;
    const rankings = rankRows(
      [...(grouped.get(key) ?? [])].sort((a, b) => b.totalPercent - a.totalPercent),
      (x) => x.totalPercent
    );
    const current = rankings.find((x) => x.studentId === params.studentId);
    return {
      subjectId: normalizedSubject.subjectId,
      subjectName: normalizedSubject.subjectName,
      subjectCode: normalizedSubject.subjectCode,
      test1: r.test1,
      test2: r.test2,
      exam: r.exam,
      totalPercent: r.totalPercent,
      grade: r.grade,
      remark: r.remark,
      subjectPassed: r.subjectPassed,
      subjectPosition: current?.position ?? null,
    };
  });

  const totalScore = Math.round(subjects.reduce((sum, s) => sum + s.totalPercent, 0));
  const subjectCount = subjects.length;
  const passedSubjects = subjects.reduce((sum, s) => sum + (s.subjectPassed ? 1 : 0), 0);
  const average = subjectCount > 0 ? Math.round((totalScore / subjectCount) * 100) / 100 : 0;

  const classDoc = (await AcademicClass.findOne({
    _id: oid(params.classId, "classId"),
    schoolId: oid(schoolId, "schoolId"),
  })
    .select("name arm")
    .lean()) as { name: string; arm: string } | null;

  const termDoc = (await Term.findOne({
    _id: oid(params.termId, "termId"),
    schoolId: oid(schoolId, "schoolId"),
  })
    .select("name")
    .lean()) as { name: string } | null;

  const classLabel = classDoc ? `${classDoc.name} ${classDoc.arm}`.trim() : null;
  const termLabel = termDoc?.name ?? null;

  return {
    classId: params.classId,
    termId: params.termId,
    generatedAt: aggregate.generatedAt,
    reportMeta: {
      classLabel,
      termLabel,
    },
    student: {
      studentId: student._id.toString(),
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
      gender: student.gender,
    },
    aggregate: {
      totalScore,
      average,
      subjectCount,
      passedSubjects,
      overallPosition: row.position,
    },
    comments: {
      classTeacherComment: row.classTeacherComment ?? "",
      headteacherComment: row.headteacherComment ?? "",
    },
    subjects,
  };
}

export async function listReportCards(schoolId: string, params: ClassTermParams) {
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
    classId: oid(params.classId, "classId"),
  })
    .select("firstName lastName admissionNumber gender department")
    .lean();
  const byStudent = new Map(students.map((s) => [String(s._id), s]));

  const subjectResults = await SubjectResult.find({
    schoolId: oid(schoolId, "schoolId"),
    classId: oid(params.classId, "classId"),
    termId: oid(params.termId, "termId"),
  })
    .populate("subjectId", "name code")
    .sort({ "subjectId.code": 1 })
    .lean();

  const scoreRows = subjectResults.map((r) => ({
    ...normalizeSubjectRef(r.subjectId),
    studentId: String(r.studentId),
    test1: r.test1,
    test2: r.test2,
    exam: r.exam,
    totalPercent: r.totalPercent,
    grade: r.grade,
    remark: r.remark,
    subjectPassed: r.subjectPassed,
  }));
  type ScoreRow = (typeof scoreRows)[number] & { subjectPosition: number | null };

  const subjectsMetaMap = new Map<string, { subjectId: string; subjectCode: string; subjectName: string }>();
  const subjectBuckets = new Map<string, Array<{ studentId: string; totalPercent: number }>>();
  for (const row of scoreRows) {
    subjectsMetaMap.set(row.subjectId, {
      subjectId: row.subjectId,
      subjectCode: row.subjectCode,
      subjectName: row.subjectName,
    });
    const current = subjectBuckets.get(row.subjectId) ?? [];
    current.push({ studentId: row.studentId, totalPercent: row.totalPercent });
    subjectBuckets.set(row.subjectId, current);
  }

  const subjectPositionMap = new Map<string, Map<string, number>>();
  for (const [subjectId, values] of subjectBuckets) {
    const ranked = rankRows(
      [...values].sort((a, b) => b.totalPercent - a.totalPercent),
      (x) => x.totalPercent
    );
    const map = new Map<string, number>();
    for (const row of ranked) {
      map.set(row.studentId, row.position);
    }
    subjectPositionMap.set(subjectId, map);
  }

  const scoresByStudent = new Map<string, ScoreRow[]>();
  for (const row of scoreRows) {
    const current = scoresByStudent.get(row.studentId) ?? [];
    current.push({
      ...row,
      subjectPosition: subjectPositionMap.get(row.subjectId)?.get(row.studentId) ?? null,
    });
    scoresByStudent.set(row.studentId, current);
  }

  const studentsPayload = aggregateRows.map((agg) => {
    const sid = agg.studentId.toString();
    const st = byStudent.get(sid);
    const subjectRowsForStudent = scoresByStudent.get(sid) ?? [];
    const totalScore = Math.round(
      subjectRowsForStudent.reduce((sum, row) => sum + row.totalPercent, 0)
    );
    const subjectCount = subjectRowsForStudent.length;
    const passedSubjects = subjectRowsForStudent.reduce(
      (sum, row) => sum + (row.subjectPassed ? 1 : 0),
      0
    );
    const average = subjectCount > 0 ? Math.round((totalScore / subjectCount) * 100) / 100 : 0;
    return {
      studentId: sid,
      firstName: st?.firstName ?? "",
      lastName: st?.lastName ?? "",
      admissionNumber: st?.admissionNumber ?? "",
      gender: st?.gender ?? null,
      department: st?.department ?? null,
      aggregate: {
        totalScore,
        average,
        subjectCount,
        passedSubjects,
        overallPosition: agg.position,
      },
      comments: {
        classTeacherComment: agg.classTeacherComment ?? "",
        headteacherComment: agg.headteacherComment ?? "",
      },
      subjects: subjectRowsForStudent,
    };
  });

  return {
    classId: params.classId,
    termId: params.termId,
    generatedAt: aggregate.generatedAt,
    subjectsMeta: [...subjectsMetaMap.values()].sort((a, b) =>
      a.subjectCode.localeCompare(b.subjectCode)
    ),
    students: studentsPayload,
  };
}
