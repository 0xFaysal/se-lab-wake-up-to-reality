import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration("parking owner property management integration", () => {
  let server!: Server;
  let baseUrl!: string;
  let prisma!: typeof import("../../../src/config/prisma.js").prisma;
  let redis!: typeof import("../../../src/config/redis.js").redis;
  const userIds: string[] = [];
  const cookies = new Map<string, string>();
  let propertyId: string;
  let originalExactAddressIv: string;
  let originalAccessInstructionsIv: string;

  const exactAddress = "House 12, Road 45, Gulshan 2, Dhaka";
  const updatedExactAddress = "House 18, Road 51, Gulshan 2, Dhaka";

  async function request(
    path: string,
    options: RequestInit & { cookie?: string | undefined } = {},
  ) {
    const headers = new Headers(options.headers);
    if (options.cookie) headers.set("cookie", options.cookie);
    if (options.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return fetch(`${baseUrl}${path}`, { ...options, headers });
  }

  async function createAuthenticatedUser(input: {
    key: string;
    role: "PROVIDER" | "DRIVER" | "GUARD" | "ADMIN";
    phonePrefix: "013" | "014" | "015" | "016" | "017" | "018" | "019";
    ready: boolean;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    mustChangePassword?: boolean;
    passwordHash: string;
  }) {
    const generated = await import("../../../generated/prisma/client.js");
    const { signAccessToken } = await import("../../../src/common/auth/jwt.js");
    const verifiedAt = new Date();
    const emailVerifiedAt =
      (input.emailVerified ?? input.ready) ? verifiedAt : null;
    const phoneVerifiedAt =
      (input.phoneVerified ?? input.ready) ? verifiedAt : null;
    const user = await prisma.user.create({
      data: {
        fullName: `Property ${input.key}`,
        email: `property-${input.key}-${Date.now()}@example.com`,
        phone: `+880${input.phonePrefix.slice(1)}${randomInt(
          10000000,
          99999999,
        )}`,
        passwordHash: input.passwordHash,
        mustChangePassword: input.mustChangePassword ?? false,
        status: input.ready
          ? generated.UserStatus.ACTIVE
          : generated.UserStatus.PENDING,
        emailVerifiedAt,
        phoneVerifiedAt,
        roles: { create: { role: generated.UserRoleType[input.role] } },
      },
    });
    userIds.push(user.id);

    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: `property-integration:${randomUUID()}`,
        rememberDevice: false,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const accessToken = await signAccessToken({
      userId: user.id,
      sessionId: session.id,
      roles: [input.role],
    });
    cookies.set(input.key, `access_token=${accessToken}`);
  }

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDatabaseUrl!;
    process.env.REDIS_URL ??= "redis://localhost:6379";
    process.env.CORS_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET =
      "property-integration-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET =
      "property-integration-refresh-secret-at-least-32-characters";
    process.env.VERIFICATION_CODE_SECRET =
      "property-integration-verification-secret-at-least-32-characters";
    process.env.AUTH_METADATA_HASH_SECRET =
      "property-integration-metadata-secret-at-least-32-characters";
    process.env.PROPERTY_ADDRESS_FINGERPRINT_SECRET =
      "property-integration-fingerprint-secret-at-least-32-characters";
    process.env.DATA_ENCRYPTION_KEY =
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    process.env.ENABLE_API_DOCS = "false";

    const appModule = await import("../../../src/app.js");
    prisma = (await import("../../../src/config/prisma.js")).prisma;
    redis = (await import("../../../src/config/redis.js")).redis;
    const { hashPassword } =
      await import("../../../src/common/auth/password.js");
    const passwordHash = await hashPassword("PropertyIntegrationPassword123!");

    await prisma.$connect();
    if (!redis.isOpen) await redis.connect();

    await createAuthenticatedUser({
      key: "owner-a",
      role: "PROVIDER",
      phonePrefix: "013",
      ready: true,
      passwordHash,
    });
    await createAuthenticatedUser({
      key: "owner-b",
      role: "PROVIDER",
      phonePrefix: "014",
      ready: true,
      passwordHash,
    });
    await createAuthenticatedUser({
      key: "driver",
      role: "DRIVER",
      phonePrefix: "015",
      ready: true,
      passwordHash,
    });
    await createAuthenticatedUser({
      key: "guard",
      role: "GUARD",
      phonePrefix: "016",
      ready: true,
      passwordHash,
    });
    await createAuthenticatedUser({
      key: "unverified-owner",
      role: "PROVIDER",
      phonePrefix: "017",
      ready: false,
      passwordHash,
    });
    await createAuthenticatedUser({
      key: "admin",
      role: "ADMIN",
      phonePrefix: "018",
      ready: true,
      passwordHash,
    });
    await createAuthenticatedUser({
      key: "phone-unverified-owner",
      role: "PROVIDER",
      phonePrefix: "019",
      ready: true,
      phoneVerified: false,
      passwordHash,
    });
    await createAuthenticatedUser({
      key: "must-change-owner",
      role: "PROVIDER",
      phonePrefix: "013",
      ready: true,
      mustChangePassword: true,
      passwordHash,
    });

    server = appModule.app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (userIds.length > 0) {
      await prisma.$transaction([
        prisma.propertyProvider.deleteMany({ where: { providerUserId: { in: userIds } } }),
        prisma.property.deleteMany({ where: { createdByUserId: { in: userIds } } }),
        prisma.refreshSession.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.userRole.deleteMany({ where: { userId: { in: userIds } } }),
        prisma.user.deleteMany({ where: { id: { in: userIds } } }),
      ]);
    }
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  it("creates a pending property with sensitive fields encrypted at rest", async () => {
    const response = await request("/api/v1/owner/properties", {
      method: "POST",
      cookie: cookies.get("owner-a"),
      body: JSON.stringify({
        name: "Gulshan Residential Parking",
        publicArea: "Gulshan 2, Dhaka",
        approximateAddress: "Near Gulshan 2 circle",
        exactAddress,
        latitude: 23.7949,
        longitude: 90.4143,
        entranceLatitude: 23.7947,
        entranceLongitude: 90.4146,
        accessInstructions: "Use the south gate and contact security",
      }),
    });
    assert.equal(response.status, 201);
    const body = (await response.json()) as {
      data: {
        property: {
          id: string;
          exactAddress: string;
          verificationStatus: string;
          status: string;
        };
      };
    };
    propertyId = body.data.property.id;
    assert.equal(body.data.property.exactAddress, exactAddress);
    assert.equal(body.data.property.verificationStatus, "PENDING");
    assert.equal(body.data.property.status, "INACTIVE");

    const stored = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });
    assert.notEqual(stored.exactAddressCiphertext, exactAddress);
    assert.equal(stored.exactAddressCiphertext.includes(exactAddress), false);
    assert.ok(stored.exactAddressIv);
    assert.ok(stored.exactAddressTag);
    assert.ok(stored.accessInstructionsCiphertext);
    assert.ok(stored.accessInstructionsIv);
    assert.ok(stored.accessInstructionsTag);
    originalExactAddressIv = stored.exactAddressIv;
    originalAccessInstructionsIv = stored.accessInstructionsIv;
  });

  it("lists summaries without private fields and decrypts owner detail", async () => {
    const list = await request("/api/v1/owner/properties", {
      cookie: cookies.get("owner-a"),
    });
    assert.equal(list.status, 200);
    const listBody = (await list.json()) as {
      data: { properties: Array<Record<string, unknown>> };
    };
    assert.equal(listBody.data.properties.length, 1);
    assert.equal("exactAddress" in listBody.data.properties[0]!, false);
    assert.equal("accessInstructions" in listBody.data.properties[0]!, false);

    const detail = await request(`/api/v1/owner/properties/${propertyId}`, {
      cookie: cookies.get("owner-a"),
    });
    assert.equal(detail.status, 200);
    const detailBody = (await detail.json()) as {
      data: {
        property: { exactAddress: string; accessInstructions: string };
      };
    };
    assert.equal(detailBody.data.property.exactAddress, exactAddress);
    assert.equal(
      detailBody.data.property.accessInstructions,
      "Use the south gate and contact security",
    );
  });

  it("returns 404 for cross-owner read, update, and delete attempts", async () => {
    const attempts = await Promise.all([
      request(`/api/v1/owner/properties/${propertyId}`, {
        cookie: cookies.get("owner-b"),
      }),
      request(`/api/v1/owner/properties/${propertyId}`, {
        method: "PATCH",
        cookie: cookies.get("owner-b"),
        body: JSON.stringify({ name: "Stolen Property", version: 1 }),
      }),
      request(`/api/v1/owner/properties/${propertyId}`, {
        method: "DELETE",
        cookie: cookies.get("owner-b"),
      }),
    ]);
    assert.deepEqual(
      attempts.map((response) => response.status),
      [404, 404, 404],
    );
  });

  it("requires the owner role, email verification, and completed password setup", async () => {
    const payload = JSON.stringify({
      name: "Forbidden Property",
      publicArea: "Banani, Dhaka",
      approximateAddress: "Near Banani field",
      exactAddress: "Road 11, Banani, Dhaka",
      latitude: 23.7937,
      longitude: 90.4066,
    });
    for (const key of ["driver", "guard", "admin"]) {
      const response = await request("/api/v1/owner/properties", {
        method: "POST",
        cookie: cookies.get(key),
        body: payload,
      });
      assert.equal(response.status, 403);
    }

    for (const [key, expectedCode] of [
      ["unverified-owner", "AUTH_EMAIL_VERIFICATION_REQUIRED"],
      ["must-change-owner", "AUTH_INITIAL_PASSWORD_CHANGE_REQUIRED"],
    ] as const) {
      const response = await request("/api/v1/owner/properties", {
        method: "POST",
        cookie: cookies.get(key),
        body: payload,
      });
      assert.equal(response.status, 403);
      const body = (await response.json()) as { error: { code: string } };
      assert.equal(body.error.code, expectedCode);
    }

    const phoneUnverifiedOwner = await request("/api/v1/owner/properties", {
      method: "POST",
      cookie: cookies.get("phone-unverified-owner"),
      body: payload,
    });
    assert.equal(phoneUnverifiedOwner.status, 201);
  });

  it("keeps verification for minor edits and re-encrypts instructions", async () => {
    const generated = await import("../../../generated/prisma/client.js");
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        verificationStatus: generated.VerificationStatus.VERIFIED,
        status: generated.PropertyStatus.ACTIVE,
        verifiedAt: new Date(),
      },
    });

    const response = await request(`/api/v1/owner/properties/${propertyId}`, {
      method: "PATCH",
      cookie: cookies.get("owner-a"),
      body: JSON.stringify({
        version: (await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })).version,
        name: "Gulshan Secure Parking",
        accessInstructions: "Use Gate B and call the desk",
      }),
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      data: {
        property: {
          verificationStatus: string;
          status: string;
          accessInstructions: string;
        };
      };
    };
    assert.equal(body.data.property.verificationStatus, "VERIFIED");
    assert.equal(body.data.property.status, "ACTIVE");
    assert.equal(
      body.data.property.accessInstructions,
      "Use Gate B and call the desk",
    );

    const stored = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });
    assert.notEqual(stored.accessInstructionsIv, originalAccessInstructionsIv);
  });

  it("resets verification and uses a fresh IV after a critical edit", async () => {
    const response = await request(`/api/v1/owner/properties/${propertyId}`, {
      method: "PATCH",
      cookie: cookies.get("owner-a"),
      body: JSON.stringify({
        version: (await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })).version,
        exactAddress: updatedExactAddress,
      }),
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      data: {
        property: {
          exactAddress: string;
          verificationStatus: string;
          status: string;
          verifiedAt: string | null;
        };
      };
    };
    assert.equal(body.data.property.exactAddress, updatedExactAddress);
    assert.equal(body.data.property.verificationStatus, "PENDING");
    assert.equal(body.data.property.status, "INACTIVE");
    assert.equal(body.data.property.verifiedAt, null);

    const stored = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });
    assert.notEqual(stored.exactAddressIv, originalExactAddressIv);
    assert.equal(
      stored.exactAddressCiphertext.includes(updatedExactAddress),
      false,
    );
  });

  it("returns a rejected property to pending review after an owner edit", async () => {
    const generated = await import("../../../generated/prisma/client.js");
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        verificationStatus: generated.VerificationStatus.REJECTED,
        rejectionReason: "Entrance could not be confirmed",
      },
    });

    const response = await request(`/api/v1/owner/properties/${propertyId}`, {
      method: "PATCH",
      cookie: cookies.get("owner-a"),
      body: JSON.stringify({
        version: (await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })).version,
        approximateAddress: "Beside Gulshan market",
      }),
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      data: {
        property: {
          verificationStatus: string;
          rejectionReason: string | null;
        };
      };
    };
    assert.equal(body.data.property.verificationStatus, "PENDING");
    assert.equal(body.data.property.rejectionReason, null);
  });

  it("does not expose crypto errors when protected data is tampered", async () => {
    const stored = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });
    const originalTag = stored.exactAddressTag;
    assert.ok(originalTag);
    await prisma.property.update({
      where: { id: propertyId },
      data: { exactAddressTag: Buffer.alloc(16, 1).toString("base64") },
    });

    const response = await request(`/api/v1/owner/properties/${propertyId}`, {
      cookie: cookies.get("owner-a"),
    });
    assert.equal(response.status, 500);
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };
    assert.equal(body.error.code, "PROPERTY_ENCRYPTION_FAILED");
    assert.equal(body.error.message.includes("authenticate"), false);

    await prisma.property.update({
      where: { id: propertyId },
      data: { exactAddressTag: originalTag },
    });
  });

  it("soft-deletes and hides the property", async () => {
    const deleted = await request(`/api/v1/owner/properties/${propertyId}`, {
      method: "DELETE",
      cookie: cookies.get("owner-a"),
    });
    assert.equal(deleted.status, 204);

    const detail = await request(`/api/v1/owner/properties/${propertyId}`, {
      cookie: cookies.get("owner-a"),
    });
    assert.equal(detail.status, 404);

    const list = await request("/api/v1/owner/properties", {
      cookie: cookies.get("owner-a"),
    });
    const body = (await list.json()) as {
      data: { properties: unknown[] };
    };
    assert.deepEqual(body.data.properties, []);

    const stored = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });
    assert.ok(stored.deletedAt);
  });
});
