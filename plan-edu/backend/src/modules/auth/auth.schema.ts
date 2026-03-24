import { z } from "zod";
import { CREATABLE_USER_ROLES } from "../../types/roles.js";

export const bootstrapRegisterSchema = z.object({
  schoolName: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(CREATABLE_USER_ROLES),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export type BootstrapRegisterInput = z.infer<typeof bootstrapRegisterSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
