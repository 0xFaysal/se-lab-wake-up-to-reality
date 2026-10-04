import type { Prisma } from "../../../../generated/prisma/client.js";

export function paymentSearchConditions(
  search: string,
): Prisma.PaymentWhereInput[] {
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return [
    ...(uuid.test(search) ? [{ id: { equals: search } }] : []),
    { providerReference: { contains: search, mode: "insensitive" } },
    { booking: { bookingCode: { contains: search, mode: "insensitive" } } },
    { payer: { email: { contains: search, mode: "insensitive" } } },
  ];
}
