import { z } from "zod";

export const pendingAdminPropertiesSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
    .strict(),
});

export const adminPropertyIdSchema = z.object({
  params: z.object({ propertyId: z.uuid() }).strict(),
});

const propertyVerificationDecisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVE") }).strict(),
  z
    .object({
      decision: z.literal("REJECT"),
      reason: z.string().trim().min(10).max(500),
    })
    .strict(),
]);

export const verifyAdminPropertySchema = z.object({
  params: z.object({ propertyId: z.uuid() }).strict(),
  body: propertyVerificationDecisionSchema,
});

const mergeAdminPropertyBodySchema = z
  .object({
    canonicalPropertyId: z.uuid(),
    canonicalVersion: z.number().int().positive(),
    duplicateVersion: z.number().int().positive(),
    reason: z.string().trim().min(10).max(500),
  })
  .strict();

export const mergeAdminPropertyByIdSchema = z.object({
  params: z.object({ duplicateId: z.uuid() }).strict(),
  body: mergeAdminPropertyBodySchema,
});

export const mergeAdminPropertyPreviewSchema = z.object({
  params: z.object({ duplicateId: z.uuid() }).strict(),
  query: z.object({ canonicalPropertyId: z.uuid() }).strict(),
});

export const mergeAdminPropertiesSchema = z.object({
  body: mergeAdminPropertyBodySchema
    .extend({ duplicatePropertyId: z.uuid() })
    .strict()
    .refine((value) => value.canonicalPropertyId !== value.duplicatePropertyId, {
      path: ["duplicatePropertyId"],
      message: "Canonical and duplicate Property must be different",
    }),
});
