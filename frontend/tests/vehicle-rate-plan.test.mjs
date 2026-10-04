import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
const source = await readFile(
  new URL("../lib/vehicle-rate-plan.ts", import.meta.url),
  "utf8",
);
const runtime = stripTypeScriptTypes(source).replace(
  /from "\.\/(payout-amount|listing-overtime)"/g,
  (_, file) => `from "${new URL(`../lib/${file}.ts`, import.meta.url).href}"`,
);
const { vehicleRatePlan } = await import(
  `data:text/javascript;base64,${Buffer.from(runtime).toString("base64")}`
);
const input = {
  rightId: "right",
  title: "Basement",
  vehicles: ["SEDAN", "SUV"],
  rates: { SEDAN: "18.25", SUV: "30" },
  deposit: "400",
  minimum: "60",
  maximum: "720",
  overtimeMultiplier: "1.5",
};
test("vehicle rates use exact paisa and target the same physical resource", () => {
  const plan = vehicleRatePlan(input);
  assert.deepEqual(
    plan.map((offer) => offer.pricePerHourPaisa),
    ["1825", "3000"],
  );
  assert.deepEqual(
    plan.map((offer) => offer.allowedVehicleTypes),
    [["SEDAN"], ["SUV"]],
  );
  assert.ok(
    plan.every(
      (offer) =>
        offer.parkingRightId === "right" &&
        offer.securityDepositPaisa === "40000" &&
        offer.overtimeGracePeriodMinutes === 5,
    ),
  );
});
test("invalid or missing vehicle rates and duration cannot be submitted", () => {
  for (const rates of [
    {},
    { SEDAN: "0", SUV: "30" },
    { SEDAN: "18.251", SUV: "30" },
  ])
    assert.throws(() => vehicleRatePlan({ ...input, rates }));
  assert.throws(() => vehicleRatePlan({ ...input, maximum: "30" }));
  assert.throws(() => vehicleRatePlan({ ...input, deposit: "-1" }));
  assert.throws(() => vehicleRatePlan({ ...input, overtimeMultiplier: "6" }));
});
