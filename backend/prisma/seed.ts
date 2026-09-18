import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ContentStatus,
  EmailTemplateType,
  LegalDocumentType,
  PrismaClient,
  UserRoleType,
  UserStatus,
} from "../generated/prisma/client.js";
import { normalizeBangladeshPhone } from "../src/common/auth/phone.js";
import { hashPassword } from "../src/common/auth/password.js";
import { seedProfessionalEmailTemplates } from "./email-template-seed.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for database seeding`);
  return value;
}

async function main(): Promise<void> {
  const email = requireEnvironmentVariable("SEED_ADMIN_EMAIL").toLowerCase();
  const phone = normalizeBangladeshPhone(
    requireEnvironmentVariable("SEED_ADMIN_PHONE"),
  );
  const password = requireEnvironmentVariable("SEED_ADMIN_PASSWORD");

  if (
    password.length < 12 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z0-9\s]/.test(password) ||
    /\s/.test(password)
  ) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be 12+ characters with uppercase, lowercase, number, and special characters, without whitespace",
    );
  }

  const matchingUsers = await prisma.user.findMany({
    where: {
      OR: [{ email }, { phone }],
    },
    include: { roles: { select: { role: true } } },
  });

  const emailOwner = matchingUsers.find((user) => user.email === email);
  const phoneOwner = matchingUsers.find((user) => user.phone === phone);

  if (emailOwner && phoneOwner && emailOwner.id !== phoneOwner.id) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PHONE belong to different existing accounts. Use a unique phone number for the seed admin; no accounts were modified.",
    );
  }

  if (phoneOwner && !emailOwner) {
    throw new Error(
      "SEED_ADMIN_PHONE already belongs to another account. Set SEED_ADMIN_PHONE to an unused Bangladesh phone number; the existing account will not be promoted or overwritten.",
    );
  }

  const existingAdmin = emailOwner;

  let admin = existingAdmin;
  if (existingAdmin) {
    if (!existingAdmin.roles.some((role) => role.role === UserRoleType.ADMIN)) {
      throw new Error(
        "SEED_ADMIN_EMAIL already belongs to a non-admin account; refusing privilege escalation",
      );
    }

    if (existingAdmin.phone !== phone) {
      throw new Error(
        "SEED_ADMIN_PHONE does not match the existing admin account. Use that admin's current phone number; the seed will not replace identity data automatically.",
      );
    }
  } else {
    const passwordHash = await hashPassword(password);
    admin = await prisma.user.create({
      data: {
        fullName: "ParkEase Admin",
        email,
        phone,
        passwordHash,
        status: UserStatus.ACTIVE,
        mustChangePassword: true,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        roles: { create: { role: UserRoleType.ADMIN } },
      },
      include: { roles: { select: { role: true } } },
    });
  }

  const legalDocuments = [
    {
      type: LegalDocumentType.TERMS_OF_SERVICE,
      version: "1.0",
      title: "ParkEase BD Terms of Service",
      contentHash: "development-terms-v1",
      effectiveAt: new Date(),
      isActive: true,
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
    },
    {
      type: LegalDocumentType.PRIVACY_POLICY,
      version: "1.0",
      title: "ParkEase BD Privacy Policy",
      contentHash: "development-privacy-v1",
      effectiveAt: new Date(),
      isActive: true,
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
    },
  ];

  for (const document of legalDocuments) {
    await prisma.legalDocument.upsert({
      where: {
        type_version: {
          type: document.type,
          version: document.version,
        },
      },
      update: {
        title: document.title,
        contentHash: document.contentHash,
      },
      create: document,
    });
  }

  if (!admin) throw new Error("Admin seed could not be resolved");
  const emailTemplates = [
    { type: EmailTemplateType.EMAIL_VERIFICATION_OTP, name: "Email verification code", subject: "{{otp}} is your ParkEase BD verification code", htmlBody: "<h1>Verify your email</h1><p>Hello {{userName}},</p><p>Your verification code is <strong>{{otp}}</strong>.</p><p>It expires in {{expiresIn}} minutes.</p>", textBody: "Hello {{userName}},\n\nYour ParkEase BD verification code is {{otp}}.\nIt expires in {{expiresIn}} minutes.", allowedVariables: ["userName", "otp", "expiresIn"] },
    { type: EmailTemplateType.ACCOUNT_SETUP, name: "Admin-created account setup", subject: "Complete your ParkEase BD account setup", htmlBody: "<h1>Complete your account setup</h1><p>Hello {{userName}},</p><p>Your {{status}} account is ready. Use this one-time link to set your password:</p><p><a href=\"{{setupUrl}}\">Set private password</a></p><p>The link expires in {{expiresIn}} minutes.</p>", textBody: "Hello {{userName}},\n\nYour {{status}} account is ready. Set your password: {{setupUrl}}\nThe link expires in {{expiresIn}} minutes.", allowedVariables: ["userName", "status", "setupUrl", "expiresIn"] },
    { type: EmailTemplateType.PASSWORD_RESET, name: "Password reset", subject: "Reset your ParkEase BD password", htmlBody: "<h1>Reset your password</h1><p>Hello {{userName}},</p><p><a href=\"{{resetUrl}}\">Reset password</a></p><p>The link expires in {{expiresIn}} minutes.</p>", textBody: "Hello {{userName}},\n\nReset your password: {{resetUrl}}\nThe link expires in {{expiresIn}} minutes.", allowedVariables: ["userName", "resetUrl", "expiresIn"] },
    { type: EmailTemplateType.GUARD_INVITATION, name: "Guard invitation", subject: "You have been invited to ParkEase BD", htmlBody: "<h1>Complete your Guard account</h1><p>Hello {{userName}},</p><p><a href=\"{{setupUrl}}\">Set account password</a></p><p>The link expires in {{expiresIn}} minutes.</p>", textBody: "Hello {{userName}},\n\nComplete your Guard account: {{setupUrl}}\nThe link expires in {{expiresIn}} minutes.", allowedVariables: ["userName", "setupUrl", "expiresIn"] },
    { type: EmailTemplateType.MANAGER_INVITATION, name: "Manager invitation", subject: "You have been invited to manage ParkEase BD operations", htmlBody: "<h1>Complete your Manager account</h1><p>Hello {{userName}},</p><p><a href=\"{{setupUrl}}\">Set account password</a></p><p>The link expires in {{expiresIn}} minutes.</p>", textBody: "Hello {{userName}},\n\nComplete your Manager account: {{setupUrl}}\nThe link expires in {{expiresIn}} minutes.", allowedVariables: ["userName", "setupUrl", "expiresIn"] },
    { type: EmailTemplateType.BROADCAST, name: "Platform broadcast", subject: "{{campaignTitle}}", htmlBody: "<h1>{{campaignTitle}}</h1><p>Hello {{userName}},</p><p>ParkEase BD has an update for you.</p>", textBody: "{{campaignTitle}}\n\nHello {{userName}},\n\nParkEase BD has an update for you.", allowedVariables: ["campaignTitle", "userName"] },
  ];
  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { type_version: { type: template.type, version: 1 } },
      update: {},
      create: { ...template, version: 1, status: ContentStatus.PUBLISHED, publishedAt: new Date(), createdByAdminId: admin.id },
    });
  }
  await seedProfessionalEmailTemplates(prisma, admin.id);

  for (const facility of [
    { code: "CCTV", displayName: "CCTV" },
    { code: "GUARD", displayName: "Security Guard" },
    { code: "COVERED", displayName: "Covered Parking" },
    { code: "EV_CHARGING", displayName: "EV Charging" },
    { code: "WHEELCHAIR_ACCESS", displayName: "Wheelchair Access" },
  ]) {
    await prisma.parkingFacility.upsert({
      where: { code: facility.code },
      update: { displayName: facility.displayName },
      create: facility,
    });
  }

  console.log("Seed completed");
  console.log(`Admin seed ensured: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
