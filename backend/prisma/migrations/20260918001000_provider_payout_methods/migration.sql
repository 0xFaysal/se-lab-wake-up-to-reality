CREATE TYPE "payout_method_type" AS ENUM ('BANK', 'BKASH', 'NAGAD', 'OTHER_MFS');
CREATE TYPE "payout_method_status" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYOUT_METHOD_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYOUT_METHOD_DEFAULTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYOUT_METHOD_DEACTIVATED';

CREATE TABLE "provider_payout_methods" (
  "id" UUID NOT NULL,
  "provider_user_id" UUID NOT NULL,
  "type" "payout_method_type" NOT NULL,
  "account_holder_name" VARCHAR(120) NOT NULL,
  "account_identifier_ciphertext" TEXT NOT NULL,
  "account_identifier_iv" VARCHAR(64) NOT NULL,
  "account_identifier_tag" VARCHAR(64) NOT NULL,
  "masked_account_identifier" VARCHAR(80) NOT NULL,
  "bank_name" VARCHAR(120),
  "branch_name" VARCHAR(120),
  "routing_number" VARCHAR(40),
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "status" "payout_method_status" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_payout_methods_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_payout_methods_provider_user_id_fkey" FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "provider_payout_methods_provider_user_id_status_idx" ON "provider_payout_methods"("provider_user_id", "status");
CREATE INDEX "provider_payout_methods_provider_user_id_is_default_idx" ON "provider_payout_methods"("provider_user_id", "is_default");
CREATE UNIQUE INDEX "provider_payout_methods_one_default_idx" ON "provider_payout_methods"("provider_user_id") WHERE "is_default" = true AND "status" = 'ACTIVE';

ALTER TABLE "payout_requests"
ADD COLUMN "payout_method_id" UUID,
ADD COLUMN "destination_snapshot" JSONB,
ADD COLUMN "external_reference" VARCHAR(120);

ALTER TABLE "payout_requests"
ADD CONSTRAINT "payout_requests_payout_method_id_fkey" FOREIGN KEY ("payout_method_id") REFERENCES "provider_payout_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "payout_requests_payout_method_id_idx" ON "payout_requests"("payout_method_id");
