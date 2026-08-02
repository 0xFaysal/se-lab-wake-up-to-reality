# ParkEase BD

> A location-based shared parking platform that connects drivers with unused residential parking spaces in Dhaka.

**UIU Software Engineering Lab | Section D | Lab 422 | Summer 2026**

[![CI](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/ci.yml/badge.svg)](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/ci.yml)

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

## Project Scope

The semester version will not integrate real banking, bKash, Nagad, or card payments. It will also exclude IoT parking sensors, automated barriers, license-plate recognition, and government traffic-system integration. These boundaries keep the project focused on demonstrating a reliable shared-parking workflow.

## Documentation

| Document | Description |
|---|---|
| [Project proposal](./docs/project-idea-2.md) | Problem, proposed solution, users, scope, and technology choices |
| [Software Requirements Specification](./docs/SRS.md) | Functional and non-functional requirements |
| [Architecture](./docs/ARCHITECTURE.md) | System structure and engineering decisions |
| [API design](./docs/api-design.md) | API conventions and endpoint design |
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
