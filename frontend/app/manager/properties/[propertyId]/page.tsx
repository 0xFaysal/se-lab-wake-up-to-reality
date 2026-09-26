"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleParking,
  Clock,
  DollarSign,
  ImageIcon,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  ManagerPage,
  ManagerPageErrorState,
  ManagerPageSkeleton,
} from "@/components/manager/manager-page";
import { managerApi, type ManagerPermission } from "@/lib/api/manager-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";

/** Maps a backend permission to a human-readable label */
const PERMISSION_LABELS: Record<ManagerPermission, string> = {
  RESOURCE_VIEW: "View Resources",
  LISTING_VIEW: "View Listings",
  LISTING_MANAGE: "Manage Listings",
  PRICE_MANAGE: "Manage Pricing",
  AVAILABILITY_MANAGE: "Manage Availability",
  BOOKING_VIEW: "View Bookings",
  BOOKING_MANAGE: "Manage Bookings",
  IMAGE_MANAGE: "Manage Images",
  GUARD_VIEW: "View Guards",
  GUARD_ADD_TO_PROPERTY: "Add Guards",
  GUARD_ASSIGN: "Assign Guards",
  EARNINGS_VIEW: "View Earnings",
  REPORTS_VIEW: "View Reports",
};

interface ScopedTabProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  locked?: boolean;
  lockedReason?: string;
  children?: React.ReactNode;
}

function ScopedSection({
  icon: Icon,
  label,
  description,
  locked,
  lockedReason,
  children,
}: ScopedTabProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white border border-slate-200">
          <Icon className="size-4 text-slate-700" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{label}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        {locked && (
          <span className="ml-auto rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            No access
          </span>
        )}
      </div>
      <div className="p-5">
        {locked ? (
          <p className="text-sm text-slate-500 italic">
            {lockedReason ??
              "This section is not included in your current delegation."}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export default function ManagerPropertyPage() {
  const { propertyId } = useParams<{ propertyId: string }>();

  const delegations = useQuery({
    queryKey: queryKeys.managerDelegations.manager,
    queryFn: managerApi.listForManager,
  });

  const delegation = delegations.data?.find(
    (item) => item.property.id === propertyId && item.status === "ACTIVE",
  );

  const can = (permission: ManagerPermission): boolean =>
    delegation?.permissions.includes(permission) ?? false;

  const resources = useQuery({
    queryKey: queryKeys.parkingResources.byProperty(propertyId),
    queryFn: () => parkingResourcesApi.list(propertyId),
    enabled: Boolean(delegation && can("RESOURCE_VIEW")),
  });

  if (delegations.isPending) {
    return (
      <ManagerPage>
        <ManagerPageSkeleton label="Loading delegated property" />
      </ManagerPage>
    );
  }

  if (delegations.isError) {
    return (
      <ManagerPage>
        <ManagerPageErrorState message={getApiErrorMessage(delegations.error)} />
      </ManagerPage>
    );
  }

  if (!delegation) {
    return (
      <ManagerPage>
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <ShieldCheck className="mx-auto size-10 text-slate-400" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Access unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            No active delegation grants you access to this Property. Check your
            Dashboard for pending invitations.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/manager/properties">
              <Button variant="outline">
                <ArrowLeft className="size-4" />
                All Properties
              </Button>
            </Link>
            <Link href="/manager/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </ManagerPage>
    );
  }

  const wholeProperty = delegation.resourceIds.length === 0;
  const scopeLabel = wholeProperty
    ? "Whole Property (all current and future resources)"
    : `${delegation.resourceIds.length} selected resource${delegation.resourceIds.length !== 1 ? "s" : ""}`;

  return (
    <ManagerPage>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-slate-500"
      >
        <Link href="/manager/dashboard" className="hover:text-slate-900">
          Manager Portal
        </Link>
        <span>/</span>
        <Link href="/manager/properties" className="hover:text-slate-900">
          Properties
        </Link>
        <span>/</span>
        <span aria-current="page" className="text-slate-800 font-medium">
          {delegation.property.name}
        </span>
      </nav>

      {/* Property Header */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200 shadow-sm">
            <Building2 className="size-6 text-[#064E3B]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="size-3.5" />
              Active delegated scope
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {delegation.property.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {delegation.property.publicArea}
              {delegation.provider && (
                <> · Provider: <strong>{delegation.provider.fullName}</strong></>
              )}
            </p>
          </div>
        </div>

        {/* Delegation meta */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600 border-t border-emerald-200 pt-4">
          <span>
            <strong>Resource scope:</strong> {scopeLabel}
          </span>
          {delegation.acceptedAt && (
            <span>
              <strong>Active since:</strong>{" "}
              {formatDateTime(delegation.acceptedAt)}
            </span>
          )}
          {delegation.validUntil && (
            <span className="text-amber-700">
              <Clock className="inline size-3 mr-1" />
              <strong>Expires:</strong> {formatDateTime(delegation.validUntil)}
            </span>
          )}
        </div>
      </div>

      {/* Permission badges */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Granted permissions
        </h2>
        <div className="flex flex-wrap gap-2">
          {delegation.permissions.map((permission) => (
            <span
              key={permission}
              className="rounded-lg bg-white border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800"
            >
              {PERMISSION_LABELS[permission] ?? permission.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Scoped Sections */}
      <div className="space-y-4">
        {/* Resources */}
        <ScopedSection
          icon={CircleParking}
          label="Parking Resources"
          description="View parking spots and resources within your delegated scope."
          locked={!can("RESOURCE_VIEW")}
          lockedReason="The RESOURCE_VIEW permission is required to see parking resources."
        >
          {resources.isPending ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Loading resources…
            </div>
          ) : resources.isError ? (
            <p className="text-sm text-red-700">
              {getApiErrorMessage(resources.error)}
            </p>
          ) : resources.data?.length === 0 ? (
            <p className="text-sm text-slate-500">
              No parking resources in this Property yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {resources.data?.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="font-semibold text-slate-900 text-sm">
                    {resource.displayName ||
                      resource.spotCode ||
                      "Parking resource"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {resource.resourceType.replaceAll("_", " ")} · Capacity{" "}
                    {resource.capacity} ·{" "}
                    <span
                      className={
                        resource.status === "ACTIVE"
                          ? "text-emerald-700"
                          : "text-slate-500"
                      }
                    >
                      {resource.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScopedSection>

        {/* Listings */}
        <ScopedSection
          icon={DollarSign}
          label="Listings &amp; Pricing"
          description="View and manage parking listings and pricing within your scope."
          locked={!can("LISTING_VIEW") && !can("LISTING_MANAGE")}
          lockedReason="The LISTING_VIEW or LISTING_MANAGE permission is required."
        >
          <div className="text-sm text-slate-600">
            <p>
              Listing management for this Property is available via the Provider
              portal or a dedicated manager listing UI (coming soon).
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Permissions granted:{" "}
              {can("LISTING_VIEW") ? "View" : ""}
              {can("LISTING_VIEW") && can("LISTING_MANAGE") ? " + " : ""}
              {can("LISTING_MANAGE") ? "Manage" : ""}
              {can("PRICE_MANAGE") ? " + Price Manage" : ""}
            </p>
          </div>
        </ScopedSection>

        {/* Bookings */}
        <ScopedSection
          icon={CalendarDays}
          label="Bookings"
          description="View and manage reservations within your delegated resource scope."
          locked={!can("BOOKING_VIEW") && !can("BOOKING_MANAGE")}
          lockedReason="The BOOKING_VIEW or BOOKING_MANAGE permission is required."
        >
          <div className="text-sm text-slate-600">
            <p>
              Booking management for this Property is available with your
              granted permissions.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Permissions granted:{" "}
              {can("BOOKING_VIEW") ? "View" : ""}
              {can("BOOKING_VIEW") && can("BOOKING_MANAGE") ? " + " : ""}
              {can("BOOKING_MANAGE") ? "Manage" : ""}
            </p>
          </div>
        </ScopedSection>

        {/* Guards */}
        <ScopedSection
          icon={Users}
          label="Guards"
          description="View, add, and assign Guards to this Property."
          locked={!can("GUARD_VIEW") && !can("GUARD_ADD_TO_PROPERTY") && !can("GUARD_ASSIGN")}
          lockedReason="The GUARD_VIEW, GUARD_ADD_TO_PROPERTY, or GUARD_ASSIGN permission is required."
        >
          <div className="text-sm text-slate-600">
            <p>Guard management is available within your granted scope.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {can("GUARD_VIEW") && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                  Can view guards
                </span>
              )}
              {can("GUARD_ADD_TO_PROPERTY") && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                  Can add guards
                </span>
              )}
              {can("GUARD_ASSIGN") && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                  Can assign guards
                </span>
              )}
            </div>
          </div>
        </ScopedSection>

        {/* Availability */}
        <ScopedSection
          icon={CalendarDays}
          label="Availability"
          description="Manage operating schedules and availability exceptions."
          locked={!can("AVAILABILITY_MANAGE")}
          lockedReason="The AVAILABILITY_MANAGE permission is required."
        >
          <p className="text-sm text-slate-600">
            Availability schedule management is available for your delegated
            resources.
          </p>
        </ScopedSection>

        {/* Images */}
        <ScopedSection
          icon={ImageIcon}
          label="Property Images"
          description="Upload and manage images for this Property."
          locked={!can("IMAGE_MANAGE")}
          lockedReason="The IMAGE_MANAGE permission is required."
        >
          <p className="text-sm text-slate-600">
            Property image management is available within your scope.
          </p>
        </ScopedSection>

        {/* Earnings */}
        <ScopedSection
          icon={DollarSign}
          label="Earnings"
          description="View settlement and earnings information for this Property."
          locked={!can("EARNINGS_VIEW")}
          lockedReason="The EARNINGS_VIEW permission is required."
        >
          <p className="text-sm text-slate-600">
            Earnings data for this Property is accessible within your scoped
            delegation.
          </p>
        </ScopedSection>
      </div>

      {/* Back link */}
      <div className="pt-4">
        <Link href="/manager/properties">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Back to Properties
          </Button>
        </Link>
      </div>
    </ManagerPage>
  );
}
