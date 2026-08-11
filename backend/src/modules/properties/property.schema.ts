import { z } from "zod";

const noControlCharacters = /^[^\x00-\x1F\x7F]+$/;
const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

const textField = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .regex(noControlCharacters, "Value must not contain control characters");

function validateEntrancePair(
  data: {
    entranceLatitude?: number | null | undefined;
    entranceLongitude?: number | null | undefined;
  },
  context: z.RefinementCtx,
) {
  const hasLatitude = data.entranceLatitude !== undefined;
  const hasLongitude = data.entranceLongitude !== undefined;

  if (hasLatitude !== hasLongitude) {
    context.addIssue({
      code: "custom",
      path: ["entranceLatitude"],
      message: "Entrance latitude and longitude must be provided together",
    });
    return;
  }

  if (
    hasLatitude &&
    (data.entranceLatitude === null) !== (data.entranceLongitude === null)
  ) {
    context.addIssue({
      code: "custom",
      path: ["entranceLatitude"],
      message: "Entrance coordinates must both be values or both be null",
    });
  }
}

export const createPropertySchema = z.object({
  body: z
    .object({
      name: textField(3, 120),
      publicArea: textField(2, 120),
      approximateAddress: textField(5, 255),
      exactAddress: textField(5, 500),
      latitude: latitudeSchema,
      longitude: longitudeSchema,
      entranceLatitude: latitudeSchema.optional(),
      entranceLongitude: longitudeSchema.optional(),
      accessInstructions: textField(1, 1000).optional(),
    })
    .strict()
    .superRefine(validateEntrancePair),
});

export const updatePropertySchema = z.object({
  params: z.object({ propertyId: z.uuid() }),
  body: z
    .object({
      name: textField(3, 120).optional(),
      publicArea: textField(2, 120).optional(),
      approximateAddress: textField(5, 255).optional(),
      exactAddress: textField(5, 500).optional(),
      latitude: latitudeSchema.optional(),
      longitude: longitudeSchema.optional(),
      entranceLatitude: latitudeSchema.nullable().optional(),
      entranceLongitude: longitudeSchema.nullable().optional(),
      accessInstructions: textField(1, 1000).nullable().optional(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided",
    )
    .superRefine(validateEntrancePair),
});

export const propertyIdParamSchema = z.object({
  params: z.object({ propertyId: z.uuid() }),
});
