ALTER TABLE "properties"
  ADD COLUMN IF NOT EXISTS "is_shared_building" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "exit_credential_hash" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "exit_credential_expires_at" TIMESTAMPTZ(6);

ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "security_rating" SMALLINT,
  ADD COLUMN IF NOT EXISTS "location_accuracy_rating" SMALLINT,
  ADD COLUMN IF NOT EXISTS "cleanliness_rating" SMALLINT;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_security_rating_check"
    CHECK ("security_rating" IS NULL OR "security_rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "reviews_location_accuracy_rating_check"
    CHECK ("location_accuracy_rating" IS NULL OR "location_accuracy_rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "reviews_cleanliness_rating_check"
    CHECK ("cleanliness_rating" IS NULL OR "cleanliness_rating" BETWEEN 1 AND 5);

ALTER TABLE "provider_payout_methods"
  ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';

ALTER TABLE "booking_settlements"
  ADD COLUMN IF NOT EXISTS "provider_released_at" TIMESTAMPTZ(6);
