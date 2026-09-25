import {
  PlatformFeeRuleStatus,
  PlatformFeeScopeType,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { calculatePlatformFeePaisa } from "../../common/finance/platform-fee.js";

const priority: Record<PlatformFeeScopeType, number> = {
  [PlatformFeeScopeType.GLOBAL]: 0,
  [PlatformFeeScopeType.PROVIDER]: 1,
  [PlatformFeeScopeType.PROPERTY]: 2,
  [PlatformFeeScopeType.LISTING]: 3,
};

export async function resolvePlatformFee(
  listingId: string,
  baseAmountPaisa: bigint,
  effectiveAt = new Date(),
) {
  const listing = await prisma.parkingListing.findUnique({
    where: { id: listingId },
    select: {
      providerUserId: true,
      parkingSpot: { select: { propertyId: true } },
    },
  });

  if (!listing) {
    return {
      amountPaisa: calculatePlatformFeePaisa(baseAmountPaisa),
      ruleId: null,
      source: "SYSTEM_DEFAULT" as const,
    };
  }

  const rules = await prisma.platformFeeRule.findMany({
    where: {
      status: {
        in: [PlatformFeeRuleStatus.ACTIVE, PlatformFeeRuleStatus.SCHEDULED],
      },
      effectiveFrom: { lte: effectiveAt },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: effectiveAt } }],
      AND: [
        {
          OR: [
            { scopeType: PlatformFeeScopeType.GLOBAL, scopeId: null },
            {
              scopeType: PlatformFeeScopeType.PROVIDER,
              scopeId: listing.providerUserId,
            },
            {
              scopeType: PlatformFeeScopeType.PROPERTY,
              scopeId: listing.parkingSpot.propertyId,
            },
            { scopeType: PlatformFeeScopeType.LISTING, scopeId: listingId },
          ],
        },
      ],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  const rule = rules.sort(
    (left, right) => priority[right.scopeType] - priority[left.scopeType],
  )[0];
  if (!rule) {
    return {
      amountPaisa: calculatePlatformFeePaisa(baseAmountPaisa),
      ruleId: null,
      source: "SYSTEM_DEFAULT" as const,
    };
  }

  const amountPaisa = calculatePlatformFeePaisa(baseAmountPaisa, rule);

  return { amountPaisa, ruleId: rule.id, source: rule.scopeType };
}
