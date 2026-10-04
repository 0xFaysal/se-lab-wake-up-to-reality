import type { VehicleType } from "@/lib/api/api-types";
import { listingDetailsPatch } from "@/lib/listing-details";
import { listingOvertimeSettings } from "@/lib/listing-overtime";
import { parseBDTToPaisa } from "@/lib/payout-amount";

export function listingPayload(data: FormData, mode: "MULTIPLIER" | "FIXED_PER_HOUR", vehicles: VehicleType[]) {
  const field = (name: string) => String(data.get(name) ?? "");
  const details = listingDetailsPatch({ title: field("title"), description: field("description"), minimum: field("minimum"), maximum: field("maximum"), vehicles });
  const hourly = parseBDTToPaisa(field("hourlyRate"));
  const deposit = parseBDTToPaisa(field("deposit"));
  if (hourly === null || hourly <= BigInt(0)) throw new Error("Enter a positive hourly BDT rate with no more than two decimal places.");
  if (deposit === null) throw new Error("Enter a non-negative BDT deposit with no more than two decimal places.");
  return {
    ...details,
    pricePerHourPaisa: hourly.toString(),
    securityDepositPaisa: deposit.toString(),
    ...(data.has("discloseLocationBeforePayment") ? { discloseLocationBeforePayment: data.get("discloseLocationBeforePayment") === "on" } : {}),
    overtimeBillingMode: mode,
    ...listingOvertimeSettings(mode, field("overtimeMultiplier"), mode === "FIXED_PER_HOUR" ? parseBDTToPaisa(field("overtimeRate"))?.toString() ?? null : null, field("overtimeGrace")),
  };
}

export function paisaToBDTInput(value: string): string {
  const paisa = BigInt(value);
  return `${paisa / BigInt(100)}.${(paisa % BigInt(100)).toString().padStart(2, "0")}`;
}
