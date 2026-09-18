import { describe, it } from "node:test";
import assert from "node:assert/strict";
import "../../helpers/test-env.js";

const { encryptSensitiveText, decryptSensitiveText } = await import(
  "../../../src/common/security/encryption.js"
);

describe("encryptSensitiveText", () => {
  it("should encrypt and decrypt a string correctly", () => {
    const originalText = "This is a sensitive text.";

    const encryptedText = encryptSensitiveText(originalText);
    const decryptedText = decryptSensitiveText(
      encryptedText.ciphertext,
      encryptedText.iv,
      encryptedText.authTag,
    );

    assert.notEqual(
      encryptedText.ciphertext,
      originalText,
      "Encrypted text should not be the same as the original text",
    );
    assert.equal(
      decryptedText,
      originalText,
      "Decrypted text should match the original text",
    );
  });
});
