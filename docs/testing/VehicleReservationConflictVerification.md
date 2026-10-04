# Vehicle Reservation Conflict Verification

Verified locally on 2026-10-04.

## Change

- Vehicle-wide conflict checks at quote, temporary hold and booking creation, independent of property, spot or provider.
- Pending-payment, confirmed, checked-in and checkout-requested bookings block overlapping scheduled intervals. Completed, cancelled and no-show bookings do not.
- Active, unexpired temporary holds block conflicting requests. Booking conversion excludes its own hold.
- Intervals are half-open: a booking ending exactly when another starts is not an overlap. Existing spot grace/capacity rules still apply separately.
- Hold and booking creation use a vehicle-scoped PostgreSQL transaction advisory lock inside existing serializable transactions. The unique normalized registration number already ensures one vehicle record per plate.
- Hold idempotency is rechecked after the vehicle lock.
- No existing booking, payment or balance was changed.

## Results

- Backend TypeScript compilation: passed, isolated output in `.verification/vehicle-conflict`.
- Compiled marketplace validation, public-data and vehicle-reservation tests: 32 passed, zero failed.
- New tests are included in the standard backend test command.
- Local browser: authorized Driver selected its existing vehicle for Ababil Villa on Oct 6, 08:30-10:00 Asia/Dhaka. Quote rejected with: "This vehicle already has a booking or temporary reservation during these times. Choose a different vehicle or time."
- No successful hold, new booking or payment was created during browser verification.
- Evidence: `evidence/vehicle-overlap-rejected.jpg`.

## Limits

- Historical overlapping paid bookings are not automatically cancelled or refunded.
- Database concurrency stress/integration tests were not run against the shared live database. Locking and serializable isolation were inspected, but concurrent requests were not exercised end to end.
- Unscheduled overtime beyond the stored booking end remains governed by the existing guard/occupancy workflow; this change prevents overlapping reserved booking intervals.
