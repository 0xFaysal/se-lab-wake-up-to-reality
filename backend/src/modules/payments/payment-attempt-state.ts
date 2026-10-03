import {
  PaymentStatus,
  type Prisma,
} from "../../../generated/prisma/client.js";
import { lockEntity } from "../marketplace/marketplace.repository.js";
import { AppError } from "../../common/errors/app-error.js";

export function assertGatewayPaymentIdentity(
  payment: {
    merchantTransactionId: string | null;
    provider: string;
    amountPaisa: bigint;
    currency: string;
  },
  validated: {
    merchantTransactionId: string;
    amountPaisa: bigint;
    currency: string;
  },
) {
  if (payment.merchantTransactionId !== validated.merchantTransactionId)
    throw new AppError({
      statusCode: 409,
      code: "PAYMENT_IDENTITY_MISMATCH",
      message:
        "Gateway transaction identity did not match the current payment attempt",
    });
  if (payment.provider !== "SSLCOMMERZ")
    throw new AppError({
      statusCode: 409,
      code: "PAYMENT_GATEWAY_MISMATCH",
      message: "Payment gateway did not match",
    });
  if (
    payment.amountPaisa !== validated.amountPaisa ||
    payment.currency !== validated.currency
  )
    throw new AppError({
      statusCode: 409,
      code: "PAYMENT_AMOUNT_MISMATCH",
      message:
        "Gateway amount or currency did not match the current payment attempt",
    });
}

export async function lockPendingPaymentAttempt(
  tx: Prisma.TransactionClient,
  input: {
    paymentId: string;
    bookingId: string;
    merchantTransactionId: string;
  },
  allowedStatuses: PaymentStatus[] = [
    PaymentStatus.CREATED,
    PaymentStatus.SESSION_CREATED,
  ],
) {
  // Match capture/cancellation lock order, then re-read after concurrent work.
  await lockEntity(tx, "booking", input.bookingId);
  await lockEntity(tx, "payment", input.paymentId);
  const payment = await tx.payment.findUnique({
    where: { id: input.paymentId },
  });
  if (
    !payment ||
    payment.bookingId !== input.bookingId ||
    payment.merchantTransactionId !== input.merchantTransactionId ||
    !allowedStatuses.includes(payment.status)
  )
    return null;
  return payment;
}
