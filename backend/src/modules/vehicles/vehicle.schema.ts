import { z } from "zod";
import { VehicleType } from "../../../generated/prisma/client.js";
import { normalizeRegistrationNumber } from "../../common/vehicles/registration-number.js";

const noControlCharacters = /^[^\x00-\x1F\x7F]+$/;
const dimensionSchema = z.number().int().positive().max(10_000);

const registrationNumberSchema = z
  .string()
  .trim()
  .min(4)
  .max(50)
  .regex(
    noControlCharacters,
    "Registration number must not contain control characters",
  )
  .refine(
    (value) => normalizeRegistrationNumber(value).length >= 4,
    "Registration number must contain at least four characters",
  );

const requiredLabel = (maximum: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maximum)
    .regex(noControlCharacters, "Value must not contain control characters");

export const createVehicleSchema = z.object({
  body: z
    .object({
      vehicleType: z.enum(VehicleType),
      registrationNumber: registrationNumberSchema,
      brand: requiredLabel(80),
      model: requiredLabel(80),
      color: requiredLabel(40),
      heightCm: dimensionSchema.optional(),
      widthCm: dimensionSchema.optional(),
      lengthCm: dimensionSchema.optional(),
      isDefault: z.boolean().optional().default(false),
    })
    .strict(),
});

export const updateVehicleSchema = z.object({
  params: z.object({
    vehicleId: z.uuid(),
  }),
  body: z
    .object({
      vehicleType: z.enum(VehicleType).optional(),
      registrationNumber: registrationNumberSchema.optional(),
      brand: requiredLabel(80).optional(),
      model: requiredLabel(80).optional(),
      color: requiredLabel(40).optional(),
      heightCm: dimensionSchema.nullable().optional(),
      widthCm: dimensionSchema.nullable().optional(),
      lengthCm: dimensionSchema.nullable().optional(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided",
    ),
});

export const vehicleIdParamSchema = z.object({
  params: z.object({
    vehicleId: z.uuid(),
  }),
});
