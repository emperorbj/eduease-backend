import mongoose, { Schema, type InferSchemaType } from "mongoose";

const schoolSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true, sparse: true },
  },
  { timestamps: true }
);

schoolSchema.index({ name: 1 });

export type SchoolDoc = InferSchemaType<typeof schoolSchema> & { _id: mongoose.Types.ObjectId };

export const School =
  mongoose.models.School ?? mongoose.model("School", schoolSchema);
