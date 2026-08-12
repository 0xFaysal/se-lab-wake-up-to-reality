# ParkEase API

ParkEase BD backend built with Node.js, Express, TypeScript, Prisma,
PostgreSQL, and Redis.

## Requirements

- Node.js 22 LTS or newer
- Docker Desktop
- npm

## Setup

```powershell
Copy-Item .env.example .env
npm install
docker compose up -d
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npm run dev
```

The API runs at `http://localhost:4000` by default.

## API documentation

Interactive OpenAPI documentation is available when `ENABLE_API_DOCS=true`:

- Swagger UI: `http://localhost:4000/api-docs`
- OpenAPI JSON: `http://localhost:4000/api-docs.json`

The docs use HTTP-only cookie authentication. Run register or login from
Swagger UI first; the browser will retain the cookies for protected requests.
Set `API_PUBLIC_URL` when the API is exposed through another host or proxy.
Set `ENABLE_API_DOCS=false` in production when public API documentation is not
required.

Swagger UI cannot manually create an HTTP-only cookie. Keep the UI and API on
the same origin, then use register or login before testing protected routes.
The requests in `test-api/auth.http` remain the more reliable option for full
authentication-flow testing in VS Code REST Client.

## Required environment

Set unique secrets of at least 32 characters for `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `VERIFICATION_CODE_SECRET`, and
`AUTH_METADATA_HASH_SECRET`. `JWT_REFRESH_SHORT_DAYS` controls normal sessions and
`JWT_REFRESH_LONG_DAYS` controls sessions created with `rememberDevice: true`.
See `.env.example` for the complete configuration.

Generate each secret independently; do not reuse output between variables:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Property exact addresses and access instructions use AES-256-GCM. Generate the
required 32-byte encryption key separately and store it as
`DATA_ENCRYPTION_KEY`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Changing or losing this key makes existing protected Property data impossible
to decrypt. Keep it in the production secret manager and back it up securely.

Property images are stored through Cloudinary. Configure
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
All three values are required in production and are used only by the backend.
Uploads accept JPEG, PNG, and WebP files, enforce a 5 MB per-file limit and a
10-image per-Property limit, verify file signatures, and strip embedded image
profiles during storage.

Email verification uses Gmail SMTP through Nodemailer. Configure `EMAIL_HOST`,
`EMAIL_PORT`, `EMAIL_USERNAME`, and `EMAIL_PASSWORD`. For Gmail, use a dedicated
Google App Password; the account must have 2-Step Verification enabled. Do not
use the account's normal password.

Phone verification uses Twilio Programmable Messaging. Configure
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Keep
`EXPOSE_DEVELOPMENT_AUTH_CODES=false` outside local or automated testing; the
application rejects enabling it in production. Set `TRUST_PROXY_HOPS` only to
the exact number of trusted reverse proxies in front of Express.

## Health endpoints

- `GET /health/live`
- `GET /health/ready`

## Authentication endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/change-initial-password`
- `POST /api/v1/auth/request-password-reset`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/email-verification/request`
- `POST /api/v1/auth/email-verification/confirm`
- `POST /api/v1/auth/phone-verification/request`
- `POST /api/v1/auth/phone-verification/confirm`

## Account endpoints

- `POST /api/v1/users/guards` (verified Parking Owner or Admin)
- `POST /api/v1/users/me/change-password`
- `GET /api/v1/users/me/sessions`
- `DELETE /api/v1/users/me/sessions/:sessionId`

## Vehicle endpoints

All Vehicle endpoints require an authenticated, ready `DRIVER`. Email
verification is mandatory and phone verification is optional:

- `POST /api/v1/vehicles`
- `GET /api/v1/vehicles`
- `GET /api/v1/vehicles/:vehicleId`
- `PATCH /api/v1/vehicles/:vehicleId`
- `PATCH /api/v1/vehicles/:vehicleId/default`
- `DELETE /api/v1/vehicles/:vehicleId`

The project schema uses `MOTORCYCLE`, `SEDAN`, `SUV`, and `MICROBUS`, with
optional dimensions in centimeters. Registration numbers are globally unique
after case, whitespace, and dash normalization. The first active vehicle is the
default; deleting a default promotes the newest remaining active vehicle.

## Parking Owner property endpoints

All Property endpoints require an authenticated, ready `PARKING_OWNER`.
Email verification is mandatory; phone verification is optional:

- `POST /api/v1/owner/properties`
- `GET /api/v1/owner/properties`
- `GET /api/v1/owner/properties/:propertyId`
- `PATCH /api/v1/owner/properties/:propertyId`
- `DELETE /api/v1/owner/properties/:propertyId`

New properties start as `PENDING` and `INACTIVE`. Exact addresses and access
instructions are encrypted at rest. List responses use a summary DTO without
private fields; owner detail responses decrypt them. Critical location edits
invalidate a previous verification, while owners cannot submit verification,
review, ownership, or operational fields. All reads and writes are owner-scoped,
soft-deleted properties are hidden, and existing Spot or Guard dependencies can
block deletion.

## Property image endpoints

These routes use the same ready `PARKING_OWNER` authorization as Property CRUD:

- `POST /api/v1/owner/properties/:propertyId/images`
- `GET /api/v1/owner/properties/:propertyId/images`
- `PATCH /api/v1/owner/properties/:propertyId/images/reorder`
- `DELETE /api/v1/owner/properties/:propertyId/images/:imageId`

The first image becomes the cover. Reordering must include every current image
exactly once and can select a new cover. Image responses expose the secure URL
but never the Cloudinary public ID or credentials. Automated tests replace the
Cloudinary adapter and never call the real service. A Property with images must
remove them before Property soft deletion. Removing the final image from a
verified Property returns it to `PENDING/INACTIVE` for review.

## Admin Property verification endpoints

These routes require an authenticated, ready `ADMIN`:

- `GET /api/v1/admin/properties/pending?page=1&limit=20`
- `GET /api/v1/admin/properties/:propertyId`
- `PATCH /api/v1/admin/properties/:propertyId/verification`

Admin detail decrypts private Property data server-side. Approval requires a
ready Parking Owner, valid protected location data and at least one image, then
transitions `PENDING/INACTIVE` to `VERIFIED/ACTIVE`. Rejection requires a reason
and transitions to `REJECTED/INACTIVE`. Property-level locks and conditional
updates prevent concurrent Admin decisions or Owner edits from overwriting one
another.

## Guard assignment endpoints

Owner routes require a ready `PARKING_OWNER` and expose only assignments for
Properties owned by that user:

- `POST /api/v1/owner/properties/:propertyId/guard-invitations`
- `GET /api/v1/owner/guard-assignments`
- `GET /api/v1/owner/guard-assignments/:assignmentId`
- `PATCH /api/v1/owner/guard-assignments/:assignmentId`
- `DELETE /api/v1/owner/guard-assignments/:assignmentId`

Guard routes expose only assignments addressed to the authenticated Guard:

- `GET /api/v1/guard/assignments`
- `GET /api/v1/guard/assignments/:assignmentId`
- `POST /api/v1/guard/assignments/:assignmentId/accept`
- `POST /api/v1/guard/assignments/:assignmentId/reject`

Only verified, active Properties can invite an existing global Guard identity.
Owner DTOs mask Guard email and phone values. An accepted shift change returns
the assignment to `PENDING_ACCEPTANCE`; suspend and resume affect only that
Property assignment and never the global Guard account. Conditional updates and
the database partial unique index protect state transitions and duplicate
invitations under concurrency. Cross-Property shift collision detection is
deferred until date and weekday scheduling is introduced.

Authentication uses `httpOnly` cookies. Browser clients must send requests with
`credentials: "include"`.

Registration creates a `PENDING` account and an authenticated session, so the
user does not log in again. The response `nextAction` moves through
`VERIFY_EMAIL`, then `null`. Operational routes require an active account with
mandatory email verification; phone verification remains available as an
optional account-strengthening step.

Email verification, password reset, and Guard invitations are delivered through
SMTP. Phone verification is delivered through Twilio. Only HMACs of OTP codes
and hashes of reset and refresh tokens are stored. Refresh tokens rotate on every
use; detected replay revokes the user's active session family.

Browser state-changing requests are protected by same-origin checks in addition
to `SameSite=Lax` HTTP-only cookies. Redis-backed rate limits are shared between
API instances and fail closed if Redis is unavailable.

## Seed

The seed creates the configured admin, required legal documents, and parking
facilities. Admin credentials come from `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PHONE`, and `SEED_ADMIN_PASSWORD`. The password is never printed.

## Quality checks

```powershell
npm run typecheck
npm run test
npm run build
npm run format:check
```

The integration suites require a separate, migrated PostgreSQL database in
`TEST_DATABASE_URL` plus Redis. They create and remove only their own random
test records:

```powershell
npm run test:integration
```

Manual API requests are available in `test-api/*.http` for the VS Code REST
Client extension. Property image multipart examples reference local files under
`test-api/fixtures/`.
