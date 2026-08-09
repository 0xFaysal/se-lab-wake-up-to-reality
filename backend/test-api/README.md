# REST Client API Tests

Use this folder with the VS Code **REST Client** extension.

Before testing, start the backend yourself:

```powershell
cd backend
npm.cmd run db:up
npx.cmd prisma migrate dev
npx.cmd prisma db seed
npm.cmd run dev
```

Open `auth.http`, then click **Send Request** above each request.

REST Client should keep auth cookies from `/auth/login` automatically. If `/auth/me` returns `401` after login, enable this VS Code setting:

```json
"rest-client.rememberCookiesForSubsequentRequests": true
```

Recommended test order:

1. `Health ready`
2. `Register driver`
3. `Register parking owner`
4. Invalid registration tests
5. `Login driver with email`
6. `Current user`
7. `Refresh auth session`
8. `Logout`
9. `Current user after logout`
10. Admin login tests

