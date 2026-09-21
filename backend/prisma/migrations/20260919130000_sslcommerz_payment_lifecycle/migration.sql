-- Preserve legacy simulated payments while adding the real gateway lifecycle.
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'CREATED';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'SESSION_CREATED';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'VALIDATING';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'SUCCEEDED';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'REFUND_PENDING';

ALTER TYPE "refund_status" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "refund_status" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "payments"
  ADD COLUMN "environment" VARCHAR(20) NOT NULL DEFAULT 'DEVELOPMENT',
  ADD COLUMN "merchant_transaction_id" VARCHAR(30),
  ADD COLUMN "gateway_session_key" VARCHAR(160),
  ADD COLUMN "checkout_url" TEXT,
  ADD COLUMN "session_expires_at" TIMESTAMPTZ(6),
  ADD COLUMN "validation_id" VARCHAR(160),
  ADD COLUMN "bank_transaction_id" VARCHAR(160),
  ADD COLUMN "gateway_status" VARCHAR(40),
  ADD COLUMN "card_type" VARCHAR(80),
  ADD COLUMN "card_brand" VARCHAR(80),
  ADD COLUMN "issuer" VARCHAR(120),
  ADD COLUMN "risk_level" INTEGER,
  ADD COLUMN "risk_title" VARCHAR(160),
  ADD COLUMN "refunded_amount_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "initiated_at" TIMESTAMPTZ(6),
  ADD COLUMN "succeeded_at" TIMESTAMPTZ(6),
  ADD COLUMN "cancelled_at" TIMESTAMPTZ(6),
  ADD COLUMN "expired_at" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "payments_merchant_transaction_id_key" ON "payments"("merchant_transaction_id");
CREATE UNIQUE INDEX "payments_gateway_session_key_key" ON "payments"("gateway_session_key");
CREATE UNIQUE INDEX "payments_validation_id_key" ON "payments"("validation_id");
CREATE UNIQUE INDEX "payments_one_sslcommerz_per_booking_idx"
  ON "payments"("booking_id")
  WHERE "provider" = 'SSLCOMMERZ';
CREATE INDEX "payments_booking_id_provider_idx" ON "payments"("booking_id", "provider");

CREATE TABLE "payment_attempts" (
  "id" UUID NOT NULL,
  "payment_id" UUID NOT NULL,
  "attempt_number" INTEGER NOT NULL,
  "merchant_transaction_id" VARCHAR(30) NOT NULL,
  "session_key" VARCHAR(160),
  "status" "payment_status" NOT NULL DEFAULT 'CREATED',
  "initiated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "payment_attempts_merchant_transaction_id_key" ON "payment_attempts"("merchant_transaction_id");
CREATE UNIQUE INDEX "payment_attempts_session_key_key" ON "payment_attempts"("session_key");
CREATE UNIQUE INDEX "payment_attempts_payment_id_attempt_number_key" ON "payment_attempts"("payment_id", "attempt_number");
CREATE INDEX "payment_attempts_payment_id_status_idx" ON "payment_attempts"("payment_id", "status");

ALTER TABLE "refunds"
  ADD COLUMN "gateway_refund_transaction_id" VARCHAR(30),
  ADD COLUMN "gateway_refund_reference_id" VARCHAR(160),
  ADD COLUMN "gateway_status" VARCHAR(80),
  ADD COLUMN "policy_reason" VARCHAR(240),
  ADD COLUMN "submitted_at" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "refunds_gateway_refund_transaction_id_key" ON "refunds"("gateway_refund_transaction_id");
CREATE UNIQUE INDEX "refunds_gateway_refund_reference_id_key" ON "refunds"("gateway_refund_reference_id");
