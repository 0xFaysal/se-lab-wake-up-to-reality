import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCancellation,
  calculateOvertime,
  calculateSettlement,
  calculateWalletSplit,
  cancellationRefundBps,
} from "../../../src/common/finance/booking-finance.js";

test("cancellation policy uses exact tier boundaries", () => {
  assert.deepEqual([
    cancellationRefundBps(12 * 60),
    cancellationRefundBps(12 * 60 - 1),
    cancellationRefundBps(6 * 60),
    cancellationRefundBps(6 * 60 - 1),
    cancellationRefundBps(3 * 60),
    cancellationRefundBps(3 * 60 - 1),
    cancellationRefundBps(60),
    cancellationRefundBps(59),
  ], [10_000, 9_000, 9_000, 7_500, 7_500, 5_000, 5_000, 0]);
});

test("cancellation returns deposit, never platform fee, and penalizes booking charge only", () => {
  const startAt = new Date("2026-09-26T12:00:00.000Z");
  const result = calculateCancellation({
    startAt,
    cancelledAt: new Date("2026-09-26T08:00:00.000Z"),
    bookingChargePaisa: 40_000n,
    platformFeePaisa: 4_000n,
    depositPaisa: 20_000n,
  });
  assert.equal(result.bookingRefundPaisa, 30_000n);
  assert.equal(result.depositReturnPaisa, 20_000n);
  assert.equal(result.platformFeeRefundPaisa, 0n);
  assert.equal(result.driverWalletCreditPaisa, 50_000n);
  assert.equal(result.providerCancellationPaisa, 10_000n);
});

test("wallet split supports wallet-only and enforces gateway minimum", () => {
  assert.deepEqual(calculateWalletSplit(65_000n, 70_000n), { walletAppliedPaisa: 65_000n, gatewayAmountPaisa: 0n });
  assert.deepEqual(calculateWalletSplit(65_000n, 20_000n), { walletAppliedPaisa: 20_000n, gatewayAmountPaisa: 45_000n });
  assert.deepEqual(calculateWalletSplit(65_000n, 64_500n), { walletAppliedPaisa: 64_000n, gatewayAmountPaisa: 1_000n });
});

test("multiplier overtime honors grace and exact minute pricing", () => {
  const scheduledEndAt = new Date("2026-09-26T12:00:00.000Z");
  const policy = { mode: "MULTIPLIER" as const, multiplierBps: 15_000, graceMinutes: 15 };
  assert.deepEqual(calculateOvertime({ scheduledEndAt, actualCheckOutAt: new Date("2026-09-26T12:15:00.000Z"), baseRatePerHourPaisa: 10_000n, policy }), { overtimeMinutes: 0, overtimeChargePaisa: 0n });
  assert.deepEqual(calculateOvertime({ scheduledEndAt, actualCheckOutAt: new Date("2026-09-26T12:45:00.000Z"), baseRatePerHourPaisa: 10_000n, policy }), { overtimeMinutes: 30, overtimeChargePaisa: 7_500n });
});

test("fixed overtime and settlement use deposit before driver balance", () => {
  const overtime = calculateOvertime({
    scheduledEndAt: new Date("2026-09-26T12:00:00.000Z"),
    actualCheckOutAt: new Date("2026-09-26T12:45:00.000Z"),
    baseRatePerHourPaisa: 10_000n,
    policy: { mode: "FIXED_PER_HOUR", fixedRatePerHourPaisa: 18_000n, graceMinutes: 15 },
  });
  assert.deepEqual(overtime, { overtimeMinutes: 30, overtimeChargePaisa: 9_000n });
  assert.deepEqual(calculateSettlement({ baseChargePaisa: 40_000n, platformFeePaisa: 4_000n, depositPaisa: 5_000n, overtimeChargePaisa: 9_000n, driverAvailablePaisa: 2_500n }), {
    depositUsedPaisa: 5_000n,
    depositReturnedPaisa: 0n,
    driverWalletChargedPaisa: 2_500n,
    outstandingPaisa: 1_500n,
    paidOvertimePaisa: 7_500n,
    providerGrossPaisa: 47_500n,
    providerNetPaisa: 47_500n,
    platformRevenuePaisa: 4_000n,
    driverRefundCreditPaisa: 0n,
  });
});

test("no-show settlement returns the full deposit and releases the booked parking charge", () => {
  assert.deepEqual(calculateSettlement({
    baseChargePaisa: 3_600n,
    platformFeePaisa: 360n,
    depositPaisa: 40_000n,
    overtimeChargePaisa: 0n,
    driverAvailablePaisa: 0n,
  }), {
    depositUsedPaisa: 0n,
    depositReturnedPaisa: 40_000n,
    driverWalletChargedPaisa: 0n,
    outstandingPaisa: 0n,
    paidOvertimePaisa: 0n,
    providerGrossPaisa: 3_600n,
    providerNetPaisa: 3_600n,
    platformRevenuePaisa: 360n,
    driverRefundCreditPaisa: 40_000n,
  });
});
