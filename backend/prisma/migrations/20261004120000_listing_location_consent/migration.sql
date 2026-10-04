ALTER TABLE "parking_listings"
ADD COLUMN IF NOT EXISTS "disclose_location_before_payment" BOOLEAN NOT NULL DEFAULT false;
