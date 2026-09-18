-- This migration predates the migration that creates platform_fee_rules.
-- Some existing development databases had the old Prisma-generated index
-- from db push, while a clean shadow database does not. Rename it only when
-- the legacy index exists, so the migration remains safe in both histories.
DO $$
BEGIN
  IF to_regclass('public.platform_fee_rules_scope_type_scope_id_status_effective_from_id') IS NOT NULL
     AND to_regclass('public.platform_fee_rules_scope_type_scope_id_status_effective_fro_idx') IS NULL THEN
    ALTER INDEX "platform_fee_rules_scope_type_scope_id_status_effective_from_id"
      RENAME TO "platform_fee_rules_scope_type_scope_id_status_effective_fro_idx";
  END IF;
END
$$;
