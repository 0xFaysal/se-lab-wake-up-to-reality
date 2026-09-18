import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration("vehicle management integration", () => {
  let server!: Server;
  let baseUrl!: string;
  let prisma!: typeof import("../../../src/config/prisma.js").prisma;
  let redis!: typeof import("../../../src/config/redis.js").redis;
  const userIds: string[] = [];
  const cookies = new Map<string, string>();
  let firstVehicleId: string;
  let secondVehicleId: string;

  const suffix = `${Date.now()}${randomInt(100, 999)}`.slice(-8);

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
    role: "DRIVER" | "PROVIDER";
    phonePrefix: "013" | "014" | "015" | "016";
    ready: boolean;
  }) {
    const generated = await import("../../../generated/prisma/client.js");
    const { hashPassword } =
      await import("../../../src/common/auth/password.js");
    const { signAccessToken } = await import("../../../src/common/auth/jwt.js");
    const passwordHash = await hashPassword("VehicleIntegrationPassword123!");
    const verifiedAt = input.ready ? new Date() : null;
    const user = await prisma.user.create({
      data: {
        fullName: `Vehicle ${input.key}`,
        email: `vehicle-${input.key}-${Date.now()}@example.com`,
        phone: `+880${input.phonePrefix.slice(1)}${suffix}`,
        passwordHash,
        status: input.ready
          ? generated.UserStatus.ACTIVE
          : generated.UserStatus.PENDING,
        emailVerifiedAt: verifiedAt,
        phoneVerifiedAt: verifiedAt,
        roles: { create: { role: generated.UserRoleType[input.role] } },
      },
    });
    userIds.push(user.id);

    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: `integration:${randomUUID()}`,
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
      "vehicle-integration-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET =
      "vehicle-integration-refresh-secret-at-least-32-characters";
    process.env.VERIFICATION_CODE_SECRET =
      "vehicle-integration-verification-secret-at-least-32-characters";
    process.env.AUTH_METADATA_HASH_SECRET =
      "vehicle-integration-metadata-secret-at-least-32-characters";
    process.env.PROPERTY_ADDRESS_FINGERPRINT_SECRET =
      "vehicle-integration-property-secret-at-least-32-characters";
    process.env.ENABLE_API_DOCS = "false";

    const appModule = await import("../../../src/app.js");
    prisma = (await import("../../../src/config/prisma.js")).prisma;
    redis = (await import("../../../src/config/redis.js")).redis;
    await prisma.$connect();
    if (!redis.isOpen) await redis.connect();

    await createAuthenticatedUser({
      key: "driver-a",
      role: "DRIVER",
      phonePrefix: "013",
      ready: true,
    });
    await createAuthenticatedUser({
      key: "driver-b",
      role: "DRIVER",
      phonePrefix: "014",
      ready: true,
    });
    await createAuthenticatedUser({
      key: "owner",
      role: "PROVIDER",
      phonePrefix: "015",
      ready: true,
    });
    await createAuthenticatedUser({
      key: "unverified-driver",
      role: "DRIVER",
      phonePrefix: "016",
      ready: false,
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
        prisma.vehicle.deleteMany({ where: { ownerUserId: { in: userIds } } }),
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

  it("makes the first vehicle default and the second non-default", async () => {
    const first = await request("/api/v1/vehicles", {
      method: "POST",
      cookie: cookies.get("driver-a"),
      body: JSON.stringify({
        vehicleType: "SEDAN",
        registrationNumber: "DHAKA METRO GA 12-3456",
        brand: "Toyota",
        model: "Axio",
        color: "White",
        heightCm: 145,
        widthCm: 177,
        lengthCm: 440,
      }),
    });
    assert.equal(first.status, 201);
    const firstBody = (await first.json()) as {
      data: {
        vehicle: { id: string; isDefault: boolean; verificationStatus: string };
      };
    };
    firstVehicleId = firstBody.data.vehicle.id;
    assert.equal(firstBody.data.vehicle.isDefault, true);
    assert.equal(firstBody.data.vehicle.verificationStatus, "PENDING");

    const second = await request("/api/v1/vehicles", {
      method: "POST",
      cookie: cookies.get("driver-a"),
      body: JSON.stringify({
        vehicleType: "SUV",
        registrationNumber: "DHAKA METRO KHA 98-7654",
        brand: "Honda",
        model: "Vezel",
        color: "Black",
      }),
    });
    assert.equal(second.status, 201);
    const secondBody = (await second.json()) as {
      data: { vehicle: { id: string; isDefault: boolean } };
    };
    secondVehicleId = secondBody.data.vehicle.id;
    assert.equal(secondBody.data.vehicle.isDefault, false);
  });

  it("atomically changes and orders the default vehicle", async () => {
    const changed = await request(
      `/api/v1/vehicles/${secondVehicleId}/default`,
      { method: "PATCH", cookie: cookies.get("driver-a") },
    );
    assert.equal(changed.status, 200);

    const list = await request("/api/v1/vehicles", {
      cookie: cookies.get("driver-a"),
    });
    assert.equal(list.status, 200);
    const body = (await list.json()) as {
      data: { vehicles: Array<{ id: string; isDefault: boolean }> };
    };
    assert.equal(body.data.vehicles[0]?.id, secondVehicleId);
    assert.equal(
      body.data.vehicles.filter((vehicle) => vehicle.isDefault).length,
      1,
    );
  });

  it("gets and updates only an owned active vehicle", async () => {
    const get = await request(`/api/v1/vehicles/${firstVehicleId}`, {
      cookie: cookies.get("driver-a"),
    });
    assert.equal(get.status, 200);

    const update = await request(`/api/v1/vehicles/${firstVehicleId}`, {
      method: "PATCH",
      cookie: cookies.get("driver-a"),
      body: JSON.stringify({ color: "Silver", heightCm: null }),
    });
    assert.equal(update.status, 200);
    const body = (await update.json()) as {
      data: { vehicle: { color: string; heightCm: number | null } };
    };
    assert.deepEqual(
      { color: body.data.vehicle.color, heightCm: body.data.vehicle.heightCm },
      { color: "Silver", heightCm: null },
    );

    const duplicateUpdate = await request(
      `/api/v1/vehicles/${firstVehicleId}`,
      {
        method: "PATCH",
        cookie: cookies.get("driver-a"),
        body: JSON.stringify({
          registrationNumber: "dhaka-metro-kha-98 7654",
        }),
      },
    );
    assert.equal(duplicateUpdate.status, 409);
  });

  it("returns 404 for every cross-Driver vehicle mutation", async () => {
    const attempts = await Promise.all([
      request(`/api/v1/vehicles/${firstVehicleId}`, {
        cookie: cookies.get("driver-b"),
      }),
      request(`/api/v1/vehicles/${firstVehicleId}`, {
        method: "PATCH",
        cookie: cookies.get("driver-b"),
        body: JSON.stringify({ color: "Red" }),
      }),
      request(`/api/v1/vehicles/${firstVehicleId}`, {
        method: "DELETE",
        cookie: cookies.get("driver-b"),
      }),
      request(`/api/v1/vehicles/${firstVehicleId}/default`, {
        method: "PATCH",
        cookie: cookies.get("driver-b"),
      }),
    ]);
    assert.deepEqual(
      attempts.map((response) => response.status),
      [404, 404, 404, 404],
    );
  });

  it("blocks globally duplicated normalized registrations", async () => {
    const duplicate = await request("/api/v1/vehicles", {
      method: "POST",
      cookie: cookies.get("driver-b"),
      body: JSON.stringify({
        vehicleType: "SEDAN",
        registrationNumber: "dhaka-metro-ga-12 3456",
        brand: "Toyota",
        model: "Axio",
        color: "Blue",
      }),
    });
    assert.equal(duplicate.status, 409);
    const body = (await duplicate.json()) as { error: { code: string } };
    assert.equal(body.error.code, "VEHICLE_REGISTRATION_CONFLICT");
  });

  it("blocks non-Driver and unverified accounts", async () => {
    const payload = JSON.stringify({
      vehicleType: "MOTORCYCLE",
      registrationNumber: "DHAKA METRO LA 11-2222",
      brand: "Yamaha",
      model: "FZ",
      color: "Blue",
    });
    const owner = await request("/api/v1/vehicles", {
      method: "POST",
      cookie: cookies.get("owner"),
      body: payload,
    });
    assert.equal(owner.status, 403);

    const unverified = await request("/api/v1/vehicles", {
      method: "POST",
      cookie: cookies.get("unverified-driver"),
      body: payload,
    });
    assert.equal(unverified.status, 403);
    const body = (await unverified.json()) as { error: { code: string } };
    assert.equal(body.error.code, "AUTH_EMAIL_VERIFICATION_REQUIRED");
  });

  it("soft-deletes the default and promotes the newest remaining vehicle", async () => {
    const deleted = await request(`/api/v1/vehicles/${secondVehicleId}`, {
      method: "DELETE",
      cookie: cookies.get("driver-a"),
    });
    assert.equal(deleted.status, 204);

    const hidden = await request(`/api/v1/vehicles/${secondVehicleId}`, {
      cookie: cookies.get("driver-a"),
    });
    assert.equal(hidden.status, 404);

    const list = await request("/api/v1/vehicles", {
      cookie: cookies.get("driver-a"),
    });
    const body = (await list.json()) as {
      data: { vehicles: Array<{ id: string; isDefault: boolean }> };
    };
    assert.equal(body.data.vehicles.length, 1);
    assert.equal(body.data.vehicles[0]?.id, firstVehicleId);
    assert.equal(body.data.vehicles[0]?.isDefault, true);
  });

  it("deletes a non-default vehicle without changing the current default", async () => {
    const created = await request("/api/v1/vehicles", {
      method: "POST",
      cookie: cookies.get("driver-a"),
      body: JSON.stringify({
        vehicleType: "MOTORCYCLE",
        registrationNumber: "DHAKA METRO HA 33-4444",
        brand: "Honda",
        model: "CBR",
        color: "Red",
      }),
    });
    const createdBody = (await created.json()) as {
      data: { vehicle: { id: string; isDefault: boolean } };
    };
    assert.equal(createdBody.data.vehicle.isDefault, false);

    const deleted = await request(
      `/api/v1/vehicles/${createdBody.data.vehicle.id}`,
      { method: "DELETE", cookie: cookies.get("driver-a") },
    );
    assert.equal(deleted.status, 204);

    const current = await request(`/api/v1/vehicles/${firstVehicleId}`, {
      cookie: cookies.get("driver-a"),
    });
    const currentBody = (await current.json()) as {
      data: { vehicle: { isDefault: boolean } };
    };
    assert.equal(currentBody.data.vehicle.isDefault, true);
  });
});
