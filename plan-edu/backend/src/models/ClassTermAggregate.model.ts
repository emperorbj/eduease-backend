import mongoose, { Schema, type InferSchemaType } from "mongoose";

const studentAggregateRowSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    totalScore: { type: Number, required: true },
    average: { type: Number, required: true },
    subjectCount: { type: Number, required: true },
    passedSubjects: { type: Number, required: true },
    position: { type: Number, required: true },
    classTeacherComment: { type: String, default: "" },
    headteacherComment: { type: String, default: "" },
  },
  { _id: false }
);

const classTermAggregateSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
      index: true,
    },
    termId: {
      type: Schema.Types.ObjectId,
      ref: "Term",
      required: true,
      index: true,
    },
    generatedAt: { type: Date, required: true },
    rows: { type: [studentAggregateRowSchema], default: [] },
  },
  { timestamps: true }
);

classTermAggregateSchema.index({ schoolId: 1, classId: 1, termId: 1 }, { unique: true });

export type ClassTermAggregateDoc = InferSchemaType<typeof classTermAggregateSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ClassTermAggregate =
  mongoose.models.ClassTermAggregate ??
  mongoose.model("ClassTermAggregate", classTermAggregateSchema);
