# Booking Grace Verification

Date: 2026-10-04. Target: localhost frontend and API; shared Supabase database.

## Implemented

- Five-minute early QR entry in both scan validation and transactional check-in, with physical occupancy and existing authority checks.
- New quotes/bookings snapshot policy version 2 with fixed five-minute free exit.
- Beyond five minutes, elapsed overtime includes the initial grace; two minutes are deducted at actual guard checkout. Exact money and existing deposit/wallet settlement remain server-owned.
- Provider timeline shows planned entry/exit grace, compact 68px baseline rows and 28px segments, proportional widths, tooltips and accessible labels. Shared-pool slot ordinal no longer inflates occupancy.
- Driver quote/booking and Guard session disclose the saved policy. Provider/Manager listing controls fix new-booking grace at five minutes.
- New reservation allocations protect grace intervals; open physical stays remain occupied past their scheduled end.

## Verification

- Backend build and full TypeScript compilation passed.
- Backend compiled unit suite: 167 passed, including entry boundaries, midnight, legacy grace, planned timeline grace, new fixed-rate/multiplier overtime, exact five-minute threshold, rounding and settlement conservation.
- Frontend unit suite: 62 passed. Frontend TypeScript and targeted ESLint passed.
- Local browser: real ten-unit timeline renders entry grace, reservation and saved exit grace; detail drawer shows 13:55 entry for 14:00 arrival. Existing paid reservation retains its original 15-minute exit grace.
- At 390px, mobile defaults to the readable list. Explicit Timeline toggle works and document scroll width stays within the viewport. Temporary viewport override was reset.
- Additive migration `20261004090000_snapshot_overtime_grace_policy` applied and Prisma history marked. Both policy columns default to version 1; existing 14 bookings remain version 1. No existing financial amounts were changed.
- Supabase security advisors report existing informational RLS-enabled/no-policy findings; no new table, grant or exposure was introduced.

## Limits

### Timeline Readability Follow-Up

- Changed timeline axis, bars, lists, tooltips and drawer to Dhaka AM/PM times. Compact hour-axis ticks avoid collisions and align with the true time coordinate.
- Added exact reservation timing summary with entry/exit grace durations and saved-policy label. Grace stripes no longer include horizontal padding that could visually exaggerate short periods.
- Added tests for noon/midnight, legacy five-versus-fifteen-minute labels and equal proportional widths. Frontend suite now has 64 passing tests; targeted lint and typecheck pass.
- Local browser confirms the existing booking is 1:55-2:00 PM entry grace (5 minutes), 2:00-5:00 PM reserved, and 5:00-5:15 PM exit grace (15 minutes, saved policy). No booking, payment or financial data changed.

- No real payment, checkout, refund or wallet mutation was triggered for verification. QR timing and monetary boundary tests are automated, not a live gate/payment exercise.
- No production app deployment was performed. Existing bookings are intentionally not repriced to policy 2.
