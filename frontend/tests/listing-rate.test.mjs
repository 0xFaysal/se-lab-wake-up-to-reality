import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const source = await readFile(new URL("../lib/listing-rate.ts", import.meta.url), "utf8");
const runtime = stripTypeScriptTypes(source).replace(
  'from "./payout-amount"',
  `from "${new URL("../lib/payout-amount.ts", import.meta.url).href}"`,
);
const { listingRatePatch } = await import(`data:text/javascript;base64,${Buffer.from(runtime).toString("base64")}`);

test("rate updates send only exact hourly paisa, preserving all other offer settings", () => {
  assert.deepEqual(listingRatePatch("12.35"), { pricePerHourPaisa: "1235" });
  assert.deepEqual(listingRatePatch(" 18 "), { pricePerHourPaisa: "1800" });
});
test("invalid rates cannot reach the API", () => {
  for (const value of ["", "0", "0.00", "-1", "NaN", "1.234", "1e3", "99999999999999999999999"])
    assert.throws(() => listingRatePatch(value), /hourly rate/);
});
