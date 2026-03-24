import type { UserRole } from "./roles.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        schoolId: string;
        firstName: string;
        lastName: string;
        classTeacherClassId: string | null;
      };
    }
  }
}

export {};
