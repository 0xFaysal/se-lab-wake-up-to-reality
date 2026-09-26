# ParkEase BD

> **A secure, location-aware parking marketplace for discovering, reserving, operating, and settling privately managed parking spaces in Dhaka, Bangladesh.**

[![ParkEase BD CI](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/ci.yml/badge.svg)](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/ci.yml)
[![Uptime & Health](https://img.shields.io/badge/Uptime%20%26%20Health-Active-10b981?logo=githubactions&logoColor=white)](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/uptime-check.yml)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel%20Live-000000?logo=vercel&logoColor=white)](https://parkease-bd.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend%20API-Vercel%20Live-000000?logo=vercel&logoColor=white)](https://parkease-api.vercel.app/health/live)
[![Figma](https://img.shields.io/badge/Figma-UI%2FUX%20Design-F24E1E?logo=figma&logoColor=white)](https://www.figma.com/design/xpGwQGsxbzN8kQK0IubMPU/ParkEase-BD-%E2%80%94-UI-UX-Design?node-id=0-1&t=wANRYM1Cb6R2qjlc-1)

---

## Quick Links

- **Live Web Application**: [https://parkease-bd.vercel.app](https://parkease-bd.vercel.app)
- **API Liveness Probe**: [https://parkease-api.vercel.app/health/live](https://parkease-api.vercel.app/health/live)
- **API Readiness Probe**: [https://parkease-api.vercel.app/health/ready](https://parkease-api.vercel.app/health/ready)
- **UI/UX Figma Prototype**: [ParkEase BD Figma Board](https://www.figma.com/design/xpGwQGsxbzN8kQK0IubMPU/ParkEase-BD-%E2%80%94-UI-UX-Design?node-id=0-1&t=wANRYM1Cb6R2qjlc-1)
- **Course**: United International University | Software Engineering Lab | Section D | Lab 422 | Summer 2026

---

## Executive Summary

Rapid urbanization in Dhaka has created severe parking congestion: drivers routinely spend 20–40 minutes searching for legal parking near commercial hubs, while thousands of residential garages and commercial building parking bays sit empty during working hours.

**ParkEase BD** bridges this gap through a unified, location-based parking sharing platform. It unlocks residential and commercial supply, allowing property owners to monetize idle capacity while giving drivers guaranteed, prepaid, conflict-safe parking. The platform handles the entire operational lifecycle: **map discovery, dynamic quoting, reservation locks, SSLCOMMERZ payments, guarded entry/exit verification via QR/OTP, overstay penalties, automated double-entry financial settlement, and provider payouts.**

---

## Live Cloud Infrastructure

| Component | Provider & Tier | Region / Host | Purpose |
|---|---|---|---|
| **Web Frontend** | **Vercel** (Edge Network) | Global Anycast | Next.js 16 App Router, React 19, Tailwind CSS 4 |
| **Backend REST API** | **Vercel** (Serverless Node.js 22) | Global Serverless | Express 5 modular API, JWT auth, business logic |
| **Primary Database** | **Supabase PostgreSQL** | Singapore (`ap-southeast-1`) | ACID transactions, double-entry financial ledger, Prisma ORM |
| **Temporary Data & Cache** | **Upstash Redis** | Serverless / Multi-Region | Ephemeral OTP verification, rate limiting, token blacklists |
| **Media & Photos** | **Cloudinary** | Global CDN | Secure MIME-verified property, gate & spot image hosting |
| **Transactional Email** | **Gmail SMTP** | App Password Authentication | Email verification, booking passes, settlement notifications |
| **Payment Gateway** | **SSLCOMMERZ** | Sandbox / Hosted Checkout | Bangladeshi card, mobile banking (bKash/Nagad), and net banking |

---

## System Architecture

ParkEase BD is built as a **cohesive modular monolith** engineered for rapid iteration, strict financial integrity, and zero distributed-transaction complexity. The application cleanly separates presentation workspaces from domain business services while enforcing atomic guarantees in PostgreSQL.

```mermaid
flowchart TB
    subgraph Clients["Multi-Role Web & Mobile Workspaces (Next.js 16 App Router)"]
        direction LR
        D["🚗 Driver Workspace<br/><code>/driver</code> • Map Search • Quotes • QR Pass • Wallet"]
        P["🏢 Provider Workspace<br/><code>/owner</code> • Spot Setup • Pricing • Payouts"]
        M["📋 Manager Workspace<br/><code>/manager</code> • Delegations • Shift Oversight"]
        G["🛡️ Guard Mobile Dock<br/><code>/guard</code> • Floating QR FAB • Queue • Check-in/out"]
        A["⚙️ Platform Admin<br/><code>/admin</code> • Approvals • Fee Rules • Disputes • Ledgers"]
    end

    subgraph EdgeLayer["Edge Delivery & Security Layer"]
        CDN["Vercel Edge Anycast CDN"]
        SEC["WAF • Helmet Headers • HttpOnly Cookie Auth • Upstash Rate Limiter"]
    end

    subgraph ApplicationLayer["Application & REST API Layer (Vercel Serverless)"]
        FE["Next.js 16 App Router Frontend<br/>(React 19 • Tailwind CSS 4 • TanStack Query v5 • Leaflet Maps)"]
        BE["Express 5 REST API Engine (Node.js 22 LTS)<br/>(TypeScript • Zod Validation • Pino Structured Redaction)"]
    end

    subgraph DomainModules["Backend Domain Modules (/backend/src/modules)"]
        M_AUTH["Auth & Sessions<br/>(Stateless JWT jose • Argon2id • RBAC)"]
        M_PROP["Properties & Rights<br/>(AES-256-GCM Addresses • Cloudinary Photos)"]
        M_MKT["Marketplace Engine<br/>(Quotes • 15-min Holds • Capacity Units)"]
        M_GATE["Guard & Gate Operations<br/>(QR Token Hashes • 6-Digit OTP • Realtime Queue)"]
        M_FIN["Financial Double-Entry Ledger<br/>(Chart of Accounts • Immutable Transactions • Wallets)"]
        M_GOV["Governance & Delegations<br/>(Scoped Manager Permissions • Guard Gate Assignments)"]
        M_ADM["Admin Governance<br/>(Verification Queue • Disputes • Risk Flags • Payouts)"]
    end

    subgraph CloudData["Managed Cloud Infrastructure & External Services"]
        PG[("Supabase PostgreSQL<br/>Singapore ap-southeast-1<br/>(Prisma 7 • Serializable Holds • Ledger)")]
        REDIS[("Upstash Redis<br/>Serverless KV<br/>(Rate Limits • Ephemeral OTP State)")]
        CLD["Cloudinary CDN<br/>(Property, Spot & Gate Access Photos)"]
        SMTP["Gmail SMTP Relay<br/>(Transactional Alerts & Passes)"]
        SSL["SSLCOMMERZ Gateway<br/>(Visa, Mastercard, bKash, Nagad, Rocket)"]
    end

    Clients --> CDN
    CDN --> SEC
    SEC --> FE
    FE -->|REST API /api/v1| BE
    BE --> DomainModules

    M_AUTH --> REDIS
    M_AUTH --> PG
    M_PROP --> CLD
    M_PROP --> PG
    M_MKT --> PG
    M_GATE --> REDIS
    M_GATE --> PG
    M_FIN --> SSL
    M_FIN --> PG
    M_GOV --> PG
    M_ADM --> SMTP
    M_ADM --> PG
```

---

## Real Booking & Operational Gate Lifecycle (State Machine)

Every booking strictly adheres to the 10-state deterministic finite state machine defined in [`BookingStatus`](file:///e:/project/se-lab-wake-up-to-reality/backend/prisma/schema.prisma#L131-L144). Race conditions on capacity are eliminated using PostgreSQL serializable transactions and 15-minute reservation holds.

```mermaid
stateDiagram-v2
    [*] --> PAYMENT_PENDING: Quote generated & 15-min ReservationHold created

    PAYMENT_PENDING --> CONFIRMED: Payment captured (SSLCOMMERZ / Wallet balance applied)
    PAYMENT_PENDING --> EXPIRED: Payment session timed out (20 min) & hold released
    PAYMENT_PENDING --> CANCELLED: Driver abandons or cancels checkout

    CONFIRMED --> CANCELLED: Driver cancels prior to start time (Policy refund calculated)
    CONFIRMED --> CHECKED_IN: Security Guard scans Digital QR / Validates 6-digit OTP
    CONFIRMED --> NO_SHOW: End time elapsed without check-in (Deposit refunded, spot cleared)
    CONFIRMED --> DISPUTED: Pre-arrival access or payment dispute opened

    CHECKED_IN --> CHECKOUT_REQUESTED: Driver taps 'Request Checkout' in mobile app
    CHECKED_IN --> COMPLETED: Guard confirms barrier departure (Overtime <= Deposit)
    CHECKED_IN --> PAYMENT_DUE: Guard confirms barrier departure (Overtime > Deposit)
    CHECKED_IN --> DISPUTED: On-site facility or vehicle damage dispute opened

    CHECKOUT_REQUESTED --> COMPLETED: Guard confirms barrier exit (Overtime <= Deposit)
    CHECKOUT_REQUESTED --> PAYMENT_DUE: Guard confirms barrier exit (Overtime > Deposit)

    PAYMENT_DUE --> COMPLETED: Driver settles outstanding overtime charge via gateway

    COMPLETED --> DISPUTED: Post-stay billing or condition dispute filed

    COMPLETED --> [*]: Booking settled & double-entry ledger posted
    CANCELLED --> [*]: Spot allocation released to public marketplace
    EXPIRED --> [*]: Capacity restored to available pool
    NO_SHOW --> [*]: Penalty credited to provider & deposit returned
    DISPUTED --> [*]: Admin reviews evidence & issues binding resolution
```

---

## Double-Entry Financial Settlement Flow

To guarantee absolute financial integrity, ParkEase BD utilizes an **immutable double-entry ledger** in Supabase PostgreSQL ([`payment-ledger.service.ts`](file:///e:/project/se-lab-wake-up-to-reality/backend/src/modules/payments/payment-ledger.service.ts)). No wallet balance is ever mutated in place without balanced debit and credit entries.

```mermaid
flowchart TD
    subgraph Phase1["1. Booking Payment & Escrow Lock (BOOKING_PAYMENT_HELD)"]
        direction TB
        DP["Driver Payment Source<br/>(Gross Amount = Base + Platform Fee + Security Deposit)"]
        GW["External Gateway<br/>(SSLCOMMERZ)"]
        WB["Driver Refund Balance<br/>(Existing Wallet Balance)"]

        DP -->|Gateway Portion| GW
        DP -->|Wallet Balance Portion| WB

        GW -->|DEBIT| ACC_EXT["EXTERNAL_PAYMENT_CLEARING"]
        WB -->|DEBIT| ACC_DRL1["DRIVER_REFUND_LIABILITY<br/>(Driver Wallet Balance Debited)"]

        ACC_EXT -->|CREDIT| ACC_HOLD["BOOKING_HELD_FUNDS<br/>(ParkEase Platform Escrow Holding)"]
        ACC_DRL1 -->|CREDIT| ACC_HOLD
    end

    subgraph Phase2["2. Parking Execution & Overtime Calculation"]
        direction TB
        CHECKIN["Guard Barrier Check-in<br/>(checkedInAt Recorded • Credential USED)"]
        EXIT["Driver Requests Exit / Guard Checkout<br/>(checkedOutAt Recorded)"]
        CALC{"Calculate Duration & Overtime<br/>Grace: 15 min • Mode: MULTIPLIER / FIXED_PER_HOUR"}

        CHECKIN --> EXIT --> CALC
    end

    subgraph Phase3["3. Atomic Multi-Party Settlement (BOOKING_SETTLEMENT)"]
        direction TB
        CALC -->|Overtime <= Deposit| SETTLE_OK["PostgreSQL Atomic Transaction<br/>(Status: COMPLETED • Financial: SETTLED)"]
        CALC -->|Overtime > Deposit| SETTLE_DUE["Status: PAYMENT_DUE<br/>Driver Pays Outstanding Overtime via Gateway"]
        SETTLE_DUE --> SETTLE_OK

        SETTLE_OK -->|DEBIT Full Held Amount| ACC_HOLD_REL["BOOKING_HELD_FUNDS<br/>(Escrow Released)"]

        ACC_HOLD_REL -->|CREDIT Net Base + Overtime Share| ACC_PROV["PROVIDER_PAYABLE<br/>(Provider Earnings Wallet)"]
        ACC_HOLD_REL -->|CREDIT Platform Service Fee| ACC_REV["PLATFORM_REVENUE<br/>(Platform Gross Commission)"]
        ACC_HOLD_REL -->|CREDIT Remaining Deposit| ACC_DRL2["DRIVER_REFUND_LIABILITY<br/>(Driver Wallet Refund Balance)"]
    end

    subgraph Phase4["4. Provider Payout Disbursement"]
        direction LR
        ACC_PROV -->|Payout Request| PAY_REQ["PayoutRequest<br/>(BANK / bKash / Nagad / Rocket)"]
        PAY_REQ -->|Admin Audit & Approval| DISB["Provider Bank Account / MFS Wallet"]
    end

    Phase1 ==> Phase2
    Phase2 ==> Phase3
    Phase3 ==> Phase4
```

---

## Multi-Provider Property Governance & Guard Gate Hierarchy

ParkEase BD supports multi-property operational management, allowing property owners to verify deed ownership, configure discrete fixed bays or shared pooled capacity, delegate day-to-day operations to building managers, and assign security guards to specific gate rosters.

```mermaid
flowchart TB
    subgraph OwnerAdmin["1. Property Onboarding & Rights Verification"]
        direction LR
        OWNER["Property Owner / Host<br/>(Registers Property & Uploads Deeds)"]
        ADMIN["Platform Administrator<br/>(Verifies Deeds & Coordinates)"]
        ADMIN -->|VerificationStatus: VERIFIED| PROP["Verified Property Entity<br/>(AES-256 Encrypted Address)"]
        OWNER -->|Claims Rights: OWNERSHIP / LEASE| RIGHT["ParkingRight Entity<br/>(Fixed Bay Spots or Shared Pool)"]
        RIGHT --> LISTING["ParkingListing Entity<br/>(Hourly Rate • Deposit • Overtime Rules)"]
    end

    subgraph Delegation["2. Governance & Operational Delegation"]
        direction LR
        OWNER -->|Delegates Operational Scope| DELEG["ManagerDelegation<br/>(Permissions: Price, Availability, Guards)"]
        DELEG --> MGR["Building Manager<br/>(On-Site Facility Supervisor)"]
        OWNER -->|Invites Security Guard| GUARD_MEM["PropertyGuardMembership"]
        MGR -->|Schedules Guard Roster| GUARD_MEM
        GUARD_MEM --> GUARD["Security Guard (Mobile App)<br/>(Scoped Authorization for Gate Access)"]
    end

    subgraph GateControl["3. Barrier Access & Verification"]
        direction LR
        DRIVER["Driver Confirmed Booking<br/>(AccessCredential: QR Hash + 6-Digit OTP)"]
        DRIVER -.->|Arrives at Barrier| GUARD
        GUARD -->|Scans QR / Validates OTP| GATE["Gate Barrier Check-in<br/>(Status: CHECKED_IN • Credential: USED)"]
    end

    OwnerAdmin ==> Delegation
    Delegation ==> GateControl
```

---

## Product Capabilities by Role

### 1. Driver Workspace
- **Map & Geo Discovery**: Real-time Leaflet/OpenStreetMap interactive parking map with live radius and bounding-box filters.
- **Dynamic Offer Quoting**: Server-authoritative price quotes factoring base rates, peak surcharges, deposit requirements, and vehicle compatibility (Sedan, SUV, Hatchback, Bike).
- **Digital Access Pass**: Mobile-optimized access screen with high-contrast QR code and offline-safe 6-digit gate OTP.
- **Wallet & History**: Transparent ledger tracking spent funds, refund balances, overtime deductions, and dispute statuses.

### 2. Property Owner & Provider Workspace
- **Multi-Step Listing Wizard**: Register property boundaries, entrance coordinates, clear ceiling heights, and upload Cloudinary-optimized facility photographs.
- **Capacity & Spot Allocation**: Configure dedicated numbered slots (fixed bays) or flexible pooled capacity.
- **Availability Matrix**: Weekly recurring schedules, custom hourly rates, holiday blockout exceptions, and buffer times.
- **Earnings & Payout Dashboard**: Monitor cleared vs. pending earnings and request bank/MFS account withdrawals.

### 3. Building Manager Workspace
- **Delegated Governance**: Building owners can securely delegate operational management to on-site building managers with granular permissions.
- **Shift & Gate Oversight**: Schedule guard rosters and monitor active parking occupancy in real time.

### 4. Security Guard Workspace (Mobile-First)
- **Symmetrical 5-Item Floating Pill Dock**: Clean, ergonomic mobile interface designed for one-handed operation at the gate.
- **Centered Floating QR Scanner FAB**: Elevated camera QR scanner with instant decoding and offline-access fallback.
- **Operational Booking Queue**: Real-time filters for *All Active*, *Expected*, *Parked*, and *Exit Requested* vehicles.
- **Duty & Shift Badging**: Real-time notification badges for incoming property invitations and duty shift assignments.

### 5. Platform Administrator Workspace
- **Property Verification**: Review uploaded ownership evidence, examine gate street coordinates, and approve listings.
- **Marketplace Governance**: Inspect disputes, trigger manual booking cancellations, and adjust platform fee percentages.
- **Financial Audit & Payout Processing**: Review provider withdrawal requests and approve bank disbursements without manual wallet edits.

---

## Technology Stack

```text
Frontend Framework     Next.js 16.2.12 (App Router, Turbopack)
UI Library             React 19.2.4
Styling & Tokens       Tailwind CSS 4, Lucide Icons, Glassmorphism Design Tokens
Client State & Cache   TanStack React Query v5, Zustand 5, React Hook Form, Zod
Maps & Geolocation     Leaflet 1.9, React Leaflet, OpenStreetMap Tiles
Backend Framework      Express 5.2.1, Node.js 22 LTS, TypeScript 7
Database & ORM         PostgreSQL 16+ on Supabase, Prisma ORM 7.10
In-Memory Cache & KV   Upstash Serverless Redis (REST & TCP)
Authentication         Stateless Signed JWT (jose), Rotating Refresh Tokens, Argon2 Password Hashing
Security & Hardening   Helmet, HTTP-Only Cookies, AES-256-GCM Address Encryption, Request IDs
Media Delivery         Cloudinary CDN Image Pipeline
Deployment             Vercel Serverless (Frontend & API)
Continuous Integration GitHub Actions (Automated Lint, Typecheck, 105+ Unit Tests, Uptime Probes)
```

---

## Security & Privacy Engineering

- **AES-256-GCM Address Encryption**: Exact property street addresses, unit numbers, and gate entry instructions are encrypted at rest with authenticated AES-256-GCM. Unauthenticated users only see public district and neighborhood names.
- **HttpOnly Cookie Architecture**: JWT access and refresh tokens are transmitted strictly via secure, `HttpOnly`, `SameSite=Lax` cookies, neutralizing Cross-Site Scripting (XSS) token theft.
- **Argon2 Password Hashing**: Passwords are saved with Argon2id hashing and unique salts. Verification codes and password-reset tokens are hashed prior to database persistence.
- **Distributed Rate Limiting**: Upstash Redis tracks API request bursts per IP to block brute-force attacks on login, registration, and OTP verification endpoints.
- **MIME & Magic-Byte File Validation**: File uploads to Cloudinary are strictly validated against magic-byte file headers, rejecting spoofed extension payloads.
- **Structured Log Redaction**: Pino structured logger automatically redacts sensitive fields (passwords, tokens, cookies, authorization headers) before writing to stdout.

---

## Repository Structure

```text
.
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Comprehensive CI pipeline (Backend & Frontend)
│       ├── uptime-check.yml       # Production 30-min availability probe
│       └── check-pr-source.yml    # Branch policy enforcement (main <-- develop)
├── backend/
│   ├── api/                       # Vercel serverless entry point
│   ├── prisma/                    # Prisma database schema, migrations & seed scripts
│   ├── src/
│   │   ├── common/                # Middleware (auth, encryption, validation, error handling)
│   │   ├── config/                # Validated env configuration & external service clients
│   │   ├── modules/               # Domain modules (auth, properties, bookings, payments, admin)
│   │   └── server.ts              # Express application bootstrap
│   └── tests/                     # 105+ unit and integration test suites
├── frontend/
│   ├── app/                       # Next.js App Router (Driver, Owner, Guard, Admin workspaces)
│   ├── components/                # Modular UI components & design system primitives
│   ├── features/                  # Domain-driven features (guard, bookings, owner, payments)
│   └── lib/                       # API client, TanStack Query keys, security utils
├── docs/                          # Architecture, SRS, API design & deployment specifications
└── UI/                            # High-fidelity design references and screen catalog
```

---

## Getting Started Locally

### Prerequisites

- **Node.js**: `22.x LTS` (verify with `node -v`)
- **npm**: `10.x` or newer
- **Git**
- **Docker Desktop** *(Optional — only if running local PostgreSQL & Redis instead of hosted cloud instances)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/0xFaysal/se-lab-wake-up-to-reality.git
cd se-lab-wake-up-to-reality
```

---

### 2. Configure & Run Backend

1. Navigate to the backend directory and copy the environment template:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Open `backend/.env` and supply your database connection and secrets:
   ```dotenv
   PORT=4000
   NODE_ENV=development
   DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>?schema=public&sslmode=require"
   REDIS_URL="redis://<user>:<password>@<host>:6379"
   CORS_ORIGIN="http://localhost:3000"
   API_PUBLIC_URL="http://localhost:4000"
   FRONTEND_BASE_URL="http://localhost:3000"
   DATA_ENCRYPTION_KEY="replace-with-a-unique-64-character-hex-key"
   JWT_ACCESS_SECRET="replace-with-an-access-secret-at-least-32-characters-long"
   JWT_REFRESH_SECRET="replace-with-a-different-refresh-secret-at-least-32-characters"
   ```

3. Install dependencies, generate Prisma client, and start the development server:
   ```bash
   npm ci
   npm exec -- prisma generate
   npm run dev
   ```
   *The backend will boot up at `http://localhost:4000`.*

---

### 3. Configure & Run Frontend

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Create a local environment file `frontend/.env.local`:
   ```dotenv
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api/v1"
   BACKEND_API_BASE_URL="http://localhost:4000/api/v1"
   ```

3. Install dependencies and start Next.js with Turbopack:
   ```bash
   npm ci
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## Local Verification & Testing

Ensure all quality gates pass locally prior to submitting pull requests:

```bash
# Backend Quality Checks
cd backend
npm run format:check        # Prettier formatting check
npm run typecheck           # TypeScript compiler validation
npm test                    # Runs all 105 unit test suites

# Frontend Quality Checks
cd ../frontend
npm run lint                # ESLint 9 verification
npm run typecheck           # TypeScript compiler validation
npm run build               # Production Turbopack build
```

---

## Live System Availability & Health

The production deployment is actively monitored via automated GitHub Actions uptime and readiness checks:

| Service | Target URL | Health Endpoint | Status Indicator | Target Uptime |
|---|---|---|---|---|
| **Frontend Web App** | [`parkease-bd.vercel.app`](https://parkease-bd.vercel.app) | `/` | ![Operational](https://img.shields.io/badge/Status-Operational-10b981?style=flat-square&logo=vercel&logoColor=white) | 99.9% (Vercel Global Edge) |
| **Backend API (Process)** | [`parkease-api.vercel.app`](https://parkease-api.vercel.app) | [`/health/live`](https://parkease-api.vercel.app/health/live) | ![Alive](https://img.shields.io/badge/Status-Alive-10b981?style=flat-square&logo=nodedotjs&logoColor=white) | 99.9% (Vercel Serverless) |
| **Database & Cache Readiness** | Supabase & Upstash | [`/health/ready`](https://parkease-api.vercel.app/health/ready) | ![Connected](https://img.shields.io/badge/Postgres%20%26%20Redis-Connected-10b981?style=flat-square&logo=postgresql&logoColor=white) | Multi-Region Active |

- **Automated Uptime Monitoring**: Probes production endpoints every 30 minutes via [`.github/workflows/uptime-check.yml`](./.github/workflows/uptime-check.yml).
- **Latest Workflow Run**: View real-time status and probe response latency on [GitHub Actions](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/uptime-check.yml).

---

## Engineering Team

| Name | GitHub | Primary Role |
|---|---|---|
| **Faysal Ahmed Fahim** | [@0xFaysal](https://github.com/0xFaysal) | Backend Architecture, Security, Payments & Cloud DevOps |
| **Md. Minhajul Islam** | [@Minhajh20](https://github.com/Minhajh20) | Frontend Engineering, Component Systems & Client State |
| **Anisa Akter Mahi** | [@0xAnisa](https://github.com/0xAnisa) | UI/UX Design Systems, Wireframing & Product Coordination |
| **Marjia Islam** | [@MarjiaIslam](https://github.com/MarjiaIslam) | Software Quality Assurance (STQA) & System Analysis |

### Faculty Evaluation
- **Course Evaluator**: Rejwan Ahmed ([@rejwanahmed007](https://github.com/rejwanahmed007))
- Individual member contributions are tracked via verified GitHub commit history, pull request reviews, and issue allocations.

---

## License

This repository is developed as an academic capstone project for the United International University Software Engineering Lab. All rights are reserved by the contributors.
