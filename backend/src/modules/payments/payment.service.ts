import { createHash, randomBytes, randomUUID } from "node:crypto";
import { BookingStatus, DomainAuditEventType, PaymentStatus, type Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../common/errors/app-error.js";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { createDomainAuditEvent } from "../property-governance/domain-audit.js";
import { lockEntity } from "../marketplace/marketplace.repository.js";
import { createSession, gatewayAmountToPaisa, initiateRefund, queryRefund, validateTransaction } from "./sslcommerz.gateway.js";

const SESSION_TTL_MS = 20 * 60 * 1000;

function fail(statusCode: number, code: string, message: string): never {
  throw new AppError({ statusCode, code, message });
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item)) as T;
}

function transactionId(prefix = "PE"): string {
  return `${prefix}${Date.now().toString(36)}${randomBytes(6).toString("hex")}`.slice(0, 30).toUpperCase();
}

const paymentView = {
  id: true,
  bookingId: true,
  amountPaisa: true,
  currency: true,
  status: true,
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

export async function initiateSslCommerzSession(driverUserId: string, bookingId: string, idempotencyKey: string) {
  if (!env.SSLCOMMERZ_ENABLED) fail(503, "PAYMENT_GATEWAY_NOT_CONFIGURED", "Online payment is not configured");
  const prepared = await prisma.$transaction(async (tx) => {
    await lockEntity(tx, "booking", bookingId);
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, driverUserId },
      include: { driver: { select: { fullName: true, email: true, phone: true } }, property: { select: { name: true } } },
    });
    if (!booking) fail(404, "BOOKING_NOT_FOUND", "Booking was not found");
    if (booking.status !== BookingStatus.PAYMENT_PENDING) fail(409, "BOOKING_NOT_AWAITING_PAYMENT", "Booking is not awaiting payment");
    if (booking.totalAmountPaisa < 1000n) fail(409, "PAYMENT_AMOUNT_TOO_SMALL", "SSLCOMMERZ requires at least BDT 10.00");

    const paid = await tx.payment.findFirst({
      where: { bookingId, status: { in: [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED] } },
      select: { id: true },
    });
    if (paid) fail(409, "BOOKING_ALREADY_PAID", "This booking has already been paid");

    const byKey = await tx.payment.findUnique({ where: { idempotencyKey } });
    if (byKey && (byKey.bookingId !== bookingId || byKey.payerUserId !== driverUserId)) {
      fail(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency key belongs to another payment");
    }

    let payment = byKey ?? await tx.payment.findFirst({ where: { bookingId, provider: "SSLCOMMERZ" } });
    const now = new Date();
    if (payment?.status === PaymentStatus.SESSION_CREATED && payment.checkoutUrl && payment.sessionExpiresAt && payment.sessionExpiresAt > now) {
      return { existing: true as const, payment, booking };
    }
    if (payment && [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED].includes(payment.status as never)) {
      fail(409, "BOOKING_ALREADY_PAID", "This booking has already been paid");
    }
    payment ??= await tx.payment.create({ data: {
      bookingId,
      payerUserId: driverUserId,
      amountPaisa: booking.totalAmountPaisa,
      status: PaymentStatus.CREATED,
      provider: "SSLCOMMERZ",
      environment: env.SSLCOMMERZ_ENVIRONMENT.toUpperCase(),
      idempotencyKey,
      initiatedAt: now,
    } });
    const attemptNumber = await tx.paymentAttempt.count({ where: { paymentId: payment.id } }) + 1;
    const merchantTransactionId = transactionId();
    const attempt = await tx.paymentAttempt.create({ data: { paymentId: payment.id, attemptNumber, merchantTransactionId } });
    payment = await tx.payment.update({ where: { id: payment.id }, data: {
      status: PaymentStatus.CREATED,
      merchantTransactionId,
      gatewaySessionKey: null,
      checkoutUrl: null,
      sessionExpiresAt: null,
      failedAt: null,
      cancelledAt: null,
    } });
    return { existing: false as const, payment, booking, attempt };
  }, { isolationLevel: "Serializable" });

  if (prepared.existing) {
    return serialize({ paymentId: prepared.payment.id, status: prepared.payment.status, gateway: "SSLCOMMERZ", checkoutUrl: prepared.payment.checkoutUrl, expiresAt: prepared.payment.sessionExpiresAt });
  }

  try {
    const gateway = await createSession({
      transactionId: prepared.payment.merchantTransactionId!,
      amountPaisa: prepared.booking.totalAmountPaisa,
      customer: { name: prepared.booking.driver.fullName, email: prepared.booking.driver.email, phone: prepared.booking.driver.phone },
      productName: `Parking at ${prepared.booking.property.name}`.slice(0, 255),
    });
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const payment = await prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.update({ where: { id: prepared.attempt.id }, data: { sessionKey: gateway.sessionKey, status: PaymentStatus.SESSION_CREATED } });
      return tx.payment.update({ where: { id: prepared.payment.id }, data: {
        status: PaymentStatus.SESSION_CREATED,
        gatewaySessionKey: gateway.sessionKey,
        checkoutUrl: gateway.checkoutUrl,
        sessionExpiresAt: expiresAt,
      } });
    });
    return serialize({ paymentId: payment.id, status: payment.status, gateway: "SSLCOMMERZ", checkoutUrl: gateway.checkoutUrl, expiresAt });
  } catch (error) {
    await prisma.$transaction([
      prisma.paymentAttempt.update({ where: { id: prepared.attempt.id }, data: { status: PaymentStatus.FAILED, completedAt: new Date() } }),
      prisma.payment.update({ where: { id: prepared.payment.id }, data: { status: PaymentStatus.FAILED, failedAt: new Date() } }),
    ]).catch(() => undefined);
    throw error;
  }
}

export async function validateAndCaptureSslCommerz(transactionIdValue: string, validationId: string) {
  const gateway = await validateTransaction(validationId);
  if (gateway.tran_id !== transactionIdValue) fail(409, "PAYMENT_IDENTITY_MISMATCH", "Gateway transaction identity did not match");
  const payment = await prisma.payment.findUnique({ where: { merchantTransactionId: transactionIdValue } });
  if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
  if (payment.provider !== "SSLCOMMERZ") fail(409, "PAYMENT_GATEWAY_MISMATCH", "Payment gateway did not match");
  if (gateway.currency !== payment.currency || gatewayAmountToPaisa(gateway.amount) !== payment.amountPaisa) {
    fail(409, "PAYMENT_AMOUNT_MISMATCH", "Gateway amount or currency did not match the booking");
  }
  if ((gateway.risk_level ?? 0) > 0) fail(409, "PAYMENT_RISK_REVIEW_REQUIRED", "Gateway marked this payment for risk review");

  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "payment", payment.id);
    const current = await tx.payment.findUnique({ where: { id: payment.id }, include: { booking: true } });
    if (!current) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
    const completedStatuses: PaymentStatus[] = [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED];
    if (completedStatuses.includes(current.status)) {
      return serialize(await tx.payment.findUniqueOrThrow({ where: { id: current.id }, select: paymentView }));
    }
    if (current.booking.status !== BookingStatus.PAYMENT_PENDING) fail(409, "BOOKING_TRANSITION_INVALID", "Booking is not awaiting payment");

    const now = new Date();
    const credentialId = randomUUID();
    const rawCredential = `parkease-access:${credentialId}`;
    const creditTotal = current.booking.baseAmountPaisa + current.booking.platformFeePaisa + current.booking.depositPaisa;
    if (creditTotal !== current.amountPaisa) fail(500, "LEDGER_UNBALANCED", "Payment ledger transaction is not balanced");

    const ledger = await tx.ledgerTransaction.create({ data: {
      referenceType: "BOOKING_PAYMENT",
      referenceId: current.id,
      description: `SSLCOMMERZ payment for booking ${current.booking.bookingCode}`,
      actorUserId: current.payerUserId,
      entries: { create: [
        { accountCode: "EXTERNAL_PAYMENT_CLEARING", entrySide: "DEBIT", amountPaisa: current.amountPaisa },
        { accountCode: "PROVIDER_PAYABLE", walletAccountId: current.booking.settlementWalletAccountId, entrySide: "CREDIT", amountPaisa: current.booking.baseAmountPaisa },
        { accountCode: "PLATFORM_REVENUE", entrySide: "CREDIT", amountPaisa: current.booking.platformFeePaisa },
        { accountCode: "CUSTOMER_DEPOSIT_LIABILITY", entrySide: "CREDIT", amountPaisa: current.booking.depositPaisa },
      ] },
    } });
    await tx.walletAccount.update({ where: { id: current.booking.settlementWalletAccountId }, data: { pendingBalancePaisa: { increment: current.booking.baseAmountPaisa }, balanceVersion: { increment: 1 } } });
    await tx.booking.update({ where: { id: current.booking.id }, data: { status: BookingStatus.CONFIRMED, confirmedAt: now } });
    await tx.accessCredential.create({ data: {
      id: credentialId,
      bookingId: current.booking.id,
      tokenHash: createHash("sha256").update(rawCredential).digest("hex"),
      expiresAt: new Date(current.booking.effectiveEndAt.getTime() + 24 * 60 * 60 * 1000),
    } });
    await tx.notification.createMany({ data: [
      { userId: current.payerUserId, type: "PAYMENT_SUCCEEDED", title: "Payment successful", message: `Payment for booking ${current.booking.bookingCode} succeeded.`, entityType: "Payment", entityId: current.id, idempotencyKey: `payment-success:${current.id}:driver` },
      { userId: current.booking.providerUserId, type: "BOOKING_CONFIRMED", title: "New confirmed booking", message: `Booking ${current.booking.bookingCode} is confirmed.`, entityType: "Booking", entityId: current.booking.id, idempotencyKey: `booking-confirmed:${current.booking.id}:provider` },
    ], skipDuplicates: true });
    await createDomainAuditEvent(tx, { eventType: DomainAuditEventType.PAYMENT_SUCCEEDED, actorUserId: current.payerUserId, propertyId: current.booking.propertyId, entityType: "Payment", entityId: current.id, metadata: { ledgerTransactionId: ledger.id, gateway: "SSLCOMMERZ" } });
    await tx.paymentAttempt.updateMany({ where: { paymentId: current.id, merchantTransactionId: transactionIdValue }, data: { status: PaymentStatus.SUCCEEDED, completedAt: now } });
    const updated = await tx.payment.update({ where: { id: current.id }, data: {
      status: PaymentStatus.SUCCEEDED,
      validationId: gateway.val_id,
      bankTransactionId: gateway.bank_tran_id || null,
      providerReference: gateway.bank_tran_id || gateway.val_id,
      gatewayStatus: gateway.status,
      ...(gateway.card_type === undefined ? {} : { cardType: gateway.card_type }),
      ...(gateway.card_brand === undefined ? {} : { cardBrand: gateway.card_brand }),
      ...(gateway.card_issuer === undefined ? {} : { issuer: gateway.card_issuer }),
      ...(gateway.risk_level === undefined ? {} : { riskLevel: gateway.risk_level }),
      ...(gateway.risk_title === undefined ? {} : { riskTitle: gateway.risk_title }),
      succeededAt: now,
      capturedAt: now,
      checkoutUrl: null,
    }, select: paymentView });
    return serialize(updated);
  }, { isolationLevel: "Serializable" });
}

export async function recordGatewayExit(transactionIdValue: string, status: "FAILED" | "CANCELLED") {
  const payment = await prisma.payment.findUnique({ where: { merchantTransactionId: transactionIdValue } });
  if (!payment) return null;
  const finalStatuses: PaymentStatus[] = [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED, PaymentStatus.REFUNDED];
  if (finalStatuses.includes(payment.status)) return payment.id;
  const now = new Date();
  await prisma.$transaction([
    prisma.payment.update({ where: { id: payment.id }, data: status === "FAILED" ? { status: PaymentStatus.FAILED, failedAt: now, checkoutUrl: null } : { status: PaymentStatus.CANCELLED, cancelledAt: now, checkoutUrl: null } }),
    prisma.paymentAttempt.updateMany({ where: { paymentId: payment.id, merchantTransactionId: transactionIdValue }, data: { status: status === "FAILED" ? PaymentStatus.FAILED : PaymentStatus.CANCELLED, completedAt: now } }),
  ]);
  return payment.id;
}

export async function findPaymentIdByTransaction(transactionIdValue: string) {
  return (await prisma.payment.findUnique({ where: { merchantTransactionId: transactionIdValue }, select: { id: true } }))?.id ?? null;
}

export async function getDriverPayment(driverUserId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, payerUserId: driverUserId }, select: paymentView });
  if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
  return serialize(payment);
}

export async function previewDriverRefund(driverUserId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, payerUserId: driverUserId },
    include: { booking: true, refunds: { where: { status: { in: ["PENDING", "PROCESSING", "SUCCEEDED"] } } } },
  });
  if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
  const refundableStatuses: PaymentStatus[] = [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED];
  if (!refundableStatuses.includes(payment.status)) {
    fail(409, "PAYMENT_NOT_REFUNDABLE", "Payment is not refundable");
  }
  const cutoff = new Date(payment.booking.startAt.getTime() - 2 * 60 * 60 * 1000);
  const eligible = new Date() <= cutoff;
  const reserved = payment.refunds.reduce((sum, refund) => sum + refund.amountPaisa, 0n);
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
  return prisma.$transaction(async (tx) => {
    await lockEntity(tx, "refund", refundId);
    const refund = await tx.refund.findUnique({ where: { id: refundId }, include: { payment: { include: { booking: true, refunds: { where: { status: "SUCCEEDED" } } } } } });
    if (!refund) fail(404, "REFUND_NOT_FOUND", "Refund was not found");
    if (refund.status === "SUCCEEDED") return refund;
    const payment = refund.payment;
    const providerComponent = (refund.amountPaisa * payment.booking.baseAmountPaisa) / payment.amountPaisa;
    const nonProviderComponent = refund.amountPaisa - providerComponent;
    const wallet = await tx.walletAccount.findUnique({ where: { id: payment.booking.settlementWalletAccountId } });
    if (!wallet) fail(409, "SETTLEMENT_WALLET_UNAVAILABLE", "Settlement wallet is unavailable");
    const fromPending = wallet.pendingBalancePaisa < providerComponent ? wallet.pendingBalancePaisa : providerComponent;
    const fromAvailable = providerComponent - fromPending;
    if (fromAvailable > wallet.availableBalancePaisa) fail(409, "REFUND_BALANCE_UNAVAILABLE", "Provider balance is insufficient for this refund");
    await tx.ledgerTransaction.create({ data: {
      referenceType: "PAYMENT_REFUND", referenceId: refund.id,
      description: `Refund for booking ${payment.booking.bookingCode}`, actorUserId: refund.requestedByUserId,
      entries: { create: [
        ...(providerComponent > 0n ? [{ accountCode: "PROVIDER_PAYABLE", walletAccountId: wallet.id, entrySide: "DEBIT" as const, amountPaisa: providerComponent }] : []),
        ...(nonProviderComponent > 0n ? [{ accountCode: "PLATFORM_REFUND", entrySide: "DEBIT" as const, amountPaisa: nonProviderComponent }] : []),
        { accountCode: "EXTERNAL_PAYMENT_CLEARING", entrySide: "CREDIT", amountPaisa: refund.amountPaisa },
      ] },
    } });
    if (providerComponent > 0n) await tx.walletAccount.update({ where: { id: wallet.id }, data: { pendingBalancePaisa: { decrement: fromPending }, availableBalancePaisa: { decrement: fromAvailable }, balanceVersion: { increment: 1 } } });
    const totalRefunded = payment.refundedAmountPaisa + refund.amountPaisa;
    await tx.payment.update({ where: { id: payment.id }, data: { refundedAmountPaisa: totalRefunded, status: totalRefunded >= payment.amountPaisa ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED } });
    const updated = await tx.refund.update({ where: { id: refund.id }, data: { status: "SUCCEEDED", gatewayStatus: "REFUNDED", processedAt: new Date() } });
    await tx.notification.upsert({ where: { userId_idempotencyKey: { userId: payment.payerUserId, idempotencyKey: `refund:${refund.id}:payer` } }, update: {}, create: { userId: payment.payerUserId, type: "REFUND_PROCESSED", title: "Refund processed", message: `Refund for booking ${payment.booking.bookingCode} was processed.`, entityType: "Refund", entityId: refund.id, idempotencyKey: `refund:${refund.id}:payer` } });
    await createDomainAuditEvent(tx, { eventType: DomainAuditEventType.REFUND_CREATED, actorUserId: refund.requestedByUserId, propertyId: payment.booking.propertyId, entityType: "Refund", entityId: refund.id });
    return updated;
  }, { isolationLevel: "Serializable" });
}

export async function requestDriverRefund(driverUserId: string, paymentId: string, input: { reason: string; idempotencyKey: string }) {
  const previous = await prisma.refund.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (previous) {
    if (previous.requestedByUserId !== driverUserId || previous.paymentId !== paymentId) fail(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency key belongs to another refund");
    return serialize(previous);
  }
  const preview = await previewDriverRefund(driverUserId, paymentId);
  if (!preview.eligible || BigInt(preview.refundableAmountPaisa) <= 0n) fail(409, "REFUND_POLICY_NOT_ELIGIBLE", preview.policyReason);
  const amountPaisa = BigInt(preview.refundableAmountPaisa);
  const refundTransactionId = transactionId("RF");
  const refund = await prisma.$transaction(async (tx) => {
    await lockEntity(tx, "payment", paymentId);
    const payment = await tx.payment.findFirst({ where: { id: paymentId, payerUserId: driverUserId } });
    if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
    const reserved = await tx.refund.aggregate({ where: { paymentId, status: { in: ["PENDING", "PROCESSING", "SUCCEEDED"] } }, _sum: { amountPaisa: true } });
    if (amountPaisa > payment.amountPaisa - (reserved._sum.amountPaisa ?? 0n)) fail(409, "REFUND_AMOUNT_EXCEEDED", "Refund exceeds the remaining refundable amount");
    return tx.refund.create({ data: { paymentId, requestedByUserId: driverUserId, amountPaisa, reason: input.reason, policyReason: preview.policyReason, idempotencyKey: input.idempotencyKey, gatewayRefundTransactionId: refundTransactionId } });
  }, { isolationLevel: "Serializable" });

  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.provider === "SIMULATED") return serialize(await postSuccessfulRefund(refund.id));
  if (!payment.bankTransactionId) fail(409, "GATEWAY_REFUND_UNAVAILABLE", "The payment has no gateway settlement reference");
  try {
    const submitted = await initiateRefund({ bankTransactionId: payment.bankTransactionId, refundTransactionId, amountPaisa, reason: input.reason });
    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: paymentId }, data: { status: PaymentStatus.REFUND_PENDING } });
      return tx.refund.update({ where: { id: refund.id }, data: { status: "PROCESSING", gatewayRefundReferenceId: submitted.refundReferenceId, gatewayStatus: submitted.status, submittedAt: new Date() } });
    });
    return serialize(updated);
  } catch (error) {
    await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED", gatewayStatus: "SUBMISSION_FAILED", processedAt: new Date() } }).catch(() => undefined);
    throw error;
  }
}

export async function requestAdminRefund(adminUserId: string, paymentId: string, input: { amountPaisa: bigint; reason: string; idempotencyKey: string }) {
  const previous = await prisma.refund.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (previous) return serialize(previous);
  const admin = await prisma.userRole.findUnique({ where: { userId_role: { userId: adminUserId, role: "ADMIN" } }, select: { userId: true } });
  if (!admin) fail(403, "REFUND_FORBIDDEN", "Admin access is required");
  const refundTransactionId = transactionId("RF");
  const refund = await prisma.$transaction(async (tx) => {
    await lockEntity(tx, "payment", paymentId);
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) fail(404, "PAYMENT_NOT_FOUND", "Payment was not found");
    const refundableStatuses: PaymentStatus[] = [PaymentStatus.SUCCEEDED, PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED];
    if (!refundableStatuses.includes(payment.status)) fail(409, "PAYMENT_NOT_REFUNDABLE", "Payment is not refundable");
    const reserved = await tx.refund.aggregate({ where: { paymentId, status: { in: ["PENDING", "PROCESSING", "SUCCEEDED"] } }, _sum: { amountPaisa: true } });
    if (input.amountPaisa <= 0n || input.amountPaisa > payment.amountPaisa - (reserved._sum.amountPaisa ?? 0n)) fail(409, "REFUND_AMOUNT_EXCEEDED", "Refund exceeds the remaining refundable amount");
    return tx.refund.create({ data: { paymentId, requestedByUserId: adminUserId, amountPaisa: input.amountPaisa, reason: input.reason, policyReason: "Approved by platform administration.", idempotencyKey: input.idempotencyKey, gatewayRefundTransactionId: refundTransactionId } });
  }, { isolationLevel: "Serializable" });
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.provider === "SIMULATED") return serialize(await postSuccessfulRefund(refund.id));
  if (!payment.bankTransactionId) fail(409, "GATEWAY_REFUND_UNAVAILABLE", "The payment has no gateway settlement reference");
  try {
    const submitted = await initiateRefund({ bankTransactionId: payment.bankTransactionId, refundTransactionId, amountPaisa: input.amountPaisa, reason: input.reason });
    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: paymentId }, data: { status: PaymentStatus.REFUND_PENDING } });
      return tx.refund.update({ where: { id: refund.id }, data: { status: "PROCESSING", gatewayRefundReferenceId: submitted.refundReferenceId, gatewayStatus: submitted.status, submittedAt: new Date() } });
    });
    return serialize(updated);
  } catch (error) {
    await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED", gatewayStatus: "SUBMISSION_FAILED", processedAt: new Date() } }).catch(() => undefined);
    throw error;
  }
}

export async function getAndReconcileDriverRefund(driverUserId: string, refundId: string) {
  let refund = await prisma.refund.findFirst({ where: { id: refundId, payment: { payerUserId: driverUserId } }, include: { payment: { include: { booking: { include: { property: { select: { id: true, name: true, publicArea: true } } } } } } } });
  if (!refund) fail(404, "REFUND_NOT_FOUND", "Refund was not found");
  if (refund.status === "PROCESSING" && refund.gatewayRefundReferenceId) {
    const gateway = await queryRefund(refund.gatewayRefundReferenceId);
    if (gateway.status.toLowerCase() === "refunded") {
      await postSuccessfulRefund(refund.id);
      refund = await prisma.refund.findFirstOrThrow({ where: { id: refund.id }, include: { payment: { include: { booking: { include: { property: { select: { id: true, name: true, publicArea: true } } } } } } } });
    } else if (["cancelled", "failed"].includes(gateway.status.toLowerCase())) {
      refund = await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED", gatewayStatus: gateway.rawStatus, processedAt: new Date() }, include: { payment: { include: { booking: { include: { property: { select: { id: true, name: true, publicArea: true } } } } } } } });
    }
  }
  return serialize(refund);
}
