"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  useQuery,
  useQueryClient,
  useMutation,
  useIsMutating,
} from "@tanstack/react-query";
import {
  Building2,
  ParkingSquare,
  CalendarClock,
  ImagePlus,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageErrorState,
  PageSkeleton,
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";
import { PropertyImageManager } from "./property-image-manager";
import { propertyApi } from "@/lib/api/property-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { parkingRightsApi } from "@/lib/api/parking-rights-api";
import { listingsApi } from "@/lib/api/listings-api";
import { queryKeys } from "@/lib/query-keys";
import { getApiErrorMessage } from "@/lib/api/api-error";
import type { VehicleType } from "@/lib/api/api-types";
import type {
  ParkingResourceDto,
  ParkingRightDto,
  ParkingRightType,
  ParkingListingDto,
  AvailabilityRuleDto,
} from "@/lib/api/marketplace-types";
import { vehicleRatePlan, SetupValidationError } from "@/lib/vehicle-rate-plan";
import { formatBDTFromPaisa } from "@/lib/formatters";
import { paisaToBDTInput } from "@/lib/listing-payload";
import { dhakaDate } from "@/lib/provider-session-display";
import { toast } from "sonner";
import { useUnsavedNavigation } from "@/hooks/use-unsaved-navigation";
import { ListingRateEditor } from "@/features/marketplace/components/listing-rate-editor";
import { availabilityTimeInput } from "@/lib/availability-time";

const vehicleLabels: Record<VehicleType, string> = {
  MOTORCYCLE: "Motorcycle",
  SEDAN: "Sedan",
  SUV: "SUV",
  MICROBUS: "Microbus",
};
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const steps = [
  { label: "Spaces & amenities", icon: ParkingSquare },
  { label: "Availability & rates", icon: CalendarClock },
  { label: "Photos", icon: ImagePlus },
  { label: "Review & publish", icon: Check },
];

function setupError(failure: unknown) {
  return failure instanceof SetupValidationError
    ? failure.message
    : getApiErrorMessage(failure);
}

export function ParkingListingSetup({
  propertyId,
  embedded = false,
}: {
  propertyId: string;
  embedded?: boolean;
}) {
  const Container = embedded ? "div" : ProviderPage;
  const setupSteps = embedded ? [steps[0], steps[1], steps[3]] : steps;
  const client = useQueryClient();
  const busy = useIsMutating() > 0;
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const [dirty, setDirty] = useState(false);
  const [rateEdits, setRateEdits] = useState<Record<string, boolean>>({});
  const onRateDirty = useCallback((id: string, value: boolean) => {
    setRateEdits((current) => current[id] === value ? current : { ...current, [id]: value });
  }, []);
  const navigation = useUnsavedNavigation(dirty || Object.values(rateEdits).some(Boolean));
  function move(next: number) {
    if (busy) return;
    navigation.confirmLeave(() => {
      setDirty(false);
      setStep(next);
    });
  }
  const property = useQuery({
    queryKey: queryKeys.properties.detail(propertyId),
    queryFn: () => propertyApi.detail(propertyId),
  });
  const ready =
    property.data?.verificationStatus === "VERIFIED" &&
    property.data.status === "ACTIVE";
  const resources = useQuery({
    queryKey: queryKeys.parkingResources.byProperty(propertyId),
    queryFn: () => parkingResourcesApi.list(propertyId),
    enabled: ready,
  });
  const rights = useQuery({
    queryKey: queryKeys.parkingRights.all({ propertyId }),
    queryFn: parkingRightsApi.list,
    enabled: ready,
  });
  const listings = useQuery({
    queryKey: queryKeys.listings.all({ propertyId }),
    queryFn: listingsApi.list,
    enabled: ready,
  });
  async function refresh() {
    await client.invalidateQueries({
      queryKey: queryKeys.parkingResources.root,
    });
    await client.invalidateQueries({ queryKey: queryKeys.parkingRights.root });
    await client.invalidateQueries({ queryKey: queryKeys.listings.root });
    await client.invalidateQueries({ queryKey: queryKeys.parkingSearch.root });
  }
  if (
    property.isPending ||
    (ready && (resources.isPending || rights.isPending || listings.isPending))
  )
    return (
      <ProviderPage>
        <PageSkeleton label="Loading parking setup" />
      </ProviderPage>
    );
  if (
    property.isError ||
    resources.isError ||
    rights.isError ||
    listings.isError
  )
    return (
      <ProviderPage>
        <PageErrorState
          message={getApiErrorMessage(
            property.error ?? resources.error ?? rights.error ?? listings.error,
          )}
          retry={() => {
            void property.refetch();
            void refresh();
          }}
        />
      </ProviderPage>
    );
  const item = property.data!;
  const resource =
    resources.data?.find((entry) => entry.id === selected) ??
    resources.data?.[0];
  const resourceIds = new Set(resources.data?.map((entry) => entry.id));
  const offers = (listings.data ?? []).filter((offer) =>
    resourceIds.has(offer.parkingSpotId),
  );
  const linkedRights = (rights.data ?? []).filter(
    (right) => right.parkingSpotId === resource?.id,
  );
  const right = linkedRights.find(
    (entry) =>
      entry.status === "VERIFIED" &&
      entry.canList &&
      entry.canSetPrice &&
      new Date(entry.validFrom).getTime() <= now &&
      (!entry.validUntil || new Date(entry.validUntil).getTime() > now),
  );
  return (
    <Container className="max-w-7xl">
      {navigation.guard}
      {!embedded && (
        <ProviderPageHeader
          title="Set up your parking"
          description={item.name}
          breadcrumbs={[
            { label: "Properties", href: "/provider/properties" },
            { label: item.name, href: `/provider/properties/${item.id}` },
            { label: "Parking setup" },
          ]}
          actions={
            <Link href={`/provider/properties/${propertyId}`}>
              <Button variant="outline">
                <Building2 className="size-4" />
                Property workspace
              </Button>
            </Link>
          }
        />
      )}
      {!ready ? (
        <section className="border-l-4 border-amber-500 bg-amber-50 p-5">
          <h2 className="font-bold">Property verification required</h2>
          <p className="mt-2 text-sm">
            {item.rejectionReason ??
              "Your property must be active and verified before spaces can be added. Photos can be uploaded while review is pending."}
          </p>
          <div className="mt-6">
            <PropertyImageManager propertyId={propertyId} />
          </div>
        </section>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[210px_minmax(0,1fr)]">
          <nav aria-label="Parking setup steps" className="lg:sticky lg:top-24">
            <p className="mb-3 text-xs font-semibold text-slate-500">
              PARKING SETUP
            </p>
            <ol className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {setupSteps.map(({ label, icon: Icon }, index) => (
                <li key={label}>
                  <Button
                    variant={step === index ? "default" : "ghost"}
                    className="h-auto min-h-11 w-full justify-start whitespace-normal text-left"
                    onClick={() => move(index)}
                    disabled={busy}
                    aria-current={step === index ? "step" : undefined}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Button>
                </li>
              ))}
            </ol>
            <div className="mt-5 border-t pt-4 text-xs leading-5 text-slate-600">
              <ShieldCheck className="mb-2 size-5 text-emerald-700" />
              Property verified. Commercial rights must also be approved before
              publishing.
            </div>
          </nav>
          <div
            className="min-w-0 space-y-6"
            onChangeCapture={(event) => {
              const form = (event.target as Element).closest("form");
              if (form && !form.hasAttribute("data-independent-rate")) setDirty(true);
            }}
          >
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
              <h2 className="text-xl font-semibold">
                {setupSteps[step].label}
              </h2>
              <span className="text-xs text-slate-500">
                Step {step + 1} of {setupSteps.length}
              </span>
            </div>
            {step === 0 && (
              <SpacesStep
                propertyId={propertyId}
                resources={resources.data ?? []}
                rights={rights.data ?? []}
                onDirty={() => setDirty(true)}
                refresh={refresh}
                onSelect={(id) => {
                  setDirty(false);
                  setSelected(id);
                }}
              />
            )}
            {step === 1 && (
              <>
                <Field label="Parking area">
                  <Select
                    disabled={busy}
                    value={resource?.id ?? ""}
                    onValueChange={(value) =>
                      value &&
                      navigation.confirmLeave(() => {
                        setDirty(false);
                        setSelected(value);
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Add parking spaces first">
                        {resource?.displayName}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {resources.data?.map((entry) => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {entry.displayName ?? "Parking area"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {resource ? (
                  <PricingStep
                    key={`${resource.id}:${right?.id ?? "pending"}`}
                    onRateDirty={onRateDirty}
                    onDirty={() => setDirty(true)}
                    resource={resource}
                    right={right}
                    offers={offers.filter(
                      (offer) => offer.parkingSpotId === resource.id,
                    )}
                    refresh={refresh}
                    onDone={() => {
                      setDirty(false);
                      setStep(2);
                    }}
                  />
                ) : (
                  <p className="text-sm text-slate-600">
                    Add spaces before setting availability and rates.
                  </p>
                )}
              </>
            )}
            {step === 2 &&
              (embedded ? (
                <ReviewStep offers={offers} refresh={refresh} />
              ) : (
                <PropertyImageManager propertyId={propertyId} />
              ))}
            {step === 3 && <ReviewStep offers={offers} refresh={refresh} />}
            <footer className="flex items-center justify-between gap-3 border-t pt-4">
              <Button
                variant="outline"
                disabled={step === 0 || busy}
                onClick={() => move(step - 1)}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              {step < setupSteps.length - 1 && (
                <Button disabled={busy} onClick={() => move(step + 1)}>
                  Continue
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </footer>
          </div>
        </div>
      )}
    </Container>
  );
}

function SpacesStep({
  propertyId,
  resources,
  rights,
  refresh,
  onSelect,
  onDirty,
}: {
  propertyId: string;
  resources: ParkingResourceDto[];
  rights: ParkingRightDto[];
  refresh: () => Promise<void>;
  onSelect: (id: string) => void;
  onDirty: () => void;
}) {
  const [open, setOpen] = useState(resources.length === 0);
  const [vehicles, setVehicles] = useState<VehicleType[]>(["SEDAN"]);
  const [rightType, setRightType] = useState<ParkingRightType>("OWNERSHIP");
  const [error, setError] = useState("");
  const save = useMutation({
    mutationFn: async (data: FormData) => {
      const name = String(data.get("name") ?? "").trim(),
        prefix = String(data.get("prefix") ?? "").trim();
      const count = Number(data.get("count"));
      if (
        name.length < 2 ||
        name.length > 120 ||
        !/^[A-Za-z0-9-]{1,20}$/.test(prefix) ||
        !Number.isInteger(count) ||
        count < 1 ||
        count > 100 ||
        !vehicles.length
      )
        throw new SetupValidationError(
          "Enter an area name, a short letter/number spot prefix, 1-100 spaces and at least one vehicle type.",
        );
      const result = await parkingResourcesApi.createBulk(propertyId, {
        resource: {
          type: "FIXED_SPACE",
          displayName: name,
          supportedVehicleTypes: vehicles,
          isCovered: data.get("covered") === "on",
          hasCctv: data.get("cctv") === "on",
          hasGuard: data.get("guard") === "on",
        },
        units: Array.from({ length: count }, (_, i) => ({
          spotCode: `${prefix}-${String(i + 1).padStart(2, "0")}`,
        })),
      });
      onSelect(result.resource.id);
      setOpen(false);
      // Keep the created inventory even if the separate authority request fails.
      try {
        await parkingRightsApi.claim(result.resource.id, {
          rightType,
          quantity: result.resource.capacity,
          canUse: true,
          canList: true,
          canSetPrice: true,
          canManageBookings: true,
          canDelegateManager: false,
        });
      } catch (failure) {
        setError(
          `Spaces saved. Authority request needs retry: ${getApiErrorMessage(failure)}`,
        );
        return false;
      }
      return true;
    },
    onSuccess: async (claimed) => {
      toast.success(
        claimed
          ? "Spaces saved; commercial rights requested"
          : "Spaces saved; authority request still required",
      );
      await refresh();
    },
    onError: (failure) => setError(setupError(failure)),
    onSettled: refresh,
  });
  const claim = useMutation({
    mutationFn: (resource: ParkingResourceDto) =>
      parkingRightsApi.claim(resource.id, {
        rightType,
        quantity: resource.capacity,
        canUse: true,
        canList: true,
        canSetPrice: true,
        canManageBookings: true,
        canDelegateManager: false,
      }),
    onSuccess: refresh,
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-600">
          {resources.reduce((sum, entry) => sum + entry.capacity, 0)} spaces
          configured
        </span>
        <Button
          variant="outline"
          disabled={open || save.isPending}
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" />
          Add spaces
        </Button>
      </div>
      <Field label="Authority to operate">
        <Select
          value={rightType}
          disabled={save.isPending || claim.isPending}
          onValueChange={(value) =>
            value && setRightType(value as ParkingRightType)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {rightType === "OWNERSHIP"
                ? "I own these spaces"
                : rightType === "COMMERCIAL_LEASE"
                  ? "Commercial lease"
                  : "Owner-authorized operation"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OWNERSHIP">I own these spaces</SelectItem>
            <SelectItem value="COMMERCIAL_LEASE">Commercial lease</SelectItem>
            <SelectItem value="AUTHORIZED_OPERATION">
              Owner-authorized operation
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {open && (
        <form
          noValidate
          className="grid gap-4 border-y py-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            save.mutate(new FormData(event.currentTarget));
          }}
        >
          <Field label="Parking area name">
            <Input name="name" placeholder="Basement Zone A" maxLength={120} />
          </Field>
          <Field label="Number of spaces">
            <Input
              name="count"
              type="number"
              defaultValue={1}
              min={1}
              max={100}
            />
          </Field>
          <Field label="Spot prefix">
            <Input name="prefix" placeholder="A" maxLength={20} />
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-3 text-sm font-semibold">Vehicles that fit</p>
            <div className="flex flex-wrap gap-5">
              {Object.entries(vehicleLabels).map(([type, label]) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={vehicles.includes(type as VehicleType)}
                    onCheckedChange={(checked) => {
                      onDirty();
                      setVehicles((current) =>
                        checked
                          ? [...current, type as VehicleType]
                          : current.filter((value) => value !== type),
                      );
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-5 sm:col-span-2">
            {[
              ["covered", "Covered parking"],
              ["cctv", "CCTV"],
              ["guard", "On-site guard"],
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 text-sm">
                <Checkbox name={name} />
                {label}
              </label>
            ))}
          </div>
          <Button
            type="submit"
            disabled={save.isPending}
            aria-busy={save.isPending}
          >
            {save.isPending && <Loader2 className="size-4 animate-spin" />}Save
            spaces & request rights
          </Button>
        </form>
      )}
      <div className="divide-y">
        {resources.map((entry) => {
          const linked = rights.filter(
            (right) => right.parkingSpotId === entry.id,
          );
          return (
            <article
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <h3 className="font-semibold">{entry.displayName}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {entry.capacity} spaces ·{" "}
                  {entry.supportedVehicleTypes
                    .map((type) => vehicleLabels[type])
                    .join(", ")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {linked
                    .map((right) => right.status.replaceAll("_", " "))
                    .join(", ") || "Authority request required"}
                </p>
              </div>
              {!linked.some((right) =>
                ["VERIFIED", "PENDING_VERIFICATION", "DISPUTED"].includes(
                  right.status,
                ),
              ) && (
                <Button
                  variant="outline"
                  disabled={claim.isPending}
                  onClick={() => claim.mutate(entry)}
                >
                  Request commercial rights
                </Button>
              )}
            </article>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 underline underline-offset-4"
        href={`/provider/properties/${propertyId}#parking-advanced`}
      >
        Manage authority documents or shared parking capacity
        <ChevronRight className="size-4" />
      </Link>
    </>
  );
}

function PricingStep({
  onRateDirty,
  resource,
  right,
  offers,
  refresh,
  onDone,
  onDirty,
}: {
  onRateDirty: (id: string, dirty: boolean) => void;
  resource: ParkingResourceDto;
  right?: ParkingRightDto;
  offers: ParkingListingDto[];
  refresh: () => Promise<void>;
  onDone: () => void;
  onDirty: () => void;
}) {
  const schedule = useQuery({
    queryKey: queryKeys.availability.byResource(resource.id),
    queryFn: () => parkingResourcesApi.availability(resource.id),
  });
  if (schedule.isPending) return <PageSkeleton label="Loading weekly hours" />;
  if (schedule.isError)
    return (
      <PageErrorState
        message={getApiErrorMessage(schedule.error)}
        retry={() => void schedule.refetch()}
      />
    );
  return (
    <div className="space-y-6">
    {offers.some((offer) => !["ENDED", "SUSPENDED"].includes(offer.status)) && <section>
      <h3 className="mb-3 font-semibold">Current vehicle rates</h3>
      <div className="divide-y border-y bg-white">
        {offers.filter((offer) => !["ENDED", "SUSPENDED"].includes(offer.status)).map((offer) => <article key={offer.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <h4 className="font-semibold">{offer.title}</h4>
            <p className="mt-1 text-sm text-slate-600">{offer.allowedVehicleTypes.map((type) => vehicleLabels[type]).join(" / ")} · {offer.parkingResourceUnitId ? "Selected spot" : "All spots"}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatBDTFromPaisa(offer.pricePerHourPaisa)}/hour <span className="ml-2 text-xs font-normal text-slate-500">{offer.status.toLowerCase()}</span></p>
          </div>
          <ListingRateEditor listing={offer} refresh={refresh} onDirtyChange={onRateDirty} />
        </article>)}
      </div>
    </section>}
    <PricingForm
      resource={resource}
      right={offers.some((offer) => !["ENDED", "SUSPENDED"].includes(offer.status)) ? undefined : right}
      scheduleOnly={offers.some((offer) => !["ENDED", "SUSPENDED"].includes(offer.status))}
      offers={offers}
      rules={schedule.data.rules}
      refresh={refresh}
      onDone={onDone}
      onDirty={onDirty}
    />
    </div>
  );
}

function PricingForm({
  scheduleOnly = false,
  resource,
  right,
  offers,
  rules,
  refresh,
  onDone,
  onDirty,
}: {
  scheduleOnly?: boolean;
  resource: ParkingResourceDto;
  right?: ParkingRightDto;
  offers: ParkingListingDto[];
  rules: AvailabilityRuleDto[];
  refresh: () => Promise<void>;
  onDone: () => void;
  onDirty: () => void;
}) {
  const client = useQueryClient();
  const [hours, setHours] = useState(() =>
    days.map((_, day) => ({
      enabled: rules.length
        ? rules.some((rule) => rule.dayOfWeek === day)
        : true,
      start:
        availabilityTimeInput(rules.find((rule) => rule.dayOfWeek === day)?.startLocalTime ?? "08:00"),
      end:
        availabilityTimeInput(rules.find((rule) => rule.dayOfWeek === day)?.endLocalTime ?? "22:00"),
    })),
  );
  const [error, setError] = useState("");
  const supported = resource.supportedVehicleTypes;
  const existing = (type: VehicleType) =>
    offers.find(
      (offer) =>
        offer.parkingResourceUnitId === null &&
        offer.allowedVehicleTypes.length === 1 &&
        offer.allowedVehicleTypes[0] === type &&
        ["DRAFT", "PAUSED"].includes(offer.status),
    );
  const live = offers.some((offer) => offer.status === "ACTIVE");
  const baseOffer = offers.find((offer) =>
    ["DRAFT", "PAUSED"].includes(offer.status),
  );
  const advancedOffers = offers.some(
    (offer) =>
      !["ENDED", "SUSPENDED"].includes(offer.status) &&
      (offer.parkingResourceUnitId !== null ||
        offer.allowedVehicleTypes.length !== 1 ||
        offer.overtimeBillingMode !== "MULTIPLIER" ||
        offer.overtimeGracePeriodMinutes !== 5 ||
        (baseOffer &&
          (offer.securityDepositPaisa !== baseOffer.securityDepositPaisa ||
            offer.minDurationMinutes !== baseOffer.minDurationMinutes ||
            offer.maxDurationMinutes !== baseOffer.maxDurationMinutes ||
            offer.overtimeMultiplierBps !== baseOffer.overtimeMultiplierBps))),
  );
  const multipleWindows =
    rules.some(
      (rule) =>
        rule.validUntil !== null ||
        rule.validFrom.slice(0, 10) > dhakaDate(new Date()),
    ) ||
    days.some(
      (_, day) => rules.filter((rule) => rule.dayOfWeek === day).length > 1,
    );
  const save = useMutation({
    mutationFn: async (data: FormData) => {
      if (multipleWindows || (!scheduleOnly && advancedOffers))
        throw new SetupValidationError(
          "This area uses a dated schedule or specialized offers. Edit these in the property workspace to preserve their settings.",
        );
      const enabled = hours
        .map((hour, day) => ({ ...hour, day }))
        .filter((hour) => hour.enabled);
      if (
        !enabled.length ||
        enabled.some(
          (hour) =>
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(hour.start) ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(hour.end) ||
            hour.end <= hour.start,
        )
      )
        throw new SetupValidationError(
          "Enable at least one day and choose an end time later than its start time.",
        );
      const plan = right
        ? vehicleRatePlan({
            rightId: right.id,
            title: resource.displayName ?? "Parking",
            vehicles: supported,
            rates: Object.fromEntries(
              supported.map((type) => [type, String(data.get(type) ?? "")]),
            ),
            deposit: String(data.get("deposit")),
            minimum: String(data.get("minimum")),
            maximum: String(data.get("maximum")),
            overtimeMultiplier: String(data.get("multiplier")),
          })
        : [];
      const currentOffers = await listingsApi.list();
      const current = currentOffers.filter(
        (offer) =>
          offer.parkingSpotId === resource.id &&
          !["ENDED", "SUSPENDED"].includes(offer.status),
      );
      if (
        plan.length &&
        current.some(
          (offer) =>
            offer.status === "ACTIVE" ||
            offer.parkingResourceUnitId !== null ||
            offer.allowedVehicleTypes.length !== 1,
        )
      )
        throw new SetupValidationError(
          "Existing offers use a different scope. Edit those offers in the property workspace to avoid duplicate rates.",
        );
      await parkingResourcesApi.replaceAvailability(
        resource.id,
        enabled.map((hour) => ({
          dayOfWeek: hour.day,
          startLocalTime: hour.start,
          endLocalTime: hour.end,
          validFrom:
            rules
              .find((rule) => rule.dayOfWeek === hour.day)
              ?.validFrom.slice(0, 10) ?? dhakaDate(new Date()),
        })),
      );
      await client.invalidateQueries({
        queryKey: queryKeys.availability.byResource(resource.id),
      });
      for (const offer of plan) {
        const draft = current.find(
          (entry) =>
            entry.parkingRightId === right?.id &&
            entry.allowedVehicleTypes[0] === offer.allowedVehicleTypes[0],
        );
        if (draft) {
          const {
            parkingRightId: _right,
            parkingResourceUnitId: _unit,
            ...patch
          } = offer;
          void _right;
          void _unit;
          await listingsApi.update(draft.id, patch);
        } else await listingsApi.create(offer);
      }
    },
    onSuccess: async () => {
      toast.success(
        scheduleOnly ? "Opening hours saved" : right
          ? "Availability and vehicle rates saved as drafts"
          : "Availability saved; rights approval is required for pricing",
      );
      await refresh();
      onDone();
    },
    onError: (failure) => setError(setupError(failure)),
    onSettled: refresh,
  });
  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        save.mutate(new FormData(event.currentTarget));
      }}
    >
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Weekly opening hours</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={multipleWindows}
            onClick={() => {
              onDirty();
              setHours((current) => current.map(() => ({ ...current[1] })));
            }}
          >
            Copy Monday to all days
          </Button>
        </div>
        {multipleWindows && (
          <p role="status" className="mb-3 text-sm text-amber-800">
            Dated schedules and multiple opening windows are protected. Use the
            advanced availability editor to change them.
          </p>
        )}
        <div className="divide-y rounded-lg border bg-white">
          {hours.map((hour, day) => (
            <div
              key={day}
              className="grid grid-cols-[1fr_1fr] items-center gap-3 p-3 sm:grid-cols-[140px_1fr_1fr]"
            >
              <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1">
                <Checkbox
                  disabled={multipleWindows || save.isPending}
                  checked={hour.enabled}
                  onCheckedChange={(checked) => {
                    onDirty();
                    setHours((current) =>
                      current.map((value, index) =>
                        index === day
                          ? { ...value, enabled: Boolean(checked) }
                          : value,
                      ),
                    );
                  }}
                />
                {days[day]}
              </label>
              <Input
                aria-label={`${days[day]} opens`}
                type="time"
                value={hour.start}
                disabled={!hour.enabled || multipleWindows || save.isPending}
                onChange={(event) =>
                  setHours((current) =>
                    current.map((value, index) =>
                      index === day
                        ? { ...value, start: event.target.value }
                        : value,
                    ),
                  )
                }
              />
              <Input
                aria-label={`${days[day]} closes`}
                type="time"
                value={hour.end}
                disabled={!hour.enabled || multipleWindows || save.isPending}
                onChange={(event) =>
                  setHours((current) =>
                    current.map((value, index) =>
                      index === day
                        ? { ...value, end: event.target.value }
                        : value,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>
      {!scheduleOnly && <section>
        <h3 className="mb-4 font-semibold">Vehicle rates · BDT per hour</h3>
        {advancedOffers && (
          <p role="status" className="mb-4 text-sm text-amber-800">
            Existing offers have specialized vehicle, deposit or overtime
            settings. Edit them in the property workspace to preserve those
            settings.
          </p>
        )}
        {!right && (
          <p className="mb-4 border-l-2 border-amber-500 bg-amber-50 p-3 text-sm">
            Commercial authority is awaiting approval or is not effective yet.
            Opening hours can be saved now; pricing unlocks after approval.
          </p>
        )}
        {live && (
          <p className="mb-4 text-sm text-amber-800">
            Live offers already exist. Edit their rates in the property
            workspace.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {supported.map((type) => (
            <Field key={type} label={vehicleLabels[type]}>
              <Input
                name={type}
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={
                  existing(type)
                    ? paisaToBDTInput(existing(type)!.pricePerHourPaisa)
                    : ""
                }
                disabled={!right || live || save.isPending}
              />
            </Field>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Refundable deposit (BDT)">
            <Input
              name="deposit"
              inputMode="decimal"
              defaultValue={
                baseOffer
                  ? paisaToBDTInput(baseOffer.securityDepositPaisa)
                  : "0"
              }
              disabled={!right || live || save.isPending}
            />
          </Field>
          <Field label="Overtime multiplier">
            <Input
              name="multiplier"
              inputMode="decimal"
              defaultValue={
                baseOffer?.overtimeMultiplierBps
                  ? String(baseOffer.overtimeMultiplierBps / 10_000)
                  : "1.5"
              }
              disabled={!right || live || save.isPending}
            />
          </Field>
          <Field label="Minimum stay (minutes)">
            <Input
              name="minimum"
              type="number"
              defaultValue={baseOffer?.minDurationMinutes ?? 60}
              disabled={!right || live || save.isPending}
            />
          </Field>
          <Field label="Maximum stay (minutes)">
            <Input
              name="maximum"
              type="number"
              defaultValue={baseOffer?.maxDurationMinutes ?? 720}
              disabled={!right || live || save.isPending}
            />
          </Field>
        </div>
        <p className="mt-4 text-xs text-slate-600">
          Entry and exit grace: 5 minutes. Refunds and overtime follow the
          platform policy.
        </p>
      </section>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={save.isPending || multipleWindows || (!scheduleOnly && (live || advancedOffers))}
        aria-busy={save.isPending}
      >
        {save.isPending && <Loader2 className="size-4 animate-spin" />}
        {right ? "Save rates & continue" : "Save opening hours"}
      </Button>
    </form>
  );
}

function ReviewStep({
  offers,
  refresh,
}: {
  offers: ParkingListingDto[];
  refresh: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const publish = useMutation({
    mutationFn: async () => {
      for (const offer of offers.filter((entry) =>
        ["DRAFT", "PAUSED"].includes(entry.status),
      ))
        await listingsApi.activate(offer.id);
    },
    onSuccess: () => toast.success("Parking offers published"),
    onError: (failure) => setError(getApiErrorMessage(failure)),
    onSettled: refresh,
  });
  const drafts = offers.filter((offer) =>
    ["DRAFT", "PAUSED"].includes(offer.status),
  );
  return (
    <>
      <div className="divide-y rounded-lg border bg-white">
        {offers.length ? (
          offers.map((offer) => (
            <article
              key={offer.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <h3 className="font-semibold">{offer.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {offer.allowedVehicleTypes
                    .map((type) => vehicleLabels[type])
                    .join(", ")}{" "}
                  · {offer.status}
                </p>
              </div>
              <strong className="text-sm tabular-nums">
                {formatBDTFromPaisa(offer.pricePerHourPaisa)}/hour
              </strong>
            </article>
          ))
        ) : (
          <p className="p-5 text-sm text-slate-600">
            Save rates for an approved parking area before publishing.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error} Saved drafts remain available. Retry after correcting the
          issue.
        </p>
      )}
      <Button
        disabled={!drafts.length || publish.isPending}
        aria-busy={publish.isPending}
        onClick={() => {
          setError("");
          publish.mutate();
        }}
      >
        {publish.isPending && <Loader2 className="size-4 animate-spin" />}
        Publish {drafts.length} offers
      </Button>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
