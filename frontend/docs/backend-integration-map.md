# Backend integration map

This map reflects the backend source code and canonical routes, not only the older endpoint list in the implementation brief.

| Frontend surface | Backend contract | Request / response | Status |
|---|---|---|---|
| Login / registration | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/refresh` | Cookie session; `{ user, nextAction }` | CONNECTED |
| Email / phone verification | `POST /auth/{channel}-verification/request|confirm` | `{ code }`; `{ verified, channel }` | CONNECTED |
| Forgot / reset password | `POST /auth/request-password-reset`, `POST /auth/reset-password` | `{ identifier }`; `{ token, newPassword }` | CONNECTED |
| Password and logout actions | `POST /users/me/change-password`, `/auth/logout`, `/auth/logout-all` | Password pair; rotated/revoked cookie sessions | CONNECTED |
| Account sessions | `GET /users/me/sessions`, `DELETE /users/me/sessions/:sessionId` | Safe `{ id, userAgent, rememberDevice, createdAt, expiresAt, current }` | CONNECTED |
| Driver vehicles | `/vehicles` and `/vehicles/:vehicleId`, `PATCH .../default` | Vehicle DTO using MOTORCYCLE/SEDAN/SUV/MICROBUS and centimetres | CONNECTED |
| Provider Property list/detail/create/edit/delete | `/provider/properties` | Strict Property fields and optimistic `version` on update | CONNECTED |
| Property images | `/properties/:propertyId/images` and `/reorder` | Multipart field `images`; ordered image DTO | CONNECTED |
| Admin Property review | `/admin/properties/pending`, `/:id`, `/:id/verification` | Pagination; APPROVE or REJECT with 10–500 character reason | CONNECTED |
| Shared Property Guard membership | `/properties/:propertyId/guards`, `/guard/property-memberships` | Masked Guard contacts and membership states | CONNECTED |
| Provider Guard assignments | `/provider/properties/:propertyId/guard-assignments`, `/provider/guard-assignments` | Discriminated actions UPDATE_SHIFT/SUSPEND/RESUME; DELETE ends | CONNECTED |
| Guard provider shifts | `GET /guard/provider-assignments` | Guard-scoped assignment list | CONNECTED |
| Manager delegation | `/provider/manager-delegations`, `/manager/delegations` | Secure account creation, scoped permissions, accept/reject/end | CONNECTED (core flow) |
| Manager permission editor/detail | `GET /provider/manager-delegations/:id`, `PATCH .../permissions` | Permission/resource replacement | PARTIAL (API client connected; no dedicated editor) |
| Property governance | membership, building-manager, common-rules, closure and proposal endpoints | Multi-provider governance DTOs | NOT CONNECTED (no matching existing frontend flow) |
| Admin duplicate merge | `POST /admin/properties/merge` | Canonical/duplicate IDs, versions and reason | NOT CONNECTED (no matching existing frontend flow) |
| Parking spots, availability, search, booking, payment, wallet, earnings, payouts, reviews, disputes, notifications, support, parking sessions and QR booking lifecycle | No backend route | Prototype data only | NO BACKEND YET |

## Confirmed contract differences

- Provider Property and Guard routes are canonical under `/provider`, while `/owner/properties` is only a legacy Property alias.
- Property image upload uses the multipart field `images`, returns `{ images: [...] }`, and image order is `sortOrder` with `isCover`.
- Session DTO uses `current`; it does not expose IP hashes, IP addresses, token hashes, or `lastUsedAt`.
- The current backend has no Guard assignment-detail GET endpoint. Detail UI is derived from the authorized list response.
- `UPDATE_SHIFT` currently preserves assignment status. The backend does not implement the described ACTIVE → PENDING_ACCEPTANCE shift-reacceptance transition.
