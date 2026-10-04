import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/query-keys.ts";

test("financial invalidation reaches balance, all history pages and both payout roles", async () => {
  const client = new QueryClient();
  const walletKeys = [queryKeys.wallet.current, queryKeys.wallet.transactions({ page: 1 }), queryKeys.wallet.transactions({ page: 2, type: "refund" })];
  const payoutKeys = [queryKeys.payouts.driver({ page: 1 }), queryKeys.payouts.provider({ page: 2 })];
  for (const key of [...walletKeys, ...payoutKeys, queryKeys.vehicles.all]) client.setQueryData(key, { fixture: true });
  await client.invalidateQueries({ queryKey: queryKeys.wallet.root });
  await client.invalidateQueries({ queryKey: queryKeys.payouts.root });
  for (const key of [...walletKeys, ...payoutKeys]) assert.equal(client.getQueryState(key).isInvalidated, true);
  assert.equal(client.getQueryState(queryKeys.vehicles.all).isInvalidated, false);
  client.clear();
});
