import nodemailer, { type Transporter } from "nodemailer";
import { AppError } from "../errors/app-error.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ContentStatus, EmailTemplateType } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { renderEmailTemplate } from "./email-template.js";

type SmtpEmailConfiguration = {
  provider: "smtp";
  host: string;
  port: number;
  username: string;
  password: string;
  testTransport: boolean;
};

type ResendEmailConfiguration = {
  provider: "resend";
  apiKey: string;
  fromAddress: string;
};

type EmailConfiguration =
  | SmtpEmailConfiguration
  | ResendEmailConfiguration;

let emailTransporter: Transporter | undefined;

async function managedTemplate(type: EmailTemplateType, values: Record<string, string>) {
  try {
    const template = await prisma.emailTemplate.findFirst({ where: { type, status: ContentStatus.PUBLISHED }, orderBy: { version: "desc" } });
    return template ? renderEmailTemplate({ ...template, values }) : null;
  } catch (error) {
    logger.warn({ templateType: type, errorType: error instanceof Error ? error.name : "UnknownError" }, "Managed email template lookup failed; using the built-in transactional fallback");
    return null;
  }
}

function getEmailConfiguration(): EmailConfiguration {
  if (env.EMAIL_PROVIDER === "resend") {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM_ADDRESS) {
      throw new AppError({
        statusCode: 503,
        code: "EMAIL_SERVICE_NOT_CONFIGURED",
        message: "Email delivery is not configured",
      });
    }

    return {
      provider: "resend",
      apiKey: env.RESEND_API_KEY,
      fromAddress: env.EMAIL_FROM_ADDRESS,
    };
  }

  const host = env.EMAIL_HOST;
  const port = env.EMAIL_PORT;
  const username = env.EMAIL_USERNAME;
  const rawPassword = env.EMAIL_PASSWORD;

  if (env.NODE_ENV === "test") {
    return {
      provider: "smtp",
      host: host ?? "localhost",
      port: port ?? 1025,
      username: username ?? "test@parkease.local",
      password: rawPassword ?? "test-password",
      testTransport: true,
    };
  }

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

  return {
    provider: "smtp",
    host,
    port,
    username,
    password,
    testTransport: false,
  };
}

function getEmailTransporter(
  configuration: SmtpEmailConfiguration,
): Transporter {
  if (emailTransporter) return emailTransporter;

  if (configuration.testTransport) {
    emailTransporter = nodemailer.createTransport({ jsonTransport: true });
    return emailTransporter;
  }

  const secure = configuration.port === 465;

  emailTransporter = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure,
    requireTLS: !secure,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    dnsTimeout: 5_000,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: {
      user: configuration.username,
      pass: configuration.password,
    },
    tls: {
      minVersion: "TLSv1.2",
      servername: configuration.host,
    },
  });

  return emailTransporter;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character] ?? character;
  });
}

function emailLayout(input: {
  fullName: string;
  heading: string;
  content: string;
  actionHtml: string;
  footer: string;
}): string {
  return `
    <div style="background:#f4f7f9;padding:32px 16px;font-family:Arial,sans-serif;color:#182126">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce3e8;border-radius:8px;overflow:hidden">
        <div style="background:#116466;padding:20px 28px;color:#ffffff;font-size:22px;font-weight:700">ParkEase BD</div>
        <div style="padding:28px">
          <p style="margin:0 0 16px;font-size:16px">Hello ${escapeHtml(input.fullName)},</p>
          <h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(input.heading)}</h1>
          <p style="margin:0 0 20px;line-height:1.6">${escapeHtml(input.content)}</p>
          ${input.actionHtml}
          <p style="margin:20px 0 0;color:#59666d;font-size:14px;line-height:1.6">${escapeHtml(input.footer)}</p>
        </div>
      </div>
    </div>
  `;
}

async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  failureCode: string;
  failureMessage: string;
}): Promise<void> {
  const configuration = getEmailConfiguration();
  const startedAt = Date.now();

  try {
    if (configuration.provider === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${configuration.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `ParkEase BD <${configuration.fromAddress}>`,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw Object.assign(
          new Error("The email provider rejected the request"),
          { providerStatusCode: response.status },
        );
      }

      const result = (await response.json()) as { id?: string };
      if (!result.id) {
        throw new Error("The email provider returned an invalid response");
      }

      logger.info(
        {
          messageId: result.id,
          durationMs: Date.now() - startedAt,
          emailProvider: configuration.provider,
        },
        "Transactional email accepted by email provider",
      );
      return;
    }

    const transporter = getEmailTransporter(configuration);
    const info = await transporter.sendMail({
      from: { name: "ParkEase BD", address: configuration.username },
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    if (
      !configuration.testTransport &&
      (info.accepted.length === 0 || info.rejected.length > 0)
    ) {
      throw new Error("The SMTP server did not accept the email");
    }

    logger.info({
      messageId: info.messageId,
      durationMs: Date.now() - startedAt,
      emailProvider: configuration.provider,
      smtpHost: configuration.host,
      smtpPort: configuration.port,
    }, "Transactional email accepted by SMTP server");
  } catch (error) {
    const smtpError = error instanceof Error ? error : undefined;
    logger.error({
      durationMs: Date.now() - startedAt,
      emailProvider: configuration.provider,
      smtpHost:
        configuration.provider === "smtp" ? configuration.host : undefined,
      smtpPort:
        configuration.provider === "smtp" ? configuration.port : undefined,
      smtpErrorCode: smtpError && "code" in smtpError ? smtpError.code : undefined,
      smtpCommand: smtpError && "command" in smtpError ? smtpError.command : undefined,
      smtpResponseCode: smtpError && "responseCode" in smtpError ? smtpError.responseCode : undefined,
      providerStatusCode:
        smtpError && "providerStatusCode" in smtpError
          ? smtpError.providerStatusCode
          : undefined,
    }, "Transactional email delivery failed");
    throw new AppError({
      statusCode: 503,
      code: input.failureCode,
      message: input.failureMessage,
    });
  }
}

export async function sendEmailVerificationCode(input: {
  to: string;
  fullName: string;
  code: string;
  expiresInMinutes: number;
}): Promise<void> {
  const managed = await managedTemplate(EmailTemplateType.EMAIL_VERIFICATION_OTP, { userName: input.fullName, otp: input.code, expiresIn: String(input.expiresInMinutes) });
  await sendTransactionalEmail({
    to: input.to,
    subject: managed?.subject ?? `${input.code} is your ParkEase BD verification code`,
    text: managed?.text ?? [
      `Hello ${input.fullName},`,
      "",
      `Your ParkEase BD email verification code is: ${input.code}`,
      `This code expires in ${input.expiresInMinutes} minutes.`,
      "",
      "If you did not request this code, ignore this email.",
    ].join("\n"),
    html: managed?.html ?? emailLayout({
      fullName: input.fullName,
      heading: "Verify your email address",
      content: "Use this code to verify your ParkEase BD email address.",
      actionHtml: `<div style="padding:16px;background:#eef7f6;border:1px solid #b9d9d6;border-radius:6px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#0b4f50">${input.code}</div><p style="margin:16px 0 0;line-height:1.6">This code expires in <strong>${input.expiresInMinutes} minutes</strong>.</p>`,
      footer:
        "If you did not request this code, you can safely ignore this email.",
    }),
    failureCode: "EMAIL_DELIVERY_FAILED",
    failureMessage: "Unable to send the verification email right now",
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): Promise<void> {
  const safeUrl = escapeHtml(input.resetUrl);
  const managed = await managedTemplate(EmailTemplateType.PASSWORD_RESET, { userName: input.fullName, resetUrl: input.resetUrl, expiresIn: String(input.expiresInMinutes) });
  await sendTransactionalEmail({
    to: input.to,
    subject: managed?.subject ?? "Reset your ParkEase BD password",
    text: managed?.text ?? [
      `Hello ${input.fullName},`,
      "",
      "Use this link to reset your ParkEase BD password:",
      input.resetUrl,
      "",
      `This link expires in ${input.expiresInMinutes} minutes.`,
      "If you did not request a reset, ignore this email.",
    ].join("\n"),
    html: managed?.html ?? emailLayout({
      fullName: input.fullName,
      heading: "Reset your password",
      content: "A password reset was requested for your ParkEase BD account.",
      actionHtml: `<a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#116466;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700">Reset password</a><p style="margin:16px 0 0;line-height:1.6">This link expires in <strong>${input.expiresInMinutes} minutes</strong>.</p>`,
      footer:
        "If you did not request this reset, you can safely ignore this email.",
    }),
    failureCode: "PASSWORD_RESET_EMAIL_DELIVERY_FAILED",
    failureMessage: "Unable to send the password reset email right now",
  });
}

export async function sendManagedEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  await sendTransactionalEmail({
    ...input,
    failureCode: "MANAGED_EMAIL_DELIVERY_FAILED",
    failureMessage: "The email could not be delivered right now",
  });
}

export async function sendAccountSetupEmail(input: {
  to: string;
  fullName: string;
  role: string;
  setupUrl: string;
  expiresInMinutes: number;
}): Promise<void> {
  const safeUrl = escapeHtml(input.setupUrl);
  const roleName = input.role.toLowerCase().replaceAll("_", " ");
  const managed = await managedTemplate(EmailTemplateType.ACCOUNT_SETUP, { userName: input.fullName, setupUrl: input.setupUrl, expiresIn: String(input.expiresInMinutes), status: roleName });
  await sendTransactionalEmail({
    to: input.to,
    subject: managed?.subject ?? "Complete your ParkEase BD account setup",
    text: managed?.text ?? [
      `Hello ${input.fullName},`,
      "",
      `A ParkEase BD ${roleName} account has been created for you by an administrator.`,
      `Set your private password using this link: ${input.setupUrl}`,
      `This one-time link expires in ${input.expiresInMinutes} minutes.`,
      "",
      "If you were not expecting this account, contact ParkEase BD support.",
    ].join("\n"),
    html: managed?.html ?? emailLayout({
      fullName: input.fullName,
      heading: "Complete your account setup",
      content: `A ParkEase BD ${roleName} account has been created for you by an administrator.`,
      actionHtml: `<a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#116466;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700">Set private password</a><p style="margin:16px 0 0;line-height:1.6">This one-time link expires in <strong>${input.expiresInMinutes} minutes</strong>.</p>`,
      footer: "If you were not expecting this account, contact ParkEase BD support.",
    }),
    failureCode: "ACCOUNT_SETUP_DELIVERY_FAILED",
    failureMessage: "The account setup email could not be delivered",
  });
}

export async function sendGuardInvitationEmail(input: {
  to: string;
  fullName: string;
  setupUrl: string;
  expiresInMinutes: number;
}): Promise<void> {
  const safeUrl = escapeHtml(input.setupUrl);
  const managed = await managedTemplate(EmailTemplateType.GUARD_INVITATION, { userName: input.fullName, setupUrl: input.setupUrl, expiresIn: String(input.expiresInMinutes) });
  await sendTransactionalEmail({
    to: input.to,
    subject: managed?.subject ?? "You have been invited to ParkEase BD",
    text: managed?.text ?? [
      `Hello ${input.fullName},`,
      "",
      "A ParkEase BD Guard account has been created for you.",
      `Set your password using this link: ${input.setupUrl}`,
      `This link expires in ${input.expiresInMinutes} minutes.`,
    ].join("\n"),
    html: managed?.html ?? emailLayout({
      fullName: input.fullName,
      heading: "Complete your Guard account",
      content:
        "A controlled ParkEase BD Guard account has been created for you.",
      actionHtml: `<a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#116466;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700">Set account password</a><p style="margin:16px 0 0;line-height:1.6">This link expires in <strong>${input.expiresInMinutes} minutes</strong>.</p>`,
      footer:
        "If you were not expecting this invitation, contact ParkEase BD support.",
    }),
    failureCode: "GUARD_INVITATION_DELIVERY_FAILED",
    failureMessage: "Unable to send the Guard invitation right now",
  });
}

export async function sendManagerInvitationEmail(input: {
  to: string;
  fullName: string;
  setupUrl: string;
  expiresInMinutes: number;
}): Promise<void> {
  const safeUrl = escapeHtml(input.setupUrl);
  const managed = await managedTemplate(EmailTemplateType.MANAGER_INVITATION, { userName: input.fullName, setupUrl: input.setupUrl, expiresIn: String(input.expiresInMinutes) });
  await sendTransactionalEmail({
    to: input.to,
    subject: managed?.subject ?? "You have been invited to manage ParkEase BD operations",
    text: managed?.text ?? [
      `Hello ${input.fullName},`,
      "",
      "A ParkEase BD Manager account has been created for you.",
      `Set your password using this link: ${input.setupUrl}`,
      `This link expires in ${input.expiresInMinutes} minutes.`,
    ].join("\n"),
    html: managed?.html ?? emailLayout({
      fullName: input.fullName,
      heading: "Complete your Manager account",
      content: "A controlled ParkEase BD Manager account has been created for you.",
      actionHtml: `<a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#116466;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700">Set account password</a><p style="margin:16px 0 0;line-height:1.6">This link expires in <strong>${input.expiresInMinutes} minutes</strong>.</p>`,
      footer: "If you were not expecting this invitation, contact ParkEase BD support.",
    }),
    failureCode: "MANAGER_INVITATION_DELIVERY_FAILED",
    failureMessage: "Unable to send the Manager invitation right now",
  });
}
