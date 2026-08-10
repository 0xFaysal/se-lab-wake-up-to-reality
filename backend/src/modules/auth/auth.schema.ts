import { z } from "zod";
import { normalizeBangladeshPhone } from "../../common/auth/phone.js";

const uppercaseRegex = /[A-Z]/;
const specialCharacterRegex = /[^A-Za-z0-9]/;

export const strongPasswordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(
    uppercaseRegex,
    "Password must contain at least one uppercase letter"
  )
  .regex(
    specialCharacterRegex,
    "Password must contain at least one special character"
  );

export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(2)
      .max(120),

    email: z
      .string()
      .trim()
      .email()
      .transform((value) =>
        value.toLowerCase()
      ),

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

    password: strongPasswordSchema,

    role: z.enum([
      "DRIVER",
      "PARKING_OWNER"
    ], {
      error: "Role must be either DRIVER or PARKING_OWNER"
    }),

    acceptTerms: z.literal(true),
    acceptPrivacyPolicy: z.literal(true)
  })
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .trim()
      .min(3),

    password: z
      .string()
      .min(1),

    rememberDevice: z
      .boolean()
      .default(false)
  })
});

export const changeInitialPasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1),

    newPassword: strongPasswordSchema
  })
});

export const requestPasswordResetSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3).max(254),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(32).max(200),
    newPassword: strongPasswordSchema,
  }),
});

export const confirmVerificationSchema = z.object({
  body: z.object({
    code: z.string().regex(/^\d{6}$/, "Verification code must be 6 digits"),
  }),
});
