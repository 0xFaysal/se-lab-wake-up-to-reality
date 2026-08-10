import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { UserRoleType } from "../../../generated/prisma/client.js";
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
      mustChangePassword: false,
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
});
