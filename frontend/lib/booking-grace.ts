export function bookingGraceTimes(startAt: string, endAt: string, exitMinutes: number) {
  return {
    entryOpensAt: new Date(Date.parse(startAt) - 5 * 60_000).toISOString(),
    freeExitUntil: new Date(Date.parse(endAt) + exitMinutes * 60_000).toISOString(),
  };
}

export function overtimePolicyText(version: number | undefined, graceMinutes: number) {
  return version === 2
    ? "No overtime charge within 5 minutes of the scheduled end. After 5 minutes, overtime counts from the scheduled end, including those 5 minutes, with a 2-minute allowance at guard checkout."
    : `This booking keeps its saved ${graceMinutes}-minute exit grace; overtime is charged only after that grace.`;
}
