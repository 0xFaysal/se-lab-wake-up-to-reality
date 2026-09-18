import { apiClient } from "./api-client";
import type { GuardAssignmentDto, GuardAssignmentStatus, PaginationDto, PropertyGuardMembershipDto } from "./api-types";

export interface GuardFilters { propertyId?: string; status?: GuardAssignmentStatus; page?: number; limit?: number }
function params(filters: object) {
  const query = new URLSearchParams(); Object.entries(filters).forEach(([key, value]: [string, unknown]) => { if ((typeof value === "string" || typeof value === "number") && value !== "") query.set(key, String(value)); });
  const value = query.toString(); return value ? `?${value}` : "";
}

export const guardApi = {
  invite: async (propertyId: string, identifier: string) => (await apiClient.post<{ membership: PropertyGuardMembershipDto }>(`/properties/${propertyId}/guards`, { identifier })).membership,
  propertyMemberships: async (propertyId: string) => (await apiClient.get<{ memberships: PropertyGuardMembershipDto[] }>(`/properties/${propertyId}/guards`)).memberships,
  createAssignment: async (propertyId: string, input: { guardMembershipId: string; shiftStart: string; shiftEnd: string }) => (await apiClient.post<{ assignment: GuardAssignmentDto }>(`/provider/properties/${propertyId}/guard-assignments`, input)).assignment,
  listForProvider: (filters: GuardFilters = {}) => apiClient.get<{ assignments: GuardAssignmentDto[]; pagination: PaginationDto }>(`/provider/guard-assignments${params(filters)}`),
  update: async (id: string, body: { action: "UPDATE_SHIFT"; shiftStart: string; shiftEnd: string } | { action: "SUSPEND" | "RESUME" }) => (await apiClient.patch<{ assignment: GuardAssignmentDto }>(`/provider/guard-assignments/${id}`, body)).assignment,
  end: (id: string) => apiClient.delete(`/provider/guard-assignments/${id}`),
  listMemberships: (filters: { propertyId?: string; status?: PropertyGuardMembershipDto["status"]; page?: number; limit?: number } = {}) => apiClient.get<{ memberships: PropertyGuardMembershipDto[]; pagination: PaginationDto }>(`/guard/property-memberships${params(filters)}`),
  listForGuard: (filters: GuardFilters = {}) => apiClient.get<{ assignments: GuardAssignmentDto[]; pagination: PaginationDto }>(`/guard/provider-assignments${params(filters)}`),
  accept: async (id: string) => (await apiClient.post<{ membership: PropertyGuardMembershipDto }>(`/guard/property-memberships/${id}/accept`, {})).membership,
  reject: async (id: string) => (await apiClient.post<{ membership: PropertyGuardMembershipDto }>(`/guard/property-memberships/${id}/reject`, {})).membership,
};
