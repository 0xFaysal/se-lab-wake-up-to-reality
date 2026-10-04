"use client";

import { useEffect, useState } from "react";
import { useUnsavedNavigation } from "@/hooks/use-unsaved-navigation";
import Link from "next/link";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  ImagePlus,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ProviderPage,
  ProviderPageHeader,
} from "@/components/provider/provider-page";
import { PropertyLocationPicker } from "./property-location-picker";
import { useProperties } from "@/hooks/use-properties";
import { propertyApi } from "@/lib/api/property-api";
import { propertyImageApi } from "@/lib/api/property-image-api";
import type { PropertyInput, PropertySummaryDto } from "@/lib/api/api-types";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { toast } from "sonner";

type FormValues = {
  name: string;
  publicArea: string;
  approximateAddress: string;
  exactAddress: string;
  latitude: number | null;
  longitude: number | null;
  entranceAtMainLocation: boolean;
  accessInstructions: string;
  visitorIdentificationRequired: boolean;
  vehicleHeightLimitCm: string;
  entryCutoffLocalTime: string;
  generalParkingRules: string;
  commonSafetyRules: string;
  isSharedBuilding: boolean;
};

const defaults: FormValues = {
  name: "",
  publicArea: "",
  approximateAddress: "",
  exactAddress: "",
  latitude: null,
  longitude: null,
  entranceAtMainLocation: false,
  accessInstructions: "",
  visitorIdentificationRequired: false,
  vehicleHeightLimitCm: "",
  entryCutoffLocalTime: "",
  generalParkingRules: "",
  commonSafetyRules: "",
  isSharedBuilding: false,
};

export function PropertyWizardLiveView() {
  const methods = useForm<FormValues>({
    defaultValues: defaults,
    mode: "onBlur",
  });
  const { create, query: existingProperties } = useProperties();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [matches, setMatches] = useState<
    Array<PropertySummaryDto & { distanceMeters: number }>
  >([]);
  const [checkedLocation, setCheckedLocation] = useState<string | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationCheckVersion, setLocationCheckVersion] = useState(0);
  const [differentPropertyConfirmed, setDifferentPropertyConfirmed] =
    useState(false);
  const pending = create.isPending || submitting;
  const navigation = useUnsavedNavigation(
    methods.formState.isDirty || files.length > 0,
  );
  const latitude = useWatch({ control: methods.control, name: "latitude" });
  const longitude = useWatch({ control: methods.control, name: "longitude" });
  useEffect(() => {
    if (latitude === null || longitude === null) return;
    let current = true;
    const timer = window.setTimeout(() => {
      propertyApi
        .possibleMatches({ latitude, longitude })
        .then((result) => {
          if (!current) return;
          setMatches(result);
          setCheckedLocation(`${latitude}:${longitude}`);
          setError("");
        })
        .catch((failure) => {
          if (current) setError(getApiErrorMessage(failure));
        })
        .finally(() => {
          if (current) setCheckingLocation(false);
        });
    }, 350);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [latitude, longitude, locationCheckVersion]);
  const join = useMutation({
    mutationFn: propertyApi.requestMembership,
    onSuccess: () => {
      toast.success("Property membership request submitted");
      router.push("/provider/properties");
    },
    onError: (requestError) => setError(getApiErrorMessage(requestError)),
  });

  async function next() {
    setError("");
    if (step === 1) {
      if (latitude === null || longitude === null) {
        setError("Choose the building on the map first.");
        return;
      }
      if (checkedLocation !== `${latitude}:${longitude}`) {
        setError(
          "The location check has not completed. Move the pin to retry.",
        );
        return;
      }
      if (matches.length && !differentPropertyConfirmed) {
        setError(
          "Select your building below, or confirm that your property is different.",
        );
        return;
      }
      setStep(2);
      return;
    }
    if (
      !(await methods.trigger(
        [
          "name",
          "publicArea",
          "approximateAddress",
          "exactAddress",
          "vehicleHeightLimitCm",
        ],
        { shouldFocus: true },
      ))
    )
      return;
    setStep(3);
  }

  async function submit(values: FormValues) {
    if (step !== 3) return;
    if (pending || values.latitude === null || values.longitude === null)
      return;
    setError("");
    const payload: PropertyInput = {
      name: values.name.trim(),
      publicArea: values.publicArea.trim(),
      approximateAddress: values.approximateAddress.trim(),
      exactAddress: values.exactAddress.trim(),
      latitude: values.latitude,
      longitude: values.longitude,
      ...(values.entranceAtMainLocation
        ? {
            entranceLatitude: values.latitude,
            entranceLongitude: values.longitude,
          }
        : {}),
      ...(values.accessInstructions.trim()
        ? { accessInstructions: values.accessInstructions.trim() }
        : {}),
      visitorIdentificationRequired: values.visitorIdentificationRequired,
      isSharedBuilding: values.isSharedBuilding,
      ...(values.vehicleHeightLimitCm
        ? { vehicleHeightLimitCm: Number(values.vehicleHeightLimitCm) }
        : {}),
      ...(values.entryCutoffLocalTime
        ? { entryCutoffLocalTime: values.entryCutoffLocalTime }
        : {}),
      ...(values.generalParkingRules.trim()
        ? { generalParkingRules: values.generalParkingRules.trim() }
        : {}),
      ...(values.commonSafetyRules.trim()
        ? { commonSafetyRules: values.commonSafetyRules.trim() }
        : {}),
    };
    setSubmitting(true);
    try {
      const property = await create.mutateAsync(payload);
      if (files.length) {
        try {
          await propertyImageApi.upload(property.id, files);
        } catch (uploadError) {
          toast.error(
            `Property created, but images were not uploaded: ${getApiErrorMessage(uploadError)}`,
          );
        }
      }
      methods.reset();
      setFiles([]);
      router.push(`/provider/properties/${property.id}?submitted=1`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function chooseFiles(list: FileList | null) {
    if (!list) return;
    const selected = Array.from(list);
    const invalid = selected.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    );
    if (invalid) {
      setError(
        "Images must be JPEG, PNG, or WebP and no larger than 5 MB each.",
      );
      return;
    }
    if (selected.length > 10) {
      setError("A Property can have at most 10 images.");
      return;
    }
    setError("");
    setFiles(selected);
  }

  return (
    <FormProvider {...methods}>
      <ProviderPage className="max-w-6xl">
        {navigation.guard}
        <ProviderPageHeader
          title="Add property"
          description="Location, property details, then review."
          breadcrumbs={[
            { label: "Properties", href: "/provider/properties" },
            { label: "Add parking location" },
          ]}
          actions={
            <Link href="/provider/properties">
              <Button variant="outline">
                <ArrowLeft className="size-4" />
                Exit setup
              </Button>
            </Link>
          }
        />
        <form
          noValidate
          onSubmit={methods.handleSubmit(submit)}
          className="mx-auto max-w-4xl space-y-6"
        >
          <div className="min-w-0 space-y-6">
            <div>
              <Progress step={step} />
            </div>
            {step === 2 && <IdentityFields />}
            {(step === 1 || step === 2) && (
              <LocationAndOperations
                locationOnly={step === 1}
                checking={checkingLocation}
                checked={checkedLocation !== null}
                existingIds={(existingProperties.data ?? []).map(
                  (property) => property.id,
                )}
                latitude={latitude}
                longitude={longitude}
                onLocation={(location) => {
                  setCheckingLocation(true);
                  setCheckedLocation(null);
                  setLocationCheckVersion((version) => version + 1);
                  methods.setValue("latitude", location.latitude, {
                    shouldDirty: true,
                  });
                  methods.setValue("longitude", location.longitude, {
                    shouldDirty: true,
                  });
                  if (
                    location.approximateAddress &&
                    !methods.getValues("approximateAddress").trim()
                  )
                    methods.setValue(
                      "approximateAddress",
                      location.approximateAddress,
                      { shouldDirty: true },
                    );
                  if (
                    location.publicArea &&
                    !methods.getValues("publicArea").trim()
                  )
                    methods.setValue("publicArea", location.publicArea, {
                      shouldDirty: true,
                    });
                  setMatches([]);
                  setDifferentPropertyConfirmed(false);
                }}
                matches={matches}
                joining={join.isPending}
                onJoin={(id) => {
                  if (
                    existingProperties.data?.some(
                      (property) => property.id === id,
                    )
                  )
                    router.push(`/provider/properties/${id}`);
                  else join.mutate(id);
                }}
                onDifferent={() => {
                  setError("");
                  setDifferentPropertyConfirmed(true);
                  setStep(2);
                }}
              />
            )}
            {step === 3 && (
              <ReviewAndImages files={files} chooseFiles={chooseFiles} />
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
              >
                {error}
              </p>
            )}
            <footer className="sticky bottom-4 z-10 flex flex-col-reverse justify-between gap-3 rounded-lg border bg-white/95 p-3 shadow-[0_10px_30px_rgba(6,78,59,0.08)] backdrop-blur sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={step === 1 || pending}
                onClick={() => {
                  setError("");
                  setStep((value) => Math.max(1, value - 1));
                }}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <div className="flex items-center justify-end gap-3">
                <span className="hidden text-xs text-slate-500 sm:inline">
                  Step {step} of 3
                </span>
                {step < 3 ? (
                  <Button
                    key="next-step"
                    type="button"
                    className="bg-[#064E3B]"
                    disabled={checkingLocation || join.isPending}
                    onClick={(event) => {
                      event.preventDefault();
                      void next();
                    }}
                  >
                    {checkingLocation ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {step === 1 ? "Continue to details" : "Review property"}
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    key="submit-property"
                    type="submit"
                    className="bg-[#064E3B]"
                    disabled={pending}
                    aria-busy={pending}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit for verification"
                    )}
                  </Button>
                )}
              </div>
            </footer>
          </div>
        </form>
      </ProviderPage>
    </FormProvider>
  );
}

function Progress({ step }: { step: number }) {
  const stages = [
    { label: "Find your building", icon: MapPin, formStep: 1 },
    { label: "Property details", icon: Building2, formStep: 2 },
    { label: "Photos & review", icon: FileCheck2, formStep: 3 },
  ];
  return (
    <nav aria-label="Add property progress" className="border-b pb-4">
      <ol className="grid grid-cols-3 gap-2">
        {stages.map(({ label, icon: Icon, formStep }) => {
          const complete = formStep < step;
          const active = formStep === step;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${active ? "bg-emerald-900 font-semibold text-white" : complete ? "bg-emerald-50 text-emerald-900" : "text-slate-500"}`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full ${active ? "bg-white/15" : complete ? "bg-emerald-100" : "bg-slate-100"}`}
              >
                {complete ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Field({
  name,
  label,
  required = false,
  type = "text",
  min,
  max,
  minLength,
  maxLength,
}: {
  name: keyof FormValues;
  label: string;
  required?: boolean;
  type?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input
        id={name}
        type={type}
        min={min}
        max={max}
        minLength={minLength}
        maxLength={maxLength}
        {...register(name, {
          required: required ? `${label} is required` : false,
          ...(minLength === undefined
            ? {}
            : {
                minLength: {
                  value: minLength,
                  message: `${label} must contain at least ${minLength} characters`,
                },
              }),
          ...(maxLength === undefined
            ? {}
            : {
                maxLength: {
                  value: maxLength,
                  message: `${label} must contain at most ${maxLength} characters`,
                },
              }),
          ...(min === undefined
            ? {}
            : {
                min: {
                  value: min,
                  message: `${label} must be at least ${min}`,
                },
              }),
          ...(max === undefined
            ? {}
            : {
                max: { value: max, message: `${label} must be at most ${max}` },
              }),
        })}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />
      {errors[name] && (
        <p id={`${name}-error`} role="alert" className="text-xs text-red-700">
          {String(errors[name]?.message)}
        </p>
      )}
    </div>
  );
}

function IdentityFields() {
  return (
    <section className="grid gap-5 border-y bg-white px-5 py-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <h2 className="text-lg font-semibold">Property details</h2>
      </div>
      <Field
        name="name"
        label="Property name"
        required
        minLength={3}
        maxLength={120}
      />
      <Field
        name="publicArea"
        label="Area / neighbourhood"
        required
        minLength={2}
        maxLength={120}
      />
    </section>
  );
}

function LocationAndOperations({
  existingIds,
  locationOnly,
  checking,
  checked,
  latitude,
  longitude,
  onLocation,
  matches,
  joining,
  onJoin,
  onDifferent,
}: {
  existingIds: string[];
  locationOnly: boolean;
  checking: boolean;
  checked: boolean;
  latitude: number | null;
  longitude: number | null;
  onLocation: (location: {
    latitude: number;
    longitude: number;
    approximateAddress?: string;
    publicArea?: string;
  }) => void;
  matches: Array<PropertySummaryDto & { distanceMeters: number }>;
  joining: boolean;
  onJoin: (id: string) => void;
  onDifferent: () => void;
}) {
  const { register } = useFormContext<FormValues>();
  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-white p-5 sm:p-6">
        {!locationOnly && (
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <Field
              name="approximateAddress"
              label="Public address"
              required
              minLength={5}
              maxLength={255}
            />
            <Field
              name="exactAddress"
              label="Full address (private)"
              required
              minLength={5}
              maxLength={500}
            />
          </div>
        )}
        {locationOnly && (
          <>
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <MapPin className="size-5 text-emerald-700" />
                Find your building
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Search, click the map, drag the marker, or explicitly use your
                current location.
              </p>
            </div>
            <PropertyLocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={onLocation}
            />
            <p role="status" className="mt-4 text-sm text-slate-600">
              {checking
                ? "Checking nearby properties..."
                : checked && matches.length === 0
                  ? "No existing property found within 75 metres of this pin. Check the building location before continuing."
                  : ""}
            </p>
          </>
        )}
      </section>
      {locationOnly && matches.length > 0 && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-950">
            Is your building already here?
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            These properties are near your pin, not confirmed duplicates. Choose
            the same building to request access; approval is still required.
          </p>
          <div className="mt-4 space-y-3">
            {matches.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <strong>{item.name}</strong>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.publicArea} · {item.approximateAddress}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Approximately {item.distanceMeters} m from your pin
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={joining}
                  onClick={() => onJoin(item.id)}
                >
                  {existingIds.includes(item.id)
                    ? "Open your property"
                    : "Request access to this building"}
                </Button>
              </article>
            ))}
          </div>
          <Button
            type="button"
            className="mt-4"
            variant="ghost"
            onClick={onDifferent}
          >
            My building is different
          </Button>
        </section>
      )}
      {!locationOnly && (
        <details className="border-y bg-white p-5">
          <summary className="cursor-pointer font-semibold">
            Access, safety & building details (optional)
          </summary>
          <section className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              name="vehicleHeightLimitCm"
              label="Vehicle height limit (cm)"
              type="number"
              min={1}
              max={1000}
            />
            <Field
              name="entryCutoffLocalTime"
              label="Entry cutoff"
              type="time"
            />
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input type="checkbox" {...register("entranceAtMainLocation")} />
              Use the selected map point as the vehicle entrance
            </label>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="accessInstructions">
                Private access instructions
              </Label>
              <Textarea
                id="accessInstructions"
                maxLength={1000}
                {...register("accessInstructions")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generalParkingRules">General parking rules</Label>
              <Textarea
                id="generalParkingRules"
                maxLength={2000}
                {...register("generalParkingRules")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commonSafetyRules">Common safety rules</Label>
              <Textarea
                id="commonSafetyRules"
                maxLength={2000}
                {...register("commonSafetyRules")}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input
                type="checkbox"
                {...register("visitorIdentificationRequired")}
              />
              Visitor identification is required
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input type="checkbox" {...register("isSharedBuilding")} />
              This Property is part of a shared building
            </label>
          </section>
        </details>
      )}
    </div>
  );
}

function ReviewAndImages({
  files,
  chooseFiles,
}: {
  files: File[];
  chooseFiles: (files: FileList | null) => void;
}) {
  const values = useFormContext<FormValues>().getValues();
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <section className="rounded-lg border bg-white p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Building2 className="size-5 text-emerald-700" />
          Review submission
        </h2>
        <dl className="mt-5 space-y-4 text-sm">
          <Review label="Property" value={values.name} />
          <Review
            label="Public location"
            value={`${values.publicArea} · ${values.approximateAddress}`}
          />
          <Review label="Private address" value={values.exactAddress} />
          <Review
            label="Coordinates"
            value={
              values.latitude !== null && values.longitude !== null
                ? `${values.latitude.toFixed(6)}, ${values.longitude.toFixed(6)}`
                : "Not selected"
            }
          />
        </dl>
        <div className="mt-5 flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
          <p>
            After submission the Property remains inactive while an Admin
            verifies it. Parking resources can be configured once verification
            is complete.
          </p>
        </div>
      </section>
      <section className="rounded-lg border bg-white p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <ImagePlus className="size-5 text-emerald-700" />
          Property images
        </h2>
        <label className="mt-4 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-8 text-center focus-within:ring-2 focus-within:ring-emerald-700">
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => chooseFiles(event.target.files)}
          />
          <span className="font-semibold">Choose up to 10 images</span>
          <span className="mt-1 text-xs text-slate-500">
            JPEG, PNG or WebP · maximum 5 MB each
          </span>
        </label>
        {files.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`}>
                {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Images are optional during initial submission and can be managed
            later.
          </p>
        )}
      </section>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{value}</dd>
    </div>
  );
}
