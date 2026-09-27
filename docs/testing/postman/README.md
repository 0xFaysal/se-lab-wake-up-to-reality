# ParkEase BD system tests (Postman)

Black-box system tests for the ParkEase BD API, organised by the test suites (TS-2 to TS-9) in [SystemTestingReport.md](../SystemTestingReport.md). Every request is named after its test ID. Each check is a Postman test named `<ID> <what is checked> → <expected>`.

- `ParkEase-System-Tests.postman_collection.json`: the collection (19 folders, plus one optional slow folder)
- `ParkEase-Local.postman_environment.json`: the environment (`host`, `api`, `mailpit`, `adminEmail`, `adminPassword`)

## Before you run

1. Start PostgreSQL, Redis and Mailpit. Mailpit catches the emails the tests check:
   ```bash
   cd backend
   npm run db:up
   docker run -d --name parkease-mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit \
     --smtp-auth-accept-any --smtp-tls-cert sans:localhost --smtp-tls-key sans:localhost
   ```
   In `backend/.env`, set `EMAIL_HOST=localhost`, `EMAIL_PORT=1025`, any `EMAIL_USERNAME`/`EMAIL_PASSWORD`, and `EXPOSE_DEVELOPMENT_AUTH_CODES=true`.
2. Apply migrations and seed data: `npx prisma migrate deploy`, `npx prisma db seed`, `npm run db:seed:demo`. The demo seed is needed by tests S08–S11.
   On a plain local PostgreSQL, `migrate deploy` stops at `20260919090000_restrict_supabase_data_api` with `role "anon" does not exist`, because that migration expects Supabase's `anon` and `authenticated` roles (defect D1, test BLD-01). Create the two roles once, then run `migrate deploy` again:
   ```bash
   docker exec parkease-postgres psql -U parkease -d parkease -c "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;"
   ```
3. Start the API. Mailpit uses a self-signed certificate, so the local API has to accept it:
   ```bash
   NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev          # Git Bash
   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"; npm run dev  # PowerShell
   ```


## Option A: run everything from the terminal (recommended)

```bash
cd backend
node scripts/qa/run-postman-tests.mjs               # about 3 minutes
node scripts/qa/run-postman-tests.mjs --with-slow   # adds the 6-minute hold-expiry test
```

The script runs each folder with Newman (Postman's command-line runner). Between folders it clears the API's rate-limit counters. The evidence goes to `docs/testing/evidence/postman/`.

## Option B: run it in the Postman app

1. **Import** both JSON files. Select the **ParkEase Local** environment and type the Admin password into `adminPassword` (Current value).
2. Run the folders **in order** with the Collection Runner: right-click a folder, choose **Run folder**, then **Run**. Every folder continues from the variables the previous one saved.
3. **Before each folder**, clear the rate-limit counters from a terminal in `backend/`:
   ```bash
   node scripts/qa/postman-helper.mjs reset-rate-limits
   ```
   The API allows 5 registrations per hour and 5 sensitive actions per account every 15 minutes, and a full run goes over that. Clearing the counters only resets the counts; the limits themselves are unchanged. Tests A15 and A32 still check that the limits work.
4. **Before folder `02b`**, also run the command below, using the run ID printed in the Postman console by test S00 (it is also the `run` environment value):
   ```bash
   node scripts/qa/postman-helper.mjs attach-test-images <run>
   ```

Folder `01` always starts a new test run with new accounts. Its `S00` request creates the run ID, the phone numbers and the dates. To start over, run from folder `01` again.

## Reading the results

- **Passed:** the API behaved as the SRS requires.
- **Failed:** a defect. The failing test names the requirement (for example `FR-BKG-07`), and the report lists each one in Part 3.
- IDs starting with `S-` are setup steps (creating data the next tests need). They are not counted as test cases.
