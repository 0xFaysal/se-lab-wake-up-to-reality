import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createManagerDelegationSchema } from "../../../src/modules/manager-delegations/manager-delegation.schema.js";
import { ManagerDelegationPermission } from "../../../generated/prisma/client.js";
import type { GovernanceClient } from "../../../src/modules/property-governance/property-governance.repository.js";
import "../../helpers/test-env.js";

const { findLiveManagerDelegation } = await import(
  "../../../src/modules/property-governance/property-governance.repository.js"
);

const valid = {
  propertyId: "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56",
  managerUserId: "65bb81d0-90ca-49bb-a918-bb1db912d352",
  permissions: ["RESOURCE_VIEW", "IMAGE_MANAGE"],
  resourceIds: [],
};

describe("Manager delegation validation", () => {
  it("accepts a unique least-privilege permission set", () => {
    assert.equal(createManagerDelegationSchema.safeParse({ body: valid }).success, true);
  });

  it("rejects duplicate permissions and inverted validity windows", () => {
    assert.equal(createManagerDelegationSchema.safeParse({ body: { ...valid, permissions: ["RESOURCE_VIEW", "RESOURCE_VIEW"] } }).success, false);
    assert.equal(createManagerDelegationSchema.safeParse({ body: {
      ...valid,
      validFrom: "2026-09-12T12:00:00.000Z",
      validUntil: "2026-09-12T11:00:00.000Z",
    } }).success, false);
  });

  it("queries permission in the exact Provider and Property scope", async () => {
    let capturedWhere: unknown;
    const db = {
      providerManagerDelegation: {
        findFirst: async (args: { where: unknown }) => {
          capturedWhere = args.where;
          return null;
        },
      },
    } as unknown as GovernanceClient;
    const result = await findLiveManagerDelegation(
      "manager-id",
      "property-id",
      ManagerDelegationPermission.PRICE_MANAGE,
      "provider-membership-a",
      db,
    );
    assert.equal(result, null);
    assert.deepEqual(
      {
        managerUserId: (capturedWhere as { managerUserId: string }).managerUserId,
        propertyId: (capturedWhere as { propertyId: string }).propertyId,
        providerMembershipId: (capturedWhere as { grantorProviderMembershipId: string }).grantorProviderMembershipId,
        permission: (capturedWhere as { permissions: { some: { permission: string } } }).permissions.some.permission,
      },
      {
        managerUserId: "manager-id",
        propertyId: "property-id",
        providerMembershipId: "provider-membership-a",
        permission: "PRICE_MANAGE",
      },
    );
  });
});
