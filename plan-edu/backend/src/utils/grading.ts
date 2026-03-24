/** Canonical grading — see BACKEND-API-PLAN.md §2 */

export const MAX_TEST1 = 15;
export const MAX_TEST2 = 15;
export const MAX_EXAM = 70;

export type GradeCode = "A1" | "B2" | "B3" | "C4" | "C5" | "C6" | "D7" | "E8" | "F9";

export interface SubjectScoreInput {
  test1: number;
  test2: number;
  exam: number;
}

export interface SubjectResult extends SubjectScoreInput {
  totalPercent: number;
  grade: GradeCode;
  remark: string;
  subjectPassed: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Round total to nearest integer before grade mapping (§2.4). */
export function roundTotalPercent(raw: number): number {
  return Math.round(raw);
}

export function gradeFromPercent(p: number): { grade: GradeCode; remark: string } {
  if (p >= 75) return { grade: "A1", remark: "Excellent" };
  if (p >= 70) return { grade: "B2", remark: "Very Good" };
  if (p >= 65) return { grade: "B3", remark: "Good" };
  if (p >= 60) return { grade: "C4", remark: "Credit" };
  if (p >= 55) return { grade: "C5", remark: "Credit" };
  if (p >= 50) return { grade: "C6", remark: "Credit" };
  if (p >= 45) return { grade: "D7", remark: "Pass" };
  if (p >= 40) return { grade: "E8", remark: "Pass" };
  return { grade: "F9", remark: "Fail" };
}

export function computeSubjectResult(input: SubjectScoreInput): SubjectResult {
  const test1 = clamp(input.test1, 0, MAX_TEST1);
  const test2 = clamp(input.test2, 0, MAX_TEST2);
  const exam = clamp(input.exam, 0, MAX_EXAM);
  const totalPercent = roundTotalPercent(test1 + test2 + exam);
  const { grade, remark } = gradeFromPercent(totalPercent);
  const subjectPassed = totalPercent >= 50;
  return { test1, test2, exam, totalPercent, grade, remark, subjectPassed };
}
