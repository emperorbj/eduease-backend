import mongoose, { Schema, type InferSchemaType } from "mongoose";

const academicClassSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    arm: { type: String, required: true, trim: true },
    classTeacherUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

academicClassSchema.index({ schoolId: 1, name: 1, arm: 1 }, { unique: true });

export type AcademicClassDoc = InferSchemaType<typeof academicClassSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AcademicClass =
  mongoose.models.AcademicClass ??
  mongoose.model("AcademicClass", academicClassSchema);
