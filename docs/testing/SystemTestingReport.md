# ParkEase BD: System Test Report

---

# Part 1: Test Plan

## 1.1 Scope

**In scope**

| Module | What is verified |
|---|---|
| TS-1 Build & automated suites | Prisma schema and migrations, formatting, type checks, lint, production builds, unit tests, integration tests, dependency audit, CI pipeline |
| TS-2 Accounts & authentication | Self-registration (Driver, Owner), blocked roles, every registration field, email verification, login by email/phone, sessions, refresh, password change/reset, CSRF, rate limits |
| TS-3 Owner properties | Creating several properties, every property field, privacy of the exact address, ownership isolation, Admin approve/reject, re-verification rules, delete rules |
| TS-4 Parking spaces, rights & listings | Many spaces per property (single, bulk, grouped rows, shared pool), every space field, status changes, availability rules and exceptions, rights claims (single and batch), Admin verification, listings |
| TS-5 Search & suggestions | Every eligible spot appears with correct counts, every filter, privacy of public results |
| TS-6 Driver booking & payment | Vehicles, quote, hold, booking, payment, conflicts, capacity, concurrency, hold expiry, cancellation, refunds |
| TS-7 Manager | Account creation, invitation, acceptance, every permission, widening/narrowing, revocation, forbidden actions |
| TS-8 Guard | Account creation, property membership, shift assignment, check-in/check-out, entry-code rules |
| TS-9 Reviews, disputes, finance, Admin, roles | Reviews, disputes, payout accounts and payouts, ledger, Admin moderation, role isolation, notifications, property closure |

**Out of scope**

- Admin features outside the core flow: platform-fee rules, legal documents, email campaigns, property merge, governance votes, right amendments and evidence documents, analytics.
- The frontend. Only the API is tested, plus the frontend's type check, lint and production build under TS-1.

## 1.2 Test approach

| Level / type | Method |
|---|---|
| Static testing | Prisma validate, Prettier, TypeScript, ESLint, `npm audit`, `git diff --check` |
| Unit testing | Backend suite (`npm test`), 94 tests over validation, policy, encryption and phone/registration normalisation |
| Integration testing | Backend suite (`npm run test:integration`) against a migrated PostgreSQL database and Redis |
| System testing (black-box, functional) | A Postman collection of 494 requests run against the running API, following the real flow from registration to payout. Each test case has an ID and an assertion; the collection is in [`docs/testing/postman/`](postman/) |
| Negative & boundary testing | Equivalence partitioning and boundary value analysis on registration, property, space, listing, vehicle and search fields (for example password lengths 11, 12, 128 and 129) |
| Security testing | Role isolation (10 cross-role checks), cross-account access, CSRF, rate limits, account enumeration, masking of private data, privacy of public search results |
| Concurrency testing | Three simultaneous holds on a 2-car pool (B29) and three simultaneous payout requests (PO07) |
| Acceptance checks | Each test case is linked to an SRS requirement; a mismatch with the SRS is recorded as a defect in Part 3 |

The system tests are automated and repeatable: `node backend/scripts/qa/run-postman-tests.mjs` runs all 20 folders and writes the raw results to `docs/testing/evidence/postman/`. The same collection can be run by hand in the Postman app; [`docs/testing/postman/README.md`](postman/README.md) explains both.

## 1.3 Test environment

| Item | Value |
|---|---|
| Machine | Windows 11, Node.js v24.11.1, npm 11.6.2 |
| Database | PostgreSQL 18.6 (Docker), Redis 8.10.1 (Docker) |
| API | `http://localhost:4000`, `NODE_ENV=development`, 30 migrations applied |
| Email | Mailpit (Docker) on SMTP 1025 / UI 8025. Tests A19, M04 and G02 check that the email really arrived |
| Verification codes | `EXPOSE_DEVELOPMENT_AUTH_CODES=true`, so codes, setup links and reset tokens come back in the response |
| Payments | Simulated capture endpoint; no real bank or MFS transfer |

## 1.4 Test data

Every run creates fresh accounts with a random run ID (`eqggpj` for this run), so runs never collide.

| Role | Account |
|---|---|
| Driver A, Driver B | `qa.drivera.eqggpj@example.test`, `qa.driverb.eqggpj@example.test` |
| Owner A, Owner B | `qa.ownera.eqggpj@example.test`, `qa.ownerb.eqggpj@example.test` |
| Manager | `qa.manager.eqggpj@example.test` (created by Owner A) |
| Guard, second Guard | `qa.guard.eqggpj@example.test` (Owner A), `qa.guard2.eqggpj@example.test` (Owner B) |
| Admin | `admin@parkease.local` |
| Demo accounts | `demo.*@example.test` from `npm run db:seed:demo`, used by S08–S11 |

Owner A's test estate (Tejgaon, more than 2 km from the demo properties so search results never mix):

- **Property 1, "QA Tejgaon Tower":** single bays F1, F2, F3; a 3-unit "Level 2" row; a 4-unit "Row G"; a 2-car shared pool.
- **Property 2, "QA Tejgaon Plaza"** (0.7 km away): bay B1.
- **Property 3, "QA Unverified Lot":** never approved, used to test what is refused on an unverified Property.

That makes 7 listings and 13 bookable units. Prices run from 50 to 65 BDT per hour; bay F1 carries a 100 BDT deposit.

---

# Part 2: Test Specifications and Results

Status: ✅ Pass · ❌ Fail (defect in Part 3)

## TS-1 Build and automated suites

| ID | Test case | Input / steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| BLD-01 | Prisma schema & migrations | `prisma validate`, `generate`, `migrate deploy`, `migrate status` | All succeed | `validate`, `generate` succeed; **`migrate deploy` fails** on migration `20260919090000_restrict_supabase_data_api`: `role "anon" does not exist` | ❌ |
| BLD-02 | Backend formatting | `npm run format:check` | No issues | 81 files unformatted | ❌ |
| BLD-03 | Backend type check & build | `npm run typecheck`, `npm run build` | Exit 0 | Exit 0 | ✅ |
| BLD-04 | Frontend type check | `npm run typecheck` | Exit 0 | Exit 0 | ✅ |
| BLD-05 | Frontend lint | `npm run lint` | 0 errors | 11 errors, 203 warnings | ❌ |
| BLD-06 | Frontend build | `npm run build` | Exit 0 | Exit 0; 109 pages built | ✅ |
| BLD-07 | Backend unit tests | `npm test` | All pass | 94/94 passed | ✅ |
| BLD-08 | Backend integration tests | `npm run test:integration` | All pass, process exits | 38/40 passed; the run does not exit | ❌ |
| BLD-09 | Dependency audit | `npm audit --audit-level=high` | No high or critical | Backend 4 high; frontend 1 critical (`next`) + 5 high | ❌ |
| BLD-10 | Whitespace | `git diff --check` | No errors | No errors | ✅ |
| BLD-11 | CI pipeline | Check `.github/workflows` | An active `ci.yml` | Renamed to `ci.txt`; CI does not run | ❌ |




## TS-2 to TS-9 (system tests)

Each row is one test case from the Postman collection. "Check" is the assertion as it appears in the run log, so it can be traced to `docs/testing/evidence/postman/postman-results.json`.

### TS-2 Accounts & authentication

| ID | Check (expected result) | Actual | Status |
|---|---|---|---|
| A01 | Driver registration → 201 | as expected | ✅ |
| A02 | Email is stored lower-case | as expected | ✅ |
| A03 | Local 017 phone is stored as +88017… | as expected | ✅ |
| A04 | Access and refresh cookies are both set | as expected | ✅ |
| A05 | Session cookies are HttpOnly | as expected | ✅ |
| A07 | New account is not yet verified (nextAction VERIFY_EMAIL) | as expected | ✅ |
| A08 | GET /auth/me with the sign-up session → 200 | as expected | ✅ |
| A09 | Owner registration with role PARKING_OWNER → 201 | as expected | ✅ |
| A10 | PARKING_OWNER is stored as the PROVIDER role | as expected | ✅ |
| A11 | +880 phone format is accepted and kept | as expected | ✅ |
| A12 | Second owner registers with role PROVIDER → 201 | as expected | ✅ |
| A13 | Driver B registration with 8801… phone → 201 | as expected | ✅ |
| A13b | 8801… phone is normalised to +8801… | as expected | ✅ |
| A14 | Role MANAGER cannot self-register → 400 | as expected | ✅ |
| A15 | 6th registration in an hour is refused with 429 → 429 | as expected | ✅ |
| A16 | Property creation before email verification → 403 | as expected | ✅ |
| A17 | Verification code request → 202 | as expected | ✅ |
| A18 | Code is 6 digits | as expected | ✅ |
| A19 | At least one email was delivered to Driver A | as expected | ✅ |
| A20 | Wrong 6-digit code → 400 | as expected | ✅ |
| A21 | Code 12ab56 → 400 | as expected | ✅ |
| A22 | Correct code → 200 | as expected | ✅ |
| A23.1 | ownerA verification code request → 202; ownerA email verified → 200 | as expected | ✅ |
| A23.2 | ownerB verification code request → 202; ownerB email verified → 200 | as expected | ✅ |
| A23.3 | driverB verification code request → 202; driverB email verified → 200 | as expected | ✅ |
| A24 | emailVerified is true and status ACTIVE | as expected | ✅ |
| A25 | Login by email → 200 | as expected | ✅ |
| A26 | Login by 017… phone → 200 | as expected | ✅ |
| A27 | Login by +880… phone → 200 | as expected | ✅ |
| A28 | Login by upper-case email → 200 | as expected | ✅ |
| A29 | Remembered device gets a ~30-day refresh cookie | as expected | ✅ |
| A30 | Wrong password → 401 | as expected | ✅ |
| A31 | Unknown account → 401 | as expected | ✅ |
| A31b | Error body identical to wrong-password (no account enumeration) | as expected | ✅ |
| A32 | 6th failed login in 15 minutes → 429 | as expected | ✅ |
| A33 | POST with Origin https://evil.example → 403 | as expected | ✅ |
| A34 | Refresh → 200 | as expected | ✅ |
| A34b | A new refresh token is issued | as expected | ✅ |
| A35 | Reuse of a rotated refresh token → 401 | as expected | ✅ |
| A35b | Driver A's sign-up session after refresh-token reuse → 401 | as expected | ✅ |
| A36 | List own sessions → 200 | as expected | ✅ |
| A36b | Several sessions are listed | as expected | ✅ |
| A37 | Revoke another session → 204 | as expected | ✅ |
| A37b | Access token of the revoked session → 401 | as expected | ✅ |
| A39 | Wrong current password → 401 | as expected | ✅ |
| A40 | Weak new password → 400 | as expected | ✅ |
| A41 | Valid password change → 200 | as expected | ✅ |
| A42 | Other session after password change → 401 | as expected | ✅ |
| A43 | Current session after password change → 200 | as expected | ✅ |
| A44 | Reset request for a real account → 202 | as expected | ✅ |
| A45 | Reset request for an unknown account → 202 | as expected | ✅ |
| A45b | Same message, no token | as expected | ✅ |
| A46 | Reset with a valid token → 200 | as expected | ✅ |
| A47 | Re-used reset token → 400 | as expected | ✅ |
| A48 | Login with the reset password → 200 | as expected | ✅ |
| A49 | Login with the old password → 401 | as expected | ✅ |
| A50 | Logout succeeds | as expected | ✅ |
| A51 | Old access token after logout → 401 | as expected | ✅ |
| A53 | Logout-all succeeds | as expected | ✅ |
| A54 | Access token after logout-all → 401 | as expected | ✅ |
| A55 | GET /auth/me without a cookie → 401 | as expected | ✅ |
| X01 | Admin reset request → 202 | as expected | ✅ |
| X02 | A single-use reset token is issued for the Admin | as expected | ✅ |
| X03 | Admin login → 200 | as expected | ✅ |
| X03b | Admin account is ready (no forced password change pending) | as expected | ✅ |
| F01 | Full name 1 character → 400 | as expected | ✅ |
| F02 | Full name 121 characters → 400 | as expected | ✅ |
| F03 | Full name with a control character → 400 | as expected | ✅ |
| F04 | Full name missing → 400 | as expected | ✅ |
| F05 | Invalid email → 400 | as expected | ✅ |
| F06 | Email missing → 400 | as expected | ✅ |
| F07 | Email 255 characters → 400 | as expected | ✅ |
| F08 | Phone 12345 → 400 | as expected | ✅ |
| F09 | US phone number → 400 | as expected | ✅ |
| F10 | Phone starting 012 (not a mobile prefix) → 400 | as expected | ✅ |
| F11 | Phone missing → 400 | as expected | ✅ |
| F12 | Password 11 characters → 400 | as expected | ✅ |
| F13 | Password 129 characters → 400 | as expected | ✅ |
| F14 | Password without an upper-case letter → 400 | as expected | ✅ |
| F15 | Password without a lower-case letter → 400 | as expected | ✅ |
| F16 | Password without a digit → 400 | as expected | ✅ |
| F17 | Password without a symbol → 400 | as expected | ✅ |
| F18 | Password containing a space → 400 | as expected | ✅ |
| F19 | Terms not accepted → 400 | as expected | ✅ |
| F20 | Privacy policy not accepted → 400 | as expected | ✅ |
| F21 | Role missing → 400 | as expected | ✅ |
| F22 | Unknown role SUPERUSER → 400 | as expected | ✅ |
| F23 | Role GUARD → 400 | as expected | ✅ |
| F24 | Role ADMIN → 400 | as expected | ✅ |
| F25 | Duplicate email in upper case → 409 | as expected | ✅ |
| F26 | Duplicate phone in another format → 409 | as expected | ✅ |
| F27 | Full name 2 characters (lower boundary) → 201 | as expected | ✅ |
| F28 | Full name 120 characters (upper boundary) → 201 | as expected | ✅ |
| F29 | Password 12 characters (lower boundary) → 201 | as expected | ✅ |
| F30 | Password 128 characters (upper boundary) → 201 | as expected | ✅ |

### TS-3 Owner properties & Admin verification

| ID | Check (expected result) | Actual | Status |
|---|---|---|---|
| P01 | Create Property 1 → 201 | as expected | ✅ |
| P02 | New Property is PENDING and INACTIVE | as expected | ✅ |
| P03 | Owner reads own Property → 200 | as expected | ✅ |
| P03b | Every submitted field is returned unchanged | as expected | ✅ |
| P04 | Create a second Property → 201 | as expected | ✅ |
| P05 | Create a third Property → 201 | as expected | ✅ |
| PF01 | Name 2 characters → 400 | as expected | ✅ |
| PF02 | Name 121 characters → 400 | as expected | ✅ |
| PF03 | Name missing → 400 | as expected | ✅ |
| PF04 | Exact address 4 characters → 400 | as expected | ✅ |
| PF05 | Approximate address missing → 400 | as expected | ✅ |
| PF06 | Latitude 91 → 400 | as expected | ✅ |
| PF07 | Longitude 181 → 400 | as expected | ✅ |
| PF08 | Latitude as text → 400 | as expected | ✅ |
| PF09 | Entrance latitude without longitude → 400 | as expected | ✅ |
| PF10 | Entry cut-off 25:00 → 400 | as expected | ✅ |
| PF11 | Height limit 0 → 400 | as expected | ✅ |
| PF12 | Parking rules 2001 characters → 400 | as expected | ✅ |
| PF13 | Unknown field → 400 | as expected | ✅ |
| PF14 | Owner marks a Property as a shared building → 201 | HTTP 400 VALIDATION_ERROR | ❌ |
| P06 | Second owner, same exact address: created (no duplicate block) → 201 | as expected | ✅ |
| P07 | List own Properties → 200 | as expected | ✅ |
| P07b | Properties 1–3 are listed and Owner B's is not | as expected | ✅ |
| P08 | List view does not expose exact address or access instructions | as expected | ✅ |
| P10 | Other owner reads → 404 | as expected | ✅ |
| P11 | Other owner edits → 404 | as expected | ✅ |
| P12 | Other owner deletes → 404 | as expected | ✅ |
| P13 | Driver reads owner Property API → 403 | as expected | ✅ |
| P16 | Admin pending list → 200 | as expected | ✅ |
| P16b | Property 1 is in the queue | as expected | ✅ |
| P17 | Admin Property detail → 200 | as expected | ✅ |
| P17b | Exact address is visible to the Admin | as expected | ✅ |
| P18 | Approve without image → 409 | as expected | ✅ |
| P19 | Reject without reason → 400 | as expected | ✅ |
| P20 | Reject with a 9-character reason → 400 | as expected | ✅ |
| P21 | Reject with a valid reason → 200 | as expected | ✅ |
| P21b | Property 2 is REJECTED | as expected | ✅ |
| P22 | Owner edits rejected Property → 200 | as expected | ✅ |
| P22b | Property 2 is PENDING again | as expected | ✅ |
| P27 | Driver on Admin API → 403 | as expected | ✅ |
| P28 | Owner on Admin API → 403 | as expected | ✅ |
| P23 | Admin approves Property 1 → 200 | as expected | ✅ |
| P23b | Property is VERIFIED and ACTIVE | as expected | ✅ |
| P24 | Approve again → 409 | as expected | ✅ |
| P25 | Admin approves the edited Property 2 → 200 | as expected | ✅ |
| P25b | Property is VERIFIED and ACTIVE | as expected | ✅ |
| P26 | Create a Property to delete → 201 | as expected | ✅ |
| P29 | Delete Property without images → 204 | as expected | ✅ |
| P30 | Delete Property with an image → 409 | as expected | ✅ |
| P33 | Edit rules only → 200 | as expected | ✅ |
| P33b | Still VERIFIED and ACTIVE | as expected | ✅ |
| P31 | Stale version → 409 | as expected | ✅ |
| P32 | Edit exact address → 200 | as expected | ✅ |
| P32b | Property 2 is PENDING and INACTIVE | as expected | ✅ |
| P34 | Possible matches → 200 | as expected | ✅ |
| P34b | A Property at the same address is flagged as a possible duplicate | as expected | ✅ |
| P35 | Admin re-approves Property 2 → 200 | as expected | ✅ |
| P35b | Property is VERIFIED and ACTIVE | as expected | ✅ |
| P36 | Rename → 200 | as expected | ✅ |
| P36b | Property stays VERIFIED and ACTIVE after a rename | 'PENDING' | ❌ |

### TS-4 Parking spaces, rights & listings

| ID | Check (expected result) | Actual | Status |
|---|---|---|---|
| R01 | Create fixed space F1 → 201 | as expected | ✅ |
| R02 | Every submitted field is saved | as expected | ✅ |
| RF01 | Display name 1 character → 400 | as expected | ✅ |
| RF02 | Spot code 31 characters → 400 | as expected | ✅ |
| RF03 | Fixed space with capacity 2 → 400 | as expected | ✅ |
| RF04 | Fixed space without a spot code → 400 | as expected | ✅ |
| RF05 | Shared pool with a spot code → 400 | as expected | ✅ |
| RF06 | No vehicle types → 400 | as expected | ✅ |
| RF07 | Vehicle type TRUCK → 400 | as expected | ✅ |
| RF08 | Height limit 99 cm → 400 | as expected | ✅ |
| RF09 | Shared pool capacity 0 → 400 | as expected | ✅ |
| RF10 | Shared pool capacity 1001 → 400 | as expected | ✅ |
| RF11 | Unknown resource type → 400 | as expected | ✅ |
| R03 | Spot code f1 duplicates F-1 → 409 | as expected | ✅ |
| R04a | Create F2 → 201 | as expected | ✅ |
| R04b | Create F3 → 201 | as expected | ✅ |
| R04c | Bulk add Level 2 row → 201 | as expected | ✅ |
| R04d | One grouped space with 3 units | as expected | ✅ |
| R05 | Bulk add Row G → 201 | as expected | ✅ |
| R05b | One grouped space with 4 units | as expected | ✅ |
| R06 | 101 bays in one request → 400 | as expected | ✅ |
| R07 | Same code twice in one request → 409 | as expected | ✅ |
| R08 | Existing code F-1 → 409 | as expected | ✅ |
| R09 | Create shared pool (capacity 2) → 201 | as expected | ✅ |
| R10 | Create a space in the second Property → 201 | as expected | ✅ |
| R11 | List spaces → 200 | as expected | ✅ |
| R12 | Row G has 4 units and Level 2 has 3 | as expected | ✅ |
| R13 | A single bay has 1 unit and the pool has capacity 2 | as expected | ✅ |
| R14 | F3 → ACTIVE → 200 | as expected | ✅ |
| R14b | Status is ACTIVE | as expected | ✅ |
| R15 | F3 → MAINTENANCE → 200 | as expected | ✅ |
| R15b | Status is MAINTENANCE | as expected | ✅ |
| R16 | F3 → BLOCKED → 200 | as expected | ✅ |
| R16b | Status is BLOCKED | as expected | ✅ |
| R17 | F3 → ACTIVE → 200 | as expected | ✅ |
| R17b | Status is ACTIVE | as expected | ✅ |
| R18 | PATCH with no fields → 400 | as expected | ✅ |
| R19 | Save 7 weekly rules → 200 | as expected | ✅ |
| R20 | 7 rules saved | as expected | ✅ |
| AV01 | End time before start time → 400 | as expected | ✅ |
| AV02 | Day of week 7 → 400 | as expected | ✅ |
| AV03 | End time 24:00 → 400 | as expected | ✅ |
| AV04 | Invalid date 2026-13-40 → 400 | as expected | ✅ |
| R21 | Date block → 201 | as expected | ✅ |
| R22 | The block records who created it | as expected | ✅ |
| R23 | End before start → 400 | as expected | ✅ |
| R24 | Other owner reads F1 → refused (403/404) | as expected | ✅ |
| R25 | Driver reads F1 → 403 | as expected | ✅ |
| R26 | Other owner adds a space → refused (403/404) | as expected | ✅ |
| R27 | Add a space to unverified Property 3 → 403 | as expected | ✅ |
| R28 | Delete an unused space → 200 | as expected | ✅ |
| R29 | Level 2 units keep their names | as expected | ✅ |
| RT01 | Right claim for F1 → 201 | as expected | ✅ |
| RT01b | Claim is PENDING_VERIFICATION; Right claim for Level 2 row → 201 | as expected | ✅ |
| RT02 | Batch claim for two spaces → 201 | as expected | ✅ |
| RT01bb | Claim is PENDING_VERIFICATION | as expected | ✅ |
| RT01c | Right claim for Row G → 201 | as expected | ✅ |
| RT01cb | Claim is PENDING_VERIFICATION | as expected | ✅ |
| RT01d | Right claim for the pool → 201 | as expected | ✅ |
| RT01db | Claim is PENDING_VERIFICATION | as expected | ✅ |
| RT01e | Right claim for B1 → 201 | as expected | ✅ |
| RT01eb | Claim is PENDING_VERIFICATION | as expected | ✅ |
| RT03 | USE_ONLY with canList → 400 | as expected | ✅ |
| RT04 | validUntil before validFrom → 400 | as expected | ✅ |
| RT05 | Listing on a pending right → 409 | as expected | ✅ |
| RT06a | Admin pending rights → 200 | as expected | ✅ |
| RT06b | F1's claim is in the queue | as expected | ✅ |
| RT06 | Verify right for F1 → 200 | as expected | ✅ |
| RT07 | Stale expectedVersion → 409 | as expected | ✅ |
| RT08 | Verify right for Level 2 row → 200 | as expected | ✅ |
| RT08b | Verify right for Row G → 200 | as expected | ✅ |
| RT08c | Verify right for the pool → 200 | as expected | ✅ |
| RT08d | Verify right for B1 → 200 | as expected | ✅ |
| RT09 | Batch decision → 200 | as expected | ✅ |
| RT10 | F2 and F3 rights are VERIFIED | as expected | ✅ |
| LF01 | Title 2 characters → 400 | as expected | ✅ |
| LF02 | Price 0 → 400 | as expected | ✅ |
| LF03 | Price −5 → 400 | as expected | ✅ |
| LF04 | Minimum duration 10 minutes → 400 | as expected | ✅ |
| LF05 | Maximum duration below the minimum → 400 | as expected | ✅ |
| LF06 | No vehicle types → 400 | as expected | ✅ |
| LF07 | Deposit −1 → 400 | as expected | ✅ |
| RT11.rF1 | Listing for Bay F1 created → 201; Listing for Bay F1 activated → 200 | as expected | ✅ |
| RT11.rF2 | Listing for Bay F2 created → 201; Listing for Bay F2 activated → 200 | as expected | ✅ |
| RT11.rF3 | Listing for Bay F3 created → 201; Listing for Bay F3 activated → 200 | as expected | ✅ |
| RT11.rL2 | Listing for Level 2 row created → 201; Listing for Level 2 row activated → 200 | as expected | ✅ |
| RT11.rG | Listing for Row G created → 201; Listing for Row G activated → 200 | as expected | ✅ |
| RT11.rP | Listing for Visitor pool created → 201; Listing for Visitor pool activated → 200 | as expected | ✅ |
| RT11.rB1 | Listing for Bay B1 created → 201; Listing for Bay B1 activated → 200 | as expected | ✅ |
| RT11b | 7 of 7 listings ACTIVE | as expected | ✅ |
| RT12 | Second listing on the F1 right is created as a draft → 201 | as expected | ✅ |
| RT13 | Activate a second listing on a fixed space → 409 | as expected | ✅ |

### TS-5 Search & suggestions

| ID | Check (expected result) | Actual | Status |
|---|---|---|---|
| S01 | Public search without a login → 200 | as expected | ✅ |
| S02 | Property 1 is in the results | as expected | ✅ |
| S03 | All 6 of Property 1's spaces are offered | as expected | ✅ |
| S04 | Units per space: F1 1, F2 1, F3 1, Level 2 3, Row G 4, pool 2 | as expected | ✅ |
| S05 | Property 1 shows 12 available units | as expected | ✅ |
| S06 | Prices range from 50 to 65 BDT per hour | as expected | ✅ |
| S07 | Property 2 (0.7 km away) is also shown | as expected | ✅ |
| S08 | Seeded demo listing shared pool (Gulshan) is returned | as expected | ✅ |
| S09 | Seeded demo listing bay A-01 (Gulshan) is returned | false | ❌ |
| S10 | Seeded demo listing bay B-02 (Banani) is returned | false | ❌ |
| S11 | Seeded demo listing bay C-03 (Dhanmondi) is returned | false | ❌ |
| S12 | Motorcycle → only rP | as expected | ✅ |
| S13 | Microbus → only rG | as expected | ✅ |
| S14 | SUV → only rF1, rF3, rG | as expected | ✅ |
| S15 | Pool is hidden at night, F1 is still shown | as expected | ✅ |
| S16 | F3 is hidden during its date block, F1 is shown | as expected | ✅ |
| S17 | 10-minute booking (below the 60-minute minimum) → only | as expected | ✅ |
| S18 | 13.5-hour booking (above the 12-hour maximum) → only | as expected | ✅ |
| S19 | Maximum price 60 BDT → only rF1, rF2, rF3, rL2, rP | as expected | ✅ |
| S20 | Minimum price 63 BDT → only rG | as expected | ✅ |
| S21 | Covered only → only rF1, rF3, rG | as expected | ✅ |
| S22 | CCTV only → only rF1, rF2 | as expected | ✅ |
| S23 | Guard only → only rF1, rL2 | as expected | ✅ |
| S24 | Shared pools only → only rP | as expected | ✅ |
| S25 | At least 3 free units → only rL2, rG | as expected | ✅ |
| S26 | Property 1 shown, Property 2 (0.7 km) excluded | as expected | ✅ |
| S27 | Property 2 included | as expected | ✅ |
| S28 | No exact address, access instructions or owner contact in the response | as expected | ✅ |
| S29 | Coordinates are approximate, not the exact Property coordinates (FR-SRCH-04) | [ 23.75819, 90.39162 ] | ❌ |
| S30 | Search with sort=price → 200 | HTTP 400 VALIDATION_ERROR | ❌ |
| S31 | Search with page=1&limit=5 → 200 | HTTP 400 VALIDATION_ERROR | ❌ |
| SV01 | Start time in the past → 400 | as expected | ✅ |
| SV02 | End before start → 400 | as expected | ✅ |
| SV03 | Vehicle type missing → 400 | as expected | ✅ |
| SV04 | Latitude 95 → 400 | as expected | ✅ |
| SV05 | Radius 150 km → 400 | as expected | ✅ |
| S32 | Owner pauses F2's listing → 200 | as expected | ✅ |
| S33 | F2 is hidden from search | as expected | ✅ |
| S34 | Owner re-activates F2's listing → 200 | as expected | ✅ |
| S34b | F2 is back in search | as expected | ✅ |
| S35 | F2 → BLOCKED → 200 | as expected | ✅ |
| S35b | F2 is hidden from search | as expected | ✅ |
| S36 | F2 → ACTIVE → 200 | as expected | ✅ |
| S36c | F2 is back in search | as expected | ✅ |
| S37 | Admin suspends F2's listing → 200 | as expected | ✅ |
| S37b | F2 is hidden from search | as expected | ✅ |
| S37c | Admin resumes F2's listing → 200 | as expected | ✅ |
| S37d | F2 is back in search | as expected | ✅ |
| S38 | Public Property page → 200 | as expected | ✅ |
| S39 | Page shows offers but no exact address or access instructions | as expected | ✅ |
| S40 | Browse → 200 | as expected | ✅ |
| S40b | Properties 1 and 2 are both on the map | as expected | ✅ |

### TS-6 Driver vehicles, booking & payment

| ID | Check (expected result) | Actual | Status |
|---|---|---|---|
| V01 | Add a vehicle → 201 | as expected | ✅ |
| V02 | Fields saved and the first vehicle is the default | as expected | ✅ |
| VF01 | Registration number 3 characters → 400 | as expected | ✅ |
| VF02 | Brand missing → 400 | as expected | ✅ |
| VF03 | Colour 41 characters → 400 | as expected | ✅ |
| VF04 | Height 0 → 400 | as expected | ✅ |
| VF05 | Vehicle type TRUCK → 400 | as expected | ✅ |
| VF06 | Unknown extra field → 400 | as expected | ✅ |
| VF07 | Model missing → 400 | as expected | ✅ |
| V03 | Duplicate registration (lower case, no spaces) → 409 | as expected | ✅ |
| V04 | Add a second vehicle → 201 | as expected | ✅ |
| V04b | Second vehicle is not the default | as expected | ✅ |
| V05 | List own vehicles → 200 | as expected | ✅ |
| V05b | Both vehicles listed | as expected | ✅ |
| V06 | Edit a vehicle → 200 | as expected | ✅ |
| V07 | Set default vehicle → 200 | as expected | ✅ |
| V08 | Only the SUV is default | as expected | ✅ |
| V09 | Other driver reads → 404 | as expected | ✅ |
| V10 | Owner lists vehicles → 403 | as expected | ✅ |
| V11 | Delete a vehicle → 204 | as expected | ✅ |
| B01 | Quote → 201 | as expected | ✅ |
| B02 | 60 BDT + 6 BDT fee + 100 BDT deposit = 166 BDT | as expected | ✅ |
| B03 | Quote expires in about 5 minutes | as expected | ✅ |
| B04 | Quote for a vehicle taller than the space is refused | HTTP 201 | ❌ |
| B05 | Vehicle type not allowed → 409 | as expected | ✅ |
| B06 | Other driver's vehicle → 404 | as expected | ✅ |
| B07 | Start in the past → 400 | as expected | ✅ |
| B08 | 13.5 hours → 400 | as expected | ✅ |
| B09 | Owner requests a quote → 403 | as expected | ✅ |
| B10 | Hold → 201 | as expected | ✅ |
| B10b | Hold is ACTIVE for about 5 minutes | as expected | ✅ |
| B11 | Returns the same hold | as expected | ✅ |
| B12 | Second hold from one quote → 409 | as expected | ✅ |
| B14 | Quote for a single bay another driver is holding → 409 | as expected | ✅ |
| B15 | Create booking → 201 | as expected | ✅ |
| B15b | Booking waits for payment | as expected | ✅ |
| B17 | No access credential before payment | as expected | ✅ |
| B16 | Returns the same booking | as expected | ✅ |
| B18 | Capture payment → 201 | as expected | ✅ |
| B18b | Booking CONFIRMED and a one-time access credential issued | as expected | ✅ |
| B19 | Payment CAPTURED for 166 BDT | as expected | ✅ |
| B20 | Same payment returned, no second charge | as expected | ✅ |
| B21 | Exactly one payment on the booking | as expected | ✅ |
| B22 | Confirmed booking shows the exact address and access instructions (FR-PROP-02) | '{"success":true,"data":{"id":"59733d1…' | ❌ |
| B23 | Other driver → 404 | as expected | ✅ |
| B24 | 4 of 4 holds on Row G succeeded | as expected | ✅ |
| B25 | 5th booking attempt on a full 4-unit row → 409 | as expected | ✅ |
| B26 | Row G has no free units and is not offered | as expected | ✅ |
| B27 | Release a hold → 200 | as expected | ✅ |
| B28 | Row G shows 1 free unit | as expected | ✅ |
| B29 | Exactly 2 of 3 concurrent holds succeed; the pool is then full | as expected | ✅ |
| B30 | Pay for bay B1 (listing without a security deposit) → 201 | HTTP 500 INTERNAL_SERVER_ERROR | ❌ |
| B30b | Booking is CONFIRMED | undefined | ❌ |
| B31 | Pay for one Level 2 unit → 201 | as expected | ✅ |
| B31b | Booking is CONFIRMED | as expected | ✅ |
| B32 | Level 2 shows 2 free units | as expected | ✅ |
| B33 | Cancel a confirmed booking → 200 | as expected | ✅ |
| B33b | Booking is CANCELLED | as expected | ✅ |
| B35 | List refunds → 200 | as expected | ✅ |
| B34 | A refund exists for the cancelled booking's payment | [] | ❌ |
| B36 | Cancel again → 409 | as expected | ✅ |
| B37 | Driver lists bookings → 200 | as expected | ✅ |
| B37b | Only Driver A's bookings | as expected | ✅ |
| B38 | Owner lists bookings → 200 | as expected | ✅ |
| B38b | Includes the Level 2 booking | as expected | ✅ |
| B39 | Other owner lists bookings → 200 | as expected | ✅ |
| B39b | None of Owner A's bookings | as expected | ✅ |
| B40 | Driver on owner bookings → 403 | as expected | ✅ |
| H01 | Row G is back to 4 of 4 free | as expected | ✅ |

### TS-7 Manager

| ID | Check (expected result) | Actual | Status |
|---|---|---|---|
| MF01 | Manager name 1 character → 400 | as expected | ✅ |
| MF02 | Manager email invalid → 400 | as expected | ✅ |
| MF03 | Manager phone invalid → 400 | as expected | ✅ |
| M01 | Existing email → 409 | as expected | ✅ |
| M01b | Generic message that does not reveal which field clashed | as expected | ✅ |
| M02 | Create Manager account → 201 | as expected | ✅ |
| M03 | Account is PENDING and has no password yet (setup link issued) | as expected | ✅ |
| M04 | Setup email delivered | as expected | ✅ |
| M05 | Driver creates a Manager → 403 | as expected | ✅ |
| M06 | Login before setup → 401 | as expected | ✅ |
| M07 | Set password from the setup link → 200 | as expected | ✅ |
| M08 | Re-use the setup link → 400 | as expected | ✅ |
| M09 | Manager login → 200 | as expected | ✅ |
| M09b | Manager account is ACTIVE | as expected | ✅ |
| M10 | Unknown identifier → 404 | as expected | ✅ |
| M11 | Identifier of a non-Manager → 404 | as expected | ✅ |
| M11b | Same response as an unknown person | as expected | ✅ |
| M12 | Other owner invites → refused (403/404) | as expected | ✅ |
| M13 | Invitation → 201 | as expected | ✅ |
| M13b | Invitation is PENDING | as expected | ✅ |
| M14 | Duplicate invitation → 409 | as expected | ✅ |
| M15 | Manager lists invitations → 200 | as expected | ✅ |
| M15b | Invitation listed; exact address and access instructions hidden | as expected | ✅ |
| M16 | Manager reads Property 1's spaces before accepting → refused (403/404) | as expected | ✅ |
| M17 | No Property 1 bookings are visible before acceptance | as expected | ✅ |
| M18 | Accept invitation → 200 | as expected | ✅ |
| M18b | Link is ACTIVE | as expected | ✅ |
| M19 | Owner has a new notification after the acceptance | +0 | ❌ |
| M20 | Manager lists spaces on the linked Property → 200 | as expected | ✅ |
| M21 | Manager reads Property 2's spaces → refused (403/404) | as expected | ✅ |
| M22 | Manager lists listings → 200 | as expected | ✅ |
| M22b | Property 1 listings only (no B1) | as expected | ✅ |
| M23 | Pause a listing without LISTING_MANAGE → refused (403/404) | as expected | ✅ |
| M24 | Change a price without PRICE_MANAGE → refused (403/404) | as expected | ✅ |
| M25 | Manager saves weekly hours → 200 | as expected | ✅ |
| M26 | Manager adds a date block → 201 | as expected | ✅ |
| M27 | Linked Manager creates a space → 201 | HTTP 403 MARKETPLACE_FORBIDDEN | ❌ |
| M28 | Manager lists bookings → 200 | as expected | ✅ |
| M28b | Property 1 bookings only | as expected | ✅ |
| M29 | No payment amounts are shown to a Manager (FR-MGR-10) | '{"success":true,"data":[{"id":"59733d…' | ❌ |
| M30 | Driver contact details are not exposed | as expected | ✅ |
| M31 | Refused, or returns no provider balances | as expected | ✅ |
| M32 | Manager reads payouts → refused (403/404) | as expected | ✅ |
| M33 | Manager creates a Manager account → refused (403/404) | as expected | ✅ |
| M34 | Manager invites a Manager → refused (403/404) | as expected | ✅ |
| M35 | Manager deletes the Property → refused (403/404) | as expected | ✅ |
| M36 | Manager edits the Property → refused (403/404) | as expected | ✅ |
| M37 | Manager reads payout accounts → refused (403/404) | as expected | ✅ |
| M38 | Linked Manager creates a Guard → 201 | HTTP 403 AUTH_FORBIDDEN | ❌ |
| M39 | Add LISTING_MANAGE, PRICE_MANAGE, EARNINGS_VIEW → 200 | as expected | ✅ |
| M40 | Pause with LISTING_MANAGE (takes effect immediately) → 200 | as expected | ✅ |
| M41 | Change price with PRICE_MANAGE → 200 | as expected | ✅ |
| M42 | Manager reads Owner earnings even with EARNINGS_VIEW (FR-MGR-12) → refused (403/404) | HTTP 200 | ❌ |
| M43 | Scope the link to one space → 200 | as expected | ✅ |
| M43b | Only F2 is visible | as expected | ✅ |
| M44 | End the link → 200 | as expected | ✅ |
| M44b | Link is ENDED | as expected | ✅ |
| M45 | Manager reads Property 1 after the link ended → refused (403/404) | as expected | ✅ |
| M46 | Manager has link notifications | +0 | ❌ |
| M47 | A suspend action exists for Manager links | HTTP 404 ROUTE_NOT_FOUND | ❌ |

### TS-8 Guard

| ID | Check (expected result) | Actual | Status |
|---|---|---|---|
| G01 | Create Guard account → 201 | as expected | ✅ |
| G01b | Guard is PENDING until the password is set | as expected | ✅ |
| G02 | Setup email delivered | as expected | ✅ |
| G03 | Duplicate Guard → 409 | as expected | ✅ |
| G04a | Set password from setup link → 200 | as expected | ✅ |
| G04 | Guard login → 200 | as expected | ✅ |
| G05 | Unverified Property 3 → refused | as expected | ✅ |
| G06 | Unknown Guard → 404 | as expected | ✅ |
| G07 | Other owner → refused (403/404) | as expected | ✅ |
| G08 | Add Guard to Property → 201 | as expected | ✅ |
| G08b | Membership waits for the Guard's consent | as expected | ✅ |
| G08c | Guard contact is masked for the owner | as expected | ✅ |
| G09 | Duplicate membership → 409 | as expected | ✅ |
| G10 | No bookings visible | as expected | ✅ |
| G11 | Accept membership → 200 | as expected | ✅ |
| G11b | Membership ACTIVE | as expected | ✅ |
| G12 | Shift ending before it starts → 400 | as expected | ✅ |
| G13 | Create shift assignment → 201 | as expected | ✅ |
| G14 | Guard lists bookings → 200 | as expected | ✅ |
| G14b | Includes the Property 1 booking, not Property 2's | as expected | ✅ |
| G15 | Unknown credential → 404 | as expected | ✅ |
| G16 | Valid credential → 200 | as expected | ✅ |
| G17 | Driver contact and amounts are masked for the Guard | as expected | ✅ |
| G18 | Guard without access to Property 1 → 403 | as expected | ✅ |
| G19 | Owner calls check-in → 403 | as expected | ✅ |
| G20 | Outside the check-in window → 409 | as expected | ✅ |
| G21 | Credential does not belong to this booking → 400 | as expected | ✅ |
| G22 | Check in → 200 | as expected | ✅ |
| G22b | Booking is CHECKED_IN | as expected | ✅ |
| G23 | Used credential is no longer accepted | as expected | ✅ |
| G24 | Checkout request → 200 | as expected | ✅ |
| G25 | Booking is CHECKOUT_REQUESTED, not yet completed | as expected | ✅ |
| G27 | An EXIT QR code / OTP is issued (FR-VER-04) | '{"success":true,"data":{"id":"a13b7c2…' | ❌ |
| G28 | Check out → 200 | as expected | ✅ |
| G28b | Booking COMPLETED | as expected | ✅ |
| G29 | Second check-out is harmless (same COMPLETED booking or 409) | as expected | ✅ |
| G30 | Checkout (done twice) does not pay the Owner twice: total balance unchanged | as expected | ✅ |
| G30b | The 60 BDT earning stays PENDING during the dispute window (FR-FIN-02) | 6000 | ❌ |
| G31 | Suspend assignment → 200 | as expected | ✅ |
| G31b | Assignment SUSPENDED | as expected | ✅ |
| G32 | No Property 1 bookings while suspended | as expected | ✅ |
| G33 | Resume assignment → 200 | as expected | ✅ |
| G33b | Assignment ACTIVE | as expected | ✅ |
| G34 | Update shift → 200 | as expected | ✅ |
| G34b | Assignment returns to PENDING_ACCEPTANCE | 'ACTIVE' | ❌ |
| G35 | Owner calls the Admin suspend API → 403 | as expected | ✅ |
| G36 | End assignment → 204 | as expected | ✅ |
| G36b | Assignment ENDED | as expected | ✅ |

### TS-9 Reviews, disputes, finance, Admin, roles

| ID | Check (expected result) | Actual | Status |
|---|---|---|---|
| RV02 | Review with category ratings: security, location, cleanliness (FR-RVW-01) → 201 | HTTP 400 VALIDATION_ERROR | ❌ |
| RV01 | Review a completed booking → 201 (or 409 if RV02 already created it) | as expected | ✅ |
| RV03 | Second review of the same booking → 409 | as expected | ✅ |
| RV04 | Rating 0 → 400 | as expected | ✅ |
| RV05 | Rating 6 → 400 | as expected | ✅ |
| RV06 | Rating 4.5 → 400 | as expected | ✅ |
| RV07 | Review a booking that is not completed → 409 | as expected | ✅ |
| RV08 | Review another driver's booking → 404 | as expected | ✅ |
| RV09 | Owner lists reviews → 200 | as expected | ✅ |
| RV09b | The review of the completed booking is listed | as expected | ✅ |
| RV10 | Owner reply → 200 | as expected | ✅ |
| RV11 | Public page shows the review and the reply | as expected | ✅ |
| DS01 | Short description → 400 | as expected | ✅ |
| DS02 | Bad category → 400 | as expected | ✅ |
| DS03 | Open a dispute → 201 | as expected | ✅ |
| DS04 | Held balance grows by the 60 BDT earning | +0 | ❌ |
| DS05 | Owner lists disputes → 200 | as expected | ✅ |
| DS05b | Dispute listed | as expected | ✅ |
| DS06 | Other driver → 404 | as expected | ✅ |
| DS07 | Owner opens a dispute → 201 | as expected | ✅ |
| DS08 | Admin dispute list → 200 | as expected | ✅ |
| DS08b | Driver A's dispute is queued | as expected | ✅ |
| DS09 | Resolve dispute → 200 | as expected | ✅ |
| N01 | List notifications → 200 | as expected | ✅ |
| DS10 | A notification arrived after the dispute was resolved | as expected | ✅ |
| N02 | Read one → 200 | as expected | ✅ |
| N02b | Notification marked read | as expected | ✅ |
| N03 | Read all → 200 | as expected | ✅ |
| PO01 | Invalid mobile wallet number → 400 | as expected | ✅ |
| PO02 | Bank without bankName → 400 | as expected | ✅ |
| PO03 | Add bKash account → 201 | as expected | ✅ |
| PO04 | The number is masked in the response | as expected | ✅ |
| PO05 | A new account waits for Admin verification before use (FR-FIN-05) | 'ACTIVE' | ❌ |
| PO06 | Available balance + 1 paisa → 409 | as expected | ✅ |
| PO07 | Two succeed and the third is refused with 409 (no HTTP 500) | [ 201, 500, 500 ] | ❌ |
| PO07b | The balance is never over-spent | as expected | ✅ |
| PO08 | Approve payout → 200 | as expected | ✅ |
| PO09 | PAID without externalReference → 400 | as expected | ✅ |
| PO10 | Mark PAID → 200 | as expected | ✅ |
| PO10b | Payout is PAID | as expected | ✅ |
| PO11 | Reject payout → 200 | as expected | ✅ |
| PO11b | Available balance goes back up | as expected | ✅ |
| PO12 | Reconciliation report → 200 | as expected | ✅ |
| PO12b | Debits equal credits and no issues are reported | as expected | ✅ |
| PO13 | Admin ledger list → 200 | as expected | ✅ |
| AD01 | Suspend user → 200 | as expected | ✅ |
| AD02 | Suspended Driver B tries to log in → refused | as expected | ✅ |
| AD03 | Unsuspend user → 200 | as expected | ✅ |
| AD04 | Restored Driver B logs in → 200 | as expected | ✅ |
| AD05 | Block Guard → 200 | as expected | ✅ |
| AD05b | Blocked Guard tries to log in → refused | as expected | ✅ |
| AD06 | Unblock Guard → 200 | as expected | ✅ |
| AD06b | Unblocked Guard logs in → 200 | as expected | ✅ |
| AD07 | Create MANAGER → 201 | as expected | ✅ |
| AD11 | Audit events → 200 | as expected | ✅ |
| AD12 | Dashboard summary → 200 | as expected | ✅ |
| AD13 | Users → 200 | as expected | ✅ |
| AD08 | Create ADMIN → 400 | as expected | ✅ |
| AD09 | Property 2 → INACTIVE → 200 | as expected | ✅ |
| AD09b | Property 2 hidden | as expected | ✅ |
| AD10 | Property 2 → ACTIVE → 200 | as expected | ✅ |
| AD10b | Property 2 shown again after re-activation (FR-ADM-02) | false | ❌ |
| RB01 | Driver on the Admin user list → 403 | as expected | ✅ |
| RB02 | Driver on owner listings → 403 | as expected | ✅ |
| RB03 | Owner on Guard bookings → 403 | as expected | ✅ |
| RB04 | Owner on the Admin dashboard → 403 | as expected | ✅ |
| RB05 | Manager on the Admin user list → 403 | as expected | ✅ |
| RB06 | Manager places a hold → 403 | as expected | ✅ |
| RB07 | Guard on owner listings → 403 | as expected | ✅ |
| RB08 | Guard on the vehicle API → 403 | as expected | ✅ |
| RB09 | Guard on the Admin user list → 403 | as expected | ✅ |
| RB10 | Driver on Guard bookings → 403 | as expected | ✅ |
| PC01 | Temporary closure → 200 | as expected | ✅ |
| PC01b | Property 1 hidden | as expected | ✅ |
| PC02 | Reopen → 200 | as expected | ✅ |
| PC02b | Property 1 shown | as expected | ✅ |
| PC03 | Block a space with a confirmed booking → 200 | as expected | ✅ |
| PC05 | The response warns and lists the affected booking (FR-BKG-09) | '{"success":true,"data":{"id":"088538f…' | ❌ |
| PC04 | Booking is not cancelled by the block | as expected | ✅ |

---

# Part 3: Test Results

## 3.1 Execution summary

| Module | Tests | Pass | Fail |
|---|---:|---:|---:|
| TS-2 Accounts & authentication | 95 | 95 | 0 |
| TS-3 Owner properties & Admin verification | 60 | 58 | 2 |
| TS-4 Parking spaces, rights & listings | 92 | 92 | 0 |
| TS-5 Search & suggestions | 52 | 46 | 6 |
| TS-6 Driver vehicles, booking & payment | 69 | 64 | 5 |
| TS-7 Manager | 60 | 53 | 7 |
| TS-8 Guard | 48 | 45 | 3 |
| TS-9 Reviews, disputes, finance, Admin, roles | 79 | 73 | 6 |
| **System test total** | **555** | **526 (95%)** | **29** |
| TS-1 Build & static checks | 11 | 5 | 6 |
| TS-1 Unit tests | 94 | 94 | 0 |
| TS-1 Integration tests | 40 | 38 | 2 |



## 3.2 Defects

Severity: **High** = money, privacy, a core flow or the build is wrong · **Medium** = an SRS requirement is not met but there is a workaround · **Low** = minor.

| # | Sev | Defect | Test | Requirement |
|---|---|---|---|---|
| D1 | High | Migration `20260919090000_restrict_supabase_data_api` **fails on any PostgreSQL that is not Supabase**: it revokes privileges from the roles `anon` and `authenticated`, which do not exist elsewhere, so `prisma migrate deploy` stops with `role "anon" does not exist`. This blocks a fresh local setup and the CI job, which migrates a plain `postgres:18-alpine`. | BLD-01 | – |
| D2 | High | A driver who cancels a paid booking gets **no refund**. The payment stays CAPTURED and no refund record is created. | B34 | FR-BKG-07, FR-PAY-04 |
| D3 | High | A driver with a confirmed booking **cannot see the exact address or the access instructions**; only the approximate address is returned. | B22 | FR-PROP-02 |
| D4 | High | Managers see **payment amounts** on bookings, and see **owner earnings** once EARNINGS_VIEW is granted. | M29, M42 | FR-MGR-10, FR-MGR-12 |
| D5 | High | Paying for a booking whose listing has **no security deposit fails with HTTP 500**. The API writes a zero-amount ledger entry, which the database rejects (`ledger_entry_amount_positive`). The booking stays unpaid. | B30 | FR-PAY-03 |
| D6 | Medium | The seeded demo bays A-01, B-02 and C-03 never appear in search, although they are ACTIVE with ACTIVE listings. The demo shared pool does appear. | S09–S11 | FR-SRCH-01 |
| D7 | Medium | Vehicle height is not checked against the space's limit: a 230 cm SUV is quoted for a 220 cm bay. | B04 | FR-VEH-04 |
| D8 | Medium | Owner earnings become available at checkout instead of staying pending for the dispute window, and opening a dispute does not put them on hold. | G30b, DS04 | FR-FIN-02, FR-RVW-03 |
| D9 | Medium | A payout account can be used immediately; it is ACTIVE without any Admin verification. | PO05 | FR-FIN-05 |
| D10 | Medium | Simultaneous payout requests return **HTTP 500** instead of 409. Only one succeeded, so the balance was not overspent, but the failure is unhandled. | PO07 | FR-FIN-06 |
| D11 | Medium | Re-activating a Property does not bring its listings back: the Property stays out of search after the Admin sets it ACTIVE again. | AD10b | FR-ADM-02 |
| D12 | Medium | Public search returns the **exact** Property coordinates instead of approximate ones. | S29 | FR-SRCH-04 |
| D13 | Medium | There is no shared-building flag on a Property, so the Building-Manager approval path cannot happen. | PF14 | FR-PROP-03, FR-PROP-04 |
| D14 | Medium | No EXIT QR code or OTP is issued when the driver requests checkout. | G27 | FR-VER-04 |
| D15 | Medium | Changing a Guard's shift leaves the assignment ACTIVE; the Guard never re-accepts the new terms. | G34b | FR-GRD-05 |
| D16 | Medium | A linked Manager cannot add spaces to the property or create Guard accounts. | M27, M38 | FR-MGR-09, FR-GRD-01 |
| D17 | Low | Renaming a verified Property sends it back to PENDING and takes it offline, although the SRS lists only address, coordinates and images as re-verification triggers. | P36b | FR-PROP-07 |
| D18 | Low | No notifications are sent when a Manager link is created, accepted or ended. | M19, M46 | FR-MGR-15 |
| D19 | Low | A Manager link cannot be suspended or resumed, only ended; there is no such endpoint. | M47 | FR-MGR-06 |
| D20 | Low | Search has no sorting and no pagination; `sort`, `page` and `limit` are rejected as unknown query fields. | S30, S31 | FR-SRCH-03, FR-SRCH-06 |
| D21 | Low | Blocking a space that has a confirmed booking gives no warning and does not list the affected bookings (the booking itself is correctly kept). | PC05 | FR-BKG-09 |
| D22 | Low | A review carries a single rating; security, location accuracy and cleanliness ratings are rejected. | RV02 | FR-RVW-01 |

Two further failures come from the project's own integration suite (BLD-08): a write conflict when two holds race, and a concurrency test defeated by the Admin rate limiter. Both are described under TS-1.

## 3.3 Requirements not implemented (not executed)

FR-PAY-01, FR-PAY-02, FR-PAY-05, FR-PAY-06 (real payment provider; capture is simulated) · FR-RT-01 to FR-RT-04 (realtime updates) · FR-VER-07 (overtime) · FR-VER-08 (incident reports) · FR-VER-09 (numeric OTP) · FR-BKG-08 (booking extension) · FR-ADM-05 (building-approval waiver).

## 3.4 How to reproduce

```bash
cd backend
npm run db:up                                   # PostgreSQL + Redis
docker start parkease-mailpit                   # or the docker run in docs/testing/postman/README.md
npx prisma migrate deploy                       # see 1.3 if this stops on the Supabase migration (D1)
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev      # API, accepting Mailpit's self-signed certificate
node scripts/qa/run-postman-tests.mjs --with-slow
```

The run writes `postman-run.log` (full console output) and `postman-results.json` (one row per assertion) to `docs/testing/evidence/postman/`. The automated suites are reproduced with `npm test`, `npm run test:integration`, `npm run format:check`, `npm run typecheck`, `npm run build`, `npm run lint` and `npm audit --audit-level=high`; their logs are in `docs/testing/evidence/`.
