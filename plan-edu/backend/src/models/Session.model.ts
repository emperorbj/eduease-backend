import mongoose, { Schema, type InferSchemaType } from "mongoose";

const sessionSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sessionSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export type SessionDoc = InferSchemaType<typeof sessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Session =
  mongoose.models.Session ?? mongoose.model("Session", sessionSchema);
