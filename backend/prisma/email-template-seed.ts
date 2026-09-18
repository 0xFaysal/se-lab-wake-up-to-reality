import {
  ContentStatus,
  EmailTemplateType,
  type PrismaClient,
} from "../generated/prisma/client.js";

type ProfessionalTemplate = {
  type: EmailTemplateType;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  allowedVariables: string[];
};

const PROFESSIONAL_TEMPLATE_VERSION = 2;

function emailShell(input: {
  preheader: string;
  eyebrow: string;
  heading: string;
  content: string;
  action?: { label: string; url: string };
  callout?: string;
}): string {
  const action = input.action
    ? `<tr><td style="padding:8px 40px 28px"><a href="${input.action.url}" style="display:inline-block;background:#066b52;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:20px;padding:14px 22px;border-radius:6px">${input.action.label}</a></td></tr>`
    : "";
  const callout = input.callout
    ? `<tr><td style="padding:0 40px 28px"><div style="background:#f0f7f5;border-left:4px solid #0a8063;padding:18px 20px;color:#163c34;font-size:15px;line-height:24px">${input.callout}</div></td></tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${input.heading}</title></head>
<body style="margin:0;padding:0;background:#eef2f3;color:#172126;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${input.preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#eef2f3">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #d9e2e1;border-radius:8px;overflow:hidden">
        <tr><td style="background:#075b49;padding:22px 40px;color:#ffffff"><span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;background:#ffffff;color:#075b49;font-size:18px;font-weight:800;border-radius:4px;margin-right:10px">P</span><span style="font-size:20px;font-weight:800;vertical-align:middle">ParkEase BD</span></td></tr>
        <tr><td style="padding:38px 40px 12px;color:#08765c;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase">${input.eyebrow}</td></tr>
        <tr><td style="padding:0 40px 18px"><h1 style="margin:0;color:#14201d;font-size:28px;line-height:36px;font-weight:800">${input.heading}</h1></td></tr>
        <tr><td style="padding:0 40px 24px;color:#44524f;font-size:16px;line-height:26px">${input.content}</td></tr>
        ${callout}
        ${action}
        <tr><td style="padding:22px 40px;background:#f7f9f9;border-top:1px solid #e3e9e8;color:#66736f;font-size:12px;line-height:19px">This message was sent by ParkEase BD. If you did not expect it, you can safely ignore it.<br><span style="color:#075b49;font-weight:700">Secure parking, made simpler.</span></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const professionalTemplates: ProfessionalTemplate[] = [
  {
    type: EmailTemplateType.EMAIL_VERIFICATION_OTP,
    name: "Email verification code",
    subject: "{{otp}} is your ParkEase BD verification code",
    preheader: "Use this one-time code to verify your email address.",
    htmlBody: emailShell({
      preheader: "Use {{otp}} to verify your ParkEase BD email address.",
      eyebrow: "Email verification",
      heading: "Confirm your email address",
      content: "Hello <strong>{{userName}}</strong>,<br><br>Enter the verification code below to finish securing your account.",
      callout: '<div style="text-align:center;font-size:34px;line-height:42px;font-weight:800;letter-spacing:8px;color:#075b49">{{otp}}</div><div style="margin-top:8px;text-align:center;color:#596864;font-size:13px">Expires in {{expiresIn}} minutes</div>',
    }),
    textBody: "Hello {{userName}},\n\nYour ParkEase BD verification code is {{otp}}.\nThis code expires in {{expiresIn}} minutes.\n\nIf you did not request this code, ignore this email.",
    allowedVariables: ["userName", "otp", "expiresIn"],
  },
  {
    type: EmailTemplateType.ACCOUNT_SETUP,
    name: "Admin-created account setup",
    subject: "Complete your ParkEase BD account setup",
    preheader: "Set your private password to activate your ParkEase BD account.",
    htmlBody: emailShell({
      preheader: "Complete your ParkEase BD account setup.",
      eyebrow: "Account setup",
      heading: "Your account is ready",
      content: "Hello <strong>{{userName}}</strong>,<br><br>Your <strong>{{status}}</strong> account has been created. Set a private password before signing in.",
      action: { label: "Set private password", url: "{{setupUrl}}" },
      callout: "This secure setup link expires in {{expiresIn}} minutes and can only be used once.",
    }),
    textBody: "Hello {{userName}},\n\nYour {{status}} account is ready. Set your private password: {{setupUrl}}\n\nThis link expires in {{expiresIn}} minutes.",
    allowedVariables: ["userName", "status", "setupUrl", "expiresIn"],
  },
  {
    type: EmailTemplateType.PASSWORD_RESET,
    name: "Password reset",
    subject: "Reset your ParkEase BD password",
    preheader: "Use this secure link to choose a new password.",
    htmlBody: emailShell({
      preheader: "Reset your ParkEase BD password.",
      eyebrow: "Account security",
      heading: "Reset your password",
      content: "Hello <strong>{{userName}}</strong>,<br><br>We received a request to reset your password. Use the secure button below to continue.",
      action: { label: "Reset password", url: "{{resetUrl}}" },
      callout: "This link expires in {{expiresIn}} minutes. ParkEase BD will never ask you to share your password or verification code.",
    }),
    textBody: "Hello {{userName}},\n\nReset your ParkEase BD password: {{resetUrl}}\n\nThis link expires in {{expiresIn}} minutes. If you did not request a reset, ignore this email.",
    allowedVariables: ["userName", "resetUrl", "expiresIn"],
  },
  {
    type: EmailTemplateType.GUARD_INVITATION,
    name: "Guard invitation",
    subject: "Complete your ParkEase BD Guard account",
    preheader: "You have been invited to join ParkEase BD parking operations.",
    htmlBody: emailShell({
      preheader: "Complete your ParkEase BD Guard account.",
      eyebrow: "Guard invitation",
      heading: "You have been invited",
      content: "Hello <strong>{{userName}}</strong>,<br><br>A parking operator has invited you to join ParkEase BD as a Guard. Complete your secure account setup to continue.",
      action: { label: "Complete account setup", url: "{{setupUrl}}" },
      callout: "This invitation link expires in {{expiresIn}} minutes and can only be used once.",
    }),
    textBody: "Hello {{userName}},\n\nYou have been invited to join ParkEase BD as a Guard. Complete your account: {{setupUrl}}\n\nThis link expires in {{expiresIn}} minutes.",
    allowedVariables: ["userName", "setupUrl", "expiresIn"],
  },
  {
    type: EmailTemplateType.MANAGER_INVITATION,
    name: "Manager invitation",
    subject: "Complete your ParkEase BD Manager account",
    preheader: "You have been invited to manage parking operations.",
    htmlBody: emailShell({
      preheader: "Complete your ParkEase BD Manager account.",
      eyebrow: "Manager invitation",
      heading: "Manage parking with confidence",
      content: "Hello <strong>{{userName}}</strong>,<br><br>You have been invited to join ParkEase BD as a Manager. Set your private password to access the operations portal.",
      action: { label: "Complete account setup", url: "{{setupUrl}}" },
      callout: "This secure invitation expires in {{expiresIn}} minutes and can only be used once.",
    }),
    textBody: "Hello {{userName}},\n\nYou have been invited to join ParkEase BD as a Manager. Complete your account: {{setupUrl}}\n\nThis link expires in {{expiresIn}} minutes.",
    allowedVariables: ["userName", "setupUrl", "expiresIn"],
  },
  {
    type: EmailTemplateType.BROADCAST,
    name: "Platform broadcast",
    subject: "{{campaignTitle}} | ParkEase BD",
    preheader: "A new update from ParkEase BD.",
    htmlBody: emailShell({
      preheader: "{{campaignTitle}} - a new update from ParkEase BD.",
      eyebrow: "Platform update",
      heading: "{{campaignTitle}}",
      content: "Hello <strong>{{userName}}</strong>,<br><br>We have an important ParkEase BD update for you. Please review the latest information and keep this email for reference.",
      callout: "Thank you for being part of ParkEase BD. We are committed to making parking safer, clearer, and easier to manage.",
    }),
    textBody: "{{campaignTitle}}\n\nHello {{userName}},\n\nWe have an important ParkEase BD update for you. Please review the latest information and keep this email for reference.\n\nThank you for being part of ParkEase BD.",
    allowedVariables: ["campaignTitle", "userName"],
  },
];

export async function seedProfessionalEmailTemplates(prisma: PrismaClient, adminUserId: string): Promise<void> {
  for (const template of professionalTemplates) {
    await prisma.$transaction(async (tx) => {
      const existingVersion = await tx.emailTemplate.findUnique({
        where: { type_version: { type: template.type, version: PROFESSIONAL_TEMPLATE_VERSION } },
      });
      if (existingVersion) return;

      const latest = await tx.emailTemplate.findFirst({
        where: { type: template.type },
        orderBy: { version: "desc" },
        select: { id: true, version: true },
      });
      if (latest && latest.version >= PROFESSIONAL_TEMPLATE_VERSION) return;

      await tx.emailTemplate.updateMany({
        where: { type: template.type, status: ContentStatus.PUBLISHED },
        data: { status: ContentStatus.ARCHIVED, archivedAt: new Date() },
      });
      await tx.emailTemplate.create({
        data: {
          ...template,
          version: PROFESSIONAL_TEMPLATE_VERSION,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          createdByAdminId: adminUserId,
          supersedesTemplateId: latest?.id ?? null,
        },
      });
    });
  }
}
