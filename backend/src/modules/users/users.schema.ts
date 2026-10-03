import { z } from "zod";
import { strongPasswordSchema } from "../auth/auth.schema.js";
import { normalizeBangladeshPhone } from "../../common/auth/phone.js";

export const createGuardSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(
        /^[^\x00-\x1F\x7F]+$/,
        "Full name must not contain control characters",
      ),
    email: z
      .string()
      .trim()
      .max(254)
      .email()
      .transform((value) => value.toLowerCase()),
    phone: z
      .string()
      .trim()
      .min(10)
      .max(20)
      .transform((value, context) => {
        try {
          return normalizeBangladeshPhone(value);
        } catch {
          context.addIssue({
            code: "custom",
            message: "Phone number must be a valid Bangladesh mobile number",
          });
          return z.NEVER;
        }
      }),
  }),
});

export const createManagerSchema = createGuardSchema;

export const updateOwnProfileSchema = z.object({
  body: z
    .object({
      fullName: createGuardSchema.shape.body.shape.fullName,
    })
    .strict(),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: strongPasswordSchema,
  }),
});

export const revokeSessionSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
});
