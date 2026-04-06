"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type WorkspaceNavItem = { href: string; label: string; hint?: string };

const SECTIONS: WorkspaceNavItem[] = [
  { href: "/admin/workspace/home", label: "Home", hint: "Homepage & landing" },
  { href: "/admin/workspace/clasificados", label: "Clasificados", hint: "Listings & moderation" },
  { href: "/admin/workspace/tienda", label: "Tienda", hint: "Storefront & catalog" },
  { href: "/admin/workspace/nosotros", label: "Nosotros", hint: "About the company" },
  { href: "/admin/workspace/revista", label: "Revista", hint: "Magazine & issues" },
  { href: "/admin/workspace/contacto", label: "Contacto", hint: "Contact & hours" },
];

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

/**
 * Second-layer admin navigation — website section workspaces only.
 * Not a mirror of the public site nav; teaches where editorial vs ops live.
 */
export function AdminWorkspaceNav() {
  const pathname = usePathname() ?? "";

  return (
    <div className="mb-8 rounded-2xl border border-[#C9B46A]/35 bg-gradient-to-r from-[#FFF8F0]/95 to-[#FFFCF7]/90 px-3 py-3 shadow-sm sm:px-4">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Website sections</p>
          <p className="text-xs text-[#5C5346]/90">Admin-only workspaces — not the public menu.</p>
        </div>
        <Link
          href="/admin/workspace"
          className={cx(
            "shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold transition",
            pathname === "/admin/workspace"
              ? "bg-[#2A2620] text-[#FAF7F2]"
              : "text-[#6B5B2E] underline decoration-[#C9B46A]/60 underline-offset-2 hover:text-[#2A2620]"
          )}
        >
          Overview
        </Link>
      </div>
      <nav className="flex flex-wrap gap-1.5 sm:gap-2" aria-label="Website section workspaces">
        {SECTIONS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.hint}
              className={cx(
                "inline-flex min-h-[2.25rem] items-center rounded-xl border px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                active
                  ? "border-[#C9B46A]/50 bg-[#FBF7EF] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                  : "border-transparent bg-white/60 text-[#3D3428]/90 hover:border-[#E8DFD0] hover:bg-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
