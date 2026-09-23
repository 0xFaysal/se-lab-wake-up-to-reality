# ParkEase BD

> A location-based shared parking platform that connects drivers with unused residential parking spaces in Dhaka.

**UIU Software Engineering Lab | Section D | Lab 422 | Summer 2026**

[![CI](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/ci.yml/badge.svg)](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/ci.yml)
[![Figma](https://img.shields.io/badge/Figma-UI%2FUX%20Design-F24E1E?logo=figma&logoColor=white)](https://www.figma.com/design/xpGwQGsxbzN8kQK0IubMPU/ParkEase-BD-%E2%80%94-UI-UX-Design?node-id=0-1&t=wANRYM1Cb6R2qjlc-1)

## About the Project

ParkEase BD addresses two related urban problems: drivers struggle to find legal parking near busy destinations, while many residential parking spaces remain unused during the day. The platform enables property owners and building managers to rent those spaces by the hour, helping drivers reserve parking before arrival and giving owners a new source of income.

The system is designed for Dhaka's local parking workflow. It supports time-based availability, conflict-free reservations, vehicle verification, guarded entry and exit, cancellations, overstays, simulated payments, and transparent owner settlements.

## Users

- **Drivers** search, compare, reserve, and pay for parking; manage vehicles and bookings; and check in with a temporary QR code or OTP.
- **Parking owners/managers** list properties and parking spots, configure availability and pricing, manage bookings, and track earnings.
- **Security guards/attendants** verify arriving vehicles, scan booking codes, and confirm check-in and check-out.
- **Administrators** verify listings, manage users and disputes, and oversee payments, refunds, commissions, and payouts.

## Core Features

- Location and map-based parking discovery
- Filters for destination, time, price, and vehicle type
- Hourly parking listings with recurring schedules and exception dates
- Conflict-safe booking and temporary payment holds
- QR/OTP-based entry and exit verification
- Cancellation, refund, no-show, grace-period, and overstay handling
- Real-time availability and booking-status updates
- Simulated wallet, transaction ledger, platform commission, and owner earnings
- Role-based dashboards in one web application
- Responsive, mobile-friendly guard experience

## Application Structure

ParkEase uses one frontend with separate role-based paths and layouts:

```text
/
├── /search                 Public parking search
├── /parking/:id            Parking details
├── /auth                   Login and registration
├── /driver                 Driver workspace
├── /owner                  Parking-owner workspace
├── /guard                  Guard workspace
└── /admin                  Administration workspace
```

Frontend route protection improves the user experience, while the backend remains the final authority for role-based access control.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Cache and jobs | Redis, BullMQ (planned) |
| Maps | OpenStreetMap, Leaflet (planned) |
| Real-time updates | Socket.IO (planned) |
| Authentication | JWT, refresh tokens, bcrypt, RBAC (planned) |
| Payments | Simulated wallet and transaction ledger (planned) |
| Infrastructure | Docker, Docker Compose |
| CI/CD | GitHub Actions |

## High-Level Architecture

```text
Next.js web application
  ├── Public pages
  ├── Driver dashboard
  ├── Owner dashboard
  ├── Guard dashboard
  └── Admin dashboard
            │
            │ REST / Socket.IO
            ▼
Express API
  ├── PostgreSQL + Prisma
  ├── Redis
  └── Background jobs
```

The project follows a modular-monolith approach so the four-person team can share infrastructure and deliver the semester scope without the operational overhead of microservices.

## Current Status

ParkEase BD is under active development. The repository currently contains the Next.js application shell, Express API foundation, PostgreSQL/Prisma setup, Redis integration, structured logging, centralized error handling, request IDs, and health endpoints. Product modules listed above are being implemented incrementally.

## Getting Started

### Prerequisites

- Node.js 22 LTS or newer
- npm
- Docker Desktop
- Git

### 1. Clone the repository

```bash
git clone https://github.com/0xFaysal/se-lab-wake-up-to-reality.git
cd se-lab-wake-up-to-reality
```

### 2. Start PostgreSQL and Redis

```bash
docker compose -f backend/docker-compose.yml up -d
```

### 3. Configure and start the backend

Copy `backend/.env.example` to `backend/.env`, then run:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

The API starts at `http://localhost:4000`.

### 4. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The web application starts at `http://localhost:3000`.

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Liveness check | http://localhost:4000/health/live |
| Readiness check | http://localhost:4000/health/ready |
| API Docs | http://localhost:4000/api/docs/ | Swagger UI — added Week 5 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

To stop the infrastructure while retaining local data:

```bash
docker compose -f backend/docker-compose.yml down
```

Add `-v` to the stop command only when you intentionally want to delete the local PostgreSQL and Redis volumes.

## Useful Commands

### Backend

```bash
npm run dev                # start the development server
npm run typecheck          # check TypeScript types
npm run build              # create a production build
npm run prisma:generate    # generate the Prisma client
npm run prisma:migrate     # create/apply a development migration
npm run prisma:studio      # open Prisma Studio
```

### Frontend

```bash
npm run dev                # start the Next.js development server
npm run lint               # run ESLint
npm run build              # create a production build
npm run start              # run the production build
```

## Continuous Integration

`ParkEase BD CI` runs for pushes and pull requests targeting `develop` or
`main`. Stale runs for the same branch are cancelled. All jobs use read-only
repository access except CodeQL, which receives `security-events: write` only
for publishing its analysis results.

| Job | Purpose | Services | Blocking | Commands |
|---|---|---|---|---|
| Repository Whitespace | Reject whitespace errors | None | Yes | `git diff --check` |
| Backend Quality & Build | Validate Prisma, formatting, types, and compilation | None | Yes | `prisma format`, `prisma validate`, `prisma generate`, `npm run format:check`, `npm run typecheck`, `npm run build` |
| Backend Unit Tests | Run the backend unit suite | None | Yes | `prisma generate`, `npm test` |
| Backend Integration Tests | Apply migrations to a clean database and run integration tests | PostgreSQL 18, Redis 8 | Yes | `prisma generate`, `prisma migrate deploy`, `prisma migrate status`, `npm run test:integration` |
| Frontend Quality | Check TypeScript and ESLint | None | Yes | `npm run typecheck`, `npm run lint` |
| Frontend Production Build | Verify the optimized Next.js build | None | Yes | `npm run build` |
| Dependency Audit | Block high or critical npm vulnerabilities | None | Yes | `npm audit --audit-level=high` in both applications |
| CodeQL SAST | Analyze JavaScript and TypeScript security and quality | None | Yes | GitHub CodeQL `security-and-quality` queries |
| Secret Scan | Scan the full Git history and current tree for credentials | None | Yes | Gitleaks |
| CI Success | Provide one aggregate branch-protection check | None | Yes | Verifies every required job succeeded |

The frontend currently has no test script, and the backend currently has no
lint script, so CI does not invent those commands. Add the corresponding CI
steps when those scripts are introduced. Test output is kept in the Actions
log; the current test runner does not generate coverage or JUnit files to
upload. CodeQL findings appear in GitHub code scanning.

### CI environment

Integration tests use only disposable service containers and deterministic
CI-only credentials. They receive `DATABASE_URL`, `TEST_DATABASE_URL`,
`REDIS_URL`, `CORS_ORIGIN`, `API_PUBLIC_URL`, `PASSWORD_RESET_URL`, distinct
dummy authentication secrets, and a dummy encryption key. A guard refuses to
run migrations unless the database URL points to the known local
`parkease_ci` database. The frontend build receives only the public,
non-secret `NEXT_PUBLIC_API_BASE_URL`. SMTP, Cloudinary, and Twilio are omitted
because they are optional outside production and the integration suite does
not make those external calls.

### Local pre-push checklist

Start the backend PostgreSQL and Redis containers before the integration suite:

```bash
docker compose -f backend/docker-compose.yml up -d
```

Then run the same application checks as CI:

```bash
cd backend
npm ci
npx prisma format
npx prisma validate
npx prisma generate
npm run format:check
npm run typecheck
npm run build
npm test
export TEST_DATABASE_URL="postgresql://parkease:parkease_dev_password@localhost:5432/parkease_test?schema=public"
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
npm run test:integration

cd ../frontend
npm ci
npm run typecheck
npm run lint
NEXT_PUBLIC_API_BASE_URL="https://api.parkease.invalid/api/v1" npm run build

cd ..
git diff --check
```

On PowerShell, set `TEST_DATABASE_URL` and `NEXT_PUBLIC_API_BASE_URL` with
`$env:NAME = "value"` before running the relevant command.

When `npm audit` fails, inspect the advisory and update the direct dependency
or lockfile rather than suppressing the job. When CodeQL or Gitleaks fails,
review the GitHub annotation, remove the vulnerable pattern or exposed value,
and rotate any credential that may have been real. Do not add broad exclusions
or commit secrets to silence a finding.

### Branch protection

Configure `CI Success` as a required status check for both protected branches.
For `develop`, require a pull request and block force pushes. For `main`, also
require approving reviews, and block force pushes and branch deletion. Keep
the existing source-branch check for pull requests into `main`. These settings
must be configured in GitHub; the workflow does not change repository policy.

The dependency graph is: backend quality → backend integration; frontend
quality → frontend build. Whitespace, unit tests, dependency audit, CodeQL, and
Gitleaks run in parallel. `CI Success` waits for every required job. Weekly
Dependabot checks cover both npm lockfiles and GitHub Actions; updates are never
automatically merged.

## Project Scope

The semester version will not integrate real banking, bKash, Nagad, or card payments. It will also exclude IoT parking sensors, automated barriers, license-plate recognition, and government traffic-system integration. These boundaries keep the project focused on demonstrating a reliable shared-parking workflow.

## Documentation

| Document | Description |
|---|---|
| [Project proposal](./docs/project-idea-2.md) | Problem, proposed solution, users, scope, and technology choices |
| [Software Requirements Specification](./docs/SRS.md) | Functional and non-functional requirements |
| [Architecture](./docs/ARCHITECTURE.md) | System structure and engineering decisions |
| [API design](./docs/api-design.md) | API conventions and endpoint design |
| [UI/UX Design (Figma)](https://www.figma.com/design/xpGwQGsxbzN8kQK0IubMPU/ParkEase-BD-%E2%80%94-UI-UX-Design?node-id=0-1&t=wANRYM1Cb6R2qjlc-1) | UI/UX design mockups and prototype |
| [UI/UX Screen Catalog & Specs](./UI/README.md) | High-fidelity screen artifacts, workflows, and frontend handoff specs |
| [Contributing guide](./CONTRIBUTING.md) | Branch, commit, issue, and pull-request workflow |

## Team

| Name | GitHub | Responsibility |
|---|---|---|
| Faysal Ahemd Fahim | [@0xFaysal](https://github.com/0xFaysal) | Backend Development |
| Md. Minhajul Islam | [@Minhajh20](https://github.com/Minhajh20) | Frontend Development |
| Anisa Akter Mahi | [@0xAnisa](https://github.com/0xAnisa) | Project Coordination and UI/UX Design |
| Marjia Islam | [@MarjiaIslam](https://github.com/MarjiaIslam) | STQA and System Analysis |

## Faculty Access

`rejwanahmed007` has been added as **Read** collaborator for evaluation.
Marks are tracked via GitHub commit history, PR reviews, and Issue activity per member.

## License

This repository is an academic project created for the UIU Software Engineering Lab. No open-source license has been assigned yet.
