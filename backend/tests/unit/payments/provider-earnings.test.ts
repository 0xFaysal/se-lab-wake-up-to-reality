import assert from "node:assert/strict";
import { it } from "node:test";
import type { Prisma } from "../../../generated/prisma/client.js";
import "../../helpers/test-env.js";
const { creditProviderEarnings } =
  await import("../../../src/modules/payments/provider-earnings.js");

function fakeTransaction(disputed: boolean) {
  const calls: Array<{ target: string; data: Record<string, unknown> }> = [];
  const tx = {
    $queryRaw: async () => [],
    dispute: {
      findFirst: async () => (disputed ? { id: "dispute" } : null),
      update: async (args: { data: Record<string, unknown> }) => {
        calls.push({ target: "dispute", data: args.data });
      },
    },
    walletAccount: {
      update: async (args: { data: Record<string, unknown> }) => {
        calls.push({ target: "wallet", data: args.data });
      },
    },
  } as unknown as Prisma.TransactionClient;
  return { tx, calls };
}

it("settlement earnings stay pending, not available", async () => {
  const { tx, calls } = fakeTransaction(false);
  await creditProviderEarnings(tx, "booking", "wallet", 6000n);
  assert.deepEqual(calls, [
    {
      target: "wallet",
      data: {
        pendingBalancePaisa: { increment: 6000n },
        balanceVersion: { increment: 1 },
      },
    },
  ]);
});
it("a dispute opened before checkout holds exactly that settlement's earnings", async () => {
  const { tx, calls } = fakeTransaction(true);
  await creditProviderEarnings(tx, "booking", "wallet", 6000n);
  assert.deepEqual(calls, [
    {
      target: "wallet",
      data: {
        heldBalancePaisa: { increment: 6000n },
        balanceVersion: { increment: 1 },
      },
    },
    { target: "dispute", data: { providerHeldPaisa: { increment: 6000n } } },
  ]);
});
it("zero earnings do not create a balance movement", async () => {
  const { tx, calls } = fakeTransaction(true);
  await creditProviderEarnings(tx, "booking", "wallet", 0n);
  assert.deepEqual(calls, []);
});
