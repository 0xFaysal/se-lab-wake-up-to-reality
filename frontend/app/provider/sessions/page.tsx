import { Suspense } from "react";
import { PageSkeleton, ProviderPage } from "@/components/provider/provider-page";
import { ProviderSessionWorkspace } from "@/components/provider/provider-session-workspace";
export default function ProviderSessionsPage() { return <Suspense fallback={<ProviderPage><PageSkeleton label="Loading live sessions" /></ProviderPage>}><ProviderSessionWorkspace /></Suspense>; }
