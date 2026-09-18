import assert from "node:assert/strict";
import { describe, it } from "node:test";
import "../../helpers/test-env.js";

const {
  decryptSensitiveText,
  encryptSensitiveText,
  SensitiveDataEncryptionError,
} = await import("../../../src/common/security/encryption.js");
const { fingerprintPropertyAddress, normalizePropertyName } = await import(
  "../../../src/modules/properties/property-identity.js"
);

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

describe("privacy-safe Property identity", () => {
  it("normalizes names and fingerprints equivalent addresses deterministically", () => {
    assert.equal(
      normalizePropertyName("  Green   View APARTMENT "),
      "green view apartment",
    );
    const first = fingerprintPropertyAddress(
      " House 12,   Road 45, Gulshan 2, Dhaka ",
    );
    const second = fingerprintPropertyAddress(
      "house 12, road 45, gulshan 2, dhaka",
    );
    assert.equal(first, second);
    assert.match(first, /^[a-f0-9]{64}$/);
    assert.notEqual(first, "house 12, road 45, gulshan 2, dhaka");
  });
});
