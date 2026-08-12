import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.JWT_ACCESS_SECRET =
  "unit-access-secret-at-least-32-characters-long";
process.env.JWT_REFRESH_SECRET =
  "unit-refresh-secret-at-least-32-characters-long";
process.env.VERIFICATION_CODE_SECRET =
  "unit-verification-secret-at-least-32-characters";
process.env.AUTH_METADATA_HASH_SECRET =
  "unit-metadata-secret-at-least-32-characters";
process.env.DATA_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const {
  decryptSensitiveText,
  encryptSensitiveText,
  SensitiveDataEncryptionError,
} = await import("../../../src/common/security/encryption.js");

describe("sensitive data encryption", () => {
  it("round-trips UTF-8 text without storing plaintext", () => {
    const plaintext = "House 12, Road 45, Gulshan 2, Dhaka";
    const encrypted = encryptSensitiveText(plaintext);
    assert.notEqual(encrypted.ciphertext, plaintext);
    assert.equal(
      decryptSensitiveText(
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.authTag,
      ),
      plaintext,
    );
  });

  it("uses a different IV and ciphertext for every encryption", () => {
    const first = encryptSensitiveText("same private address");
    const second = encryptSensitiveText("same private address");
    assert.notEqual(first.iv, second.iv);
    assert.notEqual(first.ciphertext, second.ciphertext);
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptSensitiveText("private address");
    const bytes = Buffer.from(encrypted.ciphertext, "base64");
    bytes[0] = bytes[0]! ^ 1;
    assert.throws(
      () =>
        decryptSensitiveText(
          bytes.toString("base64"),
          encrypted.iv,
          encrypted.authTag,
        ),
      SensitiveDataEncryptionError,
    );
  });
});
