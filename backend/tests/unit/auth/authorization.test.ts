import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { UserRoleType, UserStatus } from "../../../generated/prisma/client.js";
import { requireAccountReady } from "../../../src/common/middleware/require-account-ready.js";
import { requirePasswordChangeComplete } from "../../../src/common/middleware/require-password-change-complete.js";
import { requireRole } from "../../../src/common/middleware/require-role.js";
import { AppError } from "../../../src/common/errors/app-error.js";

type AuthContext = NonNullable<Express.Request["auth"]>;

function requestWithAuth(overrides: Partial<AuthContext> = {}) {
  return {
    auth: {
      userId: "user-id",
      sessionId: "session-id",
      roles: [UserRoleType.DRIVER],
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      emailVerified: true,
      phoneVerified: true,
      ...overrides,
    },
  } as Request;
}

function runMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => unknown,
  req: Request,
) {
  let nextValue: unknown = Symbol("not-called");
  middleware(req, {} as Response, (value?: unknown) => {
    nextValue = value;
  });
  return nextValue;
}

describe("authorization middleware", () => {
  it("allows an assigned role", () => {
    assert.equal(
      runMiddleware(requireRole(UserRoleType.DRIVER), requestWithAuth()),
      undefined,
    );
  });

  it("rejects a role that is not assigned", () => {
    const result = runMiddleware(
      requireRole(UserRoleType.ADMIN),
      requestWithAuth(),
    );
    assert.ok(result instanceof AppError);
    assert.equal((result as AppError).code, "AUTH_FORBIDDEN");
  });

  it("blocks normal work until an initial password is changed", () => {
    const result = runMiddleware(
      requirePasswordChangeComplete,
      requestWithAuth({ mustChangePassword: true }),
    );
    assert.ok(result instanceof AppError);
    assert.equal(
      (result as AppError).code,
      "AUTH_INITIAL_PASSWORD_CHANGE_REQUIRED",
    );
  });

  it("allows operational work only after all account checks pass", () => {
    assert.equal(
      runMiddleware(requireAccountReady, requestWithAuth()),
      undefined,
    );
  });

  it("requires email verification before operational work", () => {
    const result = runMiddleware(
      requireAccountReady,
      requestWithAuth({ emailVerified: false }),
    );
    assert.ok(result instanceof AppError);
    assert.equal((result as AppError).code, "AUTH_EMAIL_VERIFICATION_REQUIRED");
  });

  it("allows operational work without optional phone verification", () => {
    assert.equal(
      runMiddleware(
        requireAccountReady,
        requestWithAuth({ phoneVerified: false }),
      ),
      undefined,
    );
  });

  it("does not treat a non-active account as operationally ready", () => {
    const result = runMiddleware(
      requireAccountReady,
      requestWithAuth({ status: UserStatus.PENDING }),
    );
    assert.ok(result instanceof AppError);
    assert.equal((result as AppError).code, "AUTH_ACCOUNT_NOT_ACTIVE");
  });
});
