"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Circle,
  ParkingSquare,
  Scale,
  Tags,
  Wallet,
} from "lucide-react";
import {
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";
import { bookingsApi } from "@/lib/api/bookings-api";
import { financeApi } from "@/lib/api/finance-api";
import { guardApi } from "@/lib/api/guard-api";
import { listingsApi } from "@/lib/api/listings-api";
import { managerApi } from "@/lib/api/manager-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { parkingRightsApi } from "@/lib/api/parking-rights-api";
import { propertyApi } from "@/lib/api/property-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatBDTFromPaisa, formatDateTime } from "@/lib/formatters";
import { bookingStatus } from "@/lib/marketplace-status";
import { queryKeys } from "@/lib/query-keys";

export default function ProviderDashboardPage() {
  const properties = useQuery({
    queryKey: queryKeys.properties.all(),
    queryFn: propertyApi.list,
  });
  const bookings = useQuery({
    queryKey: queryKeys.bookings.provider(),
    queryFn: () => bookingsApi.providerList(),
  });
  const earnings = useQuery({
    queryKey: queryKeys.earnings.summary(),
    queryFn: financeApi.earnings,
  });
  const rights = useQuery({
    queryKey: queryKeys.parkingRights.all(),
    queryFn: parkingRightsApi.list,
  });
  const listings = useQuery({
    queryKey: queryKeys.listings.all(),
    queryFn: listingsApi.list,
  });
  const guards = useQuery({
    queryKey: queryKeys.ownerGuardAssignments.all({ limit: 1 }),
    queryFn: () => guardApi.listForProvider({ limit: 1 }),
  });
  const managers = useQuery({
    queryKey: queryKeys.managerDelegations.provider,
    queryFn: managerApi.listForProvider,
  });
  const resourceQueries = useQueries({
    queries: (properties.data ?? [])
      .filter(
        (property) =>
          property.verificationStatus === "VERIFIED" &&
          property.status === "ACTIVE",
      )
      .map((property) => ({
        queryKey: queryKeys.parkingResources.byProperty(property.id),
        queryFn: () => parkingResourcesApi.list(property.id),
      })),
  });
  const resourceIds = resourceQueries.flatMap((query) =>
    (query.data ?? []).map((resource) => resource.id),
  );
  const availabilityQueries = useQueries({
    queries: resourceIds.map((resourceId) => ({
      queryKey: queryKeys.availability.byResource(resourceId),
      queryFn: () => parkingResourcesApi.availability(resourceId),
    })),
  });

  const coreQueries = [properties, bookings, earnings, rights, listings, guards, managers];
  const loading =
    coreQueries.some((query) => query.isPending) ||
    resourceQueries.some((query) => query.isPending) ||
    availabilityQueries.some((query) => query.isPending);
  const failed = coreQueries.find((query) => query.isError);

  if (loading) {
    return <ProviderPage><PageSkeleton label="Loading Provider overview" /></ProviderPage>;
  }
  if (failed) {
    return (
      <ProviderPage>
        <PageErrorState
          message={getApiErrorMessage(failed.error)}
          retry={() => void Promise.all(coreQueries.map((query) => query.refetch()))}
        />
      </ProviderPage>
    );
  }

  const propertyList = properties.data ?? [];
  const allResources = resourceQueries.flatMap((query) => query.data ?? []);
  const verifiedProperties = propertyList.filter(
    (property) => property.verificationStatus === "VERIFIED",
  );
  const verifiedRights = (rights.data ?? []).filter(
    (right) => right.status === "VERIFIED" && right.canList && right.canSetPrice,
  );
  const activeListings = (listings.data ?? []).filter(
    (listing) => listing.status === "ACTIVE",
  );
  const pendingRights = (rights.data ?? []).filter(
    (right) => right.status === "PENDING_VERIFICATION",
  );
  const hasAvailability = availabilityQueries.some(
    (query) => (query.data?.rules.length ?? 0) > 0,
  );
  const setupSteps = [
    {
      label: "Account ready",
      done: true,
      href: "/provider/security",
    },
    {
      label: "Add your first Property",
      done: propertyList.length > 0,
      href: propertyList[0] ? `/provider/properties/${propertyList[0].id}` : "/provider/properties/new",
    },
    {
      label: "Complete Property verification",
      done: verifiedProperties.length > 0,
      href: "/provider/properties",
    },
    {
      label: "Add a parking resource",
      done: allResources.length > 0,
      href: verifiedProperties[0]
        ? `/provider/properties/${verifiedProperties[0].id}#parking-workspace`
        : "/provider/properties",
    },
    {
      label: "Verify a commercial parking right",
      done: verifiedRights.length > 0,
      href: "/provider/parking",
    },
    {
      label: "Create a listing",
      done: (listings.data?.length ?? 0) > 0,
      href: "/provider/listings",
    },
    {
      label: "Set weekly availability",
      done: hasAvailability,
      href: "/provider/availability",
    },
    {
      label: "Activate a listing",
      done: activeListings.length > 0,
      href: "/provider/listings",
    },
    {
      label: "Add a Guard (optional)",
      done: (guards.data?.assignments.length ?? 0) > 0,
      href: "/provider/guards",
    },
    {
      label: "Invite a Manager (optional)",
      done: (managers.data?.length ?? 0) > 0,
      href: "/provider/managers",
    },
  ];
  const completedSteps = setupSteps.filter((step) => step.done).length;

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Provider overview"
        description="A live view of your marketplace setup, bookings, and earnings."
        actions={
          <Link
            href="/provider/properties/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#064E3B] px-4 text-sm font-semibold text-white"
          >
            Add Property<ArrowRight className="size-4" />
          </Link>
        }
      />

      {completedSteps < setupSteps.length && (
        <section className="border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">Marketplace setup</h2>
              <p className="mt-1 text-sm text-slate-600">
                {completedSteps} of {setupSteps.length} steps complete
              </p>
            </div>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200" aria-label={`${completedSteps} of ${setupSteps.length} setup steps complete`}>
              <div className="h-full bg-emerald-700" style={{ width: `${(completedSteps / setupSteps.length) * 100}%` }} />
            </div>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {setupSteps.map((step) => (
              <Link key={step.label} href={step.href} className="flex items-center gap-3 border-t py-3 text-sm font-medium hover:text-emerald-800">
                {step.done ? <Check className="size-4 text-emerald-700" /> : <Circle className="size-4 text-slate-400" />}
                <span className={step.done ? "text-slate-500 line-through" : "text-slate-900"}>{step.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={Building2} label="Properties" value={String(propertyList.length)} href="/provider/properties" />
        <Metric icon={ParkingSquare} label="Parking resources" value={String(allResources.length)} href="/provider/parking" />
        <Metric icon={Tags} label="Active listings" value={String(activeListings.length)} href="/provider/listings" />
        <Metric icon={Scale} label="Pending rights" value={String(pendingRights.length)} href="/provider/parking" />
        <Metric icon={CalendarDays} label="Bookings" value={String(bookings.data?.length ?? 0)} href="/provider/bookings" />
        <Metric icon={Wallet} label="Available earnings" value={formatBDTFromPaisa(earnings.data?.availableBalancePaisa ?? "0")} href="/provider/earnings" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Recent bookings</h2>
          <Link href="/provider/bookings" className="text-sm font-semibold text-emerald-800">View all</Link>
        </div>
        <div className="divide-y border bg-white">
          {bookings.data?.slice(0, 5).map((booking) => {
            const status = bookingStatus[booking.status];
            return (
              <Link key={booking.id} href={`/provider/bookings/${booking.id}`} className="grid gap-2 p-4 hover:bg-slate-50 sm:grid-cols-[1fr_auto]">
                <span>
                  <strong className="font-mono text-sm">{booking.bookingCode}</strong>
                  <span className="ml-2 text-xs text-slate-500">{booking.property?.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{formatDateTime(booking.startAt)}</span>
                </span>
                <span className={`h-fit rounded-full px-2 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
              </Link>
            );
          })}
          {bookings.data?.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600">Bookings will appear after an active listing is reserved.</p>
              {activeListings.length === 0 && <Link href="/provider/listings" className="mt-3 inline-flex text-sm font-semibold text-emerald-800">Continue listing setup</Link>}
            </div>
          )}
        </div>
      </section>
    </ProviderPage>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="border bg-white p-4 hover:border-emerald-700">
      <Icon className="size-5 text-emerald-700" />
      <small className="mt-3 block text-slate-500">{label}</small>
      <strong className="mt-1 block text-xl">{value}</strong>
    </Link>
  );
}
