import mongoose, { Schema, type InferSchemaType } from "mongoose";

const subjectResultSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    termId: {
      type: Schema.Types.ObjectId,
      ref: "Term",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    teacherUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    test1: { type: Number, required: true, min: 0, max: 15 },
    test2: { type: Number, required: true, min: 0, max: 15 },
    exam: { type: Number, required: true, min: 0, max: 70 },
    totalPercent: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true },
    remark: { type: String, required: true },
    subjectPassed: { type: Boolean, required: true },
    locked: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

subjectResultSchema.index(
  { schoolId: 1, termId: 1, classId: 1, subjectId: 1, studentId: 1 },
  { unique: true }
);

export type SubjectResultDoc = InferSchemaType<typeof subjectResultSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SubjectResult =
  mongoose.models.SubjectResult ??
  mongoose.model("SubjectResult", subjectResultSchema);
