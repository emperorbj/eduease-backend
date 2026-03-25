import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { getMailer } from "../../config/mailer.js";
import { AppError } from "../../middleware/errorHandler.js";
import { EmailLog } from "../../models/EmailLog.model.js";
import { School } from "../../models/School.model.js";
import { User } from "../../models/User.model.js";
import type { UserRole } from "../../types/roles.js";
import { signAccessToken } from "../../utils/jwt.js";
import { logger } from "../../utils/logger.js";
import type { AdminCreateUserInput, BootstrapRegisterInput, LoginInput } from "./auth.schema.js";
import { buildRegistrationEmail } from "./registrationEmail.js";

function toPublicUser(user: {
  _id: { toString: () => string };
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId: { toString: () => string };
  classTeacherClassId?: { toString: () => string } | null;
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    schoolId: user.schoolId.toString(),
    classTeacherClassId: user.classTeacherClassId?.toString() ?? null,
  };
}

export async function bootstrapRegister(input: BootstrapRegisterInput) {
  const existing = await User.countDocuments();
  if (existing > 0) {
    throw new AppError(403, "School is already bootstrapped. Use an admin account to add users.");
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const school = await School.create({ name: input.schoolName.trim() });
  const user = await User.create({
    schoolId: school._id,
    email: input.email.toLowerCase().trim(),
    passwordHash,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    role: "SUPER_ADMIN",
  });
  const token = signAccessToken({
    sub: user._id.toString(),
    schoolId: school._id.toString(),
    role: user.role,
  });
  await sendUserRegisteredEmail({
    schoolId: school._id.toString(),
    sentByUserId: user._id.toString(),
    recipientEmail: user.email,
    recipientName: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
    schoolName: school.name,
    isBootstrap: true,
  });
  return {
    token,
    user: toPublicUser(user),
    school: { id: school._id.toString(), name: school.name },
  };
}

export async function adminCreateUser(
  actorSchoolId: string,
  actorUserId: string,
  input: AdminCreateUserInput
) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const user = await User.create({
      schoolId: actorSchoolId,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: input.role,
    });
    await sendUserRegisteredEmail({
      schoolId: actorSchoolId,
      sentByUserId: actorUserId,
      recipientEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      schoolName: "your school",
      isBootstrap: false,
      plainPassword: input.password,
    });
    return { user: toPublicUser(user) };
  } catch (e: unknown) {
    if (isMongoDuplicateKey(e)) {
      throw new AppError(409, "A user with this email already exists in this school");
    }
    throw e;
  }
}

function loginPageUrl(): string {
  const base = env.FRONTEND_URL.replace(/\/$/, "");
  return `${base}/login`;
}

async function sendUserRegisteredEmail(input: {
  schoolId: string;
  sentByUserId: string;
  recipientEmail: string;
  recipientName: string;
  role: UserRole;
  schoolName: string;
  isBootstrap: boolean;
  /** Only for admin-created accounts; never stored on EmailLog */
  plainPassword?: string;
}): Promise<void> {
  const mailer = getMailer();
  if (!mailer || !env.EMAIL_FROM) {
    return;
  }
  const { subject, text, html } = buildRegistrationEmail({
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail,
    role: input.role,
    schoolName: input.schoolName,
    isBootstrap: input.isBootstrap,
    loginUrl: loginPageUrl(),
    plainPassword: input.plainPassword,
  });

  try {
    await mailer.sendMail({
      from: env.EMAIL_FROM,
      to: input.recipientEmail,
      subject,
      text,
      html,
    });
    await EmailLog.create({
      schoolId: input.schoolId,
      type: "USER_REGISTERED",
      to: [input.recipientEmail],
      subject,
      status: "SENT",
      sentByUserId: input.sentByUserId,
      meta: { role: input.role, isBootstrap: input.isBootstrap },
    });
  } catch (error) {
    logger.warn("Registration email failed", {
      recipientEmail: input.recipientEmail,
      role: input.role,
      isBootstrap: input.isBootstrap,
      error: error instanceof Error ? error.message : String(error),
    });
    try {
      await EmailLog.create({
        schoolId: input.schoolId,
        type: "USER_REGISTERED",
        to: [input.recipientEmail],
        subject,
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        sentByUserId: input.sentByUserId,
        meta: { role: input.role, isBootstrap: input.isBootstrap },
      });
    } catch {
      // Keep registration flow non-blocking even if log write fails.
    }
  }
}

export async function login(input: LoginInput) {
  const user = await User.findOne({
    email: input.email.toLowerCase().trim(),
  }).select("+passwordHash");
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }
  if (!user.isActive) {
    throw new AppError(401, "Account is disabled");
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "Invalid email or password");
  }
  const token = signAccessToken({
    sub: user._id.toString(),
    schoolId: user.schoolId.toString(),
    role: user.role,
  });
  return {
    token,
    user: toPublicUser(user),
  };
}

function isMongoDuplicateKey(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: number }).code === 11000
  );
}
