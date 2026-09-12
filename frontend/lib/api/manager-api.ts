import { apiClient } from "./api-client";

export type ManagerPermission = "RESOURCE_VIEW" | "LISTING_VIEW" | "LISTING_MANAGE" | "PRICE_MANAGE" | "AVAILABILITY_MANAGE" | "BOOKING_VIEW" | "BOOKING_MANAGE" | "IMAGE_MANAGE" | "GUARD_VIEW" | "GUARD_ADD_TO_PROPERTY" | "GUARD_ASSIGN" | "EARNINGS_VIEW" | "REPORTS_VIEW";
export interface ManagerDelegationDto {
  id: string;
  property: { id: string; name: string; publicArea: string };
  manager: { id: string; fullName: string };
  provider?: { id: string; fullName: string };
  status: string;
  permissions: ManagerPermission[];
  resourceIds: string[];
  validFrom: string | null;
  validUntil: string | null;
  invitedAt: string;
  acceptedAt: string | null;
  endedAt: string | null;
}

export const managerApi = {
  listForProvider: async () => (await apiClient.get<{ delegations: ManagerDelegationDto[] }>("/provider/manager-delegations")).delegations,
  create: async (input: { propertyId: string; managerUserId: string; permissions: ManagerPermission[]; resourceIds: string[]; validUntil?: string }) => (await apiClient.post<{ delegation: ManagerDelegationDto }>("/provider/manager-delegations", input)).delegation,
  detail: async (id: string) => (await apiClient.get<{ delegation: ManagerDelegationDto }>(`/provider/manager-delegations/${id}`)).delegation,
  updatePermissions: async (id: string, input: { permissions: ManagerPermission[]; resourceIds: string[] }) => (await apiClient.patch<{ delegation: ManagerDelegationDto }>(`/provider/manager-delegations/${id}/permissions`, input)).delegation,
  end: async (id: string) => (await apiClient.delete<{ delegation: ManagerDelegationDto }>(`/provider/manager-delegations/${id}`)).delegation,
  listForManager: async () => (await apiClient.get<{ delegations: ManagerDelegationDto[] }>("/manager/delegations")).delegations,
  accept: async (id: string) => (await apiClient.post<{ delegation: ManagerDelegationDto }>(`/manager/delegations/${id}/accept`, {})).delegation,
  reject: async (id: string) => (await apiClient.post<{ delegation: ManagerDelegationDto }>(`/manager/delegations/${id}/reject`, {})).delegation,
};
