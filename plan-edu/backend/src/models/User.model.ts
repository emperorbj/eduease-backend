import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { USER_ROLES } from "../types/roles.js";

const userSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: [...USER_ROLES],
      required: true,
    },
    classTeacherClassId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ schoolId: 1, email: 1 }, { unique: true });

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
