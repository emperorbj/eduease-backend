import type { Request, Response } from "express";
import { ZodError } from "zod";
import PDFDocument from "pdfkit";
import { AppError } from "../../middleware/errorHandler.js";
import * as classResultsService from "./classResults.service.js";
import {
  classTermParamsSchema,
  reportCardParamsSchema,
  subjectTermParamsSchema,
  updateCommentsSchema,
} from "./classResults.schema.js";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }
  return req.user;
}

function validationError(e: ZodError): never {
  throw new AppError(400, "Validation failed", e.flatten());
}

function canAccessClass(role: string): boolean {
  return (
    role === "CLASS_TEACHER" ||
    role === "HEADTEACHER" ||
    role === "PRINCIPAL" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

function enforceClassTeacherScope(user: NonNullable<Request["user"]>, classId: string) {
  if (user.role === "CLASS_TEACHER" && user.classTeacherClassId !== classId) {
    throw new AppError(403, "Forbidden class scope");
  }
}

export async function status(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (!canAccessClass(user.role)) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = classTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const rows = await classResultsService.classSubmissionStatus(user.schoolId, params);
    res.json({ subjects: rows });
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function aggregate(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (
    user.role !== "CLASS_TEACHER" &&
    user.role !== "HEADTEACHER" &&
    user.role !== "PRINCIPAL" &&
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN"
  ) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = classTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const result = await classResultsService.recomputeClassAggregate(user.schoolId, params);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function students(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (!canAccessClass(user.role)) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = classTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const rows = await classResultsService.listClassStudentResults(user.schoolId, params);
    res.json({ students: rows });
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function comments(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "CLASS_TEACHER" && user.role !== "HEADTEACHER") {
    throw new AppError(403, "Only class teacher or headteacher can comment");
  }
  try {
    const params = classTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const input = updateCommentsSchema.parse(req.body);
    const result = await classResultsService.updateComments(
      user.schoolId,
      params,
      user.role,
      input
    );
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function subjectPositions(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (!canAccessClass(user.role)) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = subjectTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const result = await classResultsService.subjectPositions(user.schoolId, params);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function reportCard(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (!canAccessClass(user.role)) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = reportCardParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const result = await classResultsService.getReportCard(user.schoolId, params);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function reportCards(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (!canAccessClass(user.role)) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = classTermParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const result = await classResultsService.listReportCards(user.schoolId, params);
    res.json(result);
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}

export async function reportCardPdf(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (!canAccessClass(user.role)) {
    throw new AppError(403, "Forbidden");
  }
  try {
    const params = reportCardParamsSchema.parse(req.params);
    enforceClassTeacherScope(user, params.classId);
    const result = await classResultsService.getReportCard(user.schoolId, params);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const left = 40;
    const pageRight = doc.page.width - 40;
    const contentWidth = pageRight - left;
    const rowHeight = 22;
    const colors = {
      line: "#dbeafe",
      text: "#0f172a",
      muted: "#64748b",
      mutedLine: "#cbd5e1",
      headerBg: "#e0e7ff",
      headerText: "#312e81",
      stripe: "#f8fafc",
      commentBorder: "#c7d2fe",
      infoCardBg: "#eef2ff",
      statChipBg: "#ffffff",
    };

    const cols = {
      subject: 220,
      test1: 45,
      test2: 45,
      exam: 45,
      total: 45,
      grade: 45,
      pos: 45,
    };

    function ensureRoom(needed = rowHeight) {
      if (doc.y + needed > doc.page.height - 60) {
        doc.addPage();
      }
    }

    function drawCellText(text: string, x: number, y: number, width: number, align: "left" | "center" = "left") {
      doc
        .fontSize(9)
        .fillColor(colors.text)
        .text(text, x + 4, y + 6, {
          width: width - 8,
          align,
          ellipsis: true,
          lineBreak: false,
        });
    }

    doc.fontSize(18).text("Student Report Card", { align: "center" });
    doc.moveDown(0.5);
    doc
      .moveTo(left, doc.y)
      .lineTo(pageRight, doc.y)
      .strokeColor(colors.line)
      .stroke();
    doc.moveDown(0.6);

    const classLabel = result.reportMeta?.classLabel?.trim() || "—";
    const termLabel = result.reportMeta?.termLabel?.trim() || "—";
    const cardTop = doc.y;
    const cardPad = 14;
    const cardH = 146;
    const innerLeft = left + cardPad;
    const innerW = contentWidth - cardPad * 2;
    const colW = innerW / 2;
    const statW = innerW / 4;
    function infoValue(text: string, x: number, y: number, width: number) {
      doc.fontSize(10).fillColor(colors.text).text(text, x, y, {
        width,
        lineBreak: false,
        ellipsis: true,
      });
    }

    doc
      .rect(left, cardTop, contentWidth, cardH)
      .fillColor(colors.infoCardBg)
      .fill();
    doc
      .rect(left, cardTop, contentWidth, cardH)
      .lineWidth(0.8)
      .strokeColor(colors.mutedLine)
      .stroke();

    let cy = cardTop + cardPad;
    doc
      .font("Helvetica-Bold")
      .fontSize(15)
      .fillColor(colors.text)
      .text(`${result.student.lastName} ${result.student.firstName}`, innerLeft, cy, {
        width: innerW,
      });
    cy += 22;

    doc.font("Helvetica").fontSize(8).fillColor(colors.muted);
    doc.text("Admission number", innerLeft, cy, { width: colW });
    doc.text("Gender", innerLeft + colW, cy, { width: colW });
    cy += 11;
    infoValue(result.student.admissionNumber, innerLeft, cy, colW);
    infoValue(result.student.gender, innerLeft + colW, cy, colW);
    cy += 22;

    doc.fontSize(8).fillColor(colors.muted);
    doc.text("Class", innerLeft, cy, { width: colW });
    doc.text("Term", innerLeft + colW, cy, { width: colW });
    cy += 11;
    infoValue(classLabel, innerLeft, cy, colW);
    infoValue(termLabel, innerLeft + colW, cy, colW);
    cy += 22;

    const stats = [
      { label: "Position", value: String(result.aggregate.overallPosition) },
      { label: "Average", value: String(result.aggregate.average) },
      { label: "Total score", value: String(result.aggregate.totalScore) },
      {
        label: "Passed",
        value: `${result.aggregate.passedSubjects}/${result.aggregate.subjectCount}`,
      },
    ];
    for (let i = 0; i < 4; i += 1) {
      const sx = innerLeft + i * statW;
      const chipH = 34;
      const chipY = cy;
      doc
        .rect(sx + 2, chipY, statW - 6, chipH)
        .fillColor(colors.statChipBg)
        .fill();
      doc
        .rect(sx + 2, chipY, statW - 6, chipH)
        .lineWidth(0.5)
        .strokeColor(colors.mutedLine)
        .stroke();
      doc.font("Helvetica").fontSize(7).fillColor(colors.muted);
      doc.text(stats[i].label, sx + 8, chipY + 6, { width: statW - 16 });
      doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.text);
      doc.text(stats[i].value, sx + 8, chipY + 17, { width: statW - 16 });
    }

    doc.y = cardTop + cardH + 12;

    // Table header
    ensureRoom(rowHeight + 10);
    const headerY = doc.y;
    let x = left;
    doc
      .rect(left, headerY, contentWidth, rowHeight)
      .fillColor(colors.headerBg)
      .fill();
    doc.fillColor(colors.headerText);
    drawCellText("Subject", x, headerY, cols.subject);
    x += cols.subject;
    drawCellText("T1", x, headerY, cols.test1, "center");
    x += cols.test1;
    drawCellText("T2", x, headerY, cols.test2, "center");
    x += cols.test2;
    drawCellText("Exam", x, headerY, cols.exam, "center");
    x += cols.exam;
    drawCellText("Total", x, headerY, cols.total, "center");
    x += cols.total;
    drawCellText("Grade", x, headerY, cols.grade, "center");
    x += cols.grade;
    drawCellText("Pos", x, headerY, cols.pos, "center");

    doc
      .rect(left, headerY, contentWidth, rowHeight)
      .lineWidth(0.8)
      .strokeColor(colors.mutedLine)
      .stroke();
    doc.y = headerY + rowHeight;

    // Table rows
    result.subjects.forEach((s, idx) => {
      ensureRoom(rowHeight);
      const y = doc.y;
      let rowX = left;
      if (idx % 2 === 0) {
        doc
          .rect(left, y, contentWidth, rowHeight)
          .fillColor(colors.stripe)
          .fill();
      }
      doc
        .rect(left, y, contentWidth, rowHeight)
        .lineWidth(0.5)
        .strokeColor(colors.mutedLine)
        .stroke();

      drawCellText(`${s.subjectCode} ${s.subjectName}`.trim(), rowX, y, cols.subject);
      rowX += cols.subject;
      drawCellText(String(s.test1), rowX, y, cols.test1, "center");
      rowX += cols.test1;
      drawCellText(String(s.test2), rowX, y, cols.test2, "center");
      rowX += cols.test2;
      drawCellText(String(s.exam), rowX, y, cols.exam, "center");
      rowX += cols.exam;
      drawCellText(String(s.totalPercent), rowX, y, cols.total, "center");
      rowX += cols.total;
      if (["A1", "B2", "B3", "C4", "C5", "C6"].includes(s.grade)) {
        doc
          .rect(rowX + 7, y + 4, cols.grade - 14, rowHeight - 8)
          .fillColor("#dcfce7")
          .fill();
      } else {
        doc
          .rect(rowX + 7, y + 4, cols.grade - 14, rowHeight - 8)
          .fillColor("#fee2e2")
          .fill();
      }
      doc.fillColor(colors.text);
      drawCellText(s.grade, rowX, y, cols.grade, "center");
      rowX += cols.grade;
      drawCellText(String(s.subjectPosition ?? "-"), rowX, y, cols.pos, "center");

      doc.y = y + rowHeight;
    });

    doc.moveDown(0.8);
    ensureRoom(110);

    // Comments block
    doc.fontSize(11).text("Comments", left, doc.y, { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10).text("Class Teacher Comment:", left, doc.y, { width: contentWidth });
    doc
      .rect(left, doc.y + 2, contentWidth, 34)
      .lineWidth(0.6)
      .strokeColor(colors.commentBorder)
      .stroke();
    doc.text(result.comments.classTeacherComment || "-", left + 6, doc.y + 8, {
      width: contentWidth - 12,
      height: 26,
    });
    doc.y += 42;

    doc.fontSize(10).text("Headteacher Comment:", left, doc.y, { width: contentWidth });
    doc
      .rect(left, doc.y + 2, contentWidth, 34)
      .lineWidth(0.6)
      .strokeColor(colors.commentBorder)
      .stroke();
    doc.text(result.comments.headteacherComment || "-", left + 6, doc.y + 8, {
      width: contentWidth - 12,
      height: 26,
    });

    doc.end();

    const pdf = await done;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-card-${result.student.admissionNumber}-${result.termId}.pdf"`
    );
    res.send(pdf);
  } catch (e) {
    if (e instanceof ZodError) validationError(e);
    throw e;
  }
}
