-- Nullable metadata keeps the migration safe for legacy rows. New Property
-- writes always populate a complete AES-GCM ciphertext, IV, and auth tag set.
ALTER TABLE "properties"
ADD COLUMN "exact_address_iv" VARCHAR(32),
ADD COLUMN "exact_address_tag" VARCHAR(32),
ADD COLUMN "access_instructions_iv" VARCHAR(32),
ADD COLUMN "access_instructions_tag" VARCHAR(32);

ALTER TABLE "properties"
ADD CONSTRAINT "properties_exact_address_encryption_complete_check"
CHECK (
  "exact_address_iv" IS NOT NULL
  AND "exact_address_tag" IS NOT NULL
) NOT VALID;

ALTER TABLE "properties"
ADD CONSTRAINT "properties_access_instructions_encryption_complete_check"
CHECK (
  ("access_instructions_ciphertext" IS NULL
    AND "access_instructions_iv" IS NULL
    AND "access_instructions_tag" IS NULL)
  OR
  ("access_instructions_ciphertext" IS NOT NULL
    AND "access_instructions_iv" IS NOT NULL
    AND "access_instructions_tag" IS NOT NULL)
) NOT VALID;
