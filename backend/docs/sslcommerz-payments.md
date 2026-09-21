# SSLCOMMERZ payment architecture

## Financial source of truth

PostgreSQL is the ParkEase financial source of truth. The browser cannot set an amount or mark a payment successful. A booking stores immutable price snapshots in paisa. SSLCOMMERZ receives a decimal amount only at the gateway adapter boundary.

The successful flow is:

1. The authenticated Driver asks the backend to create a hosted checkout session.
2. The backend loads the booking amount and customer profile, creates a Payment and PaymentAttempt, then requests a gateway session.
3. The frontend redirects to the returned `GatewayPageURL`.
4. IPN or success callback supplies `tran_id` and `val_id` to the backend.
5. The backend calls the validation API and matches transaction ID, BDT amount, currency, payment, booking, and risk status.
6. One serializable database transaction posts the balanced ledger, credits only the provider component to the pending wallet balance, confirms the booking, creates the access credential, and marks the payment `SUCCEEDED`.

The success redirect is only navigation. Replaying it cannot create a successful payment because validation and database state guards are required.

## Compatibility

Historical `SIMULATED` payments and the legacy `CAPTURED` status remain readable. Simulated capture is enabled only when `SIMULATED_PAYMENTS_ENABLED=true`; production should always set it to `false`.

## Refund policy

Drivers do not submit a refund amount. The preview and request endpoints calculate it from the captured payment and prior pending/successful refunds. Self-service cancellation currently permits the remaining full amount until two hours before the booking starts. Admin refunds may be partial but remain bounded by the server-calculated remaining amount.

SSLCOMMERZ refunds are first recorded as `PROCESSING`. Wallet and ledger reversal occurs only after the gateway refund query reports `refunded`. Simulated development refunds complete immediately while preserving the same balanced reversal.

## Required configuration

Set all variables documented in `.env.example`. Callback URLs must be public backend HTTPS URLs, not SSLCOMMERZ example success/fail pages. `SSLCOMMERZ_STORE_PASSWORD` is the API Store Password issued for the Store ID; it is not the merchant portal login password.

For local hosted-checkout testing, expose the local API through a trusted HTTPS tunnel and use those callback URLs. Never commit real credentials.

## Deployment sequence

1. Rotate any credential that has been shared in chat, logs, or screenshots.
2. Add the Store ID and API Store Password to the deployment secret manager.
3. Configure public HTTPS success, fail, cancel, and IPN URLs.
4. Apply `20260919130000_sslcommerz_payment_lifecycle`.
5. Generate Prisma Client and deploy backend and frontend together.
6. Keep `SSLCOMMERZ_ENVIRONMENT=sandbox` until test payments, duplicate IPNs, cancel/fail returns, and refunds pass.
7. Enable live mode only in production with separately issued live credentials.
