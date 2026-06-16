"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { AdminResponsiveTabs } from "../AdminResponsiveTabs";
import {
  ADMIN_LAUNCH_LEADS_INBOX_HREF,
  ADMIN_LEADS_PROMO_INBOX_HREF,
  isAdminLeadsPromoViewParam,
} from "@/app/admin/_lib/adminNavOps";

const TABS = [
  { key: "inbox", href: ADMIN_LAUNCH_LEADS_INBOX_HREF, label: "Lead inbox" },
  { key: "newsletter", href: "/admin/leads/newsletter", label: "Newsletter" },
  { key: "media-kit", href: "/admin/leads/media-kit", label: "Media kit" },
  { key: "promocionales", href: ADMIN_LEADS_PROMO_INBOX_HREF, label: "Promocionales" },
] as const;

export function AdminLeadsSubnav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const promoView = isAdminLeadsPromoViewParam(searchParams?.get("view"));

  return (
    <div data-testid="admin-leads-top-tabs">
      <AdminResponsiveTabs
      ariaLabel="Lead inboxes"
      variant="rectangular"
      items={TABS.map((tab) => {
        const onInbox = pathname === ADMIN_LAUNCH_LEADS_INBOX_HREF || pathname.startsWith(`${ADMIN_LAUNCH_LEADS_INBOX_HREF}/`);
        let active = false;
        if (tab.key === "inbox") active = onInbox && !promoView;
        else if (tab.key === "promocionales") active = onInbox && promoView;
        else active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return {
          key: tab.key,
          href: tab.href,
          label: tab.label,
          active,
        };
      })}
      />
    </div>
  );
}
