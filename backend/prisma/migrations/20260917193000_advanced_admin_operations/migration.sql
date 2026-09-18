-- Additive Admin Operations migration. Existing bookings, ledger rows, and legal acceptances remain unchanged.
ALTER TYPE "payout_status" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'ADMIN_BROADCAST';

ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_USER_SUSPENDED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PROPERTY_APPROVED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PROPERTY_REJECTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PROPERTY_STATUS_OVERRIDDEN';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_USER_UNSUSPENDED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_USER_BLOCKED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_USER_UNBLOCKED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_USER_SESSIONS_REVOKED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_NOTE_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_NOTE_UPDATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_NOTE_DELETED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'RISK_FLAG_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'RISK_FLAG_RESOLVED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RIGHT_REJECTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RIGHT_REVOKED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RIGHT_DISPUTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'LISTING_RESUMED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'LISTING_REPORTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'LISTING_REPORT_RESOLVED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'LISTING_REPORT_DISMISSED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_BOOKING_CANCELLED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYOUT_HELD';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYOUT_RELEASED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYOUT_APPROVED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYOUT_REJECTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYOUT_PAID';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'DISPUTE_REVIEW_STARTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'LEGAL_DOCUMENT_PUBLISHED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'CONTENT_ARTICLE_PUBLISHED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'BROADCAST_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'BROADCAST_SENT';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PLATFORM_FEE_CHANGED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RESOURCE_STATUS_CHANGED';

CREATE TYPE "legal_document_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "admin_subject_type" AS ENUM ('USER', 'PROPERTY', 'PARKING_RESOURCE', 'PARKING_RIGHT', 'LISTING', 'BOOKING', 'PAYOUT', 'DISPUTE');
CREATE TYPE "risk_level" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "listing_report_status" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');
CREATE TYPE "content_article_kind" AS ENUM ('FAQ', 'HELP_ARTICLE');
CREATE TYPE "content_audience" AS ENUM ('ALL', 'DRIVER', 'PROVIDER', 'MANAGER', 'GUARD');
CREATE TYPE "content_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "notification_campaign_status" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED');
CREATE TYPE "platform_fee_scope_type" AS ENUM ('GLOBAL', 'PROVIDER', 'PROPERTY', 'LISTING');
CREATE TYPE "platform_fee_type" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "platform_fee_rule_status" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "legal_documents"
  ADD COLUMN "content" TEXT,
  ADD COLUMN "status" "legal_document_status" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "published_at" TIMESTAMPTZ(6),
  ADD COLUMN "created_by_admin_id" UUID;

UPDATE "legal_documents"
SET "published_at" = "created_at"
WHERE "is_active" = TRUE AND "published_at" IS NULL;

ALTER TABLE "legal_documents"
  ADD CONSTRAINT "legal_documents_created_by_admin_id_fkey"
  FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "legal_documents_type_is_active_idx";
CREATE INDEX "legal_documents_type_status_effective_at_idx" ON "legal_documents"("type", "status", "effective_at" DESC);
CREATE INDEX "legal_documents_type_is_active_idx" ON "legal_documents"("type", "is_active");

ALTER TABLE "domain_audit_events" ADD COLUMN "request_id" VARCHAR(64);
CREATE INDEX "domain_audit_events_event_type_created_at_idx" ON "domain_audit_events"("event_type", "created_at" DESC);

ALTER TABLE "payout_requests"
  ADD COLUMN "held_at" TIMESTAMPTZ(6),
  ADD COLUMN "hold_reason" VARCHAR(500);

ALTER TABLE "disputes"
  ADD COLUMN "review_started_at" TIMESTAMPTZ(6),
  ADD COLUMN "sla_due_at" TIMESTAMPTZ(6),
  ADD COLUMN "escalated_at" TIMESTAMPTZ(6);

CREATE TABLE "admin_notes" (
  "id" UUID NOT NULL,
  "author_admin_id" UUID NOT NULL,
  "subject_type" "admin_subject_type" NOT NULL,
  "subject_id" UUID NOT NULL,
  "body" VARCHAR(3000) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_notes_author_admin_id_fkey" FOREIGN KEY ("author_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "admin_notes_subject_type_subject_id_created_at_idx" ON "admin_notes"("subject_type", "subject_id", "created_at" DESC);
CREATE INDEX "admin_notes_author_admin_id_created_at_idx" ON "admin_notes"("author_admin_id", "created_at" DESC);

CREATE TABLE "risk_flags" (
  "id" UUID NOT NULL,
  "target_type" "admin_subject_type" NOT NULL,
  "target_id" UUID NOT NULL,
  "level" "risk_level" NOT NULL,
  "reason" VARCHAR(1000) NOT NULL,
  "created_by_admin_id" UUID NOT NULL,
  "resolved_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "risk_flags_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "risk_flags_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "risk_flags_target_type_target_id_resolved_at_created_at_idx" ON "risk_flags"("target_type", "target_id", "resolved_at", "created_at" DESC);
CREATE INDEX "risk_flags_level_resolved_at_created_at_idx" ON "risk_flags"("level", "resolved_at", "created_at" DESC);

CREATE TABLE "listing_reports" (
  "id" UUID NOT NULL,
  "listing_id" UUID NOT NULL,
  "reporter_user_id" UUID,
  "reason" VARCHAR(500) NOT NULL,
  "details" VARCHAR(2000),
  "status" "listing_report_status" NOT NULL DEFAULT 'OPEN',
  "resolved_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "listing_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "listing_reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "parking_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "listing_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "listing_reports_status_created_at_idx" ON "listing_reports"("status", "created_at" DESC);
CREATE INDEX "listing_reports_listing_id_status_idx" ON "listing_reports"("listing_id", "status");

CREATE TABLE "content_categories" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "slug" VARCHAR(140) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "content_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "content_categories_slug_key" ON "content_categories"("slug");
CREATE INDEX "content_categories_sort_order_name_idx" ON "content_categories"("sort_order", "name");

CREATE TABLE "help_articles" (
  "id" UUID NOT NULL,
  "category_id" UUID,
  "kind" "content_article_kind" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "slug" VARCHAR(200) NOT NULL,
  "body" TEXT NOT NULL,
  "audience" "content_audience" NOT NULL DEFAULT 'ALL',
  "status" "content_status" NOT NULL DEFAULT 'DRAFT',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "published_at" TIMESTAMPTZ(6),
  "created_by_admin_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "help_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "content_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "help_articles_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "help_articles_slug_key" ON "help_articles"("slug");
CREATE INDEX "help_articles_kind_status_audience_sort_order_idx" ON "help_articles"("kind", "status", "audience", "sort_order");
CREATE INDEX "help_articles_category_id_status_sort_order_idx" ON "help_articles"("category_id", "status", "sort_order");

CREATE TABLE "notification_campaigns" (
  "id" UUID NOT NULL,
  "title" VARCHAR(150) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "audience" "content_audience" NOT NULL,
  "status" "notification_campaign_status" NOT NULL DEFAULT 'DRAFT',
  "scheduled_at" TIMESTAMPTZ(6),
  "sent_at" TIMESTAMPTZ(6),
  "created_by_admin_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_campaigns_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "notification_campaigns_status_scheduled_at_created_at_idx" ON "notification_campaigns"("status", "scheduled_at", "created_at" DESC);
CREATE INDEX "notification_campaigns_audience_status_idx" ON "notification_campaigns"("audience", "status");

CREATE TABLE "platform_fee_rules" (
  "id" UUID NOT NULL,
  "scope_type" "platform_fee_scope_type" NOT NULL,
  "scope_id" UUID,
  "fee_type" "platform_fee_type" NOT NULL,
  "percentage_bps" INTEGER,
  "fixed_amount_paisa" BIGINT,
  "effective_from" TIMESTAMPTZ(6) NOT NULL,
  "effective_until" TIMESTAMPTZ(6),
  "status" "platform_fee_rule_status" NOT NULL DEFAULT 'ACTIVE',
  "reason" VARCHAR(500) NOT NULL,
  "created_by_admin_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_fee_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_fee_rules_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "platform_fee_rules_scope_check" CHECK (("scope_type" = 'GLOBAL' AND "scope_id" IS NULL) OR ("scope_type" <> 'GLOBAL' AND "scope_id" IS NOT NULL)),
  CONSTRAINT "platform_fee_rules_value_check" CHECK (("fee_type" = 'PERCENTAGE' AND "percentage_bps" BETWEEN 0 AND 10000 AND "fixed_amount_paisa" IS NULL) OR ("fee_type" = 'FIXED' AND "fixed_amount_paisa" >= 0 AND "percentage_bps" IS NULL)),
  CONSTRAINT "platform_fee_rules_time_check" CHECK ("effective_until" IS NULL OR "effective_until" > "effective_from")
);
CREATE INDEX "platform_fee_rules_scope_type_scope_id_status_effective_fro_idx" ON "platform_fee_rules"("scope_type", "scope_id", "status", "effective_from" DESC);
CREATE INDEX "platform_fee_rules_status_effective_from_effective_until_idx" ON "platform_fee_rules"("status", "effective_from", "effective_until");
