import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { registerSchema } from "../../../src/modules/auth/auth.schema.js";

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
