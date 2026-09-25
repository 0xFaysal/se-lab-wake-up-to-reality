# ParkEase BD UX Contract

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

| Flow | Entry | Completion | Failure recovery |
| --- | --- | --- | --- |
| Booking payment | Server quote | Booking confirmed | New gateway attempt with a fresh idempotency key |
| Cancellation | Eligible paid booking | Wallet credit and released allocation | Preview remains visible with server error |
| Checkout | Guard-confirmed vehicle exit | Completed settlement or `PAYMENT_DUE` | Driver pays the exact outstanding server amount |
| Withdrawal | Available wallet balance | Admin-recorded external transfer | Rejection releases the reserved balance |
