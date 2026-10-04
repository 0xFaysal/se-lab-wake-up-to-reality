import assert from "node:assert/strict";
import test from "node:test";

test("new overtime includes initial grace after the threshold and grants two checkout minutes", () => {
  const scheduledEndAt = new Date("2026-10-04T15:00:00Z");
  for (const [elapsed, minutes] of [
    [-1, 0],
    [0, 0],
    [5 * 60000, 0],
    [5 * 60000 + 1, 4],
    [6 * 60000, 4],
    [7 * 60000, 5],
    [10 * 60000, 8],
  ]) {
    const result = calculateOvertime({
      scheduledEndAt,
      actualCheckOutAt: new Date(+scheduledEndAt + elapsed!),
      baseRatePerHourPaisa: 6000n,
      policyVersion: 2,
      policy: {
        mode: "FIXED_PER_HOUR",
        fixedRatePerHourPaisa: 12000n,
        graceMinutes: 5,
      },
    });
    assert.equal(result.overtimeMinutes, minutes);
    assert.equal(result.overtimeChargePaisa, BigInt(minutes!) * 200n);
  }
  const input = {
    scheduledEndAt,
    actualCheckOutAt: new Date(+scheduledEndAt + 10 * 60000),
    baseRatePerHourPaisa: 6000n,
    policy: {
      mode: "MULTIPLIER" as const,
      multiplierBps: 15000,
      graceMinutes: 5,
    },
  };
  assert.deepEqual(calculateOvertime({ ...input, policyVersion: 2 }), {
    overtimeMinutes: 8,
    overtimeChargePaisa: 1200n,
  });
  assert.equal(
    calculateOvertime({ ...input, policyVersion: 1 }).overtimeMinutes,
    5,
  );
  assert.throws(
    () => calculateOvertime({ ...input, policyVersion: 3 }),
    RangeError,
  );
  assert.throws(
    () =>
      calculateOvertime({
        ...input,
        policyVersion: 2,
        policy: { ...input.policy, graceMinutes: 15 },
      }),
    RangeError,
  );
});
import { allocatePayoutDebits } from "../../../src/common/finance/payout-accounting.js";
import {
  calculateCancellation,
  calculateOvertime,
  calculateSettlement,
  calculateWalletSplit,
  cancellationRefundBps,
} from "../../../src/common/finance/booking-finance.js";

test("financial calculations reject negative money and invalid dates", () => {
  const cancellation = {
    startAt: new Date("2026-10-04T10:00:00Z"),
    cancelledAt: new Date("2026-10-03T10:00:00Z"),
    bookingChargePaisa: 100n,
    platformFeePaisa: 10n,
    depositPaisa: 200n,
  };
  for (const key of ["bookingChargePaisa", "platformFeePaisa", "depositPaisa"])
    assert.throws(
      () => calculateCancellation({ ...cancellation, [key]: -1n }),
      RangeError,
    );
  assert.throws(
    () => calculateCancellation({ ...cancellation, startAt: new Date(NaN) }),
    RangeError,
  );
  const settlement = {
    baseChargePaisa: 100n,
    platformFeePaisa: 10n,
    depositPaisa: 200n,
    overtimeChargePaisa: 50n,
    driverAvailablePaisa: 0n,
  };
  for (const key of Object.keys(settlement))
    assert.throws(
      () => calculateSettlement({ ...settlement, [key]: -1n }),
      RangeError,
    );
});

test("overtime validates policy even when checkout is inside grace", () => {
  const input = {
    scheduledEndAt: new Date("2026-10-04T10:00:00Z"),
    actualCheckOutAt: new Date("2026-10-04T10:00:00Z"),
    baseRatePerHourPaisa: 100n,
    policy: {
      mode: "MULTIPLIER" as const,
      multiplierBps: 15000,
      graceMinutes: 15,
    },
  };
  for (const policy of [
    { ...input.policy, graceMinutes: -1 },
    { ...input.policy, graceMinutes: NaN },
    { ...input.policy, multiplierBps: -1 },
    { ...input.policy, multiplierBps: 1.5 },
    {
      mode: "FIXED_PER_HOUR" as const,
      fixedRatePerHourPaisa: -1n,
      graceMinutes: 15,
    },
  ])
    assert.throws(() => calculateOvertime({ ...input, policy }), RangeError);
  assert.throws(
    () => calculateOvertime({ ...input, actualCheckOutAt: new Date(NaN) }),
    RangeError,
  );
});

test("settlement preserves all funds across deposit and wallet boundaries", () => {
  for (const depositPaisa of [0n, 1n, 99n, 40000n]) {
    for (const overtimeChargePaisa of [0n, 1n, 100n, 40000n, 40001n, 80000n]) {
      for (const driverAvailablePaisa of [0n, 1n, 100n, 40000n]) {
        const result = calculateSettlement({
          baseChargePaisa: 2400n,
          platformFeePaisa: 240n,
          depositPaisa,
          overtimeChargePaisa,
          driverAvailablePaisa,
        });
        assert.equal(
          result.depositUsedPaisa + result.depositReturnedPaisa,
          depositPaisa,
        );
        assert.equal(
          result.depositUsedPaisa +
            result.driverWalletChargedPaisa +
            result.outstandingPaisa,
          overtimeChargePaisa,
        );
        assert.equal(
          result.providerNetPaisa +
            result.driverRefundCreditPaisa +
            result.platformRevenuePaisa,
          2400n + 240n + depositPaisa + result.driverWalletChargedPaisa,
        );
        assert.ok(result.driverWalletChargedPaisa <= driverAvailablePaisa);
        for (const amount of Object.values(result)) assert.ok(amount >= 0n);
      }
    }
  }
});

test("driver withdrawals debit refund liability, not provider earnings", () => {
  assert.deepEqual(
    allocatePayoutDebits(40000n, { providerPaisa: 0n, driverPaisa: 50000n }),
    [{ accountCode: "DRIVER_REFUND_LIABILITY", amountPaisa: 40000n }],
  );
});

test("provider and mixed-source withdrawals preserve liability totals", () => {
  assert.deepEqual(
    allocatePayoutDebits(10000n, { providerPaisa: 12000n, driverPaisa: 0n }),
    [{ accountCode: "PROVIDER_PAYABLE", amountPaisa: 10000n }],
  );
  assert.deepEqual(
    allocatePayoutDebits(15000n, { providerPaisa: 10000n, driverPaisa: 5000n }),
    [
      { accountCode: "PROVIDER_PAYABLE", amountPaisa: 10000n },
      { accountCode: "DRIVER_REFUND_LIABILITY", amountPaisa: 5000n },
    ],
  );
});

test("payout allocation rejects unbacked amounts and ignores negative sources", () => {
  assert.throws(
    () => allocatePayoutDebits(1n, { providerPaisa: 0n, driverPaisa: 0n }),
    RangeError,
  );
  assert.throws(
    () => allocatePayoutDebits(0n, { providerPaisa: 100n, driverPaisa: 0n }),
    RangeError,
  );
  assert.deepEqual(
    allocatePayoutDebits(100n, { providerPaisa: -100n, driverPaisa: 100n }),
    [{ accountCode: "DRIVER_REFUND_LIABILITY", amountPaisa: 100n }],
  );
});

test("cancellation policy uses exact tier boundaries", () => {
  assert.deepEqual(
    [
      cancellationRefundBps(12 * 60),
      cancellationRefundBps(12 * 60 - 1),
      cancellationRefundBps(6 * 60),
      cancellationRefundBps(6 * 60 - 1),
      cancellationRefundBps(3 * 60),
      cancellationRefundBps(3 * 60 - 1),
      cancellationRefundBps(60),
      cancellationRefundBps(59),
    ],
    [10_000, 9_000, 9_000, 7_500, 7_500, 5_000, 5_000, 0],
  );
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
  assert.deepEqual(calculateWalletSplit(65_000n, 70_000n), {
    walletAppliedPaisa: 65_000n,
    gatewayAmountPaisa: 0n,
  });
  assert.deepEqual(calculateWalletSplit(65_000n, 20_000n), {
    walletAppliedPaisa: 20_000n,
    gatewayAmountPaisa: 45_000n,
  });
  assert.deepEqual(calculateWalletSplit(65_000n, 64_500n), {
    walletAppliedPaisa: 64_000n,
    gatewayAmountPaisa: 1_000n,
  });
});

test("multiplier overtime honors grace and exact minute pricing", () => {
  const scheduledEndAt = new Date("2026-09-26T12:00:00.000Z");
  const policy = {
    mode: "MULTIPLIER" as const,
    multiplierBps: 15_000,
    graceMinutes: 15,
  };
  assert.deepEqual(
    calculateOvertime({
      scheduledEndAt,
      actualCheckOutAt: new Date("2026-09-26T12:15:00.000Z"),
      baseRatePerHourPaisa: 10_000n,
      policy,
    }),
    { overtimeMinutes: 0, overtimeChargePaisa: 0n },
  );
  assert.deepEqual(
    calculateOvertime({
      scheduledEndAt,
      actualCheckOutAt: new Date("2026-09-26T12:45:00.000Z"),
      baseRatePerHourPaisa: 10_000n,
      policy,
    }),
    { overtimeMinutes: 30, overtimeChargePaisa: 7_500n },
  );
});

test("fixed overtime and settlement use deposit before driver balance", () => {
  const overtime = calculateOvertime({
    scheduledEndAt: new Date("2026-09-26T12:00:00.000Z"),
    actualCheckOutAt: new Date("2026-09-26T12:45:00.000Z"),
    baseRatePerHourPaisa: 10_000n,
    policy: {
      mode: "FIXED_PER_HOUR",
      fixedRatePerHourPaisa: 18_000n,
      graceMinutes: 15,
    },
  });
  assert.deepEqual(overtime, {
    overtimeMinutes: 30,
    overtimeChargePaisa: 9_000n,
  });
  assert.deepEqual(
    calculateSettlement({
      baseChargePaisa: 40_000n,
      platformFeePaisa: 4_000n,
      depositPaisa: 5_000n,
      overtimeChargePaisa: 9_000n,
      driverAvailablePaisa: 2_500n,
    }),
    {
      depositUsedPaisa: 5_000n,
      depositReturnedPaisa: 0n,
      driverWalletChargedPaisa: 2_500n,
      outstandingPaisa: 1_500n,
      paidOvertimePaisa: 7_500n,
      providerGrossPaisa: 47_500n,
      providerNetPaisa: 47_500n,
      platformRevenuePaisa: 4_000n,
      driverRefundCreditPaisa: 0n,
    },
  );
});

test("no-show settlement returns the full deposit and releases the booked parking charge", () => {
  assert.deepEqual(
    calculateSettlement({
      baseChargePaisa: 3_600n,
      platformFeePaisa: 360n,
      depositPaisa: 40_000n,
      overtimeChargePaisa: 0n,
      driverAvailablePaisa: 0n,
    }),
    {
      depositUsedPaisa: 0n,
      depositReturnedPaisa: 40_000n,
      driverWalletChargedPaisa: 0n,
      outstandingPaisa: 0n,
      paidOvertimePaisa: 0n,
      providerGrossPaisa: 3_600n,
      providerNetPaisa: 3_600n,
      platformRevenuePaisa: 360n,
      driverRefundCreditPaisa: 40_000n,
    },
  );
});
