import mongoose, { Schema, type InferSchemaType } from "mongoose";

const emailLogSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    type: { type: String, required: true, index: true },
    to: { type: [String], required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["SENT", "FAILED"], required: true, index: true },
    errorMessage: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    sentByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

emailLogSchema.index({ schoolId: 1, type: 1, createdAt: -1 });

export type EmailLogDoc = InferSchemaType<typeof emailLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmailLog =
  mongoose.models.EmailLog ?? mongoose.model("EmailLog", emailLogSchema);
