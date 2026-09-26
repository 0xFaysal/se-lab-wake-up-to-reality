import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ManagerDelegationPermission,
  UserRoleType,
  UserStatus,
  ManagerDelegationStatus,
} from "../../../generated/prisma/client.js";
import {
  deriveEffectivePermissions,
  permissionsSatisfying,
  buildCapabilities,
  requireBusinessAuthority,
} from "../../../src/common/auth/business-actor-context.js";

describe("BusinessActorContext & Permission Authority Invariants", () => {
  it("derives implied permissions correctly", () => {
    // RESOURCE_MANAGE implies RESOURCE_VIEW
    const resourceEffective = deriveEffectivePermissions([
      ManagerDelegationPermission.RESOURCE_MANAGE,
    ]);
    assert.ok(resourceEffective.has(ManagerDelegationPermission.RESOURCE_MANAGE));
    assert.ok(resourceEffective.has(ManagerDelegationPermission.RESOURCE_VIEW));

    // LISTING_MANAGE implies LISTING_VIEW
    const listingEffective = deriveEffectivePermissions([
      ManagerDelegationPermission.LISTING_MANAGE,
    ]);
    assert.ok(listingEffective.has(ManagerDelegationPermission.LISTING_MANAGE));
    assert.ok(listingEffective.has(ManagerDelegationPermission.LISTING_VIEW));

    // PRICE_MANAGE implies LISTING_VIEW
    const priceEffective = deriveEffectivePermissions([
      ManagerDelegationPermission.PRICE_MANAGE,
    ]);
    assert.ok(priceEffective.has(ManagerDelegationPermission.PRICE_MANAGE));
    assert.ok(priceEffective.has(ManagerDelegationPermission.LISTING_VIEW));

    // AVAILABILITY_MANAGE implies RESOURCE_VIEW
    const availEffective = deriveEffectivePermissions([
      ManagerDelegationPermission.AVAILABILITY_MANAGE,
    ]);
    assert.ok(availEffective.has(ManagerDelegationPermission.AVAILABILITY_MANAGE));
    assert.ok(availEffective.has(ManagerDelegationPermission.RESOURCE_VIEW));

    // GUARD_ASSIGN implies GUARD_VIEW
    const guardEffective = deriveEffectivePermissions([
      ManagerDelegationPermission.GUARD_ASSIGN,
    ]);
    assert.ok(guardEffective.has(ManagerDelegationPermission.GUARD_ASSIGN));
    assert.ok(guardEffective.has(ManagerDelegationPermission.GUARD_VIEW));
  });

  it("calculates permissionsSatisfying reverse-mapping correctly", () => {
    const satisfyingResourceView = permissionsSatisfying(
      ManagerDelegationPermission.RESOURCE_VIEW,
    );
    assert.ok(satisfyingResourceView.includes(ManagerDelegationPermission.RESOURCE_VIEW));
    assert.ok(satisfyingResourceView.includes(ManagerDelegationPermission.RESOURCE_MANAGE));

    const satisfyingListingView = permissionsSatisfying(
      ManagerDelegationPermission.LISTING_VIEW,
    );
    assert.ok(satisfyingListingView.includes(ManagerDelegationPermission.LISTING_VIEW));
    assert.ok(satisfyingListingView.includes(ManagerDelegationPermission.LISTING_MANAGE));
    assert.ok(satisfyingListingView.includes(ManagerDelegationPermission.PRICE_MANAGE));

    const satisfyingResourceManage = permissionsSatisfying(
      ManagerDelegationPermission.RESOURCE_MANAGE,
    );
    assert.deepEqual(satisfyingResourceManage, [
      ManagerDelegationPermission.RESOURCE_MANAGE,
    ]);
  });

  it("builds granular frontend capabilities with derived permissions", () => {
    const effective = deriveEffectivePermissions([
      ManagerDelegationPermission.PRICE_MANAGE,
      ManagerDelegationPermission.AVAILABILITY_MANAGE,
    ]);
    const caps = buildCapabilities(effective);

    assert.equal(caps.listings.price, true);
    assert.equal(caps.listings.view, true); // derived from PRICE_MANAGE
    assert.equal(caps.listings.create, false);
    assert.equal(caps.listings.edit, false);
    assert.equal(caps.availability.manage, true);
    assert.equal(caps.resources.create, false);
    assert.equal(caps.guards.assign, false);
  });

  it("grants DIRECT_PROVIDER authority to verified active provider", async () => {
    const mockDb = {
      propertyProvider: {
        findFirst: async () => ({
          id: "membership-1",
          providerUserId: "provider-user-1",
          propertyId: "property-1",
          status: "ACTIVE",
          verificationStatus: "VERIFIED",
        }),
      },
      user: {
        findFirst: async () => null,
      },
    } as any;

    const ctx = await requireBusinessAuthority({
      actorUserId: "provider-user-1",
      actorRole: UserRoleType.PROVIDER,
      propertyId: "property-1",
      permission: ManagerDelegationPermission.LISTING_MANAGE,
      db: mockDb,
    });

    assert.equal(ctx.authorityType, "DIRECT_PROVIDER");
    assert.equal(ctx.actorUserId, "provider-user-1");
    assert.equal(ctx.providerUserId, "provider-user-1");
    assert.equal(ctx.providerMembershipId, "membership-1");
  });

  it("grants MANAGER_DELEGATION authority to manager with valid delegation", async () => {
    const mockDb = {
      propertyProvider: {
        findFirst: async () => null,
      },
      user: {
        findFirst: async () => ({
          id: "manager-user-1",
          roles: [{ role: UserRoleType.MANAGER }],
        }),
      },
      providerManagerDelegation: {
        findMany: async () => [
          {
            id: "delegation-1",
            managerUserId: "manager-user-1",
            propertyId: "property-1",
            status: ManagerDelegationStatus.ACTIVE,
            validFrom: null,
            validUntil: null,
            resources: [{ parkingSpotId: "resource-zone-a" }],
            grantorProviderMembershipId: "membership-1",
            grantorProviderMembership: {
              id: "membership-1",
              providerUserId: "provider-user-1",
              propertyId: "property-1",
              status: "ACTIVE",
              verificationStatus: "VERIFIED",
              providerUser: {
                id: "provider-user-1",
                status: UserStatus.ACTIVE,
                verificationStatus: "VERIFIED",
              },
            },
            permissions: [
              { permission: ManagerDelegationPermission.LISTING_MANAGE },
            ],
          },
        ],
      },
    } as any;

    const ctx = await requireBusinessAuthority({
      actorUserId: "manager-user-1",
      actorRole: UserRoleType.MANAGER,
      propertyId: "property-1",
      resourceId: "resource-zone-a",
      permission: ManagerDelegationPermission.LISTING_MANAGE,
      db: mockDb,
    });

    assert.equal(ctx.authorityType, "MANAGER_DELEGATION");
    assert.equal(ctx.actorUserId, "manager-user-1");
    assert.equal(ctx.providerUserId, "provider-user-1");
    assert.equal(ctx.delegationId, "delegation-1");
  });

  it("rejects manager when outside resource scope", async () => {
    const mockDb = {
      propertyProvider: {
        findFirst: async () => null,
      },
      user: {
        findFirst: async () => ({
          id: "manager-user-1",
          roles: [{ role: UserRoleType.MANAGER }],
        }),
      },
      providerManagerDelegation: {
        findMany: async () => [
          {
            id: "delegation-1",
            managerUserId: "manager-user-1",
            propertyId: "property-1",
            status: ManagerDelegationStatus.ACTIVE,
            validFrom: null,
            validUntil: null,
            resources: [{ parkingSpotId: "resource-zone-a" }],
            grantorProviderMembershipId: "membership-1",
            grantorProviderMembership: {
              id: "membership-1",
              providerUserId: "provider-user-1",
              propertyId: "property-1",
              status: "ACTIVE",
              verificationStatus: "VERIFIED",
              providerUser: {
                id: "provider-user-1",
                status: UserStatus.ACTIVE,
                verificationStatus: "VERIFIED",
              },
            },
            permissions: [
              { permission: ManagerDelegationPermission.LISTING_MANAGE },
            ],
          },
        ],
      },
    } as any;

    await assert.rejects(
      async () => {
        await requireBusinessAuthority({
          actorUserId: "manager-user-1",
          actorRole: UserRoleType.MANAGER,
          propertyId: "property-1",
          resourceId: "resource-zone-b", // Out of scope!
          permission: ManagerDelegationPermission.LISTING_MANAGE,
          db: mockDb,
        });
      },
      (err: any) => {
        assert.equal(err.code, "MANAGER_RESOURCE_SCOPE_DENIED");
        return true;
      },
    );
  });
});
