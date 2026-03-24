import mongoose, { Schema, type InferSchemaType } from "mongoose";

const promotionDecisionSchema = new Schema(
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
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    decision: { type: String, enum: ["PROMOTE", "REPEAT"], required: true },
    reason: { type: String, default: "" },
    approvedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

promotionDecisionSchema.index({ schoolId: 1, termId: 1, studentId: 1 }, { unique: true });

export type PromotionDecisionDoc = InferSchemaType<typeof promotionDecisionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PromotionDecision =
  mongoose.models.PromotionDecision ??
  mongoose.model("PromotionDecision", promotionDecisionSchema);
