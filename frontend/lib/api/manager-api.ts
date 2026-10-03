import { apiClient } from "./api-client";

export type ManagerPermission =
  | "RESOURCE_VIEW"
  | "RESOURCE_MANAGE"
  | "LISTING_VIEW"
  | "LISTING_MANAGE"
  | "PRICE_MANAGE"
  | "AVAILABILITY_MANAGE"
  | "BOOKING_VIEW"
  | "BOOKING_MANAGE"
  | "IMAGE_MANAGE"
  | "GUARD_VIEW"
  | "GUARD_ADD_TO_PROPERTY"
  | "GUARD_ASSIGN"
  | "EARNINGS_VIEW"
  | "REPORTS_VIEW";

export interface ManagerCapabilities {
  resources: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  listings: {
    view: boolean;
    create: boolean;
    edit: boolean;
    pause: boolean;
    resume: boolean;
    price: boolean;
    end: boolean;
  };
  availability: { view: boolean; manage: boolean };
  bookings: { view: boolean; manage: boolean };
  guards: { view: boolean; add: boolean; assign: boolean };
  images: { manage: boolean };
  earnings: { view: boolean };
  reports: { view: boolean };
}

export interface ManagerDelegationDto {
  id: string;
  propertyId?: string;
  property: {
    id: string;
    name: string;
    publicArea: string;
    approximateAddress?: string;
    description?: string | null;
  };
  manager: { id: string; fullName: string; email?: string; phone?: string };
  provider?: { id: string; fullName: string; email?: string; phone?: string };
  status: string;
  permissions: ManagerPermission[];
  effectivePermissions?: ManagerPermission[];
  capabilities?: ManagerCapabilities;
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
  createByIdentifier: async (input: { propertyId: string; managerIdentifier: string; permissions: ManagerPermission[]; resourceIds: string[]; validUntil?: string }) => (await apiClient.post<{ delegation: ManagerDelegationDto }>("/provider/manager-delegations/by-identifier", input)).delegation,
  detail: async (id: string) => (await apiClient.get<{ delegation: ManagerDelegationDto }>(`/provider/manager-delegations/${id}`)).delegation,
  updatePermissions: async (id: string, input: { permissions: ManagerPermission[]; resourceIds: string[] }) => (await apiClient.patch<{ delegation: ManagerDelegationDto }>(`/provider/manager-delegations/${id}/permissions`, input)).delegation,
  end: async (id: string) => (await apiClient.delete<{ delegation: ManagerDelegationDto }>(`/provider/manager-delegations/${id}`)).delegation,
  suspend: async (id: string) => (await apiClient.post<{ delegation: ManagerDelegationDto }>(`/provider/manager-delegations/${id}/suspend`, {})).delegation,
  resume: async (id: string) => (await apiClient.post<{ delegation: ManagerDelegationDto }>(`/provider/manager-delegations/${id}/resume`, {})).delegation,
  listForManager: async () => (await apiClient.get<{ delegations: ManagerDelegationDto[] }>("/manager/delegations")).delegations,
  accept: async (id: string) => (await apiClient.post<{ delegation: ManagerDelegationDto }>(`/manager/delegations/${id}/accept`, {})).delegation,
  reject: async (id: string) => (await apiClient.post<{ delegation: ManagerDelegationDto }>(`/manager/delegations/${id}/reject`, {})).delegation,
};
