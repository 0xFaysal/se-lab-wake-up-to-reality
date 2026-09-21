import "dotenv/config";
import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

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
    DIRECT_URL: z.string().min(1).optional(),
    REDIS_URL: z.string().min(1),
    CORS_ORIGIN: z.url(),
    FRONTEND_BASE_URL: z.url().optional(),
    API_PUBLIC_URL: z.url().optional(),
    PASSWORD_RESET_URL: z.url().optional(),
    TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0),
    COOKIE_SAME_SITE: z.enum(["lax", "none"]).default("lax"),
    ENABLE_API_DOCS: z
      .enum(["true", "false"])
      .default(process.env.NODE_ENV === "production" ? "false" : "true")
      .transform((value) => value === "true"),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    VERIFICATION_CODE_SECRET: z.string().min(32),
    AUTH_METADATA_HASH_SECRET: z.string().min(32),
    PROPERTY_ADDRESS_FINGERPRINT_SECRET: z.string().min(32),
    DATA_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/)
      .optional(),
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
    EMAIL_PROVIDER: z.enum(["smtp", "resend"]).default("smtp"),
    EMAIL_HOST: z.string().min(1).optional(),
    EMAIL_PORT: z.coerce.number().int().positive().max(65535).optional(),
    EMAIL_USERNAME: z.email().optional(),
    EMAIL_PASSWORD: z.string().min(1).optional(),
    RESEND_API_KEY: optionalNonEmptyString,
    EMAIL_FROM_ADDRESS: z.email().optional(),
    EMAIL_WORKER_ENABLED: z
      .enum(["true", "false"])
      .default(process.env.NODE_ENV === "development" ? "true" : "false")
      .transform((value) => value === "true"),
    EMAIL_WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(1000).max(60000).default(5000),
    CLOUDINARY_CLOUD_NAME: optionalNonEmptyString,
    CLOUDINARY_API_KEY: optionalNonEmptyString,
    CLOUDINARY_API_SECRET: optionalNonEmptyString,
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
    SSLCOMMERZ_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
    SSLCOMMERZ_ENVIRONMENT: z.enum(["sandbox", "live"]).default("sandbox"),
    SSLCOMMERZ_STORE_ID: optionalNonEmptyString,
    SSLCOMMERZ_STORE_PASSWORD: optionalNonEmptyString,
    SSLCOMMERZ_SUCCESS_URL: z.url().optional(),
    SSLCOMMERZ_FAIL_URL: z.url().optional(),
    SSLCOMMERZ_CANCEL_URL: z.url().optional(),
    SSLCOMMERZ_IPN_URL: z.url().optional(),
    SSLCOMMERZ_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(10000),
    SIMULATED_PAYMENTS_ENABLED: z.enum(["true", "false"])
      .default(process.env.NODE_ENV === "production" ? "false" : "true")
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
      value.PROPERTY_ADDRESS_FINGERPRINT_SECRET,
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
    if (
      value.EMAIL_PROVIDER === "smtp" &&
      emailConfiguration.some((entry) => entry !== undefined)
    ) {
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

    if (value.EMAIL_PROVIDER === "resend") {
      if (!value.RESEND_API_KEY) {
        context.addIssue({
          code: "custom",
          path: ["RESEND_API_KEY"],
          message: "Resend API key is required when EMAIL_PROVIDER=resend",
        });
      }
      if (!value.EMAIL_FROM_ADDRESS) {
        context.addIssue({
          code: "custom",
          path: ["EMAIL_FROM_ADDRESS"],
          message: "Email sender address is required when EMAIL_PROVIDER=resend",
        });
      }
    }

    if (value.SSLCOMMERZ_ENABLED) {
      for (const name of [
        "SSLCOMMERZ_STORE_ID",
        "SSLCOMMERZ_STORE_PASSWORD",
        "SSLCOMMERZ_SUCCESS_URL",
        "SSLCOMMERZ_FAIL_URL",
        "SSLCOMMERZ_CANCEL_URL",
        "SSLCOMMERZ_IPN_URL",
      ] as const) {
        if (!value[name]) {
          context.addIssue({ code: "custom", path: [name], message: `${name} is required when SSLCOMMERZ is enabled` });
        }
      }
    }

    if (value.SSLCOMMERZ_ENVIRONMENT === "live" && value.NODE_ENV !== "production") {
      context.addIssue({ code: "custom", path: ["SSLCOMMERZ_ENVIRONMENT"], message: "Live payments require NODE_ENV=production" });
    }

    const cloudinaryConfiguration = [
      value.CLOUDINARY_CLOUD_NAME,
      value.CLOUDINARY_API_KEY,
      value.CLOUDINARY_API_SECRET,
    ];
    if (cloudinaryConfiguration.some((entry) => entry !== undefined)) {
      cloudinaryConfiguration.forEach((entry, index) => {
        if (entry === undefined) {
          context.addIssue({
            code: "custom",
            path: [
              [
                "CLOUDINARY_CLOUD_NAME",
                "CLOUDINARY_API_KEY",
                "CLOUDINARY_API_SECRET",
              ][index]!,
            ],
            message: "Complete Cloudinary configuration is required",
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

      if (value.EMAIL_PROVIDER === "smtp") {
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
      }

      cloudinaryConfiguration.forEach((entry, index) => {
        if (entry === undefined) {
          context.addIssue({
            code: "custom",
            path: [
              [
                "CLOUDINARY_CLOUD_NAME",
                "CLOUDINARY_API_KEY",
                "CLOUDINARY_API_SECRET",
              ][index]!,
            ],
            message: "Cloudinary configuration is required in production",
          });
        }
      });

      for (const [name, url] of [
        ["CORS_ORIGIN", value.CORS_ORIGIN],
        ["FRONTEND_BASE_URL", value.FRONTEND_BASE_URL],
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

      if (value.SSLCOMMERZ_ENABLED) {
        for (const name of ["SSLCOMMERZ_SUCCESS_URL", "SSLCOMMERZ_FAIL_URL", "SSLCOMMERZ_CANCEL_URL", "SSLCOMMERZ_IPN_URL"] as const) {
          const url = value[name];
          if (url && new URL(url).protocol !== "https:") {
            context.addIssue({ code: "custom", path: [name], message: `${name} must use HTTPS in production` });
          }
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
