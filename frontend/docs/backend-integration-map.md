# Backend integration map

This matrix is based on `backend/src/modules/marketplace/marketplace.routes.ts`, its Zod schemas, and service response shapes.

| Frontend surface | Endpoint | Method | Status |
|---|---|---:|---|
| Provider Property list/detail | `/provider/properties` | GET/POST/PATCH/DELETE | CONNECTED |
| Parking resources | `/provider/properties/:propertyId/parking-resources`, `/provider/parking-resources/:id` | GET/POST/PATCH/DELETE | CONNECTED |
| Parking-right claims | `/provider/parking-resources/:id/rights/claims`, `/provider/parking-rights` | GET/POST | CONNECTED |
| Admin parking-right review | `/admin/parking-rights/pending`, `/admin/parking-rights/:id/verification` | GET/PATCH | CONNECTED |
| Provider listings | `/provider/listings`, activate/pause/end routes | GET/POST/PATCH/DELETE | CONNECTED |
| Admin listing suspension | `/admin/listings/:id/suspend` | POST | CONNECTED BY ID |
| Weekly availability | `/provider/parking-resources/:id/availability` | GET/PUT | CONNECTED |
| Availability exceptions | `/provider/parking-resources/:id/availability/exceptions` | POST | API CONNECTED; NO DELETE API |
| Public parking search | `/parking/search` | GET | CONNECTED |
| Public Property offers | Search result grouped by canonical Property | GET | CONNECTED |
| Quote | `/parking/quotes`, `/parking/quotes/:id` | POST/GET | CONNECTED |
| Reservation hold | `/parking/holds`, `/parking/holds/:id` | POST/GET/DELETE | CONNECTED |
| Driver booking | `/bookings`, `/bookings/:id` | POST/GET | CONNECTED |
| Driver cancellation/checkout request | `/bookings/:id/cancel`, `/checkout-request` | POST | CONNECTED |
| Provider/Manager bookings | `/provider/bookings` | GET | CONNECTED |
| Simulated payment | `/payments/simulated/capture` | POST | CONNECTED |
| Guard credential/check-in/check-out | `/guard/access/verify`, `/guard/bookings/:id/*` | POST | CONNECTED |
| Driver wallet/transactions | `/wallet`, `/wallet/transactions` | GET | CONNECTED |
| Provider earnings | `/provider/earnings/summary`, `/transactions` | GET | CONNECTED |
| Refund action | `/payments/:id/refunds` | POST | CONNECTED FROM BOOKING |
| Provider payout request | `/provider/payouts` | POST | CONNECTED |
| Admin payout queue/review | `/admin/payouts`, `/admin/payouts/:id` | GET/PATCH | CONNECTED |
| Notifications | `/notifications`, read/read-all routes | GET/PATCH/POST | CONNECTED |
| Driver review | `/bookings/:id/reviews` | POST | CONNECTED |
| Provider reviews/reply | `/provider/reviews`, `/provider/reviews/:id/reply` | GET/POST | CONNECTED |
| Driver/Provider dispute creation | `/bookings/:id/disputes` | POST | CONNECTED |
| Admin dispute queue/resolution | `/admin/disputes`, `/admin/disputes/:id` | GET/PATCH | CONNECTED |
| Manager delegations | `/provider/manager-delegations`, `/manager/delegations` | GET/POST/PATCH/DELETE | CONNECTED |

## Confirmed backend capability gaps

- There is no dedicated public Property-detail endpoint. The offer page is reconstructed only from the exact search response and therefore requires its search context.
- There is no Guard booking-list endpoint. Guard booking operations are credential-driven and do not display a fabricated queue.
- There is no Provider payout-history endpoint. Providers can request payout and receive notifications; only Admin can list the payout queue.
- There is no Driver/Provider dispute-list or dispute-detail endpoint. Users create disputes from related bookings; only Admin has a queue.
- There is no standalone Driver refund-history endpoint. Updated payment state and the refund action response are authoritative.
- There is no Admin listing-list endpoint. Listing suspension is available only when an authorized Admin has a listing ID.
- There is no availability-exception update/delete route.
- Support tickets, realtime sockets, advanced overtime, and a real payment gateway remain intentionally deferred.

## Security and state rules

- Cookie authentication and the existing single refresh retry remain in the centralized API client.
- Final prices always come from a server quote. Money is formatted from integer paisa.
- Access credentials stay only in component memory after payment and are never written to storage or URLs.
- Hold, booking, payment, refund, payout, and Guard operations wait for server confirmation and are not optimistic.
- Bangladesh schedules are converted through `Intl` with `Asia/Dhaka`; no fixed UTC offset is manually appended.
