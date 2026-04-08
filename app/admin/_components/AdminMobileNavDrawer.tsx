"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import newLogo from "../../../public/logo.png";
import { ADMIN_GLOBAL_NAV } from "../_lib/adminGlobalNav";

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

export function AdminMobileNavDrawer({ tiendaInboxUnread = 0 }: { tiendaInboxUnread?: number }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 min-w-[44px] items-center justify-center rounded-2xl border border-[#E8DFD0] bg-white px-3 text-sm font-bold text-[#2C2416] shadow-sm"
        aria-expanded={open}
        aria-controls="admin-mobile-nav-panel"
        aria-label="Abrir menú de administración"
        title="Menú: Dashboard, usuarios, workspaces…"
      >
        ☰
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navegación admin">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar menú"
            onClick={close}
          />
          <div
            id="admin-mobile-nav-panel"
            className="absolute left-0 top-0 flex h-full w-[min(20rem,92vw)] flex-col border-r border-[#E8DFD0]/90 bg-gradient-to-b from-[#FFF5ED] via-[#FFFCF7] to-[#FAF0E6] shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#E8DFD0]/80 px-4 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[#D4BC6A]/50">
                  <Image src={newLogo} alt="" className="object-cover" fill sizes="40px" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Leonix</p>
                  <p className="truncate text-sm font-bold text-[#1E1810]">Global admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-[#E8DFD0] bg-white text-sm font-bold text-[#5C5346]"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-3" aria-label="Administración global">
              {ADMIN_GLOBAL_NAV.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cx(
                      "flex min-h-[44px] items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#C9B46A]/35"
                        : "text-[#3D3428]/90 active:bg-[#FFFCF7]/90"
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

            <div className="border-t border-[#E8DFD0]/80 p-3">
              <div className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-3 text-[11px] font-semibold text-[#5C5346]">
                <Link href="/admin/workspace" onClick={close} className="block min-h-[44px] py-2 text-[#6B5B2E] underline">
                  Website sections (workspaces)
                </Link>
                <Link href="/admin/site-settings" onClick={close} className="block min-h-[44px] py-2 text-[#6B5B2E] underline">
                  Ajustes globales del sitio
                </Link>
                <Link href="/" onClick={close} className="mt-1 block min-h-[44px] py-2 text-center text-xs font-bold text-[#6B5B2E] underline">
                  Ver sitio público →
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
