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
  CORS_ORIGIN: z.string().url(),
});


const result = schema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment variables",
    result.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = result.data;
