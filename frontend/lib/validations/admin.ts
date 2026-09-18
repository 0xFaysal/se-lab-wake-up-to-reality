import { z } from "zod";

export const disputeArbitrationSchema = z.object({
  action: z.enum(["REFUND_DRIVER", "RELEASE_OWNER", "SPLIT_RESOLUTION"], {
    required_error: "Please select an arbitration outcome",
  }),
  adminNotes: z
    .string()
    .min(10, "Arbitration notes must be at least 10 characters")
    .max(1000, "Notes cannot exceed 1000 characters"),
  splitPercentageDriver: z.number().min(0).max(100),
});

export type DisputeArbitrationFormValues = z.infer<typeof disputeArbitrationSchema>;

export const kycDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
  internalNotes: z.string().optional(),
}).refine(
  (data) => {
    if (data.decision === "REJECT") {
      return !!data.rejectionReason && data.rejectionReason.trim().length >= 10;
    }
    return true;
  },
  {
    message: "Rejection reason must be at least 10 characters so the owner can rectify",
    path: ["rejectionReason"],
  }
);

export type KycDecisionFormValues = z.infer<typeof kycDecisionSchema>;
