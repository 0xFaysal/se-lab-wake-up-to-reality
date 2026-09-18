import { z } from "zod";

export const strongPasswordSchema = z.string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be under 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9\s]/, "Password must contain at least one special character")
  .regex(/^\S+$/, "Password must not contain spaces");

// ---------------------------------------------------------------------------
// Login Schema
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone is required")
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isPhone = /^(?:\+?880|0)1[3-9]\d{8}$/.test(val.replace(/\s/g, ""));
        return isEmail || isPhone;
      },
      { message: "Enter a valid email address or Bangladeshi phone number" }
    ),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be under 128 characters"),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Register Schema
// ---------------------------------------------------------------------------

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters")
      .max(120, "Full name must be under 120 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .refine(
        (val) => /^(?:\+?880|0)1[3-9]\d{8}$/.test(val.replace(/\s/g, "")),
        { message: "Enter a valid Bangladeshi phone number (e.g. 01712345678)" }
      ),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["DRIVER", "PARKING_OWNER"], {
      required_error: "Please select a role",
    }),
    agreeToPrivacy: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Privacy Policy to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Forgot & Reset Password Schemas
// ---------------------------------------------------------------------------

export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone is required")
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isPhone = /^(?:\+?880|0)1[3-9]\d{8}$/.test(val.replace(/\s/g, ""));
        return isEmail || isPhone;
      },
      { message: "Enter a valid registered email or Bangladeshi phone number" }
    ),
  method: z.enum(["EMAIL", "PHONE"]),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, "Verification code must be 6 digits"),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// OTP Verification Schema
// ---------------------------------------------------------------------------

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, "Please enter all 6 digits"),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
