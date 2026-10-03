BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_cancellations ENABLE ROW LEVEL SECURITY;

-- Backend-owned financial tables must not be exposed through the Data API.
DO $$
DECLARE api_role TEXT;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE payment_attempts, wallet_holds, booking_settlements, booking_cancellations FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', api_role);
    END IF;
  END LOOP;
END $$;

COMMIT;
