type Entry = {
  id: string;
  entrySide: "DEBIT" | "CREDIT";
  amountPaisa: string;
  createdAt: string;
  ledgerTransaction: { id: string; description: string };
};

export function walletActivity(entries: Entry[]) {
  const transactions = new Map<string, { id: string; description: string; createdAt: string; netPaisa: bigint }>();
  for (const entry of entries) {
    const id = entry.ledgerTransaction.id;
    const item = transactions.get(id) ?? { id, description: entry.ledgerTransaction.description,
      createdAt: entry.createdAt, netPaisa: BigInt(0) };
    item.netPaisa += BigInt(entry.amountPaisa) * BigInt(entry.entrySide === "CREDIT" ? 1 : -1);
    transactions.set(id, item);
  }
  return [...transactions.values()];
}
