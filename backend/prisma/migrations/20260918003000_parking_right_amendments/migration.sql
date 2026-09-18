CREATE TYPE "parking_right_amendment_status" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'PARKING_RIGHT_UPDATED';

ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RIGHT_AMENDMENT_SUBMITTED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RIGHT_AMENDMENT_APPROVED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'PARKING_RIGHT_AMENDMENT_REJECTED';

CREATE TABLE "parking_right_amendments" (
  "id" UUID NOT NULL,
  "parking_right_id" UUID NOT NULL,
  "requested_by_user_id" UUID NOT NULL,
  "reviewed_by_admin_id" UUID,
  "base_right_version" INTEGER NOT NULL,
  "proposed_changes" JSONB NOT NULL,
  "status" "parking_right_amendment_status" NOT NULL DEFAULT 'PENDING',
  "submitted_at" TIMESTAMPTZ(6),
  "resolved_at" TIMESTAMPTZ(6),
  "reason" VARCHAR(500),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "parking_right_amendments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "parking_right_amendments_parking_right_id_fkey" FOREIGN KEY ("parking_right_id") REFERENCES "parking_rights"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "parking_right_amendments_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "parking_right_amendments_reviewed_by_admin_id_fkey" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "parking_right_amendments_parking_right_id_status_created_at_idx" ON "parking_right_amendments"("parking_right_id", "status", "created_at" DESC);
CREATE INDEX "parking_right_amendments_requested_by_user_id_status_created_idx" ON "parking_right_amendments"("requested_by_user_id", "status", "created_at" DESC);
CREATE UNIQUE INDEX "parking_right_amendments_one_pending_per_right_idx" ON "parking_right_amendments"("parking_right_id") WHERE "status" = 'PENDING';
