# ParkEase API

Requirements: Node.js 22 LTS+, Docker Desktop, Git.

```bash
copy .env.example .env
npm install express cors helmet pino pino-http zod dotenv redis pg @prisma/client @prisma/adapter-pg
npm install -D typescript tsx prisma @types/node @types/express @types/cors @types/pg prettier
docker compose up -d
npx prisma migrate dev --name init
npm run dev
```

Open: http://localhost:4000/health/ready
