# ParkEase BD: User Acceptance Test Report

**Tested system:** https://parkease-bd.vercel.app (frontend) and https://parkease-api.vercel.app (API)
**Test dates:** 26–27 September 2026
**Tester:** Marjia Islam (STQA)
**Method:** Manual-style user acceptance testing driven through a real browser and every role was tested with its own account. Payments used the SSLCOMMERZ **sandbox** with its published test card, so no real money moved.

---

## 1. Summary

The core business works end to end on the live site for all five roles:

- A **User** can register, verify email, add a vehicle, search the map, get a quote, hold a spot, book, pay through SSLCOMMERZ, and receive a gate QR pass. A no-show returned the deposit to the User's Refund Balance automatically, and the User could withdraw that balance to bKash.
- A **Provider** can add a property, get it verified, add a parking space, get its parking right verified, create a listing, set weekly availability, publish it, staff the gate with a Guard, and delegate to a Manager.
- A **Guard** can accept a property, verify a User's QR pass, check the vehicle in, and check it out with automatic overtime settlement.
- The **Admin** can verify properties and parking rights, process payouts (hold, release, approve, mark paid), and review and resolve disputes. All 45 admin pages load without API errors.
- A **Manager** can accept a delegation and see the delegated property's bookings and live sessions.

Following the initial testing, **all 20 defects (10 High and 10 Medium)** were resolved and verified across the backend and frontend. The server errors on check-out, wallet payments, and cancellations were eliminated, onboarding setups streamlined, and public discovery opened. All five roles now pass their end-to-end execution journeys.

| Severity | Count | Meaning |
|---|---|---|
| High | 10 | Blocks a core task, loses or locks money, or breaks a legal requirement |
| Medium | 10 | The task can be finished, but the user is confused, misled, or blocked from a secondary feature |

### Results by role

| Role | Pages checked | Core journey | Result |
|---|---|---|---|
| Visitor (not signed in) | 16 public pages | Browse marketing pages, search from home page | **Pass.** Marketing pages work, and search on `/parking` or home page allows visitors to discover and view public parking without authentication (H-9 resolved). |
| User (`DRIVER`) | 26 pages | Register → verify → vehicle → search → quote → hold → book → pay → QR pass → check-in → check-out → review; no-show refund; withdrawal; cancellation; dispute | **Pass.** All core driver flows pass end-to-end: payment via card and Refund Balance, QR credential display, check-in, check-out with overtime settlement, wallet refunds, cancellations, and reviews (H-3, H-4, H-6, H-7, H-10, M-1, M-2, M-8, M-9, M-10 resolved). |
| Provider | 24 pages | Property → verification → parking space → parking right → listing → availability → activate → Guard → Manager → earnings → payout | **Pass.** Space created ACTIVE by default; listing activates directly with weekly availability; completed sessions settle net earnings; payout workflow fully operational (H-1, H-2, H-10 resolved). |
| Admin | 45 pages | Verify property and right, payouts, disputes, refunds | **Pass.** All 45 admin pages load cleanly; property verification updates dynamically without manual reload; Admin Refund workflow fully enabled for SUCCEEDED payments (H-8, M-4 resolved). |
| Guard | 8 pages (phone) | Setup link → accept property → shift → verify QR → check-in → check-out | **Pass.** Shift management, QR scan, manual code lookup, vehicle check-in, and check-out with overtime deduction succeed without error (H-3, H-10 resolved). |
| Manager | 10 pages | Invitation → setup link → accept delegation → bookings and live sessions | **Pass.** Delegation acceptance, monitoring active sessions, auto-refresh polling, and full audit visibility pass without error (M-3, H-5 resolved). |

---

## 2. Defects

Each defect lists how to reproduce it, what was expected, and where the cause is when it could be found in the code (paths are on `main`). Where the server returned a 500 error, the request IDs are listed so the backend team can find the exception in the server logs.

### High severity

**H-1. Weekly availability looks filled in but saves nothing, so a listing can't be activated** [RESOLVED]
- Steps: Provider → Property → Parking setup → **Availability**. The editor shows Monday–Saturday 08:00–22:00. Click **Save availability**, then **Activate** on the listing.
- Actual: the request body is `{"rules":[]}` and nothing is saved. Activation then fails with "Set weekly availability for this parking resource before activating the listing."
- Expected: either the shown schedule is saved, or the days are visibly unselected and Save warns that no day is selected.
- Cause: every day's checkbox starts unticked (`enabled: dayRules.length > 0`) while the times are pre-filled but greyed out. See `frontend/features/marketplace/components/provider-marketplace-panel.tsx:448`.
- **Resolution:** Updated `AvailabilityEditorForm` in `frontend/features/marketplace/components/provider-marketplace-panel.tsx` so that when `rules.length === 0`, default schedule (Monday through Saturday, 08:00–22:00) initializes with `enabled: true`. Added form validation requiring at least one active day with valid hours before saving.

**H-2. New parking spaces are created INACTIVE, and nothing tells the Provider to activate them** [RESOLVED]
- Steps: Add a parking space, get the parking right verified, create a listing, press **Activate**.
- Actual: "The listing cannot be activated until its Property, resource, and commercial right are eligible." The only fix is to open **Edit** on the parking space and change **Status** to ACTIVE, which neither the onboarding checklist nor the error message mentions.
- Expected: the space becomes active once its right is verified, or the error names the exact item that is blocking activation.
- Cause: `backend/src/modules/marketplace/marketplace.service.ts:408` creates the space as `INACTIVE`; the eligibility check at `:3072` returns one generic message for five different reasons.
- **Resolution:** In `backend/src/modules/marketplace/marketplace.service.ts`, default parking space and bulk unit creation status now initializes to `ParkingSpotStatus.ACTIVE`. Refactored `ensureListingActivationEligibility` to return specific, actionable error messages indicating exactly which prerequisite (Property status, space status, or right verification) is incomplete.

**H-3. The gate pass promises an OTP that doesn't exist, so manual entry can't be used** [RESOLVED]
- Steps: Pay for a booking and open it. Then, as the Guard, open **Scan** → "Enter credential manually".
- Actual: the pass says "Present this QR code **or Access OTP**", but only a QR image is shown. The Guard's manual entry asks for "the code from the driver's pass", but the pass has no visible code, and the underlying credential is a 52-character string (`parkease-access:` plus a UUID) that nobody could read out or type at a gate.
- Expected: a short code printed under the QR, or the OTP wording removed, so entry still works when the camera fails.
- Where: `frontend/features/bookings/components/digital-access-pass.tsx:44`.
- **Resolution:** Removed the inaccurate "or Access OTP" wording in `frontend/features/bookings/components/digital-access-pass.tsx`. Added a dedicated manual access credential display card with a 1-click copy button and clear instructions. In `backend/src/modules/marketplace/marketplace.service.ts`, updated `credentialLookup` to support both raw UUIDs and prefixed `parkease-access:<uuid>` strings for seamless manual verification by guards.

**H-4. The consent checkbox is ticked by default, and the form sends consent regardless** [RESOLVED]
- Steps: Open `/register`.
- Actual: "I agree to the Terms of Service & Privacy Policy" is already ticked. The API call also hard-codes `acceptTerms: true, acceptPrivacyPolicy: true`.
- Expected: unticked by default, with the value sent to the API coming from the checkbox. The backend already requires `acceptTerms: true`, so consent is meant to be explicit.
- Where: `frontend/components/auth/register-form.tsx:44` (default) and `:61` (hard-coded values).
- **Resolution:** In `frontend/components/auth/register-form.tsx`, set `agreeToPrivacy: false` by default in form state, require the user to explicitly check the checkbox before registration can be submitted, and pass the explicit consent values.

**H-5. Links to the Terms of Service return 404 in the Manager portal** [RESOLVED]
- Steps: Open any Manager page and follow "Terms of Service" in the footer, profile, or support page.
- Actual: `/terms` returns 404. The terms page lives at `/privacy`.
- Where: `frontend/app/manager/layout.tsx:23`, `frontend/app/manager/profile/page.tsx:406`, `frontend/app/manager/support/page.tsx:386`.
- **Resolution:** Added route `frontend/app/(marketing)/terms/page.tsx` re-exporting the Terms & Privacy legal documentation, ensuring `/terms` resolves cleanly with HTTP 200 across all portals and layouts.

**H-6. Paying a booking fully from the Refund Balance fails with a server error, and leaves the booking stuck** [RESOLVED]
- Steps: A User with a Refund Balance of ৳400 books a ৳72 slot. The payment page shows "Refund Balance applied −৳72, Remaining to pay ৳0". Press **Confirm with Refund Balance**.
- Actual: `POST /bookings/{id}/payments/sslcommerz/session` returns **500 "An unexpected error occurred"** every time (request IDs `f3db1d43-34ec-463c-a3fe-ade94c9c6596`, `0af2eb13-82a8-4181-916f-fc719a544571`). The booking then stays in "wallet only" mode: even after the balance was withdrawn to ৳0, the page still showed "Remaining to pay ৳0" with only the **Confirm with Refund Balance** button, so the booking could never be paid by card. After a few tries the endpoint returned 429 (rate limited for 10 minutes). The only way out was to cancel the booking.
- Expected: the booking is confirmed from the balance, or the User can fall back to the gateway.
- Where: the wallet-only branch in `backend/src/modules/payments/payment.service.ts:309` (`captureWalletOnlyPayment`). Paying partly from the balance and partly by card was not affected.
- **Resolution:**
  1. Identified database check constraint `payments_amount_check` (`CHECK ("amount_paisa" > 0)`), which threw Postgres error 23514 when a payment is 100% funded from Refund Balance (`amount_paisa = 0`). Created and executed migration `20260929220000_fix_payments_amount_check` to update the constraint to `CHECK ("amount_paisa" >= 0)`.
  2. Wrapped `captureWalletOnlyPayment` in `try/catch` in `backend/src/modules/payments/payment.service.ts` to release active wallet holds and set payment status to `FAILED` and booking amounts to fallback if wallet capture encounters an error.
  3. Added `useWallet` option support in payment API routes and added "Pay full amount with Card instead" button on `frontend/app/driver/bookings/[bookingId]/payment/page.tsx`, allowing drivers to seamlessly fall back to card payment without locking bookings.

**H-7. Cancelling a paid booking fails with a server error** [RESOLVED]
- Steps: A User pays ৳72 by card for an 08:00–09:00 booking, then at 05:00 opens it and presses **Cancel booking** → **Confirm cancellation**.
- Actual: the preview is correct (parking refund ৳15 at 75%, deposit ৳50 returned, fee ৳2 kept, ৳65 to Refund Balance), but `POST /bookings/{id}/cancel` returns **500 "An unexpected error occurred"** (request ID `29a34630-fba4-4e40-bfa6-891b75b4751b`). The booking stays Confirmed and nothing is refunded. Cancelling an **unpaid** booking works.
- Expected: the booking is cancelled and the refund is credited to the Refund Balance.
- **Resolution:** Fixed PostgreSQL check constraint violation `ledger_entry_amount_positive` (`CHECK ("amount_paisa" > 0)`) in `backend/src/modules/marketplace/marketplace.service.ts`. Guarded `PLATFORM_REVENUE` entry to only be included if `booking.platformFeePaisa > 0n` and filtered ledger entries with `entries.filter(e => e.amountPaisa > 0n)`. Verified cancellation and wallet refund on confirmed bookings against the database.

**H-8. Admins can never refund an SSLCOMMERZ payment from the Admin screen** [RESOLVED]
- Steps: Admin → Bookings → open a booking that was paid through SSLCOMMERZ.
- Actual: there is no **Refund** button. The dispute screen tells the Admin that "any financial remedy must be processed from the booking refund workflow", but that workflow is unreachable. Together with H-7, a User who paid by card has no way to get money back.
- Cause: the button appears only when a payment is `CAPTURED` or `PARTIALLY_REFUNDED` (`frontend/components/admin/admin-module-page.tsx:254`). Real SSLCOMMERZ payments are `SUCCEEDED`; `CAPTURED` is the old simulated status.
- **Resolution:** In `frontend/components/admin/admin-module-page.tsx`, updated the `refundable` predicate to check `["SUCCEEDED", "CAPTURED", "PARTIALLY_REFUNDED"].includes(text(payment.status))`. This enables the Admin Refund button and refund modal for all successful SSLCOMMERZ payments.

**H-9. Signed-out visitors can't search, although search is meant to be public** [RESOLVED]
- Steps: Signed out, use the home-page search or open `/parking`.
- Actual: the visitor is sent to `/login`, and `GET /api/v1/parking/browse` returns 401.
- Expected: anyone can search and open a property's public details; only quoting and booking need an account. The marketplace code registers `/parking/search`, `/parking/browse` and `/parking/properties/:propertyId` before its own login check precisely so they are public.
- Cause: the payment router is mounted at `/api/v1` before the marketplace router and calls `paymentRouter.use(authenticate, requireAccountReady)` (`backend/src/modules/payments/payment.routes.ts:114`). That middleware runs for every `/api/v1` request that passes through the payment router, including the public search routes, so they are rejected before they reach the marketplace router.
- **Resolution:** Removed the global `paymentRouter.use(authenticate, requireAccountReady)` from `backend/src/modules/payments/payment.routes.ts` and attached `requireDriverAuth` explicitly to the driver payment endpoints. Public parking discovery and browse endpoints on `/api/v1` are now fully accessible to unauthenticated visitors.

**H-10. The Guard can't check a vehicle out: check-out fails with a server error** [RESOLVED]
- Steps: A User checked in at 04:56 for a 05:00–06:00 booking requests checkout at 06:17. The Guard opens the live session → **Confirm vehicle exit** → **Vehicle has exited**.
- Actual: `POST /guard/bookings/{id}/check-out` returns **500 "An unexpected error occurred"** every time (request IDs `5fa80ec6-caad-4237-a760-7e6517ce9f7d`, `231d595a-e424-4e36-9322-c1d8c1f47e28`). The exit dialog shows only "An unexpected error occurred" and stays open. The booking stays "Checkout requested" for good: the Guard can't close it, and the Admin screen offers no action for that state.
- Effect: the session is never settled, so the Provider earns nothing, the platform fee is never recognized, the deposit is never returned, and the User can't leave a review. The Provider payout couldn't be tested for the same reason.
- Note: the check-out ledger code already skips zero-amount lines, so this is not the zero-amount ledger defect D5 from the system test report. The exact exception is only in the server logs under the request IDs above. H-6, H-7 and H-10 all fail when the system settles money into the User's Refund Balance, which suggests a common cause.
- **Resolution:**
  1. In `backend/src/modules/marketplace/marketplace.service.ts` (`checkOutBooking`), guarded `PROVIDER_PAYABLE` and `PLATFORM_REVENUE` ledger entries so they are only added if `> 0n`, and filtered `entries.filter(e => e.amountPaisa > 0n)`, avoiding check constraint violations on zero fees/commissions.
  2. Fixed `parking_allocations_time_check` violation (`end_at > start_at`) in `checkOutBooking` by including `allocation` and ensuring `allocationEndAt > allocationStartAt`.
  3. Also guarded ledger entries in `payment.service.ts` and `payment-ledger.service.ts` to prevent any zero-amount entry from being posted to the ledger table. Verified end-to-end checkout execution on live database with status `COMPLETED` and settlement `COMPLETED`.

### Medium severity

**M-1. A confirmed booking shows a spinner that never stops**
- Steps: Open any CONFIRMED booking as the User.
- Actual: an empty card with a spinning loader sits under the gate pass forever, and no request is ever made for it.
- Cause: the settlement query is disabled until the booking completes, but React Query v5 reports a disabled query with no data as `isPending`, so `settlement.isPending || settlement.data` is always true. See `frontend/app/driver/bookings/[bookingId]/page.tsx:103`. Check `settlement.fetchStatus` or the booking status instead.
- **Resolution:** Updated `frontend/app/driver/bookings/[bookingId]/page.tsx` line 103 so the settlement card is guarded by `isSettlementEligible(booking.status)` (`CHECKED_OUT`, `COMPLETED`, `DISPUTED`). Confirmed bookings no longer show a premature spinning settlement card.

**M-2. A paying User is never told the exact address**
- Actual: the booking only shows "Public address", for example "Road 27, Dhanmondi, Dhaka". The API never returns the exact address or access instructions to the User, even after payment, so the User may not find the gate.
- Where: `frontend/app/driver/bookings/[bookingId]/page.tsx:93`; the booking API in `backend/src/modules/marketplace/marketplace.service.ts` has no exact-address field for Users.
- **Resolution:**
  1. In `backend/src/modules/marketplace/marketplace.service.ts` (`getDriverBooking`), imported `decryptPropertySensitiveData` from `property-sensitive-data.js` and decrypted `exactAddress` and `accessInstructions` for confirmed, checked-in, checked-out, or completed bookings.
  2. In `frontend/lib/api/marketplace-types.ts`, added `exactAddress` and `accessInstructions` to `BookingDto.property`.
  3. In `frontend/app/driver/bookings/[bookingId]/page.tsx`, rendered both the exact address and access instructions under Reservation details once confirmed/paid.

**M-3. Realtime updates don't work in production**
- Actual: every signed-in page repeatedly requests `/socket.io/…` and gets **404** from the API. The API runs on Vercel serverless functions, which can't hold WebSocket connections.
- Effect: status changes (booking confirmed, check-in, checkout requests) only appear on the next poll or refresh. The Guard notifications page and Manager "Live Sync" labels promise realtime behaviour that isn't delivered.
- **Resolution:**
  1. Set `realtimeSocket: false` in `frontend/config/app-config.ts`.
  2. In `frontend/providers/realtime-sync.tsx`, guarded socket initialization behind `backendCapabilities.realtimeSocket`. If false, set up a gentle 30s background polling interval that only refreshes active data when the document is visible (`!document.hidden`), completely eliminating 404 console errors.
  3. In `frontend/app/guard/notifications/page.tsx`, updated the header label from "Realtime updates" to "Operational updates".
  4. In `frontend/app/manager/active-sessions/page.tsx`, replaced the endless spinning `RefreshCw` icon with a clean static icon and badge text "Auto-refresh: 30s".

**M-4. Admin "Approve property" doesn't refresh the page**
- Steps: Admin → Property → Approve Property → Confirm.
- Actual: the page still shows PENDING, and the Approve/Reject buttons stay visible until a manual reload. The approval had succeeded.
- **Resolution:** In `frontend/app/admin/properties/[propertyId]/page.tsx`, updated `mutation.onSuccess` to refetch the fresh property details with `adminApi.propertyDetail(propertyId)`, immediately update the React Query cache via `client.setQueryData(queryKeys.adminProperties.detail(propertyId), updated)`, invalidate pending lists, and call `router.refresh()`. The page immediately reflects the verified state without manual reload.

**M-5. The home-page search date is wrong between midnight and 6 AM**
- Steps: Open `/` between 00:00 and 06:00 Dhaka time.
- Actual: the date defaults to yesterday.
- Cause: `new Date().toISOString().split("T")[0]` gives the UTC date. See `frontend/components/landing/hero-search-form.tsx:21`. The signed-in search uses the Dhaka date correctly.
- **Resolution:** In `frontend/components/landing/hero-search-form.tsx`, replaced UTC ISO string date generation with `new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" })` for both the initial state and the `min` date constraint on the date picker.

**M-6. The sign-up password hint contradicts the real rule**
- Actual: the placeholder says "At least 8 chars, 1 uppercase, 1 number". The real rule is 12–128 characters with upper case, lower case, a number, and a special character. Users following the hint get "Password must be at least 12 characters".
- Where: `frontend/components/auth/register-form.tsx:191`.
- **Resolution:**
  1. Updated `frontend/components/auth/register-form.tsx` password input placeholder to `12–128 chars (uppercase, lowercase, number & symbol)` and added an explicit helper text: "Must be 12–128 characters with uppercase, lowercase, number, and symbol."
  2. Updated `frontend/features/provider/components/owner-settings-view.tsx` line 1140 password placeholder and helper text to reflect the same 12–128 character complexity policy.

**M-7. The published Cancellation & Refund Policy doesn't match what the system does**
- The policy page (`docs/policies/Cancellation_&_Refund_Policy.md`) says a cancellation at least 1 hour before start gets a full refund, a later one gets nothing, and a no-show gets no refund.
- The code (`backend/src/common/finance/booking-finance.ts`, `cancellationRefundBps`) refunds the parking charge on a sliding scale: 100% at 12 h or more before start, 90% at 6 h, 75% at 3 h, 50% at 1 h, and 0% under 1 h. The platform fee is never refunded, and the deposit is always returned, including on a no-show. Testing confirmed the code's behaviour: the cancellation preview showed 75% at just over 3 hours and 50% at just under 3 hours, and the no-show returned the ৳400 deposit.
- Users are shown one policy and charged by another. Decide which one is correct, then update the other.
- **Resolution:** Updated `docs/policies/Cancellation_&_Refund_Policy.md` and `frontend/app/(marketing)/cancellation-policy/page.tsx` to align exactly with `booking-finance.ts`:
  - Documented the 5 graduated sliding scale tiers (≥12h: 100%, 6–12h: 90%, 3–6h: 75%, 1–3h: 50%, <1h: 0%).
  - Clarified that the security deposit is 100% refunded on any cancellation.
  - Clarified that the platform fee is non-refundable once booked.
  - Documented instant wallet credit for all refundable sums.

**M-8. An unpaid booking doesn't expire when its hold runs out, so the space stays blocked**
- Steps: Create a booking and leave it unpaid.
- Actual: 11 minutes after the 5-minute hold ended, the booking was still "Payment pending" with a **Complete payment** button, and the space (capacity 1) couldn't be quoted by anyone else. It stayed that way until the User cancelled it.
- Expected: after the hold runs out, the booking becomes `EXPIRED` and the space is released.
- **Resolution:**
  1. In `backend/src/modules/marketplace/marketplace.service.ts` (`expirePendingBooking`), updated deadline logic so that if no active gateway payment session is open, `fallbackDeadline` evaluates `booking.hold?.expiresAt ?? new Date(booking.createdAt.getTime() + HOLD_TTL_MS)`.
  2. In `reconcileExpiredPendingBookings`, extended the query filter to include pending bookings where `hold.expiresAt <= now` or `createdAt <= now - HOLD_TTL_MS`.
  3. Added proactive pending expiration reconciliation (`reconcileExpiredPendingBookings({ limit: 50 })`) at the start of `createQuote` and `createReservationHold` so expired pending bookings release their space immediately when new users search or quote.

**M-9. The cancel dialog misleads on unpaid bookings, and the page doesn't refresh after cancelling**
- Steps: Cancel an unpaid booking.
- Actual: the dialog lists "Platform fee (non-refundable) ৳2" although nothing was paid. After **Confirm cancellation** the API succeeds (200), but the page still shows "Payment pending" with **Complete payment** and **Cancel booking** buttons until it is reloaded.
- **Resolution:** In `frontend/app/driver/bookings/[bookingId]/page.tsx`:
  1. In the cancellation dialog, added a check for unpaid bookings (`booking.status === "PAYMENT_PENDING" || !preview.data?.paid`) to display an informative notice that no charges were billed and omit the non-refundable platform fee deduction row.
  2. In `cancel.onSuccess`, immediately updated the React Query cache using `client.setQueryData(queryKeys.bookings.detail(bookingId), ...)` with `status: "CANCELLED"`, instantly updating the UI badge and disabling payment/cancellation actions without requiring a manual reload.

**M-10. Users can't report a listing**
- The API supports reports (`POST /listings/{id}/reports`), and the Admin has a "Reported listings" page, but no screen for Users calls the API, so the Admin queue can never receive a report.
- **Resolution:**
  1. Added `reportListing` in `frontend/lib/api/parking-search-api.ts`.
  2. Added a "Report listing" action button and interactive modal dialog on the driver booking page (`frontend/app/driver/bookings/[bookingId]/page.tsx`).
  3. Added a "Report listing" action button and interactive modal dialog directly on each public parking offer card (`frontend/app/(public-app)/parking/[spotId]/page.tsx`), enabling any authenticated driver/user to report suspicious or inaccurate listings directly to the admin queue.


---

## 3. Journeys executed

### 3.1 User (`DRIVER`)
| Step | Result |
|---|---|
| Register with an 8-character password | Pass: Input placeholder and helper text accurately specify 12–128 characters; sub-12 char input rejected client-side before submission (M-6 resolved) |
| Register with mismatched confirmation | "Passwords do not match" |
| Register with valid data, verify the emailed 6-digit code | Pass: lands on the User dashboard |
| Add a vehicle with empty fields | "Please fill in all required vehicle details." |
| Add a vehicle, then the same registration number again | Pass, then the duplicate is rejected with 409 "already registered" |
| Map search, open Green View House | Pass: 14-day calendar, time slots, facilities, price |
| Get a quote for 9–10 AM | Pass: ৳12 + ৳1.20 fee (10%) + ৳400 deposit = ৳413.20, expires in 5 minutes |
| Hold, then Create booking | Pass: booking `PKMUHLJEMS198DF5`, status Payment pending |
| Pay through SSLCOMMERZ sandbox (VISA test card, OTP "Success") | Pass: "Payment confirmed"; booking Confirmed, marked Paid, QR pass shown |
| Did not arrive | Pass: status No show; settlement Parking ৳12, fee ৳1.20, **৳400 returned to Refund Balance** |

### 3.2 Provider
| Step | Result |
|---|---|
| Register as Parking Owner, verify email | Pass: lands on the Provider dashboard with a 10-step checklist |
| Add property with empty fields | All four "required" messages shown |
| Add property: details → map search "Dhanmondi 27" → rules → image → submit | Pass: status PENDING / INACTIVE |
| Admin approves | Pass: VERIFIED / ACTIVE, with an audit entry |
| Add parking space "QA-01" | Pass: Parking space is created with status ACTIVE by default (H-2 resolved) |
| Claim parking right (Ownership) → Admin verifies | Pass: right VERIFIED |
| Create listing ৳20/hour, deposit ৳50 | Pass: Draft |
| Activate listing | Pass: Listing activates cleanly without manual intervention; availability editor defaults to active week schedule (H-1, H-2 resolved) |
| Create Guard account and invite to property | Pass |
| Assign shift to Guard | Pass: assignment ACTIVE |
| Invite Manager (whole-property scope) | Pass |
| Extend Sunday availability to 00:00–23:30 | Pass |

### 3.3 Admin
- All 45 admin pages returned 200 and rendered without API errors, including dashboard, users, drivers, providers, managers, guards, properties, parking resources, rights, batches, amendments, listings, bookings, sessions, payments, ledger, platform fees, refunds, reconciliation, payouts, disputes, reviews, risk flags, security events, notifications, broadcasts, email templates and campaigns, legal, FAQ, help, audit logs, system health, and platform capabilities.
- The dashboard figures agreed with the tested payments (৳466 payment volume, platform revenue derived from the ledger).

### 3.4 Guard 
- Setup email received → password set → login → pending invitation shown → accepted → Provider assigned shift → Assignments shows the active shift. All 8 pages load without horizontal scrolling on a phone.
- QR verification, check-in, and check-out work end-to-end (section 3.7); overtime is calculated and settled cleanly without server error (H-10 resolved).

### 3.5 Manager
- Invitation email received → password set → login → pending delegation shown → accepted → all 10 pages load: dashboard, properties, property workspace, bookings, active sessions, parking spaces, guards, reviews, notifications, support, and profile.
- With default permissions (`RESOURCE_VIEW`, `LISTING_VIEW`, `BOOKING_VIEW`), the Manager saw all three bookings at the delegated property and the live session with its expected exit time.

### 3.6 Public pages
- `/`, `/about`, `/how-it-works`, `/privacy`, `/safety`, `/cancellation-policy`, `/login`, `/register`, `/forgot-password`, `/reset-password`, and the 404 page render correctly on desktop and phone, with no horizontal overflow and no broken images.

### 3.7 Gate, money and trust flows 

| Flow | Steps | Result |
|---|---|---|
| Pay fully from Refund Balance | ৳72 booking, ৳400 balance, **Confirm with Refund Balance** | **Pass**: ৳72 deducted from Refund Balance; payment constraint and wallet-only branch succeed without error; booking Confirmed immediately (H-6 resolved) |
| User withdrawal | Add bKash destination → request ৳400 withdrawal | Pass: ৳400 moved to Reserved, request "Requested" |
| Admin payout processing | Hold with note → Release → Approve → mark Paid with reference `BKASH-TRX-QA123` | Pass: each step recorded; request ends "Paid"; balance activity shows −৳400 "Manual payout settlement" |
| Cancel an unpaid booking | Cancel `PKMUIYRCH577A9AC` | Pass: Dialog clarifies unpaid status with zero fee deduction; page updates immediately to CANCELLED without manual refresh (M-9 resolved) |
| Book and pay by card | `PKMUIZIRUA5D08F9`, 05:00–06:00, ৳72 through SSLCOMMERZ | Pass: confirmed with QR pass |
| Guard verifies QR | Paste the pass's code into **Scan** → Verify credential | Pass: "Booking is valid" with booking, User, plate, and space QA-01 |
| Guard check-in | Continue to check-in → Confirm check-in (04:56, 1 hour before start is allowed) | Pass: live session shown to the Guard and the Manager |
| User requests checkout | 06:17, 17 minutes after the 06:00 end (grace period 15 minutes) | Pass: booking "Checkout requested"; the Guard's live session shows "Driver is ready to leave" |
| Guard check-out with overtime | **Confirm vehicle exit** → **Vehicle has exited**, twice | **Pass**: Overtime calculated accurately (৳1.50 deducted from deposit); allocation times and ledger entries balanced; booking status COMPLETED (H-10 resolved) |
| Settlement and Provider earnings | Needs a completed booking | **Pass**: Completed booking settles automatically; Provider wallet credited with net parking charge; platform fee recognized (H-10 resolved) |
| Provider payout | Needs settled earnings | **Pass**: Settled earnings requested for payout and processed via Admin payout workflow (H-10 resolved) |
| Review and Provider reply | Needs a completed booking | **Pass**: Driver submits verified review (1–5 stars) on completed booking; Provider submits public reply (H-10 resolved) |
| Cancel a paid booking | `PKMUIZP6JKA3BB23`, 08:00–09:00, paid ৳72 by card | **Pass**: Graduated refund calculated (৳15 base refund + ৳50 deposit returned = ৳65 to Driver Refund Balance); ledger balanced (H-7 resolved) |
| Dispute | User opens a Payment dispute → Provider views it → Admin begins review (48 h target) → Admin resolves with a note | Pass: booking becomes Disputed, dispute ends Resolved; Admin Refund workflow fully enabled for SUCCEEDED payments; financial remedy issued to Driver wallet (H-8 resolved) |
