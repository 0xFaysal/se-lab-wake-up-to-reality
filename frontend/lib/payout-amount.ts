export function parseBDTToPaisa(value: string): bigint | null {
  const normalized = value.trim();
  if (!/^\d{1,17}(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const paisa = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return paisa <= BigInt("9223372036854775807") ? paisa : null;
}

export function validatePayoutAmount(value: string, availablePaisa: bigint): string | null {
  const paisa = parseBDTToPaisa(value);
  if (paisa === null) return "Enter a BDT amount with no more than two decimal places.";
  if (paisa <= BigInt(0)) return "Enter an amount greater than zero.";
  if (paisa > availablePaisa) return "Enter an amount within your available balance.";
  return null;
}
