# Parking Location Disclosure Verification

Date: 2026-10-04. Target: local application, existing shared Supabase database.

## Changes

- Public search maps identify grid-rounded coordinates as approximate areas, with a 40-metre dashed area indicator rather than an implied exact entrance. The user requested this smaller area after reviewing the original 800-metre display. A 50-metre metric grid keeps the actual location within that area; exact coordinates remain restricted. This finer public grid reduces location privacy compared with the earlier neighbourhood grid.
- Offer creation and booking settings include explicit, default-off Provider consent for pre-booking location disclosure.
- A Driver-only endpoint requires an active, email-verified account and an active offer with effective commercial rights, active resource/unit and verified property. Responses are private/no-store and contain only property identity and coordinates.
- The Driver checkout shows actual location when allowed, loading/error recovery, or an explicit warning when only the approximate area is available. Existing booking eligibility and financial calculations remain unchanged.
- Duplicate-discovery empty copy explicitly describes its 75-metre search scope.

## Verification

- Frontend tests: 70 passed, including explicit consent and preservation by unrelated forms.
- Frontend lint and typecheck: passed.
- Backend typecheck: passed. Isolated TypeScript compilation: passed.
- Compiled marketplace/privacy validation tests: 25 passed (includes public-data tests imported by the marketplace suite and run separately).
- Local unauthenticated location request: HTTP 401.
- Database: consent column added with default false; all three existing offers remain opted out. No Provider consent, bookings, payments or balances modified.
- Local Provider property page rendered successfully. Further browser interaction was blocked by the browser security policy, so completed desktop/mobile UI acceptance and a consent-enabled end-to-end Driver view are not claimed.

## Limitations

The standard backend test command cannot start in this Windows execution environment because the tsx runner encounters uv_os_get_passwd ENOMEM. Focused compiled tests were used instead; live-database integration tests were not run. No deployment or frontend production build was performed. The idempotent local Prisma migration still needs to pass through the normal migration deployment workflow to record it in Prisma history; the column was applied through Supabase's migration tool.

Provider consent must be enabled by the Provider, not by an automatic data backfill. Approximate public location is still not suitable for navigation to an entrance. Actual map rendering uses OpenStreetMap tiles; its external link opens only when the Driver clicks it.
