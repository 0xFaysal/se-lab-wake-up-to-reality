-- Email template and delivery lifecycle.
CREATE TYPE "email_template_type" AS ENUM (
  'EMAIL_VERIFICATION_OTP', 'ACCOUNT_SETUP', 'GUARD_INVITATION',
  'MANAGER_INVITATION', 'PASSWORD_RESET', 'BOOKING_CONFIRMATION',
  'BOOKING_CANCELLED', 'PAYMENT_SUCCESS', 'REFUND_PROCESSED',
  'PAYOUT_STATUS', 'PROPERTY_APPROVED', 'PROPERTY_REJECTED',
  'PARKING_RIGHT_APPROVED', 'PARKING_RIGHT_REJECTED',
  'DISPUTE_UPDATE', 'BROADCAST'
);

CREATE TYPE "email_campaign_status" AS ENUM (
  'DRAFT', 'SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'
);

CREATE TYPE "email_delivery_status" AS ENUM (
  'QUEUED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'
);

CREATE TABLE "email_templates" (
  "id" UUID NOT NULL,
  "type" "email_template_type" NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "subject" VARCHAR(200) NOT NULL,
  "preheader" VARCHAR(250),
  "html_body" TEXT NOT NULL,
  "text_body" TEXT NOT NULL,
  "allowed_variables" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "content_status" NOT NULL DEFAULT 'DRAFT',
  "supersedes_template_id" UUID,
  "created_by_admin_id" UUID NOT NULL,
  "published_at" TIMESTAMPTZ(6),
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_templates_type_version_key" ON "email_templates"("type", "version");
CREATE INDEX "email_templates_type_status_version_idx" ON "email_templates"("type", "status", "version" DESC);
CREATE INDEX "email_templates_supersedes_template_id_idx" ON "email_templates"("supersedes_template_id");

ALTER TABLE "email_templates"
  ADD CONSTRAINT "email_templates_created_by_admin_id_fkey"
  FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "email_templates_supersedes_template_id_fkey"
  FOREIGN KEY ("supersedes_template_id") REFERENCES "email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "email_campaigns" (
  "id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "title" VARCHAR(150) NOT NULL,
  "audience" "content_audience" NOT NULL,
  "status" "email_campaign_status" NOT NULL DEFAULT 'DRAFT',
  "subject_override" VARCHAR(200),
  "html_body_override" TEXT,
  "text_body_override" TEXT,
  "estimated_recipient_count" INTEGER NOT NULL DEFAULT 0,
  "scheduled_at" TIMESTAMPTZ(6),
  "processing_at" TIMESTAMPTZ(6),
  "sent_at" TIMESTAMPTZ(6),
  "failed_at" TIMESTAMPTZ(6),
  "cancelled_at" TIMESTAMPTZ(6),
  "created_by_admin_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_campaigns_status_scheduled_at_created_at_idx" ON "email_campaigns"("status", "scheduled_at", "created_at" DESC);
CREATE INDEX "email_campaigns_audience_status_idx" ON "email_campaigns"("audience", "status");

ALTER TABLE "email_campaigns"
  ADD CONSTRAINT "email_campaigns_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "email_campaigns_created_by_admin_id_fkey"
  FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "email_deliveries" (
  "id" UUID NOT NULL,
  "campaign_id" UUID,
  "template_id" UUID NOT NULL,
  "recipient_user_id" UUID,
  "recipient_email" CITEXT NOT NULL,
  "subject" VARCHAR(200) NOT NULL,
  "html_body" TEXT NOT NULL,
  "text_body" TEXT NOT NULL,
  "status" "email_delivery_status" NOT NULL DEFAULT 'QUEUED',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "provider_message" VARCHAR(500),
  "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processing_at" TIMESTAMPTZ(6),
  "sent_at" TIMESTAMPTZ(6),
  "failed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_deliveries_campaign_id_recipient_user_id_key" ON "email_deliveries"("campaign_id", "recipient_user_id");
CREATE INDEX "email_deliveries_status_available_at_created_at_idx" ON "email_deliveries"("status", "available_at", "created_at");
CREATE INDEX "email_deliveries_recipient_email_created_at_idx" ON "email_deliveries"("recipient_email", "created_at" DESC);

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "email_deliveries_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "email_deliveries_recipient_user_id_fkey"
  FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Parking Right evidence and batch workflow.
CREATE TYPE "parking_right_document_category" AS ENUM (
  'OWNERSHIP_DOCUMENT', 'LEASE_AGREEMENT', 'OWNER_CONSENT',
  'AUTHORIZATION_LETTER', 'PARKING_ALLOCATION', 'OTHER'
);

CREATE TYPE "parking_right_claim_batch_status" AS ENUM (
  'PENDING', 'COMPLETED', 'PARTIALLY_RESOLVED', 'CANCELLED'
);

CREATE TABLE "parking_right_claim_batches" (
  "id" UUID NOT NULL,
  "provider_user_id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "right_type" "parking_right_type" NOT NULL,
  "status" "parking_right_claim_batch_status" NOT NULL DEFAULT 'PENDING',
  "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "parking_right_claim_batches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "parking_right_claim_batches_provider_user_id_status_created_at_idx" ON "parking_right_claim_batches"("provider_user_id", "status", "created_at" DESC);
CREATE INDEX "parking_right_claim_batches_property_id_status_created_at_idx" ON "parking_right_claim_batches"("property_id", "status", "created_at" DESC);

ALTER TABLE "parking_right_claim_batches"
  ADD CONSTRAINT "parking_right_claim_batches_provider_user_id_fkey"
  FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "parking_right_claim_batches_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "parking_rights" ADD COLUMN "claim_batch_id" UUID;
CREATE INDEX "parking_rights_claim_batch_id_status_idx" ON "parking_rights"("claim_batch_id", "status");
ALTER TABLE "parking_rights" ADD CONSTRAINT "parking_rights_claim_batch_id_fkey"
  FOREIGN KEY ("claim_batch_id") REFERENCES "parking_right_claim_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "parking_right_documents" (
  "id" UUID NOT NULL,
  "parking_right_id" UUID,
  "amendment_id" UUID,
  "claim_batch_id" UUID,
  "category" "parking_right_document_category" NOT NULL,
  "original_name" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "storage_key" TEXT NOT NULL,
  "secure_url" TEXT NOT NULL,
  "uploaded_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parking_right_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "parking_right_documents_parent_check" CHECK (num_nonnulls("parking_right_id", "amendment_id", "claim_batch_id") = 1)
);

CREATE UNIQUE INDEX "parking_right_documents_storage_key_key" ON "parking_right_documents"("storage_key");
CREATE INDEX "parking_right_documents_parking_right_id_created_at_idx" ON "parking_right_documents"("parking_right_id", "created_at");
CREATE INDEX "parking_right_documents_amendment_id_created_at_idx" ON "parking_right_documents"("amendment_id", "created_at");
CREATE INDEX "parking_right_documents_claim_batch_id_created_at_idx" ON "parking_right_documents"("claim_batch_id", "created_at");

ALTER TABLE "parking_right_documents"
  ADD CONSTRAINT "parking_right_documents_parking_right_id_fkey"
  FOREIGN KEY ("parking_right_id") REFERENCES "parking_rights"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "parking_right_documents_amendment_id_fkey"
  FOREIGN KEY ("amendment_id") REFERENCES "parking_right_amendments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "parking_right_documents_claim_batch_id_fkey"
  FOREIGN KEY ("claim_batch_id") REFERENCES "parking_right_claim_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "parking_right_documents_uploaded_by_user_id_fkey"
  FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'EMAIL_TEMPLATE_UPDATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'EMAIL_CAMPAIGN_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'EMAIL_CAMPAIGN_SENT';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RESOURCE_BULK_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RIGHT_RECLAIMED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RIGHT_CLAIM_BATCH_CREATED';
