"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProviderPage, ProviderPageHeader } from "@/components/provider/provider-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { ApiError } from "@/lib/api/api-error";
import { managerApi, type ManagerPermission } from "@/lib/api/manager-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { propertyApi } from "@/lib/api/property-api";
import { userApi } from "@/lib/api/user-api";
import { queryKeys } from "@/lib/query-keys";

const PERMISSIONS: Array<{ value: ManagerPermission; label: string; description: string }> = [
  { value: "RESOURCE_VIEW", label: "View resources", description: "See assigned parking inventory." },
  { value: "LISTING_VIEW", label: "View listings", description: "See listing state and pricing." },
  { value: "LISTING_MANAGE", label: "Manage listings", description: "Create, pause, and update listings." },
  { value: "PRICE_MANAGE", label: "Manage pricing", description: "Change hourly prices and deposits." },
  { value: "AVAILABILITY_MANAGE", label: "Manage availability", description: "Set schedules and exceptions." },
  { value: "BOOKING_VIEW", label: "View bookings", description: "See bookings inside the resource scope." },
  { value: "BOOKING_MANAGE", label: "Manage bookings", description: "Perform permitted booking operations." },
  { value: "IMAGE_MANAGE", label: "Manage images", description: "Upload and organize Property images." },
  { value: "GUARD_VIEW", label: "View Guards", description: "See Property Guard memberships." },
  { value: "GUARD_ADD_TO_PROPERTY", label: "Add Guards", description: "Invite Guards to this Property." },
  { value: "GUARD_ASSIGN", label: "Assign Guards", description: "Create and end Guard assignments." },
  { value: "EARNINGS_VIEW", label: "View earnings", description: "See scoped settlement information." },
  { value: "REPORTS_VIEW", label: "View reports", description: "Access operational reports." },
];

const DEFAULTS: ManagerPermission[] = [
  "RESOURCE_VIEW",
  "LISTING_VIEW",
  "BOOKING_VIEW",
];

export default function InviteManagerPage() {
  const router = useRouter();
  const client = useQueryClient();
  const [propertyId, setPropertyId] = useState("");
  const [permissions, setPermissions] = useState<ManagerPermission[]>(DEFAULTS);
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [wholeProperty, setWholeProperty] = useState(false);
  const properties = useQuery({
    queryKey: queryKeys.properties.all(),
    queryFn: propertyApi.list,
  });
  const resources = useQuery({
    queryKey: queryKeys.parkingResources.byProperty(propertyId || "none"),
    queryFn: () => parkingResourcesApi.list(propertyId),
    enabled: Boolean(propertyId),
  });
  const verifiedProperties = (properties.data ?? []).filter(
    (property) => property.verificationStatus === "VERIFIED" && property.status === "ACTIVE",
  );

  const mutation = useMutation({
    mutationFn: async (input: {
      fullName: string;
      email: string;
      phone: string;
      validUntil?: string;
    }) => {
      const delegationInput = {
        propertyId,
        permissions,
        resourceIds: wholeProperty ? [] : resourceIds,
        ...(input.validUntil
          ? { validUntil: new Date(`${input.validUntil}T23:59:59+06:00`).toISOString() }
          : {}),
      };
      try {
        const created = await userApi.createManager({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
        });
        return managerApi.create({
          ...delegationInput,
          managerUserId: created.user.id,
        });
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== "EMAIL_OR_PHONE_ALREADY_REGISTERED") {
          throw error;
        }
        return managerApi.createByIdentifier({
          ...delegationInput,
          managerIdentifier: input.email,
        });
      }
    },
    onSuccess: async () => {
      toast.success("Manager invitation created");
      await client.invalidateQueries({ queryKey: queryKeys.managerDelegations.provider });
      router.push("/provider/managers");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const canSubmit =
    Boolean(propertyId) &&
    permissions.length > 0 &&
    (wholeProperty || resourceIds.length > 0) &&
    !mutation.isPending;

  return (
    <ProviderPage className="max-w-5xl">
      <ProviderPageHeader
        title="Invite Manager"
        description="Create a Manager account, choose one verified Property, and grant only the permissions and parking resources they need."
        breadcrumbs={[
          { label: "Managers", href: "/provider/managers" },
          { label: "Invite" },
        ]}
        actions={
          <Link href="/provider/managers" className="inline-flex h-10 items-center gap-2 rounded-md border bg-white px-4 text-sm font-semibold">
            <ArrowLeft className="size-4" />Back
          </Link>
        }
      />

      {verifiedProperties.length === 0 ? (
        <div className="border border-dashed bg-white p-10 text-center">
          <h2 className="font-bold">A verified Property is required</h2>
          <p className="mt-2 text-sm text-slate-600">Complete Property verification before delegating Provider access.</p>
          <Link href="/provider/properties" className="mt-4 inline-flex text-sm font-semibold text-emerald-800">Open Properties</Link>
        </div>
      ) : (
        <form
          className="space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            mutation.mutate({
              fullName: String(data.get("fullName")),
              email: String(data.get("email")),
              phone: String(data.get("phone")),
              validUntil: String(data.get("validUntil") || "") || undefined,
            });
          }}
        >
          <section className="border-b pb-7">
            <h2 className="font-bold">1. Manager identity</h2>
            <p className="mt-1 text-sm text-slate-600">The Manager receives a controlled account and completes their own secure setup.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input name="fullName" minLength={2} maxLength={120} required /></Field>
              <Field label="Email"><Input name="email" type="email" autoComplete="email" required /></Field>
              <Field label="Bangladesh phone"><Input name="phone" placeholder="+8801XXXXXXXXX" autoComplete="tel" required /></Field>
              <Field label="Access expires (optional)"><Input name="validUntil" type="date" /></Field>
            </div>
          </section>

          <section className="border-b pb-7">
            <h2 className="font-bold">2. Property and resource scope</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Verified Property">
                <select
                  value={propertyId}
                  onChange={(event) => {
                    setPropertyId(event.target.value);
                    setResourceIds([]);
                    setWholeProperty(false);
                  }}
                  required
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-2xs hover:border-slate-400 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 outline-none"
                >
                  <option value="">Select Property</option>
                  {verifiedProperties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
                </select>
              </Field>
            </div>

            {propertyId && (
              <div className="mt-5">
                <label className="flex items-start gap-3 rounded-lg border border-slate-300 bg-white hover:border-slate-400 shadow-2xs p-4 text-sm transition">
                  <Checkbox
                    checked={wholeProperty}
                    onCheckedChange={(checked) => {
                      setWholeProperty(checked === true);
                      if (checked) setResourceIds([]);
                    }}
                  />
                  <span><strong>Whole Property scope</strong><small className="mt-1 block text-slate-600">Includes every current and future parking resource. Use only when this Manager runs the whole Property.</small></span>
                </label>
                {!wholeProperty && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {resources.isPending && <p className="text-sm text-slate-600">Loading parking resources...</p>}
                    {resources.data?.map((resource) => (
                      <label key={resource.id} className="flex items-start gap-3 rounded-lg border border-slate-300 bg-white hover:border-slate-400 shadow-2xs p-4 text-sm transition">
                        <Checkbox
                          checked={resourceIds.includes(resource.id)}
                          onCheckedChange={(checked) => setResourceIds((current) =>
                            checked
                              ? [...new Set([...current, resource.id])]
                              : current.filter((id) => id !== resource.id)
                          )}
                        />
                        <span><strong>{resource.displayName ?? resource.spotCode ?? "Parking resource"}</strong><small className="mt-1 block text-slate-600">{resource.resourceType.replaceAll("_", " ")} · capacity {resource.capacity}</small></span>
                      </label>
                    ))}
                    {resources.data?.length === 0 && (
                      <p className="text-sm text-amber-800">This Property has no parking resources. Add a resource before creating a least-privilege delegation.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-bold">3. Permission groups</h2>
            <p className="mt-1 text-sm text-slate-600">Permissions are enforced by the backend in addition to the selected resource scope.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((permission) => (
                <label key={permission.value} className="flex items-start gap-3 rounded-lg border border-slate-300 bg-white hover:border-slate-400 shadow-2xs p-4 transition">
                  <Checkbox
                    checked={permissions.includes(permission.value)}
                    onCheckedChange={(checked) => setPermissions((current) =>
                      checked
                        ? [...new Set([...current, permission.value])]
                        : current.filter((item) => item !== permission.value)
                    )}
                  />
                  <span className="text-sm"><strong>{permission.label}</strong><small className="mt-1 block leading-5 text-slate-600">{permission.description}</small></span>
                </label>
              ))}
            </div>
          </section>

          {!wholeProperty && propertyId && resourceIds.length === 0 && (
            <p role="alert" className="text-sm text-amber-800">Select at least one resource or explicitly choose whole Property scope.</p>
          )}
          {mutation.isError && <p role="alert" className="text-sm text-red-700">{getApiErrorMessage(mutation.error)}</p>}
          <div className="flex items-center justify-between border-t pt-5">
            <span className="inline-flex items-center gap-2 text-xs text-slate-600"><ShieldCheck className="size-4" />The Manager must accept before access becomes active.</span>
            <Button type="submit" disabled={!canSubmit}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}Create invitation
            </Button>
          </div>
        </form>
      )}
    </ProviderPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2 text-sm font-semibold"><span>{label}</span>{children}</label>;
}
