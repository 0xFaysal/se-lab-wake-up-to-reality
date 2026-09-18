-- Marketplace pricing belongs to parking_listings. A physical resource may be
-- created before it has any commercial offer, so the legacy spot price can be 0.
ALTER TABLE "parking_spots"
DROP CONSTRAINT IF EXISTS "parking_spot_money_valid";

ALTER TABLE "parking_spots"
ADD CONSTRAINT "parking_spot_money_valid"
CHECK (
  "hourly_rate_paisa" >= 0
  AND "minimum_deposit_paisa" >= 0
);
