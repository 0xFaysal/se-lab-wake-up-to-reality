import assert from "node:assert/strict";
import { it } from "node:test";
import {
  BookingStatus,
  PaymentPurpose,
  PaymentStatus,
  type Prisma,
} from "../../../generated/prisma/client.js";
import "../../helpers/test-env.js";
const { lockPendingPaymentAttempt, assertGatewayPaymentIdentity } =
  await import("../../../src/modules/payments/payment-attempt-state.js");
const { prisma } = await import("../../../src/config/prisma.js");
const {
  recordGatewayExit,
  validateAndCaptureSslCommerz,
  initiateSslCommerzSession,
} = await import("../../../src/modules/payments/payment.service.js");
const { env } = await import("../../../src/config/env.js");

const input = {
  paymentId: "payment",
  bookingId: "booking",
  merchantTransactionId: "attempt-1",
};

it("validated gateway identity must match the locked payment's exact funding", () => {
  const payment = {
    merchantTransactionId: "attempt-1",
    provider: "SSLCOMMERZ",
    amountPaisa: 1000n,
    currency: "BDT",
  };
  const validated = {
    merchantTransactionId: "attempt-1",
    amountPaisa: 1000n,
    currency: "BDT",
  };
  assert.doesNotThrow(() => assertGatewayPaymentIdentity(payment, validated));
  for (const [change, code] of [
    [{ merchantTransactionId: "attempt-2" }, "PAYMENT_IDENTITY_MISMATCH"],
    [{ provider: "INTERNAL_WALLET" }, "PAYMENT_GATEWAY_MISMATCH"],
    [{ amountPaisa: 1001n }, "PAYMENT_AMOUNT_MISMATCH"],
    [{ currency: "USD" }, "PAYMENT_AMOUNT_MISMATCH"],
  ] as const)
    assert.throws(
      () => assertGatewayPaymentIdentity({ ...payment, ...change }, validated),
      { code },
    );
});

for (const purpose of [PaymentPurpose.BOOKING, PaymentPurpose.SETTLEMENT]) {
  for (const scenario of [
    {
      change: { merchantTransactionId: "attempt-2" },
      code: "PAYMENT_IDENTITY_MISMATCH",
    },
    { change: { amountPaisa: 2000n }, code: "PAYMENT_AMOUNT_MISMATCH" },
  ]) {
    it(`actual ${purpose} capture rejects locked ${scenario.code} without posting funds`, async (t) => {
      const oldEnv = {
        SSLCOMMERZ_ENABLED: env.SSLCOMMERZ_ENABLED,
        SSLCOMMERZ_STORE_ID: env.SSLCOMMERZ_STORE_ID,
        SSLCOMMERZ_STORE_PASSWORD: env.SSLCOMMERZ_STORE_PASSWORD,
      };
      const originalFind = prisma.payment.findUnique;
      const originalTransaction = prisma.$transaction;
      t.after(() => {
        Object.assign(env, oldEnv);
        Object.assign(prisma.payment, { findUnique: originalFind });
        Object.assign(prisma, { $transaction: originalTransaction });
      });
      Object.assign(env, {
        SSLCOMMERZ_ENABLED: true,
        SSLCOMMERZ_STORE_ID: "unit-test-store",
        SSLCOMMERZ_STORE_PASSWORD: "unit-test-password",
      });
      t.mock.method(globalThis, "fetch", async () =>
        Response.json({
          status: "VALID",
          tran_id: "attempt-1",
          val_id: "validation",
          amount: "10.00",
          currency: "BDT",
        }),
      );
      const initial = {
        id: "payment",
        bookingId: "booking",
        merchantTransactionId: "attempt-1",
        amountPaisa: 1000n,
        currency: "BDT",
        provider: "SSLCOMMERZ",
        purpose,
        status: PaymentStatus.SESSION_CREATED,
      };
      Object.assign(prisma.payment, { findUnique: async () => initial });
      const calls: string[] = [];
      const tx = {
        $queryRaw: async (_sql: unknown, key: string) => {
          calls.push(key);
          return [];
        },
        payment: {
          findUnique: async () => ({
            ...initial,
            ...scenario.change,
            booking: { id: "booking", settlement: {} },
          }),
        },
      } as unknown as Prisma.TransactionClient;
      Object.assign(prisma, {
        $transaction: async (
          action: (db: Prisma.TransactionClient) => unknown,
        ) => action(tx),
      });
      await assert.rejects(
        validateAndCaptureSslCommerz("attempt-1", "validation"),
        { code: scenario.code },
      );
      assert.deepEqual(calls, ["booking:booking", "payment:payment"]);
    });
  }
}

for (const scenario of [
  {
    bookingStatus: BookingStatus.CANCELLED,
    paymentStatus: PaymentStatus.CREATED,
    startAt: new Date(Date.now() + 60_000),
  },
  {
    bookingStatus: BookingStatus.PAYMENT_PENDING,
    paymentStatus: PaymentStatus.CREATED,
    startAt: new Date(0),
  },
  {
    bookingStatus: BookingStatus.PAYMENT_PENDING,
    paymentStatus: PaymentStatus.CANCELLED,
    startAt: new Date(Date.now() + 60_000),
  },
]) {
  it(`actual wallet-only confirmation rejects ${scenario.bookingStatus}/${scenario.paymentStatus}/${scenario.startAt.getTime() === 0 ? "past" : "future"}`, async (t) => {
    const originalTransaction = prisma.$transaction;
    t.after(() => Object.assign(prisma, { $transaction: originalTransaction }));
    const payment = {
      id: "payment",
      bookingId: "booking",
      amountPaisa: 0n,
      provider: "INTERNAL_WALLET",
      idempotencyKey: "key",
      status: scenario.paymentStatus,
    };
    const tx = {
      $queryRaw: async () => [],
      payment: {
        findUnique: async () => ({
          ...payment,
          booking: {
            id: "booking",
            status: scenario.bookingStatus,
            startAt: scenario.startAt,
          },
        }),
      },
    } as unknown as Prisma.TransactionClient;
    let invocations = 0;
    Object.assign(prisma, {
      $transaction: async (
        action: (db: Prisma.TransactionClient) => unknown,
      ) => {
        if (++invocations === 1)
          return {
            existing: false,
            walletOnly: true,
            payment,
            booking: { id: "booking" },
          };
        return action(tx);
      },
    });
    await assert.rejects(
      initiateSslCommerzSession("driver", "booking", "key"),
      { code: "BOOKING_PAYMENT_WINDOW_CLOSED" },
    );
  });
}

it("actual exit handler preserves payment captured while waiting for its lock", async (t) => {
  const { tx, calls } = transaction(PaymentStatus.SUCCEEDED);
  const originalFind = prisma.payment.findUnique;
  const originalTransaction = prisma.$transaction;
  t.after(() => {
    Object.assign(prisma.payment, { findUnique: originalFind });
    Object.assign(prisma, { $transaction: originalTransaction });
  });
  Object.assign(prisma.payment, {
    findUnique: async () => ({
      ...input,
      id: input.paymentId,
      status: PaymentStatus.SESSION_CREATED,
      payerUserId: "driver",
    }),
  });
  Object.assign(prisma, {
    $transaction: async (action: (db: Prisma.TransactionClient) => unknown) =>
      action(tx),
  });
  assert.equal(await recordGatewayExit("attempt-1", "FAILED"), "payment");
  assert.deepEqual(calls, ["booking:booking", "payment:payment", "read"]);
});

it("actual exit handler ignores an old callback after another attempt replaced it", async (t) => {
  const { tx, calls } = transaction(PaymentStatus.CREATED, "attempt-2");
  const originalFind = prisma.payment.findUnique;
  const originalTransaction = prisma.$transaction;
  t.after(() => {
    Object.assign(prisma.payment, { findUnique: originalFind });
    Object.assign(prisma, { $transaction: originalTransaction });
  });
  Object.assign(prisma.payment, {
    findUnique: async () => ({
      ...input,
      id: input.paymentId,
      status: PaymentStatus.SESSION_CREATED,
      payerUserId: "driver",
    }),
  });
  Object.assign(prisma, {
    $transaction: async (action: (db: Prisma.TransactionClient) => unknown) =>
      action(tx),
  });
  assert.equal(await recordGatewayExit("attempt-1", "CANCELLED"), "payment");
  assert.deepEqual(calls, ["booking:booking", "payment:payment", "read"]);
});

function transaction(
  status: PaymentStatus,
  merchantTransactionId = "attempt-1",
  bookingId = "booking",
) {
  const calls: string[] = [];
  const payment = { id: "payment", status, merchantTransactionId, bookingId };
  const tx = {
    $queryRaw: async (_sql: unknown, key: string) => {
      calls.push(key);
      return [];
    },
    payment: {
      findUnique: async () => {
        calls.push("read");
        return payment;
      },
    },
  } as unknown as Prisma.TransactionClient;
  return { tx, calls, payment };
}

it("reads current state only after booking and payment locks", async () => {
  const { tx, calls, payment } = transaction(PaymentStatus.CREATED);
  assert.equal(await lockPendingPaymentAttempt(tx, input), payment);
  assert.deepEqual(calls, ["booking:booking", "payment:payment", "read"]);
});

it("late exit callbacks cannot change paid, refunded or terminal attempts", async () => {
  for (const status of [
    PaymentStatus.SUCCEEDED,
    PaymentStatus.CAPTURED,
    PaymentStatus.REFUND_PENDING,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
    PaymentStatus.CANCELLED,
    PaymentStatus.FAILED,
    PaymentStatus.EXPIRED,
  ]) {
    assert.equal(
      await lockPendingPaymentAttempt(transaction(status).tx, input),
      null,
    );
  }
});

it("stale responses cannot change the newer merchant attempt", async () => {
  assert.equal(
    await lockPendingPaymentAttempt(
      transaction(PaymentStatus.CREATED, "attempt-2").tx,
      input,
    ),
    null,
  );
});

it("session creation and its error cleanup only own CREATED state", async () => {
  assert.equal(
    await lockPendingPaymentAttempt(
      transaction(PaymentStatus.SESSION_CREATED).tx,
      input,
      [PaymentStatus.CREATED],
    ),
    null,
  );
  const { tx, payment } = transaction(PaymentStatus.SESSION_CREATED);
  assert.equal(await lockPendingPaymentAttempt(tx, input), payment);
});

it("missing or mismatched booking payment is not writable", async () => {
  assert.equal(
    await lockPendingPaymentAttempt(
      transaction(PaymentStatus.CREATED, "attempt-1", "other").tx,
      input,
    ),
    null,
  );
  const tx = {
    $queryRaw: async () => [],
    payment: { findUnique: async () => null },
  } as unknown as Prisma.TransactionClient;
  assert.equal(await lockPendingPaymentAttempt(tx, input), null);
});
