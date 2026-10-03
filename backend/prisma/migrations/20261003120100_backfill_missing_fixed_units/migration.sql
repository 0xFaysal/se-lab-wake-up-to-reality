-- Demo seeds created after the original units migration lacked child bays.
INSERT INTO "parking_resource_units" (
  "id", "parking_spot_id", "spot_code", "normalized_spot_code", "status", "created_at", "updated_at"
)
SELECT gen_random_uuid(), spot."id",
  CASE WHEN spot."capacity" = 1 THEN COALESCE(spot."spot_code", 'LEGACY-' || LEFT(spot."id"::text, 8))
    ELSE LEFT(COALESCE(spot."spot_code", 'LEGACY'), 20) || '-' || sequence.unit::text END,
  CASE WHEN spot."capacity" = 1 THEN COALESCE(spot."normalized_spot_code", 'LEGACY' || LEFT(spot."id"::text, 8))
    ELSE LEFT(COALESCE(spot."normalized_spot_code", 'LEGACY'), 20) || sequence.unit::text END,
  spot."status", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "parking_spots" spot CROSS JOIN LATERAL generate_series(1, spot."capacity") sequence(unit)
WHERE spot."resource_type" = 'FIXED_SPACE' AND spot."deleted_at" IS NULL
AND NOT EXISTS (SELECT 1 FROM "parking_resource_units" unit WHERE unit."parking_spot_id" = spot."id");
