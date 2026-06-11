"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_LEADS_PROMO_INBOX_HREF } from "@/app/admin/_lib/adminNavOps";

const LINKS = [
  { href: ADMIN_LEADS_PROMO_INBOX_HREF, label: "Promo leads", hint: "Launch Leads — promo / print quotes" },
  { href: "/admin/tienda", label: "Tienda home", hint: "Command center and route map" },
  { href: "/admin/workspace/tienda", label: "Workspace map", hint: "Storefront summary and links" },
  { href: "/admin/tienda/catalog", label: "Catalog", hint: "List and edit catalog items" },
  { href: "/admin/tienda/catalog/new", label: "New item", hint: "Add a product to the catalog" },
  { href: "/admin/tienda/orders", label: "Orders", hint: "Order inbox and queue (when orders exist)" },
] as const;

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

function tiendaSubnavActive(pathname: string, href: string): boolean {
  if (href === ADMIN_LEADS_PROMO_INBOX_HREF) {
    return pathname === "/admin/leads/inbox";
  }
  if (href === "/admin/tienda") return pathname === href;
  if (href === "/admin/workspace/tienda") return pathname === href;
  if (href === "/admin/tienda/orders") return pathname === href || pathname.startsWith(`${href}/`);
  if (href === "/admin/tienda/catalog/new") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  if (href === "/admin/tienda/catalog") {
    if (pathname === "/admin/tienda/catalog/new" || pathname.startsWith("/admin/tienda/catalog/new/")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return false;
}

/**
 * In-content nav for real Tienda CRUD routes (/admin/tienda/*), paired with {@link AdminWorkspaceNav}.
 */
export function AdminTiendaWorkspaceSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <div
      className="mb-6 rounded-lg border border-[#C9B46A]/25 bg-[#FFFCF7]/95 px-3 py-2.5 shadow-sm sm:px-4"
      role="navigation"
      aria-label="Tienda admin areas"
    >
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Inside Tienda</p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {LINKS.map((item) => {
          const active = tiendaSubnavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.hint}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex min-h-[2rem] items-center rounded-lg border px-2.5 py-1 text-xs font-semibold transition sm:px-3 sm:text-sm",
                active
                  ? "border-[#C9B46A]/45 bg-[#FBF7EF] text-[#1E1810]"
                  : "border-transparent bg-white/70 text-[#3D3428]/90 hover:border-[#E8DFD0] hover:bg-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
