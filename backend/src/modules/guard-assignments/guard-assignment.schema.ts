import {
  GuardAssignmentStatus,
  PropertyGuardMembershipStatus,
} from "../../../generated/prisma/client.js";
import { z } from "zod";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const timeSchema = z
  .string()
  .regex(timePattern, "Time must use 24-hour HH:mm format");

function validateShift(
  data: { shiftStart: string; shiftEnd: string },
  context: z.RefinementCtx,
) {
  const minutes = (value: string) => {
    const [hours, mins] = value.split(":").map(Number);
    return hours! * 60 + mins!;
  };
  if (
    timePattern.test(data.shiftStart) &&
    timePattern.test(data.shiftEnd) &&
    minutes(data.shiftStart) >= minutes(data.shiftEnd)
  ) {
    context.addIssue({
      code: "custom",
      path: ["shiftEnd"],
      message: "Shift end must be later than shift start",
    });
  }
}

export const addPropertyGuardSchema = z.object({
  params: z.object({ propertyId: z.uuid() }).strict(),
  body: z.object({ identifier: z.string().trim().min(3).max(254) }).strict(),
});
export const createProviderGuardAssignmentSchema = z.object({
  params: z.object({ propertyId: z.uuid() }).strict(),
  body: z
    .object({
      guardMembershipId: z.uuid(),
      providerMembershipId: z.uuid().optional(),
      shiftStart: timeSchema,
      shiftEnd: timeSchema,
    })
    .strict()
    .superRefine(validateShift),
});
export const createCanonicalProviderGuardAssignmentSchema = z.object({
  body: z
    .object({
      propertyId: z.uuid(),
      guardMembershipId: z.uuid(),
      providerMembershipId: z.uuid().optional(),
      shiftStart: timeSchema,
      shiftEnd: timeSchema,
    })
    .strict()
    .superRefine(validateShift),
});
export const updateGuardAssignmentSchema = z.object({
  params: z.object({ assignmentId: z.uuid() }).strict(),
  body: z
    .discriminatedUnion("action", [
      z
        .object({
          action: z.literal("UPDATE_SHIFT"),
          shiftStart: timeSchema,
          shiftEnd: timeSchema,
        })
        .strict(),
      z.object({ action: z.literal("SUSPEND") }).strict(),
      z.object({ action: z.literal("RESUME") }).strict(),
    ])
    .superRefine((data, context) => {
      if (data.action === "UPDATE_SHIFT") validateShift(data, context);
    }),
});
export const guardMembershipIdSchema = z.object({
  params: z.object({ membershipId: z.uuid() }).strict(),
});
export const propertyGuardMembershipParamsSchema = z.object({
  params: z.object({ propertyId: z.uuid(), membershipId: z.uuid() }).strict(),
});
export const guardAssignmentIdParamSchema = z.object({
  params: z.object({ assignmentId: z.uuid() }).strict(),
});
export const propertyIdParamSchema = z.object({
  params: z.object({ propertyId: z.uuid() }).strict(),
});
export const rejectGuardAssignmentSchema = guardMembershipIdSchema.extend({
  body: z.object({}).strict().default({}),
});
export const listGuardMembershipsQuerySchema = z.object({
  query: z
    .object({
      propertyId: z.uuid().optional(),
      status: z.enum(PropertyGuardMembershipStatus).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
    .strict(),
});
export const listGuardAssignmentsQuerySchema = z.object({
  query: z
    .object({
      propertyId: z.uuid().optional(),
      status: z.enum(GuardAssignmentStatus).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
    .strict(),
});
export const listOwnerGuardAssignmentsQuerySchema =
  listGuardAssignmentsQuerySchema;
export const createGuardInvitationSchema = addPropertyGuardSchema;
