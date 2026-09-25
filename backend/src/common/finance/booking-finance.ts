export const CANCELLATION_POLICY_VERSION = 1;
export const BASIS_POINTS = 10_000n;
export const MIN_GATEWAY_AMOUNT_PAISA = 1_000n;

export type OvertimePolicy =
  | {
      mode: "MULTIPLIER";
      multiplierBps: number;
      fixedRatePerHourPaisa?: never;
      graceMinutes: number;
    }
  | {
      mode: "FIXED_PER_HOUR";
      multiplierBps?: never;
      fixedRatePerHourPaisa: bigint;
      graceMinutes: number;
    };

export function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new RangeError("Denominator must be positive");
  if (numerator < 0n)
    throw new RangeError("Money numerator cannot be negative");
  return (numerator + denominator - 1n) / denominator;
}

export function calculateParkingCharge(
  ratePerHourPaisa: bigint,
  durationMinutes: number,
): bigint {
  if (
    ratePerHourPaisa < 0n ||
    !Number.isSafeInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    throw new RangeError("Invalid parking price input");
  }
  return ceilDiv(ratePerHourPaisa * BigInt(durationMinutes), 60n);
}

export function calculateWalletSplit(
  totalPaisa: bigint,
  availablePaisa: bigint,
) {
  if (totalPaisa < 0n || availablePaisa < 0n)
    throw new RangeError("Balances cannot be negative");
  let walletAppliedPaisa =
    availablePaisa < totalPaisa ? availablePaisa : totalPaisa;
  let gatewayAmountPaisa = totalPaisa - walletAppliedPaisa;

  // SSLCOMMERZ rejects sub-BDT 10 payments. Leave enough for the gateway or
  // use the wallet for the complete amount.
  if (
    gatewayAmountPaisa > 0n &&
    gatewayAmountPaisa < MIN_GATEWAY_AMOUNT_PAISA
  ) {
    const reduction = MIN_GATEWAY_AMOUNT_PAISA - gatewayAmountPaisa;
    walletAppliedPaisa =
      walletAppliedPaisa > reduction ? walletAppliedPaisa - reduction : 0n;
    gatewayAmountPaisa = totalPaisa - walletAppliedPaisa;
  }
  return { walletAppliedPaisa, gatewayAmountPaisa };
}

export function cancellationRefundBps(minutesBeforeStart: number): number {
  if (!Number.isFinite(minutesBeforeStart))
    throw new RangeError("Invalid cancellation time");
  if (minutesBeforeStart >= 12 * 60) return 10_000;
  if (minutesBeforeStart >= 6 * 60) return 9_000;
  if (minutesBeforeStart >= 3 * 60) return 7_500;
  if (minutesBeforeStart >= 60) return 5_000;
  return 0;
}

export function calculateCancellation(input: {
  startAt: Date;
  cancelledAt: Date;
  bookingChargePaisa: bigint;
  platformFeePaisa: bigint;
  depositPaisa: bigint;
}) {
  const minutesBeforeStart = Math.floor(
    (input.startAt.getTime() - input.cancelledAt.getTime()) / 60_000,
  );
  const refundBps = cancellationRefundBps(minutesBeforeStart);
  const bookingRefundPaisa =
    (input.bookingChargePaisa * BigInt(refundBps)) / BASIS_POINTS;
  const providerCancellationPaisa =
    input.bookingChargePaisa - bookingRefundPaisa;
  return {
    policyVersion: CANCELLATION_POLICY_VERSION,
    minutesBeforeStart,
    bookingRefundBps: refundBps,
    bookingRefundPaisa,
    depositReturnPaisa: input.depositPaisa,
    platformFeeRefundPaisa: 0n,
    driverWalletCreditPaisa: bookingRefundPaisa + input.depositPaisa,
    providerCancellationPaisa,
    platformFeePaisa: input.platformFeePaisa,
  };
}

export function calculateOvertime(input: {
  scheduledEndAt: Date;
  actualCheckOutAt: Date;
  baseRatePerHourPaisa: bigint;
  policy: OvertimePolicy;
}) {
  const elapsedAfterEndMs =
    input.actualCheckOutAt.getTime() - input.scheduledEndAt.getTime();
  const chargeableMs = Math.max(
    0,
    elapsedAfterEndMs - input.policy.graceMinutes * 60_000,
  );
  const overtimeMinutes =
    chargeableMs === 0 ? 0 : Math.ceil(chargeableMs / 60_000);
  if (overtimeMinutes === 0)
    return { overtimeMinutes: 0, overtimeChargePaisa: 0n };

  if (input.policy.mode === "FIXED_PER_HOUR") {
    return {
      overtimeMinutes,
      overtimeChargePaisa: calculateParkingCharge(
        input.policy.fixedRatePerHourPaisa,
        overtimeMinutes,
      ),
    };
  }
  const normalEquivalent = input.baseRatePerHourPaisa * BigInt(overtimeMinutes);
  return {
    overtimeMinutes,
    overtimeChargePaisa: ceilDiv(
      normalEquivalent * BigInt(input.policy.multiplierBps),
      60n * BASIS_POINTS,
    ),
  };
}

export function calculateSettlement(input: {
  baseChargePaisa: bigint;
  platformFeePaisa: bigint;
  depositPaisa: bigint;
  overtimeChargePaisa: bigint;
  driverAvailablePaisa: bigint;
}) {
  const depositUsedPaisa =
    input.overtimeChargePaisa < input.depositPaisa
      ? input.overtimeChargePaisa
      : input.depositPaisa;
  const depositReturnedPaisa = input.depositPaisa - depositUsedPaisa;
  const afterDeposit = input.overtimeChargePaisa - depositUsedPaisa;
  const driverWalletChargedPaisa =
    input.driverAvailablePaisa < afterDeposit
      ? input.driverAvailablePaisa
      : afterDeposit;
  const outstandingPaisa = afterDeposit - driverWalletChargedPaisa;
  const paidOvertimePaisa = input.overtimeChargePaisa - outstandingPaisa;
  return {
    depositUsedPaisa,
    depositReturnedPaisa,
    driverWalletChargedPaisa,
    outstandingPaisa,
    paidOvertimePaisa,
    providerGrossPaisa: input.baseChargePaisa + paidOvertimePaisa,
    providerNetPaisa: input.baseChargePaisa + paidOvertimePaisa,
    platformRevenuePaisa: input.platformFeePaisa,
    driverRefundCreditPaisa: depositReturnedPaisa,
  };
}
