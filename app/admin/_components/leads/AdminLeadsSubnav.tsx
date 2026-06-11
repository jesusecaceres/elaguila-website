"use client";

import { usePathname } from "next/navigation";
import { AdminResponsiveTabs } from "../AdminResponsiveTabs";

const TABS = [
  { href: "/admin/leads/inbox", label: "Lead inbox" },
  { href: "/admin/leads/newsletter", label: "Newsletter" },
  { href: "/admin/leads/media-kit", label: "Media kit" },
] as const;

export function AdminLeadsSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <AdminResponsiveTabs
      ariaLabel="Lead inboxes"
      items={TABS.map((tab) => ({
        key: tab.href,
        href: tab.href,
        label: tab.label,
        active: pathname === tab.href || pathname.startsWith(`${tab.href}/`),
      }))}
    />
  );
}
