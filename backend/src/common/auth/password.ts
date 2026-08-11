import argon2, { type HashOptions } from "argon2";

const passwordHashOptions: HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    ...passwordHashOptions,
  });
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function passwordHashNeedsRehash(hash: string): boolean {
  return argon2.needsRehash(hash, passwordHashOptions);
}
