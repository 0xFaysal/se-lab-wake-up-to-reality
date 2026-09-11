import { ManagerDelegationPermission, UserRoleType } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import type { GovernanceClient } from "./property-governance.repository.js";
import * as repository from "./property-governance.repository.js";

export type PropertyGovernanceMode = "SINGLE_PROVIDER" | "MULTI_PROVIDER";

export function governanceModeFromCount(count: number): PropertyGovernanceMode {
  return count <= 1 ? "SINGLE_PROVIDER" : "MULTI_PROVIDER";
}

export async function getPropertyGovernanceMode(
  propertyId: string,
  db?: GovernanceClient,
): Promise<PropertyGovernanceMode> {
  return governanceModeFromCount(
    await repository.getActiveVerifiedProviderCount(propertyId, db),
  );
}

export async function canManagePropertyCommonRules(
  userId: string,
  propertyId: string,
  db?: GovernanceClient,
): Promise<boolean> {
  const [membership, initialCreator, count, manager, admin] = await Promise.all([
    repository.findActiveVerifiedProviderMembership(userId, propertyId, db),
    repository.findInitialCreatorMembership(userId, propertyId, db),
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
  ]);
  return (
    (count === 0 && Boolean(initialCreator)) ||
    (count === 1 && Boolean(membership)) ||
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
  const count = await repository.getActiveVerifiedProviderCount(propertyId, db);
  if (count !== 1) return false;
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
    (await repository.findActiveVerifiedProviderMembership(userId, propertyId, db)) ||
      (await repository.findInitialCreatorMembership(userId, propertyId, db)) ||
      (await repository.findActiveBuildingManager(propertyId, db))?.candidateUserId === userId ||
      (await repository.findLiveManagerDelegation(
        userId,
        propertyId,
        ManagerDelegationPermission.RESOURCE_VIEW,
        undefined,
        db,
      )),
  );
}
