import { z } from "zod";
import { normalizeBangladeshPhone } from "../../common/auth/phone.js";

const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const digitRegex = /\d/;
const specialCharacterRegex = /[^A-Za-z0-9\s]/;
const noWhitespaceRegex = /^\S+$/;
const noControlCharactersRegex = /^[^\x00-\x1F\x7F]+$/;

export const strongPasswordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(uppercaseRegex, "Password must contain at least one uppercase letter")
  .regex(lowercaseRegex, "Password must contain at least one lowercase letter")
  .regex(digitRegex, "Password must contain at least one number")
  .regex(
    specialCharacterRegex,
    "Password must contain at least one special character",
  )
  .regex(noWhitespaceRegex, "Password must not contain whitespace");

export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(
        noControlCharactersRegex,
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

    password: strongPasswordSchema,

    role: z
      .enum(["DRIVER", "PROVIDER", "PARKING_OWNER"], {
        error: "Role must be either DRIVER or PROVIDER",
      })
      .transform((role) => (role === "PARKING_OWNER" ? "PROVIDER" : role)),

    acceptTerms: z.literal(true),
    acceptPrivacyPolicy: z.literal(true),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3).max(254),

    password: z.string().min(1).max(128),

    rememberDevice: z.boolean().default(false),
  }),
});

export const changeInitialPasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(128),

    newPassword: strongPasswordSchema,
  }),
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
