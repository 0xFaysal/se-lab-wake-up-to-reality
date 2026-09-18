import { AppError } from "../errors/app-error.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

type TwilioMessageResponse = {
  sid?: string;
  status?: string;
};

function getTwilioConfiguration() {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    if (env.EXPOSE_DEVELOPMENT_AUTH_CODES) return null;

    throw new AppError({
      statusCode: 503,
      code: "SMS_SERVICE_NOT_CONFIGURED",
      message: "SMS delivery is not configured",
    });
  }

  return { accountSid, authToken, fromNumber };
}

export async function sendPhoneVerificationCode(input: {
  to: string;
  code: string;
  expiresInMinutes: number;
}): Promise<void> {
  const configuration = getTwilioConfiguration();
  if (!configuration) return;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${configuration.accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: configuration.fromNumber,
    To: input.to,
    Body: `Your ParkEase BD verification code is ${input.code}. It expires in ${input.expiresInMinutes} minutes. Do not share this code.`,
  });
  const authorization = Buffer.from(
    `${configuration.accountSid}:${configuration.authToken}`,
  ).toString("base64");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(
        `Twilio rejected the message with status ${response.status}`,
      );
    }

    const result = (await response.json()) as TwilioMessageResponse;
    logger.info(
      { messageSid: result.sid, status: result.status },
      "Phone verification message accepted",
    );
  } catch (error) {
    logger.error({ error }, "Phone verification delivery failed");
    throw new AppError({
      statusCode: 503,
      code: "SMS_DELIVERY_FAILED",
      message: "Unable to send the verification SMS right now",
    });
  }
}
