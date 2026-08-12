ALTER TABLE "property_images"
ADD COLUMN "url" TEXT,
ADD COLUMN "provider" VARCHAR(30) NOT NULL DEFAULT 'CLOUDINARY',
ADD COLUMN "is_cover" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "property_images"
  ) THEN
    RAISE EXCEPTION
      'Existing property_images require a URL/provider backfill before Day 6 migration';
  END IF;
END $$;

ALTER TABLE "property_images"
ALTER COLUMN "url" SET NOT NULL;

ALTER TABLE "property_images"
ADD CONSTRAINT "property_images_secure_url_check"
CHECK ("url" ~ '^https://');

WITH ranked_images AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "property_id"
      ORDER BY "sort_order" ASC, "created_at" ASC, "id" ASC
    ) AS row_number
  FROM "property_images"
)
UPDATE "property_images" AS image
SET "is_cover" = ranked.row_number = 1
FROM ranked_images AS ranked
WHERE image."id" = ranked."id";

CREATE UNIQUE INDEX "uq_property_single_cover_image"
ON "property_images" ("property_id")
WHERE "is_cover" = true;
