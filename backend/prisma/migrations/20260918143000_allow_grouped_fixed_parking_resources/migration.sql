-- A fixed parking resource may now represent either one legacy physical space
-- or a grouped parent whose physical spaces live in parking_resource_units.
ALTER TABLE "parking_spots"
  DROP CONSTRAINT "parking_spots_resource_shape_check";

ALTER TABLE "parking_spots"
  ADD CONSTRAINT "parking_spots_resource_shape_check" CHECK (
    (
      "resource_type" = 'FIXED_SPACE'
      AND (
        (
          "capacity" = 1
          AND "spot_code" IS NOT NULL
          AND "normalized_spot_code" IS NOT NULL
        )
        OR (
          "spot_code" IS NULL
          AND "normalized_spot_code" IS NULL
        )
      )
    )
    OR (
      "resource_type" = 'SHARED_POOL'
      AND "capacity" > 0
      AND "spot_code" IS NULL
      AND "normalized_spot_code" IS NULL
    )
  );
