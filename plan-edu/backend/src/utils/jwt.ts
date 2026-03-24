import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "../types/roles.js";

export interface AccessTokenPayload {
  sub: string;
  schoolId: string;
  role: UserRole;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & AccessTokenPayload;
  if (!decoded.sub || !decoded.schoolId || !decoded.role) {
    throw new Error("Invalid token payload");
  }
  return {
    sub: decoded.sub,
    schoolId: decoded.schoolId,
    role: decoded.role,
  };
}
