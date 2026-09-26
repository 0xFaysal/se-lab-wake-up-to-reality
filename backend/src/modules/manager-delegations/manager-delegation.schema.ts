import { z } from "zod";

export const managerPermissionValues = [
  "RESOURCE_VIEW",
  "RESOURCE_MANAGE",
  "LISTING_VIEW",
  "LISTING_MANAGE",
  "PRICE_MANAGE",
  "AVAILABILITY_MANAGE",
  "BOOKING_VIEW",
  "BOOKING_MANAGE",
  "IMAGE_MANAGE",
  "GUARD_VIEW",
  "GUARD_ADD_TO_PROPERTY",
  "GUARD_ASSIGN",
  "EARNINGS_VIEW",
  "REPORTS_VIEW",
] as const;

const permissionList = z.array(z.enum(managerPermissionValues)).min(1).max(14);

export const createManagerDelegationSchema = z.object({
  body: z
    .object({
      propertyId: z.uuid(),
      managerUserId: z.uuid(),
      permissions: permissionList,
      resourceIds: z.array(z.uuid()).max(100).default([]),
      validFrom: z.iso.datetime().optional(),
      validUntil: z.iso.datetime().optional(),
    })
    .strict()
    .superRefine((value, context) => {
      if (
        value.validFrom &&
        value.validUntil &&
        new Date(value.validUntil) <= new Date(value.validFrom)
      ) {
        context.addIssue({
          code: "custom",
          path: ["validUntil"],
          message: "validUntil must be later than validFrom",
        });
      }
      if (value.validUntil && new Date(value.validUntil) <= new Date()) {
        context.addIssue({
          code: "custom",
          path: ["validUntil"],
          message: "validUntil must be in the future",
        });
      }
      if (new Set(value.permissions).size !== value.permissions.length) {
        context.addIssue({
          code: "custom",
          path: ["permissions"],
          message: "Permissions must be unique",
        });
      }
      if (new Set(value.resourceIds).size !== value.resourceIds.length) {
        context.addIssue({
          code: "custom",
          path: ["resourceIds"],
          message: "Resource IDs must be unique",
        });
      }
    }),
});

export const createManagerDelegationByIdentifierSchema = z.object({
  body: z
    .object({
      propertyId: z.uuid(),
      managerIdentifier: z.string().trim().min(3).max(254),
      permissions: permissionList,
      resourceIds: z.array(z.uuid()).max(100).default([]),
      validFrom: z.iso.datetime().optional(),
      validUntil: z.iso.datetime().optional(),
    })
    .strict()
    .superRefine((value, context) => {
      if (
        value.validFrom &&
        value.validUntil &&
        new Date(value.validUntil) <= new Date(value.validFrom)
      ) {
        context.addIssue({
          code: "custom",
          path: ["validUntil"],
          message: "validUntil must be later than validFrom",
        });
      }
      if (value.validUntil && new Date(value.validUntil) <= new Date()) {
        context.addIssue({
          code: "custom",
          path: ["validUntil"],
          message: "validUntil must be in the future",
        });
      }
      if (new Set(value.permissions).size !== value.permissions.length) {
        context.addIssue({
          code: "custom",
          path: ["permissions"],
          message: "Permissions must be unique",
        });
      }
      if (new Set(value.resourceIds).size !== value.resourceIds.length) {
        context.addIssue({
          code: "custom",
          path: ["resourceIds"],
          message: "Resource IDs must be unique",
        });
      }
    }),
});

export const updateManagerDelegationPermissionsSchema = z.object({
  params: z.object({ delegationId: z.uuid() }),
  body: z
    .object({
      permissions: permissionList,
      resourceIds: z.array(z.uuid()).max(100).default([]),
    })
    .strict()
    .superRefine((value, context) => {
      if (new Set(value.permissions).size !== value.permissions.length) {
        context.addIssue({
          code: "custom",
          path: ["permissions"],
          message: "Permissions must be unique",
        });
      }
      if (new Set(value.resourceIds).size !== value.resourceIds.length) {
        context.addIssue({
          code: "custom",
          path: ["resourceIds"],
          message: "Resource IDs must be unique",
        });
      }
    }),
});

export const managerDelegationIdSchema = z.object({
  params: z.object({ delegationId: z.uuid() }),
});
