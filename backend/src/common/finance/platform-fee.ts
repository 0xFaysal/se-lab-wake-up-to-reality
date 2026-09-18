export const DEFAULT_PLATFORM_FEE_BPS = 1_000;

export function calculatePlatformFeePaisa(
  baseAmountPaisa: bigint,
  rule?: {
    feeType: "PERCENTAGE" | "FIXED";
    percentageBps?: number | null;
    fixedAmountPaisa?: bigint | null;
  },
) {
  if (baseAmountPaisa < 0n) throw new RangeError("Base amount cannot be negative");
  if (rule?.feeType === "FIXED") return rule.fixedAmountPaisa ?? 0n;
  const basisPoints = BigInt(rule?.percentageBps ?? DEFAULT_PLATFORM_FEE_BPS);
  if (basisPoints < 0n || basisPoints > 10_000n) throw new RangeError("Percentage basis points must be between 0 and 10000");
  return (baseAmountPaisa * basisPoints + 9_999n) / 10_000n;
}
