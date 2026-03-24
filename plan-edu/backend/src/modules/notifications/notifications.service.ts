import { Types } from "mongoose";
import { env } from "../../config/env.js";
import { getMailer } from "../../config/mailer.js";
import { AppError } from "../../middleware/errorHandler.js";
import { ClassTermAggregate } from "../../models/ClassTermAggregate.model.js";
import { EmailLog } from "../../models/EmailLog.model.js";
import type {
  LowPerformanceAlertInput,
  ResultReleaseInput,
} from "./notifications.schema.js";

interface AggregateRow {
  average?: number;
}

interface AggregateDoc {
  classId: Types.ObjectId;
  rows?: AggregateRow[];
}

function oid(id: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${label}`);
  }
  return new Types.ObjectId(id);
}

async function sendAndLog(
  schoolId: string,
  userId: string,
  type: "RESULT_RELEASED" | "LOW_PERFORMANCE_ALERT",
  to: string[],
  subject: string,
  text: string,
  meta: Record<string, unknown>
) {
  const mailer = getMailer();
  if (!mailer || !env.EMAIL_FROM) {
    throw new AppError(500, "SMTP is not configured");
  }

  try {
    await mailer.sendMail({
      from: env.EMAIL_FROM,
      to: to.join(","),
      subject,
      text,
    });
    await EmailLog.create({
      schoolId: oid(schoolId, "schoolId"),
      type,
      to,
      subject,
      status: "SENT",
      sentByUserId: oid(userId, "userId"),
      meta,
    });
    return { sent: to.length };
  } catch (error) {
    await EmailLog.create({
      schoolId: oid(schoolId, "schoolId"),
      type,
      to,
      subject,
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      sentByUserId: oid(userId, "userId"),
      meta,
    });
    throw new AppError(502, "Failed to send email");
  }
}

export async function sendResultReleased(
  schoolId: string,
  userId: string,
  input: ResultReleaseInput
) {
  return sendAndLog(
    schoolId,
    userId,
    "RESULT_RELEASED",
    input.recipients,
    input.subject ?? "Results released",
    input.message,
    { termId: input.termId }
  );
}

export async function sendLowPerformanceAlert(
  schoolId: string,
  userId: string,
  input: LowPerformanceAlertInput
) {
  const aggregates = (await ClassTermAggregate.find({
    schoolId: oid(schoolId, "schoolId"),
    termId: oid(input.termId, "termId"),
  }).lean()) as unknown as AggregateDoc[];

  const flagged: Array<{ classId: string; average: number }> = [];
  for (const ag of aggregates) {
    const rows = ag.rows ?? [];
    if (rows.length === 0) continue;
    const avg =
      rows.reduce((sum: number, r: AggregateRow) => sum + (r.average ?? 0), 0) /
      rows.length;
    if (avg < input.thresholdAverage) {
      flagged.push({
        classId: ag.classId.toString(),
        average: Math.round(avg * 100) / 100,
      });
    }
  }

  const text = flagged.length
    ? `Low performance classes detected:\n${flagged
        .map((f) => `- classId=${f.classId}, average=${f.average}`)
        .join("\n")}`
    : "No classes below threshold in this term.";

  const result = await sendAndLog(
    schoolId,
    userId,
    "LOW_PERFORMANCE_ALERT",
    input.recipients,
    "Low performance alert",
    text,
    { termId: input.termId, thresholdAverage: input.thresholdAverage, flagged }
  );
  return { ...result, flagged };
}
