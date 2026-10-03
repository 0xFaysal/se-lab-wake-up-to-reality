import type { Prisma } from "../../../generated/prisma/client.js";
import { lockEntity } from "../marketplace/marketplace.repository.js";

// Call inside the booking's locked settlement transaction. Disputes may precede checkout.
export async function creditProviderEarnings(
  tx: Prisma.TransactionClient,
  bookingId: string,
  walletId: string,
  amount: bigint,
) {
  if (amount <= 0n) return;
  await lockEntity(tx, "wallet", walletId);
  const dispute = await tx.dispute.findFirst({
    where: { bookingId, status: { in: ["OPEN", "UNDER_REVIEW"] } },
    select: { id: true },
  });
  await tx.walletAccount.update({
    where: { id: walletId },
    data: {
      ...(dispute
        ? { heldBalancePaisa: { increment: amount } }
        : { pendingBalancePaisa: { increment: amount } }),
      balanceVersion: { increment: 1 },
    },
  });
  if (dispute)
    await tx.dispute.update({
      where: { id: dispute.id },
      data: { providerHeldPaisa: { increment: amount } },
    });
}
