-- Migrate the supply-side role without keeping two semantically identical roles.
ALTER TYPE "user_role" RENAME VALUE 'PARKING_OWNER' TO 'PROVIDER';
ALTER TYPE "account_origin" RENAME VALUE 'OWNER_CREATED_GUARD' TO 'PROVIDER_CREATED_GUARD';
ALTER TYPE "user_role" ADD VALUE 'MANAGER' BEFORE 'GUARD';
ALTER TYPE "account_origin" ADD VALUE 'PROVIDER_CREATED_MANAGER';
ALTER TYPE "account_origin" ADD VALUE 'ADMIN_CREATED_MANAGER';

CREATE TYPE "property_provider_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'ENDED');
CREATE TYPE "building_manager_assignment_status" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'ENDED', 'CANCELLED', 'PENDING_RECONFIRMATION');
CREATE TYPE "governance_vote_decision" AS ENUM ('APPROVE', 'REJECT');
CREATE TYPE "manager_delegation_status" AS ENUM ('PENDING_ACCEPTANCE', 'ACTIVE', 'SUSPENDED', 'ENDED', 'CANCELLED');
CREATE TYPE "manager_delegation_permission" AS ENUM ('RESOURCE_VIEW', 'LISTING_VIEW', 'LISTING_MANAGE', 'PRICE_MANAGE', 'AVAILABILITY_MANAGE', 'BOOKING_VIEW', 'BOOKING_MANAGE', 'IMAGE_MANAGE', 'GUARD_VIEW', 'GUARD_ADD_TO_PROPERTY', 'GUARD_ASSIGN', 'EARNINGS_VIEW', 'REPORTS_VIEW');
CREATE TYPE "property_guard_membership_status" AS ENUM ('PENDING_ACCEPTANCE', 'ACTIVE', 'SUSPENDED', 'ENDED', 'CANCELLED');
CREATE TYPE "property_change_type" AS ENUM ('COMMON_RULES', 'TEMPORARY_CLOSURE', 'IDENTITY_LOCATION');
CREATE TYPE "property_change_proposal_status" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'APPLIED', 'STALE', 'CANCELLED');
CREATE TYPE "domain_audit_event_type" AS ENUM ('PROPERTY_PROVIDER_JOINED', 'PROPERTY_PROVIDER_ENDED', 'BUILDING_MANAGER_NOMINATED', 'BUILDING_MANAGER_APPROVED', 'BUILDING_MANAGER_REJECTED', 'BUILDING_MANAGER_ACTIVATED', 'BUILDING_MANAGER_ENDED', 'PROPERTY_CHANGE_PROPOSED', 'PROPERTY_CHANGE_APPROVED', 'PROPERTY_CHANGE_REJECTED', 'PROPERTY_CHANGE_APPLIED', 'MANAGER_DELEGATION_CREATED', 'MANAGER_DELEGATION_ACCEPTED', 'MANAGER_PERMISSION_UPDATED', 'MANAGER_DELEGATION_ENDED', 'PROPERTY_GUARD_ADDED', 'PROPERTY_GUARD_REMOVED', 'PROVIDER_GUARD_ASSIGNED', 'PROVIDER_GUARD_ASSIGNMENT_ENDED', 'PROPERTY_MERGED');

-- Property creator is audit provenance, not permanent authority.
ALTER TABLE "properties" RENAME COLUMN "owner_user_id" TO "created_by_user_id";
ALTER TABLE "properties" ADD COLUMN "normalized_name" VARCHAR(150);
UPDATE "properties"
SET "normalized_name" = lower(regexp_replace(trim("name"), '\s+', ' ', 'g'));
ALTER TABLE "properties" ALTER COLUMN "normalized_name" SET NOT NULL;
ALTER TABLE "properties"
  ADD COLUMN "address_fingerprint" VARCHAR(64),
  ADD COLUMN "visitor_identification_required" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "vehicle_height_limit_cm" INTEGER,
  ADD COLUMN "entry_cutoff_local_time" TIME(6),
  ADD COLUMN "general_parking_rules" TEXT,
  ADD COLUMN "common_safety_rules" TEXT,
  ADD COLUMN "temporary_closure_reason" VARCHAR(500),
  ADD COLUMN "temporary_closed_at" TIMESTAMPTZ(6),
  ADD COLUMN "temporary_closed_until" TIMESTAMPTZ(6),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "canonical_property_id" UUID,
  ADD COLUMN "archived_at" TIMESTAMPTZ(6);
ALTER TABLE "properties" ADD CONSTRAINT "properties_version_check" CHECK ("version" > 0);
ALTER TABLE "properties" ADD CONSTRAINT "properties_vehicle_height_limit_check" CHECK ("vehicle_height_limit_cm" IS NULL OR "vehicle_height_limit_cm" > 0);
ALTER TABLE "properties" ADD CONSTRAINT "properties_canonical_property_id_fkey" FOREIGN KEY ("canonical_property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "properties_normalized_name_public_area_idx" ON "properties"("normalized_name", "public_area");
CREATE INDEX "properties_address_fingerprint_idx" ON "properties"("address_fingerprint");
CREATE INDEX "properties_canonical_property_id_idx" ON "properties"("canonical_property_id");

CREATE TABLE "property_providers" (
  "id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "provider_user_id" UUID NOT NULL,
  "status" "property_provider_status" NOT NULL DEFAULT 'ACTIVE',
  "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING',
  "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified_by_admin_id" UUID,
  "verified_at" TIMESTAMPTZ(6),
  "rejection_reason" VARCHAR(500),
  "ended_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "property_providers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "property_providers_property_id_provider_user_id_key" UNIQUE ("property_id", "provider_user_id"),
  CONSTRAINT "property_providers_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "property_providers_provider_user_id_fkey" FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "property_providers_verified_by_admin_id_fkey" FOREIGN KEY ("verified_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "property_providers_property_id_status_verification_status_idx" ON "property_providers"("property_id", "status", "verification_status");
CREATE INDEX "property_providers_provider_user_id_status_verification_status_idx" ON "property_providers"("provider_user_id", "status", "verification_status");

-- Every legacy Property creator becomes that Property's initial Provider.
INSERT INTO "property_providers" (
  "id", "property_id", "provider_user_id", "status", "verification_status",
  "joined_at", "verified_by_admin_id", "verified_at", "created_at", "updated_at"
)
SELECT
  gen_random_uuid(), p."id", p."created_by_user_id", 'ACTIVE'::"property_provider_status",
  CASE WHEN p."verification_status" = 'VERIFIED' THEN 'VERIFIED'::"verification_status" ELSE 'PENDING'::"verification_status" END,
  p."created_at", p."verified_by_admin_id", p."verified_at", p."created_at", p."updated_at"
FROM "properties" p;

CREATE TABLE "property_building_manager_assignments" (
  "id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "candidate_user_id" UUID NOT NULL,
  "nominated_by_user_id" UUID NOT NULL,
  "status" "building_manager_assignment_status" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "nominated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activated_at" TIMESTAMPTZ(6),
  "ended_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "property_building_manager_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "property_building_manager_assignments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "property_building_manager_assignments_candidate_user_id_fkey" FOREIGN KEY ("candidate_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "property_building_manager_assignments_nominated_by_user_id_fkey" FOREIGN KEY ("nominated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "property_building_manager_assignments_property_id_status_idx" ON "property_building_manager_assignments"("property_id", "status");
CREATE INDEX "property_building_manager_assignments_candidate_user_id_status_idx" ON "property_building_manager_assignments"("candidate_user_id", "status");
CREATE UNIQUE INDEX "property_building_manager_one_active_idx" ON "property_building_manager_assignments"("property_id") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "property_building_manager_one_pending_idx" ON "property_building_manager_assignments"("property_id") WHERE "status" IN ('PENDING_APPROVAL', 'PENDING_RECONFIRMATION');

CREATE TABLE "property_building_manager_votes" (
  "id" UUID NOT NULL,
  "assignment_id" UUID NOT NULL,
  "provider_membership_id" UUID NOT NULL,
  "voter_user_id" UUID NOT NULL,
  "decision" "governance_vote_decision" NOT NULL,
  "reason" VARCHAR(500),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_building_manager_votes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "property_building_manager_votes_assignment_id_provider_membership_id_key" UNIQUE ("assignment_id", "provider_membership_id"),
  CONSTRAINT "property_building_manager_votes_reject_reason_check" CHECK ("decision" <> 'REJECT' OR length(trim("reason")) >= 5),
  CONSTRAINT "property_building_manager_votes_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "property_building_manager_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "property_building_manager_votes_provider_membership_id_fkey" FOREIGN KEY ("provider_membership_id") REFERENCES "property_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "property_building_manager_votes_voter_user_id_fkey" FOREIGN KEY ("voter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "property_building_manager_votes_assignment_id_decision_idx" ON "property_building_manager_votes"("assignment_id", "decision");

CREATE TABLE "provider_manager_delegations" (
  "id" UUID NOT NULL,
  "grantor_provider_membership_id" UUID NOT NULL,
  "manager_user_id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "status" "manager_delegation_status" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
  "valid_from" TIMESTAMPTZ(6),
  "valid_until" TIMESTAMPTZ(6),
  "invited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accepted_at" TIMESTAMPTZ(6),
  "ended_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "provider_manager_delegations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_manager_delegations_validity_check" CHECK ("valid_until" IS NULL OR "valid_from" IS NULL OR "valid_until" > "valid_from"),
  CONSTRAINT "provider_manager_delegations_grantor_provider_membership_id_fkey" FOREIGN KEY ("grantor_provider_membership_id") REFERENCES "property_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "provider_manager_delegations_manager_user_id_fkey" FOREIGN KEY ("manager_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "provider_manager_delegations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "provider_manager_delegations_grantor_provider_membership_id_status_idx" ON "provider_manager_delegations"("grantor_provider_membership_id", "status");
CREATE INDEX "provider_manager_delegations_manager_user_id_status_property_id_idx" ON "provider_manager_delegations"("manager_user_id", "status", "property_id");
CREATE INDEX "provider_manager_delegations_property_id_status_idx" ON "provider_manager_delegations"("property_id", "status");
CREATE UNIQUE INDEX "provider_manager_delegations_current_idx" ON "provider_manager_delegations"("grantor_provider_membership_id", "manager_user_id") WHERE "status" IN ('PENDING_ACCEPTANCE', 'ACTIVE', 'SUSPENDED');

CREATE TABLE "provider_manager_delegation_permissions" (
  "delegation_id" UUID NOT NULL,
  "permission" "manager_delegation_permission" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_manager_delegation_permissions_pkey" PRIMARY KEY ("delegation_id", "permission"),
  CONSTRAINT "provider_manager_delegation_permissions_delegation_id_fkey" FOREIGN KEY ("delegation_id") REFERENCES "provider_manager_delegations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "provider_manager_delegation_permissions_permission_delegation_id_idx" ON "provider_manager_delegation_permissions"("permission", "delegation_id");

CREATE TABLE "property_guard_memberships" (
  "id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "guard_user_id" UUID NOT NULL,
  "added_by_user_id" UUID NOT NULL,
  "status" "property_guard_membership_status" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
  "invited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "joined_at" TIMESTAMPTZ(6),
  "ended_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "property_guard_memberships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "property_guard_memberships_property_id_guard_user_id_key" UNIQUE ("property_id", "guard_user_id"),
  CONSTRAINT "property_guard_memberships_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "property_guard_memberships_guard_user_id_fkey" FOREIGN KEY ("guard_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "property_guard_memberships_added_by_user_id_fkey" FOREIGN KEY ("added_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "property_guard_memberships_property_id_status_idx" ON "property_guard_memberships"("property_id", "status");
CREATE INDEX "property_guard_memberships_guard_user_id_status_idx" ON "property_guard_memberships"("guard_user_id", "status");

-- Normalize legacy combined Guard records into shared memberships plus Provider assignments.
INSERT INTO "property_guard_memberships" ("id", "property_id", "guard_user_id", "added_by_user_id", "status", "invited_at", "joined_at", "ended_at", "created_at", "updated_at")
SELECT DISTINCT ON (a."property_id", a."guard_user_id")
  gen_random_uuid(), a."property_id", a."guard_user_id", a."created_by_user_id",
  CASE
    WHEN a."status" IN ('ACTIVE', 'SUSPENDED') THEN 'ACTIVE'::"property_guard_membership_status"
    WHEN a."status" = 'PENDING_ACCEPTANCE' THEN 'PENDING_ACCEPTANCE'::"property_guard_membership_status"
    WHEN a."status" = 'CANCELLED' THEN 'CANCELLED'::"property_guard_membership_status"
    ELSE 'ENDED'::"property_guard_membership_status"
  END,
  a."invited_at", COALESCE(a."accepted_at", a."assigned_at"), a."ended_at", a."created_at", a."updated_at"
FROM "property_guard_assignments" a
ORDER BY a."property_id", a."guard_user_id", a."created_at" DESC;

ALTER TABLE "property_guard_assignments"
  ADD COLUMN "property_guard_membership_id" UUID,
  ADD COLUMN "provider_membership_id" UUID;
UPDATE "property_guard_assignments" a
SET "property_guard_membership_id" = gm."id",
    "provider_membership_id" = pp."id",
    "assigned_at" = COALESCE(a."assigned_at", a."accepted_at", a."invited_at", a."created_at")
FROM "property_guard_memberships" gm, "property_providers" pp
WHERE gm."property_id" = a."property_id"
  AND gm."guard_user_id" = a."guard_user_id"
  AND pp."property_id" = a."property_id"
  AND pp."provider_user_id" = a."created_by_user_id";
ALTER TABLE "property_guard_assignments" ALTER COLUMN "property_guard_membership_id" SET NOT NULL;
ALTER TABLE "property_guard_assignments" ALTER COLUMN "provider_membership_id" SET NOT NULL;
ALTER TABLE "property_guard_assignments" ALTER COLUMN "assigned_at" SET NOT NULL;
ALTER TABLE "property_guard_assignments" ALTER COLUMN "assigned_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "property_guard_assignments" DROP CONSTRAINT IF EXISTS "property_guard_assignments_property_id_fkey";
ALTER TABLE "property_guard_assignments" DROP CONSTRAINT IF EXISTS "property_guard_assignments_guard_user_id_fkey";
DROP INDEX IF EXISTS "property_guard_assignments_property_id_status_idx";
DROP INDEX IF EXISTS "property_guard_assignments_guard_user_id_status_idx";
ALTER TABLE "property_guard_assignments" DROP COLUMN "property_id";
ALTER TABLE "property_guard_assignments" DROP COLUMN "guard_user_id";
ALTER TABLE "property_guard_assignments" DROP COLUMN "invited_at";
ALTER TABLE "property_guard_assignments" DROP COLUMN "accepted_at";
ALTER TABLE "property_guard_assignments" ADD CONSTRAINT "property_guard_assignments_property_guard_membership_id_fkey" FOREIGN KEY ("property_guard_membership_id") REFERENCES "property_guard_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "property_guard_assignments" ADD CONSTRAINT "property_guard_assignments_provider_membership_id_fkey" FOREIGN KEY ("provider_membership_id") REFERENCES "property_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "property_guard_assignments_provider_membership_id_status_idx" ON "property_guard_assignments"("provider_membership_id", "status");
CREATE INDEX "property_guard_assignments_property_guard_membership_id_status_idx" ON "property_guard_assignments"("property_guard_membership_id", "status");
CREATE UNIQUE INDEX "provider_guard_assignments_current_idx" ON "property_guard_assignments"("provider_membership_id", "property_guard_membership_id") WHERE "status" IN ('PENDING_ACCEPTANCE', 'ACTIVE', 'SUSPENDED');
ALTER TABLE "property_guard_assignments" RENAME TO "provider_guard_assignments";

CREATE TABLE "property_change_proposals" (
  "id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "proposed_by_user_id" UUID NOT NULL,
  "base_property_version" INTEGER NOT NULL,
  "change_type" "property_change_type" NOT NULL,
  "proposed_changes" JSONB NOT NULL,
  "status" "property_change_proposal_status" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "resolved_at" TIMESTAMPTZ(6),
  "applied_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "property_change_proposals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "property_change_proposals_base_version_check" CHECK ("base_property_version" > 0),
  CONSTRAINT "property_change_proposals_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "property_change_proposals_proposed_by_user_id_fkey" FOREIGN KEY ("proposed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "property_change_proposals_property_id_status_created_at_idx" ON "property_change_proposals"("property_id", "status", "created_at" DESC);
CREATE INDEX "property_change_proposals_proposed_by_user_id_created_at_idx" ON "property_change_proposals"("proposed_by_user_id", "created_at" DESC);

CREATE TABLE "property_change_votes" (
  "id" UUID NOT NULL,
  "proposal_id" UUID NOT NULL,
  "provider_membership_id" UUID NOT NULL,
  "voter_user_id" UUID NOT NULL,
  "decision" "governance_vote_decision" NOT NULL,
  "reason" VARCHAR(500),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_change_votes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "property_change_votes_proposal_id_provider_membership_id_key" UNIQUE ("proposal_id", "provider_membership_id"),
  CONSTRAINT "property_change_votes_reject_reason_check" CHECK ("decision" <> 'REJECT' OR length(trim("reason")) >= 5),
  CONSTRAINT "property_change_votes_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "property_change_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "property_change_votes_provider_membership_id_fkey" FOREIGN KEY ("provider_membership_id") REFERENCES "property_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "property_change_votes_voter_user_id_fkey" FOREIGN KEY ("voter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "property_change_votes_proposal_id_decision_idx" ON "property_change_votes"("proposal_id", "decision");

CREATE TABLE "domain_audit_events" (
  "id" UUID NOT NULL,
  "event_type" "domain_audit_event_type" NOT NULL,
  "actor_user_id" UUID,
  "property_id" UUID,
  "entity_type" VARCHAR(80) NOT NULL,
  "entity_id" UUID NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "domain_audit_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "domain_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "domain_audit_events_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "domain_audit_events_property_id_created_at_idx" ON "domain_audit_events"("property_id", "created_at" DESC);
CREATE INDEX "domain_audit_events_entity_type_entity_id_created_at_idx" ON "domain_audit_events"("entity_type", "entity_id", "created_at" DESC);
CREATE INDEX "domain_audit_events_actor_user_id_created_at_idx" ON "domain_audit_events"("actor_user_id", "created_at" DESC);

ALTER TABLE "parking_spots" ADD COLUMN "provider_membership_id" UUID;
UPDATE "parking_spots" ps
SET "provider_membership_id" = pp."id"
FROM "properties" p
JOIN "property_providers" pp
  ON pp."property_id" = p."id"
 AND pp."provider_user_id" = p."created_by_user_id"
WHERE ps."property_id" = p."id";
ALTER TABLE "parking_spots" ALTER COLUMN "provider_membership_id" SET NOT NULL;
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_provider_membership_id_fkey" FOREIGN KEY ("provider_membership_id") REFERENCES "property_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "parking_spots_provider_membership_id_idx" ON "parking_spots"("provider_membership_id");

CREATE TABLE "provider_manager_delegation_resources" (
  "delegation_id" UUID NOT NULL,
  "parking_spot_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_manager_delegation_resources_pkey" PRIMARY KEY ("delegation_id", "parking_spot_id"),
  CONSTRAINT "provider_manager_delegation_resources_delegation_id_fkey" FOREIGN KEY ("delegation_id") REFERENCES "provider_manager_delegations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "provider_manager_delegation_resources_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "provider_manager_delegation_resources_parking_spot_id_idx" ON "provider_manager_delegation_resources"("parking_spot_id");
