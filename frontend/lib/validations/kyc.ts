import { z } from "zod";

export const ownerKycSchema = z.object({
  legalName: z.string().min(3, "Legal name must be at least 3 characters"),
  idType: z.enum(["NID", "SMART_NID", "PASSPORT"], {
    required_error: "Please select an ID type",
  }),
  idNumber: z
    .string()
    .min(6, "ID number must be at least 6 characters")
    .max(20, "ID number is too long"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  propertyType: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED_USE"]),
  tradeLicenseNumber: z.string().optional(),
  nidFrontUploaded: z.boolean().refine((val) => val === true, {
    message: "Front of ID document is required",
  }),
  nidBackUploaded: z.boolean().refine((val) => val === true, {
    message: "Back of ID document is required",
  }),
  agreeToDeclaration: z.boolean().refine((val) => val === true, {
    message: "You must certify the authenticity of the documents",
  }),
});

export type OwnerKycFormValues = z.infer<typeof ownerKycSchema>;

export const managerActivationSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms of manager engagement",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ManagerActivationFormValues = z.infer<typeof managerActivationSchema>;
