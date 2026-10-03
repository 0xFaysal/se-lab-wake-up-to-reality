import {
  ManagerDelegationPermission,
  UserRoleType,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import type { GovernanceClient } from "./property-governance.repository.js";
import * as repository from "./property-governance.repository.js";

export type PropertyGovernanceMode = "SINGLE_PROVIDER" | "MULTI_PROVIDER";

export function governanceModeFromCount(
  count: number,
  isSharedBuilding = false,
): PropertyGovernanceMode {
  return count <= 1 && !isSharedBuilding ? "SINGLE_PROVIDER" : "MULTI_PROVIDER";
}

export async function getPropertyGovernanceMode(
  propertyId: string,
  db?: GovernanceClient,
): Promise<PropertyGovernanceMode> {
  const property = await (db ?? prisma).property.findUnique({
    where: { id: propertyId },
    select: { isSharedBuilding: true },
  });
  return governanceModeFromCount(
    await repository.getActiveVerifiedProviderCount(propertyId, db),
    property?.isSharedBuilding,
  );
}

export async function canManagePropertyCommonRules(
  userId: string,
  propertyId: string,
  db?: GovernanceClient,
): Promise<boolean> {
  const [
    verifiedMembership,
    provisionalMembership,
    count,
    manager,
    admin,
    property,
  ] = await Promise.all([
    repository.findActiveVerifiedProviderMembership(userId, propertyId, db),
    repository.findProvisionalProviderMembership(userId, propertyId, db),
    repository.getActiveVerifiedProviderCount(propertyId, db),
    repository.findActiveBuildingManager(propertyId, db),
    (db ?? prisma).user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        roles: { some: { role: UserRoleType.ADMIN } },
      },
      select: { id: true },
    }),
    (db ?? prisma).property.findUnique({
      where: { id: propertyId },
      select: { isSharedBuilding: true },
    }),
  ]);
  return (
    (count === 0 && Boolean(provisionalMembership)) ||
    (count === 1 &&
      !property?.isSharedBuilding &&
      Boolean(verifiedMembership)) ||
    manager?.candidateUserId === userId ||
    Boolean(admin)
  );
}

export const canManageTemporaryClosure = canManagePropertyCommonRules;

export async function canManageSharedPropertyImages(
  userId: string,
  propertyId: string,
  db?: GovernanceClient,
): Promise<boolean> {
  if (await canManagePropertyCommonRules(userId, propertyId, db)) return true;
  return Boolean(
    await repository.findLiveManagerDelegation(
      userId,
      propertyId,
      ManagerDelegationPermission.IMAGE_MANAGE,
      undefined,
      db,
    ),
  );
}

export async function canReadProviderProperty(
  userId: string,
  propertyId: string,
  db?: GovernanceClient,
): Promise<boolean> {
  const admin = await (db ?? prisma).user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      roles: { some: { role: UserRoleType.ADMIN } },
    },
    select: { id: true },
  });
  if (admin) return true;
  return Boolean(
    (await repository.findActiveVerifiedProviderMembership(
      userId,
      propertyId,
      db,
    )) ||
    (await repository.findProvisionalProviderMembership(
      userId,
      propertyId,
      db,
    )) ||
    (await repository.findActiveBuildingManager(propertyId, db))
      ?.candidateUserId === userId ||
    (await repository.findLiveManagerDelegation(
      userId,
      propertyId,
      ManagerDelegationPermission.RESOURCE_VIEW,
      undefined,
      db,
    )),
  );
}
