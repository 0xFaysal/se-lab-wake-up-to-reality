"use client";
import { ProviderPageHeader } from "./provider-page";
export function OwnerHeader({ title = "Overview", subtitle = "", actions, badge }: {title?: string;subtitle?: string;actions?: React.ReactNode;badge?: React.ReactNode}) {
  return <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"><ProviderPageHeader title={title} description={subtitle} actions={<>{badge}{actions}</>} /></div>;
}
