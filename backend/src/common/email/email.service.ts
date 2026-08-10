import nodemailer, { type Transporter } from "nodemailer";
import { AppError } from "../errors/app-error.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

let emailTransporter: Transporter | undefined;

function getEmailConfiguration() {
  const host = env.EMAIL_HOST;
  const port = env.EMAIL_PORT;
  const username = env.EMAIL_USERNAME;
  const rawPassword = env.EMAIL_PASSWORD;
  const password = host?.toLowerCase().includes("gmail")
    ? rawPassword?.replace(/\s/g, "")
    : rawPassword;

  if (!host || !port || !username || !password) {
    throw new AppError({
      statusCode: 503,
      code: "EMAIL_SERVICE_NOT_CONFIGURED",
      message: "Email delivery is not configured",
    });
  }

  return { host, port, username, password };
}

function getEmailTransporter(): Transporter {
  if (emailTransporter) return emailTransporter;

  const { host, port, username, password } = getEmailConfiguration();
  const secure = port === 465;

  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: {
      user: username,
      pass: password,
    },
    tls: {
      minVersion: "TLSv1.2",
      servername: host,
    },
  });

  return emailTransporter;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return character;
    }
  });
}

export async function sendEmailVerificationCode(input: {
  to: string;
  fullName: string;
  code: string;
  expiresInMinutes: number;
}): Promise<void> {
  const { username: senderEmail } = getEmailConfiguration();
  const transporter = getEmailTransporter();
  const safeName = escapeHtml(input.fullName);

  try {
    const info = await transporter.sendMail({
      from: {
        name: "ParkEase BD",
        address: senderEmail,
      },
      to: input.to,
      subject: `${input.code} is your ParkEase BD verification code`,
      text: [
        `Hello ${input.fullName},`,
        "",
        `Your ParkEase BD email verification code is: ${input.code}`,
        `This code expires in ${input.expiresInMinutes} minutes.`,
        "",
        "If you did not request this code, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="background:#f4f7f9;padding:32px 16px;font-family:Arial,sans-serif;color:#182126">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce3e8;border-radius:8px;overflow:hidden">
            <div style="background:#116466;padding:20px 28px;color:#ffffff;font-size:22px;font-weight:700">
              ParkEase BD
            </div>
            <div style="padding:28px">
              <p style="margin:0 0 16px;font-size:16px">Hello ${safeName},</p>
              <p style="margin:0 0 20px;line-height:1.6">
                Use this code to verify your email address:
              </p>
              <div style="margin:0 0 20px;padding:16px;background:#eef7f6;border:1px solid #b9d9d6;border-radius:6px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#0b4f50">
                ${input.code}
              </div>
              <p style="margin:0 0 12px;line-height:1.6">
                This code expires in <strong>${input.expiresInMinutes} minutes</strong>.
              </p>
              <p style="margin:0;color:#59666d;font-size:14px;line-height:1.6">
                If you did not request this code, you can safely ignore this email.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (info.accepted.length === 0 || info.rejected.length > 0) {
      throw new Error("The SMTP server did not accept the verification email");
    }

    logger.info(
      { messageId: info.messageId },
      "Email verification message accepted for delivery",
    );
  } catch (error) {
    logger.error({ error }, "Email verification delivery failed");

    throw new AppError({
      statusCode: 503,
      code: "EMAIL_DELIVERY_FAILED",
      message: "Unable to send the verification email right now",
    });
  }
}
