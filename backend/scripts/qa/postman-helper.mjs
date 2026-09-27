// Local-only helper for the Postman system test collection (docs/testing/postman).
//
//   node scripts/qa/postman-helper.mjs reset-rate-limits
//       Deletes the API's rate-limit counters in Redis so the next collection
//       stage starts from a clean budget. The limits themselves are unchanged.
//
//   node scripts/qa/postman-helper.mjs attach-test-images <runId>
//       Cloudinary is not configured locally, so image upload returns 502.
//       Admin approval requires at least one image, so this inserts one
//       placeholder image row (provider "QA_PLACEHOLDER") for each Property
//       whose name contains <runId> and has no image yet.
//
// Both commands refuse to run unless PostgreSQL and Redis point at localhost.
import "dotenv/config";
import pg from "pg";
import { createClient } from "redis";

const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function assertLocal(name, value) {
  if (!value) throw new Error(`${name} is not set`);
  const host = new URL(value).hostname;
  if (!localHosts.has(host) || process.env.NODE_ENV === "production") {
    throw new Error(`Refusing to run: ${name} does not point at localhost`);
  }
}

async function resetRateLimits() {
  assertLocal("REDIS_URL", process.env.REDIS_URL);
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  let deleted = 0;
  for await (const keys of redis.scanIterator({
    MATCH: "rate-limit:*",
    COUNT: 500,
  })) {
    const batch = Array.isArray(keys) ? keys : [keys];
    if (batch.length > 0) deleted += await redis.del(batch);
  }
  await redis.quit();
  console.log(`Cleared ${deleted} rate-limit counter(s).`);
}

async function attachTestImages(runId) {
  if (!runId || !/^[a-z0-9]{4,12}$/.test(runId)) {
    throw new Error(
      "Usage: attach-test-images <runId> (the runId shown in the collection's first request)",
    );
  }
  assertLocal("DATABASE_URL", process.env.DATABASE_URL);
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query(
    `insert into property_images (id, property_id, storage_key, url, provider, image_type, sort_order, is_cover)
     select gen_random_uuid(), p.id, 'qa-placeholder/' || p.id || '/cover',
            'https://images.example.test/qa-placeholder-' || p.id || '.png',
            'QA_PLACEHOLDER', 'EXTERIOR', 0, true
       from properties p
      where p.name like $1
        and p.deleted_at is null
        and not exists (select 1 from property_images i where i.property_id = p.id)
     returning property_id`,
    [`%${runId}%`],
  );
  await client.end();
  console.log(
    `Attached a placeholder image to ${rows.length} Property(ies) for run ${runId}.`,
  );
}

const [command, argument] = process.argv.slice(2);
try {
  if (command === "reset-rate-limits") await resetRateLimits();
  else if (command === "attach-test-images") await attachTestImages(argument);
  else {
    console.log("Commands: reset-rate-limits | attach-test-images <runId>");
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
