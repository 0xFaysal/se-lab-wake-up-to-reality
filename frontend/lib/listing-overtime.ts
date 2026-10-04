export function listingOvertimeSettings(
  mode: "MULTIPLIER" | "FIXED_PER_HOUR",
  multiplier: string,
  fixedRatePaisa: string | null,
  grace: string,
) {
  if (grace !== "5") {
    throw new Error("New bookings include a fixed 5-minute grace period.");
  }
  let overtimeMultiplierBps: number | null = null;
  let overtimeRatePerHourPaisa: string | null = null;
  if (mode === "MULTIPLIER") {
    if (!/^\d{1,2}(?:\.\d{1,4})?$/.test(multiplier)) {
      throw new Error("Enter an overtime multiplier from 1 to 5 with up to four decimal places.");
    }
    const [whole, fraction = ""] = multiplier.split(".");
    overtimeMultiplierBps = Number(whole) * 10000 + Number(fraction.padEnd(4, "0"));
    if (overtimeMultiplierBps < 10000 || overtimeMultiplierBps > 50000) {
      throw new Error("Overtime multiplier must be between 1 and 5.");
    }
  } else {
    if (fixedRatePaisa === null || !/^\d{1,8}$/.test(fixedRatePaisa) || BigInt(fixedRatePaisa) < BigInt(100) || BigInt(fixedRatePaisa) > BigInt(10000000)) {
      throw new Error("Fixed overtime rate must be between 1 and 100,000 BDT per hour.");
    }
    overtimeRatePerHourPaisa = fixedRatePaisa;
  }
  return { overtimeMultiplierBps, overtimeRatePerHourPaisa, overtimeGracePeriodMinutes: Number(grace) };
}
