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

The system tests are automated and repeatable: `node backend/scripts/qa/run-postman-tests.mjs` runs the 19 regular folders, `--with-slow` adds the 20th folder (`09 Hold expiry`, test H01, about 6 minutes), and both write the raw results to `docs/testing/evidence/postman/`. The same collection can be run by hand in the Postman app; [`docs/testing/postman/README.md`](postman/README.md) explains both.

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

## 3.5 TS-3 through TS-9 remediation (2026-10-03)

The results above describe the original test run, not a fresh acceptance run. TS-1 is outside this remediation scope. The fixes below address D2-D22, including hardening of earlier patches.

| Scope | Implemented changes |
|---|---|
| Properties and listings (D11, D13, D17) | Shared-building governance, name-only edits without re-verification, and restoration of listings suspended specifically by a property suspension. Independently suspended listings stay suspended. |
| Search and vehicles (D6, D7, D12, D20) | Physical-unit creation/backfill, height validation, approximate public coordinates and distances, sorting and pagination without premature query truncation. |
| Booking and payment (D2, D3, D5) | Policy-based cancellation credits and refund history, confirmed-booking access details, and positive-only ledger entries for zero-deposit payments. Arbitrary refunds require Admin authorization; already-distributed funds cannot be refunded twice. Real gateway payments cannot use simulated refunds. |
| Managers (D4, D16, D18, D19) | Operational booking responses strip financial data while preserving dates. Resource/guard creation requires explicit delegated permissions. Delegation notifications and suspend/resume controls are connected. |
| Guard and blocking (D14, D15, D21) | Expiring exit credentials, server verification and checkout validation, driver pass refresh, guard scanner/manual checkout, shift re-acceptance, and affected-booking warnings, including overdue live sessions. |
| Finance and reviews (D8-D10, D22) | Provider earnings remain pending during the dispute window. Disputes hold the exact booking earnings, including disputes opened before checkout. Resolution/rejection releases the tracked amount safely. Payout methods require review; payout retries and concurrency are protected. Category ratings are supported. |

### Verification completed

- Backend unit suite: **117 tests passed**.
- Backend TypeScript checks and production compilation: passed.
- Frontend TypeScript, full lint and production build: passed; 123 routes generated.
- Prisma schema validation and client generation: passed.
- Integration fixtures and Postman collection updated for explicit manager permissions, payout verification, exit credentials, wallet cancellation credits and dispute-window behavior.

### Acceptance checks still required

Database integration tests and the full TS-3 through TS-9 Postman run were **not executed**: Docker Desktop was stopped and no isolated local test database/API was running. Browser-level interaction checks were also not performed. No hosted database was used or changed for verification. These fixes must not be interpreted as a new 100% system-test pass rate.

Apply the migrations and generate the client before starting the updated API. Then run the integration/Postman suites against an isolated test database, not the hosted production database. Review historical open disputes and legacy independently/property-suspended listings during rollout; new tracking fields cannot reliably infer every previous financial hold or suspension reason.

## 3.6 Live Supabase and Vercel audit (2026-10-03)

This audit used the configured Supabase project `bebycrnbtkstwzwnlrur` in Singapore and the live Vercel API. Docker was not used. SQL inspection was read-only; no live user, booking, payment, wallet, or migration data was changed. Counts are a point-in-time snapshot, not an end-to-end acceptance run.

### Checks passed

| Check | Live result |
|---|---|
| Supabase project | ACTIVE_HEALTHY |
| API liveness/readiness | Both HTTP 200; PostgreSQL and Redis ready |
| Parking browse | HTTP 200; 3 properties |
| Future-period parking search | HTTP 200; 1 matching property for the sampled Sedan query |
| Anonymous Admin payments access | HTTP 401 AUTH_REQUIRED |
| Ledger transactions | No unbalanced transactions or nonpositive entries |
| Wallet balances | No negative available, pending, or held balances |
| Booking totals | No component-total mismatches across 12 bookings |
| Cancellation/deposit arithmetic | No cancellation-credit or deposit-settlement component mismatches |
| Booking lifecycle snapshot | No overdue CONFIRMED bookings, expired PAYMENT_PENDING bookings, or COMPLETED bookings missing settlements |
| Listing eligibility | 3 active listings; no invalid property/resource/right parent status in the sampled SQL check |
| Fixed resources | No undeleted fixed resource missing physical units |
| Payments/email records | 11 SUCCEEDED payment records; 3 SENT email-delivery records. Records do not prove inbox delivery or a fresh gateway transaction. |
| Public database roles | No public tables readable by `anon` or `authenticated` |

### Outstanding live findings

1. **Public coordinate privacy is not deployed.** All 3 properties returned by live browse exposed coordinates identical to stored coordinates. Stored coordinates are not aligned to the neighbourhood grid used by the local privacy helper. Redeploy the corrected API and repeat the comparison; healthy probes alone do not establish that current source is deployed.
2. **One wallet projection differs by BDT 400.** Its stored balance is BDT 398 while wallet-linked ledger entries net to BDT -2. The visible entries are a BDT 72 booking debit and BDT 70 cancellation credit. The origin of the BDT 400 opening difference needs transaction-history reconciliation. Do not remove the balance or invent a credit merely to make the totals match.
3. **Eight historical completed settlements have no provider release marker.** Their provider wallets currently have zero pending balance, so these are not automatically evidence of unpaid earnings. Available balances are already present. The new release guard correctly refuses to credit them again without pending funds. Confirm historical credits, then repair metadata with an audited forward migration rather than transferring money again.
4. **Migration history differs from local files.** `20261003120100_backfill_missing_fixed_units` is pending, although live resources already have units. Applied migrations `20260919090000_restrict_supabase_data_api` and `20261003090100_resolve_system_test_t2_findings` have actual content differences. Another 13 checksum differences are explained by LF/CRLF conversion. There are no unfinished migrations. Do not reset the live database or rewrite stored migration checksums to hide drift.
5. **Four financial tables lack RLS:** `payment_attempts`, `wallet_holds`, `booking_settlements`, and `booking_cancellations`. Public SELECT grants are absent, so this audit did not find current direct public table access. Add reviewed defense-in-depth RLS before granting Data API access. Existing no-policy RLS notices on backend-only tables do not justify opening them to clients.
6. **Advisor maintenance findings remain.** Two extensions are in `public`; performance advisors report 45 unindexed foreign keys, 46 unused-index notices, and two policy warnings. These require workload-specific review, not blanket index deletion or extension moves.

### Coverage limits and next verification

No new live booking, payment, cancellation, withdrawal, email, property approval, or guard checkout was triggered. Full role-based UI and payment acceptance testing needs explicitly designated test accounts and sandbox transactions; production integration suites must not be pointed at this live database because their fixture cleanup can delete records. Fix/deploy privacy first, reconcile the financial history, and use an isolated Supabase test project for destructive acceptance tests. Docker is not required for that setup.

Advisor references: [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security), [extension placement](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public), [foreign-key indexing](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

## 3.7 Live remediation and further verification (2026-10-03)

The findings in section 3.6 are retained as the original audit snapshot. Subsequent owner-authorized remediation applied reviewed forward migrations and deployed both Vercel projects; Docker was not used.

- The owner confirmed the BDT 400 opening difference was demo/test money. A balanced, explicitly labelled opening ledger transaction reconciled it without changing the wallet's BDT 398 stored balance or claiming gateway funds/platform revenue.
- Eight legacy provider release markers were repaired only where matching posted provider earnings, zero pending funds and no open dispute were verified. No second earnings credit was created.
- Original applied migration contents were restored against their recorded checksums; LF normalization resolved line-ending drift. All 43 migrations were applied without rewriting stored migration checksums or resetting the database.
- RLS and public-role restrictions were applied to the four financial tables. Relocatable extensions moved to the extensions schema; role policies were hardened without granting public table access.
- Post-remediation SQL checks found zero wallet projection mismatches, unbalanced ledger transactions, unmarked historical completed settlements and public tables without RLS. Security/performance advisor warnings were cleared; informational no-policy notices and workload-dependent index advice remain.
- Production API readiness returned HTTP 200 with PostgreSQL and Redis healthy. Browse returned three properties with neighbourhood-grid coordinates and zero exact stored-coordinate matches. Anonymous Admin payments access returned HTTP 401.
- Backend unit tests passed (117); frontend/backend production builds passed. These checks do not replace financial acceptance tests.

### Additional frontend findings and regression coverage

Public View offers navigation was observed to reach Green View House's detail page with the requested period preserved; the initial immediate observation preceded navigation completion. This was not a confirmed broken navigation link.

Further source review found that changing a period during an existing quote/hold could leave checkout using the previous quote. The selector now locks during quote creation and while a quote, hold or booking exists; discarding a quote or releasing a hold unlocks it. Quoting is disabled while availability refreshes. Guest vehicle fetching is now gated by an authenticated Driver account to avoid triggering auth-expiry/cache-clear cycles from optional public checkout data. Invalid/reversed date parameters are rejected before rendering date formatting controls. The incorrect Provider Portal default browser title was replaced with a platform-wide title.

The former frontend test command only printed a success message. It now executes three real regression tests for invalid periods, timezone comparisons and checkout locking, and CI runs them. All three passed; frontend lint, type checks and production compilation passed during this remediation. These are helper-level tests, not browser or financial acceptance coverage.

Frontend deployment `dpl_3JRCock4ZdzgNPc5y7WwaFuAPjkD` reached READY and was aliased to `https://parkease-bd.vercel.app`. Browser checks on that deployment confirmed the guest Driver sign-in prompt, gallery open/next/close interactions, a date change updating the detail URL, and malformed date parameters showing a return-to-search state without a date-formatting crash. No console errors or warnings were captured in the sampled valid-detail run. Authenticated quote/hold locking still needs account-based browser acceptance tests.

### Remaining acceptance scope

Fresh sandbox payment, split wallet/gateway retry, cancellation, checkout/overtime settlement, withdrawal approval, and complete Provider/Manager/Guard/Admin interaction runs are still unverified end to end. Designated test accounts and an isolated Supabase test project are required before running destructive fixture suites. No claim of a fully bug-free project or a new 100% system-test pass rate is made.

### Authorized role-based follow-up and additional defects

The owner supplied existing Admin, Provider, Driver, Guard and Manager test accounts. Passwords are not recorded here. All five logins were exercised successfully; one Manager login initially failed with a generic error and succeeded on retry. An Admin earnings request also timed out once and succeeded after reload. The underlying intermittent latency has not been established, so these remain reliability observations rather than resolved findings.

- Driver checkout produced the expected BDT 36 parking charge, BDT 3.60 platform fee and BDT 400 deposit. Date/time controls locked after quoting. A temporary parking hold was created and explicitly released; controls unlocked afterward. No booking payment or withdrawal was executed.
- Provider earnings displayed BDT 108 available, zero awaiting settlement, and individual settlement activity without a second pending credit. Provider mobile sign-out worked. A desktop sign-out control was added using the existing logout component.
- Guard overview and its assigned Green View House scope loaded. A fabricated credential was rejected as invalid, used or expired. No physical check-in or checkout was recorded.
- Manager dashboard and resources loaded one delegated property and its ten physical units. Manager profile sign-out incorrectly navigated to nonexistent `/sign-in` and showed 404; it now uses the shared logout component. Other Manager profile controls still contain placeholder behavior: personal-information saving does not persist to the API, and photo/password actions require a separate completion pass.
- Admin earnings exposed a financial classification defect: Driver withdrawals had debited Provider payable. New payout accounting chooses the wallet's actual Provider/Driver liability sources and rejects insufficient ledger-backed amounts. Three allocation regression cases were added.
- Forward migration `20261003140000_reclassify_driver_withdrawal_liabilities` applied guarded, balanced reclassification entries for two verified historical Driver withdrawals totalling BDT 500. Original entries, wallet balances and external transfers were not modified. All 44 migrations were applied; SQL found zero wallet projection mismatches and zero unbalanced transactions.
- After the correction, the live Admin earnings UI showed BDT 343 Provider payable matching Provider wallets, BDT 847 Driver refund liability matching Driver wallets, and BDT 38.30 platform revenue. Captured gateway total was BDT 1,400.30 and booking funds held BDT 72 at observation time.
- Production logs exposed Vercel internal OIDC/signature headers. Redaction now covers OIDC, proxy signatures, deployment-protection bypass headers and the signed forwarded header. The logger regression test verifies that these secrets are absent. API deployment `dpl_2Mp9WPCJJB9fskBFeKCyhVcGavRW` reached READY.

Backend `npm test` passed 120 tests; frontend type checking and lint passed after the Manager logout change. Frontend helper tests passed three cases earlier in this run. Authenticated smoke checks are not substitutes for isolated integration tests, concurrent financial operations, actual sandbox gateway callbacks or inbox delivery verification. The project is not certified bug-free.

Frontend deployment `dpl_98wSKjCV9TBGwJ7RwxajN2FyNufq` reached READY with 123 routes built and includes the Manager logout fix. Both production aliases were updated without a Git push.

Post-deployment Manager browser verification confirmed Sign Out reaches `/login` with the sign-in form, not 404. The temporary viewport override was cleared, and test accounts were signed out.

### Profile completion and bounded serverless startup

The Manager profile placeholder finding above prompted a scoped self-profile endpoint. `PATCH /users/me/profile` accepts only a trimmed, validated full name for the authenticated active, verified account. Protected identity, verification and authorization fields are rejected. Manager and Driver name forms now save through that endpoint with pending, error and unchanged-value states. Unsupported Manager photo/city controls were removed; password and active-session links use the existing account-security views rather than success-message placeholders.

Server startup now bounds PostgreSQL connection acquisition and Redis connection attempts, shares in-flight Redis connection work, and initializes the independent dependencies concurrently. Database initialization failures return a generic HTTP 503 envelope with a request ID; initialization logs exclude raw connection error messages and credentials. These changes harden failure handling but do not establish the root cause or resolution of the earlier intermittent timeouts. Redis-dependent security checks remain fail-closed.

Backend `npm test` passed 130 tests, including profile validation, protected-field rejection, initialization error privacy, public-data privacy and provider-earnings coverage. Frontend lint and frontend/backend type checks passed. API deployment `dpl_Cp27ASfcRw5UZ7PGSJJhw3fU1C8Z` reached READY. A production readiness probe returned HTTP 200 with both dependencies healthy in approximately 1.34 seconds; this is one sample, not a reliability benchmark.

Frontend deployment `dpl_46brqCB3djcZJ4JhBjc5mhUzvmLf` reached READY after production compilation, type checking and static page generation. On the production alias, the authorized Manager signed in, saved a temporary name, and saw that name after reload. The original name was then saved back and verified after another reload. The real account-security page loaded through Change Password; no password was changed and no financial transaction was triggered.

The Manager active-session page also returned signed-in devices and identified the current session. No other device was revoked. Full fresh sandbox payment, cancellation, overtime checkout and withdrawal acceptance coverage remains outstanding.

### Gateway session and callback race review

Source review found that a different request key could reset a still-preparing booking payment immediately, and asynchronous session-creation responses/error cleanup could overwrite a concurrently cancelled or replaced attempt. Failure/cancel callbacks checked terminal status before acquiring their lock, allowing a payment captured during that wait to be overwritten.

Booking preparation now waits for the existing preparation TTL rather than treating a new request key as expiration. Session completion/error cleanup for booking and overtime payment re-read the merchant attempt and CREATED status after booking/payment locks. Session completion also verifies the booking is still awaiting that payment. Exit callbacks use the locked current attempt and leave succeeded, refunded, terminal or replaced attempts untouched.

Seven isolated regression cases cover lock-before-read ordering, terminal states, stale merchant attempts, session ownership and missing/mismatched payments. Two exercise the actual exit handler with database test doubles: capture during lock wait and attempt replacement both cause no update or wallet release. No live financial transaction or destructive database fixture was used. Backend `npm test` passed 137 tests and type checking passed. This is targeted concurrency regression coverage, not proof of the full gateway lifecycle under real concurrent PostgreSQL transactions.

API production deployment `dpl_5Q4qeeH69X3eu1g2iQAT8XugdBwP` reached READY with production compilation passing and was aliased to `https://parkease-api.vercel.app`. The post-deployment readiness probe returned HTTP 200 with PostgreSQL and Redis healthy. No frontend changes or database migration were required for this race-condition fix. Real sandbox lifecycle and database concurrency acceptance tests remain outstanding.

### Successful capture identity and wallet-only confirmation

Further review found gateway success validation compared amount/currency before locking, but did not repeat identity/funding checks against the locked payment. A concurrent retry could therefore replace the attempt between validation and capture. Booking and overtime settlement capture now verify merchant transaction ID, gateway provider, exact integer-paisa amount and currency against the locked record before idempotent return or posting funds.

Wallet-only booking confirmation now takes the booking lock before the payment lock and requires a CREATED payment, a PAYMENT_PENDING booking and a future start time. Failure cleanup only owns the matching still-CREATED internal-wallet attempt; it cannot downgrade a concurrently completed/cancelled/replaced payment. Overtime finalization uses the same booking-before-payment lock order and verifies the booking identity and wallet-only funding source.

Eight additional regression cases passed: exact identity/funding validation; actual booking and overtime success handlers with replaced merchant attempts or changed amounts; and actual wallet-only confirmation with cancelled booking, cancelled payment or past start time. Gateway responses, database transactions and credentials were test doubles; no network payment or live balance mutation occurred. All 145 backend unit tests and type checking passed. These tests prove the sampled rejection paths, not a complete real gateway/checkout acceptance run.

Production API deployment `dpl_GTQ6xG22gSyncJhiGJX1aTY7gj2o` reached READY after compilation and updated the production alias. Its readiness probe returned HTTP 200 with PostgreSQL and Redis healthy. No schema migration or frontend deployment was needed for this capture-integrity change.

### Property edit correctness and live acceptance follow-up

Source review found that full-form updates classified unchanged location fields as critical changes, potentially returning verified properties to review during ordinary rules edits. Change detection now compares normalized persisted values, including decrypted private fields and numeric coordinates. The frontend sends only changed fields and retains the original version and unsaved draft across background refreshes. Clearing optional fields sends explicit null values; unchanged forms cannot be submitted and controls are disabled during saving.

Live Provider verification on the authorized Green View House test property confirmed a rules-only edit persisted, optional parking rules could be cleared, and the property remained ACTIVE and VERIFIED with its listing live. The original rules were restored and the final save displayed success. No private address, location, authority, financial balance or approval was changed by these tests.

The textarea accepted line breaks but backend validation rejected them. Access instructions and parking/safety rules now accept LF/CR line breaks while still rejecting unsafe control characters; identity/address fields retain single-line validation. Multiline rules persisted during live testing, but one save displayed a generic client error despite persistence. An earlier failed-response retry correctly rejected the stale version. Full-page navigation also returned to login in the verification browser. These intermittent response/session observations remain open; passing tests do not establish their cause or resolution.

Response-context queries and DTO construction for property updates now execute inside the mutation transaction, so their failure cannot occur after a successful commit. A regression test exercises the actual update service with transaction doubles and verifies response-context failure prevents commit. This removes an identified post-commit failure path, but does not prove that path caused the observed live generic error.

Backend test execution reported 165 passing cases and zero failures on the current worktree; the payment-attempt suite is included both directly and through the booking-finance suite, so this count is not 165 distinct scenarios. Backend type checking passed. Frontend helper tests passed seven cases, lint and type checking passed, and production compilation generated 123 routes. API deployment `dpl_DD55GPuNjc1RhM6JbMFZoDFvzZmu` and frontend deployment `dpl_8fZQhWHoJS27GB7hJ3WcR1wGkguY` reached READY. The latest API readiness probe returned HTTP 200 with PostgreSQL and Redis healthy. No database migration was required.

Further acceptance remains necessary for intermittent save/session behavior, the contradictory onboarding "add parking" prompt on a property whose parking-readiness section is complete, and full isolated financial gateway/concurrency lifecycles. The project is not certified bug-free.

### Session recovery, save feedback and onboarding acceptance

Session recovery previously skipped refresh for the current-user request and treated transient request errors as authentication failures. Current-user requests now permit refresh; only an actual HTTP 401 authentication refusal redirects to sign-in. Refresh requests have a bounded deadline, share in-flight work, and preserve credentials on network failures, timeouts, rate limits, server failures and malformed successful responses. Protected views remain closed while session verification fails and provide a retry action.

Property-edit success updates the saved draft and feedback independently of background cache refresh. A failed background refresh cannot turn an acknowledged save into a failed mutation or discard the draft. Onboarding now derives parking/publishing progress from the property's resources and active listings, with explicit unknown/error states instead of reporting missing inventory before it loads.

Frontend tests passed 22 cases with zero failures, including actual API-client refresh behavior using mocked fetch responses, shared refresh, authentication rejection, timeout recovery, property patches, checkout periods and onboarding progress. Frontend lint and type checking passed. Production deployment `dpl_ECHCQ373ZCvXpkkSL44rjLHsq3XN` reached READY, compiled successfully, generated 123 routes and updated `https://parkease-bd.vercel.app`.

Post-deployment browser verification with the authorized Provider account confirmed that a full property-page reload retained the session, onboarding displayed "Listing is live", and a temporary multiline parking-rules edit displayed successful save feedback. Another full reload retained both the session and saved rules. The original rules were restored with successful feedback and verified on the detail page; the property remained ACTIVE and VERIFIED with its live listing. No payment, withdrawal, private-address change, coordinate change or approval change was performed. The prior intermittent save error and unexpected sign-out were not reproduced in this sample; this does not establish long-term reliability.

The property detail/edit browser titles still contain an unrelated hard-coded sample property name and require a scoped metadata correction. The first sign-out attempt returned to an enabled button without leaving the protected page; retry reached the sign-in form. Its first failure response was not captured, so intermittent sign-out reliability remains open. The verification account was signed out before stopping. Full sandbox financial lifecycle, isolated PostgreSQL concurrency acceptance and frontend token-storage security review remain outstanding. These results are not a project-wide bug-free certification.

### Local browser-first audit - October 3, 2026

At the user's request, this audit used `http://localhost:3000`, not the production frontend. The browser walkthrough preceded this round's code changes. Authorized Driver, Provider, Manager, Guard and Admin accounts were exercised. Local API payment-search behavior changed after the backend edit without a deployment, confirming that this verification was using the local API. The configured database can still be shared/live; localhost does not imply disposable financial data.

| Area | Browser checks and result |
| --- | --- |
| Authentication | All five role sign-ins and sampled sign-outs worked. No password, role or permission grant was changed. |
| Public search | Default all-parking browse returned two properties and price markers. A 5 km filtered search correctly excluded properties shown approximately 8 km away. Homepage date/start-time navigation and past-arrival validation were rechecked after correction. |
| Property detail | Photo modal navigation/close worked. Changing the day and arrival updated the URL, reservation summary and availability. The October 4 afternoon period showed nine spaces, reflecting the existing booking. No new render warning appeared in the recheck. |
| Driver quote | A server quote showed parking, platform fee, deposit and total. The quote locked the period/vehicle; discarding it unlocked editing. No booking hold or gateway payment was created. |
| Driver finance | Historical no-show settlement and returned deposit were visible. Terminal bookings had no cancellation action. Wallet remained 234 BDT available, with over-balance/zero withdrawals disabled. Internal balance reclassification now appears once with no net change. |
| Provider | Existing property/resource/listing readiness, earnings and payout validation were inspected. Available 108 BDT and awaiting-settlement 36 BDT relate to different booking states, not duplicate available income. |
| Property creation | Synthetic property creation accepted multiline rules. Pending/inactive property could not create parking resources. The Admin queue exposed missing-image approval prerequisites. Approval confirmation was cancelled. |
| Admin finance | Booking-code payment search originally returned a server error; after correction it returned the matching successful payment. Captured funds, held funds, platform revenue, provider payables and driver refunds were inspected without changing balances. |
| Manager | Property summary, booking manifest, permissions, schedules and guard assignment were inspected. Rechecks showed ten physical units, one current reservation, restricted financial values and correctly populated 08:00-22:00 time fields. Reports remain disabled without REPORTS_VIEW. |
| Guard | Scanner remains opt-in. Invalid credentials were rejected and incomplete credentials could not be submitted. Camera permission and real check-in/check-out were not exercised. |

Confirmed defects corrected in this round:

- Payment search no longer passes a booking code/email into a PostgreSQL UUID comparison. Exact UUID ID search remains supported.
- Property date/time navigation no longer updates the Router from inside a React state updater.
- Homepage search uses the startTime/endTime contract, reads submitted fields, and rejects past arrivals; search also accepts the legacy time parameter.
- Manager capacity counts physical units, not resource groups. Occupancy/current reservations/today's records derive from actual statuses and Dhaka dates instead of fixed vacancy or historical totals.
- Financial values redacted for Managers display Restricted, not NaN or invented zero. Backend authorization/redaction remains intact.
- Schedule display/editor extracts the intended clock time rather than rendering a 1970 timestamp or blank native time input.
- Manager facility, gate, hours, assignment and permission displays no longer assert the sampled hard-coded facts. Report actions respect the permission boundary.
- Provider property titles no longer identify an unrelated sample building/location.
- Settled Driver bookings show settlement-complete feedback rather than describing money as still awaiting settlement.
- Driver wallet activity groups debit/credit entries within one transaction using exact integer amounts. This changes presentation only, not ledger entries or balances.
- Admin search input is keyed to its current search to prevent uncontrolled default-value warnings.

Validation: frontend lint and frontend/backend type checking passed. Frontend tests passed 28 cases. The existing backend unit command reported 165 passing executions (including the previously documented duplicate inclusion); the focused Admin suite passed six cases, including two new payment-search regressions. No production build was run against the active development output, no migration was applied, and nothing was deployed in this round.

Test side effect: property `7ab5e404-a6a4-4805-89e4-8d3c3ebea0a1`, named **QA Local Browser Audit - Do Not Book**, remains pending/inactive with synthetic address/rules, no images, parking resources, commercial rights, listings or bookings. It was not approved or deleted.

Remaining coverage and observations: this is not every possible action or a bug-free certification. New gateway capture/callback, cancellation refund, overtime checkout, wallet-only/split payment, withdrawal transfer and concurrent PostgreSQL lifecycle acceptance require controlled financial fixtures and user handoff for consequential browser actions. Every admin form and multi-window availability editing still need acceptance coverage. Homepage sample spot counts/rates and fixed marketing claims remain static, not verified live inventory. Occasional mouse activation in the verification browser did not change state while keyboard activation worked; its cause was not established. Prior intermittent production session reliability and frontend token-storage security review remain outside this local sample. No existing user's money was transferred or balance manually changed.

### Local schedule and search follow-up - October 3, 2026

Browser testing reproduced an unsuccessful Manager schedule save. The editor submitted a full timestamp for a date-only API field and retained only one window per weekday. The replacement editor preserves every active window and its original validity dates, supports additional windows, validates closing times and displays save errors. Backend validation rejects reversed validity dates while retaining inclusive same-day validity.

Local browser acceptance confirmed that invalid closing times are rejected before saving, cancelling discards draft additions, and reopening restores the original seven windows. Saving the original 08:00-22:00 schedule succeeded; a full reload retained the session, hours and original September 25 validity date. The existing replacement API recreates schedule rule records, but this test did not change their effective hours or dates. New multi-window and expiry payloads have unit coverage; publishing a changed multi-window schedule was not exercised against the shared database. The editor was also checked at a 390-pixel mobile viewport without horizontal overflow.

Homepage and search now share future Dhaka-time defaults. The earliest selectable date remains today's Dhaka date even when the suggested period is tomorrow. Browser submission of October 4 at 10:00 produced the expected date, startTime=10:00 and endTime=13:00 query and populated search controls. Neighbourhood cards no longer invent spot counts or average prices. Public workflow copy now describes offer-specific overtime/grace rules, access credentials and reviewed withdrawals rather than universal fixed values or instant payouts. Homepage copy was inspected after the changes; other policy surfaces still require comprehensive acceptance. Illustrative marketing prices elsewhere are not verified inventory.

Validation: frontend tests passed 32 cases; frontend lint and type checking passed. Backend unit tests reported 168 passing executions, including the existing duplicate suite inclusion; backend type checking passed. Payment-search regressions are now included in the main backend test command. No production build, deployment, migration, payment or withdrawal was performed in this follow-up. Financial lifecycle/concurrency acceptance and the remaining coverage listed above are still outstanding.

### Local authentication accessibility follow-up

The registration page exposed an unnamed password-visibility button, and both login and registration excluded their visibility controls from keyboard tab navigation. The registration control now has an explicit accessible name; both controls expose their toggle state, tooltip and normal keyboard focus. Browser acceptance on localhost confirmed Tab from the password field reaches the control, Enter changes visibility, and another Enter hides it again. Registration's toggle changes both password and confirmation fields as intended. No credentials were entered, account created or consent accepted during this check. Frontend lint and type checking passed after the scoped changes. These accessibility checks do not replace the remaining authentication/security and financial acceptance coverage.

### Financial calculation boundary follow-up

The exported cancellation and settlement calculators did not reject negative monetary inputs. Overtime could also return zero inside grace without validating an invalid policy or date. These helpers now reject negative money, invalid dates, negative/fractional/non-finite grace periods and invalid multipliers before calculating. Valid configured policies and the existing allocation/refund rules are unchanged.

Regression tests exercise each negative cancellation/settlement input, invalid overtime policies inside grace, and 96 deposit/overtime/wallet combinations. They verify deposit conservation, overtime funding plus outstanding debt, provider/refund/platform allocation conservation and non-negative results. The backend unit command passed 153 executions with no failures and backend type checking passed. This count is lower than the previous 168 because two test-file imports that duplicated explicitly scheduled suites were removed; three new tests were added and the separately scheduled suites remain in npm test. The initial sandbox invocation failed before execution with a Windows account-lookup error; the approved isolated unit run succeeded outside that sandbox. No shared database, gateway or financial balance was mutated.

Integration setup review confirmed that marketplace acceptance creates and cleans up database fixtures. A disposable test database has been requested before running that suite. Unit-level arithmetic and mocked payment tests are not proof of real PostgreSQL concurrency or full gateway lifecycle correctness; those acceptance gates remain open.

### Local CI gate verification

Running the actual backend formatting gate found four unformatted files: the payment-search helper and its regression tests, marketplace validation tests and property policy tests. Only those files were formatted. A second npm run format:check passed for the whole backend. npm run build and Prisma schema validation also passed. Schema validation does not connect to or migrate the database. The frontend production build was not run against the active development output, so this round does not claim that build gate passed. No deployment or database change was made.

### Isolated frontend build and recovery validation

Local browser testing found that password recovery accepted arbitrary text such as not-an-email and displayed the same success screen as a valid identifier. The form now uses the existing recovery email/Bangladesh-phone schema before requesting a reset. Browser rechecking shows the validation error and retains the form for invalid input. The account-enumeration-resistant response for valid identifiers remains unchanged; no real account password or credentials were changed. A new regression covers valid email/phone forms and invalid identifiers. Frontend tests passed 33 cases; lint and type checking passed.

The latest frontend source was copied to a temporary directory, excluding .env files, .next, .vercel and Git state. The first build attempt could not use a dependency junction outside Turbopack's filesystem root; this was an isolated preparation issue, not an application compile failure. With independently copied installed dependencies and the public production URL settings, npm run build passed compilation, TypeScript and generation of all 123 pages. Local Node was v24.11.1; the CI workflow's Node 22 environment was not reproduced by this check. The existing localhost server remained usable because its development output was untouched. This verifies the local production build gate, not deployment or hosted end-to-end acceptance. The temporary build copy was removed after verification.

### Session-switch race regression

API-client review found that a pending refresh response could write old credentials after logout or after another account signed in. The client now tracks explicit session changes separately from normal token rotation. Refresh responses and protected request responses belonging to an earlier session are rejected without restoring tokens, clearing the replacement session or emitting an expiry event for it. Normal concurrent requests within the same session still share one refresh. Three mocked-fetch regressions verify logout, account switching and rejection of previous-account data. Frontend tests passed 36 cases, and lint/type checking passed. This race is deterministically tested with delayed responses rather than exposing credentials through browser automation. The previous isolated production build preceded this newest client change and was not rerun for it.

Security review also confirmed that the current client persists bearer access/refresh tokens in localStorage, despite the backend issuing HttpOnly cookies. This leaves token theft possible if same-origin JavaScript is compromised. Replacing the cross-origin bearer-token architecture with a same-origin cookie-based boundary requires coordinated frontend/backend routing and CSRF acceptance; it has not been implemented or certified in this round. Full financial/database acceptance and this token-storage concern remain open.

### Financial cache refresh consistency

Source review confirmed that the production-mode polling fallback invalidated wallet balance and earnings, but omitted wallet transaction history and payout lists. A settled refund or reviewed payout could therefore leave those views stale while the displayed balance refreshed. Polling now invalidates the wallet query root and payout query root; socket handlers also invalidate the entire wallet family rather than balance alone. This does not post or modify money. A regression using the actual QueryClient verifies invalidation of balance, multiple filtered history pages and both Driver/Provider payout lists without invalidating vehicles. Frontend tests passed 37 cases and type checking passed. Live financial mutation was not used to reproduce this cache issue because controlled fixtures remain unavailable.

Cookie contract review confirmed backend access cookies are HttpOnly with root scope and refresh cookies use /api/v1/auth scope. Socket authentication currently accepts a bearer token as well as the access cookie, while the frontend derives the socket endpoint from the absolute API URL. Thus removing bearer storage without coordinated same-origin routing and socket acceptance would not establish secure, reliable sessions. The token-storage concern remains unresolved, not waived by these cache changes.

### Local withdrawal precision acceptance

Browser testing on localhost reproduced a withdrawal form defect: entering 234.001 BDT against a 234 BDT available balance enabled the Driver request button because Number/Math.round silently rounded the amount. The Provider payout form used the same conversion. Both forms now use a shared exact decimal-to-paisa parser, reject more than two decimal places and scientific notation, and validate again inside the mutation before calling the API. Values outside PostgreSQL signed bigint range are rejected. Inactive or removed destinations cannot remain the selected payout target after a data refresh.

Local browser rechecking confirmed Driver 234.001, 234.01, 1e2 and zero were blocked with clear validation, while 234.00 remained valid. Provider 108.001 and 108.01 were blocked while 108.00 remained valid. Both destination controls displayed readable masked account labels; the old raw-ID display was not reproduced. No request, transfer or balance change was submitted. Frontend tests passed 39 cases, lint and type checking passed. The earlier isolated production build was not rerun for these latest changes. Full financial lifecycle/concurrency acceptance and the session token-storage concern remain outstanding.

### Local listing overtime follow-up

Provider draft-form inspection found that overtime input limits disagreed with the API: the multiplier allowed 10 instead of 5, fixed rates allowed less than 1 BDT, and grace stopped at 120 instead of the supported 180 minutes. Creation and edit controls now match the backend ranges and allow four-decimal multiplier precision. Local browser checks confirmed 5.0001 is invalid, 1.2345 is valid, 180-minute grace is valid, and zero grace remains selectable.

Switching the Provider draft from multiplier to fixed-rate mode reproduced stale input reuse: the multiplier value appeared as the fixed hourly BDT amount, with a Base UI uncontrolled-default warning. Distinct input keys now remount the mode-specific controls. After a full local reload, switching from 1.2345 multiplier to fixed rate displayed a fresh empty rate field with the correct 1-100,000 BDT bounds; no new warning appeared in the captured logs. No listing was created, paused or saved.

Manager pricing source review found Number(gracePeriod) || 15 overwrote a valid zero-minute setting, initial multiplier formatting rounded to one decimal place, and monetary conversion silently rounded extra precision. The pricing editor now preserves zero grace and exact multiplier basis points, converts money without floating-point rounding, validates policy bounds before requests and shows invalid-settings feedback. Creation uses the same overtime policy validation. Regression tests verify zero grace, exact 1.2345 multiplier and invalid/range boundaries. The authorized Manager account lacks pricing permission, so direct pricing-save browser acceptance was not performed and no permission was expanded. Frontend tests passed 41 cases; lint and type checking passed. Existing database policy and financial records were unchanged; the remaining full lifecycle/security acceptance gates stay open.

### Local Manager listing-details acceptance

Browser testing reproduced a missing-duration defect in Edit Listing Settings: an empty minimum remained native-valid and Save Changes stayed enabled. Source review confirmed it was silently replaced with 60 minutes (maximum similarly defaulted to 1,440). The dialog also omitted cleared descriptions from JSON and had no associated accessible names for its text/duration inputs. A shared details validator now requires explicit integer durations within the API ranges, checks maximum against minimum and validates trimmed title, description length and at least one vehicle. Invalid settings cannot enter the mutation. A cleared description is sent explicitly as an empty string, and the details payload contains no price/deposit/overtime fields, preserving separate pricing authorization.

Local browser rechecking confirmed blank minimum, reversed 800/720 durations and a trimmed one-character title disable Save and display errors. Cancel and reopen restore the original Parking title and 60/720 duration. Accessible names now identify each input. Description clearing and omission of pricing fields have exact payload/JSON regression coverage, not a shared-database save. No listing or permissions were modified. Frontend tests passed 43 cases, lint and type checking passed; full gateway/database/security acceptance remains outstanding.

### Local Provider listing payload acceptance

Provider creation/edit still used floating-point rounding for hourly price, deposit and fixed overtime, and omitted cleared descriptions. Both now use the same tested payload builder: exact decimal-to-paisa conversion, explicit empty descriptions, trimmed titles, required duration ranges and the shared overtime policy validator. Edit defaults use integer-paisa formatting without converting money through Number. Tests cover exact large amounts beyond JavaScript's safe-integer range and reject extra decimal precision, scientific notation, blank deposit, invalid durations and invalid overtime settings.

Local browser testing submitted a deliberately invalid draft (minimum 800, maximum 720). The client rejected it before entering the API mutation. The first check exposed generic error feedback; scoped validation catches now display the actual actionable message, and the next browser check showed "Maximum duration must be at least the minimum duration." The existing active listing was not paused, edited or replaced. No new draft, payment or withdrawal was created. Frontend tests passed 45 cases; type checking and lint passed. The earlier isolated production build predates these latest changes. Successful create/edit persistence, full financial lifecycle/concurrency acceptance and the session token-storage concern remain open.

### Local Manager listing-creation acceptance

Browser-first testing reproduced a separate Manager creation defect: selecting an eligible right, entering a one-character title and reversed 800/720 durations still enabled Create Listing. The dialog did not submit native form validation, its duration/grace state converted blanks to zero, and several number fields had outdated bounds or no accessible labels. Creation now calls the shared listing payload validator both when computing button availability and inside the mutation. The selected right must still belong to the currently loaded eligible scope. Text/number controls have associated labels and API-aligned bounds; numeric draft state retains blank strings for explicit validation rather than silently converting them.

Local browser rechecking confirmed short title, reversed duration, blank minimum and 12.345 BDT disable creation with specific feedback. A valid 15/15-minute booking range, 180-minute grace, 1.2345 multiplier and 12.34 BDT enabled creation. These settings were not submitted; the dialog was cancelled and the existing active listing remained unchanged. No Manager permission was expanded. The shared payload regression includes Manager duration/grace boundaries. Frontend tests passed 46 cases, full lint and type checking passed. Successful database creation and complete financial/security acceptance remain open; this check does not certify the entire project as bug-free.

### Manager listing publication and property scope contract

Review against the current Prisma schema and API confirmed new listings default to DRAFT and the activation endpoint accepts DRAFT and PAUSED while rejecting SUSPENDED/ENDED. The Manager card previously offered Activate only for PAUSED, stranding newly created drafts. It also displayed edit/pricing controls for terminal states even though the API rejects those edits. A tested controls helper now allows draft activation, retains separate listing-management/pricing permissions and suppresses prohibited terminal-state actions. No backend authorization rule was relaxed.

The listings request returns all authorized Provider memberships, but the property workspace previously filtered only resourceIds; an empty array means property-wide delegation and could display listings from another assigned property. The filter now requires the current property ID plus any delegated resource restrictions, excluding records without property identity. Regressions exercise multiple property-wide/restricted scopes and the listing-state/permission matrix. Local browser verification retained the existing active Parking listing and its Edit/Pause actions, with pricing still restricted. This account has only one assigned property and no draft fixture, so multi-property rendering and actual draft activation are covered by contract/unit evidence rather than browser persistence. Frontend tests passed 48 cases, lint/type checking and diff checks passed. No listing, money, delegation or deployment was changed. Full isolated financial/database acceptance and bearer-token storage remediation remain outstanding.

### Localhost-only browser-first audit, October 3

This pass used http://localhost:3000, not the hosted frontend. All five authorized role accounts signed in and signed out successfully. Browser observations preceded the gallery changes below. This is a representative flow audit, not an assertion that every page, mutation, permission combination or financial lifecycle has passed.

| Flow | Observed localhost result | Boundary |
| --- | --- | --- |
| Driver discovery | Default browse displayed two properties and price markers; submitting a 10 km radius updated search parameters and returned both matching properties. | GPS permission was not granted or simulated. |
| Property details | Selected October 5 propagated to the detail URL and reservation dates; availability resolved to ten spaces. | No reservation hold was created. |
| Server quote | Three hours displayed parking 36 BDT, platform fee 3.60 BDT, deposit 400 BDT and total 439.60 BDT. Discarding the quote unlocked date/vehicle controls. | No booking, wallet debit or gateway payment was submitted. |
| Property creation | Empty required fields displayed errors; completed basic details advanced to location; missing map location blocked review. | Draft exited without submission or approval. |
| Provider listing | Verified active resource/right exposed publication controls; empty draft submission was rejected by required title validation. | Existing listing was not modified or paused. |
| Provider earnings | Available 108 BDT and awaiting-settlement 36 BDT displayed separately; pending identified one paid unsettled booking. | Read-only UI observation, not independent financial settlement acceptance. |
| Manager delegation | Assigned property showed the active listing and Edit/Pause controls; pricing controls remained unavailable to this account. | No permission expansion, save or publication performed. |
| Guard scan | Camera remained off until explicitly requested; short invalid credential could not enable verification. | No camera permission, successful credential verification, check-in or checkout performed. |
| Admin finance | Earnings displayed 39.50 BDT recognized platform revenue and settlement rows. Reconciliation displayed twelve wallets and zero cached-balance/ledger mismatches. | Displayed API results do not prove concurrent financial correctness. |

The property photo viewer exposed unnamed thumbnail buttons. Its custom overlay did not manage focus or return it to the opening control. The viewer now uses the installed Base UI dialog primitive for modal focus management, Escape handling and background isolation. Every thumbnail has a photo-number label and selected state; the counter is announced, and the displayed index is bounded against refreshed image counts. Local rechecking confirmed initial focus on Close, Shift+Tab wrapping to the last thumbnail, selection of photo three, ArrowRight advancing to photo two from the initial photo, and Escape restoring focus to Show all photos. Arrow-key handling was moved into popup capture after the first recheck exposed that the window-level handler did not receive the event inside the dialog. No authentication, authorization or financial backend contract changed.

Outstanding acceptance includes successful property/resource/listing persistence, real gateway callbacks, wallet split/full-wallet payment, cancellation and guard checkout settlement, withdrawal completion, concurrency/replay tests and full responsive coverage. These cannot be certified from read-only observations of a local frontend connected to shared Supabase. The previously recorded bearer-token storage concern remains open. Manager navigation still uses a placeholder P brand mark; it is a separate UI finding, not a finance defect.

Verification: 48 existing frontend regression tests passed; full frontend type checking and lint passed after the final gallery keyboard change; git diff whitespace checks passed. Gallery behavior has direct localhost browser evidence rather than a new automated component test. No production build or deployment was performed in this pass.
