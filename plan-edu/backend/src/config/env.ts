import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).default("dev-only-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  MATERIAL_SIGNED_URL_EXPIRES_SEC: z.coerce.number().int().positive().default(3600),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  /** Web app origin (no trailing slash). Login links in emails use this + /login */
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  MAX_UPLOAD_MB: z.coerce.number().default(10),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  /** Base URL shown in Swagger (e.g. https://api.example.com). Defaults to http://localhost:PORT */
  API_PUBLIC_URL: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
