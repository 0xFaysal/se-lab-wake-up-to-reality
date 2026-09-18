-- One-time, data-preserving repair for the development database that applied
-- the platform-fee index rename before the migration files were reordered.
-- This updates Prisma migration checksums only after verifying that the actual
-- database already has the canonical index produced by the repaired history.
DO $$
DECLARE
  updated_rows INTEGER;
BEGIN
  IF to_regclass('public.platform_fee_rules_scope_type_scope_id_status_effective_fro_idx') IS NULL THEN
    RAISE EXCEPTION 'Canonical platform fee index is missing; migration history was not changed';
  END IF;

  IF to_regclass('public.platform_fee_rules_scope_type_scope_id_status_effective_from_id') IS NOT NULL THEN
    RAISE EXCEPTION 'Legacy platform fee index still exists; migration history was not changed';
  END IF;

  UPDATE "_prisma_migrations"
  SET "checksum" = 'e5e9ec823aa9933e453ae8cb5113853e24b7224c2afbb3a42f27ead400fbe7cd'
  WHERE "migration_name" = '20260917164112_admin_option'
    AND "finished_at" IS NOT NULL
    AND "rolled_back_at" IS NULL;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 1 THEN
    RAISE EXCEPTION 'Expected one applied 20260917164112_admin_option migration, found %', updated_rows;
  END IF;

  UPDATE "_prisma_migrations"
  SET "checksum" = '6e58529f68958df0d7d6220b9629daae403a600632efae54675b79a3a4bcd74d'
  WHERE "migration_name" = '20260917193000_advanced_admin_operations'
    AND "finished_at" IS NOT NULL
    AND "rolled_back_at" IS NULL;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 1 THEN
    RAISE EXCEPTION 'Expected one applied 20260917193000_advanced_admin_operations migration, found %', updated_rows;
  END IF;
END
$$;
