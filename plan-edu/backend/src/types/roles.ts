export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "SUBJECT_TEACHER",
  "CLASS_TEACHER",
  "HEADTEACHER",
  "PRINCIPAL",
  "STUDENT",
  "PARENT",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const STAFF_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "SUBJECT_TEACHER",
  "CLASS_TEACHER",
  "HEADTEACHER",
  "PRINCIPAL",
];

/** Roles an admin may assign when creating users (not bootstrap). */
export const CREATABLE_USER_ROLES = [
  "ADMIN",
  "SUBJECT_TEACHER",
  "CLASS_TEACHER",
  "HEADTEACHER",
  "PRINCIPAL",
  "STUDENT",
  "PARENT",
] as const satisfies readonly UserRole[];
