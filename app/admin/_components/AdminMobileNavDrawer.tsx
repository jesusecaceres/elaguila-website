"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import newLogo from "../../../public/logo.png";
import { ADMIN_GLOBAL_NAV, isAdminGlobalNavItemActive } from "../_lib/adminGlobalNav";
import { useAdminT } from "./AdminI18nProvider";

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

export function AdminMobileNavDrawer({
  tiendaInboxUnread = 0,
  allowedGlobalNavHrefs,
  salesRepLimited = false,
}: {
  tiendaInboxUnread?: number;
  allowedGlobalNavHrefs?: string[];
  salesRepLimited?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const t = useAdminT();
  const [open, setOpen] = useState(false);
  const navItems =
    allowedGlobalNavHrefs && allowedGlobalNavHrefs.length > 0
      ? ADMIN_GLOBAL_NAV.filter((item) => allowedGlobalNavHrefs.includes(item.href))
      : ADMIN_GLOBAL_NAV;

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
        className="flex h-11 min-w-[44px] items-center justify-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-3 text-sm font-bold text-[color:var(--lx-text)] shadow-sm"
        aria-expanded={open}
        aria-controls="admin-mobile-nav-panel"
        aria-label={t("mobile.openMenu")}
        title={t("mobile.menuTitle")}
      >
        ☰
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("mobile.navDialog")}>
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("mobile.closeOverlay")} onClick={close} />
          <div
            id="admin-mobile-nav-panel"
            className="absolute left-0 top-0 flex h-full w-[min(20rem,92vw)] flex-col border-r border-[color:var(--lx-border)]/70 bg-[color:var(--lx-section)] shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[color:var(--lx-border)]/70 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[color:var(--lx-border)]">
                  <Image src={newLogo} alt="" className="object-cover" fill sizes="40px" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{t("shell.leonixBrand")}</p>
                  <p className="truncate text-sm font-bold text-[color:var(--lx-text)]">{t("shell.globalAdmin")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-sm font-bold text-[color:var(--lx-muted)]"
                aria-label={t("mobile.close")}
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-3" aria-label={t("mobile.globalNav")}>
              {navItems.map((item) => {
                const active = isAdminGlobalNavItemActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cx(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-[color:var(--lx-canvas)] text-[color:var(--lx-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.80)] ring-1 ring-[color:var(--lx-border)]/40"
                        : "text-[color:var(--lx-text-2)]/90 active:bg-[color:var(--lx-card)]",
                    )}
                  >
                    <span className="w-6 text-center text-base opacity-80" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="flex-1">{t(item.labelKey)}</span>
                    {item.badgeFrom === "tienda" && tiendaInboxUnread > 0 ? (
                      <span className="min-w-[1.25rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                        {tiendaInboxUnread > 99 ? "99+" : tiendaInboxUnread}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[color:var(--lx-border)]/70 p-3">
              <div className="rounded-lg border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-card)] p-3 text-[11px] font-semibold text-[color:var(--lx-muted)]">
                {!salesRepLimited ? (
                  <>
                    <Link href="/admin/workspace" onClick={close} className="block min-h-[44px] py-2 text-[#7A1E2C] underline">
                      {t("shell.websiteSectionsLink")}
                    </Link>
                    <Link href="/admin/site-settings" onClick={close} className="block min-h-[44px] py-2 text-[#7A1E2C] underline">
                      {t("shell.globalSiteSettingsLink")}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/admin/workspace/promo-codes" onClick={close} className="block min-h-[44px] py-2 text-[#7A1E2C] underline">
                      Promo codes
                    </Link>
                    <Link href="/admin/workspace/package-entitlements" onClick={close} className="block min-h-[44px] py-2 text-[#7A1E2C] underline">
                      Package entitlements
                    </Link>
                  </>
                )}
                <Link
                  href="/"
                  onClick={close}
                  className="mt-1 block min-h-[44px] py-2 text-center text-xs font-bold text-[#7A1E2C] underline"
                >
                  {t("shell.viewSite")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
