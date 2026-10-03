-- ParkEase accesses PostgreSQL through the backend only. Keep public-schema
-- tables unavailable to Supabase Data API roles unless a future migration
-- deliberately grants access and adds an appropriate RLS policy.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" FROM "anon", "authenticated";

ALTER DEFAULT PRIVILEGES IN SCHEMA "public"
  REVOKE ALL PRIVILEGES ON TABLES FROM "anon", "authenticated";

DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT schemaname, tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      table_record.schemaname,
      table_record.tablename
    );
  END LOOP;
END
$$;
