# ParkEase BD Deployment

## Architecture

- Frontend: Vercel
- API: Render Docker web service in Singapore
- Redis-compatible store: Render Key Value in Singapore, private-network only
- PostgreSQL: Supabase in Singapore (`ap-southeast-1`)
- Property images: Cloudinary
- Email: Gmail SMTP with an app password

This keeps the API and Redis together on Render's private network. Supabase is
used for durable PostgreSQL storage because Render's free PostgreSQL databases
expire, while the Render Key Value store is suitable for OTP and rate-limit TTL
data.

## Supabase connection

Use the Supavisor **session pooler** connection string on port `5432` as
`DATABASE_URL`. The Render API is a persistent container, and session mode also
supports Prisma migrations. Append `sslmode=require` if it is not already in
the connection string.

Do not use the transaction pooler on port `6543` for `prisma migrate deploy`.

## Required Render secrets

The Blueprint prompts for values marked `sync: false`:

- `DATABASE_URL`: Supabase session-pooler URL
- `CORS_ORIGIN`: deployed frontend origin, for example `https://example.vercel.app`
- `API_PUBLIC_URL`: Render API URL, for example `https://parkease-api.onrender.com`
- `PASSWORD_RESET_URL`: frontend reset page, for example `https://example.vercel.app/reset-password`
- `DATA_ENCRYPTION_KEY`: a unique 64-character hexadecimal value
- `EMAIL_USERNAME` and `EMAIL_PASSWORD`: Gmail address and app password
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`

Never add these values to Git. For Vercel, set
`NEXT_PUBLIC_API_BASE_URL=https://parkease-api.onrender.com/api/v1` and redeploy
the frontend.

## Deploy behavior

The Docker image generates Prisma Client and compiles TypeScript. On startup it
runs `prisma migrate deploy`, then starts the API. Render checks `/health/ready`,
which verifies both PostgreSQL and Redis connectivity.

The free Render web service can sleep when idle, and the free Key Value service
does not persist data across restarts. No core records are stored in Redis, but
outstanding OTPs and rate-limit counters can be lost. Use paid Render instances
with Key Value persistence for a production launch.
