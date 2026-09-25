import { z } from "zod";

const noControlCharacters = /^[^\x00-\x1F\x7F]+$/;
const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);
const timeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");

const textField = (label: string, minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum, `${label} must contain at least ${minimum} characters`)
    .max(maximum, `${label} must contain at most ${maximum} characters`)
    .regex(noControlCharacters, `${label} must not contain control characters`);

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
      name: textField("Name", 3, 120),
      publicArea: textField("Public area", 2, 120),
      approximateAddress: textField("Approximate address", 5, 255),
      exactAddress: textField("Exact address", 5, 500),
      latitude: latitudeSchema,
      longitude: longitudeSchema,
      entranceLatitude: latitudeSchema.optional(),
      entranceLongitude: longitudeSchema.optional(),
      accessInstructions: textField("Access instructions", 1, 1000).optional(),
      visitorIdentificationRequired: z.boolean().optional(),
      vehicleHeightLimitCm: z.number().int().positive().max(1000).optional(),
      entryCutoffLocalTime: timeSchema.optional(),
      generalParkingRules: textField(
        "General parking rules",
        1,
        2000,
      ).optional(),
      commonSafetyRules: textField("Common safety rules", 1, 2000).optional(),
    })
    .strict()
    .superRefine(validateEntrancePair),
});

export const updatePropertySchema = z.object({
  params: z.object({ propertyId: z.uuid() }),
  body: z
    .object({
      name: textField("Name", 3, 120).optional(),
      publicArea: textField("Public area", 2, 120).optional(),
      approximateAddress: textField("Approximate address", 5, 255).optional(),
      exactAddress: textField("Exact address", 5, 500).optional(),
      latitude: latitudeSchema.optional(),
      longitude: longitudeSchema.optional(),
      entranceLatitude: latitudeSchema.nullable().optional(),
      entranceLongitude: longitudeSchema.nullable().optional(),
      accessInstructions: textField("Access instructions", 1, 1000)
        .nullable()
        .optional(),
      visitorIdentificationRequired: z.boolean().optional(),
      vehicleHeightLimitCm: z
        .number()
        .int()
        .positive()
        .max(1000)
        .nullable()
        .optional(),
      entryCutoffLocalTime: timeSchema.nullable().optional(),
      generalParkingRules: textField("General parking rules", 1, 2000)
        .nullable()
        .optional(),
      commonSafetyRules: textField("Common safety rules", 1, 2000)
        .nullable()
        .optional(),
      version: z.number().int().positive(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 1,
      "At least one field must be provided",
    )
    .superRefine(validateEntrancePair),
});

export const propertyIdParamSchema = z.object({
  params: z.object({ propertyId: z.uuid() }),
});

export const propertyDuplicateMatchSchema = z.object({
  body: z
    .object({
      name: textField("Name", 3, 120),
      publicArea: textField("Public area", 2, 120),
      exactAddress: textField("Exact address", 5, 500),
      latitude: latitudeSchema,
      longitude: longitudeSchema,
    })
    .strict(),
});
