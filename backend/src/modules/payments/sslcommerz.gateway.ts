import { z } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/app-error.js";

const gatewayOrigin =
  env.SSLCOMMERZ_ENVIRONMENT === "live"
    ? "https://securepay.sslcommerz.com"
    : "https://sandbox.sslcommerz.com";

const sessionResponseSchema = z
  .object({
    status: z.string(),
    sessionkey: z.string().optional(),
    GatewayPageURL: z.url().optional(),
    failedreason: z.string().optional(),
  })
  .passthrough();

const validationResponseSchema = z
  .object({
    status: z.string(),
    tran_id: z.string(),
    val_id: z.string(),
    amount: z.coerce.number(),
    currency: z.string(),
    bank_tran_id: z.string().optional().default(""),
    card_type: z.string().optional(),
    card_brand: z.string().optional(),
    card_issuer: z.string().optional(),
    risk_level: z.coerce.number().int().optional(),
    risk_title: z.string().optional(),
  })
  .passthrough();

const refundResponseSchema = z
  .object({
    APIConnect: z.string(),
    bank_tran_id: z.string().optional(),
    trans_id: z.string().optional(),
    refund_ref_id: z.string().optional(),
    status: z.string().optional(),
    errorReason: z.string().optional(),
  })
  .passthrough();

const transactionQueryResponseSchema = z
  .object({
    APIConnect: z.string(),
    no_of_trans_found: z.coerce.number().int(),
    element: z.array(validationResponseSchema).default([]),
  })
  .passthrough();

export type SslCommerzValidation = z.infer<typeof validationResponseSchema>;

function credentials() {
  if (
    !env.SSLCOMMERZ_ENABLED ||
    !env.SSLCOMMERZ_STORE_ID ||
    !env.SSLCOMMERZ_STORE_PASSWORD
  ) {
    throw new AppError({
      statusCode: 503,
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
      message: "Online payment is not configured",
    });
  }
  return {
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
  };
}

async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  try {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(env.SSLCOMMERZ_REQUEST_TIMEOUT_MS),
      headers: { accept: "application/json", ...init.headers },
    });
    if (!response.ok)
      throw new Error(`Gateway responded with HTTP ${response.status}`);
    return await response.json();
  } catch (cause) {
    throw new AppError({
      statusCode: 502,
      code: "PAYMENT_GATEWAY_UNAVAILABLE",
      message: "The payment gateway is temporarily unavailable",
      details: cause instanceof Error ? { reason: cause.message } : undefined,
    });
  }
}

function formBody(values: Record<string, string>): URLSearchParams {
  return new URLSearchParams(values);
}

export function paisaToGatewayAmount(amountPaisa: bigint): string {
  if (amountPaisa <= 0n) throw new Error("Payment amount must be positive");
  return `${amountPaisa / 100n}.${(amountPaisa % 100n).toString().padStart(2, "0")}`;
}

export function gatewayAmountToPaisa(amount: number): bigint {
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Invalid gateway amount");
  return BigInt(Math.round(amount * 100));
}

export function sessionFailureFromReason(reason?: string): AppError {
  const normalizedReason = reason?.trim().toLowerCase() ?? "";

  if (
    normalizedReason.includes("credential") ||
    normalizedReason.includes("store is de-active") ||
    normalizedReason.includes("store is inactive")
  ) {
    return new AppError({
      statusCode: 503,
      code: "PAYMENT_GATEWAY_CREDENTIALS_REJECTED",
      message: "The payment gateway rejected the configured merchant account",
      details: {
        action:
          "Verify that the SSLCommerz Store ID and API Store Password belong to the same active environment",
      },
    });
  }

  return new AppError({
    statusCode: 502,
    code: "PAYMENT_SESSION_FAILED",
    message: "Unable to open the secure payment page",
    ...(reason ? { details: { gatewayReason: reason } } : {}),
  });
}

export async function createSession(input: {
  transactionId: string;
  amountPaisa: bigint;
  customer: { name: string; email: string; phone: string };
  productName: string;
}) {
  const configured = credentials();
  const data = await requestJson(`${gatewayOrigin}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: formBody({
      ...configured,
      total_amount: paisaToGatewayAmount(input.amountPaisa),
      currency: "BDT",
      tran_id: input.transactionId,
      success_url: env.SSLCOMMERZ_SUCCESS_URL!,
      fail_url: env.SSLCOMMERZ_FAIL_URL!,
      cancel_url: env.SSLCOMMERZ_CANCEL_URL!,
      ipn_url: env.SSLCOMMERZ_IPN_URL!,
      cus_name: input.customer.name,
      cus_email: input.customer.email,
      cus_phone: input.customer.phone,
      cus_add1: "Bangladesh",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      shipping_method: "NO",
      product_name: input.productName,
      product_category: "Parking",
      product_profile: "non-physical-goods",
    }),
  });
  const parsed = sessionResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw sessionFailureFromReason();
  }
  if (
    parsed.data.status !== "SUCCESS" ||
    !parsed.data.GatewayPageURL ||
    !parsed.data.sessionkey
  ) {
    throw sessionFailureFromReason(parsed.data.failedreason);
  }
  return {
    checkoutUrl: parsed.data.GatewayPageURL,
    sessionKey: parsed.data.sessionkey,
  };
}

export async function validateTransaction(
  validationId: string,
): Promise<SslCommerzValidation> {
  const configured = credentials();
  const query = new URLSearchParams({
    val_id: validationId,
    ...configured,
    format: "json",
  });
  const data = await requestJson(
    `${gatewayOrigin}/validator/api/validationserverAPI.php?${query}`,
    { method: "GET" },
  );
  const parsed = validationResponseSchema.safeParse(data);
  if (!parsed.success || !["VALID", "VALIDATED"].includes(parsed.data.status)) {
    throw new AppError({
      statusCode: 409,
      code: "PAYMENT_VALIDATION_FAILED",
      message: "The gateway could not validate this payment",
    });
  }
  return parsed.data;
}

export async function queryTransaction(
  transactionId: string,
): Promise<SslCommerzValidation | null> {
  const configured = credentials();
  const query = new URLSearchParams({
    tran_id: transactionId,
    ...configured,
    format: "json",
  });
  const data = await requestJson(
    `${gatewayOrigin}/validator/api/merchantTransIDvalidationAPI.php?${query}`,
    { method: "GET" },
  );
  const parsed = transactionQueryResponseSchema.safeParse(data);
  if (!parsed.success || parsed.data.APIConnect !== "DONE") {
    throw new AppError({
      statusCode: 502,
      code: "PAYMENT_STATUS_UNAVAILABLE",
      message: "Unable to verify the gateway transaction status",
    });
  }
  return parsed.data.element[0] ?? null;
}

export async function initiateRefund(input: {
  bankTransactionId: string;
  refundTransactionId: string;
  amountPaisa: bigint;
  reason: string;
}) {
  const configured = credentials();
  const query = new URLSearchParams({
    ...configured,
    bank_tran_id: input.bankTransactionId,
    refund_trans_id: input.refundTransactionId,
    refund_amount: paisaToGatewayAmount(input.amountPaisa),
    refund_remarks: input.reason,
    format: "json",
  });
  const data = await requestJson(
    `${gatewayOrigin}/validator/api/merchantTransIDvalidationAPI.php?${query}`,
    { method: "GET" },
  );
  const parsed = refundResponseSchema.safeParse(data);
  if (
    !parsed.success ||
    parsed.data.APIConnect !== "DONE" ||
    !parsed.data.refund_ref_id
  ) {
    throw new AppError({
      statusCode: 502,
      code: "REFUND_SUBMISSION_FAILED",
      message: "The gateway did not accept this refund",
    });
  }
  return {
    refundReferenceId: parsed.data.refund_ref_id,
    status: parsed.data.status ?? "submitted",
  };
}

export async function queryRefund(refundReferenceId: string) {
  const configured = credentials();
  const query = new URLSearchParams({
    ...configured,
    refund_ref_id: refundReferenceId,
    format: "json",
  });
  const data = await requestJson(
    `${gatewayOrigin}/validator/api/merchantTransIDvalidationAPI.php?${query}`,
    { method: "GET" },
  );
  const parsed = refundResponseSchema.safeParse(data);
  if (!parsed.success || parsed.data.APIConnect !== "DONE") {
    throw new AppError({
      statusCode: 502,
      code: "REFUND_STATUS_UNAVAILABLE",
      message: "Unable to verify the refund status",
    });
  }
  return {
    status: parsed.data.status ?? "unknown",
    rawStatus: parsed.data.status ?? "unknown",
  };
}
