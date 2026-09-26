# ParkEase BD frontend

Next.js 16 App Router frontend for the ParkEase BD parking platform.

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

The frontend runs at `http://localhost:3000`; the backend defaults to `http://localhost:4000`.

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

Only the public API origin belongs in a `NEXT_PUBLIC_` variable. Never place JWTs, refresh tokens, Cloudinary secrets or database credentials in frontend environment variables.

## Authentication

Authentication is cookie based. Requests include the backend's HttpOnly access and refresh cookies; tokens are never copied into local storage or React state. `GET /auth/me` is the authoritative current-user source. A failed authenticated request performs at most one refresh attempt before redirecting to sign-in.

Account readiness is centralized in `lib/auth-routing.ts`. Protected portal layouts support current backend roles:

- Driver: `/driver/*`
- Provider UI: `/provider/*`
- Guard: `/guard/*`
- Admin: `/admin/*`
- Manager: delegated Provider UI scope

## Data architecture

- `lib/api/api-client.ts`: credentials, timeout, JSON/multipart, errors and one refresh retry
- `lib/api/*-api.ts`: typed domain endpoints
- `providers/query-provider.tsx`: TanStack Query defaults
- `lib/query-keys.ts`: shared query-key factory
- `hooks/`: server-state queries and mutations
- `config/app-config.ts`: role destinations and backend capability switches

## Integrated backend modules

- Login, registration and verification
- Initial password change and current account
- Role guards and refresh-cookie retry
- Active sessions and session revocation
- Driver vehicle list/create/delete/default
- Provider Property and Property Image API clients
- Provider/Guard assignment API clients
- Provider Manager delegation list
- Admin pending-property review and approve/reject

## Prototype-only modules

The backend currently has no booking, payment, payout, parking-search, notification, review, dispute or support APIs. Their polished UI remains available, but capability flags mark them unsupported. These flows are not durable production state until matching backend endpoints exist.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

The app uses a system font stack so CI and offline builds do not depend on downloading Google Fonts.
