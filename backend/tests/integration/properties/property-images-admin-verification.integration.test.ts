import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration("Property images and Admin verification integration", () => {
  let server!: Server;
  let baseUrl!: string;
  let prisma!: typeof import("../../../src/config/prisma.js").prisma;
  let redis!: typeof import("../../../src/config/redis.js").redis;
  let resetStorage!: () => void;
  const userIds: string[] = [];
  const propertyIds: string[] = [];
  const cookies = new Map<string, string>();
  const storedImageKeys = new Set<string>();
  let uploadedImageSequence = 0;
  let failNextDelete = false;
  let ownerPropertyId: string;
  let noImagePropertyId: string;
  let rejectedPropertyId: string;
  let racePropertyId: string;
  let cleanupPropertyId: string;
  let duplicateStorageForPropertyId: string | undefined;
  let firstImageId: string;
  let secondImageId: string;

  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );

  async function request(
    path: string,
    options: RequestInit & { cookie?: string | undefined } = {},
  ) {
    const headers = new Headers(options.headers);
    if (options.cookie) headers.set("cookie", options.cookie);
    if (options.body && !(options.body instanceof FormData)) {
      headers.set("content-type", "application/json");
    }
    return fetch(`${baseUrl}${path}`, { ...options, headers });
  }

  function imageForm(count = 1): FormData {
    const form = new FormData();
    for (let index = 0; index < count; index += 1) {
      form.append(
        "images",
        new Blob([new Uint8Array(pngBytes)], { type: "image/png" }),
        `parking-${index}.png`,
      );
    }
    return form;
  }

  async function createAuthenticatedUser(
    key: string,
    role: "PROVIDER" | "DRIVER" | "ADMIN",
    passwordHash: string,
  ) {
    const generated = await import("../../../generated/prisma/client.js");
    const { signAccessToken } = await import("../../../src/common/auth/jwt.js");
    const verifiedAt = new Date();
    const user = await prisma.user.create({
      data: {
        fullName: `Day Six ${key}`,
        email: `day-six-${key}-${randomUUID()}@example.com`,
        phone: `+8801${randomInt(300000000, 999999999)}`,
        passwordHash,
        status: generated.UserStatus.ACTIVE,
        emailVerifiedAt: verifiedAt,
        phoneVerifiedAt: key === "owner-a" ? null : verifiedAt,
        roles: { create: { role: generated.UserRoleType[role] } },
      },
    });
    userIds.push(user.id);

    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: `day-six:${randomUUID()}`,
        rememberDevice: false,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const accessToken = await signAccessToken({
      userId: user.id,
      sessionId: session.id,
      roles: [role],
    });
    cookies.set(key, `access_token=${accessToken}`);
    return user;
  }

  async function createPendingProperty(ownerUserId: string, label: string) {
    const generated = await import("../../../generated/prisma/client.js");
    const { encryptSensitiveText } =
      await import("../../../src/common/security/encryption.js");
    const exactAddress = `${label}, House 12, Road 45, Dhaka`;
    const address = encryptSensitiveText(exactAddress);
    const access = encryptSensitiveText("Use the guarded south entrance");
    const property = await prisma.property.create({
      data: {
        createdByUserId: ownerUserId,
        normalizedName: `${label} parking`.toLowerCase(),
        name: `${label} Parking`,
        publicArea: "Gulshan 2, Dhaka",
        approximateAddress: "Near Gulshan 2 circle",
        exactAddressCiphertext: address.ciphertext,
        exactAddressIv: address.iv,
        exactAddressTag: address.authTag,
        latitude: 23.7949,
        longitude: 90.4143,
        accessInstructionsCiphertext: access.ciphertext,
        accessInstructionsIv: access.iv,
        accessInstructionsTag: access.authTag,
        verificationStatus: generated.VerificationStatus.PENDING,
        status: generated.PropertyStatus.INACTIVE,
        providerMemberships: {
          create: {
            providerUserId: ownerUserId,
            verificationStatus: generated.VerificationStatus.PENDING,
          },
        },
      },
    });
    propertyIds.push(property.id);
    return { property, exactAddress };
  }

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDatabaseUrl!;
    process.env.REDIS_URL ??= "redis://localhost:6379";
    process.env.CORS_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET =
      "day-six-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET =
      "day-six-refresh-secret-at-least-32-characters";
    process.env.VERIFICATION_CODE_SECRET =
      "day-six-verification-secret-at-least-32-characters";
    process.env.AUTH_METADATA_HASH_SECRET =
      "day-six-metadata-secret-at-least-32-characters";
    process.env.PROPERTY_ADDRESS_FINGERPRINT_SECRET =
      "day-six-property-secret-at-least-32-characters";
    process.env.DATA_ENCRYPTION_KEY =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-api-key";
    process.env.CLOUDINARY_API_SECRET = "test-api-secret";
    process.env.ENABLE_API_DOCS = "false";

    const appModule = await import("../../../src/app.js");
    prisma = (await import("../../../src/config/prisma.js")).prisma;
    redis = (await import("../../../src/config/redis.js")).redis;
    const storageModule =
      await import("../../../src/common/uploads/property-image-storage.js");
    storageModule.setPropertyImageStorageForTests({
      async upload(_buffer, propertyId) {
        uploadedImageSequence += 1;
        const storageKey =
          duplicateStorageForPropertyId === propertyId
            ? `tests/${propertyId}/duplicate`
            : `tests/${propertyId}/${uploadedImageSequence}`;
        storedImageKeys.add(storageKey);
        return {
          storageKey,
          url: `https://images.example.test/${storageKey}.png`,
        };
      },
      async delete(storageKey) {
        if (failNextDelete) {
          failNextDelete = false;
          throw new Error("MOCK_STORAGE_DELETE_FAILED");
        }
        storedImageKeys.delete(storageKey);
      },
    });
    resetStorage = storageModule.resetPropertyImageStorageForTests;

    const { hashPassword } =
      await import("../../../src/common/auth/password.js");
    const passwordHash = await hashPassword("DaySixPassword123!");
    await prisma.$connect();
    if (!redis.isOpen) await redis.connect();

    const ownerA = await createAuthenticatedUser(
      "owner-a",
      "PROVIDER",
      passwordHash,
    );
    await createAuthenticatedUser("owner-b", "PROVIDER", passwordHash);
    await createAuthenticatedUser("driver", "DRIVER", passwordHash);
    await createAuthenticatedUser("admin", "ADMIN", passwordHash);

    ownerPropertyId = (await createPendingProperty(ownerA.id, "Review Ready"))
      .property.id;
    noImagePropertyId = (await createPendingProperty(ownerA.id, "No Image"))
      .property.id;
    rejectedPropertyId = (
      await createPendingProperty(ownerA.id, "Reject Candidate")
    ).property.id;
    racePropertyId = (
      await createPendingProperty(ownerA.id, "Concurrent Review")
    ).property.id;
    cleanupPropertyId = (
      await createPendingProperty(ownerA.id, "Cleanup Compensation")
    ).property.id;

    server = appModule.app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    resetStorage();
    if (propertyIds.length > 0) {
      await prisma.propertyImage.deleteMany({
        where: { propertyId: { in: propertyIds } },
      });
      await prisma.propertyProvider.deleteMany({
        where: { propertyId: { in: propertyIds } },
      });
      await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
    }
    if (userIds.length > 0) {
      await prisma.$transaction([
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

  it("uploads validated images and assigns exactly one initial cover", async () => {
    const response = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images`,
      {
        method: "POST",
        cookie: cookies.get("owner-a"),
        body: imageForm(2),
      },
    );
    assert.equal(response.status, 201);
    const body = (await response.json()) as {
      data: {
        images: Array<{
          id: string;
          isCover: boolean;
          sortOrder: number;
          url: string;
          storageKey?: string;
        }>;
      };
    };
    assert.equal(body.data.images.length, 2);
    assert.deepEqual(
      body.data.images.map((image) => image.isCover),
      [true, false],
    );
    assert.deepEqual(
      body.data.images.map((image) => image.sortOrder),
      [0, 1],
    );
    assert.equal("storageKey" in body.data.images[0]!, false);
    firstImageId = body.data.images[0]!.id;
    secondImageId = body.data.images[1]!.id;
  });

  it("rejects spoofed content and files larger than 5 MB", async () => {
    const spoofedForm = new FormData();
    spoofedForm.append(
      "images",
      new Blob(["not a real PNG"], { type: "image/png" }),
      "spoofed.png",
    );
    const spoofed = await request(
      `/api/v1/owner/properties/${cleanupPropertyId}/images`,
      {
        method: "POST",
        cookie: cookies.get("owner-a"),
        body: spoofedForm,
      },
    );
    assert.equal(spoofed.status, 415);

    const oversizedForm = new FormData();
    oversizedForm.append(
      "images",
      new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
        type: "image/png",
      }),
      "oversized.png",
    );
    const oversized = await request(
      `/api/v1/owner/properties/${cleanupPropertyId}/images`,
      {
        method: "POST",
        cookie: cookies.get("owner-a"),
        body: oversizedForm,
      },
    );
    assert.equal(oversized.status, 413);
  });

  it("cleans uploaded assets when database persistence fails", async () => {
    duplicateStorageForPropertyId = cleanupPropertyId;
    const response = await request(
      `/api/v1/owner/properties/${cleanupPropertyId}/images`,
      {
        method: "POST",
        cookie: cookies.get("owner-a"),
        body: imageForm(2),
      },
    );
    duplicateStorageForPropertyId = undefined;
    assert.equal(response.status, 500);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "PROPERTY_IMAGE_PERSISTENCE_FAILED");
    assert.equal(
      await prisma.propertyImage.count({
        where: { propertyId: cleanupPropertyId },
      }),
      0,
    );
    assert.equal(
      storedImageKeys.has(`tests/${cleanupPropertyId}/duplicate`),
      false,
    );
  });

  it("blocks cross-owner upload and lists only owned image metadata", async () => {
    const crossOwner = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images`,
      {
        method: "POST",
        cookie: cookies.get("owner-b"),
        body: imageForm(),
      },
    );
    assert.equal(crossOwner.status, 404);

    const crossOwnerList = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images`,
      { cookie: cookies.get("owner-b") },
    );
    assert.equal(crossOwnerList.status, 404);

    const crossOwnerReorder = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images/reorder`,
      {
        method: "PATCH",
        cookie: cookies.get("owner-b"),
        body: JSON.stringify({ imageIds: [firstImageId, secondImageId] }),
      },
    );
    assert.equal(crossOwnerReorder.status, 404);

    const list = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images`,
      { cookie: cookies.get("owner-a") },
    );
    assert.equal(list.status, 200);
    const body = (await list.json()) as {
      data: { images: Array<Record<string, unknown>> };
    };
    assert.equal(body.data.images.length, 2);
    assert.equal("storageKey" in body.data.images[0]!, false);
    assert.equal("provider" in body.data.images[0]!, false);
  });

  it("reorders images and maintains a single selected cover", async () => {
    const response = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images/reorder`,
      {
        method: "PATCH",
        cookie: cookies.get("owner-a"),
        body: JSON.stringify({
          imageIds: [secondImageId, firstImageId],
          coverImageId: secondImageId,
        }),
      },
    );
    assert.equal(response.status, 200);
    const images = await prisma.propertyImage.findMany({
      where: { propertyId: ownerPropertyId },
      orderBy: { sortOrder: "asc" },
    });
    assert.deepEqual(
      images.map((image) => image.id),
      [secondImageId, firstImageId],
    );
    assert.equal(images.filter((image) => image.isCover).length, 1);
    assert.equal(images[0]!.isCover, true);
  });

  it("keeps the DB row on storage failure and promotes a replacement cover", async () => {
    failNextDelete = true;
    const failed = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images/${secondImageId}`,
      { method: "DELETE", cookie: cookies.get("owner-a") },
    );
    assert.equal(failed.status, 502);
    assert.ok(
      await prisma.propertyImage.findUnique({ where: { id: secondImageId } }),
    );

    const crossOwner = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images/${secondImageId}`,
      { method: "DELETE", cookie: cookies.get("owner-b") },
    );
    assert.equal(crossOwner.status, 404);

    const deleted = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images/${secondImageId}`,
      { method: "DELETE", cookie: cookies.get("owner-a") },
    );
    assert.equal(deleted.status, 204);
    const remaining = await prisma.propertyImage.findMany({
      where: { propertyId: ownerPropertyId },
    });
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0]!.id, firstImageId);
    assert.equal(remaining[0]!.isCover, true);
    assert.equal(remaining[0]!.sortOrder, 0);
  });

  it("allows only Admin to list pending Properties and read decrypted detail", async () => {
    for (const key of ["owner-a", "driver"]) {
      const forbidden = await request("/api/v1/admin/properties/pending", {
        cookie: cookies.get(key),
      });
      assert.equal(forbidden.status, 403);
    }

    const pending = await request(
      "/api/v1/admin/properties/pending?page=1&limit=100",
      { cookie: cookies.get("admin") },
    );
    assert.equal(pending.status, 200);
    const pendingBody = (await pending.json()) as {
      data: {
        properties: Array<{ id: string }>;
        pagination: { total: number };
      };
    };
    assert.ok(
      pendingBody.data.properties.some(
        (property) => property.id === ownerPropertyId,
      ),
    );
    assert.ok(pendingBody.data.pagination.total >= 4);

    const detail = await request(
      `/api/v1/admin/properties/${ownerPropertyId}`,
      { cookie: cookies.get("admin") },
    );
    assert.equal(detail.status, 200);
    const detailBody = (await detail.json()) as {
      data: { property: Record<string, unknown> & { exactAddress: string } };
    };
    assert.match(detailBody.data.property.exactAddress, /Review Ready/);
    for (const privateField of [
      "exactAddressCiphertext",
      "exactAddressIv",
      "exactAddressTag",
    ]) {
      assert.equal(privateField in detailBody.data.property, false);
    }
  });

  it("blocks approval without an image and validates rejection reasons", async () => {
    const noImageApproval = await request(
      `/api/v1/admin/properties/${noImagePropertyId}/verification`,
      {
        method: "PATCH",
        cookie: cookies.get("admin"),
        body: JSON.stringify({ decision: "APPROVE" }),
      },
    );
    assert.equal(noImageApproval.status, 409);

    const invalidReject = await request(
      `/api/v1/admin/properties/${rejectedPropertyId}/verification`,
      {
        method: "PATCH",
        cookie: cookies.get("admin"),
        body: JSON.stringify({ decision: "REJECT" }),
      },
    );
    assert.equal(invalidReject.status, 400);

    const rejected = await request(
      `/api/v1/admin/properties/${rejectedPropertyId}/verification`,
      {
        method: "PATCH",
        cookie: cookies.get("admin"),
        body: JSON.stringify({
          decision: "REJECT",
          reason: "Entrance image and exact address do not match",
        }),
      },
    );
    assert.equal(rejected.status, 200);
    const stored = await prisma.property.findUniqueOrThrow({
      where: { id: rejectedPropertyId },
    });
    assert.equal(stored.verificationStatus, "REJECTED");
    assert.equal(stored.status, "INACTIVE");
    assert.equal(stored.verifiedAt, null);
    assert.ok(stored.verifiedByAdminId);
    assert.match(stored.rejectionReason ?? "", /do not match/);
  });

  it("returns a rejected Property to PENDING after an Owner edit", async () => {
    const current = await prisma.property.findUniqueOrThrow({
      where: { id: rejectedPropertyId },
      select: { version: true },
    });
    const response = await request(
      `/api/v1/owner/properties/${rejectedPropertyId}`,
      {
        method: "PATCH",
        cookie: cookies.get("owner-a"),
        body: JSON.stringify({
          version: current.version,
          approximateAddress: "Beside Gulshan market",
        }),
      },
    );
    assert.equal(response.status, 200);
    const property = await prisma.property.findUniqueOrThrow({
      where: { id: rejectedPropertyId },
    });
    assert.equal(property.verificationStatus, "PENDING");
    assert.equal(property.rejectionReason, null);
  });

  it("approves an email-verified owner's Property without phone verification", async () => {
    const approved = await request(
      `/api/v1/admin/properties/${ownerPropertyId}/verification`,
      {
        method: "PATCH",
        cookie: cookies.get("admin"),
        body: JSON.stringify({ decision: "APPROVE" }),
      },
    );
    assert.equal(approved.status, 200);
    const property = await prisma.property.findUniqueOrThrow({
      where: { id: ownerPropertyId },
    });
    assert.equal(property.verificationStatus, "VERIFIED");
    assert.equal(property.status, "ACTIVE");
    assert.ok(property.verifiedAt);
    assert.ok(property.verifiedByAdminId);
    assert.equal(property.rejectionReason, null);

    const repeated = await request(
      `/api/v1/admin/properties/${ownerPropertyId}/verification`,
      {
        method: "PATCH",
        cookie: cookies.get("admin"),
        body: JSON.stringify({ decision: "APPROVE" }),
      },
    );
    assert.equal(repeated.status, 409);
    const body = (await repeated.json()) as { error: { code: string } };
    assert.equal(body.error.code, "PROPERTY_ALREADY_VERIFIED");
  });

  it("returns a verified Property to review when its final image is removed", async () => {
    const deleted = await request(
      `/api/v1/owner/properties/${ownerPropertyId}/images/${firstImageId}`,
      { method: "DELETE", cookie: cookies.get("owner-a") },
    );
    assert.equal(deleted.status, 204);
    const property = await prisma.property.findUniqueOrThrow({
      where: { id: ownerPropertyId },
    });
    assert.equal(property.verificationStatus, "PENDING");
    assert.equal(property.status, "INACTIVE");
    assert.equal(property.verifiedAt, null);
    assert.equal(property.verifiedByAdminId, null);
  });

  it("allows exactly one concurrent verification decision to win", async () => {
    const upload = await request(
      `/api/v1/owner/properties/${racePropertyId}/images`,
      {
        method: "POST",
        cookie: cookies.get("owner-a"),
        body: imageForm(),
      },
    );
    assert.equal(upload.status, 201);

    const decisions = await Promise.all([
      request(`/api/v1/admin/properties/${racePropertyId}/verification`, {
        method: "PATCH",
        cookie: cookies.get("admin"),
        body: JSON.stringify({ decision: "APPROVE" }),
      }),
      request(`/api/v1/admin/properties/${racePropertyId}/verification`, {
        method: "PATCH",
        cookie: cookies.get("admin"),
        body: JSON.stringify({
          decision: "REJECT",
          reason: "Concurrent review found inconsistent entrance details",
        }),
      }),
    ]);
    assert.deepEqual(
      decisions.map((response) => response.status).sort(),
      [200, 409],
    );
    const losingDecision = decisions.find(
      (response) => response.status === 409,
    );
    assert.ok(losingDecision);
    const conflictBody = (await losingDecision.json()) as {
      error: { code: string };
    };
    assert.equal(conflictBody.error.code, "PROPERTY_VERIFICATION_CONFLICT");
  });
});
