"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import newLogo from "../../../public/logo.png";
import {
  ADMIN_GLOBAL_NAV,
  ADMIN_GLOBAL_NAV_GROUP_LABEL_KEY,
  isAdminGlobalNavItemActive,
  type AdminGlobalNavGroup,
  type AdminGlobalNavItem,
} from "../_lib/adminGlobalNav";
import { useAdminT } from "./AdminI18nProvider";

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

/**
 * Package E Build E3, Gate 1 — fixed display order for the six Admin OS nav groups. Buckets
 * items by `group` without changing `ADMIN_GLOBAL_NAV`'s own array order (several existing gates
 * assert that array's relative order positionally).
 */
const NAV_GROUP_ORDER: AdminGlobalNavGroup[] = [
  "command",
  "revenue",
  "marketplace-ops",
  "people",
  "website-control",
  "system",
];

function groupNavItems(items: AdminGlobalNavItem[]): Array<{ group: AdminGlobalNavGroup; items: AdminGlobalNavItem[] }> {
  return NAV_GROUP_ORDER.map((group) => ({ group, items: items.filter((item) => item.group === group) })).filter(
    (bucket) => bucket.items.length > 0,
  );
}

export function AdminSidebar({
  tiendaInboxUnread = 0,
  allowedGlobalNavHrefs,
  salesRepLimited = false,
}: {
  tiendaInboxUnread?: number;
  /** When set, only these global nav hrefs are shown. */
  allowedGlobalNavHrefs?: string[];
  salesRepLimited?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const t = useAdminT();
  const navItems =
    allowedGlobalNavHrefs && allowedGlobalNavHrefs.length > 0
      ? ADMIN_GLOBAL_NAV.filter((item) => allowedGlobalNavHrefs.includes(item.href))
      : ADMIN_GLOBAL_NAV;
  const groupedNavItems = groupNavItems(navItems);

  return (
    <aside className="flex h-full w-full flex-col border-r border-[color:var(--lx-border)]/70 bg-[color:var(--lx-section)]">
      <div className="flex items-center gap-3 border-b border-[color:var(--lx-border)]/70 px-4 py-5">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[color:var(--lx-border)]">
          <Image src={newLogo} alt="Leonix" className="object-cover" fill sizes="40px" priority />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{t("shell.leonixBrand")}</p>
          <p className="text-sm font-bold text-[color:var(--lx-text)]">{t("shell.globalAdmin")}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-4">
        {groupedNavItems.map(({ group, items }) => (
          <div key={group}>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[color:var(--lx-muted)]">
              {t(ADMIN_GLOBAL_NAV_GROUP_LABEL_KEY[group])}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const active = isAdminGlobalNavItemActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-[color:var(--lx-canvas)] text-[color:var(--lx-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.80)] ring-1 ring-[color:var(--lx-border)]/40"
                        : "text-[color:var(--lx-text-2)]/90 hover:bg-[color:var(--lx-card)]",
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
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[color:var(--lx-border)]/70 p-4">
        <div className="rounded-2xl border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-card)] p-3">
          <p className="text-xs font-semibold text-[color:var(--lx-text)]">{t("shell.leonixBrand")} Admin</p>
          <p className="text-[11px] text-[color:var(--lx-muted)]">{t("shell.signedInCookie")}</p>
          {/* Package E Build E3, Gate 1 — Website Sections and Site Settings are now primary,
              permission-gated nav entries (WEBSITE CONTROL group above); the footer shortcuts
              that stood in for the missing primary link are removed to avoid a duplicate entry. */}
          {salesRepLimited ? (
            <div className="mt-2 space-y-1.5 text-[11px] font-semibold text-[color:var(--lx-muted)]">
              <Link className="block text-[color:var(--lx-lion)] underline underline-offset-2" href="/admin/workspace/promo-codes">
                Promo codes
              </Link>
              <Link className="block text-[color:var(--lx-lion)] underline underline-offset-2" href="/admin/workspace/package-entitlements">
                Package entitlements
              </Link>
              <Link className="block text-[color:var(--lx-lion)] underline underline-offset-2" href="/admin/workspace/sales-tracker">
                Sales tracker
              </Link>
            </div>
          ) : null}
          <Link className="mt-2 block text-center text-xs font-bold text-[#7A1E2C] underline" href="/">
            {t("shell.viewSite")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
