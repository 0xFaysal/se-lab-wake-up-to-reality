import { z } from "zod";

const reasonSchema = z.string().trim().min(5).max(500);
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

export const propertyGovernanceIdSchema = z.object({
  params: z.object({ propertyId: z.uuid() }),
});

export const buildingManagerNominationSchema = z.object({
  params: z.object({ propertyId: z.uuid() }),
  body: z.object({ candidateUserId: z.uuid() }).strict(),
});

const governanceVoteBodySchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVE") }).strict(),
  z.object({ decision: z.literal("REJECT"), reason: reasonSchema }).strict(),
]);

export const governanceVoteSchema = z.object({
  params: z.object({
    propertyId: z.uuid(),
    assignmentId: z.uuid().optional(),
    proposalId: z.uuid().optional(),
  }),
  body: governanceVoteBodySchema,
});

export const buildingManagerVoteSchema = z.object({
  params: z.object({ propertyId: z.uuid(), assignmentId: z.uuid() }).strict(),
  body: governanceVoteBodySchema,
});

export const propertyChangeProposalIdSchema = z.object({
  params: z.object({ propertyId: z.uuid(), proposalId: z.uuid() }).strict(),
});

export const propertyChangeVoteSchema = z.object({
  params: z.object({ propertyId: z.uuid(), proposalId: z.uuid() }).strict(),
  body: governanceVoteBodySchema,
});

export const commonRulesSchema = z.object({
  params: z.object({ propertyId: z.uuid() }),
  body: z
    .object({
      version: z.number().int().positive(),
      accessInstructions: z
        .string()
        .trim()
        .min(1)
        .max(1000)
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
      generalParkingRules: z
        .string()
        .trim()
        .min(1)
        .max(2000)
        .nullable()
        .optional(),
      commonSafetyRules: z
        .string()
        .trim()
        .min(1)
        .max(2000)
        .nullable()
        .optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 1, {
      message: "At least one common rule must be provided",
    }),
});

export const temporaryClosureSchema = z.object({
  params: z.object({ propertyId: z.uuid() }),
  body: z.discriminatedUnion("action", [
    z
      .object({
        action: z.literal("CLOSE"),
        version: z.number().int().positive(),
        reason: reasonSchema,
        until: z.iso.datetime().optional(),
      })
      .strict(),
    z
      .object({
        action: z.literal("REOPEN"),
        version: z.number().int().positive(),
      })
      .strict(),
  ]),
});

const proposedCommonRules = z
  .object({
    accessInstructions: z
      .string()
      .trim()
      .min(1)
      .max(1000)
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
    generalParkingRules: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .nullable()
      .optional(),
    commonSafetyRules: z.string().trim().min(1).max(2000).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one proposed rule must be provided",
  });

const proposedIdentityLocation = z
  .object({
    name: z.string().trim().min(3).max(120).optional(),
    publicArea: z.string().trim().min(2).max(120).optional(),
    approximateAddress: z.string().trim().min(5).max(255).optional(),
    exactAddress: z.string().trim().min(5).max(500).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    entranceLatitude: z.number().min(-90).max(90).nullable().optional(),
    entranceLongitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0) {
      context.addIssue({
        code: "custom",
        message: "At least one identity or location field must be provided",
      });
    }
    const hasEntranceLatitude = value.entranceLatitude !== undefined;
    const hasEntranceLongitude = value.entranceLongitude !== undefined;
    if (
      hasEntranceLatitude !== hasEntranceLongitude ||
      (hasEntranceLatitude &&
        (value.entranceLatitude === null) !==
          (value.entranceLongitude === null))
    ) {
      context.addIssue({
        code: "custom",
        path: ["entranceLatitude"],
        message: "Entrance latitude and longitude must be provided together",
      });
    }
  });

export const propertyChangeProposalSchema = z.object({
  params: z.object({ propertyId: z.uuid() }),
  body: z.discriminatedUnion("changeType", [
    z
      .object({
        changeType: z.literal("COMMON_RULES"),
        baseVersion: z.number().int().positive(),
        changes: proposedCommonRules,
      })
      .strict(),
    z
      .object({
        changeType: z.literal("IDENTITY_LOCATION"),
        baseVersion: z.number().int().positive(),
        changes: proposedIdentityLocation,
      })
      .strict(),
  ]),
});

export const membershipVerificationSchema = z.object({
  params: z.object({ propertyId: z.uuid(), membershipId: z.uuid() }),
  body: z.discriminatedUnion("decision", [
    z.object({ decision: z.literal("APPROVE") }).strict(),
    z.object({ decision: z.literal("REJECT"), reason: reasonSchema }).strict(),
  ]),
});
