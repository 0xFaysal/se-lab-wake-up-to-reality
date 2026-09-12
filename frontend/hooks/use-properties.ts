"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { propertyApi } from "@/lib/api/property-api";
import { queryKeys } from "@/lib/query-keys";

export function useProperties() {
  const client = useQueryClient();
  return {
    query: useQuery({ queryKey: queryKeys.properties.all(), queryFn: propertyApi.list }),
    create: useMutation({ mutationFn: propertyApi.create, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.properties.root }) }),
    remove: useMutation({ mutationFn: propertyApi.remove, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.properties.root }) }),
  };
}
