import type { Prisma } from "../../../generated/prisma/client.js";

type ReservationDb = Pick<
  Prisma.TransactionClient,
  "booking" | "reservationHold"
>;

export async function vehicleHasReservationConflict(
  db: ReservationDb,
  vehicleId: string,
  startAt: Date,
  endAt: Date,
  now = new Date(),
  excludeHoldId?: string,
): Promise<boolean> {
  // Half-open intervals allow adjacent stays; property and provider never limit this check.
  const booking = await db.booking.findFirst({
    where: {
      vehicleId,
      status: {
        in: [
          "PAYMENT_PENDING",
          "CONFIRMED",
          "CHECKED_IN",
          "CHECKOUT_REQUESTED",
        ],
      },
      startAt: { lt: endAt },
      effectiveEndAt: { gt: startAt },
    },
    select: { id: true },
  });
  if (booking) return true;
  const hold = await db.reservationHold.findFirst({
    where: {
      ...(excludeHoldId ? { id: { not: excludeHoldId } } : {}),
      status: "ACTIVE",
      expiresAt: { gt: now },
      allocation: { status: "HELD" },
      quote: { vehicleId, startAt: { lt: endAt }, endAt: { gt: startAt } },
    },
    select: { id: true },
  });
  return hold !== null;
}
