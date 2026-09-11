import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commonRulesSchema, propertyChangeProposalSchema, temporaryClosureSchema } from "../../../src/modules/property-governance/property-governance.schema.js";
import type { GovernanceClient } from "../../../src/modules/property-governance/property-governance.repository.js";
import "../../helpers/test-env.js";

const { canManagePropertyCommonRules, governanceModeFromCount } = await import(
  "../../../src/modules/property-governance/property-governance.policy.js"
);

const propertyId = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";

describe("Property governance invariants", () => {
  function fakeDb(input: {
    verifiedMembership?: boolean;
    initialCreator?: boolean;
    providerCount: number;
    managerUserId?: string;
    admin?: boolean;
  }) {
    return {
      propertyProvider: {
        findFirst: async () => input.verifiedMembership ? { id: "membership" } : null,
        count: async () => input.providerCount,
      },
      property: { findFirst: async () => input.initialCreator ? { id: propertyId } : null },
      propertyBuildingManagerAssignment: {
        findFirst: async () => input.managerUserId ? { candidateUserId: input.managerUserId } : null,
      },
      providerManagerDelegation: { findFirst: async () => null },
      user: { findFirst: async () => input.admin ? { id: "admin" } : null },
    } as unknown as GovernanceClient;
  }

  it("derives governance mode instead of storing it", () => {
    assert.equal(governanceModeFromCount(0), "SINGLE_PROVIDER");
    assert.equal(governanceModeFromCount(1), "SINGLE_PROVIDER");
    assert.equal(governanceModeFromCount(2), "MULTI_PROVIDER");
  });

  it("requires optimistic versions for direct shared changes", () => {
    assert.equal(commonRulesSchema.safeParse({ params: { propertyId }, body: { visitorIdentificationRequired: true } }).success, false);
    assert.equal(temporaryClosureSchema.safeParse({ params: { propertyId }, body: { action: "REOPEN" } }).success, false);
  });

  it("accepts a strict multi-provider change proposal", () => {
    assert.equal(propertyChangeProposalSchema.safeParse({
      params: { propertyId },
      body: { changeType: "COMMON_RULES", baseVersion: 3, changes: { vehicleHeightLimitCm: 220 } },
    }).success, true);
  });

  it("grants direct common authority only to the sole Provider, initial creator, Building Manager, or Admin", async () => {
    assert.equal(await canManagePropertyCommonRules("provider", propertyId, fakeDb({ verifiedMembership: true, providerCount: 1 })), true);
    assert.equal(await canManagePropertyCommonRules("provider", propertyId, fakeDb({ verifiedMembership: true, providerCount: 2 })), false);
    assert.equal(await canManagePropertyCommonRules("creator", propertyId, fakeDb({ initialCreator: true, providerCount: 0 })), true);
    assert.equal(await canManagePropertyCommonRules("manager", propertyId, fakeDb({ providerCount: 3, managerUserId: "manager" })), true);
    assert.equal(await canManagePropertyCommonRules("unrelated", propertyId, fakeDb({ providerCount: 1 })), false);
    assert.equal(await canManagePropertyCommonRules("admin", propertyId, fakeDb({ providerCount: 3, admin: true })), true);
  });
});
