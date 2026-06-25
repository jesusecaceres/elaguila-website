"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const navItems =
    allowedGlobalNavHrefs && allowedGlobalNavHrefs.length > 0
      ? ADMIN_GLOBAL_NAV.filter((item) => allowedGlobalNavHrefs.includes(item.href))
      : ADMIN_GLOBAL_NAV;

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const drawerPanel = open ? (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t("mobile.navDialog")}
      data-testid="admin-mobile-nav-overlay"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label={t("mobile.closeOverlay")}
        onClick={close}
        data-testid="admin-mobile-nav-backdrop"
      />
      <div
        id="admin-mobile-nav-panel"
        className="absolute left-0 top-0 flex h-full w-[min(20rem,92vw)] max-w-full flex-col overflow-x-hidden border-r border-[#C9B46A]/45 bg-[#FFFCF7] shadow-2xl"
        data-testid="admin-mobile-nav-drawer"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#E8DFD0]/80 bg-gradient-to-r from-[#FFFCF7] to-[#FFF8F0] px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[#C9B46A]/50">
              <Image src={newLogo} alt="" className="object-cover" fill sizes="40px" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B7355]">{t("shell.leonixBrand")}</p>
              <p className="truncate text-sm font-bold text-[#1E1810]">{t("shell.globalAdmin")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-[#E8DFD0] bg-white text-sm font-bold text-[#5C5346]"
            aria-label={t("mobile.close")}
            data-testid="admin-mobile-nav-close"
          >
            ✕
          </button>
        </div>

        <p className="border-b border-[#E8DFD0]/60 px-4 py-2 text-[11px] font-semibold text-[#7A7164]" data-testid="admin-mobile-nav-signed-in">
          {t("shell.signedInCookie")}
        </p>

        <nav
          className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 py-3"
          aria-label={t("mobile.globalNav")}
          data-testid="admin-mobile-nav-links"
        >
          {navItems.map((item) => {
            const active = isAdminGlobalNavItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cx(
                  "flex min-h-[44px] items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "border-[#7A1E2C]/35 bg-[#FDF2F4] text-[#7A1E2C] shadow-sm"
                    : "border-transparent text-[#3D3428] active:bg-white/90",
                )}
                data-testid={`admin-mobile-nav-link-${item.labelKey.replace(/\./g, "-")}`}
              >
                <span className="w-6 shrink-0 text-center text-base opacity-80" aria-hidden>
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1 break-words">{t(item.labelKey)}</span>
                {item.badgeFrom === "tienda" && tiendaInboxUnread > 0 ? (
                  <span className="min-w-[1.25rem] shrink-0 rounded-md bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                    {tiendaInboxUnread > 99 ? "99+" : tiendaInboxUnread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#E8DFD0]/80 p-3">
          <div className="rounded-lg border border-[#C9B46A]/35 bg-white p-3 text-[11px] font-semibold text-[#7A7164]">
            <p className="text-xs font-bold text-[#1E1810]">{t("shell.leonixBrand")} Admin</p>
            {!salesRepLimited ? (
              <div className="mt-2 space-y-1">
                <Link
                  href="/admin/workspace"
                  onClick={close}
                  className="block min-h-[44px] py-2 text-[#7A1E2C] underline underline-offset-2"
                  data-testid="admin-mobile-nav-site-sections"
                >
                  {t("shell.websiteSectionsLink")}
                </Link>
                <Link
                  href="/admin/site-settings"
                  onClick={close}
                  className="block min-h-[44px] py-2 text-[#7A1E2C] underline underline-offset-2"
                  data-testid="admin-mobile-nav-site-settings"
                >
                  {t("shell.globalSiteSettingsLink")}
                </Link>
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                <Link href="/admin/workspace/promo-codes" onClick={close} className="block min-h-[44px] py-2 text-[#7A1E2C] underline">
                  Promo codes
                </Link>
                <Link href="/admin/workspace/package-entitlements" onClick={close} className="block min-h-[44px] py-2 text-[#7A1E2C] underline">
                  Package entitlements
                </Link>
              </div>
            )}
            <Link
              href="/"
              onClick={close}
              className="mt-2 block min-h-[44px] py-2 text-center text-xs font-bold text-[#7A1E2C] underline"
              data-testid="admin-mobile-nav-view-site"
            >
              {t("shell.viewSite")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={toggle}
        className="flex h-11 min-w-[44px] items-center justify-center rounded-lg border border-[#C9B46A]/45 bg-[#FFFCF7] px-3 text-base font-bold text-[#1E1810] shadow-sm"
        aria-expanded={open}
        aria-controls="admin-mobile-nav-panel"
        aria-label={open ? t("mobile.close") : t("mobile.openMenu")}
        title={t("mobile.menuTitle")}
        data-testid="admin-mobile-hamburger"
      >
        {open ? "✕" : "☰"}
      </button>

      {mounted && drawerPanel ? createPortal(drawerPanel, document.body) : null}
    </div>
  );
}
