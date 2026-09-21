"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ADMIN_LEADS_PROMO_INBOX_HREF } from "@/app/admin/_lib/adminNavOps";
import { useAdminT } from "./AdminI18nProvider";

export type WorkspaceNavItem = { href: string; labelKey: string; hintKey: string };

export const ADMIN_WORKSPACE_CONTENT_NAV: WorkspaceNavItem[] = [
  { href: "/admin/workspace/home", labelKey: "workspaceNav.link.home", hintKey: "workspaceNav.home.hint" },
  { href: "/admin/workspace/clasificados", labelKey: "workspaceNav.link.clasificados", hintKey: "workspaceNav.clasificados.hint" },
  { href: "/admin/workspace/tienda", labelKey: "workspaceNav.link.tienda", hintKey: "workspaceNav.tienda.hint" },
  { href: "/admin/workspace/nosotros", labelKey: "workspaceNav.link.nosotros", hintKey: "workspaceNav.nosotros.hint" },
  { href: "/admin/workspace/revista", labelKey: "workspaceNav.link.revista", hintKey: "workspaceNav.revista.hint" },
  { href: "/admin/workspace/contacto", labelKey: "workspaceNav.link.contacto", hintKey: "workspaceNav.contacto.hint" },
  { href: "/admin/workspace/noticias", labelKey: "workspaceNav.link.noticias", hintKey: "workspaceNav.noticias.hint" },
  { href: "/admin/workspace/iglesias", labelKey: "workspaceNav.link.iglesias", hintKey: "workspaceNav.iglesias.hint" },
  { href: "/admin/workspace/cupones", labelKey: "workspaceNav.link.cupones", hintKey: "workspaceNav.cupones.hint" },
  { href: "/admin/workspace/anunciate", labelKey: "workspaceNav.link.anunciate", hintKey: "workspaceNav.anunciate.hint" },
];

export const ADMIN_WORKSPACE_MONETIZATION_NAV: WorkspaceNavItem[] = [
  {
    href: "/admin/workspace/package-entitlements",
    labelKey: "workspaceNav.link.packageEntitlements",
    hintKey: "workspaceNav.packageEntitlements.hint",
  },
  {
    href: "/admin/workspace/promo-codes",
    labelKey: "workspaceNav.link.promoCodes",
    hintKey: "workspaceNav.promoCodes.hint",
  },
  {
    href: ADMIN_LEADS_PROMO_INBOX_HREF,
    labelKey: "workspaceNav.link.promotions",
    hintKey: "workspaceNav.promotions.hint",
  },
  {
    href: "/admin/workspace/sales-tracker",
    labelKey: "workspaceNav.link.salesTracker",
    hintKey: "workspaceNav.salesTracker.hint",
  },
  {
    href: "/admin/workspace/payment-tracker",
    labelKey: "workspaceNav.link.paymentTracker",
    hintKey: "workspaceNav.paymentTracker.hint",
  },
  // QUICK ASSISTED SALE. The workspace that holds a prospect's draft, its private preview link and
  // its post-payment publish. It was reachable only by typing the URL, which for a screen a rep is
  // meant to open in front of a customer is the same as not existing. Listed under the same
  // capability its own page and APIs demand (`assisted_category_publishing`), so a member who can
  // see the link can actually use it — and one who cannot see it learns nothing from its absence.
  {
    href: "/admin/workspace/quick-sales",
    labelKey: "workspaceNav.link.quickSales",
    hintKey: "workspaceNav.quickSales.hint",
  },
  {
    href: "/admin/workspace/rewards",
    labelKey: "workspaceNav.link.rewards",
    hintKey: "workspaceNav.rewards.hint",
  },
  // THE BACKLOG HAS TO BE FINDABLE. This queue is what stops an unattributable refund being
  // silently dropped, and it was reachable only by typing the URL — which is the same thing as
  // dropping it, with extra steps.
  {
    href: "/admin/workspace/rewards-refunds",
    labelKey: "workspaceNav.link.rewardsRefunds",
    hintKey: "workspaceNav.rewardsRefunds.hint",
  },
];

/** Flat list — all workspace nav hrefs (preserved for access control + legacy imports). */
export const ADMIN_WORKSPACE_NAV_SECTIONS: WorkspaceNavItem[] = [
  ...ADMIN_WORKSPACE_CONTENT_NAV,
  ...ADMIN_WORKSPACE_MONETIZATION_NAV,
];

const TIENDA_CRUD_PREFIX = "/admin/tienda";

function isPromotionsInboxHref(href: string): boolean {
  return href === ADMIN_LEADS_PROMO_INBOX_HREF;
}

function isSectionActive(pathname: string, item: WorkspaceNavItem, searchView: string | null): boolean {
  if (isPromotionsInboxHref(item.href)) {
    return pathname === "/admin/leads/inbox" && (searchView === "promo" || searchView === "promotions");
  }
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  if (item.href === "/admin/workspace/tienda" && (pathname === TIENDA_CRUD_PREFIX || pathname.startsWith(`${TIENDA_CRUD_PREFIX}/`)))
    return true;
  return false;
}

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

function WorkspaceNavGroup({
  title,
  items,
  pathname,
  searchView,
  t,
}: {
  title: string;
  items: WorkspaceNavItem[];
  pathname: string;
  searchView: string | null;
  t: (key: string) => string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{title}</p>
      <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible">
        {items.map((item) => {
          const active = isSectionActive(pathname, item, searchView);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={t(item.hintKey)}
              aria-current={active ? "page" : undefined}
              data-testid={isPromotionsInboxHref(item.href) ? "admin-workspace-promotions-tab" : undefined}
              className={cx(
                "inline-flex shrink-0 snap-start items-center rounded-lg border px-3 py-2 text-xs font-semibold transition sm:min-h-[2.25rem] sm:text-sm",
                active
                  ? "border-[#C9B46A] bg-[#FBF7EF] text-[#1E1810] shadow-[inset_0_0_0_1px_rgba(201,180,106,0.35)]"
                  : "border-[#E8DFD0] bg-[#FFFCF7] text-[#3D3428]/90 hover:border-[#C9B46A]/50 hover:bg-white",
              )}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AdminWorkspaceNav({ allowedHrefs }: { allowedHrefs?: string[] }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const searchView = searchParams?.get("view") ?? null;
  const t = useAdminT();

  const filterItems = (items: WorkspaceNavItem[]) =>
    allowedHrefs && allowedHrefs.length > 0 ? items.filter((item) => allowedHrefs.includes(item.href)) : items;

  const contentItems = filterItems(ADMIN_WORKSPACE_CONTENT_NAV);
  const monetizationItems = filterItems(ADMIN_WORKSPACE_MONETIZATION_NAV);

  return (
    <div
      className="mb-6 min-w-0 rounded-lg border border-[#C9B46A]/35 bg-gradient-to-r from-[#FFF8F0]/95 to-[#FFFCF7]/90 px-2 py-3 shadow-sm sm:mb-8 sm:px-4"
      data-testid="admin-workspace-nav-ribbon"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 pr-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{t("workspaceNav.kicker")}</p>
          <p className="text-xs text-[#5C5346]/90">{t("workspaceNav.sub")}</p>
        </div>
        <Link
          href="/admin/workspace"
          className={cx(
            "flex h-10 min-w-[44px] shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold transition sm:h-auto sm:min-h-0 sm:px-2.5 sm:py-1.5",
            pathname === "/admin/workspace"
              ? "border-[#2A2620] bg-[#2A2620] text-[#FAF7F2]"
              : "border-[#E8DFD0] bg-[#FFFCF7] text-[#6B5B2E] hover:border-[#C9B46A]/50",
          )}
        >
          {t("workspaceNav.overview")}
        </Link>
      </div>
      <nav className="-mx-1 min-w-0 space-y-3 px-1" aria-label={t("workspaceNav.aria")} data-testid="admin-workspace-nav">
        {contentItems.length ? (
          <WorkspaceNavGroup title={t("workspaceNav.groupContent")} items={contentItems} pathname={pathname} searchView={searchView} t={t} />
        ) : null}
        {monetizationItems.length ? (
          <WorkspaceNavGroup
            title={t("workspaceNav.groupMonetization")}
            items={monetizationItems}
            pathname={pathname}
            searchView={searchView}
            t={t}
          />
        ) : null}
      </nav>
    </div>
  );
}
