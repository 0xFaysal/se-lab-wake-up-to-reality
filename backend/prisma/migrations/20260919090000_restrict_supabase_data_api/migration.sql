-- ParkEase accesses PostgreSQL through the backend only. Keep public-schema
-- tables unavailable to Supabase Data API roles unless a future migration
-- deliberately grants access and adds an appropriate RLS policy.
-- `anon` and `authenticated` are created by Supabase, but Prisma replays every
-- migration in a plain PostgreSQL shadow database. Revoke each role only when
-- it exists so the same migration remains valid in both environments.
DO $$
DECLARE
  data_api_role TEXT;
BEGIN
  FOREACH data_api_role IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = data_api_role) THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %I',
        data_api_role
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON TABLES FROM %I',
        data_api_role
      );
    END IF;
  END LOOP;
END
$$;

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
