type DelegationView = {
  id: string;
  propertyId: string;
  managerUserId: string;
  status: string;
  validFrom: Date | null;
  validUntil: Date | null;
  invitedAt: Date;
  acceptedAt: Date | null;
  endedAt: Date | null;
  permissions: Array<{ permission: string }>;
  resources: Array<{ parkingSpotId: string }>;
  property: {
    id: string;
    name: string;
    publicArea: string;
    approximateAddress?: string;
    description?: string | null;
  };
  manager: { id: string; fullName: string; email?: string; phone?: string };
  grantorProviderMembership: {
    id: string;
    provider: { id: string; fullName: string; email?: string; phone?: string };
  };
};

import {
  buildCapabilities,
  deriveEffectivePermissions,
} from "../../common/auth/business-actor-context.js";
import type { ManagerDelegationPermission } from "../../../generated/prisma/client.js";

export function toManagerDelegationDto(delegation: DelegationView) {
  const granted = delegation.permissions.map(
    (item) => item.permission as ManagerDelegationPermission,
  );
  const effective = deriveEffectivePermissions(granted);
  return {
    id: delegation.id,
    propertyId: delegation.propertyId,
    property: delegation.property,
    providerMembershipId: delegation.grantorProviderMembership.id,
    provider: delegation.grantorProviderMembership.provider,
    manager: delegation.manager,
    status: delegation.status,
    permissions: granted,
    effectivePermissions: [...effective],
    capabilities: buildCapabilities(effective, false),
    resourceIds: delegation.resources.map((item) => item.parkingSpotId),
    validFrom: delegation.validFrom,
    validUntil: delegation.validUntil,
    invitedAt: delegation.invitedAt,
    acceptedAt: delegation.acceptedAt,
    endedAt: delegation.endedAt,
  };
}
