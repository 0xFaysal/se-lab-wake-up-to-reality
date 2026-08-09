import { z } from "zod";

const bangladeshPhoneRegex = /^(?:\+8801|8801|01)[3-9]\d{8}$/;
const uppercaseRegex = /[A-Z]/;
const specialCharacterRegex = /[^A-Za-z0-9]/;

const strongPasswordSchema = z
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
      .regex(
        bangladeshPhoneRegex,
        "Phone number must be a valid Bangladesh mobile number"
      ),

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
