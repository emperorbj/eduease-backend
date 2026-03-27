import mongoose, { Schema, type InferSchemaType } from "mongoose";

const studentSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    admissionNumber: { type: String, required: true, trim: true },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
      index: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE"],
      required: true,
      index: true,
    },
    department: {
      type: String,
      enum: ["SCIENCE", "ARTS", "COMMERCIAL"],
      default: null,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ schoolId: 1, classId: 1 });

export type StudentDoc = InferSchemaType<typeof studentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Student =
  mongoose.models.Student ?? mongoose.model("Student", studentSchema);
