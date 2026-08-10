-- Normalize existing Bangladesh phone numbers before enforcing one canonical format.
DO $$
BEGIN
  IF EXISTS (
    SELECT normalized_phone
    FROM (
      SELECT CASE
        WHEN "phone" ~ '^01[3-9][0-9]{8}$' THEN '+88' || "phone"
        WHEN "phone" ~ '^8801[3-9][0-9]{8}$' THEN '+' || "phone"
        ELSE "phone"
      END AS normalized_phone
      FROM "users"
    ) normalized_users
    GROUP BY normalized_phone
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate users resolve to the same normalized phone number';
  END IF;
END $$;

UPDATE "users"
SET "phone" = CASE
  WHEN "phone" ~ '^01[3-9][0-9]{8}$' THEN '+88' || "phone"
  WHEN "phone" ~ '^8801[3-9][0-9]{8}$' THEN '+' || "phone"
  ELSE "phone"
END;

ALTER TABLE "users"
ADD CONSTRAINT "users_phone_canonical_bangladesh"
CHECK ("phone" ~ '^\+8801[3-9][0-9]{8}$');

ALTER TABLE "refresh_sessions"
ADD COLUMN "remember_device" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "password_reset_tokens" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "used_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key"
ON "password_reset_tokens"("token_hash");

CREATE INDEX "password_reset_tokens_user_id_expires_at_idx"
ON "password_reset_tokens"("user_id", "expires_at");

ALTER TABLE "password_reset_tokens"
ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
