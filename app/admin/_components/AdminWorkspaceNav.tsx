"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminT } from "./AdminI18nProvider";

export type WorkspaceNavItem = { href: string; labelKey: string; hintKey: string };

const SECTIONS: WorkspaceNavItem[] = [
  { href: "/admin/workspace/home", labelKey: "workspaceNav.link.home", hintKey: "workspaceNav.home.hint" },
  { href: "/admin/workspace/clasificados", labelKey: "workspaceNav.link.clasificados", hintKey: "workspaceNav.clasificados.hint" },
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
    href: "/admin/workspace/sales-tracker",
    labelKey: "workspaceNav.link.salesTracker",
    hintKey: "workspaceNav.salesTracker.hint",
  },
  {
    href: "/admin/workspace/payment-tracker",
    labelKey: "workspaceNav.link.paymentTracker",
    hintKey: "workspaceNav.paymentTracker.hint",
  },
  { href: "/admin/workspace/tienda", labelKey: "workspaceNav.link.tienda", hintKey: "workspaceNav.tienda.hint" },
  { href: "/admin/workspace/nosotros", labelKey: "workspaceNav.link.nosotros", hintKey: "workspaceNav.nosotros.hint" },
  { href: "/admin/workspace/revista", labelKey: "workspaceNav.link.revista", hintKey: "workspaceNav.revista.hint" },
  { href: "/admin/workspace/contacto", labelKey: "workspaceNav.link.contacto", hintKey: "workspaceNav.contacto.hint" },
  { href: "/admin/workspace/noticias", labelKey: "workspaceNav.link.noticias", hintKey: "workspaceNav.noticias.hint" },
  { href: "/admin/workspace/iglesias", labelKey: "workspaceNav.link.iglesias", hintKey: "workspaceNav.iglesias.hint" },
  { href: "/admin/workspace/cupones", labelKey: "workspaceNav.link.cupones", hintKey: "workspaceNav.cupones.hint" },
  { href: "/admin/workspace/anunciate", labelKey: "workspaceNav.link.anunciate", hintKey: "workspaceNav.anunciate.hint" },
];

const TIENDA_CRUD_PREFIX = "/admin/tienda";

function isSectionActive(pathname: string, item: WorkspaceNavItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  if (item.href === "/admin/workspace/tienda" && (pathname === TIENDA_CRUD_PREFIX || pathname.startsWith(`${TIENDA_CRUD_PREFIX}/`)))
    return true;
  return false;
}

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

export function AdminWorkspaceNav() {
  const pathname = usePathname() ?? "";
  const t = useAdminT();

  return (
    <div className="mb-6 rounded-2xl border border-[#C9B46A]/35 bg-gradient-to-r from-[#FFF8F0]/95 to-[#FFFCF7]/90 px-2 py-3 shadow-sm sm:mb-8 sm:px-4">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 pr-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{t("workspaceNav.kicker")}</p>
          <p className="text-xs text-[#5C5346]/90">{t("workspaceNav.sub")}</p>
        </div>
        <Link
          href="/admin/workspace"
          className={cx(
            "flex h-10 min-w-[44px] shrink-0 items-center justify-center rounded-xl px-3 py-2 text-xs font-bold transition sm:h-auto sm:min-h-0 sm:px-2.5 sm:py-1",
            pathname === "/admin/workspace"
              ? "bg-[#2A2620] text-[#FAF7F2]"
              : "text-[#6B5B2E] underline decoration-[#C9B46A]/60 underline-offset-2 hover:text-[#2A2620]",
          )}
        >
          {t("workspaceNav.overview")}
        </Link>
      </div>
      <nav
        className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0"
        aria-label={t("workspaceNav.aria")}
      >
        {SECTIONS.map((item) => {
          const active = isSectionActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={t(item.hintKey)}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex shrink-0 snap-start items-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:min-h-[2.25rem] sm:py-1.5 sm:text-sm",
                active
                  ? "border-[#C9B46A]/50 bg-[#FBF7EF] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                  : "border-transparent bg-white/60 text-[#3D3428]/90 hover:border-[#E8DFD0] hover:bg-white",
              )}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
