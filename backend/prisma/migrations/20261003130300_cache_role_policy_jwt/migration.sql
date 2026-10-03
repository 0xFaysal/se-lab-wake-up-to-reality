BEGIN;
SET LOCAL lock_timeout = '5s';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles'
    AND policyname = 'Own roles or administrator read') THEN
    ALTER POLICY "Own roles or administrator read" ON user_roles
      USING ((SELECT auth.uid()) = user_id OR
        ((SELECT auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');
    ALTER POLICY "Administrator role insert" ON user_roles
      WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');
    ALTER POLICY "Administrator role update" ON user_roles
      USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true')
      WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');
    ALTER POLICY "Administrator role delete" ON user_roles
      USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'is_admin') = 'true');
  END IF;
END $$;

COMMIT;
