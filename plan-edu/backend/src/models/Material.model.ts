import mongoose, { Schema, type InferSchemaType } from "mongoose";

const materialSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
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
    bucket: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

materialSchema.index({ schoolId: 1, classId: 1, subjectId: 1, createdAt: -1 });

export type MaterialDoc = InferSchemaType<typeof materialSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Material =
  mongoose.models.Material ?? mongoose.model("Material", materialSchema);
