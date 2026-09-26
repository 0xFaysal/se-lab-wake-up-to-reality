"use client";

import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageErrorState, PageSkeleton, ProviderPage, ProviderPageHeader } from "@/components/provider/provider-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { managerApi, type ManagerDelegationDto, type ManagerPermission } from "@/lib/api/manager-api";
import { parkingResourcesApi } from "@/lib/api/parking-resources-api";
import { queryKeys } from "@/lib/query-keys";

const ALL: ManagerPermission[] = [
  "RESOURCE_VIEW", "RESOURCE_MANAGE", "LISTING_VIEW", "LISTING_MANAGE", "PRICE_MANAGE",
  "AVAILABILITY_MANAGE", "BOOKING_VIEW", "BOOKING_MANAGE", "IMAGE_MANAGE",
  "GUARD_VIEW", "GUARD_ADD_TO_PROPERTY", "GUARD_ASSIGN", "EARNINGS_VIEW",
  "REPORTS_VIEW",
];

export default function ManagerPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useQuery({
    queryKey: [...queryKeys.managerDelegations.provider, id],
    queryFn: () => managerApi.detail(id),
  });
  if (query.isPending) return <ProviderPage><PageSkeleton label="Loading delegation" /></ProviderPage>;
  if (query.isError) return <ProviderPage><PageErrorState message={getApiErrorMessage(query.error)} /></ProviderPage>;
  return <PermissionForm delegation={query.data} />;
}

function PermissionForm({ delegation }: { delegation: ManagerDelegationDto }) {
  const router = useRouter();
  const client = useQueryClient();
  const [permissions, setPermissions] = useState(delegation.permissions);
  const [wholeProperty, setWholeProperty] = useState(delegation.resourceIds.length === 0);
  const [resourceIds, setResourceIds] = useState(delegation.resourceIds);
  const resources = useQuery({
    queryKey: queryKeys.parkingResources.byProperty(delegation.property.id),
    queryFn: () => parkingResourcesApi.list(delegation.property.id),
  });
  const mutation = useMutation({
    mutationFn: () => managerApi.updatePermissions(delegation.id, {
      permissions,
      resourceIds: wholeProperty ? [] : resourceIds,
    }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.managerDelegations.provider });
      router.push(`/provider/managers/${delegation.id}`);
    },
  });
  const canSubmit = permissions.length > 0 && (wholeProperty || resourceIds.length > 0) && !mutation.isPending;

  return (
    <ProviderPage className="max-w-5xl">
      <ProviderPageHeader
        title="Manager access"
        description={`Update ${delegation.manager.fullName}'s permissions and parking-resource scope for ${delegation.property.name}.`}
        breadcrumbs={[
          { label: "Managers", href: "/provider/managers" },
          { label: delegation.manager.fullName, href: `/provider/managers/${delegation.id}` },
          { label: "Access" },
        ]}
      />
      <form className="space-y-7" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <section>
          <h2 className="font-bold">Resource scope</h2>
          <label className="mt-4 flex items-start gap-3 border bg-slate-50 p-4 text-sm">
            <Checkbox
              checked={wholeProperty}
              onCheckedChange={(checked) => {
                setWholeProperty(checked === true);
                if (checked) setResourceIds([]);
              }}
            />
            <span><strong>Whole Property scope</strong><small className="mt-1 block text-slate-600">Includes all current and future resources at this Property.</small></span>
          </label>
          {!wholeProperty && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {resources.isPending && <p className="text-sm text-slate-600">Loading resources...</p>}
              {resources.data?.map((resource) => (
                <label key={resource.id} className="flex items-start gap-3 border p-4 text-sm">
                  <Checkbox
                    checked={resourceIds.includes(resource.id)}
                    onCheckedChange={(checked) => setResourceIds((current) =>
                      checked ? [...new Set([...current, resource.id])] : current.filter((id) => id !== resource.id)
                    )}
                  />
                  <span><strong>{resource.displayName ?? resource.spotCode ?? "Parking resource"}</strong><small className="mt-1 block text-slate-600">{resource.resourceType.replaceAll("_", " ")}</small></span>
                </label>
              ))}
            </div>
          )}
        </section>
        <section className="border-t pt-6">
          <h2 className="font-bold">Permissions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {ALL.map((permission) => (
              <label key={permission} className="flex items-center gap-3 border p-4 text-sm">
                <Checkbox
                  checked={permissions.includes(permission)}
                  onCheckedChange={(checked) => setPermissions((current) =>
                    checked ? [...new Set([...current, permission])] : current.filter((item) => item !== permission)
                  )}
                />
                {permission.replaceAll("_", " ")}
              </label>
            ))}
          </div>
        </section>
        {!wholeProperty && resourceIds.length === 0 && <p role="alert" className="text-sm text-amber-800">Select at least one resource or choose whole Property scope.</p>}
        {mutation.isError && <p role="alert" className="text-sm text-red-700">{getApiErrorMessage(mutation.error)}</p>}
        <Button type="submit" disabled={!canSubmit}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Save access</Button>
      </form>
    </ProviderPage>
  );
}
