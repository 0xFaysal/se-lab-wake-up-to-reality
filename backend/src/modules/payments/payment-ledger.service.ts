import { DomainAuditEventType, WalletHoldStatus, type Prisma } from "../../../generated/prisma/client.js";
import { calculateWalletSplit } from "../../common/finance/booking-finance.js";
import { AppError } from "../../common/errors/app-error.js";
import { createDomainAuditEvent } from "../property-governance/domain-audit.js";
import { lockEntity } from "../marketplace/marketplace.repository.js";

function fail(statusCode: number, code: string, message: string): never {
  throw new AppError({ statusCode, code, message });
}

export async function getOrCreateWallet(tx: Prisma.TransactionClient, userId: string) {
  return tx.walletAccount.upsert({
    where: { userId_currency: { userId, currency: "BDT" } },
    update: {},
    create: { userId, currency: "BDT" },
  });
}

export async function reserveDriverWallet(tx: Prisma.TransactionClient, input: {
  bookingId: string;
  paymentId: string;
  userId: string;
  grossAmountPaisa: bigint;
  idempotencyKey: string;
  expiresAt: Date;
}) {
  const wallet = await getOrCreateWallet(tx, input.userId);
  await lockEntity(tx, "wallet", wallet.id);
  const current = await tx.walletAccount.findUniqueOrThrow({ where: { id: wallet.id } });
  if (current.status !== "ACTIVE") fail(409, "DRIVER_WALLET_UNAVAILABLE", "Refund Balance is unavailable");
  const split = calculateWalletSplit(input.grossAmountPaisa, current.availableBalancePaisa);
  if (split.walletAppliedPaisa === 0n) return { ...split, walletHoldId: null };

  const hold = await tx.walletHold.create({
    data: {
      walletAccountId: current.id,
      userId: input.userId,
      bookingId: input.bookingId,
      paymentId: input.paymentId,
      amountPaisa: split.walletAppliedPaisa,
      idempotencyKey: `payment-wallet:${input.idempotencyKey}`,
      expiresAt: input.expiresAt,
    },
  });
  await tx.walletAccount.update({
    where: { id: current.id },
    data: {
      availableBalancePaisa: { decrement: split.walletAppliedPaisa },
      heldBalancePaisa: { increment: split.walletAppliedPaisa },
      balanceVersion: { increment: 1 },
    },
  });
  await createDomainAuditEvent(tx, {
    eventType: DomainAuditEventType.DRIVER_WALLET_HOLD_CREATED,
    actorUserId: input.userId,
    entityType: "WalletHold",
    entityId: hold.id,
    metadata: { bookingId: input.bookingId, amountPaisa: split.walletAppliedPaisa.toString() },
  });
  return { ...split, walletHoldId: hold.id };
}

export async function releasePaymentWalletHolds(tx: Prisma.TransactionClient, paymentId: string, actorUserId?: string) {
  const holds = await tx.walletHold.findMany({ where: { paymentId, status: WalletHoldStatus.ACTIVE } });
  for (const hold of holds) {
    await lockEntity(tx, "wallet", hold.walletAccountId);
    await tx.walletAccount.update({
      where: { id: hold.walletAccountId },
      data: {
        availableBalancePaisa: { increment: hold.amountPaisa },
        heldBalancePaisa: { decrement: hold.amountPaisa },
        balanceVersion: { increment: 1 },
      },
    });
    await tx.walletHold.update({ where: { id: hold.id }, data: { status: WalletHoldStatus.RELEASED, releasedAt: new Date() } });
    await createDomainAuditEvent(tx, {
      eventType: DomainAuditEventType.DRIVER_WALLET_HOLD_RELEASED,
      actorUserId: actorUserId ?? hold.userId,
      entityType: "WalletHold",
      entityId: hold.id,
      metadata: { paymentId, amountPaisa: hold.amountPaisa.toString() },
    });
  }
}

export async function postSuccessfulBookingPayment(tx: Prisma.TransactionClient, input: {
  paymentId: string;
  bookingId: string;
  actorUserId: string;
  propertyId: string;
  bookingCode: string;
  grossAmountPaisa: bigint;
  gatewayAmountPaisa: bigint;
}) {
  const holds = await tx.walletHold.findMany({
    where: { paymentId: input.paymentId, status: WalletHoldStatus.ACTIVE },
    include: { walletAccount: true },
  });
  const walletAppliedPaisa = holds.reduce((sum, hold) => sum + hold.amountPaisa, 0n);
  if (input.gatewayAmountPaisa + walletAppliedPaisa !== input.grossAmountPaisa) {
    fail(500, "PAYMENT_FUNDING_UNBALANCED", "Payment funding does not match the booking total");
  }
  const entries: Prisma.LedgerEntryCreateWithoutLedgerTransactionInput[] = [
    ...(input.gatewayAmountPaisa > 0n ? [{ accountCode: "EXTERNAL_PAYMENT_CLEARING", entrySide: "DEBIT" as const, amountPaisa: input.gatewayAmountPaisa }] : []),
    ...holds.map((hold) => ({ accountCode: "DRIVER_REFUND_LIABILITY", walletAccountId: hold.walletAccountId, entrySide: "DEBIT" as const, amountPaisa: hold.amountPaisa })),
    { accountCode: "BOOKING_HELD_FUNDS", entrySide: "CREDIT", amountPaisa: input.grossAmountPaisa },
  ];
  const debit = entries.filter((entry) => entry.entrySide === "DEBIT").reduce((sum, entry) => sum + BigInt(entry.amountPaisa), 0n);
  const credit = entries.filter((entry) => entry.entrySide === "CREDIT").reduce((sum, entry) => sum + BigInt(entry.amountPaisa), 0n);
  if (debit !== credit) fail(500, "LEDGER_UNBALANCED", "Booking payment ledger is not balanced");

  const ledger = await tx.ledgerTransaction.create({
    data: {
      referenceType: "BOOKING_PAYMENT_HELD",
      referenceId: input.paymentId,
      description: `Held payment for booking ${input.bookingCode}`,
      actorUserId: input.actorUserId,
      entries: { create: entries },
    },
  });
  for (const hold of holds) {
    await tx.walletAccount.update({
      where: { id: hold.walletAccountId },
      data: { heldBalancePaisa: { decrement: hold.amountPaisa }, balanceVersion: { increment: 1 } },
    });
    await tx.walletHold.update({ where: { id: hold.id }, data: { status: WalletHoldStatus.CONSUMED, consumedAt: new Date() } });
  }
  await tx.booking.update({
    where: { id: input.bookingId },
    data: { driverWalletAppliedPaisa: walletAppliedPaisa, gatewayAmountPaisa: input.gatewayAmountPaisa, financialStatus: "HELD" },
  });
  await createDomainAuditEvent(tx, {
    eventType: DomainAuditEventType.DRIVER_WALLET_APPLIED,
    actorUserId: input.actorUserId,
    propertyId: input.propertyId,
    entityType: "Booking",
    entityId: input.bookingId,
    metadata: { walletAppliedPaisa: walletAppliedPaisa.toString(), gatewayAmountPaisa: input.gatewayAmountPaisa.toString(), ledgerTransactionId: ledger.id },
  });
  return { walletAppliedPaisa, ledgerTransactionId: ledger.id };
}

export async function postSuccessfulSettlementFunding(tx: Prisma.TransactionClient, input: {
  paymentId: string;
  bookingId: string;
  actorUserId: string;
  propertyId: string;
  bookingCode: string;
  grossAmountPaisa: bigint;
  gatewayAmountPaisa: bigint;
}) {
  const holds = await tx.walletHold.findMany({
    where: { paymentId: input.paymentId, status: WalletHoldStatus.ACTIVE },
    include: { walletAccount: true },
  });
  const walletAppliedPaisa = holds.reduce((sum, hold) => sum + hold.amountPaisa, 0n);
  if (input.gatewayAmountPaisa + walletAppliedPaisa !== input.grossAmountPaisa) {
    fail(500, "PAYMENT_FUNDING_UNBALANCED", "Settlement funding does not match the outstanding amount");
  }
  const entries: Prisma.LedgerEntryCreateWithoutLedgerTransactionInput[] = [
    ...(input.gatewayAmountPaisa > 0n ? [{ accountCode: "EXTERNAL_PAYMENT_CLEARING", entrySide: "DEBIT" as const, amountPaisa: input.gatewayAmountPaisa }] : []),
    ...holds.map((hold) => ({ accountCode: "DRIVER_REFUND_LIABILITY", walletAccountId: hold.walletAccountId, entrySide: "DEBIT" as const, amountPaisa: hold.amountPaisa })),
    { accountCode: "BOOKING_HELD_FUNDS", entrySide: "CREDIT" as const, amountPaisa: input.grossAmountPaisa },
  ];
  const ledger = await tx.ledgerTransaction.create({ data: {
    referenceType: "BOOKING_SETTLEMENT_FUNDING",
    referenceId: input.paymentId,
    description: `Outstanding settlement funding for booking ${input.bookingCode}`,
    actorUserId: input.actorUserId,
    entries: { create: entries },
  } });
  for (const hold of holds) {
    await tx.walletAccount.update({ where: { id: hold.walletAccountId }, data: { heldBalancePaisa: { decrement: hold.amountPaisa }, balanceVersion: { increment: 1 } } });
    await tx.walletHold.update({ where: { id: hold.id }, data: { status: WalletHoldStatus.CONSUMED, consumedAt: new Date() } });
  }
  await createDomainAuditEvent(tx, {
    eventType: DomainAuditEventType.DRIVER_WALLET_APPLIED,
    actorUserId: input.actorUserId,
    propertyId: input.propertyId,
    entityType: "BookingSettlement",
    entityId: input.bookingId,
    metadata: { walletAppliedPaisa: walletAppliedPaisa.toString(), gatewayAmountPaisa: input.gatewayAmountPaisa.toString(), ledgerTransactionId: ledger.id },
  });
  return { walletAppliedPaisa, ledgerTransactionId: ledger.id };
}
