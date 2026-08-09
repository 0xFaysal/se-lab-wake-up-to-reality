import "dotenv/config";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { LegalDocumentType, PrismaClient, UserRoleType, UserStatus } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl })
});

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@parkease.local";
  const phone = process.env.SEED_ADMIN_PHONE ?? "01700000000";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: "ParkEase Admin",
      phone,
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date()
    },
    create: {
      fullName: "ParkEase Admin",
      email,
      phone,
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date()
    }
  });

  await prisma.userRole.upsert({
    where: { userId_role: { userId: admin.id, role: UserRoleType.ADMIN } },
    update: {},
    create: { userId: admin.id, role: UserRoleType.ADMIN }
  });

  const legalDocuments = [
    {
      type: LegalDocumentType.TERMS_OF_SERVICE,
      version: "1.0",
      title: "ParkEase BD Terms of Service",
      contentHash: "development-terms-v1",
      effectiveAt: new Date(),
      isActive: true
    },
    {
      type: LegalDocumentType.PRIVACY_POLICY,
      version: "1.0",
      title: "ParkEase BD Privacy Policy",
      contentHash: "development-privacy-v1",
      effectiveAt: new Date(),
      isActive: true
    }
  ];

  for (const document of legalDocuments) {
    await prisma.legalDocument.upsert({
      where: {
        type_version: {
          type: document.type,
          version: document.version
        }
      },
      update: {
        title: document.title,
        contentHash: document.contentHash,
        isActive: true
      },
      create: document
    });
  }

  for (const facility of [
    { code: "CCTV", displayName: "CCTV" },
    { code: "GUARD", displayName: "Security Guard" },
    { code: "COVERED", displayName: "Covered Parking" },
    { code: "EV_CHARGING", displayName: "EV Charging" },
    { code: "WHEELCHAIR_ACCESS", displayName: "Wheelchair Access" }
  ]) {
    await prisma.parkingFacility.upsert({
      where: { code: facility.code },
      update: { displayName: facility.displayName },
      create: facility
    });
  }

  console.log("Seed completed");
  console.log(`Admin email: ${email}`);
  console.log(`Admin password: ${password}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
