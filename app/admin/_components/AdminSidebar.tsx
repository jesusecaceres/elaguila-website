"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import newLogo from "../../../public/logo.png";

/** Global operations only — website sections live under `/admin/workspace` (second-layer nav). */
const NAV: Array<{ href: string; label: string; icon: string; badgeFrom?: "tienda" }> = [
  { href: "/admin", label: "Dashboard", icon: "◆", badgeFrom: "tienda" },
  { href: "/admin/usuarios", label: "Users", icon: "◎" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/support", label: "Support", icon: "💬" },
  { href: "/admin/team", label: "Team", icon: "👥" },
  { href: "/admin/activity-log", label: "Activity Log", icon: "📋" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

export function AdminSidebar({ tiendaInboxUnread = 0 }: { tiendaInboxUnread?: number }) {
  const pathname = usePathname() ?? "";

  return (
    <aside className="flex h-full w-full flex-col border-r border-[#E8DFD0]/90 bg-gradient-to-b from-[#FFF5ED] via-[#FFFCF7] to-[#FAF0E6]">
      <div className="flex items-center gap-3 border-b border-[#E8DFD0]/80 px-4 py-5">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[#D4BC6A]/50">
          <Image src={newLogo} alt="Leonix" className="object-cover" fill sizes="40px" priority />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Leonix</p>
          <p className="text-sm font-bold text-[#1E1810]">Global admin</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#C9B46A]/35"
                  : "text-[#3D3428]/90 hover:bg-[#FFFCF7]/90"
              )}
            >
              <span className="w-6 text-center text-base opacity-80" aria-hidden>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badgeFrom === "tienda" && tiendaInboxUnread > 0 ? (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[1.25rem] text-center">
                  {tiendaInboxUnread > 99 ? "99+" : tiendaInboxUnread}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#E8DFD0]/80 p-4">
        <div className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-3">
          <p className="text-xs font-semibold text-[#1E1810]">Leonix Admin</p>
          <p className="text-[11px] text-[#7A7164]">Signed in via cookie</p>
          <div className="mt-2 space-y-1.5 text-[11px] font-semibold text-[#5C5346]">
            <Link className="block text-[#6B5B2E] underline underline-offset-2" href="/admin/workspace">
              Website sections (workspaces)
            </Link>
            <Link className="block text-[#6B5B2E] underline underline-offset-2" href="/admin/site-settings">
              Site modules (global)
            </Link>
          </div>
          <Link className="mt-2 block text-center text-xs font-bold text-[#6B5B2E] underline" href="/">
            View site →
          </Link>
        </div>
      </div>
    </aside>
  );
}
