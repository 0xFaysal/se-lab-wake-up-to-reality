import assert from "node:assert/strict";
import { it } from "node:test";
import type { Prisma } from "../../../generated/prisma/client.js";
import { vehicleHasReservationConflict } from "../../../src/modules/marketplace/vehicle-reservation.js";

const start = new Date("2026-10-06T02:30:00Z");
const end = new Date("2026-10-06T04:00:00Z");
const now = new Date("2026-10-04T12:00:00Z");
type Row = {
  id: string;
  vehicleId: string;
  start: Date;
  end: Date;
  status: string;
  expires?: Date;
};
function database(bookings: Row[], holds: Row[] = []) {
  return {
    booking: {
      findFirst: async ({ where }: { where: Prisma.BookingWhereInput }) => {
        assert.equal("propertyId" in where, false);
        assert.equal("driverUserId" in where, false);
        const statuses = (where.status as { in: string[] }).in;
        return (
          bookings.find(
            (row) =>
              row.vehicleId === where.vehicleId &&
              statuses.includes(row.status) &&
              row.start < (where.startAt as { lt: Date }).lt &&
              row.end > (where.effectiveEndAt as { gt: Date }).gt,
          ) ?? null
        );
      },
    },
    reservationHold: {
      findFirst: async ({
        where,
      }: {
        where: Prisma.ReservationHoldWhereInput;
      }) => {
        const quote = where.quote as {
          vehicleId: string;
          startAt: { lt: Date };
          endAt: { gt: Date };
        };
        return (
          holds.find(
            (row) =>
              row.vehicleId === quote.vehicleId &&
              row.status === where.status &&
              row.expires! > (where.expiresAt as { gt: Date }).gt &&
              row.id !== (where.id as { not?: string } | undefined)?.not &&
              row.start < quote.startAt.lt &&
              row.end > quote.endAt.gt,
          ) ?? null
        );
      },
    },
  } as unknown as Pick<Prisma.TransactionClient, "booking" | "reservationHold">;
}
const overlapping: Row = {
  id: "existing",
  vehicleId: "car",
  start: new Date("2026-10-06T02:00:00Z"),
  end,
  status: "CONFIRMED",
};

it("blocks the same vehicle across properties, including pending payment and parked stays", async () => {
  for (const status of [
    "PAYMENT_PENDING",
    "CONFIRMED",
    "CHECKED_IN",
    "CHECKOUT_REQUESTED",
  ]) {
    assert.equal(
      await vehicleHasReservationConflict(
        database([{ ...overlapping, status }]),
        "car",
        start,
        end,
        now,
      ),
      true,
    );
  }
});
it("allows adjacent intervals, other cars, cancelled and completed bookings", async () => {
  for (const row of [
    { ...overlapping, end: start },
    { ...overlapping, start: end },
    { ...overlapping, vehicleId: "other" },
    ...["CANCELLED", "COMPLETED", "NO_SHOW"].map((status) => ({
      ...overlapping,
      status,
    })),
  ]) {
    assert.equal(
      await vehicleHasReservationConflict(
        database([row]),
        "car",
        start,
        end,
        now,
      ),
      false,
    );
  }
});
it("blocks active holds but excludes its own hold when converting it into a booking", async () => {
  const hold = {
    ...overlapping,
    status: "ACTIVE",
    expires: new Date(now.getTime() + 60_000),
  };
  assert.equal(
    await vehicleHasReservationConflict(
      database([], [hold]),
      "car",
      start,
      end,
      now,
    ),
    true,
  );
  assert.equal(
    await vehicleHasReservationConflict(
      database([], [hold]),
      "car",
      start,
      end,
      now,
      hold.id,
    ),
    false,
  );
  assert.equal(
    await vehicleHasReservationConflict(
      database([], [{ ...hold, expires: now }]),
      "car",
      start,
      end,
      now,
    ),
    false,
  );
  assert.equal(
    await vehicleHasReservationConflict(
      database([], [{ ...hold, status: "RELEASED" }]),
      "car",
      start,
      end,
      now,
    ),
    false,
  );
});
