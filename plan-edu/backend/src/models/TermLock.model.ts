import mongoose, { Schema, type InferSchemaType } from "mongoose";

const termLockSchema = new Schema(
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
    locked: { type: Boolean, default: false },
    lockedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    lockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

termLockSchema.index({ schoolId: 1, termId: 1 }, { unique: true });

export type TermLockDoc = InferSchemaType<typeof termLockSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TermLock = mongoose.models.TermLock ?? mongoose.model("TermLock", termLockSchema);
