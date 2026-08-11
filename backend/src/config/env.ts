import "dotenv/config";
import { z } from "zod";

const schema = z
  .object({
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
    PASSWORD_RESET_URL: z.url().optional(),
    TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0),
    ENABLE_API_DOCS: z
      .enum(["true", "false"])
      .default(process.env.NODE_ENV === "production" ? "false" : "true")
      .transform((value) => value === "true"),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    VERIFICATION_CODE_SECRET: z.string().min(32),
    AUTH_METADATA_HASH_SECRET: z.string().min(32),
    DATA_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/).optional(),
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
    TWILIO_ACCOUNT_SID: z
      .string()
      .regex(/^AC[0-9a-fA-F]{32}$/)
      .optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_FROM_NUMBER: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/)
      .optional(),
    EXPOSE_DEVELOPMENT_AUTH_CODES: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  })
  .superRefine((value, context) => {
    if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
      context.addIssue({
        code: "custom",
        path: ["JWT_REFRESH_SECRET"],
        message: "JWT access and refresh secrets must be different",
      });
    }

    const securitySecrets = [
      value.JWT_ACCESS_SECRET,
      value.JWT_REFRESH_SECRET,
      value.VERIFICATION_CODE_SECRET,
      value.AUTH_METADATA_HASH_SECRET,
      ...(value.DATA_ENCRYPTION_KEY ? [value.DATA_ENCRYPTION_KEY] : []),
    ];
    if (new Set(securitySecrets).size !== securitySecrets.length) {
      context.addIssue({
        code: "custom",
        path: ["VERIFICATION_CODE_SECRET"],
        message: "Security secrets must all be different",
      });
    }

    const emailConfiguration = [
      value.EMAIL_HOST,
      value.EMAIL_PORT,
      value.EMAIL_USERNAME,
      value.EMAIL_PASSWORD,
    ];
    if (emailConfiguration.some((entry) => entry !== undefined)) {
      emailConfiguration.forEach((entry, index) => {
        if (entry === undefined) {
          context.addIssue({
            code: "custom",
            path: [
              ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USERNAME", "EMAIL_PASSWORD"][
                index
              ]!,
            ],
            message: "Complete SMTP configuration is required",
          });
        }
      });
    }

    const twilioConfiguration = [
      value.TWILIO_ACCOUNT_SID,
      value.TWILIO_AUTH_TOKEN,
      value.TWILIO_FROM_NUMBER,
    ];
    if (twilioConfiguration.some((entry) => entry !== undefined)) {
      twilioConfiguration.forEach((entry, index) => {
        if (entry === undefined) {
          context.addIssue({
            code: "custom",
            path: [
              ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"][
                index
              ]!,
            ],
            message: "Complete Twilio configuration is required",
          });
        }
      });
    }

    if (
      value.NODE_ENV === "production" &&
      value.EXPOSE_DEVELOPMENT_AUTH_CODES
    ) {
      context.addIssue({
        code: "custom",
        path: ["EXPOSE_DEVELOPMENT_AUTH_CODES"],
        message: "Authentication codes cannot be exposed in production",
      });
    }

    if (value.NODE_ENV === "production") {
      if (!value.DATA_ENCRYPTION_KEY) {
        context.addIssue({
          code: "custom",
          path: ["DATA_ENCRYPTION_KEY"],
          message: "A 32-byte data encryption key is required in production",
        });
      }

      emailConfiguration.forEach((entry, index) => {
        if (entry === undefined) {
          context.addIssue({
            code: "custom",
            path: [
              ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USERNAME", "EMAIL_PASSWORD"][
                index
              ]!,
            ],
            message: "SMTP configuration is required in production",
          });
        }
      });

      twilioConfiguration.forEach((entry, index) => {
        if (entry === undefined) {
          context.addIssue({
            code: "custom",
            path: [
              ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"][
                index
              ]!,
            ],
            message: "Twilio configuration is required in production",
          });
        }
      });

      for (const [name, url] of [
        ["CORS_ORIGIN", value.CORS_ORIGIN],
        ["API_PUBLIC_URL", value.API_PUBLIC_URL],
        ["PASSWORD_RESET_URL", value.PASSWORD_RESET_URL],
      ] as const) {
        if (url && new URL(url).protocol !== "https:") {
          context.addIssue({
            code: "custom",
            path: [name],
            message: `${name} must use HTTPS in production`,
          });
        }
      }
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
