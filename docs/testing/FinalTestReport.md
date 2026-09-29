# ParkEase BD: Final Test Report

---

## 1. Build, database migrations and automated suites

| ID | What we tested | Expected | What we got | Issue / defect to fix |
|---|---|---|---|---|
| BLD-01 | Old defect D1 (Supabase `anon` role) on plain PostgreSQL | Migration applies | ✅ The `restrict_supabase_data_api` migration now applies on plain PostgreSQL | None (fixed) |
| BLD-02 | Schema drift after migrating | Database = `schema.prisma` | ✅ `prisma migrate diff`: empty | None |
| BLD-03 | Backend type check and build | Exit 0 | ✅ Exit 0 | None |
| BLD-04 | Backend unit tests | All pass | ✅ 111 / 111 pass | None |
| BLD-05 | Backend integration tests | All pass and the process exits | ❌ 2 subtests fail and the run never exits (killed after 15 min, exit 124). (a) The concurrent verification test gets `429, 429` from the Admin rate limit instead of `200, 409`. (b) Marketplace teardown fails on FK `booking_settlements_booking_id_fkey`, and under full-suite load the concurrent-hold test hits an unhandled "write conflict or deadlock". | **D-01.** Clear rate-limit keys between tests, delete `booking_settlements` in teardown, close the Prisma/Redis handles so the process exits. |
| BLD-06 | Frontend type check and lint | 0 errors | ✅ Type check exit 0; ESLint 0 errors, 0 warnings | None |
| BLD-07 | Frontend production build | Build completes | Compiles and type-checks. Static generation stopped: with the local `http://` API URL the app refuses a production build (intended guard), and with an HTTPS URL this machine ran out of memory at page 91/122. | Not a code defect; re-run on CI to confirm. |
| BLD-08 | Dependency audit (production dependencies) | No high or critical | ❌ Backend: 6 (4 high, 2 moderate; runtime: `multer` DoS, `nodemailer` credential disclosure). Frontend: 10 (1 critical `next` ≤16.3.2, 5 high incl. `sharp`, `postcss`, `nanoid`). | **D-02.** Upgrade `next`, `multer`, `nodemailer`, `sharp` and the Prisma CLI chain. |
| BLD-09 | Postman system suite (605 assertions, 20 folders, all roles) | All pass | 525 pass / 80 fail. 47 of the failures come from public search returning 401 (SEC-21). The rest are the defects listed in section 4. B33 and G30 fail only because the tests are outdated (cancel now needs an `idempotencyKey`; earnings moved to a new "unsettled" bucket). | See section 4. Update tests B33, G30 and M27 to the new API. |

## 2. Security


| ID | What we tested | Expected | What we got | Issue / defect to fix |
|---|---|---|---|---|
| SEC-01 | Self-register with role `ADMIN` | Refused | ✅ 400 `VALIDATION_ERROR` | None |
| SEC-02 | Register with extra fields `status: ACTIVE`, `emailVerifiedAt`, `roles: [ADMIN]` (mass assignment) | Fields ignored | ✅ Account created PENDING, unverified, DRIVER only | None |
| SEC-03 | Unverified account adds a vehicle | 403 | ✅ 403 `AUTH_EMAIL_VERIFICATION_REQUIRED` | None |
| SEC-04 | Login with wrong password vs unknown email | Same answer (no account enumeration) | ✅ Both 401 "Invalid email/phone or password", similar timing (277 ms / 317 ms) | None |
| SEC-05 | Forgot-password for unknown email; register with existing email | Generic answer for reset | ✅ Reset: 202 generic. Register: 409 "already registered" (accepted trade-off) | None |
| SEC-06 | Attacker makes 5 wrong guesses on a victim's email, then the victim logs in with the right password | Brute force slowed, owner can still sign in | ❌ Owner gets **429 for 15 minutes** | **D-03.** The login limit is keyed on the identifier alone (`rate-limit.ts` `identifierAndIpLimits`), so anyone can lock any account out. Key it on identifier + IP, or add a CAPTCHA / backoff instead of a hard block. |
| SEC-07 | 3 junk password-reset submissions from one client, then a real user's valid reset token | Real user's reset works | ❌ Real user gets **429** | **D-04.** `/auth/reset-password` uses `passwordResetRateLimit`, which keys on `body.identifier`. That request only has `token`, so every reset on the platform shares the bucket `identifier:invalid` (3 per hour). Key it on the token hash or IP. |
| SEC-08 | JWT with edited role claim; JWT with `alg: none` | 401 | ✅ 401 both | None |
| SEC-09 | Session cookie flags | HttpOnly + SameSite | ✅ `access_token` and `refresh_token` HttpOnly, SameSite=Lax, refresh path limited to `/api/v1/auth` | None |
| SEC-10 | Old access token after logout | 401 | ✅ 401 | None |
| SEC-11 | Replay a rotated refresh token | Rejected; the whole session family revoked | ✅ Replay 401 `AUTH_REFRESH_TOKEN_REUSED`; the new session is revoked too | None |
| SEC-12 | CSRF: POST with foreign `Origin`; POST with `Sec-Fetch-Site: cross-site` | 403 | ✅ 403 `CSRF_REQUEST_REJECTED` both | None |
| SEC-13 | Brute-force the 6-digit email code | Blocked after 5 | ✅ 400 ×5, then 429 and the code is destroyed | None |
| SEC-14 | Malformed JSON; 40 KB JSON body | 400; 413 | ❌ Malformed → 400 ✅, oversized → **500** | **D-05.** `normalize-request-error.ts` only maps malformed JSON; map body-parser errors by `status` (413 etc.). |
| SEC-15 | SQL-injection strings in login, search query and ID path | Treated as data | ✅ 401 / 400 / 400, no 500, nothing leaked | None |
| SEC-16 | Unknown API route `/api/v1/this-route-does-not-exist` | 404 | ❌ **401 AUTH_REQUIRED** | **D-06.** Same cause as SEC-21. |
| SEC-17 | Name `<img src=x onerror=alert(1)>` then the verification email | HTML escaped in email | ✅ Escaped | None |
| SEC-18 | Driver B reads, edits and deletes Driver A's vehicle (IDOR) | 404/403, vehicle unchanged | ✅ 404 ×3; owner's vehicle unchanged | None |
| SEC-19 | Driver → Admin and Provider APIs; anonymous → Admin; Provider → audit log | 403 / 401 | ✅ 403, 403, 401, 403 | None |
| SEC-20 | Admin suspends a user who is signed in | Live session cut off at once; new login refused | ✅ Existing session 401; new login 403 `AUTH_ACCOUNT_SUSPENDED` | None |
| SEC-21 | Signed-out visitor: `GET /parking/search`, `/parking/browse`, public property page | 200 (public by design) | ❌ **401** on all. In the web app `/parking` sends visitors to the login page | **D-07.** `payment.routes.ts:114` calls `paymentRouter.use(authenticate, requireAccountReady)`. The router is mounted on `/api/v1` before the marketplace router, so that line runs for every later `/api/v1` route. Mount the payment router on its own paths, or apply `authenticate` per route. (Still open from UAT H-9.) |
| SEC-22 | `GET /internal/email-worker/tick` without a secret | 401 | ❌ **200**, and the worker ran (email sends and booking lifecycle) | **D-08.** `app.ts` only checks the secret `if (cronSecret && …)`, and `CRON_SECRET` appears in no `.env.example` or deploy doc. Refuse when the secret is missing, and document it. |
| SEC-23 | Payment gateway callbacks with missing fields (`POST /payments/sslcommerz/ipn` `{}`, `GET …/success` with no query) | 400 | ❌ **500** | **D-09.** `callbackSchema.parse()` throws a raw ZodError; use the `validate` middleware or map ZodError to 400. |
| SEC-24 | `/fail` and `/cancel` gateway callbacks (code review) | Payment state only changes after checking with SSLCOMMERZ | ❌ Any caller who knows a `tran_id` can mark that payment FAILED/CANCELLED and release its wallet holds without gateway validation (`payment.service.ts` `recordGatewayExit`). `tran_id` has 48 random bits, so the risk is low. | **D-10.** Call `queryTransaction()` before changing state on fail/cancel. |
| SEC-25 | HTTP security headers and CORS | Helmet headers; only the web origin allowed | ✅ CSP, HSTS, X-Frame-Options, nosniff, no `X-Powered-By`; a preflight from `https://evil.example` does not get that origin back | None |
| SEC-26 | Passwords and tokens in the server log | Never written | ✅ None found in 1.7 MB of API log | None |

## 3. User footprint (is every action recorded?)

A new Driver, a Provider and the Admin ran a full journey, then the database and Admin audit log were read after each step. 

| ID | What we tested | Expected | What we got | Issue / defect to fix |
|---|---|---|---|---|
| FP-01 | Registration | User row, Terms + Privacy acceptance, session with device + IP, audit event | Partly: user row, 2 legal acceptances with time, session with user agent and IP hash; **no audit event** | **D-11** (see FP-03) |
| FP-02 | Email verification | Timestamp + event | Partly: `email_verified_at` set; **no event** | **D-11** |
| FP-03 | Failed logins | Each attempt stored (time, IP, device) and visible to Admin | ❌ **Nothing stored.** The only trace is the console log line `POST /auth/login -> 401` with no account named. No "security events" store or screen exists. | **D-11.** Add a security-event log (sign-up, login success/failure, logout, password change/reset, email verified, sessions revoked) with user, IP hash, user agent and time, plus an Admin view (FR-ADM-06). |
| FP-04 | Successful login | `last_login_at` + session record | ✅ `last_login_at` updated; new session row with user agent + IP hash | None |
| FP-05 | Logout | Session closed | ✅ `revoked_at` set | None |
| FP-06 | Password change | Security event | ❌ Only `updated_at` changes; **no record** that the password changed | **D-11** |
| FP-07 | Vehicle add / edit / delete | Audit events | ❌ **None** (delete is a soft delete, which is good) | **D-12.** The vehicles module writes no audit events. |
| FP-08 | Search history | Search saved (rounded location) | ✅ Saved as 23.7925, 90.4078 | None |
| FP-09 | Quote → hold → book → pay → cancel | One event per step, actor = Driver | ✅ QUOTE_CREATED, HOLD_CREATED, BOOKING_CREATED, DRIVER_WALLET_APPLIED, PAYMENT_SUCCEEDED, BOOKING_CONFIRMED, BOOKING_CANCELLATION_REFUND_CALCULATED, BOOKING_CANCELLED | None |
| FP-09b | Cancel a paid booking > 24 h ahead | Money returned | ✅ Booking CANCELLED; 220 BDT credited to Refund Balance (old defect D2 / UAT H-7 fixed) | None |
| FP-10 | Audit event → HTTP request (`request_id`) | Filled on every event | ❌ **0 of 8** marketplace/payment events carry `request_id` (Admin events do) | **D-13.** Pass `req.requestId` into `createDomainAuditEvent` from the marketplace and payment services. |
| FP-11 | Ledger for the journey | Debits = credits | ✅ 2 transactions, balanced | None |
| FP-12 | Provider: price change, pause, activate | Audited with old/new values | ❌ Pause/activate audited but **without before/after data**; price change **not audited** (only in the price-history table). Admin deactivating a Property suspends its listings with **no LISTING_SUSPENDED event**. | **D-14.** Audit price changes and add previous/next values to listing events. |
| FP-13 | Admin suspend / unsuspend | Event with reason and before/after | ✅ With reason and previous/next status | None |
| FP-14 | Admin audit log filtered by the Driver | Driver's trail visible | ✅ 8 events returned | None |
| FP-15 | Audit filter with an unknown event type | 400 | ✅ 400 | None |

## 4. Functional behaviour (booking, payment, Manager, Guard, finance, search)


| ID | What we tested | Expected | What we got | Issue / defect to fix |
|---|---|---|---|---|
| FN-01 | Five simultaneous holds on one single-unit bay | One 201, others 409 | ✅ `201 · 409 ×4` | None |
| FN-02 | Unpaid booking after its 20-min payment window (UAT M-8) | EXPIRED, space freed | ✅ EXPIRED/CANCELLED at 21 min | None |
| FN-03 | Hold past its 15-min expiry (Postman H01, via DB) | Released | ✅ All past-expiry holds EXPIRED/RELEASED/CONSUMED | None |
| FN-04 | Pay a booking entirely from the Refund Balance (UAT H-6): balance 220 BDT, booking 160.50 BDT | CONFIRMED | ❌ **500**, booking stuck in PAYMENT_PENDING | **D-15.** Wallet-only branch writes a payment with amount 0, rejected by `payments_amount_check` (`payment.service.ts:234`). Record the wallet-only capture without a 0-amount gateway payment, or relax the check for wallet payments. |
| FN-05 | Three payout requests at the same moment (FR-FIN-06); balance 31 BDT, 15.50 each | 201/201 or 201/409, never 500 | ❌ `201 · 500 · 500` | **D-16 (old D10).** Prisma `P2034` write conflict is not retried or mapped to 409 (`marketplace.service.ts:7823`). Retry serializable transactions or return 409. |
| FN-06 | Manager with `RESOURCE_MANAGE` adds a space | 201 | ✅ 201 | None (old D16 part 1 fixed) |
| FN-07 | Linked Manager creates a Guard (FR-MGR-09) | 201 | ❌ 403 | **D-17 (old D16).** `/users/guards` allows only PROVIDER/ADMIN. |
| FN-08 | Manager booking list (FR-MGR-10) | No money, no Driver contact | ❌ Shows 8 money fields **and the Driver's email and phone** | **D-18 (old D4, worse).** Strip amounts and contact details from the Manager view. |
| FN-09 | Manager reads Owner earnings (FR-MGR-12) | Refused | ❌ 200 | **D-18 (old D4)** |
| FN-10 | Confirmed booking shows exact address + access instructions (FR-PROP-02, B22) | Visible to the paying Driver | ❌ Only approximate address | **D-19 (old D3 / UAT M-2)** |
| FN-11 | 230 cm SUV quoted for a 220 cm bay (B04) | Refused | ❌ Quote 201 | **D-20 (old D7)** Check vehicle height against the space. |
| FN-12 | Owner earning after checkout (G30b), and when a dispute opens (DS04) | Pending during dispute window; held on dispute | ❌ Available at once; not held | **D-21 (old D8)** |
| FN-13 | New payout account (PO05) | Waits for Admin verification | ❌ Usable at once | **D-22 (old D9)** |
| FN-14 | Search coordinates as signed-in Driver (FR-SRCH-04) | Approximate | ❌ Exact stored coordinates returned | **D-23 (old D12)** |
| FN-15 | Search `sort=price`, `page`/`limit` | 200 | ❌ 400 | **D-24 (old D20)** |
| FN-16 | Seeded demo bays A-01, B-02, C-03 | Bookable and in search | ❌ Never shown; quote → 409 `PARKING_NOT_AVAILABLE` | **D-25 (old D6).** Root cause found: `prisma/demo-seed.ts` creates FIXED_SPACE resources with **0 unit rows**. |
| FN-17 | Admin deactivates then re-activates a Property (AD10b) | Listings back in search | ❌ Listing stays SUSPENDED | **D-26 (old D11)** |
| FN-18 | Shared-building flag on a Property (PF14) | Accepted | ❌ 400 unknown key | **D-27 (old D13)** |
| FN-19 | Rename a verified Property (P36b) | Stays VERIFIED | ❌ Back to PENDING, offline | **D-28 (old D17)** |
| FN-20 | EXIT QR/OTP on checkout request (G27) | Issued | ❌ Not issued | **D-29 (old D14)** |
| FN-21 | Change a Guard's shift (G34b) | Guard must re-accept | ❌ Stays ACTIVE | **D-30 (old D15)** |
| FN-22 | Manager-link notifications (M19, M46) | Sent | ❌ None | **D-31 (old D18)** |
| FN-23 | Suspend a Manager link (M47) | Endpoint exists | ❌ 404 | **D-32 (old D19)** |
| FN-24 | Block a space that has a booking (PC05) | Warns, lists the booking | ❌ No warning | **D-33 (old D21)** |
| FN-25 | Review with category ratings (RV02) | Accepted | ❌ 400 unknown keys | **D-34 (old D22)** |
| FN-26 | Old D5: paying a listing with no deposit | Works | ✅ Works (B30) | None (fixed) |

## 5. Web application 

| ID | What we tested | Expected | What we got | Issue / defect to fix |
|---|---|---|---|---|
| UI-01 | Sign-in through the login form, all 5 roles | Lands on the role's home | ✅ Driver → /driver/dashboard, Provider → /provider/dashboard, Manager → /manager/dashboard, Guard → /guard, Admin → /admin/properties/pending | None |
| UI-02 | 17 public pages signed out | Load | ✅ Load; account/support pages correctly ask to sign in | None |
| UI-03 | 23 Driver, 32 Provider, 12 Manager, 8 Guard pages | Load without errors | ✅ All load, each with its own heading, no failed API calls (except the Provider wizard pages in UI-05) | None |
| UI-04 | 18 Admin pages (dashboard, users, finance, marketplace, communications) | Load | ✅ Load (the remaining Admin pages could not be opened: the machine ran out of browser resources) | None found |
| UI-05 | Provider pages incl. "Edit" links on property details and listing edit | Open the editor | ❌ `/provider/properties/new/step-1` … `step-7` and `/success` return **"This page could not be found" (404)** Live links point there: `owner-property-details-view.tsx:185, 403, 464`, `owner-edit-listing-view.tsx:521, 588, 594, 724, 730` | **D-35.** The legacy step `layout.tsx` files call `redirect()`, which gives a 404 in this Next.js version. Point the links at the current editor and delete the legacy step folders. |
| UI-06 | Links on Manager pages | No broken links | ❌ `/terms` → 404, linked from every Manager page | **D-36 (UAT H-5).** Link to `/privacy` or add `/terms`. |
| UI-07 | Visitor searches from the home page | Map/results | ❌ Sent to login | **D-07** (SEC-21) |
| UI-08 | Sign-up consent checkbox (code: `register-form.tsx:44, 61`) | Unticked; API gets the box's value | ❌ Pre-ticked; API always gets `acceptTerms: true, acceptPrivacyPolicy: true` | **D-37 (UAT H-4)** |
| UI-09 | Sign-up password hint (`register-form.tsx:191`) | Matches rule (12+ chars, upper, lower, digit, symbol) | ❌ Says "At least 8 chars, 1 uppercase, 1 number" | **D-38 (UAT M-6)** |
| UI-10 | Gate pass text (`digital-access-pass.tsx:44`) | Offers a usable fallback | ❌ Promises an "Access OTP" that is never shown | **D-39 (UAT H-3)** |
| UI-11 | Weekly-availability editor (`provider-marketplace-panel.tsx:448`) | What is shown is saved | ❌ Days start unticked while times are shown, so Save sends `rules: []` | **D-40 (UAT H-1)** |

## 6. Defects to fix

| # | Severity | Defect | Where |
|---|---|---|---|
| D-07 | High | Public search/browse/property page need login; unknown routes answer 401 | `payment.routes.ts:114`, `app.ts` mount order |
| D-08 | High | Worker endpoint open when `CRON_SECRET` is unset | `app.ts` `/internal/email-worker/tick` |
| D-04 | High | Password reset blocked for everyone after 3 bad attempts anywhere | `rate-limit.ts` `passwordResetRateLimit` on `/auth/reset-password` |
| D-03 | High | Anyone can lock any user out of login for 15 min | `rate-limit.ts` `identifierAndIpLimits` |
| D-15 | High | Wallet-only payment → 500, booking stuck | `payment.service.ts:234` |
| D-18 | High | Manager sees payment amounts, Driver email/phone, Owner earnings | Manager booking/earnings endpoints |
| D-11 | High | No security-event log (sign-up, logins, failed logins, password change) and no Admin view | auth module, FR-ADM-06 |
| D-02 | High | Critical/high vulnerable dependencies (`next`, `sharp`, `multer`, `nodemailer`) | `package.json` (both) |
| D-35 | High | Provider "Edit" links lead to 404 pages | `frontend/app/provider/properties/new/step-*`, links listed in UI-05 |
| D-16 | Medium | Concurrent payout requests → 500 | `marketplace.service.ts:7823` |
| D-05 | Medium | Oversized body → 500 | `normalize-request-error.ts` |
| D-09 | Medium | Gateway callbacks with bad input → 500 | `payment.routes.ts` `callbackSchema.parse` |
| D-10 | Medium | Fail/cancel callbacks change payment state without gateway check | `payment.service.ts` `recordGatewayExit` |
| D-12, D-13, D-14 | Medium | Audit gaps: vehicles, price changes, before/after data, missing `request_id` | vehicles, marketplace and payment services |
| D-01 | Medium | Integration suite: 2 failures and never exits | `backend/tests/integration` |
| D-19 … D-34 | Medium/Low | Still-open functional defects (FN-10 … FN-25) | see section 4 |
| D-36 … D-40 | Medium | Open UAT UI defects (terms link, consent box, password hint, OTP text, availability editor) | see section 5 |
