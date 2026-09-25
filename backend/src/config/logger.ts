import pino from "pino";
import { env } from "./env.js";

const prettyTransport =
  env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            colorizeObjects: true,
            levelFirst: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname,service,env,req,res,responseTime,requestId",
            singleLine: false,
            messageFormat: "{if requestId}[req:{requestId}] {end}{msg}",
          },
        },
      }
    : {};

export const sensitiveLogPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers['x-refresh-token']",
  "res.headers['set-cookie']",
  "password",
  "*.password",
  "passwordHash",
  "*.passwordHash",
  "token",
  "*.token",
  "refreshToken",
  "*.refreshToken",
  "code",
  "*.code",
  "developmentCode",
  "*.developmentCode",
  "developmentResetToken",
  "*.developmentResetToken",
  "developmentSetupToken",
  "*.developmentSetupToken",
  "CLOUDINARY_API_SECRET",
  "*.CLOUDINARY_API_SECRET",
  "cloudinaryApiSecret",
  "*.cloudinaryApiSecret",
  "SSLCOMMERZ_STORE_PASSWORD",
  "*.SSLCOMMERZ_STORE_PASSWORD",
  "store_passwd",
  "*.store_passwd",
] as const;

export const logger = pino({
  base: {
    service: env.APP_NAME,
    env: env.NODE_ENV,
  },
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  serializers: {
    error: pino.stdSerializers.err,
  },
  redact: {
    paths: [...sensitiveLogPaths],
    censor: "[REDACTED]",
  },
  ...prettyTransport,
});
