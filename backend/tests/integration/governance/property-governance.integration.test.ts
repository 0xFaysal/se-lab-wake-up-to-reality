import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration("multi-provider Property governance integration", () => {
  let prisma!: typeof import("../../../src/config/prisma.js").prisma;
  let governance!: typeof import("../../../src/modules/property-governance/property-governance.service.js");
  let governancePolicy!: typeof import("../../../src/modules/property-governance/property-governance.policy.js");
  let generated!: typeof import("../../../generated/prisma/client.js");
  const userIds: string[] = [];
  let propertyId!: string;
  let providerAId!: string;
  let providerBId!: string;
  let adminId!: string;
  let providerBMembershipId!: string;

  async function createUser(
    label: string,
    role: "PROVIDER" | "ADMIN",
  ) {
    const user = await prisma.user.create({
      data: {
        fullName: `Governance ${label}`,
        email: `governance-${label}-${randomUUID()}@example.com`,
        phone: `+88017${randomInt(10000000, 99999999)}`,
        passwordHash: "integration-test-password-hash",
        status: generated.UserStatus.ACTIVE,
        mustChangePassword: false,
        emailVerifiedAt: new Date(),
        roles: { create: { role: generated.UserRoleType[role] } },
      },
    });
    userIds.push(user.id);
    return user;
  }

  function hasCode(expected: string) {
    return (error: unknown) =>
      Boolean(
        error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === expected,
      );
  }

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDatabaseUrl!;
    process.env.REDIS_URL ??= "redis://localhost:6379";
    process.env.CORS_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET =
      "governance-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET =
      "governance-refresh-secret-at-least-32-characters";
    process.env.VERIFICATION_CODE_SECRET =
      "governance-verification-secret-at-least-32-characters";
    process.env.AUTH_METADATA_HASH_SECRET =
      "governance-metadata-secret-at-least-32-characters";
    process.env.PROPERTY_ADDRESS_FINGERPRINT_SECRET =
      "governance-fingerprint-secret-at-least-32-characters";
    process.env.DATA_ENCRYPTION_KEY =
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    process.env.ENABLE_API_DOCS = "false";

    generated = await import("../../../generated/prisma/client.js");
    prisma = (await import("../../../src/config/prisma.js")).prisma;
    governance = await import(
      "../../../src/modules/property-governance/property-governance.service.js"
    );
    governancePolicy = await import(
      "../../../src/modules/property-governance/property-governance.policy.js"
    );
    await prisma.$connect();

    const providerA = await createUser("provider-a", "PROVIDER");
    const providerB = await createUser("provider-b", "PROVIDER");
    const admin = await createUser("admin", "ADMIN");
    providerAId = providerA.id;
    providerBId = providerB.id;
    adminId = admin.id;

    const property = await prisma.property.create({
      data: {
        createdByUserId: providerA.id,
        name: "Governance Integration Parking",
        normalizedName: "governance integration parking",
        publicArea: "Banani, Dhaka",
        approximateAddress: "Near Banani field",
        exactAddressCiphertext: "integration-ciphertext",
        exactAddressIv: "0123456789abcdef01234567",
        exactAddressTag: "0123456789abcdef0123456789abcdef",
        latitude: 23.7937,
        longitude: 90.4066,
        status: generated.PropertyStatus.ACTIVE,
        verificationStatus: generated.VerificationStatus.VERIFIED,
        providerMemberships: {
          create: {
            providerUserId: providerA.id,
            verificationStatus: generated.VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
          },
        },
      },
    });
    propertyId = property.id;

    const providerBMembership = await prisma.propertyProvider.create({
      data: {
        propertyId,
        providerUserId: providerB.id,
        status: generated.PropertyProviderStatus.ACTIVE,
        verificationStatus: generated.VerificationStatus.PENDING,
      },
    });
    providerBMembershipId = providerBMembership.id;
  });

  after(async () => {
    if (propertyId) {
      await prisma.domainAuditEvent.deleteMany({ where: { propertyId } });
      await prisma.propertyChangeVote.deleteMany({
        where: { proposal: { propertyId } },
      });
      await prisma.propertyChangeProposal.deleteMany({ where: { propertyId } });
      await prisma.propertyBuildingManagerVote.deleteMany({
        where: { assignment: { propertyId } },
      });
      await prisma.propertyBuildingManagerAssignment.deleteMany({
        where: { propertyId },
      });
      await prisma.propertyProvider.deleteMany({ where: { propertyId } });
      await prisma.property.deleteMany({ where: { id: propertyId } });
    }
    if (userIds.length > 0) {
      await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  it("transitions authority and prevents stale shared changes", async () => {
    const singleProviderUpdate = await governance.updateCommonRules(
      providerAId,
      propertyId,
      { version: 1, generalParkingRules: "Single Provider rule" },
    );
    assert.equal(singleProviderUpdate.version, 2);

    await governance.verifyProviderMembership(
      adminId,
      propertyId,
      providerBMembershipId,
      { decision: "APPROVE" },
    );
    assert.equal(
      await governancePolicy.getPropertyGovernanceMode(propertyId),
      "MULTI_PROVIDER",
    );
    await assert.rejects(
      governance.updateCommonRules(providerAId, propertyId, {
        version: 2,
        generalParkingRules: "Direct multi-provider overwrite",
      }),
      hasCode("PROPERTY_COMMON_AUTHORITY_REQUIRED"),
    );

    const nomination = await governance.nominateBuildingManager(
      providerAId,
      propertyId,
      { candidateUserId: providerAId },
    );
    assert.equal(nomination.status, "PENDING_APPROVAL");
    const activated = await governance.voteForBuildingManager(
      providerBId,
      propertyId,
      nomination.id,
      { decision: "APPROVE" },
    );
    assert.equal(activated.status, "ACTIVE");

    const managerUpdate = await governance.updateCommonRules(
      providerAId,
      propertyId,
      { version: 2, commonSafetyRules: "Keep the emergency lane clear" },
    );
    assert.equal(managerUpdate.version, 3);
    await assert.rejects(
      governance.updateTemporaryClosure(providerBId, propertyId, {
        action: "CLOSE",
        version: 3,
        reason: "Provider B cannot close a shared Property",
      }),
      hasCode("PROPERTY_COMMON_AUTHORITY_REQUIRED"),
    );
    const closed = await governance.updateTemporaryClosure(
      providerAId,
      propertyId,
      {
        action: "CLOSE",
        version: 3,
        reason: "Scheduled electrical maintenance",
      },
    );
    assert.equal(closed.status, "TEMPORARILY_CLOSED");
    await governance.updateTemporaryClosure(providerAId, propertyId, {
      action: "REOPEN",
      version: 4,
    });

    const proposal = await governance.createPropertyChangeProposal(
      providerAId,
      propertyId,
      {
        changeType: "COMMON_RULES",
        baseVersion: 5,
        changes: { generalParkingRules: "This stale proposal must not apply" },
      },
    );
    await prisma.property.update({
      where: { id: propertyId },
      data: { version: { increment: 1 } },
    });
    const staleResult = await governance.voteOnPropertyChangeProposal(
      providerBId,
      propertyId,
      proposal.id,
      { decision: "APPROVE" },
    );
    assert.equal(staleResult.status, "STALE");
    const stored = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });
    assert.notEqual(
      stored.generalParkingRules,
      "This stale proposal must not apply",
    );

    const raceProposal = await governance.createPropertyChangeProposal(
      providerAId,
      propertyId,
      {
        changeType: "COMMON_RULES",
        baseVersion: 6,
        changes: { generalParkingRules: "Exactly one concurrent vote applies" },
      },
    );
    const concurrentVotes = await Promise.allSettled([
      governance.voteOnPropertyChangeProposal(
        providerBId,
        propertyId,
        raceProposal.id,
        { decision: "APPROVE" },
      ),
      governance.voteOnPropertyChangeProposal(
        providerBId,
        propertyId,
        raceProposal.id,
        { decision: "APPROVE" },
      ),
    ]);
    assert.equal(
      concurrentVotes.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      concurrentVotes.filter((result) => result.status === "rejected").length,
      1,
    );
    const afterRace = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });
    assert.equal(
      afterRace.generalParkingRules,
      "Exactly one concurrent vote applies",
    );
  });
});
