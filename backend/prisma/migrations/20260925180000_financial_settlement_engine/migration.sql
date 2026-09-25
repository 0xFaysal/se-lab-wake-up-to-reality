-- Add the immutable snapshots and ledger-backed lifecycle used by the final
-- booking settlement engine. Existing financial history is preserved.
ALTER TYPE "payout_status" ADD VALUE IF NOT EXISTS 'REQUESTED';
ALTER TYPE "payout_status" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "payout_method_type" ADD VALUE IF NOT EXISTS 'ROCKET';

ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'BOOKING_CHECKOUT_REQUESTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'BOOKING_SETTLED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'BOOKING_CANCELLATION_REFUND_CALCULATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYMENT_SESSION_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PAYMENT_CANCELLED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'DRIVER_WALLET_HOLD_CREATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'DRIVER_WALLET_HOLD_RELEASED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'DRIVER_WALLET_APPLIED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'DRIVER_REFUND_CREDITED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'OVERTIME_CHARGED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PROVIDER_EARNINGS_RELEASED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PLATFORM_REVENUE_RECOGNIZED';

CREATE TYPE "wallet_hold_status" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');
CREATE TYPE "overtime_billing_mode" AS ENUM ('MULTIPLIER', 'FIXED_PER_HOUR');
CREATE TYPE "booking_financial_status" AS ENUM ('UNPAID', 'HELD', 'SETTLEMENT_PENDING', 'SETTLED', 'CANCELLED');
CREATE TYPE "booking_settlement_status" AS ENUM ('PENDING', 'PAYMENT_DUE', 'COMPLETED');

ALTER TABLE "parking_listings"
  ADD COLUMN "overtime_billing_mode" "overtime_billing_mode" NOT NULL DEFAULT 'MULTIPLIER',
  ADD COLUMN "overtime_multiplier_bps" INTEGER DEFAULT 15000,
  ADD COLUMN "overtime_rate_per_hour_paisa" BIGINT,
  ADD COLUMN "overtime_grace_period_minutes" INTEGER NOT NULL DEFAULT 15;

ALTER TABLE "booking_quotes"
  ADD COLUMN "base_rate_per_hour_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "subtotal_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "driver_wallet_available_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "driver_wallet_applied_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "gateway_amount_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "overtime_billing_mode" "overtime_billing_mode" NOT NULL DEFAULT 'MULTIPLIER',
  ADD COLUMN "overtime_multiplier_bps" INTEGER,
  ADD COLUMN "overtime_rate_per_hour_paisa" BIGINT,
  ADD COLUMN "overtime_grace_period_minutes" INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN "cancellation_policy_version" INTEGER NOT NULL DEFAULT 1;

UPDATE "booking_quotes"
SET "subtotal_paisa" = "base_amount_paisa" + "platform_fee_paisa",
    "gateway_amount_paisa" = "total_amount_paisa";

ALTER TABLE "bookings"
  ADD COLUMN "base_rate_per_hour_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "subtotal_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "driver_wallet_applied_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "gateway_amount_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "overtime_billing_mode" "overtime_billing_mode" NOT NULL DEFAULT 'MULTIPLIER',
  ADD COLUMN "overtime_multiplier_bps" INTEGER,
  ADD COLUMN "overtime_rate_per_hour_paisa" BIGINT,
  ADD COLUMN "overtime_grace_period_minutes" INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN "cancellation_policy_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "financial_status" "booking_financial_status" NOT NULL DEFAULT 'UNPAID';

UPDATE "bookings"
SET "subtotal_paisa" = "base_amount_paisa" + "platform_fee_paisa",
    "gateway_amount_paisa" = "total_amount_paisa",
    "financial_status" = CASE
      WHEN "status" IN ('CONFIRMED', 'CHECKED_IN', 'CHECKOUT_REQUESTED') THEN 'HELD'::"booking_financial_status"
      WHEN "status" = 'COMPLETED' THEN 'SETTLED'::"booking_financial_status"
      WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::"booking_financial_status"
      ELSE 'UNPAID'::"booking_financial_status"
    END;

ALTER TABLE "payments"
  ADD COLUMN "gross_amount_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "wallet_applied_paisa" BIGINT NOT NULL DEFAULT 0;

UPDATE "payments" SET "gross_amount_paisa" = "amount_paisa";

ALTER TABLE "payout_requests"
  ADD COLUMN "destination_ciphertext" TEXT,
  ADD COLUMN "destination_iv" VARCHAR(64),
  ADD COLUMN "destination_tag" VARCHAR(64);

CREATE TABLE "wallet_holds" (
  "id" UUID NOT NULL,
  "wallet_account_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "payment_id" UUID,
  "amount_paisa" BIGINT NOT NULL,
  "status" "wallet_hold_status" NOT NULL DEFAULT 'ACTIVE',
  "idempotency_key" VARCHAR(120) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "released_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "wallet_holds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallet_holds_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "wallet_holds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "wallet_holds_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "wallet_holds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "wallet_holds_idempotency_key_key" ON "wallet_holds"("idempotency_key");
CREATE INDEX "wallet_holds_wallet_account_id_status_expires_at_idx" ON "wallet_holds"("wallet_account_id", "status", "expires_at");
CREATE INDEX "wallet_holds_booking_id_status_idx" ON "wallet_holds"("booking_id", "status");

CREATE TABLE "booking_settlements" (
  "id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "scheduled_start_at" TIMESTAMPTZ(6) NOT NULL,
  "scheduled_end_at" TIMESTAMPTZ(6) NOT NULL,
  "actual_check_in_at" TIMESTAMPTZ(6),
  "actual_check_out_at" TIMESTAMPTZ(6) NOT NULL,
  "base_charge_paisa" BIGINT NOT NULL,
  "platform_fee_paisa" BIGINT NOT NULL,
  "deposit_paisa" BIGINT NOT NULL,
  "overtime_minutes" INTEGER NOT NULL DEFAULT 0,
  "overtime_charge_paisa" BIGINT NOT NULL DEFAULT 0,
  "deposit_used_paisa" BIGINT NOT NULL DEFAULT 0,
  "deposit_returned_paisa" BIGINT NOT NULL DEFAULT 0,
  "provider_gross_paisa" BIGINT NOT NULL,
  "provider_net_paisa" BIGINT NOT NULL,
  "platform_revenue_paisa" BIGINT NOT NULL,
  "driver_refund_credit_paisa" BIGINT NOT NULL DEFAULT 0,
  "driver_wallet_charged_paisa" BIGINT NOT NULL DEFAULT 0,
  "outstanding_paisa" BIGINT NOT NULL DEFAULT 0,
  "status" "booking_settlement_status" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" VARCHAR(120) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  CONSTRAINT "booking_settlements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "booking_settlements_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "booking_settlements_booking_id_key" ON "booking_settlements"("booking_id");
CREATE UNIQUE INDEX "booking_settlements_idempotency_key_key" ON "booking_settlements"("idempotency_key");
CREATE INDEX "booking_settlements_status_created_at_idx" ON "booking_settlements"("status", "created_at");

CREATE TABLE "booking_cancellations" (
  "id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "driver_user_id" UUID NOT NULL,
  "policy_version" INTEGER NOT NULL,
  "minutes_before_start" INTEGER NOT NULL,
  "booking_refund_bps" INTEGER NOT NULL,
  "booking_refund_paisa" BIGINT NOT NULL,
  "deposit_return_paisa" BIGINT NOT NULL,
  "platform_fee_refund_paisa" BIGINT NOT NULL DEFAULT 0,
  "driver_wallet_credit_paisa" BIGINT NOT NULL,
  "provider_cancellation_paisa" BIGINT NOT NULL,
  "reason" VARCHAR(500),
  "idempotency_key" VARCHAR(120) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_cancellations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "booking_cancellations_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "booking_cancellations_driver_user_id_fkey" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "booking_cancellations_booking_id_key" ON "booking_cancellations"("booking_id");
CREATE UNIQUE INDEX "booking_cancellations_idempotency_key_key" ON "booking_cancellations"("idempotency_key");
CREATE INDEX "booking_cancellations_driver_user_id_created_at_idx" ON "booking_cancellations"("driver_user_id", "created_at" DESC);

ALTER TABLE "parking_listings"
  ADD CONSTRAINT "parking_listings_overtime_policy_check"
  CHECK (
    "overtime_grace_period_minutes" BETWEEN 0 AND 180
    AND (
      ("overtime_billing_mode" = 'MULTIPLIER' AND "overtime_multiplier_bps" BETWEEN 10000 AND 50000 AND "overtime_rate_per_hour_paisa" IS NULL)
      OR
      ("overtime_billing_mode" = 'FIXED_PER_HOUR' AND "overtime_rate_per_hour_paisa" BETWEEN 100 AND 10000000 AND "overtime_multiplier_bps" IS NULL)
    )
  );
CREATE TYPE "payment_purpose" AS ENUM ('BOOKING', 'SETTLEMENT');

ALTER TABLE "payments" ADD COLUMN "purpose" "payment_purpose" NOT NULL DEFAULT 'BOOKING';
DROP INDEX IF EXISTS "payments_one_sslcommerz_per_booking_idx";
CREATE UNIQUE INDEX "payments_one_booking_charge_per_booking_idx"
  ON "payments"("booking_id") WHERE "purpose" = 'BOOKING';
CREATE UNIQUE INDEX "payments_one_settlement_charge_per_booking_idx"
  ON "payments"("booking_id") WHERE "purpose" = 'SETTLEMENT';
