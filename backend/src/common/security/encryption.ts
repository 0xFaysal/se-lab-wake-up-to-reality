import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";

const algorithm = "aes-256-gcm";
const ivLengthBytes = 12;

export type EncryptedValue = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

export class SensitiveDataEncryptionError extends Error {
  constructor() {
    super("Sensitive data encryption operation failed");
    this.name = "SensitiveDataEncryptionError";
  }
}

function getEncryptionKey(): Buffer {
  if (!env.DATA_ENCRYPTION_KEY) throw new SensitiveDataEncryptionError();
  const key = Buffer.from(env.DATA_ENCRYPTION_KEY, "hex");
  if (key.length !== 32) throw new SensitiveDataEncryptionError();
  return key;
}

export function encryptSensitiveText(value: string): EncryptedValue {
  try {
    const iv = randomBytes(ivLengthBytes);
    const cipher = createCipheriv(algorithm, getEncryptionKey(), iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);

    return {
      ciphertext: ciphertext.toString("base64"),
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
    };
  } catch {
    throw new SensitiveDataEncryptionError();
  }
}

export function decryptSensitiveText(
  ciphertext: string,
  iv: string,
  authTag: string,
): string {
  try {
    const decipher = createDecipheriv(
      algorithm,
      getEncryptionKey(),
      Buffer.from(iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new SensitiveDataEncryptionError();
  }
}
