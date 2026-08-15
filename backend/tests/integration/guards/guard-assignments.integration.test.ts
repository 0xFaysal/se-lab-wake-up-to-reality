import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration("Guard assignment lifecycle integration", () => {
  let server!: Server;
  let baseUrl!: string;
  let prisma!: typeof import("../../../src/config/prisma.js").prisma;
  let redis!: typeof import("../../../src/config/redis.js").redis;
  let generated!: typeof import("../../../generated/prisma/client.js");
  const cookies = new Map<string, string>();
  const users = new Map<string, { id: string; email: string; phone: string }>();
  const propertyIds: string[] = [];
  let verifiedPropertyId: string;
  let pendingPropertyId: string;
  let rejectedPropertyId: string;
  let otherOwnerPropertyId: string;
  let guardAAssignmentId: string;
  let guardBAssignmentId: string;

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
    role: "PARKING_OWNER" | "GUARD" | "DRIVER";
    ready?: boolean;
    mustChangePassword?: boolean;
  }) {
    const { hashPassword } =
      await import("../../../src/common/auth/password.js");
    const { signAccessToken } = await import("../../../src/common/auth/jwt.js");
    const ready = input.ready ?? true;
    const suffix = randomInt(10000000, 99999999);
    const user = await prisma.user.create({
      data: {
        fullName: `Day Seven ${input.key}`,
        email: `day-seven-${input.key}-${randomUUID()}@example.com`,
        phone: `+88017${suffix}`,
        passwordHash: await hashPassword("DaySevenPassword123!"),
        status: ready
          ? generated.UserStatus.ACTIVE
          : generated.UserStatus.PENDING,
        mustChangePassword: input.mustChangePassword ?? !ready,
        emailVerifiedAt: ready ? new Date() : null,
        phoneVerifiedAt: null,
        roles: { create: { role: generated.UserRoleType[input.role] } },
      },
    });
    users.set(input.key, user);

    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: `day-seven:${randomUUID()}`,
        rememberDevice: false,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const accessToken = await signAccessToken({
      userId: user.id,
      sessionId: session.id,
      roles: [generated.UserRoleType[input.role]],
    });
    cookies.set(input.key, `access_token=${accessToken}`);
  }

  async function createProperty(
    ownerKey: string,
    verificationStatus: "VERIFIED" | "PENDING" | "REJECTED",
  ) {
    const property = await prisma.property.create({
      data: {
        ownerUserId: users.get(ownerKey)!.id,
        name: `Day Seven ${verificationStatus} Parking`,
        publicArea: "Gulshan, Dhaka",
        approximateAddress: "Near Gulshan circle",
        exactAddressCiphertext: "integration-encrypted-address",
        exactAddressIv: "0123456789abcdef01234567",
        exactAddressTag: "0123456789abcdef0123456789abcdef",
        latitude: 23.7949,
        longitude: 90.4143,
        verificationStatus: generated.VerificationStatus[verificationStatus],
        status:
          verificationStatus === "VERIFIED"
            ? generated.PropertyStatus.ACTIVE
            : generated.PropertyStatus.INACTIVE,
      },
    });
    propertyIds.push(property.id);
    return property.id;
  }

  function shift(value: string): Date {
    const [hours, minutes] = value.split(":").map(Number);
    return new Date(Date.UTC(1970, 0, 1, hours!, minutes!));
  }

  async function createPendingAssignment(guardKey: string) {
    return prisma.propertyGuardAssignment.create({
      data: {
        propertyId: verifiedPropertyId,
        guardUserId: users.get(guardKey)!.id,
        createdByUserId: users.get("owner-a")!.id,
        shiftStart: shift("08:00"),
        shiftEnd: shift("20:00"),
      },
    });
  }

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDatabaseUrl!;
    process.env.REDIS_URL ??= "redis://localhost:6379";
    process.env.CORS_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET =
      "day-seven-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET =
      "day-seven-refresh-secret-at-least-32-characters";
    process.env.VERIFICATION_CODE_SECRET =
      "day-seven-verification-secret-at-least-32-characters";
    process.env.AUTH_METADATA_HASH_SECRET =
      "day-seven-metadata-secret-at-least-32-characters";
    process.env.DATA_ENCRYPTION_KEY =
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    process.env.ENABLE_API_DOCS = "false";

    generated = await import("../../../generated/prisma/client.js");
    const appModule = await import("../../../src/app.js");
    prisma = (await import("../../../src/config/prisma.js")).prisma;
    redis = (await import("../../../src/config/redis.js")).redis;
    await prisma.$connect();
    if (!redis.isOpen) await redis.connect();

    await createAuthenticatedUser({ key: "owner-a", role: "PARKING_OWNER" });
    await createAuthenticatedUser({ key: "owner-b", role: "PARKING_OWNER" });
    await createAuthenticatedUser({ key: "guard-a", role: "GUARD" });
    await createAuthenticatedUser({ key: "guard-b", role: "GUARD" });
    await createAuthenticatedUser({
      key: "guard-unready",
      role: "GUARD",
      ready: false,
    });
    await createAuthenticatedUser({ key: "driver", role: "DRIVER" });

    verifiedPropertyId = await createProperty("owner-a", "VERIFIED");
    pendingPropertyId = await createProperty("owner-a", "PENDING");
    rejectedPropertyId = await createProperty("owner-a", "REJECTED");
    otherOwnerPropertyId = await createProperty("owner-b", "VERIFIED");

    server = appModule.app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    const userIds = [...users.values()].map((user) => user.id);
    await prisma.propertyGuardAssignment.deleteMany({
      where: {
        OR: [
          { propertyId: { in: propertyIds } },
          { guardUserId: { in: userIds } },
        ],
      },
    });
    await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
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

  it("allows invitation only for an owned verified active Property", async () => {
    for (const propertyId of [pendingPropertyId, rejectedPropertyId]) {
      const response = await request(
        `/api/v1/owner/properties/${propertyId}/guard-invitations`,
        {
          method: "POST",
          cookie: cookies.get("owner-a"),
          body: JSON.stringify({
            identifier: users.get("guard-a")!.email,
            shiftStart: "08:00",
            shiftEnd: "20:00",
          }),
        },
      );
      assert.equal(response.status, 409);
    }

    const crossOwner = await request(
      `/api/v1/owner/properties/${otherOwnerPropertyId}/guard-invitations`,
      {
        method: "POST",
        cookie: cookies.get("owner-a"),
        body: JSON.stringify({
          identifier: users.get("guard-a")!.email,
          shiftStart: "08:00",
          shiftEnd: "20:00",
        }),
      },
    );
    assert.equal(crossOwner.status, 404);

    const created = await request(
      `/api/v1/owner/properties/${verifiedPropertyId}/guard-invitations`,
      {
        method: "POST",
        cookie: cookies.get("owner-a"),
        body: JSON.stringify({
          identifier: users.get("guard-a")!.phone,
          shiftStart: "08:00",
          shiftEnd: "20:00",
        }),
      },
    );
    assert.equal(created.status, 201);
    const body = (await created.json()) as {
      data: {
        assignment: {
          id: string;
          status: string;
          guard: Record<string, unknown>;
        };
      };
    };
    guardAAssignmentId = body.data.assignment.id;
    assert.equal(body.data.assignment.status, "PENDING_ACCEPTANCE");
    assert.equal("email" in body.data.assignment.guard, false);
    assert.equal("phone" in body.data.assignment.guard, false);
  });

  it("lets exactly one concurrent duplicate invitation succeed", async () => {
    const options = {
      method: "POST",
      cookie: cookies.get("owner-a"),
      body: JSON.stringify({
        identifier: users.get("guard-b")!.email,
        shiftStart: "09:00",
        shiftEnd: "18:00",
      }),
    };
    const responses = await Promise.all([
      request(
        `/api/v1/owner/properties/${verifiedPropertyId}/guard-invitations`,
        options,
      ),
      request(
        `/api/v1/owner/properties/${verifiedPropertyId}/guard-invitations`,
        options,
      ),
    ]);
    assert.deepEqual(
      responses.map((response) => response.status).sort(),
      [201, 409],
    );
    const success = responses.find((response) => response.status === 201)!;
    guardBAssignmentId = (
      (await success.json()) as { data: { assignment: { id: string } } }
    ).data.assignment.id;
  });

  it("enforces Owner, Guard, and role scopes without assignment enumeration", async () => {
    const ownerList = await request("/api/v1/owner/guard-assignments", {
      cookie: cookies.get("owner-a"),
    });
    assert.equal(ownerList.status, 200);
    const ownerListBody = (await ownerList.json()) as {
      data: { assignments: Array<{ id: string }> };
    };
    assert.ok(
      ownerListBody.data.assignments.some(
        (assignment) => assignment.id === guardAAssignmentId,
      ),
    );

    const crossOwnerRequests = await Promise.all([
      request(`/api/v1/owner/guard-assignments/${guardAAssignmentId}`, {
        cookie: cookies.get("owner-b"),
      }),
      request(`/api/v1/owner/guard-assignments/${guardAAssignmentId}`, {
        method: "PATCH",
        cookie: cookies.get("owner-b"),
        body: JSON.stringify({ action: "SUSPEND" }),
      }),
      request(`/api/v1/owner/guard-assignments/${guardAAssignmentId}`, {
        method: "DELETE",
        cookie: cookies.get("owner-b"),
      }),
    ]);
    assert.deepEqual(
      crossOwnerRequests.map((response) => response.status),
      [404, 404, 404],
    );

    const guardList = await request("/api/v1/guard/assignments", {
      cookie: cookies.get("guard-a"),
    });
    assert.equal(guardList.status, 200);
    const wrongGuard = await request(
      `/api/v1/guard/assignments/${guardAAssignmentId}`,
      { cookie: cookies.get("guard-b") },
    );
    assert.equal(wrongGuard.status, 404);
    const wrongGuardAccept = await request(
      `/api/v1/guard/assignments/${guardAAssignmentId}/accept`,
      { method: "POST", cookie: cookies.get("guard-b") },
    );
    assert.equal(wrongGuardAccept.status, 404);

    for (const [path, cookie] of [
      ["/api/v1/owner/guard-assignments", cookies.get("driver")],
      ["/api/v1/guard/assignments", cookies.get("driver")],
    ] as const) {
      assert.equal((await request(path, { cookie })).status, 403);
    }
  });

  it("allows an unready Guard to view but not accept an invitation", async () => {
    const invitation = await request(
      `/api/v1/owner/properties/${verifiedPropertyId}/guard-invitations`,
      {
        method: "POST",
        cookie: cookies.get("owner-a"),
        body: JSON.stringify({
          identifier: users.get("guard-unready")!.email,
          shiftStart: "10:00",
          shiftEnd: "19:00",
        }),
      },
    );
    assert.equal(invitation.status, 201);
    const assignmentId = (
      (await invitation.json()) as { data: { assignment: { id: string } } }
    ).data.assignment.id;
    assert.equal(
      (
        await request("/api/v1/guard/assignments", {
          cookie: cookies.get("guard-unready"),
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/v1/guard/assignments/${assignmentId}/accept`, {
          method: "POST",
          cookie: cookies.get("guard-unready"),
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request(`/api/v1/guard/assignments/${assignmentId}/reject`, {
          method: "POST",
          cookie: cookies.get("guard-unready"),
          body: JSON.stringify({}),
        })
      ).status,
      200,
    );
  });

  it("supports accept, shift re-acceptance, suspend, resume, and end", async () => {
    await prisma.property.update({
      where: { id: verifiedPropertyId },
      data: { status: generated.PropertyStatus.INACTIVE },
    });
    const ineligiblePropertyAccept = await request(
      `/api/v1/guard/assignments/${guardAAssignmentId}/accept`,
      { method: "POST", cookie: cookies.get("guard-a") },
    );
    assert.equal(ineligiblePropertyAccept.status, 409);
    await prisma.property.update({
      where: { id: verifiedPropertyId },
      data: { status: generated.PropertyStatus.ACTIVE },
    });

    const accept = await request(
      `/api/v1/guard/assignments/${guardAAssignmentId}/accept`,
      { method: "POST", cookie: cookies.get("guard-a") },
    );
    assert.equal(accept.status, 200);

    const shiftUpdate = await request(
      `/api/v1/owner/guard-assignments/${guardAAssignmentId}`,
      {
        method: "PATCH",
        cookie: cookies.get("owner-a"),
        body: JSON.stringify({
          action: "UPDATE_SHIFT",
          shiftStart: "07:00",
          shiftEnd: "19:00",
        }),
      },
    );
    assert.equal(shiftUpdate.status, 200);
    const updateBody = (await shiftUpdate.json()) as {
      data: { assignment: { status: string; acceptedAt: string | null } };
    };
    assert.equal(updateBody.data.assignment.status, "PENDING_ACCEPTANCE");
    assert.equal(updateBody.data.assignment.acceptedAt, null);

    assert.equal(
      (
        await request(
          `/api/v1/guard/assignments/${guardAAssignmentId}/accept`,
          {
            method: "POST",
            cookie: cookies.get("guard-a"),
          },
        )
      ).status,
      200,
    );
    for (const action of ["SUSPEND", "RESUME"] as const) {
      const response = await request(
        `/api/v1/owner/guard-assignments/${guardAAssignmentId}`,
        {
          method: "PATCH",
          cookie: cookies.get("owner-a"),
          body: JSON.stringify({ action }),
        },
      );
      assert.equal(response.status, 200);
    }
    assert.equal(
      (
        await request(`/api/v1/owner/guard-assignments/${guardAAssignmentId}`, {
          method: "DELETE",
          cookie: cookies.get("owner-a"),
        })
      ).status,
      204,
    );
    const stored = await prisma.propertyGuardAssignment.findUniqueOrThrow({
      where: { id: guardAAssignmentId },
    });
    assert.equal(stored.status, generated.GuardAssignmentStatus.ENDED);
  });

  it("supports Guard rejection and Owner cancellation without deleting history", async () => {
    assert.equal(
      (
        await request(
          `/api/v1/guard/assignments/${guardBAssignmentId}/reject`,
          {
            method: "POST",
            cookie: cookies.get("guard-b"),
            body: JSON.stringify({}),
          },
        )
      ).status,
      200,
    );
    const replacement = await createPendingAssignment("guard-b");
    assert.equal(
      (
        await request(`/api/v1/owner/guard-assignments/${replacement.id}`, {
          method: "DELETE",
          cookie: cookies.get("owner-a"),
        })
      ).status,
      204,
    );
    const stored = await prisma.propertyGuardAssignment.findUniqueOrThrow({
      where: { id: replacement.id },
    });
    assert.equal(stored.status, generated.GuardAssignmentStatus.CANCELLED);
  });

  it("allows only one concurrent Guard accept/reject transition", async () => {
    const assignment = await createPendingAssignment("guard-a");
    const responses = await Promise.all([
      request(`/api/v1/guard/assignments/${assignment.id}/accept`, {
        method: "POST",
        cookie: cookies.get("guard-a"),
      }),
      request(`/api/v1/guard/assignments/${assignment.id}/reject`, {
        method: "POST",
        cookie: cookies.get("guard-a"),
        body: JSON.stringify({}),
      }),
    ]);
    assert.deepEqual(
      responses.map((response) => response.status).sort(),
      [200, 409],
    );
    await prisma.propertyGuardAssignment.update({
      where: { id: assignment.id },
      data: {
        status: generated.GuardAssignmentStatus.ENDED,
        endedAt: new Date(),
      },
    });
  });

  it("allows only one concurrent Guard accept/Owner cancel transition", async () => {
    const assignment = await createPendingAssignment("guard-a");
    const responses = await Promise.all([
      request(`/api/v1/guard/assignments/${assignment.id}/accept`, {
        method: "POST",
        cookie: cookies.get("guard-a"),
      }),
      request(`/api/v1/owner/guard-assignments/${assignment.id}`, {
        method: "DELETE",
        cookie: cookies.get("owner-a"),
      }),
    ]);
    assert.deepEqual(
      responses.map((response) => response.status).sort(),
      [200, 409],
    );
  });

  it("blocks suspended and deleted Guard accounts from accepting", async () => {
    const guard = users.get("guard-b")!;
    const assignment = await createPendingAssignment("guard-b");

    await prisma.user.update({
      where: { id: guard.id },
      data: { status: generated.UserStatus.SUSPENDED },
    });
    const suspended = await request(
      `/api/v1/guard/assignments/${assignment.id}/accept`,
      { method: "POST", cookie: cookies.get("guard-b") },
    );
    assert.equal(suspended.status, 401);

    await prisma.user.update({
      where: { id: guard.id },
      data: { status: generated.UserStatus.ACTIVE, deletedAt: new Date() },
    });
    const deleted = await request(
      `/api/v1/guard/assignments/${assignment.id}/accept`,
      { method: "POST", cookie: cookies.get("guard-b") },
    );
    assert.equal(deleted.status, 401);

    await prisma.user.update({
      where: { id: guard.id },
      data: { deletedAt: null },
    });
  });
});
