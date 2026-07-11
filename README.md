# [Project Name]
> Replace this with your actual project name and one-line description.

**UIU Software Engineering Lab | Section D | Lab 422 | Summer 2026**

---

## Team Members

| Name | Student ID | GitHub | Role |
|------|-----------|--------|------|
| [Member 1] | [ID] | @username | [e.g. Backend Developer] |
| [Member 2] | [ID] | @username | [e.g. Frontend Developer] |

## Project Description
[2-3 sentences: what problem does this solve and for whom?]

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | [Django / Laravel / Spring Boot / Express / FastAPI] |
| Frontend | [React / Vue / Angular] |
| Database | [PostgreSQL / MySQL / MongoDB] |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## How to Run

### Prerequisites
- Docker Desktop installed and **running**
- Git configured

### Steps

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
cp .env.example .env        # copy env file, then fill in your values
docker compose up --build   # start everything
```

### Access the Application

| What | URL | Note |
|------|-----|------|
| Frontend | http://localhost:3000 | Your browser — outside Docker |
| Backend API | http://localhost:8000/api/ | Your browser — outside Docker |
| API Docs | http://localhost:8000/api/docs/ | Swagger UI |
| Database | localhost:5432 | Use DBeaver/TablePlus, not browser |

> **Why localhost?**
> Your browser runs outside Docker. Docker maps container ports to your
> machine's localhost. Inside Docker, containers talk to each other using
> service names (backend, db) — never localhost. See .env.example for detail.

### Stop

```bash
docker compose down      # stop, keep data
docker compose down -v   # stop, delete data (fresh start)
```

---

## CI/CD Status
[![CI](https://github.com/YOUR-USERNAME/YOUR-REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR-USERNAME/YOUR-REPO/actions/workflows/ci.yml)

---

## Instructor Access
`rejwanahmed007` has been added as Read collaborator for evaluation.
