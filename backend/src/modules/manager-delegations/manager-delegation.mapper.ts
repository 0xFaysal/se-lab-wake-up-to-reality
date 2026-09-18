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
  property: { id: string; name: string; publicArea: string };
  manager: { id: string; fullName: string };
  grantorProviderMembership: {
    id: string;
    provider: { id: string; fullName: string };
  };
};

export function toManagerDelegationDto(delegation: DelegationView) {
  return {
    id: delegation.id,
    property: delegation.property,
    providerMembershipId: delegation.grantorProviderMembership.id,
    provider: delegation.grantorProviderMembership.provider,
    manager: delegation.manager,
    status: delegation.status,
    permissions: delegation.permissions.map((item) => item.permission),
    resourceIds: delegation.resources.map((item) => item.parkingSpotId),
    validFrom: delegation.validFrom,
    validUntil: delegation.validUntil,
    invitedAt: delegation.invitedAt,
    acceptedAt: delegation.acceptedAt,
    endedAt: delegation.endedAt,
  };
}
