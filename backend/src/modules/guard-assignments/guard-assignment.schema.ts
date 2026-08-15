import { GuardAssignmentStatus } from "../../../generated/prisma/client.js";
import { z } from "zod";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const timeSchema = z
  .string()
  .regex(timePattern, "Time must use 24-hour HH:mm format");

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours! * 60 + minutes!;
}

function validateSameDayShift(
  data: { shiftStart: string; shiftEnd: string },
  context: z.RefinementCtx,
) {
  if (
    timePattern.test(data.shiftStart) &&
    timePattern.test(data.shiftEnd) &&
    timeToMinutes(data.shiftStart) >= timeToMinutes(data.shiftEnd)
  ) {
    context.addIssue({
      code: "custom",
      path: ["shiftEnd"],
      message: "Shift end must be later than shift start",
    });
  }
}

export const createGuardInvitationSchema = z.object({
  params: z.object({ propertyId: z.uuid() }).strict(),
  body: z
    .object({
      identifier: z.string().trim().min(3).max(254),
      shiftStart: timeSchema,
      shiftEnd: timeSchema,
    })
    .strict()
    .superRefine(validateSameDayShift),
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
      if (data.action === "UPDATE_SHIFT") {
        validateSameDayShift(data, context);
      }
    }),
});

export const guardAssignmentIdParamSchema = z.object({
  params: z.object({ assignmentId: z.uuid() }).strict(),
});

export const listOwnerGuardAssignmentsQuerySchema = z.object({
  query: z
    .object({
      propertyId: z.uuid().optional(),
      status: z.enum(GuardAssignmentStatus).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
    .strict(),
});

export const listGuardAssignmentsQuerySchema = z.object({
  query: z
    .object({
      status: z.enum(GuardAssignmentStatus).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
    .strict(),
});

export const rejectGuardAssignmentSchema = z.object({
  params: z.object({ assignmentId: z.uuid() }).strict(),
  body: z.object({}).strict().default({}),
});
