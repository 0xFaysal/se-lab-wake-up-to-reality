# ParkEase BD UX Contract

## Provider Workspace

- Canonical navigation: `frontend/components/provider/provider-navigation.ts`. Desktop and mobile share routes; legacy redirects remain.
- Working-property selectors display names, never UUID labels. A permitted explicit selection wins; otherwise the first active verified property is preferred. Query keys include scope; pending guard mutations prevent property switching and form selections reset on change.
- Profile edits only the account name through the existing API. Email/phone and verification remain read-only. Successful saves update the current-account cache. Internal link changes use the shared discard dialog; reload/leave uses the browser's before-unload protection. Browser-history navigation is a remaining acceptance-test item.
- Timeline is read-only and does not run settlement/reconciliation. Server allocations, unexpired active holds, actual check-in/out, resource status and availability rules determine occupied/scheduled gaps. Other-authority activity is anonymous. Scheduled end is not a confirmed departure.
- Grace derives from each booking's stored policy. UI does not calculate charges. The booking drawer exposes only authorized name/plate/times and the existing detail link, never access credentials or unnecessary contacts.
- Timeline query keys include property and day, pass the abort signal and reuse booking realtime invalidation. Visible-page polling is 30 seconds, with focus/reconnect refresh and a stale indicator. A refreshed drawer resolves from current data rather than keeping an old record.
- Support stays inside the Provider shell. This release's email support is preserved; no fictional ticket-tracking service is presented.

This contract records the user-interface consequences of the authoritative payment and access rules. Business calculations remain owned by the backend finance domain and Prisma schema.

## Business Sources

| Concern | Source of truth |
| --- | --- |
| Quote, wallet split, cancellation, overtime, settlement | `backend/src/common/finance/booking-finance.ts` |
| Permissions and actor boundaries | Backend route role guards and marketplace services |
| Financial records and lifecycle | `backend/prisma/schema.prisma` and financial migrations |
| Gateway confirmation | SSLCommerz server validation in the payments module |

## Money Operations

- The UI displays server-calculated integer-paisa values and never presents client calculations as authoritative.
- Refund Balance is applied before SSLCommerz. The payment summary shows both sources before confirmation.
- Paid booking funds are described as held until checkout; Provider earnings are never shown as available before settlement.
- Cancellation previews must come from the server and show booking refund, deposit return, non-refundable platform fee, and resulting wallet credit before confirmation.
- Guard checkout confirms vehicle exit only. It shows whether settlement completed or the Driver still owes an amount; it never claims Provider payment completed while the booking is `PAYMENT_DUE`.
- Withdrawal requests reserve balance immediately. Admin actions describe a real manual transfer and require an external reference before marking a payout paid.

## Interaction States

- Financial mutations disable their initiating control while pending and use idempotency keys.
- Success states show the resulting financial status, not only a toast.
- Recoverable failures retain entered values and provide a direct retry action.
- Realtime events refresh server state; polling or navigation refresh remains a valid fallback because PostgreSQL is authoritative.
- Destructive or irreversible actions use an accessible confirmation dialog with the least destructive action focused first.

## Privacy And Access

- Full bank and mobile-wallet identifiers are write-only in the UI, encrypted by the backend, and returned only as masked values.
- Driver, Provider, Guard, and Admin surfaces expose only role-authorized actions.
- Audit and transaction history use server timestamps and immutable references.

## Canonical UI Ownership

- Select/Listbox: authored shared component in `frontend/components/ui/select.tsx`; native `<select>` is not used on Guard or Provider Guard-management surfaces.
- Dialog and confirmation: authored shared Dialog/AlertDialog primitives with focus containment and Escape dismissal.
- Toast: shared Sonner host; successful access transitions also remain visible in the destination state instead of relying on a transient toast alone.
- Shift time: native time input for the simple start/end pair; the backend remains authoritative for assignment validation and timestamps.
- Guard access is a two-record handoff: a Property Guard membership is visible immediately, including while acceptance is pending; booking access requires a separate active Provider assignment.

## Flow Ledger

### Booking Grace Policy 2

- New quotes snapshot five-minute entry/exit grace and overtime policy version 2. Existing quotes/bookings retain their saved financial terms (version 1).
- Guard entry opens exactly five minutes before scheduled start. Identity, assignment, booking status and physical capacity checks still apply; an occupied spot cannot admit a second vehicle.
- Checkout through scheduled end plus five minutes has no overtime. Beyond that threshold, overtime includes the initial five minutes, less a two-minute guard-checkout allowance. Positive partial minutes round up using exact server-side money calculations.
- Example: scheduled end 09:00; checkout 09:05 is free; 09:06 has four billable overtime minutes; 09:10 has eight.
- Checkout requests do not stop overtime. The guard records actual physical exit. The provider timeline shows planned entry/exit grace before arrival and never treats a parked vehicle as departed merely because scheduled end passed.
- New allocation windows include entry/exit grace. Scheduled booking duration and base price are unchanged. Driver quotes disclose the grace/overtime rule before payment.

| Flow | Entry | Completion | Failure recovery |
| --- | --- | --- | --- |
| Booking payment | Server quote | Booking confirmed | New gateway attempt with a fresh idempotency key |
| Cancellation | Eligible paid booking | Wallet credit and released allocation | Preview remains visible with server error |
| Checkout | Guard-confirmed vehicle exit | Completed settlement or `PAYMENT_DUE` | Driver pays the exact outstanding server amount |
| Withdrawal | Available wallet balance | Admin-recorded external transfer | Rejection releases the reserved balance |

### Guided Property And Vehicle Rates

- Location is the first onboarding step. Candidate discovery uses a 75-meter geographic radius, ranked by distance after bounding-box filtering, never equal names or address fingerprints. Radius is a project heuristic, not proof of building identity. Nearby buildings require explicit user confirmation; access requests remain pending review. No automatic merging or authority grants.
- Pin changes debounce the lookup and invalidate the prior result; superseded responses cannot replace the latest candidates. Progress requires a successful check for the current coordinates. Lookup failure keeps the flow on location selection.
- Parking management has one canonical resource-centric property workspace; the legacy setup URL redirects there. A second guided wizard/advanced inventory pair must not be mounted on the same page.

- Property verification and verified, effective commercial rights remain separate security checkpoints. The guided form requests listing, price and booking rights together; it never grants or approves them itself.
- Creating real spaces and requesting authority are separate saves. If authority submission fails, retain the created inventory and expose retry; do not ask the user to recreate spaces.
- Each supported vehicle has its own single-vehicle offer using the same resource/right. Different tariffs do not increase physical capacity. Fixed-space activation and active vehicle-scope edits serialize on the resource and reject overlapping unit/vehicle offers.
- Weekly availability and rate drafts save sequentially. Partial failures retain entered fields; retry refetches saved drafts before writing more. No claim of atomic multi-endpoint persistence.
- Navigation warns about unsaved form edits; setup step/property selection is disabled while mutations are pending. New-property Back retains registered field values. Browser-history navigation is not intercepted; refresh/closing uses the browser's unsaved warning.
- Existing live/combined/specialized offers use the property workspace; the guided form must not silently replace their settings or booking snapshots. Publishing uses existing server-side eligibility checks.
- Active, paused and draft offers expose one full booking-settings editor. Shared pricing remains one offer unless separate vehicle pricing is explicitly selected. Separate pricing is written in one server transaction with exact vehicle coverage, scoped authority checks, resource-level overlap locking and optimistic version validation. Copies use the same resource/unit and settlement recipient; they never increase inventory. Bookings retain their stored financial snapshots. Ended/suspended offers remain non-editable. Opening hours save independently, preserving existing date limits.
