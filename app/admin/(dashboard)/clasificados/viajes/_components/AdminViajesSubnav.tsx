"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_VIAJES_NAV } from "@/app/admin/_lib/adminViajesNav";

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

export function AdminViajesSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-[#E8DFD0]/90 pb-4"
      aria-label="Viajes admin sections"
    >
      {ADMIN_VIAJES_NAV.map((item) => {
        const active = pathname === item.href || (item.href !== "/admin/clasificados/viajes" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "inline-flex min-h-[40px] items-center rounded-2xl px-3 py-2 text-xs font-bold transition sm:text-sm",
              active
                ? "bg-[#2A2620] text-[#FAF7F2] shadow-md"
                : "border border-[#E8DFD0]/90 bg-white/90 text-[#3D3428] hover:border-[#C9B46A]/50"
            )}
          >
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
