import mongoose, { Schema, type InferSchemaType } from "mongoose";

const teachingAssignmentSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    teacherUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    termId: {
      type: Schema.Types.ObjectId,
      ref: "Term",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

teachingAssignmentSchema.index(
  { schoolId: 1, teacherUserId: 1, classId: 1, subjectId: 1, termId: 1 },
  { unique: true }
);

export type TeachingAssignmentDoc = InferSchemaType<typeof teachingAssignmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TeachingAssignment =
  mongoose.models.TeachingAssignment ??
  mongoose.model("TeachingAssignment", teachingAssignmentSchema);
