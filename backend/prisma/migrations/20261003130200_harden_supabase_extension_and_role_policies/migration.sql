BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Supabase already includes extensions in its application search path.
-- Moving relocatable extensions preserves type and operator object identities.
DO $$
DECLARE installed_extension RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions')
    AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    FOR installed_extension IN
      SELECT e.extname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname IN ('citext', 'btree_gist') AND e.extrelocatable AND n.nspname = 'public'
    LOOP
      EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', installed_extension.extname);
    END LOOP;
  END IF;
END $$;

-- Preserve the existing own-role/admin authorization while eliminating
-- overlapping permissive SELECT policies and per-row JWT evaluation.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles'
      AND policyname = 'Users can view their own roles')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles'
      AND policyname = 'Administrators can manage roles') THEN
    DROP POLICY "Users can view their own roles" ON user_roles;
    DROP POLICY "Administrators can manage roles" ON user_roles;
    CREATE POLICY "Own roles or administrator read" ON user_roles FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id OR
        (SELECT auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true');
    CREATE POLICY "Administrator role insert" ON user_roles FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true');
    CREATE POLICY "Administrator role update" ON user_roles FOR UPDATE TO authenticated
      USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true')
      WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true');
    CREATE POLICY "Administrator role delete" ON user_roles FOR DELETE TO authenticated
      USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true');
  END IF;
END $$;

COMMIT;
