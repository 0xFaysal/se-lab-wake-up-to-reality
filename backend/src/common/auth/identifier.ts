import { normalizeBangladeshPhone } from "./phone.js";

export function normalizeIdentifier(identifier: string): {
  type: "email" | "phone";
  value: string;
} {
  const value = identifier.trim();

  if (value.includes("@")) {
    return {
      type: "email",
      value: value.toLowerCase(),
    };
  }

  return {
    type: "phone",
    value: normalizeBangladeshPhone(value),
  };
}
