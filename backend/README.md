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

Set different secrets of at least 32 characters for `JWT_ACCESS_SECRET` and
`JWT_REFRESH_SECRET`. `JWT_REFRESH_SHORT_DAYS` controls normal sessions and
`JWT_REFRESH_LONG_DAYS` controls sessions created with `rememberDevice: true`.
See `.env.example` for the complete configuration.

Email verification uses Gmail SMTP through Nodemailer. Configure `EMAIL_HOST`,
`EMAIL_PORT`, `EMAIL_USERNAME`, and `EMAIL_PASSWORD`. For Gmail, use a dedicated
Google App Password; the account must have 2-Step Verification enabled. Do not
use the account's normal password.

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

- `POST /api/v1/users/me/change-password`
- `GET /api/v1/users/me/sessions`
- `DELETE /api/v1/users/me/sessions/:sessionId`

Authentication uses `httpOnly` cookies. Browser clients must send requests with
`credentials: "include"`.

Email verification is delivered through Gmail. Password-reset delivery and SMS
delivery are foundations only. Development responses expose reset tokens and
verification codes; production responses never expose them. Connect dedicated
transactional email and SMS providers before a higher-volume production launch.

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

The integration suite requires a separate, migrated PostgreSQL database in
`TEST_DATABASE_URL` plus Redis. It creates and removes only its own random test
user:

```powershell
npm run test:integration
```

Manual API requests are available in `test-api/auth.http` for the VS Code REST
Client extension.
