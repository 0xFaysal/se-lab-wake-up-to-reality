# [Project Name]
> Replace this with your actual project name and one-line description.

**UIU Software Engineering Lab | Section D | Lab 422 | Summer 2026**

---

## Team Members
| Name | GitHub | Role |
|------|--------|------|
| Faysal Ahemd Fahim | [0xFaysal](https://github.com/0xFaysal) | Backend Developer |
| Md. Minhajul Islam | [Minhajh20](https://github.com/Minhajh20) | Frontend Developer |
| Anisa Akter Mahi | [0xAnisa](https://github.com/0xAnisa) | Project Coordinator |
| Marjia Islam | [MarjiaIslam](https://github.com/MarjiaIslam) | STQA & System Analyst |

## Project Description
[2–3 sentences: what problem does this solve and for whom?]

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Express |
| Frontend | React |
| Database | MongoDB |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## How to Run

### Prerequisites
- Docker Desktop installed and **running**
- Git configured

### Steps

```bash
git clone https://github.com/0xFaysal/se-lab-wake-up-to-reality.git
cd se-lab-wake-up-to-reality
cp .env.example .env        # copy env file then fill in your values
docker compose up --build   # start everything
```

### Access the Application

| What | URL | Note |
|------|-----|------|
| Frontend | http://localhost:3000 | Your browser — outside Docker |
| Backend API | http://localhost:8000/api/ | Your browser — outside Docker |
| API Docs | http://localhost:8000/api/docs/ | Swagger UI — added Week 5 |
| Database | localhost:5432 | Use DBeaver/TablePlus, not browser |

> **Why localhost?**
> Your browser runs outside Docker. Docker maps container ports to your machine's localhost.
> Inside Docker, containers talk to each other using service names (`backend`, `db`) — never localhost.
> See [.env.example](./.env.example) for the full explanation.

### Stop

```bash
docker compose down      # stop, keep data
docker compose down -v   # stop and delete data (fresh start)
```

---

## Project Documentation

| Document | Description |
|----------|-------------|
| [SRS.md](./docs/SRS.md) | Software Requirements Specification |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design and technology decisions |
| [api-design.md](./docs/api-design.md) | API endpoints, request/response format |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Git workflow rules for this team |

---

## CI/CD Pipeline Status

[![CI](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/ci.yml/badge.svg)](https://github.com/0xFaysal/se-lab-wake-up-to-reality/actions/workflows/ci.yml)

---

## Faculty Access

`rejwanahmed007` has been added as **Read** collaborator for evaluation.
Marks are tracked via GitHub commit history, PR reviews, and Issue activity per member.
