import assert from "node:assert/strict";
import test from "node:test";
import { forgotPasswordSchema } from "../lib/validations/auth.ts";

test("password recovery accepts email and Bangladesh phones, not arbitrary text", () => {
  const identifier = forgotPasswordSchema.shape.identifier;
  for (const value of ["driver@example.com", "01712345678", "+8801712345678", "017 1234 5678"])
    assert.equal(identifier.safeParse(value).success, true, value);
  for (const value of ["", "not-an-email", "driver@", "12345", "01212345678"])
    assert.equal(identifier.safeParse(value).success, false, value);
});
