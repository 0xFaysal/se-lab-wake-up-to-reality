# REST Client API Tests

Use the `.http` files with the VS Code REST Client extension. Start PostgreSQL,
Redis, migrations, seed, and the API yourself before sending requests.

Enable cookie persistence in VS Code settings:

```json
"rest-client.rememberCookiesForSubsequentRequests": true
```

Recommended order:

1. Health live and ready
2. Register driver
3. Current user without a second login
4. Duplicate normalized phone
5. Login with email and each supported phone format
6. Refresh and old-token reuse checks
7. Session list and revoke
8. Change password
9. Mandatory email verification
10. Optional phone verification
11. Password reset
12. Logout and logout-all

Email verification codes are sent to the registered address through Gmail.
Development responses also expose the code for local testing. Phone verification
is optional and never blocks account access; using it in production still requires
an SMS delivery provider.

`property-guards.http` covers shared Property membership, Guard consent, and
Provider-specific assignments. `manager-delegations.http` covers scoped Manager
permissions. `provider-properties.http`, `property-governance.http`,
`property-change-proposals.http`, and `admin-property-merge.http` separate the
canonical membership, voting, shared-change, duplicate-detection, and merge
flows. The older `guard-assignments.http` remains as a compatibility example.
Replace placeholder identifiers with seeded or locally created records before
running those requests.

The marketplace flow is split across `parking-resources-rights-listings.http`,
`admin-parking-rights.http`, `parking-booking-flow.http`,
`guard-booking-operations.http`, and `marketplace-finance-operations.http`.
Run Provider setup and Admin right verification before the Driver booking flow.
