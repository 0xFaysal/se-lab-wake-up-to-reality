-- Keep at most one active default vehicle for each owner.
ALTER TABLE "vehicles"
ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;

WITH ranked_active_vehicles AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "owner_user_id"
      ORDER BY "created_at" DESC, "id" DESC
    ) AS position
  FROM "vehicles"
  WHERE "deleted_at" IS NULL
)
UPDATE "vehicles" AS vehicle
SET "is_default" = true
FROM ranked_active_vehicles AS ranked
WHERE vehicle."id" = ranked."id"
  AND ranked.position = 1;

CREATE UNIQUE INDEX "vehicles_one_active_default_per_owner_key"
ON "vehicles" ("owner_user_id")
WHERE "is_default" = true AND "deleted_at" IS NULL;

CREATE INDEX "vehicles_owner_active_created_at_idx"
ON "vehicles" ("owner_user_id", "created_at" DESC)
WHERE "deleted_at" IS NULL;
