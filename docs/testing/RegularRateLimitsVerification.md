# Regular-use Rate Limits

Verified locally on 2026-10-04.

## Root Cause

Driver listing-location reads used the shared sensitive-account bucket: five requests per account and 30 per IP every 15 minutes. Browsing multiple properties consumed the same quota as security and financial actions.

## Updated Policies

| Route | Per account | Per IP | Window | Independent Redis bucket |
| --- | --- | --- | --- | --- |
| GET /api/v1/driver/listings/:listingId/location | 120 | 600 | 1 minute | driver-location-read |
| PATCH /api/v1/users/me/profile (full name only) | 30 | 150 | 15 minutes | profile-update |
| Existing sensitive-account actions | 5 | 30 | 15 minutes | sensitive-account (unchanged) |

Both account and IP limits apply. Windows begin with the first request; rejected requests do not extend expiry. RateLimit headers and Retry-After remain available. No keys were cleared and no authentication, consent, role checks or fail-closed Redis behavior was removed. The new bucket is independent of any exhausted old sensitive bucket.

Other ordinary search/detail/list routes that already have no application-level limiter were left unchanged. Login, registration, refresh, verification, invitations, password changes, financial and Admin operations retain their existing policies. Infrastructure limits are outside this change.

## Verification

- Isolated backend TypeScript compilation: passed.
- Three policy tests: passed (window, account/IP identities, limits, and bucket isolation).
- Standard backend test command includes the new tests.
- Authorized Driver browser on localhost: initial page plus six consecutive reloads, each completing the location-consent check without a 429 message.
- Provider consent remains enforced: location was correctly withheld, not exposed to bypass the limit.
- No profile write, financial action or database record mutation was performed for verification.
- Screenshot: `evidence/location-rate-limit-normal-use.jpg`.

Quota-boundary/load tests against shared Upstash were not run. Tests cover policy configuration; browser checks cover normal use beyond the old five-request limit.
