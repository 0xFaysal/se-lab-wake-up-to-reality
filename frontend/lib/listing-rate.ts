import { parseBDTToPaisa } from "./payout-amount";

export function listingRatePatch(value: string): { pricePerHourPaisa: string } {
  const amount = parseBDTToPaisa(value);
  if (amount === null || amount <= BigInt(0))
    throw new Error("Enter an hourly rate greater than zero with up to two decimal places.");
  return { pricePerHourPaisa: amount.toString() };
}
