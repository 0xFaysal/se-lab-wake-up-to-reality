import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  LegalDocumentType,
  PrismaClient,
  UserRoleType,
  UserStatus,
} from "../generated/prisma/client.js";
import { normalizeBangladeshPhone } from "../src/common/auth/phone.js";
import { hashPassword } from "../src/common/auth/password.js";

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
    },
    {
      type: LegalDocumentType.PRIVACY_POLICY,
      version: "1.0",
      title: "ParkEase BD Privacy Policy",
      contentHash: "development-privacy-v1",
      effectiveAt: new Date(),
      isActive: true,
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
        isActive: true,
      },
      create: document,
    });
  }

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

  if (!admin) throw new Error("Admin seed could not be resolved");
  console.log("Seed completed");
  console.log(`Admin seed ensured: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
