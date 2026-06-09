"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminCtaChipSecondary } from "./adminTheme";

const ITEMS: { href: string; label: string }[] = [
  { href: "/admin/team", label: "Staff Home" },
  { href: "/admin/team/website-preview", label: "Website Preview" },
  { href: "/admin/team/promo-codes", label: "Promo Codes" },
  { href: "/admin/team/clients", label: "My Clients" },
  { href: "/admin/team/sales-tracker", label: "Sales Tracker" },
  { href: "/admin/team/customers/new", label: "Create Customer" },
];

export function StaffTeamNav({ showRosterLink = false }: { showRosterLink?: boolean }) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Staff team navigation">
      {ITEMS.map((item) => {
        const active = pathname === item.href || (item.href !== "/admin/team" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${adminCtaChipSecondary} ${active ? "ring-2 ring-[#C9B46A]/60" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      {showRosterLink ? (
        <>
          <Link href="/admin/team/users/new" className={`${adminCtaChipSecondary} border-dashed`}>
            Create staff login
          </Link>
          <Link href="/admin/team/roster" className={`${adminCtaChipSecondary} border-dashed`}>
            Team roster (owner)
          </Link>
        </>
      ) : null}
    </nav>
  );
}
