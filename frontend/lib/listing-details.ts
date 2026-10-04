import type { VehicleType } from "@/lib/api/api-types";

type ListingDetails = {
  title: string;
  description: string;
  minimum: string;
  maximum: string;
  vehicles: VehicleType[];
};

export function listingDetailsError(input: ListingDetails): string | null {
  const title = input.title.trim();
  if (title.length < 3 || title.length > 150) return "Title must contain 3 to 150 characters.";
  if (input.description.trim().length > 3000) return "Description cannot exceed 3,000 characters.";
  if (!/^\d{1,4}$/.test(input.minimum) || Number(input.minimum) < 15 || Number(input.minimum) > 1440) return "Minimum duration must be a whole number from 15 to 1,440 minutes.";
  if (!/^\d{1,5}$/.test(input.maximum) || Number(input.maximum) < 15 || Number(input.maximum) > 10080) return "Maximum duration must be a whole number from 15 to 10,080 minutes.";
  if (Number(input.maximum) < Number(input.minimum)) return "Maximum duration must be at least the minimum duration.";
  if (input.vehicles.length === 0) return "Select at least one compatible vehicle type.";
  return null;
}

export function listingDetailsPatch(input: ListingDetails) {
  const error = listingDetailsError(input);
  if (error) throw new Error(error);
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    minDurationMinutes: Number(input.minimum),
    maxDurationMinutes: Number(input.maximum),
    allowedVehicleTypes: input.vehicles,
  };
}
