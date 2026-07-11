# API Design Document
**Project:** [Project Name]
**Version:** 1.0
**Date:** [Date]
**Base URL:** `http://localhost:8000/api/v1/`

---

## Authentication
All protected endpoints require a JWT Bearer token in the header:
Authorization: Bearer <your_access_token>
Get a token via `POST /auth/login/`

---

## Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register/` | ❌ | Register a new user |
| POST | `/auth/login/` | ❌ | Login and receive JWT tokens |
| POST | `/auth/logout/` | ✅ | Invalidate refresh token |
| POST | `/auth/token/refresh/` | ❌ | Get new access token |

### [Resource Name — e.g. Products]

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products/` | ✅ | List all products |
| POST | `/products/` | ✅ | Create a product |
| GET | `/products/{id}/` | ✅ | Get single product |
| PUT | `/products/{id}/` | ✅ | Full update |
| PATCH | `/products/{id}/` | ✅ | Partial update |
| DELETE | `/products/{id}/` | ✅ | Delete a product |

---

## Request / Response Examples

### POST /auth/login/
**Request:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```
**Response 200:**
```json
{
  "access": "eyJ0eXAiOiJKV1Q...",
  "refresh": "eyJ0eXAiOiJKV1Q..."
}
```
**Response 401:**
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

## Standard Response Format
All endpoints return a consistent structure:
```json
{
  "status": "success",
  "data": { },
  "message": "Human readable message"
}
```

---

## HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | OK — request succeeded |
| 201 | Created — resource created |
| 400 | Bad Request — invalid input |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — authenticated but not allowed |
| 404 | Not Found — resource does not exist |
| 500 | Internal Server Error — server-side bug |
