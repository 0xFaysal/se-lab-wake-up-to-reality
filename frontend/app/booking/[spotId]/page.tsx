import { redirect } from "next/navigation";

export default async function BookingRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ spotId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { spotId } = await params;
  const search = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const qs = query.toString();
  redirect(`/driver/book/${spotId}${qs ? `?${qs}` : ""}`);
}
