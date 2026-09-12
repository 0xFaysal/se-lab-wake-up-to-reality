import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildingManagerVoteSchema,
  commonRulesSchema,
  propertyChangeProposalSchema,
  propertyChangeVoteSchema,
  temporaryClosureSchema,
} from "../../../src/modules/property-governance/property-governance.schema.js";
import type { GovernanceClient } from "../../../src/modules/property-governance/property-governance.repository.js";
import "../../helpers/test-env.js";

const { canManagePropertyCommonRules, governanceModeFromCount } = await import(
  "../../../src/modules/property-governance/property-governance.policy.js"
);

const propertyId = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";
const assignmentId = "65bb81d0-90ca-49bb-a918-bb1db912d352";
const proposalId = "3ec149eb-1c2f-45d7-84fa-4a1df93a402f";

describe("Property governance invariants", () => {
  function fakeDb(input: {
    verifiedMembership?: boolean;
    provisionalMembership?: boolean;
    providerCount: number;
    managerUserId?: string;
    admin?: boolean;
  }) {
    return {
      propertyProvider: {
        findFirst: async (args: { where: { property?: unknown; verificationStatus?: unknown } }) => {
          if (args.where.property) {
            return input.provisionalMembership
              ? { id: "provisional-membership" }
              : null;
          }
          return input.verifiedMembership
            ? { id: "verified-membership" }
            : null;
        },
        count: async () => input.providerCount,
      },
      property: { findFirst: async () => null },
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
    assert.equal(propertyChangeProposalSchema.safeParse({
      params: { propertyId },
      body: {
        changeType: "TEMPORARY_CLOSURE",
        baseVersion: 3,
        changes: { action: "CLOSE", reason: "Flooding" },
      },
    }).success, false);
  });

  it("requires the correct scoped identifier for each vote endpoint", () => {
    assert.equal(buildingManagerVoteSchema.safeParse({
      params: { propertyId, assignmentId },
      body: { decision: "APPROVE" },
    }).success, true);
    assert.equal(buildingManagerVoteSchema.safeParse({
      params: { propertyId },
      body: { decision: "APPROVE" },
    }).success, false);
    assert.equal(propertyChangeVoteSchema.safeParse({
      params: { propertyId, proposalId },
      body: { decision: "REJECT", reason: "Address evidence is incomplete" },
    }).success, true);
  });

  it("grants direct common authority only through a Provider relationship, Building Manager assignment, or Admin role", async () => {
    assert.equal(await canManagePropertyCommonRules("pending-provider", propertyId, fakeDb({ provisionalMembership: true, providerCount: 0 })), true);
    assert.equal(await canManagePropertyCommonRules("creator-without-membership", propertyId, fakeDb({ providerCount: 0 })), false);
    assert.equal(await canManagePropertyCommonRules("provider", propertyId, fakeDb({ verifiedMembership: true, providerCount: 1 })), true);
    assert.equal(await canManagePropertyCommonRules("provider", propertyId, fakeDb({ verifiedMembership: true, providerCount: 2 })), false);
    assert.equal(await canManagePropertyCommonRules("pending-provider", propertyId, fakeDb({ activeMembership: true, providerCount: 0 })), true);
    assert.equal(await canManagePropertyCommonRules("creator-only", propertyId, fakeDb({ providerCount: 0 })), false);
    assert.equal(await canManagePropertyCommonRules("manager", propertyId, fakeDb({ providerCount: 3, managerUserId: "manager" })), true);
    assert.equal(await canManagePropertyCommonRules("unrelated", propertyId, fakeDb({ providerCount: 1 })), false);
    assert.equal(await canManagePropertyCommonRules("admin", propertyId, fakeDb({ providerCount: 3, admin: true })), true);
  });
});
