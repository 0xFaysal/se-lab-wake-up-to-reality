export function availabilityTimeInput(value: string): string {
  const match = /^(?:\d{4}-\d{2}-\d{2}T)?(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!match || !/^([01]\d|2[0-3]):[0-5]\d$/.test(match[1])) return "";
  return match[1];
}
