import type { UserRole } from "../../types/roles.js";

export const PLATFORM_NAME = "SchoolFlow";

export interface RegistrationEmailInput {
  recipientName: string;
  recipientEmail: string;
  role: UserRole;
  schoolName: string;
  isBootstrap: boolean;
  loginUrl: string;
  plainPassword?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildRegistrationEmail(input: RegistrationEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const name = escapeHtml(input.recipientName);
  const email = escapeHtml(input.recipientEmail);
  const role = escapeHtml(input.role);
  const school = escapeHtml(input.schoolName);
  const loginUrlAttr = escapeHtml(input.loginUrl);

  const passwordText =
    input.plainPassword != null ? `\nPassword: ${input.plainPassword}\n` : "";

  const subject = input.isBootstrap
    ? `Welcome to ${PLATFORM_NAME} — your school is ready`
    : `Your ${PLATFORM_NAME} account is ready`;

  const text = input.isBootstrap
    ? `Hello ${input.recipientName},\n\nYour school "${input.schoolName}" is set up on ${PLATFORM_NAME}. Your Super Admin account is active.\n\nSign in: ${input.loginUrl}\n\nYou can log in and invite your team.\n`
    : `Hello ${input.recipientName},\n\nA ${PLATFORM_NAME} account has been created for you.\n\nRole: ${input.role}\nSign in: ${input.loginUrl}\n\nEmail: ${input.recipientEmail}${passwordText}\nFor security, change your password after your first sign-in.\n`;

  const introHtml = input.isBootstrap
    ? `<p style="margin:0 0 16px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.65;color:#334155;">Your school <strong style="color:#0f172a;">${school}</strong> is set up on ${PLATFORM_NAME}. Your <strong style="color:#0f172a;">Super Admin</strong> account is active.</p>
<p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#64748b;">Sign in below to invite teachers and staff.</p>`
    : `<p style="margin:0 0 20px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.65;color:#334155;">An account has been created for you on ${PLATFORM_NAME}.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;"><tr><td style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#475569;">
<span style="display:inline-block;background:#eef2ff;color:#3730a3;padding:8px 14px;border-radius:999px;font-weight:600;letter-spacing:0.02em;">${role}</span>
</td></tr></table>`;

  const credentialSection =
    input.plainPassword != null
      ? `<tr>
<td style="padding:0 40px 28px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;">
<tr><td style="padding:0 0 12px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.06em;">Your sign-in details</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin:0 0 12px 0;">
<tr><td style="padding:20px 22px;font-family:ui-monospace,SFMono-Regular,'SF Mono',Consolas,monospace;font-size:14px;color:#0f172a;line-height:1.5;">
<div style="margin-bottom:14px;">
<span style="display:block;font-family:system-ui,sans-serif;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Email</span>
<strong style="font-weight:600;font-family:ui-monospace,monospace;">${email}</strong>
</div>
<div>
<span style="display:block;font-family:system-ui,sans-serif;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Password</span>
<strong style="font-weight:600;font-family:ui-monospace,monospace;">${escapeHtml(input.plainPassword)}</strong>
</div>
</td></tr></table>
<p style="margin:0;font-family:system-ui,sans-serif;font-size:13px;line-height:1.5;color:#94a3b8;">Use these credentials once, then update your password from your account settings.</p>
</td>
</tr>`
      : "";

  const preheader = input.isBootstrap
    ? `${input.recipientName}, ${input.schoolName} is live on ${PLATFORM_NAME}.`
    : `Your ${PLATFORM_NAME} login is ready — open this email to sign in.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:transparent;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
<tr>
<td style="background-color:#4f46e5;background-image:linear-gradient(135deg,#4f46e5 0%,#2563eb 100%);padding:32px 40px;">
<p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:0.2em;text-transform:uppercase;">${PLATFORM_NAME}</p>
<p style="margin:10px 0 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.03em;line-height:1.2;">${input.isBootstrap ? "Your school is ready" : "You're almost there"}</p>
<p style="margin:12px 0 0 0;font-family:system-ui,sans-serif;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.5;">${input.isBootstrap ? "Super Admin access is active." : "Your account has been created."}</p>
</td>
</tr>
<tr>
<td style="padding:36px 40px 8px 40px;">
<h1 style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;line-height:1.3;">Hello, ${name}</h1>
</td>
</tr>
<tr>
<td style="padding:12px 40px 28px 40px;">
${introHtml}
</td>
</tr>
${credentialSection}
<tr>
<td style="padding:0 40px 36px 40px;" align="left">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td bgcolor="#4f46e5" style="background-color:#4f46e5;border-radius:12px;">
<a href="${loginUrlAttr}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">Open ${PLATFORM_NAME}</a>
</td>
</tr></table>
<p style="margin:20px 0 0 0;font-family:system-ui,sans-serif;font-size:13px;line-height:1.6;color:#64748b;">If the button does not work, copy this link into your browser:<br><a href="${loginUrlAttr}" style="color:#4f46e5;word-break:break-all;">${loginUrlAttr}</a></p>
</td>
</tr>
<tr>
<td style="padding:24px 40px 32px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-family:system-ui,sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">${
      input.isBootstrap
        ? `You received this because you set up your school on ${PLATFORM_NAME}.`
        : `You received this because an administrator added you to ${PLATFORM_NAME}.`
    }<br>&copy; ${new Date().getFullYear()} ${PLATFORM_NAME}</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}
