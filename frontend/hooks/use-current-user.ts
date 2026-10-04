"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth-api";
import { queryKeys } from "@/lib/query-keys";

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => (await authApi.me()).user,
    retry: false,
  });
}
