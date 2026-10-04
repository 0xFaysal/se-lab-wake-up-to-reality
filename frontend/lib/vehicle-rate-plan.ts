import type { VehicleType } from "./api/api-types";
import type { ListingInput } from "./api/marketplace-types";
import { parseBDTToPaisa } from "./payout-amount";
import { listingOvertimeSettings } from "./listing-overtime";

export class SetupValidationError extends Error {}

export function vehicleRatePlan(input: {
  rightId: string;
  title: string;
  vehicles: VehicleType[];
  rates: Partial<Record<VehicleType, string>>;
  deposit: string;
  minimum: string;
  maximum: string;
  overtimeMultiplier: string;
}): ListingInput[] {
  const deposit = parseBDTToPaisa(input.deposit);
  const minimum = Number(input.minimum),
    maximum = Number(input.maximum);
  let overtime: ReturnType<typeof listingOvertimeSettings>;
  try {
    overtime = listingOvertimeSettings(
      "MULTIPLIER",
      input.overtimeMultiplier,
      null,
      "5",
    );
  } catch (error) {
    throw new SetupValidationError(
      error instanceof Error
        ? error.message
        : "Enter a valid overtime multiplier.",
    );
  }
  if (!input.vehicles.length)
    throw new SetupValidationError(
      "Select at least one supported vehicle type.",
    );
  if (deposit === null)
    throw new SetupValidationError("Enter a valid refundable deposit in BDT.");
  if (
    !Number.isInteger(minimum) ||
    minimum < 15 ||
    minimum > 1440 ||
    !Number.isInteger(maximum) ||
    maximum < minimum ||
    maximum > 10080
  )
    throw new SetupValidationError(
      "Minimum stay must be 15-1440 minutes; maximum must be at least the minimum and at most 10080 minutes.",
    );
  return [...new Set(input.vehicles)].map((type) => {
    const price = parseBDTToPaisa(input.rates[type] ?? "");
    if (price === null || price <= BigInt(0))
      throw new SetupValidationError(
        `Enter a positive ${type.toLowerCase()} hourly rate with at most two decimal places.`,
      );
    return {
      parkingRightId: input.rightId,
      title: `${input.title.trim().slice(0, 125)} - ${type}`,
      allowedVehicleTypes: [type],
      pricePerHourPaisa: price.toString(),
      securityDepositPaisa: deposit.toString(),
      minDurationMinutes: minimum,
      maxDurationMinutes: maximum,
      overtimeBillingMode: "MULTIPLIER",
      ...overtime,
    };
  });
}
