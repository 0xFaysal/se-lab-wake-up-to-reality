import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration("normalized Property Guard lifecycle integration", () => {
  let server!: Server;
  let baseUrl!: string;
  let prisma!: typeof import("../../../src/config/prisma.js").prisma;
  let redis!: typeof import("../../../src/config/redis.js").redis;
  let propertyId!: string;
  const users = new Map<string, { id: string; email: string }>();
  const cookies = new Map<string, string>();

  async function request(
    path: string,
    options: RequestInit & { cookie?: string | undefined } = {},
  ) {
    const headers = new Headers(options.headers);
    if (options.cookie) headers.set("cookie", options.cookie);
    if (options.body) headers.set("content-type", "application/json");
    return fetch(`${baseUrl}${path}`, { ...options, headers });
  }

  async function createUser(key: string, role: "PROVIDER" | "GUARD") {
    const generated = await import("../../../generated/prisma/client.js");
    const { hashPassword } =
      await import("../../../src/common/auth/password.js");
    const { signAccessToken } = await import("../../../src/common/auth/jwt.js");
    const user = await prisma.user.create({
      data: {
        fullName: `Guard Flow ${key}`,
        email: `guard-flow-${key}-${randomUUID()}@example.com`,
        phone: `+88017${randomInt(10000000, 99999999)}`,
        passwordHash: await hashPassword("GuardFlowPassword123!"),
        status: generated.UserStatus.ACTIVE,
        mustChangePassword: false,
        emailVerifiedAt: new Date(),
        roles: { create: { role: generated.UserRoleType[role] } },
      },
    });
    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: randomUUID(),
        rememberDevice: false,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    cookies.set(
      key,
      `access_token=${await signAccessToken({ userId: user.id, sessionId: session.id, roles: [generated.UserRoleType[role]] })}`,
    );
    users.set(key, user);
    return user;
  }

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDatabaseUrl!;
    process.env.REDIS_URL ??= "redis://localhost:6379";
    process.env.CORS_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET =
      "guard-flow-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET =
      "guard-flow-refresh-secret-at-least-32-characters";
    process.env.VERIFICATION_CODE_SECRET =
      "guard-flow-verification-secret-at-least-32-characters";
    process.env.AUTH_METADATA_HASH_SECRET =
      "guard-flow-metadata-secret-at-least-32-characters";
    process.env.PROPERTY_ADDRESS_FINGERPRINT_SECRET =
      "guard-flow-property-secret-at-least-32-characters";
    process.env.DATA_ENCRYPTION_KEY =
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    process.env.ENABLE_API_DOCS = "false";

    const appModule = await import("../../../src/app.js");
    prisma = (await import("../../../src/config/prisma.js")).prisma;
    redis = (await import("../../../src/config/redis.js")).redis;
    await prisma.$connect();
    if (!redis.isOpen) await redis.connect();
    const provider = await createUser("provider", "PROVIDER");
    await createUser("other-provider", "PROVIDER");
    await createUser("guard", "GUARD");
    const generated = await import("../../../generated/prisma/client.js");
    const property = await prisma.property.create({
      data: {
        createdByUserId: provider.id,
        name: "Normalized Guard Test Parking",
        normalizedName: "normalized guard test parking",
        publicArea: "Gulshan, Dhaka",
        approximateAddress: "Near Gulshan Circle",
        exactAddressCiphertext: "integration-ciphertext",
        exactAddressIv: "0123456789abcdef01234567",
        exactAddressTag: "0123456789abcdef0123456789abcdef",
        latitude: 23.7949,
        longitude: 90.4143,
        status: generated.PropertyStatus.ACTIVE,
        verificationStatus: generated.VerificationStatus.VERIFIED,
        providerMemberships: {
          create: {
            providerUserId: provider.id,
            verificationStatus: generated.VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
          },
        },
      },
    });
    propertyId = property.id;
    await prisma.propertyProvider.create({
      data: {
        propertyId,
        providerUserId: users.get("other-provider")!.id,
        verificationStatus: generated.VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });
    server = appModule.app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    const userIds = [...users.values()].map((user) => user.id);
    await prisma.providerGuardAssignment.deleteMany({
      where: { propertyGuardMembership: { propertyId } },
    });
    await prisma.propertyGuardMembership.deleteMany({ where: { propertyId } });
    await prisma.domainAuditEvent.deleteMany({ where: { propertyId } });
    await prisma.propertyProvider.deleteMany({ where: { propertyId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.refreshSession.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  it("requires Guard consent before provider-specific assignment", async () => {
    const invitation = await request(
      `/api/v1/properties/${propertyId}/guards`,
      {
        method: "POST",
        cookie: cookies.get("provider"),
        body: JSON.stringify({ identifier: users.get("guard")!.email }),
      },
    );
    assert.equal(invitation.status, 201);
    const membershipId = (
      (await invitation.json()) as { data: { membership: { id: string } } }
    ).data.membership.id;

    const sharedDirectory = await request(
      `/api/v1/properties/${propertyId}/guards`,
      {
        cookie: cookies.get("other-provider"),
      },
    );
    assert.equal(sharedDirectory.status, 200);
    assert.equal(
      ((await sharedDirectory.json()) as { data: { memberships: unknown[] } })
        .data.memberships.length,
      1,
    );

    const tooEarly = await request(
      `/api/v1/provider/properties/${propertyId}/guard-assignments`,
      {
        method: "POST",
        cookie: cookies.get("provider"),
        body: JSON.stringify({
          guardMembershipId: membershipId,
          shiftStart: "08:00",
          shiftEnd: "20:00",
        }),
      },
    );
    assert.equal(tooEarly.status, 409);

    const accepted = await request(
      `/api/v1/guard/property-memberships/${membershipId}/accept`,
      {
        method: "POST",
        cookie: cookies.get("guard"),
      },
    );
    assert.equal(accepted.status, 200);

    const assigned = await request(
      `/api/v1/provider/properties/${propertyId}/guard-assignments`,
      {
        method: "POST",
        cookie: cookies.get("provider"),
        body: JSON.stringify({
          guardMembershipId: membershipId,
          shiftStart: "08:00",
          shiftEnd: "20:00",
        }),
      },
    );
    assert.equal(assigned.status, 201);
    const providerAAssignmentId = (
      (await assigned.json()) as {
        data: { assignment: { id: string } };
      }
    ).data.assignment.id;

    const isolated = await request(
      `/api/v1/provider/guard-assignments?propertyId=${propertyId}`,
      {
        cookie: cookies.get("other-provider"),
      },
    );
    assert.equal(isolated.status, 200);
    assert.equal(
      ((await isolated.json()) as { data: { assignments: unknown[] } }).data
        .assignments.length,
      0,
    );

    const crossProviderMutation = await request(
      `/api/v1/provider/guard-assignments/${providerAAssignmentId}`,
      {
        method: "PATCH",
        cookie: cookies.get("other-provider"),
        body: JSON.stringify({ action: "SUSPEND" }),
      },
    );
    assert.equal(crossProviderMutation.status, 404);

    const independentAssignment = await request(
      "/api/v1/provider/guard-assignments",
      {
        method: "POST",
        cookie: cookies.get("other-provider"),
        body: JSON.stringify({
          propertyId,
          guardMembershipId: membershipId,
          shiftStart: "09:00",
          shiftEnd: "18:00",
        }),
      },
    );
    assert.equal(independentAssignment.status, 201);
  });
});
