export function normalizeRegistrationNumber(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/[\s\p{Dash_Punctuation}]+/gu, "");
}

export function formatRegistrationNumberForDisplay(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}
