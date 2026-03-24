import mongoose, { Schema, type InferSchemaType } from "mongoose";

const termSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1, max: 3 },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

termSchema.index({ schoolId: 1, sessionId: 1, order: 1 }, { unique: true });

export type TermDoc = InferSchemaType<typeof termSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Term = mongoose.models.Term ?? mongoose.model("Term", termSchema);
