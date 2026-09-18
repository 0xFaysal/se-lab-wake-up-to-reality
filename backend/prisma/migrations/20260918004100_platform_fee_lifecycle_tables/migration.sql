ALTER TABLE "platform_fee_rules"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "supersedes_rule_id" UUID,
  ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "activated_at" TIMESTAMPTZ(6),
  ADD COLUMN "archived_at" TIMESTAMPTZ(6),
  ADD CONSTRAINT "platform_fee_rules_supersedes_rule_id_fkey" FOREIGN KEY ("supersedes_rule_id") REFERENCES "platform_fee_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "platform_fee_rules" SET "activated_at" = "created_at" WHERE "status" = 'ACTIVE' AND "activated_at" IS NULL;

ALTER TABLE "booking_quotes"
  ADD COLUMN "platform_fee_rule_id" UUID,
  ADD CONSTRAINT "booking_quotes_platform_fee_rule_id_fkey" FOREIGN KEY ("platform_fee_rule_id") REFERENCES "platform_fee_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "platform_fee_rules_supersedes_rule_id_idx" ON "platform_fee_rules"("supersedes_rule_id");
CREATE INDEX "booking_quotes_platform_fee_rule_id_idx" ON "booking_quotes"("platform_fee_rule_id");
