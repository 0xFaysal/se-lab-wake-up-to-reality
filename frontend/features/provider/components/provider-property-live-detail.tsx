"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Edit3,
  ImageIcon,
  MapPin,
  ParkingSquare,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";
import { Button } from "@/components/ui/button";
import { ProviderMarketplacePanel } from "@/features/marketplace/components/provider-marketplace-panel";
import { PropertyImageManager } from "@/features/provider/components/property-image-manager";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { PropertyDetailDto } from "@/lib/api/api-types";
import { propertyApi } from "@/lib/api/property-api";
import { formatDateTime } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

const workspaceLinks = [
  { label: "Overview", href: "#overview", icon: Building2 },
  { label: "Images", href: "#images", icon: ImageIcon },
  { label: "Parking setup", href: "#parking-workspace", icon: ParkingSquare },
] as const;

export function OwnerPropertyLiveDetail({ propertyId }: { propertyId: string }) {
  const client = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const property = useQuery({
    queryKey: queryKeys.properties.detail(propertyId),
    queryFn: () => propertyApi.detail(propertyId),
  });
  const remove = useMutation({
    mutationFn: () => propertyApi.remove(propertyId),
    onSuccess: async () => {
      client.removeQueries({ queryKey: queryKeys.properties.detail(propertyId) });
      await client.invalidateQueries({ queryKey: queryKeys.properties.root });
      window.location.assign("/provider/properties");
    },
  });

  if (property.isPending) {
    return <ProviderPage><PageSkeleton label="Loading property workspace" /></ProviderPage>;
  }
  if (property.isError || !property.data) {
    return (
      <ProviderPage>
        <PageErrorState
          message={getApiErrorMessage(property.error)}
          retry={() => void property.refetch()}
        />
      </ProviderPage>
    );
  }

  const item = property.data;
  const isMarketplaceReady =
    item.verificationStatus === "VERIFIED" && item.status === "ACTIVE";

  return (
    <ProviderPage>
      <ProviderPageHeader
        title={item.name}
        description={`${item.approximateAddress} · Manage verification, images, parking inventory, staffing, and marketplace readiness.`}
        breadcrumbs={[
          { label: "Properties", href: "/provider/properties" },
          { label: item.name },
        ]}
        actions={
          <>
            <Link
              href={`/provider/properties/${item.id}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded-md border bg-white px-4 text-sm font-semibold"
            >
              <Edit3 className="size-4" />Edit
            </Link>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" />Delete
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <StatusBadge
          label={item.verificationStatus.replaceAll("_", " ")}
          tone={
            item.verificationStatus === "VERIFIED"
              ? "success"
              : item.verificationStatus === "REJECTED"
                ? "danger"
                : "warning"
          }
        />
        <StatusBadge
          label={item.status.replaceAll("_", " ")}
          tone={item.status === "ACTIVE" ? "success" : "neutral"}
        />
      </div>

      <PropertyJourney item={item} />

      {item.verificationStatus === "PENDING" && (
        <section className="border-l-4 border-amber-500 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <h2 className="font-bold">Property verification is pending</h2>
          <p className="mt-1 leading-6">
            You can upload clear property and entrance photos now. Parking resources,
            rights, and public listings become available after an Admin verifies the Property.
          </p>
        </section>
      )}
      {item.rejectionReason && (
        <section className="border-l-4 border-red-600 bg-red-50 px-5 py-4 text-sm text-red-800">
          <h2 className="font-bold">Verification needs changes</h2>
          <p className="mt-1">{item.rejectionReason}</p>
        </section>
      )}

      <nav aria-label="Property workspace" className="flex flex-wrap gap-2 border-b pb-4">
        {workspaceLinks.map(({ label, href, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold text-slate-700 hover:border-emerald-700 hover:text-emerald-800"
          >
            <Icon className="size-4" />{label}
          </a>
        ))}
        <Link
          href={`/provider/guards?propertyId=${item.id}`}
          className="inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold text-slate-700"
        >
          <Users className="size-4" />Guards
        </Link>
        <Link
          href="/provider/managers"
          className="inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold text-slate-700"
        >
          <UserCog className="size-4" />Managers
        </Link>
      </nav>

      <section id="overview" className="scroll-mt-24 border-b pb-8">
        <h2 className="text-lg font-bold">Property overview</h2>
        <div className="mt-4 grid gap-x-10 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
          <Info label="Public area" value={item.publicArea} />
          <Info label="Exact address (private)" value={item.exactAddress} />
          <Info label="Coordinates" value={`${item.latitude}, ${item.longitude}`} />
          <Info label="Access instructions" value={item.accessInstructions ?? "Not provided"} />
          <Info label="Parking rules" value={item.generalParkingRules ?? "Not provided"} />
          <Info label="Safety rules" value={item.commonSafetyRules ?? "Not provided"} />
        </div>
        <div className="mt-6 flex flex-wrap gap-5 border-t pt-5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="size-4" />Created {formatDateTime(item.createdAt)}
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4" />
            {item.verifiedAt ? `Verified ${formatDateTime(item.verifiedAt)}` : "Not yet verified"}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4" />Location changes may require reverification
          </span>
        </div>
      </section>

      <section id="images" className="scroll-mt-24 border-b pb-8">
        <PropertyImageManager propertyId={propertyId} />
      </section>

      <section id="parking-workspace" className="scroll-mt-24">
        {isMarketplaceReady ? (
          <ProviderMarketplacePanel propertyId={propertyId} />
        ) : (
          <div className="border border-dashed bg-white px-6 py-10 text-center">
            <ParkingSquare className="mx-auto size-8 text-slate-400" />
            <h2 className="mt-3 font-bold">Parking setup is locked</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              The Property must be verified and active before parking resources,
              commercial rights, availability, and listings can be configured.
            </p>
          </div>
        )}
      </section>

      {remove.isError && (
        <p role="alert" className="bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(remove.error)}
        </p>
      )}
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setConfirmDelete(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Property?</AlertDialogTitle>
            <AlertDialogDescription>
              Deletion is blocked while images, parking resources, or active Guard
              assignments exist. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProviderPage>
  );
}

function PropertyJourney({ item }: { item: PropertyDetailDto }) {
  const verified = item.verificationStatus === "VERIFIED" && item.status === "ACTIVE";
  const rejected = item.verificationStatus === "REJECTED";
  const steps = [
    { label: "Details submitted", detail: "Property and location saved", complete: true },
    { label: "Admin verification", detail: verified ? "Property approved" : rejected ? "Changes requested" : "Security review in progress", complete: verified, current: !verified },
    { label: "Parking setup", detail: verified ? "Add spaces and confirm authority" : "Available after approval", complete: false, current: verified },
    { label: "Publish", detail: "Set availability and pricing", complete: false, current: false },
  ];
  return <section aria-labelledby="property-journey-title" className="border-y bg-slate-50 px-4 py-4 sm:px-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase text-emerald-800">Onboarding</p><h2 id="property-journey-title" className="mt-1 font-bold">From property to live parking</h2></div><span className="text-xs font-semibold text-slate-500">{verified ? "Next: add parking" : rejected ? "Action required" : "Verification in progress"}</span></div><ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{steps.map((step) => { const Icon = step.complete ? CheckCircle2 : step.current ? Clock3 : Circle; return <li key={step.label} className="flex items-start gap-2 border-l-2 border-slate-200 pl-3"><Icon className={`mt-0.5 size-4 shrink-0 ${step.complete ? "text-emerald-700" : step.current ? rejected ? "text-red-600" : "text-amber-600" : "text-slate-400"}`} /><div><p className="text-xs font-bold text-slate-900">{step.label}</p><p className="mt-0.5 text-xs text-slate-500">{step.detail}</p></div></li>; })}</ol></section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <dl>
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm leading-6 text-slate-900">{value}</dd>
    </dl>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const tones = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-900",
    danger: "bg-red-100 text-red-800",
    neutral: "bg-slate-100 text-slate-700",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{label}</span>;
}
