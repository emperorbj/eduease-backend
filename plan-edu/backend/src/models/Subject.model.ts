import mongoose, { Schema, type InferSchemaType } from "mongoose";

const subjectSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export type SubjectDoc = InferSchemaType<typeof subjectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Subject =
  mongoose.models.Subject ?? mongoose.model("Subject", subjectSchema);
