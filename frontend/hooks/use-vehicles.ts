"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehicleApi } from "@/lib/api/vehicle-api";
import { queryKeys } from "@/lib/query-keys";
import type { VehicleInput } from "@/lib/api/api-types";

export function useVehicles() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.vehicles.all });
  return {
    query: useQuery({ queryKey: queryKeys.vehicles.all, queryFn: vehicleApi.list }),
    create: useMutation({ mutationFn: vehicleApi.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<Omit<VehicleInput, "isDefault">> }) => vehicleApi.update(id, input), onSuccess: (vehicle) => { client.setQueryData(queryKeys.vehicles.detail(vehicle.id), vehicle); return invalidate(); } }),
    setDefault: useMutation({ mutationFn: vehicleApi.setDefault, onSuccess: (vehicle) => { client.setQueryData(queryKeys.vehicles.detail(vehicle.id), vehicle); return invalidate(); } }),
    remove: useMutation({ mutationFn: vehicleApi.remove, onSuccess: invalidate }),
  };
}
