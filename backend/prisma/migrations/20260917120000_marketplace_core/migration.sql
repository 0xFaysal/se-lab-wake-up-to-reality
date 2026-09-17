-- CreateEnum
CREATE TYPE "parking_resource_type" AS ENUM ('FIXED_SPACE', 'SHARED_POOL');

-- CreateEnum
CREATE TYPE "parking_right_type" AS ENUM ('OWNERSHIP', 'USE_ONLY', 'COMMERCIAL_LEASE', 'AUTHORIZED_OPERATION');

-- CreateEnum
CREATE TYPE "parking_right_status" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'DISPUTED', 'REJECTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "parking_listing_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'ENDED');

-- CreateEnum
CREATE TYPE "reservation_hold_status" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'RELEASED');

-- CreateEnum
CREATE TYPE "parking_allocation_status" AS ENUM ('HELD', 'BOOKED', 'RELEASED');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PAYMENT_PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKOUT_REQUESTED', 'PAYMENT_DUE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_SHOW', 'DISPUTED');

-- CreateEnum
CREATE TYPE "access_credential_status" AS ENUM ('ACTIVE', 'USED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'CAPTURED', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "payout_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_REMINDER', 'GUARD_ASSIGNMENT', 'MANAGER_DELEGATION', 'PROPERTY_GOVERNANCE', 'PAYMENT_SUCCEEDED', 'REFUND_PROCESSED', 'PAYOUT_UPDATED', 'DISPUTE_UPDATE');

-- CreateEnum
CREATE TYPE "dispute_category" AS ENUM ('PAYMENT', 'ACCESS', 'PARKING_CONDITION', 'OVERCHARGE', 'VEHICLE_DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "dispute_status" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "domain_audit_event_type" ADD VALUE 'PARKING_RESOURCE_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'PARKING_RIGHT_CLAIMED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'PARKING_RIGHT_VERIFIED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'LISTING_ACTIVATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'LISTING_PAUSED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'QUOTE_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'HOLD_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'HOLD_EXPIRED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'BOOKING_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'BOOKING_CONFIRMED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'BOOKING_CANCELLED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'BOOKING_CHECKED_IN';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'BOOKING_CHECKED_OUT';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'PAYMENT_SUCCEEDED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'PAYMENT_FAILED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'REFUND_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'PAYOUT_REQUESTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'DISPUTE_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE 'DISPUTE_RESOLVED';

-- DropIndex
DROP INDEX "parking_spots_property_id_spot_code_key";

-- AlterTable
ALTER TABLE "parking_spots" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "display_name" VARCHAR(120),
ADD COLUMN     "floor" VARCHAR(40),
ADD COLUMN     "normalized_spot_code" VARCHAR(30),
ADD COLUMN     "resource_type" "parking_resource_type" NOT NULL DEFAULT 'FIXED_SPACE',
ADD COLUMN     "supported_vehicle_types" "vehicle_type"[] DEFAULT ARRAY[]::"vehicle_type"[],
ADD COLUMN     "zone" VARCHAR(60),
ALTER COLUMN "spot_code" DROP NOT NULL,
ALTER COLUMN "hourly_rate_paisa" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "parking_rights" (
    "id" UUID NOT NULL,
    "parking_spot_id" UUID NOT NULL,
    "holder_user_id" UUID NOT NULL,
    "provider_membership_id" UUID,
    "right_type" "parking_right_type" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "can_use" BOOLEAN NOT NULL DEFAULT true,
    "can_list" BOOLEAN NOT NULL DEFAULT false,
    "can_set_price" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_bookings" BOOLEAN NOT NULL DEFAULT false,
    "can_delegate_manager" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMPTZ(6),
    "status" "parking_right_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "granted_by_user_id" UUID,
    "verified_by_admin_id" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "rejection_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "parking_rights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_listings" (
    "id" UUID NOT NULL,
    "parking_spot_id" UUID NOT NULL,
    "provider_user_id" UUID NOT NULL,
    "provider_membership_id" UUID NOT NULL,
    "parking_right_id" UUID NOT NULL,
    "status" "parking_listing_status" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price_per_hour_paisa" BIGINT NOT NULL,
    "min_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "max_duration_minutes" INTEGER NOT NULL DEFAULT 720,
    "allowed_vehicle_types" "vehicle_type"[],
    "security_deposit_paisa" BIGINT NOT NULL DEFAULT 0,
    "settlement_recipient_user_id" UUID NOT NULL,
    "settlement_wallet_account_id" UUID NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "deactivated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "parking_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_quotes" (
    "id" UUID NOT NULL,
    "driver_user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "parking_spot_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "base_amount_paisa" BIGINT NOT NULL,
    "platform_fee_paisa" BIGINT NOT NULL,
    "deposit_paisa" BIGINT NOT NULL,
    "total_amount_paisa" BIGINT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_allocations" (
    "id" UUID NOT NULL,
    "parking_spot_id" UUID NOT NULL,
    "parking_right_id" UUID NOT NULL,
    "capacity_unit" INTEGER NOT NULL DEFAULT 1,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "parking_allocation_status" NOT NULL DEFAULT 'HELD',
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "parking_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_holds" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "driver_user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "parking_spot_id" UUID NOT NULL,
    "allocation_id" UUID NOT NULL,
    "status" "reservation_hold_status" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reservation_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "booking_code" VARCHAR(20) NOT NULL,
    "hold_id" UUID NOT NULL,
    "allocation_id" UUID NOT NULL,
    "driver_user_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "parking_spot_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "parking_right_id" UUID NOT NULL,
    "provider_user_id" UUID NOT NULL,
    "settlement_recipient_user_id" UUID NOT NULL,
    "settlement_wallet_account_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "scheduled_end_at" TIMESTAMPTZ(6) NOT NULL,
    "effective_end_at" TIMESTAMPTZ(6) NOT NULL,
    "base_amount_paisa" BIGINT NOT NULL,
    "platform_fee_paisa" BIGINT NOT NULL,
    "deposit_paisa" BIGINT NOT NULL,
    "total_amount_paisa" BIGINT NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "idempotency_key" VARCHAR(100) NOT NULL,
    "confirmed_at" TIMESTAMPTZ(6),
    "checked_in_at" TIMESTAMPTZ(6),
    "checkout_requested_at" TIMESTAMPTZ(6),
    "checked_out_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_credentials" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "status" "access_credential_status" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "payer_user_id" UUID NOT NULL,
    "amount_paisa" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "provider" VARCHAR(30) NOT NULL DEFAULT 'SIMULATED',
    "provider_reference" VARCHAR(120),
    "idempotency_key" VARCHAR(100) NOT NULL,
    "captured_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "requested_by_user_id" UUID NOT NULL,
    "amount_paisa" BIGINT NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "refund_status" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" VARCHAR(100) NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" UUID NOT NULL,
    "provider_user_id" UUID NOT NULL,
    "wallet_account_id" UUID NOT NULL,
    "amount_paisa" BIGINT NOT NULL,
    "status" "payout_status" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" VARCHAR(100) NOT NULL,
    "reviewed_by_id" UUID,
    "review_note" VARCHAR(500),
    "reviewed_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "idempotency_key" VARCHAR(120),
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "driver_user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" VARCHAR(2000),
    "provider_reply" VARCHAR(2000),
    "provider_replied_by_id" UUID,
    "provider_replied_at" TIMESTAMPTZ(6),
    "reported_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "opened_by_user_id" UUID NOT NULL,
    "category" "dispute_category" NOT NULL,
    "description" VARCHAR(3000) NOT NULL,
    "evidence" JSONB,
    "status" "dispute_status" NOT NULL DEFAULT 'OPEN',
    "resolution" VARCHAR(3000),
    "resolved_by_user_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parking_rights_parking_spot_id_status_valid_until_idx" ON "parking_rights"("parking_spot_id", "status", "valid_until");

-- CreateIndex
CREATE INDEX "parking_rights_holder_user_id_status_idx" ON "parking_rights"("holder_user_id", "status");

-- CreateIndex
CREATE INDEX "parking_rights_provider_membership_id_status_idx" ON "parking_rights"("provider_membership_id", "status");

-- CreateIndex
CREATE INDEX "parking_listings_parking_spot_id_status_idx" ON "parking_listings"("parking_spot_id", "status");

-- CreateIndex
CREATE INDEX "parking_listings_provider_user_id_status_idx" ON "parking_listings"("provider_user_id", "status");

-- CreateIndex
CREATE INDEX "parking_listings_provider_membership_id_status_idx" ON "parking_listings"("provider_membership_id", "status");

-- CreateIndex
CREATE INDEX "parking_listings_parking_right_id_status_idx" ON "parking_listings"("parking_right_id", "status");

-- CreateIndex
CREATE INDEX "booking_quotes_driver_user_id_created_at_idx" ON "booking_quotes"("driver_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "booking_quotes_listing_id_expires_at_idx" ON "booking_quotes"("listing_id", "expires_at");

-- CreateIndex
CREATE INDEX "parking_allocations_parking_spot_id_start_at_end_at_status_idx" ON "parking_allocations"("parking_spot_id", "start_at", "end_at", "status");

-- CreateIndex
CREATE INDEX "parking_allocations_parking_right_id_capacity_unit_start_at_idx" ON "parking_allocations"("parking_right_id", "capacity_unit", "start_at", "end_at", "status");

-- CreateIndex
CREATE INDEX "parking_allocations_status_expires_at_idx" ON "parking_allocations"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_holds_allocation_id_key" ON "reservation_holds"("allocation_id");

-- CreateIndex
CREATE INDEX "reservation_holds_driver_user_id_status_expires_at_idx" ON "reservation_holds"("driver_user_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "reservation_holds_listing_id_status_expires_at_idx" ON "reservation_holds"("listing_id", "status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_holds_driver_user_id_idempotency_key_key" ON "reservation_holds"("driver_user_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_hold_id_key" ON "bookings"("hold_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_allocation_id_key" ON "bookings"("allocation_id");

-- CreateIndex
CREATE INDEX "bookings_driver_user_id_created_at_idx" ON "bookings"("driver_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "bookings_provider_user_id_status_start_at_idx" ON "bookings"("provider_user_id", "status", "start_at");

-- CreateIndex
CREATE INDEX "bookings_property_id_status_start_at_idx" ON "bookings"("property_id", "status", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_driver_user_id_idempotency_key_key" ON "bookings"("driver_user_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "access_credentials_booking_id_key" ON "access_credentials"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_credentials_token_hash_key" ON "access_credentials"("token_hash");

-- CreateIndex
CREATE INDEX "access_credentials_status_expires_at_idx" ON "access_credentials"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_reference_key" ON "payments"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_booking_id_status_idx" ON "payments"("booking_id", "status");

-- CreateIndex
CREATE INDEX "payments_payer_user_id_created_at_idx" ON "payments"("payer_user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "refunds_idempotency_key_key" ON "refunds"("idempotency_key");

-- CreateIndex
CREATE INDEX "refunds_payment_id_status_idx" ON "refunds"("payment_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payout_requests_idempotency_key_key" ON "payout_requests"("idempotency_key");

-- CreateIndex
CREATE INDEX "payout_requests_provider_user_id_status_created_at_idx" ON "payout_requests"("provider_user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payout_requests_status_created_at_idx" ON "payout_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_idempotency_key_key" ON "notifications"("user_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_key" ON "reviews"("booking_id");

-- CreateIndex
CREATE INDEX "reviews_driver_user_id_created_at_idx" ON "reviews"("driver_user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "disputes_booking_id_key" ON "disputes"("booking_id");

-- CreateIndex
CREATE INDEX "disputes_status_created_at_idx" ON "disputes"("status", "created_at");

-- CreateIndex
CREATE INDEX "disputes_opened_by_user_id_created_at_idx" ON "disputes"("opened_by_user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_property_id_normalized_spot_code_key" ON "parking_spots"("property_id", "normalized_spot_code");

-- AddForeignKey
ALTER TABLE "parking_rights" ADD CONSTRAINT "parking_rights_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_rights" ADD CONSTRAINT "parking_rights_holder_user_id_fkey" FOREIGN KEY ("holder_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_rights" ADD CONSTRAINT "parking_rights_provider_membership_id_fkey" FOREIGN KEY ("provider_membership_id") REFERENCES "property_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_rights" ADD CONSTRAINT "parking_rights_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_rights" ADD CONSTRAINT "parking_rights_verified_by_admin_id_fkey" FOREIGN KEY ("verified_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_listings" ADD CONSTRAINT "parking_listings_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_listings" ADD CONSTRAINT "parking_listings_provider_user_id_fkey" FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_listings" ADD CONSTRAINT "parking_listings_provider_membership_id_fkey" FOREIGN KEY ("provider_membership_id") REFERENCES "property_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_listings" ADD CONSTRAINT "parking_listings_parking_right_id_fkey" FOREIGN KEY ("parking_right_id") REFERENCES "parking_rights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_listings" ADD CONSTRAINT "parking_listings_settlement_recipient_user_id_fkey" FOREIGN KEY ("settlement_recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_listings" ADD CONSTRAINT "parking_listings_settlement_wallet_account_id_fkey" FOREIGN KEY ("settlement_wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_quotes" ADD CONSTRAINT "booking_quotes_driver_user_id_fkey" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_quotes" ADD CONSTRAINT "booking_quotes_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "parking_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_quotes" ADD CONSTRAINT "booking_quotes_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_quotes" ADD CONSTRAINT "booking_quotes_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_allocations" ADD CONSTRAINT "parking_allocations_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_allocations" ADD CONSTRAINT "parking_allocations_parking_right_id_fkey" FOREIGN KEY ("parking_right_id") REFERENCES "parking_rights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_holds" ADD CONSTRAINT "reservation_holds_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "booking_quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_holds" ADD CONSTRAINT "reservation_holds_driver_user_id_fkey" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_holds" ADD CONSTRAINT "reservation_holds_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "parking_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_holds" ADD CONSTRAINT "reservation_holds_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_holds" ADD CONSTRAINT "reservation_holds_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "parking_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hold_id_fkey" FOREIGN KEY ("hold_id") REFERENCES "reservation_holds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "parking_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driver_user_id_fkey" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "parking_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_parking_right_id_fkey" FOREIGN KEY ("parking_right_id") REFERENCES "parking_rights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_user_id_fkey" FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_settlement_recipient_user_id_fkey" FOREIGN KEY ("settlement_recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_settlement_wallet_account_id_fkey" FOREIGN KEY ("settlement_wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_credentials" ADD CONSTRAINT "access_credentials_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_provider_user_id_fkey" FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_driver_user_id_fkey" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_replied_by_id_fkey" FOREIGN KEY ("provider_replied_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_user_id_fkey" FOREIGN KEY ("opened_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Marketplace invariants not representable in the Prisma schema.
CREATE EXTENSION IF NOT EXISTS "btree_gist";

ALTER TABLE "parking_spots"
  ADD CONSTRAINT "parking_spots_capacity_check" CHECK ("capacity" > 0),
  ADD CONSTRAINT "parking_spots_resource_shape_check" CHECK (
    ("resource_type" = 'FIXED_SPACE' AND "capacity" = 1 AND "spot_code" IS NOT NULL)
    OR ("resource_type" = 'SHARED_POOL' AND "spot_code" IS NULL)
  );

ALTER TABLE "parking_rights"
  ADD CONSTRAINT "parking_rights_quantity_check" CHECK ("quantity" > 0),
  ADD CONSTRAINT "parking_rights_validity_check" CHECK ("valid_until" IS NULL OR "valid_until" > "valid_from"),
  ADD CONSTRAINT "parking_rights_use_only_check" CHECK (
    "right_type" <> 'USE_ONLY'
    OR ("can_list" = false AND "can_set_price" = false AND "can_manage_bookings" = false)
  );

ALTER TABLE "parking_listings"
  ADD CONSTRAINT "parking_listings_money_check" CHECK (
    "price_per_hour_paisa" > 0 AND "security_deposit_paisa" >= 0
  ),
  ADD CONSTRAINT "parking_listings_duration_check" CHECK (
    "min_duration_minutes" > 0 AND "max_duration_minutes" >= "min_duration_minutes"
  );

ALTER TABLE "booking_quotes"
  ADD CONSTRAINT "booking_quotes_time_check" CHECK ("end_at" > "start_at" AND "expires_at" > "created_at"),
  ADD CONSTRAINT "booking_quotes_money_check" CHECK (
    "base_amount_paisa" >= 0 AND "platform_fee_paisa" >= 0 AND "deposit_paisa" >= 0
    AND "total_amount_paisa" = "base_amount_paisa" + "platform_fee_paisa" + "deposit_paisa"
  );

ALTER TABLE "parking_allocations"
  ADD CONSTRAINT "parking_allocations_time_check" CHECK ("end_at" > "start_at"),
  ADD CONSTRAINT "parking_allocations_capacity_unit_check" CHECK ("capacity_unit" > 0),
  ADD CONSTRAINT "parking_allocations_no_overlap" EXCLUDE USING gist (
    "parking_spot_id" WITH =,
    "capacity_unit" WITH =,
    tstzrange("start_at", "end_at", '[)') WITH &&
  ) WHERE ("status" IN ('HELD', 'BOOKED'));

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_time_check" CHECK ("scheduled_end_at" > "start_at" AND "effective_end_at" > "start_at"),
  ADD CONSTRAINT "bookings_money_check" CHECK (
    "base_amount_paisa" >= 0 AND "platform_fee_paisa" >= 0 AND "deposit_paisa" >= 0
    AND "total_amount_paisa" = "base_amount_paisa" + "platform_fee_paisa" + "deposit_paisa"
  );

ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount_paisa" > 0);
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_amount_check" CHECK ("amount_paisa" > 0);
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_amount_check" CHECK ("amount_paisa" > 0);
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5);

CREATE UNIQUE INDEX "ledger_transactions_reference_unique"
  ON "ledger_transactions"("reference_type", "reference_id")
  WHERE "reference_id" IS NOT NULL;
