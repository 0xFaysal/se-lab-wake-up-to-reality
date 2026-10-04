// Prisma time-only columns contain wall-clock time, not a UTC instant to convert.
export function localClockTime(value: string | null | undefined): string {
  if (!value) return "";
  const match = /^(?:\d{4}-\d{2}-\d{2}T)?(\d{2}):(\d{2})/.exec(value);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return "";
  return `${match[1]}:${match[2]}`;
}

export function operationalAmount(paisa: string | number | null | undefined): string {
  if (paisa === undefined || paisa === null || paisa === "") return "Restricted";
  const value = Number(paisa);
  if (!Number.isFinite(value)) return "Unavailable";
  return `৳${(value / 100).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}
