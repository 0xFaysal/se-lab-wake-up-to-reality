import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { registerSchema } from "../../../src/modules/auth/auth.schema.js";
import { updateOwnProfileSchema } from "../../../src/modules/users/users.schema.js";

describe("updateOwnProfileSchema", () => {
  it("trims a valid display name", () => {
    assert.deepEqual(
      updateOwnProfileSchema.parse({ body: { fullName: "  Test Manager  " } })
        .body,
      { fullName: "Test Manager" },
    );
  });
  it("rejects blank, short, oversized and control-character names", () => {
    for (const fullName of [
      "",
      " ",
      "A",
      "A".repeat(121),
      "Test\nManager",
      "Test\u007fManager",
    ]) {
      assert.equal(
        updateOwnProfileSchema.safeParse({ body: { fullName } }).success,
        false,
      );
    }
  });
  it("rejects identity, verification, authorization and other-user changes", () => {
    for (const field of [
      "id",
      "userId",
      "email",
      "phone",
      "status",
      "roles",
      "password",
      "emailVerifiedAt",
      "phoneVerifiedAt",
      "mustChangePassword",
    ]) {
      assert.equal(
        updateOwnProfileSchema.safeParse({
          body: { fullName: "Test Manager", [field]: "changed" },
        }).success,
        false,
      );
    }
    assert.equal(updateOwnProfileSchema.safeParse({ body: {} }).success, false);
  });
});

const validBody = {
  fullName: "Test Driver",
  email: "DRIVER@EXAMPLE.COM",
  phone: "01712345678",
  password: "Password123!",
  role: "DRIVER",
  acceptTerms: true,
  acceptPrivacyPolicy: true,
};

describe("registerSchema", () => {
  it("normalizes email and phone", () => {
    const result = registerSchema.parse({ body: validBody });
    assert.equal(result.body.email, "driver@example.com");
    assert.equal(result.body.phone, "+8801712345678");
  });

  it("allows DRIVER or PROVIDER and normalizes the legacy Provider alias", () => {
    const provider = registerSchema.parse({
      body: { ...validBody, role: "PROVIDER" },
    });
    const legacyProvider = registerSchema.parse({
      body: { ...validBody, role: "PARKING_OWNER" },
    });
    assert.equal(provider.body.role, "PROVIDER");
    assert.equal(legacyProvider.body.role, "PROVIDER");
    for (const role of ["GUARD", "ADMIN"]) {
      const result = registerSchema.safeParse({ body: { ...validBody, role } });
      assert.equal(result.success, false);
    }
  });

  it("requires both legal acceptances", () => {
    assert.equal(
      registerSchema.safeParse({
        body: { ...validBody, acceptTerms: false },
      }).success,
      false,
    );
    assert.equal(
      registerSchema.safeParse({
        body: { ...validBody, acceptPrivacyPolicy: false },
      }).success,
      false,
    );
  });

  it("requires a strong 12-character password", () => {
    for (const password of [
      "password123!",
      "Password123",
      "PASSWORD123!",
      "PasswordOnly!",
      "Short1!",
      "Password 123!",
    ]) {
      const result = registerSchema.safeParse({
        body: { ...validBody, password },
      });
      assert.equal(result.success, false);
    }
  });
});
