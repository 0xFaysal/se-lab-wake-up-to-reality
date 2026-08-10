import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_NAME: z.string().min(1).default("ParkEase API"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CORS_ORIGIN: z.url(),
  API_PUBLIC_URL: z.url().optional(),
  ENABLE_API_DOCS: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1).default("parkease-api"),
  JWT_AUDIENCE: z.string().min(1).default("parkease-client"),
  JWT_ACCESS_EXPIRES_MINUTES: z.coerce.number().int().positive().default(15),
  JWT_REFRESH_SHORT_DAYS: z.coerce.number().int().positive().default(1),
  JWT_REFRESH_LONG_DAYS: z.coerce.number().int().positive().default(30),
  PASSWORD_RESET_EXPIRES_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15),
  VERIFICATION_CODE_EXPIRES_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10),
  EMAIL_HOST: z.string().min(1).optional(),
  EMAIL_PORT: z.coerce.number().int().positive().max(65535).optional(),
  EMAIL_USERNAME: z.email().optional(),
  EMAIL_PASSWORD: z.string().min(1).optional(),
}).superRefine((value, context) => {
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
    context.addIssue({
      code: "custom",
      path: ["JWT_REFRESH_SECRET"],
      message: "JWT access and refresh secrets must be different",
    });
  }
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment variables",
    z.flattenError(result.error).fieldErrors,
  );
  process.exit(1);
}

export const env = result.data;
