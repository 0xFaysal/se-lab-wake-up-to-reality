import { ManagerDelegationPermission } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import {
  bookingGraceWindow,
  ENTRY_GRACE_MS,
} from "../../common/booking-grace.js";
import { AppError } from "../../common/errors/app-error.js";
import {
  listProviderAccessScopes,
  resolveProviderAuthority,
} from "./marketplace.repository.js";
import { isResourceAvailable } from "./marketplace.service.js";
import {
  bookingSegments,
  clipSegment,
  dhakaDay,
  projectAvailability,
  type TimelineSegment,
} from "./session-timeline.model.js";

// This projection deliberately does not run lifecycle reconciliation or release holds.
export async function getSessionTimeline(
  actorId: string,
  propertyId: string,
  date: string,
) {
  const authority = await resolveProviderAuthority(
    actorId,
    propertyId,
    ManagerDelegationPermission.BOOKING_VIEW,
  );
  if (!authority)
    throw new AppError({
      statusCode: 403,
      code: "PROPERTY_ACCESS_DENIED",
      message: "You do not have access to this property's sessions",
    });
  const scopes = await listProviderAccessScopes(
    actorId,
    ManagerDelegationPermission.BOOKING_VIEW,
  );
  const { start, end } = dhakaDay(date),
    now = new Date();
  const resources = await prisma.parkingSpot.findMany({
    where: {
      propertyId,
      deletedAt: null,
      OR: scopes.map((scope) => ({
        providerMembershipId: scope.providerMembershipId,
        ...(scope.resourceIds ? { id: { in: scope.resourceIds } } : {}),
      })),
    },
    include: {
      property: {
        select: {
          name: true,
          status: true,
          temporaryClosedAt: true,
          temporaryClosedUntil: true,
        },
      },
      units: { where: { deletedAt: null }, orderBy: { spotCode: "asc" } },
      availabilityRules: true,
      availabilityExceptions: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const resourceIds = resources.map((r) => r.id);
  const allocations = await prisma.parkingAllocation.findMany({
    where: {
      parkingSpotId: { in: resourceIds },
      OR: [
        {
          startAt: { lt: new Date(+end + ENTRY_GRACE_MS) },
          endAt: { gt: new Date(+start - 180 * 60_000) },
          OR: [
            { status: "BOOKED" },
            {
              status: "HELD",
              expiresAt: { gt: now },
              hold: { status: "ACTIVE", expiresAt: { gt: now } },
            },
          ],
        },
        {
          booking: {
            checkedInAt: { lt: end },
            checkedOutAt: null,
            status: { in: ["CHECKED_IN", "CHECKOUT_REQUESTED", "PAYMENT_DUE"] },
          },
        },
      ],
    },
    select: {
      id: true,
      parkingSpotId: true,
      parkingResourceUnitId: true,
      capacityUnit: true,
      startAt: true,
      endAt: true,
      status: true,
      booking: {
        select: {
          id: true,
          startAt: true,
          scheduledEndAt: true,
          overtimeGracePeriodMinutes: true,
          checkedInAt: true,
          checkedOutAt: true,
        },
      },
    },
  });
  const bookings = await prisma.booking.findMany({
    where: {
      propertyId,
      parkingSpotId: { in: resourceIds },
      listing: {
        providerMembershipId: { in: scopes.map((s) => s.providerMembershipId) },
      },
      OR: [
        {
          startAt: { lt: new Date(+end + ENTRY_GRACE_MS) },
          scheduledEndAt: { gt: new Date(+start - 180 * 60_000) },
          status: {
            in: [
              "CONFIRMED",
              "CHECKED_IN",
              "CHECKOUT_REQUESTED",
              "COMPLETED",
              "PAYMENT_DUE",
            ],
          },
        },
        {
          checkedInAt: { lt: end },
          checkedOutAt: null,
          status: { in: ["CHECKED_IN", "CHECKOUT_REQUESTED", "PAYMENT_DUE"] },
        },
      ],
    },
    select: {
      id: true,
      bookingCode: true,
      parkingSpotId: true,
      parkingResourceUnitId: true,
      startAt: true,
      scheduledEndAt: true,
      checkedInAt: true,
      checkedOutAt: true,
      checkoutRequestedAt: true,
      overtimeGracePeriodMinutes: true,
      overtimePolicyVersion: true,
      driver: { select: { fullName: true } },
      vehicle: { select: { registrationNumber: true } },
    },
  });
  const rows = [];
  for (const resource of resources) {
    const edges = new Set<number>([+start, +end]);
    for (const rule of resource.availabilityRules)
      for (const time of [rule.startLocalTime, rule.endLocalTime])
        edges.add(
          +new Date(`${date}T${time.toISOString().slice(11, 19)}+06:00`),
        );
    for (const exception of resource.availabilityExceptions) {
      edges.add(Math.max(+start, Math.min(+end, +exception.startsAt)));
      edges.add(Math.max(+start, Math.min(+end, +exception.endsAt)));
    }
    for (const boundary of [
      resource.property.temporaryClosedAt,
      resource.property.temporaryClosedUntil,
    ])
      if (boundary) edges.add(Math.max(+start, Math.min(+end, +boundary)));
    const sorted = [...edges].sort((a, b) => a - b),
      open: Array<{ start: number; end: number }> = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i]!,
        b = sorted[i + 1]!;
      if (
        resource.status === "ACTIVE" &&
        (await isResourceAvailable(resource, new Date(a), new Date(b - 1)))
      )
        open.push({ start: a, end: b });
    }
    const units =
      resource.resourceType === "SHARED_POOL" ? [null] : resource.units;
    for (const unit of units) {
      const own = bookings.filter(
        (b) =>
          b.parkingSpotId === resource.id &&
          (!unit || b.parkingResourceUnitId === unit.id),
      );
      const occupied = allocations.filter(
        (a) =>
          a.parkingSpotId === resource.id &&
          (!unit ||
            !a.parkingResourceUnitId ||
            a.parkingResourceUnitId === unit.id),
      );
      const segments: TimelineSegment[] = own.flatMap((b) =>
        bookingSegments(b, end, now),
      );
      const blocked = resource.availabilityExceptions.filter(
        (exception) => exception.exceptionType === "BLOCKED",
      );
      for (const exception of blocked)
        segments.push({
          id: `${unit?.id ?? resource.id}:blocked:${exception.id}`,
          startAt: exception.startsAt.toISOString(),
          endAt: exception.endsAt.toISOString(),
          kind: "BLOCKED",
          label: "Blocked by availability schedule",
        });
      for (const allocation of occupied) {
        if (
          allocation.booking &&
          own.some((b) => b.id === allocation.booking!.id)
        )
          continue;
        const reserved = allocation.booking
          ? bookingGraceWindow(
              allocation.booking.startAt,
              allocation.booking.scheduledEndAt,
              allocation.booking.overtimeGracePeriodMinutes,
            )
          : { startAt: allocation.startAt, endAt: allocation.endAt };
        segments.push({
          id: allocation.id,
          startAt: new Date(
            Math.min(+allocation.startAt, +reserved.startAt),
          ).toISOString(),
          endAt: (allocation.booking?.checkedInAt &&
          !allocation.booking.checkedOutAt
            ? end
            : new Date(Math.max(+allocation.endAt, +reserved.endAt))
          ).toISOString(),
          kind: allocation.status === "HELD" ? "HOLD" : "BLOCKED",
          label: allocation.status === "HELD" ? "Temporary hold" : "Occupied",
        });
      }
      const availability = projectAvailability(
        start,
        end,
        unit ? 1 : resource.capacity,
        unit && unit.status !== "ACTIVE" ? [] : open,
        occupied.map((a) => {
          const window = a.booking
            ? bookingGraceWindow(
                a.booking.startAt,
                a.booking.scheduledEndAt,
                a.booking.overtimeGracePeriodMinutes,
              )
            : { startAt: a.startAt, endAt: a.endAt };
          return {
            start: Math.min(
              +a.startAt,
              +window.startAt,
              a.booking?.checkedInAt ? +a.booking.checkedInAt : Infinity,
            ),
            end:
              a.booking?.checkedInAt && !a.booking.checkedOutAt
                ? +end
                : Math.max(+a.endAt, +window.endAt),
            // capacityUnit identifies a pool slot; each allocation is one vehicle.
            count: 1,
          };
        }),
        blocked.map((exception) => ({
          start: +exception.startsAt,
          end: +exception.endsAt,
        })),
      );
      rows.push({
        id: unit?.id ?? resource.id,
        resourceId: resource.id,
        resourceName: resource.displayName ?? resource.spotCode ?? "Parking",
        unitName: unit?.displayName ?? unit?.spotCode ?? "Shared pool",
        resourceType: resource.resourceType,
        capacity: unit ? 1 : resource.capacity,
        status: unit?.status ?? resource.status,
        segments: segments
          .map((s) => clipSegment(s, start, end))
          .filter((s) => s !== null),
        availability,
      });
    }
  }
  return {
    propertyId,
    propertyName: resources[0]?.property.name ?? "Property",
    date,
    timezone: "Asia/Dhaka" as const,
    serverNow: now.toISOString(),
    dayStart: start.toISOString(),
    dayEnd: end.toISOString(),
    rows,
  };
}
