"use client";

import { usePathname } from "next/navigation";
import { AdminResponsiveTabs } from "./AdminResponsiveTabs";

const ITEMS: { href: string; label: string }[] = [
  { href: "/admin/team", label: "Staff Home" },
  { href: "/admin/team/website-preview", label: "Website Preview" },
  { href: "/admin/team/promo-codes", label: "Promo Codes" },
  { href: "/admin/team/clients", label: "My Clients" },
  { href: "/admin/team/sales-tracker", label: "Sales Tracker" },
  { href: "/admin/team/customers/new", label: "Create Customer" },
  // Master Operating Book V2 §0G — visible to every staff role (not gated behind
  // showRosterLink), since self-editing your own contact profile is a personal action, not an
  // owner-only capability. The page itself decides what to show once identity is resolved.
  { href: "/admin/team/my-profile", label: "My Profile" },
];

export function StaffTeamNav({ showRosterLink = false }: { showRosterLink?: boolean }) {
  const pathname = usePathname() ?? "";

  const items = [
    ...ITEMS.map((item) => ({
      key: item.href,
      href: item.href,
      label: item.label,
      active: pathname === item.href || (item.href !== "/admin/team" && pathname.startsWith(item.href)),
    })),
    ...(showRosterLink
      ? [
          {
            key: "/admin/team/users/new",
            href: "/admin/team/users/new",
            label: "Create staff login",
            active: pathname.startsWith("/admin/team/users/new"),
          },
          {
            key: "/admin/team/roster",
            href: "/admin/team/roster",
            label: "Team roster (owner)",
            active: pathname.startsWith("/admin/team/roster"),
          },
          {
            key: "/admin/team/executive-hub",
            href: "/admin/team/executive-hub",
            label: "Executive Hub (owner)",
            active: pathname.startsWith("/admin/team/executive-hub"),
          },
        ]
      : []),
  ];

  return <AdminResponsiveTabs ariaLabel="Staff team navigation" items={items} />;
}
