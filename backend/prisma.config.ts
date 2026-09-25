import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma 7 removed datasource.directUrl. CLI workflows such as migrate
    // must receive the direct/session connection through datasource.url.
    url:
      process.env["DIRECT_URL"] ||
      process.env["DATABASE_URL"] ||
      "postgresql://placeholder:placeholder@localhost:5432/postgres",
  },
});
