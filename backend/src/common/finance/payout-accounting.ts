export function allocatePayoutDebits(
  amountPaisa: bigint,
  balances: { providerPaisa: bigint; driverPaisa: bigint },
) {
  const provider = balances.providerPaisa > 0n ? balances.providerPaisa : 0n;
  const driver = balances.driverPaisa > 0n ? balances.driverPaisa : 0n;
  if (amountPaisa <= 0n || amountPaisa > provider + driver) {
    throw new RangeError("Payout exceeds ledger-backed wallet liabilities");
  }
  const providerDebit = amountPaisa < provider ? amountPaisa : provider;
  return [
    { accountCode: "PROVIDER_PAYABLE", amountPaisa: providerDebit },
    {
      accountCode: "DRIVER_REFUND_LIABILITY",
      amountPaisa: amountPaisa - providerDebit,
    },
  ].filter((entry) => entry.amountPaisa > 0n);
}
