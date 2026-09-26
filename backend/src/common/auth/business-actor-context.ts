import {
  ManagerDelegationPermission,
  ManagerDelegationStatus,
  type Prisma,
  PropertyProviderStatus,
  UserRoleType,
  VerificationStatus,
} from "../../../generated/prisma/client.js";
import { AppError } from "../errors/app-error.js";
import { prisma } from "../../config/prisma.js";

export type AuthorityType = "DIRECT_PROVIDER" | "MANAGER_DELEGATION";

export interface BusinessActorContext {
  actorUserId: string;
  actorRole: UserRoleType;
  authorityType: AuthorityType;
  providerUserId: string;
  providerMembershipId: string;
  propertyId: string;
  delegationId?: string | undefined;
  grantedPermissions: ManagerDelegationPermission[];
  effectivePermissions: Set<ManagerDelegationPermission>;
  resourceScope?: string[] | undefined; // undefined or empty = whole property
}

/**
 * Returns all granted permissions that can satisfy a required permission.
 * Central place for permission dependencies.
 */
export function permissionsSatisfying(
  permission: ManagerDelegationPermission,
): ManagerDelegationPermission[] {
  const satisfying: ManagerDelegationPermission[] = [permission];
  switch (permission) {
    case ManagerDelegationPermission.RESOURCE_VIEW:
      satisfying.push(
        ManagerDelegationPermission.RESOURCE_MANAGE,
        ManagerDelegationPermission.AVAILABILITY_MANAGE,
        ManagerDelegationPermission.LISTING_MANAGE,
      );
      break;
    case ManagerDelegationPermission.LISTING_VIEW:
      satisfying.push(
        ManagerDelegationPermission.LISTING_MANAGE,
        ManagerDelegationPermission.PRICE_MANAGE,
      );
      break;
    case ManagerDelegationPermission.BOOKING_VIEW:
      satisfying.push(ManagerDelegationPermission.BOOKING_MANAGE);
      break;
    case ManagerDelegationPermission.GUARD_VIEW:
      satisfying.push(
        ManagerDelegationPermission.GUARD_ASSIGN,
        ManagerDelegationPermission.GUARD_ADD_TO_PROPERTY,
      );
      break;
  }
  return satisfying;
}

/**
 * Derives the effective permission set from a list of granted permissions.
 * RESOURCE_MANAGE -> RESOURCE_VIEW
 * LISTING_MANAGE -> LISTING_VIEW
 * PRICE_MANAGE -> LISTING_VIEW
 * AVAILABILITY_MANAGE -> RESOURCE_VIEW
 * BOOKING_MANAGE -> BOOKING_VIEW
 * GUARD_ASSIGN -> GUARD_VIEW
 * GUARD_ADD_TO_PROPERTY -> GUARD_VIEW
 */
export function deriveEffectivePermissions(
  permissions: Iterable<ManagerDelegationPermission>,
): Set<ManagerDelegationPermission> {
  const effective = new Set<ManagerDelegationPermission>(permissions);
  for (const perm of permissions) {
    switch (perm) {
      case ManagerDelegationPermission.RESOURCE_MANAGE:
        effective.add(ManagerDelegationPermission.RESOURCE_VIEW);
        break;
      case ManagerDelegationPermission.LISTING_MANAGE:
        effective.add(ManagerDelegationPermission.LISTING_VIEW);
        effective.add(ManagerDelegationPermission.RESOURCE_VIEW);
        break;
      case ManagerDelegationPermission.PRICE_MANAGE:
        effective.add(ManagerDelegationPermission.LISTING_VIEW);
        break;
      case ManagerDelegationPermission.AVAILABILITY_MANAGE:
        effective.add(ManagerDelegationPermission.RESOURCE_VIEW);
        break;
      case ManagerDelegationPermission.BOOKING_MANAGE:
        effective.add(ManagerDelegationPermission.BOOKING_VIEW);
        break;
      case ManagerDelegationPermission.GUARD_ASSIGN:
        effective.add(ManagerDelegationPermission.GUARD_VIEW);
        break;
      case ManagerDelegationPermission.GUARD_ADD_TO_PROPERTY:
        effective.add(ManagerDelegationPermission.GUARD_VIEW);
        break;
    }
  }
  return effective;
}

/**
 * Builds user-facing capability flags from effective permissions.
 */
export function buildCapabilities(
  effectivePermissionsInput:
    | Set<ManagerDelegationPermission>
    | ManagerDelegationPermission[],
  isProvider = false,
) {
  const effectivePermissions =
    effectivePermissionsInput instanceof Set
      ? effectivePermissionsInput
      : new Set(effectivePermissionsInput);
  if (isProvider) {
    return {
      resources: { view: true, create: true, edit: true, delete: true },
      listings: {
        view: true,
        create: true,
        edit: true,
        pause: true,
        resume: true,
        price: true,
        end: true,
      },
      availability: { view: true, manage: true },
      bookings: { view: true, manage: true },
      guards: { view: true, add: true, assign: true },
      images: { manage: true },
      earnings: { view: true },
      reports: { view: true },
    };
  }
  return {
    resources: {
      view: effectivePermissions.has(ManagerDelegationPermission.RESOURCE_VIEW),
      create: effectivePermissions.has(
        ManagerDelegationPermission.RESOURCE_MANAGE,
      ),
      edit: effectivePermissions.has(
        ManagerDelegationPermission.RESOURCE_MANAGE,
      ),
      delete: effectivePermissions.has(
        ManagerDelegationPermission.RESOURCE_MANAGE,
      ),
    },
    listings: {
      view: effectivePermissions.has(ManagerDelegationPermission.LISTING_VIEW),
      create: effectivePermissions.has(
        ManagerDelegationPermission.LISTING_MANAGE,
      ),
      edit: effectivePermissions.has(
        ManagerDelegationPermission.LISTING_MANAGE,
      ),
      pause: effectivePermissions.has(
        ManagerDelegationPermission.LISTING_MANAGE,
      ),
      resume: effectivePermissions.has(
        ManagerDelegationPermission.LISTING_MANAGE,
      ),
      price: effectivePermissions.has(ManagerDelegationPermission.PRICE_MANAGE),
      end: effectivePermissions.has(ManagerDelegationPermission.LISTING_MANAGE),
    },
    availability: {
      view: effectivePermissions.has(ManagerDelegationPermission.RESOURCE_VIEW),
      manage: effectivePermissions.has(
        ManagerDelegationPermission.AVAILABILITY_MANAGE,
      ),
    },
    bookings: {
      view: effectivePermissions.has(ManagerDelegationPermission.BOOKING_VIEW),
      manage: effectivePermissions.has(
        ManagerDelegationPermission.BOOKING_MANAGE,
      ),
    },
    guards: {
      view: effectivePermissions.has(ManagerDelegationPermission.GUARD_VIEW),
      add: effectivePermissions.has(
        ManagerDelegationPermission.GUARD_ADD_TO_PROPERTY,
      ),
      assign: effectivePermissions.has(
        ManagerDelegationPermission.GUARD_ASSIGN,
      ),
    },
    images: {
      manage: effectivePermissions.has(ManagerDelegationPermission.IMAGE_MANAGE),
    },
    earnings: {
      view: effectivePermissions.has(ManagerDelegationPermission.EARNINGS_VIEW),
    },
    reports: {
      view: effectivePermissions.has(ManagerDelegationPermission.REPORTS_VIEW),
    },
  };
}

/**
 * Central business authority resolver.
 * Ensures either direct Provider authority or valid Manager delegated authority.
 */
export async function requireBusinessAuthority(params: {
  actorUserId: string;
  propertyId: string;
  permission?: ManagerDelegationPermission;
  resourceId?: string;
  providerMembershipId?: string;
  db?: Prisma.TransactionClient | typeof prisma;
}): Promise<BusinessActorContext> {
  const db = params.db ?? prisma;

  // 1. Direct Provider check
  const directMembership = await db.propertyProvider.findFirst({
    where: {
      propertyId: params.propertyId,
      providerUserId: params.actorUserId,
      status: PropertyProviderStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
      property: { deletedAt: null, canonicalPropertyId: null },
      ...(params.providerMembershipId
        ? { id: params.providerMembershipId }
        : {}),
    },
  });

  if (directMembership) {
    const allPermissions = Object.values(ManagerDelegationPermission);
    const effective = new Set(allPermissions);
    return {
      actorUserId: params.actorUserId,
      actorRole: UserRoleType.PROVIDER,
      authorityType: "DIRECT_PROVIDER",
      providerUserId: directMembership.providerUserId,
      providerMembershipId: directMembership.id,
      propertyId: params.propertyId,
      grantedPermissions: allPermissions,
      effectivePermissions: effective,
    };
  }

  // 2. Delegated Manager check
  const user = await db.user.findFirst({
    where: {
      id: params.actorUserId,
      deletedAt: null,
    },
    select: {
      roles: { select: { role: true } },
    },
  });

  const isManager = user?.roles.some((r) => r.role === UserRoleType.MANAGER);
  if (!isManager) {
    throw new AppError({
      statusCode: 403,
      code: "MANAGER_DELEGATION_REQUIRED",
      message: "You must be an active Provider or Manager to perform this action",
    });
  }

  // Look for delegations for this property
  const now = new Date();
  const delegations = await db.providerManagerDelegation.findMany({
    where: {
      managerUserId: params.actorUserId,
      propertyId: params.propertyId,
      property: { deletedAt: null, canonicalPropertyId: null },
      ...(params.providerMembershipId
        ? { grantorProviderMembershipId: params.providerMembershipId }
        : {}),
    },
    include: {
      permissions: { select: { permission: true } },
      resources: { select: { parkingSpotId: true } },
      grantorProviderMembership: true,
    },
  });

  if (delegations.length === 0) {
    throw new AppError({
      statusCode: 403,
      code: "MANAGER_PROPERTY_SCOPE_DENIED",
      message: "You do not have a delegation for this property",
    });
  }

  // Find active delegation
  const activeDelegation = delegations.find((d) => {
    if (d.status !== ManagerDelegationStatus.ACTIVE) return false;
    if (
      d.grantorProviderMembership.status !== PropertyProviderStatus.ACTIVE ||
      d.grantorProviderMembership.verificationStatus !==
        VerificationStatus.VERIFIED
    ) {
      return false;
    }
    if (d.validFrom && d.validFrom > now) return false;
    if (d.validUntil && d.validUntil <= now) return false;
    return true;
  });

  if (!activeDelegation) {
    const expired = delegations.find(
      (d) => d.validUntil && d.validUntil <= now,
    );
    if (expired) {
      throw new AppError({
        statusCode: 403,
        code: "MANAGER_DELEGATION_EXPIRED",
        message: "Your delegation for this property has expired",
      });
    }
    const revokedOrEnded = delegations.find(
      (d) =>
        d.status === ManagerDelegationStatus.ENDED ||
        d.status === ManagerDelegationStatus.CANCELLED,
    );
    if (revokedOrEnded) {
      throw new AppError({
        statusCode: 403,
        code: "MANAGER_DELEGATION_REVOKED",
        message: "Your delegation for this property has been revoked or ended",
      });
    }
    throw new AppError({
      statusCode: 403,
      code: "MANAGER_DELEGATION_INACTIVE",
      message: "Your delegation for this property is not active",
    });
  }

  const resourceIds = activeDelegation.resources.map((r) => r.parkingSpotId);
  const isRestrictedScope = resourceIds.length > 0;

  // Check resource scope if resourceId is specified
  if (params.resourceId && isRestrictedScope) {
    if (!resourceIds.includes(params.resourceId)) {
      throw new AppError({
        statusCode: 403,
        code: "MANAGER_RESOURCE_SCOPE_DENIED",
        message: "This resource is outside your delegated scope",
      });
    }
  }

  const granted = activeDelegation.permissions.map((p) => p.permission);
  const effective = deriveEffectivePermissions(granted);

  // Check permission if specified
  if (params.permission && !effective.has(params.permission)) {
    throw new AppError({
      statusCode: 403,
      code: "MANAGER_PERMISSION_REQUIRED",
      message: `Permission ${params.permission} is required for this operation`,
      details: { required: params.permission, granted },
    });
  }

  return {
    actorUserId: params.actorUserId,
    actorRole: UserRoleType.MANAGER,
    authorityType: "MANAGER_DELEGATION",
    providerUserId: activeDelegation.grantorProviderMembership.providerUserId,
    providerMembershipId: activeDelegation.grantorProviderMembershipId,
    propertyId: params.propertyId,
    delegationId: activeDelegation.id,
    grantedPermissions: granted,
    effectivePermissions: effective,
    resourceScope: isRestrictedScope ? resourceIds : undefined,
  };
}
