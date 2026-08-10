import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { randomInt } from "node:crypto";
import type { Server } from "node:http";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration("authentication integration", () => {
  let server!: Server;
  let baseUrl!: string;
  let prisma!: typeof import("../../../src/config/prisma.js").prisma;
  let redis!: typeof import("../../../src/config/redis.js").redis;

  const suffix = `${Date.now()}${randomInt(100, 999)}`.slice(-8);
  const email = `integration-${Date.now()}@example.com`;
  const localPhone = `017${suffix}`;
  const internationalPhone = `+88017${suffix}`;
  const password = "IntegrationPassword123!";

  function cookieValue(headers: Headers, name: string): string {
    const getSetCookie = (headers as Headers & {
      getSetCookie?: () => string[];
    }).getSetCookie;
    const values = getSetCookie
      ? getSetCookie.call(headers)
      : [headers.get("set-cookie") ?? ""];
    const match = values
      .flatMap((value) => value.split(/,(?=\s*[^;,]+=)/))
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${name}=`));

    assert.ok(match, `Missing ${name} response cookie`);
    return match.split(";", 1)[0]!;
  }

  async function request(
    path: string,
    options: RequestInit & { cookies?: string[] } = {},
  ) {
    const headers = new Headers(options.headers);
    if (options.cookies?.length) headers.set("cookie", options.cookies.join("; "));
    if (options.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return fetch(`${baseUrl}${path}`, { ...options, headers });
  }

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDatabaseUrl!;
    process.env.REDIS_URL ??= "redis://localhost:6379";
    process.env.CORS_ORIGIN ??= "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET ??= "integration-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET ??= "integration-refresh-secret-at-least-32-characters";

    const appModule = await import("../../../src/app.js");
    const prismaModule = await import("../../../src/config/prisma.js");
    const redisModule = await import("../../../src/config/redis.js");
    const generated = await import("../../../generated/prisma/client.js");

    prisma = prismaModule.prisma;
    redis = redisModule.redis;
    await prisma.$connect();
    if (!redis.isOpen) await redis.connect();

    for (const document of [
      {
        type: generated.LegalDocumentType.TERMS_OF_SERVICE,
        version: "integration-1.0",
        title: "Integration Terms",
        contentHash: "integration-terms",
      },
      {
        type: generated.LegalDocumentType.PRIVACY_POLICY,
        version: "integration-1.0",
        title: "Integration Privacy",
        contentHash: "integration-privacy",
      },
    ]) {
      await prisma.legalDocument.upsert({
        where: { type_version: { type: document.type, version: document.version } },
        update: { isActive: true },
        create: { ...document, effectiveAt: new Date(), isActive: true },
      });
    }

    server = appModule.app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        prisma.refreshSession.deleteMany({ where: { userId: user.id } }),
        prisma.userLegalAcceptance.deleteMany({ where: { userId: user.id } }),
        prisma.walletAccount.deleteMany({ where: { userId: user.id } }),
        prisma.userRole.deleteMany({ where: { userId: user.id } }),
        prisma.user.delete({ where: { id: user.id } }),
      ]);
    }

    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  });

  it("registers once for all equivalent phone formats", async () => {
    const registration = await request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Integration Driver",
        email,
        phone: localPhone,
        password,
        role: "DRIVER",
        acceptTerms: true,
        acceptPrivacyPolicy: true,
      }),
    });

    assert.equal(registration.status, 201);
    assert.ok(cookieValue(registration.headers, "access_token"));
    assert.ok(cookieValue(registration.headers, "refresh_token"));

    const duplicate = await request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Duplicate Driver",
        email: `duplicate-${email}`,
        phone: internationalPhone,
        password,
        role: "DRIVER",
        acceptTerms: true,
        acceptPrivacyPolicy: true,
      }),
    });

    assert.equal(duplicate.status, 409);
  });

  it("allows exactly one concurrent refresh and revokes all sessions", async () => {
    const login = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: internationalPhone, password, rememberDevice: true }),
    });
    assert.equal(login.status, 200);

    const oldRefreshCookie = cookieValue(login.headers, "refresh_token");
    const rotations = await Promise.all([
      request("/api/v1/auth/refresh", { method: "POST", cookies: [oldRefreshCookie] }),
      request("/api/v1/auth/refresh", { method: "POST", cookies: [oldRefreshCookie] }),
    ]);
    assert.deepEqual(rotations.map((response) => response.status).sort(), [200, 401]);

    const successfulRotation = rotations.find((response) => response.status === 200)!;
    const accessCookie = cookieValue(successfulRotation.headers, "access_token");
    const sessions = await request("/api/v1/users/me/sessions", {
      cookies: [accessCookie],
    });
    assert.equal(sessions.status, 200);

    const logoutAll = await request("/api/v1/auth/logout-all", {
      method: "POST",
      cookies: [accessCookie],
    });
    assert.equal(logoutAll.status, 204);

    const me = await request("/api/v1/auth/me", { cookies: [accessCookie] });
    assert.equal(me.status, 401);
  });
});
