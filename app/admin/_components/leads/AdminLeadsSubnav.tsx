"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/leads/newsletter", label: "Newsletter" },
  { href: "/admin/leads/media-kit", label: "Media kit" },
] as const;

export function AdminLeadsSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Lead inboxes">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active
                ? "border-[#6B5B2E] bg-[#FAF3E6] text-[#2C2416]"
                : "border-[#E8DFD0] text-[#5C5346] hover:bg-[#FAF7F2]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
