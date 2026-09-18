import { z } from "zod";

export const vehicleTypeEnum = z.enum(["SEDAN", "SUV", "MOTORCYCLE", "MICROBUS"]);

export const bookingConfigSchema = z
  .object({
    date: z.string().min(1, "Please select a booking date"),
    checkInTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid check-in time"),
    checkOutTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid check-out time"),
    listingId: z.string().min(1, "Please select a parking offer"),
    vehicleId: z.string().min(1, "Please select or add a vehicle"),
    // Inline new vehicle fields
    isNewVehicle: z.boolean(),
    newRegistrationNumber: z.string().optional(),
    newVehicleType: vehicleTypeEnum,
    newBrand: z.string().optional(),
    newModel: z.string().optional(),
    newColor: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.checkInTime && data.checkOutTime) {
        const [inH, inM] = data.checkInTime.split(":").map(Number);
        const [outH, outM] = data.checkOutTime.split(":").map(Number);
        return (outH ?? 0) * 60 + (inM ?? 0) < (outH ?? 0) * 60 + (outM ?? 0);
      }
      return true;
    },
    {
      message: "Expected check-out time must be after check-in time",
      path: ["checkOutTime"],
    }
  )
  .refine(
    (data) => {
      if (data.isNewVehicle) {
        return (
          !!data.newRegistrationNumber &&
          data.newRegistrationNumber.trim().length >= 4
        );
      }
      return true;
    },
    {
      message: "Please enter a valid license plate number (e.g. Dhaka Metro-GA 11-2233)",
      path: ["newRegistrationNumber"],
    }
  );

export type BookingConfigFormValues = z.infer<typeof bookingConfigSchema>;
