import winston from "winston";
import { env } from "../config/env.js";

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const base = `${timestamp} ${level}: ${stack ?? message}`;
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return base + extra;
  })
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: "plan-edu-api" },
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === "production" ? prodFormat : devFormat,
    }),
  ],
});
