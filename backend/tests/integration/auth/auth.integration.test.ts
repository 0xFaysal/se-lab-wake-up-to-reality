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
  const changedPassword = "ChangedIntegrationPassword456!";
  const guardEmail = `integration-guard-${Date.now()}@example.com`;
  const guardPhone = `+88018${suffix}`;
  const guardPassword = "IntegrationGuardPassword123!";
  let ownerAccessCookie: string;
  let currentPassword = password;

  function cookieValue(headers: Headers, name: string): string {
    const getSetCookie = (
      headers as Headers & {
        getSetCookie?: () => string[];
      }
    ).getSetCookie;
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
    if (options.cookies?.length)
      headers.set("cookie", options.cookies.join("; "));
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
    process.env.JWT_ACCESS_SECRET ??=
      "integration-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET ??=
      "integration-refresh-secret-at-least-32-characters";
    process.env.VERIFICATION_CODE_SECRET ??=
      "integration-verification-secret-at-least-32-characters";
    process.env.AUTH_METADATA_HASH_SECRET ??=
      "integration-metadata-secret-at-least-32-characters";
    process.env.EXPOSE_DEVELOPMENT_AUTH_CODES = "true";

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
        where: {
          type_version: { type: document.type, version: document.version },
        },
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
    for (const cleanupEmail of [guardEmail, email]) {
      const user = await prisma.user.findUnique({
        where: { email: cleanupEmail },
      });
      if (!user) continue;

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
        fullName: "Integration Owner",
        email,
        phone: localPhone,
        password,
        role: "PARKING_OWNER",
        acceptTerms: true,
        acceptPrivacyPolicy: true,
      }),
    });

    assert.equal(registration.status, 201);
    ownerAccessCookie = cookieValue(registration.headers, "access_token");
    assert.ok(cookieValue(registration.headers, "refresh_token"));
    const registrationBody = (await registration.json()) as {
      data: { user: { status: string }; nextAction: string };
    };
    assert.equal(registrationBody.data.user.status, "PENDING");
    assert.equal(registrationBody.data.nextAction, "VERIFY_EMAIL");

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

  it("blocks cross-site state-changing requests", async () => {
    const response = await request("/api/v1/auth/login", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
      body: JSON.stringify({ identifier: email, password }),
    });

    assert.equal(response.status, 403);
  });

  it("completes email and phone verification in order", async () => {
    const emailRequest = await request(
      "/api/v1/auth/email-verification/request",
      { method: "POST", cookies: [ownerAccessCookie] },
    );
    assert.equal(emailRequest.status, 202);
    const emailRequestBody = (await emailRequest.json()) as {
      data: { developmentCode: string };
    };
    assert.match(emailRequestBody.data.developmentCode, /^\d{6}$/);

    const emailConfirmation = await request(
      "/api/v1/auth/email-verification/confirm",
      {
        method: "POST",
        cookies: [ownerAccessCookie],
        body: JSON.stringify({ code: emailRequestBody.data.developmentCode }),
      },
    );
    assert.equal(emailConfirmation.status, 200);

    const phoneRequest = await request(
      "/api/v1/auth/phone-verification/request",
      { method: "POST", cookies: [ownerAccessCookie] },
    );
    assert.equal(phoneRequest.status, 202);
    const phoneRequestBody = (await phoneRequest.json()) as {
      data: { developmentCode: string };
    };
    assert.match(phoneRequestBody.data.developmentCode, /^\d{6}$/);

    const phoneConfirmation = await request(
      "/api/v1/auth/phone-verification/confirm",
      {
        method: "POST",
        cookies: [ownerAccessCookie],
        body: JSON.stringify({ code: phoneRequestBody.data.developmentCode }),
      },
    );
    assert.equal(phoneConfirmation.status, 200);

    const me = await request("/api/v1/auth/me", {
      cookies: [ownerAccessCookie],
    });
    assert.equal(me.status, 200);
    const meBody = (await me.json()) as {
      data: {
        user: {
          status: string;
          emailVerified: boolean;
          phoneVerified: boolean;
        };
      };
    };
    assert.deepEqual(
      {
        status: meBody.data.user.status,
        emailVerified: meBody.data.user.emailVerified,
        phoneVerified: meBody.data.user.phoneVerified,
      },
      { status: "ACTIVE", emailVerified: true, phoneVerified: true },
    );
  });

  it("lets a ready owner invite a Guard without sharing a password", async () => {
    const response = await request("/api/v1/users/guards", {
      method: "POST",
      cookies: [ownerAccessCookie],
      body: JSON.stringify({
        fullName: "Integration Guard",
        email: guardEmail,
        phone: guardPhone,
      }),
    });
    assert.equal(response.status, 201);

    const body = (await response.json()) as {
      data: {
        user: { status: string; roles: string[] };
        developmentSetupToken: string;
      };
    };
    assert.equal(body.data.user.status, "PENDING");
    assert.deepEqual(body.data.user.roles, ["GUARD"]);
    assert.ok(body.data.developmentSetupToken.length >= 32);

    const setup = await request("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: body.data.developmentSetupToken,
        newPassword: guardPassword,
      }),
    });
    assert.equal(setup.status, 200);

    const guardLogin = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: guardEmail, password: guardPassword }),
    });
    assert.equal(guardLogin.status, 200);
    const loginBody = (await guardLogin.json()) as {
      data: { nextAction: string };
    };
    assert.equal(loginBody.data.nextAction, "VERIFY_PHONE");
  });

  it("delivers and consumes a single-use password reset token", async () => {
    const resetRequest = await request("/api/v1/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ identifier: email }),
    });
    assert.equal(resetRequest.status, 202);
    const requestBody = (await resetRequest.json()) as {
      data: { developmentResetToken: string };
    };
    assert.ok(requestBody.data.developmentResetToken.length >= 32);

    const reset = await request("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: requestBody.data.developmentResetToken,
        newPassword: changedPassword,
      }),
    });
    assert.equal(reset.status, 200);
    currentPassword = changedPassword;

    const reused = await request("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: requestBody.data.developmentResetToken,
        newPassword: password,
      }),
    });
    assert.equal(reused.status, 400);
  });

  it("detects concurrent refresh reuse and contains the session family", async () => {
    const login = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: internationalPhone,
        password: currentPassword,
        rememberDevice: true,
      }),
    });
    assert.equal(login.status, 200);

    const oldRefreshCookie = cookieValue(login.headers, "refresh_token");
    const rotations = await Promise.all([
      request("/api/v1/auth/refresh", {
        method: "POST",
        cookies: [oldRefreshCookie],
      }),
      request("/api/v1/auth/refresh", {
        method: "POST",
        cookies: [oldRefreshCookie],
      }),
    ]);
    assert.deepEqual(
      rotations.map((response) => response.status).sort(),
      [200, 401],
    );

    const successfulRotation = rotations.find(
      (response) => response.status === 200,
    )!;
    const accessCookie = cookieValue(
      successfulRotation.headers,
      "access_token",
    );
    const replayedSession = await request("/api/v1/auth/me", {
      cookies: [accessCookie],
    });
    assert.equal(replayedSession.status, 401);

    const replacementLogin = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: internationalPhone,
        password: currentPassword,
      }),
    });
    assert.equal(replacementLogin.status, 200);
    const replacementAccessCookie = cookieValue(
      replacementLogin.headers,
      "access_token",
    );

    const sessions = await request("/api/v1/users/me/sessions", {
      cookies: [replacementAccessCookie],
    });
    assert.equal(sessions.status, 200);

    const logoutAll = await request("/api/v1/auth/logout-all", {
      method: "POST",
      cookies: [replacementAccessCookie],
    });
    assert.equal(logoutAll.status, 204);

    const me = await request("/api/v1/auth/me", {
      cookies: [replacementAccessCookie],
    });
    assert.equal(me.status, 401);
  });
});
