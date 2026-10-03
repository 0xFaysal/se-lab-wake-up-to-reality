import { createHash, randomBytes, randomUUID } from "node:crypto";
import { creditProviderEarnings } from "./provider-earnings.js";
import {
  assertGatewayPaymentIdentity,
  lockPendingPaymentAttempt,
} from "./payment-attempt-state.js";
import {
  BookingStatus,
  DomainAuditEventType,
  PaymentPurpose,
  PaymentStatus,
  type Prisma,
} from "../../../generated/prisma/client.js";
import { AppError } from "../../common/errors/app-error.js";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { createDomainAuditEvent } from "../property-governance/domain-audit.js";
import { lockEntity } from "../marketplace/marketplace.repository.js";
import {
  createSession,
  gatewayAmountToPaisa,
  initiateRefund,
  queryRefund,
  validateTransaction,
} from "./sslcommerz.gateway.js";
import {
  postSuccessfulBookingPayment,
  postSuccessfulSettlementFunding,
  getOrCreateWallet,
  releasePaymentWalletHolds,
  reserveDriverWallet,
} from "./payment-ledger.service.js";
import { notifyUser } from "../../common/realtime/realtime.js";

export const PAYMENT_SESSION_TTL_MS = 20 * 60 * 1000;

function fail(statusCode: number, code: string, message: string): never {
  throw new AppError({ statusCode, code, message });
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ),
  ) as T;
}

function transactionId(prefix = "PE"): string {
  return `${prefix}${Date.now().toString(36)}${randomBytes(6).toString("hex")}`
    .slice(0, 30)
    .toUpperCase();
}

const paymentView = {
  id: true,
  bookingId: true,
  amountPaisa: true,
  grossAmountPaisa: true,
  walletAppliedPaisa: true,
  currency: true,
  status: true,
  purpose: true,
  provider: true,
  environment: true,
  merchantTransactionId: true,
  gatewayStatus: true,
  initiatedAt: true,
  succeededAt: true,
  failedAt: true,
  cancelledAt: true,
  expiredAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PaymentSelect;

export async function initiateSslCommerzSession(
  driverUserId: string,
  bookingId: string,
  idempotencyKey: string,
  useWallet = true,
) {
  const walletHoldExpiresAt = new Date(Date.now() + PAYMENT_SESSION_TTL_MS);
  const prepared = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", bookingId);
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, driverUserId },
        include: {
          driver: { select: { fullName: true, email: true, phone: true } },
          property: { select: { name: true } },
        },
      });
      if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
      if (booking.status !== BookingStatus.PAYMENT_PENDING)
        fail(
          409,
          "BOOKING_NOT_AWAITING_PAYMENT",
          "Booking is not awaiting payment",
        );
      if (booking.startAt <= new Date())
        fail(
          409,
          "BOOKING_PAYMENT_WINDOW_CLOSED",
          "Payment must be completed before the booking starts",
        );
      const paid = await tx.payment.findFirst({
        where: {
          bookingId,
          status: {
            in: [
              PaymentStatus.SUCCEEDED,
              PaymentStatus.CAPTURED,
              PaymentStatus.PARTIALLY_REFUNDED,
              PaymentStatus.REFUNDED,
            ],
          },
        },
        select: { id: true },
      });
      if (paid)
        fail(409, "BOOKING_ALREADY_PAID", "This booking has already been paid");

      const byKey = await tx.payment.findUnique({ where: { idempotencyKey } });
      if (
        byKey &&
        (byKey.bookingId !== bookingId || byKey.payerUserId !== driverUserId)
      ) {
        fail(
          409,
          "IDEMPOTENCY_KEY_REUSED",
          "Idempotency key belongs to another payment",
        );
      }

      let payment =
        byKey ??
        (await tx.payment.findFirst({
          where: { bookingId, purpose: PaymentPurpose.BOOKING },
        }));
      const now = new Date();
      if (
        payment?.status === PaymentStatus.SESSION_CREATED &&
        payment.checkoutUrl &&
        payment.sessionExpiresAt &&
        payment.sessionExpiresAt > now
      ) {
        return { existing: true as const, payment, booking };
      }
      if (
        payment &&
        [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED].includes(
          payment.status as never,
        )
      ) {
        fail(409, "BOOKING_ALREADY_PAID", "This booking has already been paid");
      }
      const abandonedAttempt =
        payment?.status === PaymentStatus.SESSION_CREATED ||
        (payment?.status === PaymentStatus.CREATED &&
          payment.initiatedAt &&
          payment.initiatedAt.getTime() + PAYMENT_SESSION_TTL_MS <=
            now.getTime());
      let resetForRetry = false;
      if (
        payment &&
        (abandonedAttempt ||
          [
            PaymentStatus.FAILED,
            PaymentStatus.CANCELLED,
            PaymentStatus.EXPIRED,
          ].includes(payment.status as never))
      ) {
        if (byKey)
          fail(
            409,
            "PAYMENT_RETRY_KEY_REQUIRED",
            "Use a new payment attempt to retry checkout",
          );
        await releasePaymentWalletHolds(tx, payment.id, driverUserId);
        await tx.paymentAttempt.updateMany({
          where: {
            paymentId: payment.id,
            status: {
              in: [PaymentStatus.CREATED, PaymentStatus.SESSION_CREATED],
            },
          },
          data: { status: PaymentStatus.EXPIRED, completedAt: now },
        });
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            idempotencyKey,
            status: PaymentStatus.CREATED,
            provider: "PENDING_FUNDING",
            providerReference: null,
            merchantTransactionId: null,
            gatewaySessionKey: null,
            checkoutUrl: null,
            sessionExpiresAt: null,
            validationId: null,
            bankTransactionId: null,
            gatewayStatus: null,
            failedAt: null,
            cancelledAt: null,
            expiredAt: null,
            initiatedAt: now,
          },
        });
        resetForRetry = true;
      }
      if (payment?.status === PaymentStatus.CREATED && !resetForRetry) {
        fail(
          409,
          "PAYMENT_ATTEMPT_IN_PROGRESS",
          "This payment attempt is still being prepared",
        );
      }
      payment ??= await tx.payment.create({
        data: {
          bookingId,
          payerUserId: driverUserId,
          amountPaisa: booking.totalAmountPaisa,
          grossAmountPaisa: booking.totalAmountPaisa,
          status: PaymentStatus.CREATED,
          provider: "PENDING_FUNDING",
          environment: env.SSLCOMMERZ_ENVIRONMENT.toUpperCase(),
          idempotencyKey,
          initiatedAt: now,
        },
      });
      const funding = useWallet
        ? await reserveDriverWallet(tx, {
            bookingId,
            paymentId: payment.id,
            userId: driverUserId,
            grossAmountPaisa: booking.totalAmountPaisa,
            idempotencyKey,
            expiresAt: walletHoldExpiresAt,
          })
        : (await releasePaymentWalletHolds(tx, payment.id, driverUserId),
          {
            walletAppliedPaisa: 0n,
            gatewayAmountPaisa: booking.totalAmountPaisa,
            walletHoldId: null,
          });
      payment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          amountPaisa: funding.gatewayAmountPaisa,
          grossAmountPaisa: booking.totalAmountPaisa,
          walletAppliedPaisa: funding.walletAppliedPaisa,
          provider:
            funding.gatewayAmountPaisa === 0n
              ? "INTERNAL_WALLET"
              : "SSLCOMMERZ",
        },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          driverWalletAppliedPaisa: funding.walletAppliedPaisa,
          gatewayAmountPaisa: funding.gatewayAmountPaisa,
        },
      });
      if (funding.gatewayAmountPaisa === 0n) {
        return {
          existing: false as const,
          walletOnly: true as const,
          payment,
          booking,
        };
      }
      if (!env.SSLCOMMERZ_ENABLED)
        fail(
          503,
          "PAYMENT_GATEWAY_NOT_CONFIGURED",
          "Online payment is not configured",
        );
      const attemptNumber =
        (await tx.paymentAttempt.count({ where: { paymentId: payment.id } })) +
        1;
      const merchantTransactionId = transactionId();
      const attempt = await tx.paymentAttempt.create({
        data: { paymentId: payment.id, attemptNumber, merchantTransactionId },
      });
      payment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CREATED,
          merchantTransactionId,
          gatewaySessionKey: null,
          checkoutUrl: null,
          sessionExpiresAt: null,
          failedAt: null,
          cancelledAt: null,
        },
      });
      return {
        existing: false as const,
        walletOnly: false as const,
        payment,
        booking,
        attempt,
      };
    },
    { isolationLevel: "Serializable" },
  );

  if (prepared.existing) {
    return serialize({
      paymentId: prepared.payment.id,
      status: prepared.payment.status,
      gateway: "SSLCOMMERZ",
      walletAppliedPaisa: prepared.payment.walletAppliedPaisa,
      gatewayAmountPaisa: prepared.payment.amountPaisa,
      checkoutUrl: prepared.payment.checkoutUrl,
      expiresAt: prepared.payment.sessionExpiresAt,
    });
  }

  if (prepared.walletOnly) {
    try {
      const payment = await captureWalletOnlyPayment(
        prepared.payment.id,
        bookingId,
      );
      notifyUser(driverUserId, "booking:confirmed", { bookingId });
      notifyUser(prepared.booking.providerUserId, "booking:confirmed", {
        bookingId,
      });
      notifyUser(driverUserId, "wallet:balance_changed", { bookingId });
      return serialize({
        paymentId: payment.id,
        status: payment.status,
        gateway: "INTERNAL_WALLET",
        walletAppliedPaisa: payment.walletAppliedPaisa,
        gatewayAmountPaisa: 0n,
        checkoutUrl: null,
        expiresAt: null,
      });
    } catch (error) {
      await prisma
        .$transaction(async (tx) => {
          await lockEntity(tx, "booking", bookingId);
          await lockEntity(tx, "payment", prepared.payment.id);
          const current = await tx.payment.findUnique({
            where: { id: prepared.payment.id },
          });
          if (
            !current ||
            current.status !== PaymentStatus.CREATED ||
            current.provider !== "INTERNAL_WALLET" ||
            current.idempotencyKey !== prepared.payment.idempotencyKey
          )
            return;
          await releasePaymentWalletHolds(
            tx,
            prepared.payment.id,
            driverUserId,
          );
          await tx.payment.update({
            where: { id: prepared.payment.id },
            data: { status: PaymentStatus.FAILED, failedAt: new Date() },
          });
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              driverWalletAppliedPaisa: 0n,
              gatewayAmountPaisa: prepared.booking.totalAmountPaisa,
            },
          });
        })
        .catch(() => undefined);
      throw error;
    }
  }

  try {
    const gateway = await createSession({
      transactionId: prepared.payment.merchantTransactionId!,
      amountPaisa: prepared.payment.amountPaisa,
      customer: {
        name: prepared.booking.driver.fullName,
        email: prepared.booking.driver.email,
        phone: prepared.booking.driver.phone,
      },
      productName: `Parking at ${prepared.booking.property.name}`.slice(0, 255),
    });
    const expiresAt = new Date(Date.now() + PAYMENT_SESSION_TTL_MS);
    const payment = await prisma.$transaction(async (tx) => {
      const current = await lockPendingPaymentAttempt(
        tx,
        {
          paymentId: prepared.payment.id,
          bookingId,
          merchantTransactionId: prepared.payment.merchantTransactionId!,
        },
        [PaymentStatus.CREATED],
      );
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (
        !current ||
        booking?.status !== BookingStatus.PAYMENT_PENDING ||
        booking.startAt <= new Date()
      )
        fail(
          409,
          "PAYMENT_ATTEMPT_SUPERSEDED",
          "This checkout attempt is no longer active",
        );
      await tx.paymentAttempt.update({
        where: { id: prepared.attempt.id },
        data: {
          sessionKey: gateway.sessionKey,
          status: PaymentStatus.SESSION_CREATED,
        },
      });
      return tx.payment.update({
        where: { id: prepared.payment.id },
        data: {
          status: PaymentStatus.SESSION_CREATED,
          gatewaySessionKey: gateway.sessionKey,
          checkoutUrl: gateway.checkoutUrl,
          sessionExpiresAt: expiresAt,
        },
      });
    });
    return serialize({
      paymentId: payment.id,
      status: payment.status,
      gateway: "SSLCOMMERZ",
      walletAppliedPaisa: payment.walletAppliedPaisa,
      gatewayAmountPaisa: payment.amountPaisa,
      checkoutUrl: gateway.checkoutUrl,
      expiresAt,
    });
  } catch (error) {
    await prisma
      .$transaction(async (tx) => {
        const current = await lockPendingPaymentAttempt(
          tx,
          {
            paymentId: prepared.payment.id,
            bookingId,
            merchantTransactionId: prepared.payment.merchantTransactionId!,
          },
          [PaymentStatus.CREATED],
        );
        if (!current) return;
        await releasePaymentWalletHolds(tx, prepared.payment.id, driverUserId);
        await tx.paymentAttempt.update({
          where: { id: prepared.attempt.id },
          data: { status: PaymentStatus.FAILED, completedAt: new Date() },
        });
        await tx.payment.update({
          where: { id: prepared.payment.id },
          data: { status: PaymentStatus.FAILED, failedAt: new Date() },
        });
      })
      .catch(() => undefined);
    throw error;
  }
}

export async function initiateSettlementSession(
  driverUserId: string,
  bookingId: string,
  idempotencyKey: string,
) {
  const prepared = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", bookingId);
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, driverUserId },
        include: {
          settlement: true,
          driver: { select: { fullName: true, email: true, phone: true } },
          property: { select: { name: true } },
        },
      });
      if (!booking?.settlement)
        fail(
          404,
          "BOOKING_SETTLEMENT_NOT_FOUND",
          "Booking settlement was not found",
        );
      if (
        booking.status !== BookingStatus.PAYMENT_DUE ||
        booking.settlement.status !== "PAYMENT_DUE" ||
        booking.settlement.outstandingPaisa <= 0n
      ) {
        fail(
          409,
          "SETTLEMENT_PAYMENT_NOT_DUE",
          "This booking has no outstanding settlement payment",
        );
      }
      const byKey = await tx.payment.findUnique({ where: { idempotencyKey } });
      if (
        byKey &&
        (byKey.bookingId !== bookingId ||
          byKey.payerUserId !== driverUserId ||
          byKey.purpose !== PaymentPurpose.SETTLEMENT)
      ) {
        fail(
          409,
          "IDEMPOTENCY_KEY_REUSED",
          "Idempotency key belongs to another payment",
        );
      }
      let payment =
        byKey ??
        (await tx.payment.findFirst({
          where: { bookingId, purpose: PaymentPurpose.SETTLEMENT },
        }));
      const now = new Date();
      if (
        payment?.status === PaymentStatus.SESSION_CREATED &&
        payment.checkoutUrl &&
        payment.sessionExpiresAt &&
        payment.sessionExpiresAt > now
      ) {
        return { existing: true as const, payment, booking };
      }
      if (
        payment &&
        [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED].includes(
          payment.status as never,
        )
      ) {
        fail(
          409,
          "SETTLEMENT_ALREADY_PAID",
          "The outstanding settlement is already paid",
        );
      }
      const abandonedAttempt =
        payment?.status === PaymentStatus.SESSION_CREATED ||
        (payment?.status === PaymentStatus.CREATED &&
          payment.initiatedAt &&
          payment.initiatedAt.getTime() + PAYMENT_SESSION_TTL_MS <=
            now.getTime());
      let resetForRetry = false;
      if (
        payment &&
        (abandonedAttempt ||
          [
            PaymentStatus.FAILED,
            PaymentStatus.CANCELLED,
            PaymentStatus.EXPIRED,
          ].includes(payment.status as never))
      ) {
        if (byKey)
          fail(
            409,
            "PAYMENT_RETRY_KEY_REQUIRED",
            "Use a new payment attempt to retry settlement",
          );
        await releasePaymentWalletHolds(tx, payment.id, driverUserId);
        await tx.paymentAttempt.updateMany({
          where: {
            paymentId: payment.id,
            status: {
              in: [PaymentStatus.CREATED, PaymentStatus.SESSION_CREATED],
            },
          },
          data: { status: PaymentStatus.EXPIRED, completedAt: now },
        });
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            idempotencyKey,
            status: PaymentStatus.CREATED,
            provider: "PENDING_FUNDING",
            providerReference: null,
            merchantTransactionId: null,
            gatewaySessionKey: null,
            checkoutUrl: null,
            sessionExpiresAt: null,
            validationId: null,
            bankTransactionId: null,
            gatewayStatus: null,
            failedAt: null,
            cancelledAt: null,
            expiredAt: null,
            initiatedAt: now,
          },
        });
        resetForRetry = true;
      }
      if (payment?.status === PaymentStatus.CREATED && !resetForRetry) {
        fail(
          409,
          "PAYMENT_ATTEMPT_IN_PROGRESS",
          "This settlement payment attempt is still being prepared",
        );
      }
      payment ??= await tx.payment.create({
        data: {
          bookingId,
          payerUserId: driverUserId,
          purpose: PaymentPurpose.SETTLEMENT,
          amountPaisa: booking.settlement.outstandingPaisa,
          grossAmountPaisa: booking.settlement.outstandingPaisa,
          status: PaymentStatus.CREATED,
          provider: "PENDING_FUNDING",
          environment: env.SSLCOMMERZ_ENVIRONMENT.toUpperCase(),
          idempotencyKey,
          initiatedAt: now,
        },
      });
      const funding = await reserveDriverWallet(tx, {
        bookingId,
        paymentId: payment.id,
        userId: driverUserId,
        grossAmountPaisa: booking.settlement.outstandingPaisa,
        idempotencyKey,
        expiresAt: new Date(Date.now() + PAYMENT_SESSION_TTL_MS),
      });
      payment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          amountPaisa: funding.gatewayAmountPaisa,
          grossAmountPaisa: booking.settlement.outstandingPaisa,
          walletAppliedPaisa: funding.walletAppliedPaisa,
          provider:
            funding.gatewayAmountPaisa === 0n
              ? "INTERNAL_WALLET"
              : "SSLCOMMERZ",
        },
      });
      if (funding.gatewayAmountPaisa === 0n)
        return {
          existing: false as const,
          walletOnly: true as const,
          payment,
          booking,
        };
      if (!env.SSLCOMMERZ_ENABLED)
        fail(
          503,
          "PAYMENT_GATEWAY_NOT_CONFIGURED",
          "Online payment is not configured",
        );
      const attemptNumber =
        (await tx.paymentAttempt.count({ where: { paymentId: payment.id } })) +
        1;
      const merchantTransactionId = transactionId("PES");
      const attempt = await tx.paymentAttempt.create({
        data: { paymentId: payment.id, attemptNumber, merchantTransactionId },
      });
      payment = await tx.payment.update({
        where: { id: payment.id },
        data: { merchantTransactionId, status: PaymentStatus.CREATED },
      });
      return {
        existing: false as const,
        walletOnly: false as const,
        payment,
        booking,
        attempt,
      };
    },
    { isolationLevel: "Serializable" },
  );

  if (prepared.existing)
    return serialize({
      paymentId: prepared.payment.id,
      status: prepared.payment.status,
      gateway: "SSLCOMMERZ",
      walletAppliedPaisa: prepared.payment.walletAppliedPaisa,
      gatewayAmountPaisa: prepared.payment.amountPaisa,
      checkoutUrl: prepared.payment.checkoutUrl,
      expiresAt: prepared.payment.sessionExpiresAt,
    });
  if (prepared.walletOnly) {
    const payment = await finalizeSettlementPayment(
      prepared.payment.id,
      bookingId,
    );
    return serialize({
      paymentId: payment.id,
      status: payment.status,
      gateway: "INTERNAL_WALLET",
      walletAppliedPaisa: payment.walletAppliedPaisa,
      gatewayAmountPaisa: 0n,
      checkoutUrl: null,
      expiresAt: null,
    });
  }
  try {
    const gateway = await createSession({
      transactionId: prepared.payment.merchantTransactionId!,
      amountPaisa: prepared.payment.amountPaisa,
      customer: {
        name: prepared.booking.driver.fullName,
        email: prepared.booking.driver.email,
        phone: prepared.booking.driver.phone,
      },
      productName:
        `Overtime settlement at ${prepared.booking.property.name}`.slice(
          0,
          255,
        ),
    });
    const expiresAt = new Date(Date.now() + PAYMENT_SESSION_TTL_MS);
    const payment = await prisma.$transaction(async (tx) => {
      const current = await lockPendingPaymentAttempt(
        tx,
        {
          paymentId: prepared.payment.id,
          bookingId,
          merchantTransactionId: prepared.payment.merchantTransactionId!,
        },
        [PaymentStatus.CREATED],
      );
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!current || booking?.status !== BookingStatus.PAYMENT_DUE)
        fail(
          409,
          "PAYMENT_ATTEMPT_SUPERSEDED",
          "This settlement checkout attempt is no longer active",
        );
      await tx.paymentAttempt.update({
        where: { id: prepared.attempt.id },
        data: {
          sessionKey: gateway.sessionKey,
          status: PaymentStatus.SESSION_CREATED,
        },
      });
      return tx.payment.update({
        where: { id: prepared.payment.id },
        data: {
          status: PaymentStatus.SESSION_CREATED,
          gatewaySessionKey: gateway.sessionKey,
          checkoutUrl: gateway.checkoutUrl,
          sessionExpiresAt: expiresAt,
        },
      });
    });
    return serialize({
      paymentId: payment.id,
      status: payment.status,
      gateway: "SSLCOMMERZ",
      walletAppliedPaisa: payment.walletAppliedPaisa,
      gatewayAmountPaisa: payment.amountPaisa,
      checkoutUrl: gateway.checkoutUrl,
      expiresAt,
    });
  } catch (error) {
    await prisma
      .$transaction(async (tx) => {
        const current = await lockPendingPaymentAttempt(
          tx,
          {
            paymentId: prepared.payment.id,
            bookingId,
            merchantTransactionId: prepared.payment.merchantTransactionId!,
          },
          [PaymentStatus.CREATED],
        );
        if (!current) return;
        await releasePaymentWalletHolds(tx, prepared.payment.id, driverUserId);
        await tx.paymentAttempt.update({
          where: { id: prepared.attempt.id },
          data: { status: PaymentStatus.FAILED, completedAt: new Date() },
        });
        await tx.payment.update({
          where: { id: prepared.payment.id },
          data: { status: PaymentStatus.FAILED, failedAt: new Date() },
        });
      })
      .catch(() => undefined);
    throw error;
  }
}

async function captureWalletOnlyPayment(paymentId: string, bookingId: string) {
  const result = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", bookingId);
      await lockEntity(tx, "payment", paymentId);
      const current = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true },
      });
      if (!current) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
      if (current.status === PaymentStatus.SUCCEEDED)
        return tx.payment.findUniqueOrThrow({
          where: { id: paymentId },
          select: paymentView,
        });
      if (
        current.amountPaisa !== 0n ||
        current.provider !== "INTERNAL_WALLET"
      ) {
        fail(
          409,
          "PAYMENT_GATEWAY_REQUIRED",
          "This payment requires gateway validation",
        );
      }
      const now = new Date();
      if (
        current.booking.id !== bookingId ||
        current.status !== PaymentStatus.CREATED ||
        current.booking.status !== BookingStatus.PAYMENT_PENDING ||
        current.booking.startAt <= now
      )
        fail(
          409,
          "BOOKING_PAYMENT_WINDOW_CLOSED",
          "This booking is no longer awaiting payment before its start time",
        );
      const credentialId = randomUUID();
      const rawCredential = `parkease-access:${credentialId}`;
      const funding = await postSuccessfulBookingPayment(tx, {
        paymentId: current.id,
        bookingId: current.booking.id,
        actorUserId: current.payerUserId,
        propertyId: current.booking.propertyId,
        bookingCode: current.booking.bookingCode,
        grossAmountPaisa: current.grossAmountPaisa,
        gatewayAmountPaisa: 0n,
      });
      await tx.booking.update({
        where: { id: current.booking.id },
        data: { status: BookingStatus.CONFIRMED, confirmedAt: now },
      });
      await tx.accessCredential.create({
        data: {
          id: credentialId,
          bookingId: current.booking.id,
          tokenHash: createHash("sha256").update(rawCredential).digest("hex"),
          expiresAt: new Date(
            current.booking.effectiveEndAt.getTime() + 24 * 60 * 60 * 1000,
          ),
        },
      });
      await tx.notification.createMany({
        data: [
          {
            userId: current.payerUserId,
            type: "PAYMENT_SUCCEEDED",
            title: "Payment successful",
            message: `Refund Balance paid booking ${current.booking.bookingCode}.`,
            entityType: "Payment",
            entityId: current.id,
            idempotencyKey: `payment-success:${current.id}:driver`,
          },
          {
            userId: current.booking.providerUserId,
            type: "BOOKING_CONFIRMED",
            title: "New confirmed booking",
            message: `Booking ${current.booking.bookingCode} is confirmed.`,
            entityType: "Booking",
            entityId: current.booking.id,
            idempotencyKey: `booking-confirmed:${current.booking.id}:provider`,
          },
        ],
        skipDuplicates: true,
      });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.PAYMENT_SUCCEEDED,
        actorUserId: current.payerUserId,
        propertyId: current.booking.propertyId,
        entityType: "Payment",
        entityId: current.id,
        metadata: {
          ledgerTransactionId: funding.ledgerTransactionId,
          gateway: "INTERNAL_WALLET",
        },
      });
      return tx.payment.update({
        where: { id: current.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          gatewayStatus: "WALLET_ONLY",
          succeededAt: now,
          capturedAt: now,
        },
        select: paymentView,
      });
    },
    { isolationLevel: "Serializable" },
  );
  const participants = await prisma.booking.findUnique({
    where: { id: result.bookingId },
    select: { driverUserId: true, providerUserId: true },
  });
  if (participants) {
    notifyUser(participants.driverUserId, "booking:confirmed", {
      bookingId: result.bookingId,
    });
    notifyUser(participants.providerUserId, "booking:confirmed", {
      bookingId: result.bookingId,
    });
    notifyUser(participants.driverUserId, "wallet:balance_changed", {
      bookingId: result.bookingId,
    });
  }
  return result;
}

async function finalizeSettlementPayment(
  paymentId: string,
  bookingId: string,
  gateway?: {
    merchantTransactionId: string;
    amountPaisa: bigint;
    currency: string;
    validationId: string;
    bankTransactionId?: string;
    status: string;
    cardType?: string;
    cardBrand?: string;
    issuer?: string;
    riskLevel?: number;
    riskTitle?: string;
  },
) {
  const result = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", bookingId);
      await lockEntity(tx, "payment", paymentId);
      const current = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { booking: { include: { settlement: true } } },
      });
      if (!current?.booking.settlement)
        fail(
          404,
          "BOOKING_SETTLEMENT_NOT_FOUND",
          "Booking settlement was not found",
        );
      if (current.bookingId !== bookingId)
        fail(409, "PAYMENT_IDENTITY_MISMATCH", "Payment booking did not match");
      if (gateway) assertGatewayPaymentIdentity(current, gateway);
      else if (
        current.provider !== "INTERNAL_WALLET" ||
        current.amountPaisa !== 0n ||
        ![PaymentStatus.CREATED, PaymentStatus.SUCCEEDED].includes(
          current.status as never,
        )
      )
        fail(
          409,
          "PAYMENT_GATEWAY_REQUIRED",
          "This payment requires gateway validation",
        );
      if (current.status === PaymentStatus.SUCCEEDED)
        return {
          payment: await tx.payment.findUniqueOrThrow({
            where: { id: current.id },
            select: paymentView,
          }),
          booking: current.booking,
        };
      const settlement = current.booking.settlement;
      if (
        current.purpose !== PaymentPurpose.SETTLEMENT ||
        current.booking.status !== BookingStatus.PAYMENT_DUE ||
        settlement.status !== "PAYMENT_DUE"
      ) {
        fail(
          409,
          "SETTLEMENT_PAYMENT_NOT_DUE",
          "This booking is not awaiting settlement payment",
        );
      }
      if (current.grossAmountPaisa !== settlement.outstandingPaisa)
        fail(
          409,
          "SETTLEMENT_AMOUNT_CHANGED",
          "The outstanding settlement amount changed",
        );
      const funding = await postSuccessfulSettlementFunding(tx, {
        paymentId: current.id,
        bookingId: current.booking.id,
        actorUserId: current.payerUserId,
        propertyId: current.booking.propertyId,
        bookingCode: current.booking.bookingCode,
        grossAmountPaisa: current.grossAmountPaisa,
        gatewayAmountPaisa: current.amountPaisa,
      });
      const driverWallet = await getOrCreateWallet(
        tx,
        current.booking.driverUserId,
      );
      await lockEntity(tx, "wallet", driverWallet.id);
      const providerNetPaisa =
        settlement.baseChargePaisa + settlement.overtimeChargePaisa;
      const heldTotalPaisa =
        current.booking.totalAmountPaisa +
        settlement.overtimeChargePaisa -
        settlement.depositUsedPaisa;
      const settlementEntries = [
        {
          accountCode: "BOOKING_HELD_FUNDS",
          entrySide: "DEBIT" as const,
          amountPaisa: heldTotalPaisa,
        },
        ...(providerNetPaisa > 0n
          ? [
              {
                accountCode: "PROVIDER_PAYABLE",
                walletAccountId: current.booking.settlementWalletAccountId,
                entrySide: "CREDIT" as const,
                amountPaisa: providerNetPaisa,
              },
            ]
          : []),
        ...(settlement.platformFeePaisa > 0n
          ? [
              {
                accountCode: "PLATFORM_REVENUE",
                entrySide: "CREDIT" as const,
                amountPaisa: settlement.platformFeePaisa,
              },
            ]
          : []),
        ...(settlement.depositReturnedPaisa > 0n
          ? [
              {
                accountCode: "DRIVER_REFUND_LIABILITY",
                walletAccountId: driverWallet.id,
                entrySide: "CREDIT" as const,
                amountPaisa: settlement.depositReturnedPaisa,
              },
            ]
          : []),
      ];
      const settlementDebits = settlementEntries
        .filter((entry) => entry.entrySide === "DEBIT")
        .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
      const settlementCredits = settlementEntries
        .filter((entry) => entry.entrySide === "CREDIT")
        .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
      if (settlementDebits !== settlementCredits)
        fail(
          500,
          "LEDGER_UNBALANCED",
          "Final settlement ledger is not balanced",
        );
      await tx.ledgerTransaction.create({
        data: {
          referenceType: "BOOKING_SETTLEMENT",
          referenceId: settlement.id,
          description: `Final settlement for booking ${current.booking.bookingCode}`,
          actorUserId: current.payerUserId,
          entries: {
            create: settlementEntries.filter((e) => e.amountPaisa > 0n),
          },
        },
      });
      await creditProviderEarnings(
        tx,
        current.bookingId,
        current.booking.settlementWalletAccountId,
        providerNetPaisa,
      );
      if (settlement.depositReturnedPaisa > 0n)
        await tx.walletAccount.update({
          where: { id: driverWallet.id },
          data: {
            availableBalancePaisa: {
              increment: settlement.depositReturnedPaisa,
            },
            balanceVersion: { increment: 1 },
          },
        });
      const now = new Date();
      await tx.bookingSettlement.update({
        where: { id: settlement.id },
        data: {
          driverWalletChargedPaisa: { increment: funding.walletAppliedPaisa },
          outstandingPaisa: 0n,
          providerGrossPaisa: providerNetPaisa,
          providerNetPaisa,
          driverRefundCreditPaisa: settlement.depositReturnedPaisa,
          status: "COMPLETED",
          completedAt: now,
        },
      });
      await tx.booking.update({
        where: { id: current.booking.id },
        data: { status: BookingStatus.COMPLETED, financialStatus: "SETTLED" },
      });
      const payment = await tx.payment.update({
        where: { id: current.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          ...(gateway
            ? {
                validationId: gateway.validationId,
                providerReference:
                  gateway.bankTransactionId || gateway.validationId,
              }
            : {}),
          ...(gateway?.bankTransactionId
            ? { bankTransactionId: gateway.bankTransactionId }
            : {}),
          gatewayStatus: gateway?.status ?? "WALLET_ONLY",
          ...(gateway?.cardType === undefined
            ? {}
            : { cardType: gateway.cardType }),
          ...(gateway?.cardBrand === undefined
            ? {}
            : { cardBrand: gateway.cardBrand }),
          ...(gateway?.issuer === undefined ? {} : { issuer: gateway.issuer }),
          ...(gateway?.riskLevel === undefined
            ? {}
            : { riskLevel: gateway.riskLevel }),
          ...(gateway?.riskTitle === undefined
            ? {}
            : { riskTitle: gateway.riskTitle }),
          succeededAt: now,
          capturedAt: now,
          checkoutUrl: null,
        },
        select: paymentView,
      });
      await tx.paymentAttempt.updateMany({
        where: { paymentId: current.id },
        data: { status: PaymentStatus.SUCCEEDED, completedAt: now },
      });
      await tx.notification.createMany({
        data: [
          {
            userId: current.booking.driverUserId,
            type: "PAYMENT_SUCCEEDED",
            title: "Parking settled",
            message: `Final payment for booking ${current.booking.bookingCode} is complete.`,
            entityType: "Booking",
            entityId: current.booking.id,
            idempotencyKey: `booking-settled:${current.booking.id}:driver`,
          },
          {
            userId: current.booking.providerUserId,
            type: "PAYMENT_SUCCEEDED",
            title: "Earnings available",
            message: `Booking ${current.booking.bookingCode} has been settled.`,
            entityType: "Booking",
            entityId: current.booking.id,
            idempotencyKey: `booking-settled:${current.booking.id}:provider`,
          },
        ],
        skipDuplicates: true,
      });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.BOOKING_SETTLED,
        actorUserId: current.payerUserId,
        propertyId: current.booking.propertyId,
        entityType: "BookingSettlement",
        entityId: settlement.id,
        metadata: {
          paymentId: current.id,
          ledgerTransactionId: funding.ledgerTransactionId,
        },
      });
      return { payment, booking: current.booking };
    },
    { isolationLevel: "Serializable" },
  );
  notifyUser(result.booking.driverUserId, "booking:settlement_completed", {
    bookingId: result.booking.id,
  });
  notifyUser(result.booking.providerUserId, "booking:settlement_completed", {
    bookingId: result.booking.id,
  });
  notifyUser(result.booking.driverUserId, "wallet:balance_changed", {
    bookingId: result.booking.id,
  });
  notifyUser(result.booking.providerUserId, "wallet:balance_changed", {
    bookingId: result.booking.id,
  });
  return result.payment;
}

export async function validateAndCaptureSslCommerz(
  transactionIdValue: string,
  validationId: string,
) {
  const gateway = await validateTransaction(validationId);
  if (gateway.tran_id !== transactionIdValue)
    fail(
      409,
      "PAYMENT_IDENTITY_MISMATCH",
      "Gateway transaction identity did not match",
    );
  const payment = await prisma.payment.findUnique({
    where: { merchantTransactionId: transactionIdValue },
  });
  if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
  if (payment.provider !== "SSLCOMMERZ")
    fail(409, "PAYMENT_GATEWAY_MISMATCH", "Payment gateway did not match");
  if (
    gateway.currency !== payment.currency ||
    gatewayAmountToPaisa(gateway.amount) !== payment.amountPaisa
  ) {
    fail(
      409,
      "PAYMENT_AMOUNT_MISMATCH",
      "Gateway amount or currency did not match the booking",
    );
  }
  if ((gateway.risk_level ?? 0) > 0)
    fail(
      409,
      "PAYMENT_RISK_REVIEW_REQUIRED",
      "Gateway marked this payment for risk review",
    );

  if (payment.purpose === PaymentPurpose.SETTLEMENT) {
    return serialize(
      await finalizeSettlementPayment(payment.id, payment.bookingId, {
        merchantTransactionId: transactionIdValue,
        amountPaisa: gatewayAmountToPaisa(gateway.amount),
        currency: gateway.currency,
        validationId: gateway.val_id,
        ...(gateway.bank_tran_id
          ? { bankTransactionId: gateway.bank_tran_id }
          : {}),
        status: gateway.status,
        ...(gateway.card_type === undefined
          ? {}
          : { cardType: gateway.card_type }),
        ...(gateway.card_brand === undefined
          ? {}
          : { cardBrand: gateway.card_brand }),
        ...(gateway.card_issuer === undefined
          ? {}
          : { issuer: gateway.card_issuer }),
        ...(gateway.risk_level === undefined
          ? {}
          : { riskLevel: gateway.risk_level }),
        ...(gateway.risk_title === undefined
          ? {}
          : { riskTitle: gateway.risk_title }),
      }),
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", payment.bookingId);
      await lockEntity(tx, "payment", payment.id);
      const current = await tx.payment.findUnique({
        where: { id: payment.id },
        include: { booking: true },
      });
      if (!current) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
      assertGatewayPaymentIdentity(current, {
        merchantTransactionId: transactionIdValue,
        amountPaisa: gatewayAmountToPaisa(gateway.amount),
        currency: gateway.currency,
      });
      const completedStatuses: PaymentStatus[] = [
        PaymentStatus.SUCCEEDED,
        PaymentStatus.CAPTURED,
        PaymentStatus.PARTIALLY_REFUNDED,
        PaymentStatus.REFUNDED,
      ];
      if (completedStatuses.includes(current.status)) {
        return serialize(
          await tx.payment.findUniqueOrThrow({
            where: { id: current.id },
            select: paymentView,
          }),
        );
      }
      if (current.booking.status !== BookingStatus.PAYMENT_PENDING)
        fail(
          409,
          "BOOKING_TRANSITION_INVALID",
          "Booking is not awaiting payment",
        );

      const now = new Date();
      const credentialId = randomUUID();
      const rawCredential = `parkease-access:${credentialId}`;
      const funding = await postSuccessfulBookingPayment(tx, {
        paymentId: current.id,
        bookingId: current.booking.id,
        actorUserId: current.payerUserId,
        propertyId: current.booking.propertyId,
        bookingCode: current.booking.bookingCode,
        grossAmountPaisa: current.grossAmountPaisa,
        gatewayAmountPaisa: current.amountPaisa,
      });
      await tx.booking.update({
        where: { id: current.booking.id },
        data: { status: BookingStatus.CONFIRMED, confirmedAt: now },
      });
      await tx.accessCredential.create({
        data: {
          id: credentialId,
          bookingId: current.booking.id,
          tokenHash: createHash("sha256").update(rawCredential).digest("hex"),
          expiresAt: new Date(
            current.booking.effectiveEndAt.getTime() + 24 * 60 * 60 * 1000,
          ),
        },
      });
      await tx.notification.createMany({
        data: [
          {
            userId: current.payerUserId,
            type: "PAYMENT_SUCCEEDED",
            title: "Payment successful",
            message: `Payment for booking ${current.booking.bookingCode} succeeded.`,
            entityType: "Payment",
            entityId: current.id,
            idempotencyKey: `payment-success:${current.id}:driver`,
          },
          {
            userId: current.booking.providerUserId,
            type: "BOOKING_CONFIRMED",
            title: "New confirmed booking",
            message: `Booking ${current.booking.bookingCode} is confirmed.`,
            entityType: "Booking",
            entityId: current.booking.id,
            idempotencyKey: `booking-confirmed:${current.booking.id}:provider`,
          },
        ],
        skipDuplicates: true,
      });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.PAYMENT_SUCCEEDED,
        actorUserId: current.payerUserId,
        propertyId: current.booking.propertyId,
        entityType: "Payment",
        entityId: current.id,
        metadata: {
          ledgerTransactionId: funding.ledgerTransactionId,
          gateway: "SSLCOMMERZ",
        },
      });
      await tx.paymentAttempt.updateMany({
        where: {
          paymentId: current.id,
          merchantTransactionId: transactionIdValue,
        },
        data: { status: PaymentStatus.SUCCEEDED, completedAt: now },
      });
      const updated = await tx.payment.update({
        where: { id: current.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          validationId: gateway.val_id,
          bankTransactionId: gateway.bank_tran_id || null,
          providerReference: gateway.bank_tran_id || gateway.val_id,
          gatewayStatus: gateway.status,
          ...(gateway.card_type === undefined
            ? {}
            : { cardType: gateway.card_type }),
          ...(gateway.card_brand === undefined
            ? {}
            : { cardBrand: gateway.card_brand }),
          ...(gateway.card_issuer === undefined
            ? {}
            : { issuer: gateway.card_issuer }),
          ...(gateway.risk_level === undefined
            ? {}
            : { riskLevel: gateway.risk_level }),
          ...(gateway.risk_title === undefined
            ? {}
            : { riskTitle: gateway.risk_title }),
          succeededAt: now,
          capturedAt: now,
          checkoutUrl: null,
        },
        select: paymentView,
      });
      return serialize(updated);
    },
    { isolationLevel: "Serializable" },
  );
  const participants = await prisma.booking.findUnique({
    where: { id: payment.bookingId },
    select: { driverUserId: true, providerUserId: true },
  });
  if (participants) {
    notifyUser(participants.driverUserId, "booking:confirmed", {
      bookingId: payment.bookingId,
    });
    notifyUser(participants.providerUserId, "booking:confirmed", {
      bookingId: payment.bookingId,
    });
    notifyUser(participants.driverUserId, "wallet:balance_changed", {
      bookingId: payment.bookingId,
    });
  }
  return result;
}

export async function recordGatewayExit(
  transactionIdValue: string,
  status: "FAILED" | "CANCELLED",
) {
  const payment = await prisma.payment.findUnique({
    where: { merchantTransactionId: transactionIdValue },
  });
  if (!payment) return null;
  const finalStatuses: PaymentStatus[] = [
    PaymentStatus.SUCCEEDED,
    PaymentStatus.CAPTURED,
    PaymentStatus.REFUND_PENDING,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ];
  if (finalStatuses.includes(payment.status)) return payment.id;
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const current = await lockPendingPaymentAttempt(tx, {
      paymentId: payment.id,
      bookingId: payment.bookingId,
      merchantTransactionId: transactionIdValue,
    });
    if (!current) return;
    await releasePaymentWalletHolds(tx, payment.id, payment.payerUserId);
    await tx.payment.update({
      where: { id: payment.id },
      data:
        status === "FAILED"
          ? { status: PaymentStatus.FAILED, failedAt: now, checkoutUrl: null }
          : {
              status: PaymentStatus.CANCELLED,
              cancelledAt: now,
              checkoutUrl: null,
            },
    });
    await tx.paymentAttempt.updateMany({
      where: {
        paymentId: payment.id,
        merchantTransactionId: transactionIdValue,
      },
      data: {
        status:
          status === "FAILED" ? PaymentStatus.FAILED : PaymentStatus.CANCELLED,
        completedAt: now,
      },
    });
    const booking = await tx.booking.findUnique({
      where: { id: payment.bookingId },
      select: { propertyId: true },
    });
    if (booking)
      await createDomainAuditEvent(tx, {
        eventType:
          status === "FAILED"
            ? DomainAuditEventType.PAYMENT_FAILED
            : DomainAuditEventType.PAYMENT_CANCELLED,
        actorUserId: payment.payerUserId,
        propertyId: booking.propertyId,
        entityType: "Payment",
        entityId: payment.id,
      });
  });
  return payment.id;
}

export async function findPaymentIdByTransaction(transactionIdValue: string) {
  return (
    (
      await prisma.payment.findUnique({
        where: { merchantTransactionId: transactionIdValue },
        select: { id: true },
      })
    )?.id ?? null
  );
}

export async function getDriverPayment(
  driverUserId: string,
  paymentId: string,
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, payerUserId: driverUserId },
    select: paymentView,
  });
  if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
  return serialize(payment);
}

export async function previewDriverRefund(
  driverUserId: string,
  paymentId: string,
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, payerUserId: driverUserId },
    include: {
      booking: true,
      refunds: {
        where: { status: { in: ["PENDING", "PROCESSING", "SUCCEEDED"] } },
      },
    },
  });
  if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
  const refundableStatuses: PaymentStatus[] = [
    PaymentStatus.SUCCEEDED,
    PaymentStatus.CAPTURED,
    PaymentStatus.PARTIALLY_REFUNDED,
  ];
  if (!refundableStatuses.includes(payment.status)) {
    fail(409, "PAYMENT_NOT_REFUNDABLE", "Payment is not refundable");
  }
  const cutoff = new Date(
    payment.booking.startAt.getTime() - 2 * 60 * 60 * 1000,
  );
  const eligible = new Date() <= cutoff;
  const reserved = payment.refunds.reduce(
    (sum, refund) => sum + refund.amountPaisa,
    0n,
  );
  const refundableAmountPaisa = eligible ? payment.amountPaisa - reserved : 0n;
  return serialize({
    eligible: eligible && refundableAmountPaisa > 0n,
    refundableAmountPaisa,
    policyReason: eligible
      ? "Full refund is available until 2 hours before the booking starts."
      : "The self-service refund window closes 2 hours before the booking starts.",
    cutoffAt: cutoff,
  });
}

async function postSuccessfulRefund(refundId: string) {
  return prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "refund", refundId);
      const refund = await tx.refund.findUnique({
        where: { id: refundId },
        include: {
          payment: {
            include: {
              booking: true,
              refunds: { where: { status: "SUCCEEDED" } },
            },
          },
        },
      });
      if (!refund) fail(404, "REFUND_NOT_FOUND", "Refund was not found");
      if (refund.status === "SUCCEEDED") return refund;
      const payment = refund.payment;
      const providerComponent =
        (refund.amountPaisa * payment.booking.baseAmountPaisa) /
        payment.amountPaisa;
      const nonProviderComponent = refund.amountPaisa - providerComponent;
      const wallet = await tx.walletAccount.findUnique({
        where: { id: payment.booking.settlementWalletAccountId },
      });
      if (!wallet)
        fail(
          409,
          "SETTLEMENT_WALLET_UNAVAILABLE",
          "Settlement wallet is unavailable",
        );
      const fromPending =
        wallet.pendingBalancePaisa < providerComponent
          ? wallet.pendingBalancePaisa
          : providerComponent;
      const fromAvailable = providerComponent - fromPending;
      if (fromAvailable > wallet.availableBalancePaisa)
        fail(
          409,
          "REFUND_BALANCE_UNAVAILABLE",
          "Provider balance is insufficient for this refund",
        );
      await tx.ledgerTransaction.create({
        data: {
          referenceType: "PAYMENT_REFUND",
          referenceId: refund.id,
          description: `Refund for booking ${payment.booking.bookingCode}`,
          actorUserId: refund.requestedByUserId,
          entries: {
            create: [
              ...(providerComponent > 0n
                ? [
                    {
                      accountCode: "PROVIDER_PAYABLE",
                      walletAccountId: wallet.id,
                      entrySide: "DEBIT" as const,
                      amountPaisa: providerComponent,
                    },
                  ]
                : []),
              ...(nonProviderComponent > 0n
                ? [
                    {
                      accountCode: "PLATFORM_REFUND",
                      entrySide: "DEBIT" as const,
                      amountPaisa: nonProviderComponent,
                    },
                  ]
                : []),
              {
                accountCode: "EXTERNAL_PAYMENT_CLEARING",
                entrySide: "CREDIT",
                amountPaisa: refund.amountPaisa,
              },
            ],
          },
        },
      });
      if (providerComponent > 0n)
        await tx.walletAccount.update({
          where: { id: wallet.id },
          data: {
            pendingBalancePaisa: { decrement: fromPending },
            availableBalancePaisa: { decrement: fromAvailable },
            balanceVersion: { increment: 1 },
          },
        });
      const totalRefunded = payment.refundedAmountPaisa + refund.amountPaisa;
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmountPaisa: totalRefunded,
          status:
            totalRefunded >= payment.amountPaisa
              ? PaymentStatus.REFUNDED
              : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });
      const updated = await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: "SUCCEEDED",
          gatewayStatus: "REFUNDED",
          processedAt: new Date(),
        },
      });
      await tx.notification.upsert({
        where: {
          userId_idempotencyKey: {
            userId: payment.payerUserId,
            idempotencyKey: `refund:${refund.id}:payer`,
          },
        },
        update: {},
        create: {
          userId: payment.payerUserId,
          type: "REFUND_PROCESSED",
          title: "Refund processed",
          message: `Refund for booking ${payment.booking.bookingCode} was processed.`,
          entityType: "Refund",
          entityId: refund.id,
          idempotencyKey: `refund:${refund.id}:payer`,
        },
      });
      await createDomainAuditEvent(tx, {
        eventType: DomainAuditEventType.REFUND_CREATED,
        actorUserId: refund.requestedByUserId,
        propertyId: payment.booking.propertyId,
        entityType: "Refund",
        entityId: refund.id,
      });
      return updated;
    },
    { isolationLevel: "Serializable" },
  );
}

export async function requestDriverRefund(
  driverUserId: string,
  paymentId: string,
  input: { reason: string; idempotencyKey: string },
) {
  const previous = await prisma.refund.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (previous) {
    if (
      previous.requestedByUserId !== driverUserId ||
      previous.paymentId !== paymentId
    )
      fail(
        409,
        "IDEMPOTENCY_KEY_REUSED",
        "Idempotency key belongs to another refund",
      );
    return serialize(previous);
  }
  const preview = await previewDriverRefund(driverUserId, paymentId);
  if (!preview.eligible || BigInt(preview.refundableAmountPaisa) <= 0n)
    fail(409, "REFUND_POLICY_NOT_ELIGIBLE", preview.policyReason);
  const amountPaisa = BigInt(preview.refundableAmountPaisa);
  const refundTransactionId = transactionId("RF");
  const refund = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "payment", paymentId);
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, payerUserId: driverUserId },
      });
      if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
      const reserved = await tx.refund.aggregate({
        where: {
          paymentId,
          status: { in: ["PENDING", "PROCESSING", "SUCCEEDED"] },
        },
        _sum: { amountPaisa: true },
      });
      if (amountPaisa > payment.amountPaisa - (reserved._sum.amountPaisa ?? 0n))
        fail(
          409,
          "REFUND_AMOUNT_EXCEEDED",
          "Refund exceeds the remaining refundable amount",
        );
      return tx.refund.create({
        data: {
          paymentId,
          requestedByUserId: driverUserId,
          amountPaisa,
          reason: input.reason,
          policyReason: preview.policyReason,
          idempotencyKey: input.idempotencyKey,
          gatewayRefundTransactionId: refundTransactionId,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );

  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
  });
  if (payment.provider === "SIMULATED")
    return serialize(await postSuccessfulRefund(refund.id));
  if (!payment.bankTransactionId)
    fail(
      409,
      "GATEWAY_REFUND_UNAVAILABLE",
      "The payment has no gateway settlement reference",
    );
  try {
    const submitted = await initiateRefund({
      bankTransactionId: payment.bankTransactionId,
      refundTransactionId,
      amountPaisa,
      reason: input.reason,
    });
    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REFUND_PENDING },
      });
      return tx.refund.update({
        where: { id: refund.id },
        data: {
          status: "PROCESSING",
          gatewayRefundReferenceId: submitted.refundReferenceId,
          gatewayStatus: submitted.status,
          submittedAt: new Date(),
        },
      });
    });
    return serialize(updated);
  } catch (error) {
    await prisma.refund
      .update({
        where: { id: refund.id },
        data: {
          status: "FAILED",
          gatewayStatus: "SUBMISSION_FAILED",
          processedAt: new Date(),
        },
      })
      .catch(() => undefined);
    throw error;
  }
}

export async function requestAdminRefund(
  adminUserId: string,
  paymentId: string,
  input: { amountPaisa: bigint; reason: string; idempotencyKey: string },
) {
  const previous = await prisma.refund.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  const admin = await prisma.userRole.findUnique({
    where: { userId_role: { userId: adminUserId, role: "ADMIN" } },
    select: { userId: true },
  });
  if (!admin) fail(403, "REFUND_FORBIDDEN", "Admin access is required");
  if (previous) {
    if (
      previous.requestedByUserId !== adminUserId ||
      previous.paymentId !== paymentId ||
      previous.amountPaisa !== input.amountPaisa
    )
      fail(
        409,
        "IDEMPOTENCY_CONFLICT",
        "This request key belongs to another refund",
      );
    return serialize(previous);
  }
  const target = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { bookingId: true },
  });
  if (!target) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
  const refundTransactionId = transactionId("RF");
  const refund = await prisma.$transaction(
    async (tx) => {
      await lockEntity(tx, "booking", target.bookingId);
      await lockEntity(tx, "payment", paymentId);
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
      const booking = await tx.booking.findUnique({
        where: { id: payment.bookingId },
        select: {
          cancellation: { select: { id: true } },
          settlement: { select: { id: true } },
        },
      });
      if (booking?.cancellation || booking?.settlement)
        fail(
          409,
          "PAYMENT_ALREADY_DISTRIBUTED",
          "Booking funds have already been settled or returned to Refund Balance",
        );
      const refundableStatuses: PaymentStatus[] = [
        PaymentStatus.SUCCEEDED,
        PaymentStatus.CAPTURED,
        PaymentStatus.PARTIALLY_REFUNDED,
      ];
      if (!refundableStatuses.includes(payment.status))
        fail(409, "PAYMENT_NOT_REFUNDABLE", "Payment is not refundable");
      const reserved = await tx.refund.aggregate({
        where: {
          paymentId,
          status: { in: ["PENDING", "PROCESSING", "SUCCEEDED"] },
        },
        _sum: { amountPaisa: true },
      });
      if (
        input.amountPaisa <= 0n ||
        input.amountPaisa >
          payment.amountPaisa - (reserved._sum.amountPaisa ?? 0n)
      )
        fail(
          409,
          "REFUND_AMOUNT_EXCEEDED",
          "Refund exceeds the remaining refundable amount",
        );
      return tx.refund.create({
        data: {
          paymentId,
          requestedByUserId: adminUserId,
          amountPaisa: input.amountPaisa,
          reason: input.reason,
          policyReason: "Approved by platform administration.",
          idempotencyKey: input.idempotencyKey,
          gatewayRefundTransactionId: refundTransactionId,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
  });
  if (payment.provider === "SIMULATED")
    return serialize(await postSuccessfulRefund(refund.id));
  if (!payment.bankTransactionId)
    fail(
      409,
      "GATEWAY_REFUND_UNAVAILABLE",
      "The payment has no gateway settlement reference",
    );
  try {
    const submitted = await initiateRefund({
      bankTransactionId: payment.bankTransactionId,
      refundTransactionId,
      amountPaisa: input.amountPaisa,
      reason: input.reason,
    });
    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REFUND_PENDING },
      });
      return tx.refund.update({
        where: { id: refund.id },
        data: {
          status: "PROCESSING",
          gatewayRefundReferenceId: submitted.refundReferenceId,
          gatewayStatus: submitted.status,
          submittedAt: new Date(),
        },
      });
    });
    return serialize(updated);
  } catch (error) {
    await prisma.refund
      .update({
        where: { id: refund.id },
        data: {
          status: "FAILED",
          gatewayStatus: "SUBMISSION_FAILED",
          processedAt: new Date(),
        },
      })
      .catch(() => undefined);
    throw error;
  }
}

export async function getAndReconcileDriverRefund(
  driverUserId: string,
  refundId: string,
) {
  let refund = await prisma.refund.findFirst({
    where: { id: refundId, payment: { payerUserId: driverUserId } },
    include: {
      payment: {
        include: {
          booking: {
            include: {
              property: { select: { id: true, name: true, publicArea: true } },
            },
          },
        },
      },
    },
  });
  if (!refund) fail(404, "REFUND_NOT_FOUND", "Refund was not found");
  if (refund.status === "PROCESSING" && refund.gatewayRefundReferenceId) {
    const gateway = await queryRefund(refund.gatewayRefundReferenceId);
    if (gateway.status.toLowerCase() === "refunded") {
      await postSuccessfulRefund(refund.id);
      refund = await prisma.refund.findFirstOrThrow({
        where: { id: refund.id },
        include: {
          payment: {
            include: {
              booking: {
                include: {
                  property: {
                    select: { id: true, name: true, publicArea: true },
                  },
                },
              },
            },
          },
        },
      });
    } else if (["cancelled", "failed"].includes(gateway.status.toLowerCase())) {
      refund = await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: "FAILED",
          gatewayStatus: gateway.rawStatus,
          processedAt: new Date(),
        },
        include: {
          payment: {
            include: {
              booking: {
                include: {
                  property: {
                    select: { id: true, name: true, publicArea: true },
                  },
                },
              },
            },
          },
        },
      });
    }
  }
  return serialize(refund);
}
