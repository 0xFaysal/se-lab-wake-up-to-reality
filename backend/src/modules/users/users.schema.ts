import { z } from "zod";
import { strongPasswordSchema } from "../auth/auth.schema.js";

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: strongPasswordSchema,
  }),
});

export const revokeSessionSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
});
