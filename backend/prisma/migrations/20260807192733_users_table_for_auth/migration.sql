/*
  Warnings:

  - You are about to drop the `system_checks` table. If the table is not empty, all the data it contains will be lost.

*/
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('DRIVER', 'PARKING_OWNER', 'GUARD', 'ADMIN');

-- CreateEnum
CREATE TYPE "account_origin" AS ENUM ('SELF_REGISTERED', 'OWNER_CREATED_GUARD', 'ADMIN_CREATED_GUARD');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('DRAFT', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "property_status" AS ENUM ('ACTIVE', 'TEMPORARILY_CLOSED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "parking_spot_status" AS ENUM ('ACTIVE', 'BLOCKED', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "vehicle_type" AS ENUM ('MOTORCYCLE', 'SEDAN', 'SUV', 'MICROBUS');

-- CreateEnum
CREATE TYPE "guard_assignment_status" AS ENUM ('PENDING_ACCEPTANCE', 'ACTIVE', 'SUSPENDED', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "availability_exception_type" AS ENUM ('BLOCKED', 'SPECIAL_AVAILABLE');

-- CreateEnum
CREATE TYPE "legal_document_type" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'OWNER_OPERATIONAL_POLICY', 'GUARD_OPERATIONAL_POLICY');

-- CreateEnum
CREATE TYPE "legal_acceptance_source" AS ENUM ('REGISTRATION', 'FIRST_LOGIN', 'POLICY_UPDATE', 'OWNER_GUARD_CREATION', 'GUARD_ASSIGNMENT_ACCEPTANCE', 'ADMIN_ACTION');

-- CreateEnum
CREATE TYPE "wallet_account_status" AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ledger_entry_side" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "reconciliation_status" AS ENUM ('MATCHED', 'MISMATCH', 'RESOLVED', 'MANUAL_REVIEW');

-- DropTable
DROP TABLE "system_checks";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'PENDING',
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "account_origin" "account_origin" NOT NULL DEFAULT 'SELF_REGISTERED',
    "created_by_user_id" UUID,
    "email_verified_at" TIMESTAMPTZ(6),
    "phone_verified_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by_session_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" UUID NOT NULL,
    "type" "legal_document_type" NOT NULL,
    "version" VARCHAR(30) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "effective_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_legal_acceptances" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "legal_document_id" UUID NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_legal_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "vehicle_type" "vehicle_type" NOT NULL,
    "registration_number" VARCHAR(50) NOT NULL,
    "normalized_registration_number" VARCHAR(50) NOT NULL,
    "brand" VARCHAR(80),
    "model" VARCHAR(80),
    "color" VARCHAR(40),
    "height_cm" INTEGER,
    "width_cm" INTEGER,
    "length_cm" INTEGER,
    "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "public_area" VARCHAR(120) NOT NULL,
    "approximate_address" VARCHAR(255) NOT NULL,
    "exact_address_ciphertext" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "entrance_latitude" DECIMAL(9,6),
    "entrance_longitude" DECIMAL(9,6),
    "access_instructions_ciphertext" TEXT,
    "verification_status" "verification_status" NOT NULL DEFAULT 'DRAFT',
    "status" "property_status" NOT NULL DEFAULT 'INACTIVE',
    "verified_by_admin_id" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "image_type" VARCHAR(30) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_guard_assignments" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "guard_user_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "status" "guard_assignment_status" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "shift_start" TIME(6),
    "shift_end" TIME(6),
    "invited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ(6),
    "assigned_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "property_guard_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spots" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "spot_code" VARCHAR(30) NOT NULL,
    "supported_vehicle_type" "vehicle_type" NOT NULL,
    "hourly_rate_paisa" BIGINT NOT NULL,
    "minimum_booking_minutes" INTEGER NOT NULL DEFAULT 60,
    "maximum_booking_minutes" INTEGER NOT NULL DEFAULT 720,
    "booking_buffer_minutes" INTEGER NOT NULL DEFAULT 0,
    "grace_period_minutes" INTEGER NOT NULL DEFAULT 15,
    "overtime_multiplier_basis_points" INTEGER NOT NULL DEFAULT 15000,
    "minimum_deposit_paisa" BIGINT NOT NULL DEFAULT 10000,
    "status" "parking_spot_status" NOT NULL DEFAULT 'INACTIVE',
    "is_covered" BOOLEAN NOT NULL DEFAULT false,
    "has_cctv" BOOLEAN NOT NULL DEFAULT false,
    "has_guard" BOOLEAN NOT NULL DEFAULT false,
    "max_height_cm" INTEGER,
    "max_width_cm" INTEGER,
    "max_length_cm" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "parking_spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_facilities" (
    "id" SMALLSERIAL NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "display_name" VARCHAR(80) NOT NULL,

    CONSTRAINT "parking_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spot_facilities" (
    "parking_spot_id" UUID NOT NULL,
    "facility_id" SMALLINT NOT NULL,

    CONSTRAINT "parking_spot_facilities_pkey" PRIMARY KEY ("parking_spot_id","facility_id")
);

-- CreateTable
CREATE TABLE "availability_rules" (
    "id" UUID NOT NULL,
    "parking_spot_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "start_local_time" TIME(6) NOT NULL,
    "end_local_time" TIME(6) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_until" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_exceptions" (
    "id" UUID NOT NULL,
    "parking_spot_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "exception_type" "availability_exception_type" NOT NULL,
    "reason" VARCHAR(255),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "status" "wallet_account_status" NOT NULL DEFAULT 'ACTIVE',
    "available_balance_paisa" BIGINT NOT NULL DEFAULT 0,
    "pending_balance_paisa" BIGINT NOT NULL DEFAULT 0,
    "held_balance_paisa" BIGINT NOT NULL DEFAULT 0,
    "balance_version" INTEGER NOT NULL DEFAULT 1,
    "last_reconciled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" UUID NOT NULL,
    "reference_type" VARCHAR(60) NOT NULL,
    "reference_id" UUID,
    "description" VARCHAR(255) NOT NULL,
    "actor_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "ledger_transaction_id" UUID NOT NULL,
    "wallet_account_id" UUID,
    "account_code" VARCHAR(60) NOT NULL,
    "entry_side" "ledger_entry_side" NOT NULL,
    "amount_paisa" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_reconciliations" (
    "id" UUID NOT NULL,
    "wallet_account_id" UUID NOT NULL,
    "cached_available_paisa" BIGINT NOT NULL,
    "ledger_available_paisa" BIGINT NOT NULL,
    "difference_paisa" BIGINT NOT NULL,
    "status" "reconciliation_status" NOT NULL,
    "reviewed_by_user_id" UUID,
    "reconciled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "wallet_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_account_origin_idx" ON "users"("account_origin");

-- CreateIndex
CREATE INDEX "users_created_by_user_id_idx" ON "users"("created_by_user_id");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at" DESC);

-- CreateIndex
CREATE INDEX "user_roles_role_idx" ON "user_roles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "refresh_sessions"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_replaced_by_session_id_key" ON "refresh_sessions"("replaced_by_session_id");

-- CreateIndex
CREATE INDEX "refresh_sessions_user_id_created_at_idx" ON "refresh_sessions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "refresh_sessions_user_id_expires_at_idx" ON "refresh_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "legal_documents_type_is_active_idx" ON "legal_documents"("type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_type_version_key" ON "legal_documents"("type", "version");

-- CreateIndex
CREATE INDEX "user_legal_acceptances_user_id_idx" ON "user_legal_acceptances"("user_id");

-- CreateIndex
CREATE INDEX "user_legal_acceptances_legal_document_id_idx" ON "user_legal_acceptances"("legal_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_legal_acceptances_user_id_legal_document_id_key" ON "user_legal_acceptances"("user_id", "legal_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_normalized_registration_number_key" ON "vehicles"("normalized_registration_number");

-- CreateIndex
CREATE INDEX "vehicles_owner_user_id_idx" ON "vehicles"("owner_user_id");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_type_verification_status_idx" ON "vehicles"("vehicle_type", "verification_status");

-- CreateIndex
CREATE INDEX "properties_owner_user_id_idx" ON "properties"("owner_user_id");

-- CreateIndex
CREATE INDEX "properties_verification_status_status_public_area_idx" ON "properties"("verification_status", "status", "public_area");

-- CreateIndex
CREATE INDEX "properties_latitude_longitude_idx" ON "properties"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "property_images_storage_key_key" ON "property_images"("storage_key");

-- CreateIndex
CREATE INDEX "property_images_property_id_sort_order_idx" ON "property_images"("property_id", "sort_order");

-- CreateIndex
CREATE INDEX "property_guard_assignments_property_id_status_idx" ON "property_guard_assignments"("property_id", "status");

-- CreateIndex
CREATE INDEX "property_guard_assignments_guard_user_id_status_idx" ON "property_guard_assignments"("guard_user_id", "status");

-- CreateIndex
CREATE INDEX "property_guard_assignments_created_by_user_id_idx" ON "property_guard_assignments"("created_by_user_id");

-- CreateIndex
CREATE INDEX "parking_spots_property_id_idx" ON "parking_spots"("property_id");

-- CreateIndex
CREATE INDEX "parking_spots_status_supported_vehicle_type_hourly_rate_pai_idx" ON "parking_spots"("status", "supported_vehicle_type", "hourly_rate_paisa");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_property_id_spot_code_key" ON "parking_spots"("property_id", "spot_code");

-- CreateIndex
CREATE UNIQUE INDEX "parking_facilities_code_key" ON "parking_facilities"("code");

-- CreateIndex
CREATE INDEX "availability_rules_parking_spot_id_day_of_week_valid_from_v_idx" ON "availability_rules"("parking_spot_id", "day_of_week", "valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "availability_exceptions_parking_spot_id_starts_at_ends_at_idx" ON "availability_exceptions"("parking_spot_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "wallet_accounts_status_idx" ON "wallet_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_accounts_user_id_currency_key" ON "wallet_accounts"("user_id", "currency");

-- CreateIndex
CREATE INDEX "ledger_transactions_reference_type_reference_id_idx" ON "ledger_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_actor_user_id_idx" ON "ledger_transactions"("actor_user_id");

-- CreateIndex
CREATE INDEX "ledger_entries_ledger_transaction_id_idx" ON "ledger_entries"("ledger_transaction_id");

-- CreateIndex
CREATE INDEX "ledger_entries_wallet_account_id_created_at_idx" ON "ledger_entries"("wallet_account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "wallet_reconciliations_wallet_account_id_reconciled_at_idx" ON "wallet_reconciliations"("wallet_account_id", "reconciled_at" DESC);

-- CreateIndex
CREATE INDEX "wallet_reconciliations_status_idx" ON "wallet_reconciliations"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_replaced_by_session_id_fkey" FOREIGN KEY ("replaced_by_session_id") REFERENCES "refresh_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_legal_acceptances" ADD CONSTRAINT "user_legal_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_legal_acceptances" ADD CONSTRAINT "user_legal_acceptances_legal_document_id_fkey" FOREIGN KEY ("legal_document_id") REFERENCES "legal_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_verified_by_admin_id_fkey" FOREIGN KEY ("verified_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_guard_assignments" ADD CONSTRAINT "property_guard_assignments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_guard_assignments" ADD CONSTRAINT "property_guard_assignments_guard_user_id_fkey" FOREIGN KEY ("guard_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_guard_assignments" ADD CONSTRAINT "property_guard_assignments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spot_facilities" ADD CONSTRAINT "parking_spot_facilities_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spot_facilities" ADD CONSTRAINT "parking_spot_facilities_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "parking_facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_ledger_transaction_id_fkey" FOREIGN KEY ("ledger_transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_reconciliations" ADD CONSTRAINT "wallet_reconciliations_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_reconciliations" ADD CONSTRAINT "wallet_reconciliations_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "properties"
ADD CONSTRAINT "properties_entrance_coordinate_pair"
CHECK (
  (
    "entrance_latitude" IS NULL
    AND "entrance_longitude" IS NULL
  )
  OR
  (
    "entrance_latitude" IS NOT NULL
    AND "entrance_longitude" IS NOT NULL
  )
);

CREATE UNIQUE INDEX "uq_guard_property_non_terminal_assignment"
ON "property_guard_assignments" (
  "property_id",
  "guard_user_id"
)
WHERE "status" IN (
  'PENDING_ACCEPTANCE',
  'ACTIVE',
  'SUSPENDED'
);

ALTER TABLE "property_guard_assignments"
ADD CONSTRAINT "guard_assignment_timestamp_order"
CHECK (
  ("accepted_at" IS NULL OR "accepted_at" >= "invited_at")
  AND
  ("assigned_at" IS NULL OR "accepted_at" IS NOT NULL)
  AND
  ("assigned_at" IS NULL OR "assigned_at" >= "accepted_at")
  AND
  ("ended_at" IS NULL OR "ended_at" >= "invited_at")
);

ALTER TABLE "availability_rules"
ADD CONSTRAINT "availability_day_of_week_valid"
CHECK ("day_of_week" BETWEEN 0 AND 6);

ALTER TABLE "availability_rules"
ADD CONSTRAINT "availability_time_valid"
CHECK ("start_local_time" < "end_local_time");

ALTER TABLE "availability_rules"
ADD CONSTRAINT "availability_date_valid"
CHECK (
  "valid_until" IS NULL
  OR "valid_until" >= "valid_from"
);

ALTER TABLE "availability_exceptions"
ADD CONSTRAINT "availability_exception_time_valid"
CHECK ("starts_at" < "ends_at");

ALTER TABLE "parking_spots"
ADD CONSTRAINT "parking_spot_money_valid"
CHECK (
  "hourly_rate_paisa" > 0
  AND "minimum_deposit_paisa" >= 0
);

ALTER TABLE "parking_spots"
ADD CONSTRAINT "parking_spot_duration_valid"
CHECK (
  "minimum_booking_minutes" > 0
  AND "maximum_booking_minutes" >= "minimum_booking_minutes"
  AND "booking_buffer_minutes" >= 0
  AND "grace_period_minutes" >= 0
);

ALTER TABLE "parking_spots"
ADD CONSTRAINT "parking_spot_overtime_multiplier_valid"
CHECK ("overtime_multiplier_basis_points" >= 10000);

ALTER TABLE "wallet_accounts"
ADD CONSTRAINT "wallet_currency_bdt"
CHECK ("currency" = 'BDT');

ALTER TABLE "wallet_accounts"
ADD CONSTRAINT "wallet_balances_nonnegative"
CHECK (
  "available_balance_paisa" >= 0
  AND "pending_balance_paisa" >= 0
  AND "held_balance_paisa" >= 0
  AND "balance_version" > 0
);

ALTER TABLE "ledger_entries"
ADD CONSTRAINT "ledger_entry_amount_positive"
CHECK ("amount_paisa" > 0);
