-- Introduce physical fixed-space units without renaming the legacy
-- parking_spots table, which remains the logical parking-resource store.
CREATE TABLE "parking_resource_units" (
  "id" UUID NOT NULL,
  "parking_spot_id" UUID NOT NULL,
  "spot_code" VARCHAR(30) NOT NULL,
  "normalized_spot_code" VARCHAR(30) NOT NULL,
  "display_name" VARCHAR(120),
  "status" "parking_spot_status" NOT NULL DEFAULT 'INACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "parking_resource_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "parking_resource_units_parking_spot_id_normalized_spot_code_key"
  ON "parking_resource_units"("parking_spot_id", "normalized_spot_code");
CREATE INDEX "parking_resource_units_parking_spot_id_status_idx"
  ON "parking_resource_units"("parking_spot_id", "status");

ALTER TABLE "parking_resource_units"
  ADD CONSTRAINT "parking_resource_units_parking_spot_id_fkey"
  FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Each legacy fixed-space row represented one physical bay. Preserve its
-- identity as a child unit so existing rights, listings and bookings survive.
INSERT INTO "parking_resource_units" (
  "id", "parking_spot_id", "spot_code", "normalized_spot_code", "display_name",
  "status", "created_at", "updated_at", "deleted_at"
)
SELECT
  gen_random_uuid(),
  "id",
  COALESCE("spot_code", 'LEGACY-' || LEFT("id"::text, 8)),
  COALESCE("normalized_spot_code", 'LEGACY' || REPLACE(LEFT("id"::text, 8), '-', '')),
  "display_name",
  "status",
  "created_at",
  "updated_at",
  "deleted_at"
FROM "parking_spots"
WHERE "resource_type" = 'FIXED_SPACE';

ALTER TABLE "parking_listings" ADD COLUMN "parking_resource_unit_id" UUID;
ALTER TABLE "parking_allocations" ADD COLUMN "parking_resource_unit_id" UUID;
ALTER TABLE "bookings" ADD COLUMN "parking_resource_unit_id" UUID;
ALTER TABLE "bookings" ADD COLUMN "assigned_unit_code" VARCHAR(30);

UPDATE "parking_listings" AS listing
SET "parking_resource_unit_id" = unit."id"
FROM "parking_resource_units" AS unit
WHERE unit."parking_spot_id" = listing."parking_spot_id";

UPDATE "parking_allocations" AS allocation
SET "parking_resource_unit_id" = unit."id"
FROM "parking_resource_units" AS unit
WHERE unit."parking_spot_id" = allocation."parking_spot_id";

UPDATE "bookings" AS booking
SET
  "parking_resource_unit_id" = unit."id",
  "assigned_unit_code" = unit."spot_code"
FROM "parking_resource_units" AS unit
WHERE unit."parking_spot_id" = booking."parking_spot_id";

CREATE INDEX "parking_listings_parking_resource_unit_id_status_idx"
  ON "parking_listings"("parking_resource_unit_id", "status");
CREATE INDEX "parking_allocations_parking_resource_unit_id_start_at_end_at_status_idx"
  ON "parking_allocations"("parking_resource_unit_id", "start_at", "end_at", "status");
CREATE INDEX "bookings_parking_resource_unit_id_status_start_at_idx"
  ON "bookings"("parking_resource_unit_id", "status", "start_at");

ALTER TABLE "parking_listings"
  ADD CONSTRAINT "parking_listings_parking_resource_unit_id_fkey"
  FOREIGN KEY ("parking_resource_unit_id") REFERENCES "parking_resource_units"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parking_allocations"
  ADD CONSTRAINT "parking_allocations_parking_resource_unit_id_fkey"
  FOREIGN KEY ("parking_resource_unit_id") REFERENCES "parking_resource_units"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_parking_resource_unit_id_fkey"
  FOREIGN KEY ("parking_resource_unit_id") REFERENCES "parking_resource_units"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "parking_allocations"
  ADD CONSTRAINT "parking_allocations_unit_no_overlap" EXCLUDE USING gist (
    "parking_resource_unit_id" WITH =,
    tstzrange("start_at", "end_at", '[)') WITH &&
  ) WHERE ("parking_resource_unit_id" IS NOT NULL AND "status" IN ('HELD', 'BOOKED'));

CREATE TABLE "parking_listing_price_history" (
  "id" UUID NOT NULL,
  "parking_listing_id" UUID NOT NULL,
  "previous_price_paisa" BIGINT,
  "price_per_hour_paisa" BIGINT NOT NULL,
  "changed_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parking_listing_price_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "parking_listing_price_history_price_check" CHECK ("price_per_hour_paisa" > 0)
);

CREATE INDEX "parking_listing_price_history_listing_created_idx"
  ON "parking_listing_price_history"("parking_listing_id", "created_at" DESC);
CREATE INDEX "parking_listing_price_history_actor_created_idx"
  ON "parking_listing_price_history"("changed_by_user_id", "created_at" DESC);

ALTER TABLE "parking_listing_price_history"
  ADD CONSTRAINT "parking_listing_price_history_listing_id_fkey"
  FOREIGN KEY ("parking_listing_id") REFERENCES "parking_listings"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parking_listing_price_history"
  ADD CONSTRAINT "parking_listing_price_history_changed_by_user_id_fkey"
  FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "parking_listing_price_history" (
  "id", "parking_listing_id", "previous_price_paisa", "price_per_hour_paisa",
  "changed_by_user_id", "created_at"
)
SELECT gen_random_uuid(), "id", NULL, "price_per_hour_paisa", "provider_user_id", "created_at"
FROM "parking_listings";
