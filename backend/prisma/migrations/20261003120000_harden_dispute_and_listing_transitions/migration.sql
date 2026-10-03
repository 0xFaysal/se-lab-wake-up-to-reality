ALTER TABLE "parking_listings" ADD COLUMN "suspended_by_property" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "disputes" ADD COLUMN "provider_held_paisa" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "previous_booking_status" "booking_status";
ALTER TABLE "disputes" ADD CONSTRAINT "dispute_hold_nonnegative" CHECK ("provider_held_paisa" >= 0);
