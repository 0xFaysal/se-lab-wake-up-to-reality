import { AdminModulePage } from "@/components/admin/admin-module-page";

export default async function AdminCatchAllPage({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  return <AdminModulePage section={section.join("/")} />;
}
