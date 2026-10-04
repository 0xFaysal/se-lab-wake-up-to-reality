import { redirect } from "next/navigation";

export default async function PropertySetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/provider/properties/${id}#parking-workspace`);
}
