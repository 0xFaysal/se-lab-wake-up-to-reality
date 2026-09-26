"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
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
import { ManagerListingsSection } from "@/components/manager/sections/manager-listings-section";
import { ManagerAvailabilitySection } from "@/components/manager/sections/manager-availability-section";
import { ManagerBookingsSection } from "@/components/manager/sections/manager-bookings-section";
import { ManagerGuardsSection } from "@/components/manager/sections/manager-guards-section";
import { ManagerImagesSection } from "@/components/manager/sections/manager-images-section";
import { ManagerEarningsSection } from "@/components/manager/sections/manager-earnings-section";
import { managerApi, type ManagerPermission } from "@/lib/api/manager-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";

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

interface ScopedSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  locked: boolean;
  lockedReason?: string;
  children: React.ReactNode;
}

function ScopedSection({
  icon: Icon,
  label,
  description,
  locked,
  lockedReason,
  children,
}: ScopedSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white border border-slate-200">
          <Icon className="size-4 text-slate-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-slate-900">{label}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        {locked && (
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
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
  const resourceIds = delegation.resourceIds;
  const scopeLabel = wholeProperty
    ? "Whole Property (all current and future resources)"
    : `${resourceIds.length} selected resource${resourceIds.length !== 1 ? "s" : ""}`;

  const resourceList = resources.data ?? [];

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
        <span aria-current="page" className="font-medium text-slate-800">
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
                <>
                  {" "}· Provider:{" "}
                  <strong>{delegation.provider.fullName}</strong>
                </>
              )}
            </p>
          </div>
        </div>

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
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Your granted permissions
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

      {/* === SCOPED WORKSPACE SECTIONS === */}
      <div className="space-y-4">

        {/* 1. Parking Resources */}
        <ScopedSection
          icon={CircleParking}
          label="Parking Resources"
          description="Parking spots and resources within your delegated scope."
          locked={!can("RESOURCE_VIEW")}
          lockedReason="RESOURCE_VIEW permission is required."
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
          ) : resourceList.length === 0 ? (
            <p className="text-sm text-slate-500">
              No parking resources in this Property yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {resourceList.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="font-semibold text-slate-900 text-sm">
                    {resource.displayName || resource.spotCode || "Resource"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {resource.resourceType.replaceAll("_", " ")} · Capacity{" "}
                    {resource.capacity}
                    {resource.floor && ` · Floor ${resource.floor}`}
                    {resource.zone && ` · Zone ${resource.zone}`}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                      resource.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {resource.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScopedSection>

        {/* 2. Listings & Pricing */}
        <ScopedSection
          icon={DollarSign}
          label="Listings &amp; Pricing"
          description={`View listings${can("LISTING_MANAGE") ? " · Activate / Pause" : ""}${can("PRICE_MANAGE") ? " · Edit prices" : ""}`}
          locked={!can("LISTING_VIEW") && !can("LISTING_MANAGE")}
          lockedReason="LISTING_VIEW or LISTING_MANAGE permission is required."
        >
          <ManagerListingsSection
            propertyId={propertyId}
            resourceIds={resourceIds}
            canManage={can("LISTING_MANAGE")}
            canPrice={can("PRICE_MANAGE")}
          />
        </ScopedSection>

        {/* 3. Availability */}
        <ScopedSection
          icon={CalendarDays}
          label="Availability"
          description="View schedules and block unavailable periods for each resource."
          locked={!can("AVAILABILITY_MANAGE")}
          lockedReason="AVAILABILITY_MANAGE permission is required."
        >
          <ManagerAvailabilitySection resources={resourceList} />
        </ScopedSection>

        {/* 4. Bookings */}
        <ScopedSection
          icon={CalendarDays}
          label="Bookings"
          description={`View bookings in scope${can("BOOKING_MANAGE") ? " · Full manage access" : ""}`}
          locked={!can("BOOKING_VIEW") && !can("BOOKING_MANAGE")}
          lockedReason="BOOKING_VIEW or BOOKING_MANAGE permission is required."
        >
          <ManagerBookingsSection
            propertyId={propertyId}
            resourceIds={resourceIds}
          />
        </ScopedSection>

        {/* 5. Guards */}
        <ScopedSection
          icon={Users}
          label="Guards"
          description={`View guards${can("GUARD_ADD_TO_PROPERTY") ? " · Invite guards" : ""}${can("GUARD_ASSIGN") ? " · Assign shifts" : ""}`}
          locked={
            !can("GUARD_VIEW") &&
            !can("GUARD_ADD_TO_PROPERTY") &&
            !can("GUARD_ASSIGN")
          }
          lockedReason="GUARD_VIEW, GUARD_ADD_TO_PROPERTY, or GUARD_ASSIGN permission is required."
        >
          <ManagerGuardsSection
            propertyId={propertyId}
            canAdd={can("GUARD_ADD_TO_PROPERTY")}
            canAssign={can("GUARD_ASSIGN")}
          />
        </ScopedSection>

        {/* 6. Images */}
        <ScopedSection
          icon={ImageIcon}
          label="Property Images"
          description="Upload and manage images for this Property."
          locked={!can("IMAGE_MANAGE")}
          lockedReason="IMAGE_MANAGE permission is required."
        >
          <ManagerImagesSection propertyId={propertyId} />
        </ScopedSection>

        {/* 7. Earnings */}
        <ScopedSection
          icon={Banknote}
          label="Earnings"
          description="View earnings and settlement information."
          locked={!can("EARNINGS_VIEW")}
          lockedReason="EARNINGS_VIEW permission is required."
        >
          <ManagerEarningsSection />
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
