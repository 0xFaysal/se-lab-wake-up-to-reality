import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCampaignSchema,
  createEmailCampaignSchema,
  createEmailTemplateSchema,
  createFeeRuleSchema,
  listingReportResolutionSchema,
  propertyStatusSchema,
  resourceStatusSchema,
} from "../../../src/modules/admin/control/admin-control.schema.js";
import {
  adminParkingRightQuerySchema,
  verifyRightSchema,
} from "../../../src/modules/marketplace/marketplace.schema.js";

const id = "8c9f0dac-1260-4abc-a7d1-a7ebc1b6ab56";

describe("Advanced Admin control validation", () => {
  it("requires auditable reasons for resource and Property status changes", () => {
    assert.equal(resourceStatusSchema.safeParse({ params: { id }, body: { status: "MAINTENANCE", reason: "Scheduled electrical maintenance" } }).success, true);
    assert.equal(resourceStatusSchema.safeParse({ params: { id }, body: { status: "BLOCKED", reason: "short" } }).success, false);
    assert.equal(propertyStatusSchema.safeParse({ params: { id }, body: { status: "TEMPORARILY_CLOSED", reason: "Flooding inspection is in progress", closedUntil: "2026-10-01T12:00:00.000Z" } }).success, true);
  });

  it("enforces valid parking-right filters and review reasons", () => {
    assert.equal(adminParkingRightQuerySchema.safeParse({ query: { page: "2", limit: "25", status: "DISPUTED", propertyId: id } }).success, true);
    assert.equal(verifyRightSchema.safeParse({ params: { rightId: id }, body: { decision: "REVOKED", expectedVersion: 3 } }).success, false);
    assert.equal(verifyRightSchema.safeParse({ params: { rightId: id }, body: { decision: "REVOKED", reason: "Entitlement documentation was withdrawn", expectedVersion: 3 } }).success, true);
  });

  it("stores percentage fees as basis points and rejects mixed fee values", () => {
    const base = { scopeType: "GLOBAL", scopeId: null, effectiveFrom: "2026-10-01T00:00:00.000Z", effectiveUntil: null, reason: "Quarterly platform pricing review" };
    assert.equal(createFeeRuleSchema.safeParse({ body: { ...base, feeType: "PERCENTAGE", percentageBps: 500, fixedAmountPaisa: null } }).success, true);
    assert.equal(createFeeRuleSchema.safeParse({ body: { ...base, feeType: "PERCENTAGE", percentageBps: 500, fixedAmountPaisa: 100 } }).success, false);
  });

  it("validates role-targeted broadcast drafts without sending them", () => {
    assert.equal(createCampaignSchema.safeParse({ body: { title: "Provider maintenance", message: "Parking operations will be unavailable briefly.", audience: "PROVIDER" } }).success, true);
    assert.equal(createCampaignSchema.safeParse({ body: { title: "x", message: "no", audience: "EVERYONE" } }).success, false);
  });

  it("validates managed email templates and targeted campaign drafts", () => {
    assert.equal(createEmailTemplateSchema.safeParse({ body: { type: "EMAIL_VERIFICATION_OTP", name: "Email OTP", subject: "Code {{otp}}", htmlBody: "<p>Hello {{userName}}, {{otp}}</p>", textBody: "Hello {{userName}}, code {{otp}}", allowedVariables: ["userName", "otp"] } }).success, true);
    assert.equal(createEmailTemplateSchema.safeParse({ body: { type: "EMAIL_VERIFICATION_OTP", name: "Email OTP", subject: "Code", htmlBody: "short", textBody: "short", allowedVariables: ["serverSecret"] } }).success, false);
    assert.equal(createEmailCampaignSchema.safeParse({ body: { title: "Provider update", templateId: id, audience: "PROVIDER" } }).success, true);
  });

  it("requires a reason when closing a listing report", () => {
    assert.equal(listingReportResolutionSchema.safeParse({ params: { id }, body: { decision: "RESOLVED", reason: "Provider corrected the reported information" } }).success, true);
    assert.equal(listingReportResolutionSchema.safeParse({ params: { id }, body: { decision: "DISMISSED", reason: "short" } }).success, false);
  });
});
