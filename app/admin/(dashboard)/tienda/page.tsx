import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase } from "../../_components/adminTheme";

export const dynamic = "force-dynamic";

type Truth = "TRUE" | "PARTIAL" | "MISSING" | "HONESTLY_DISABLED";

type HubCard = {
  title: string;
  purpose: string;
  /** Shown as «Route» (may be a pattern, not always a single clickable path). */
  routeLabel: string;
  /** When set, primary CTA uses this href; omit when no sensible link. */
  ctaHref?: string;
  ctaLabel?: string;
  status: Truth;
  statusNote?: string;
};

const CARDS: HubCard[] = [
  {
    title: "Orders (inbox)",
    purpose: "Self-serve order inbox: search, filter, mark read, and open detail.",
    routeLabel: "/admin/tienda/orders",
    ctaHref: "/admin/tienda/orders",
    ctaLabel: "Open orders →",
    status: "TRUE",
  },
  {
    title: "Order detail",
    purpose: "Per-UUID record: ops status, internal notes, customer files (when applicable).",
    routeLabel: "/admin/tienda/orders/[id]",
    ctaHref: "/admin/tienda/orders",
    ctaLabel: "Go to order list →",
    status: "TRUE",
    statusNote: "Pick a row in the inbox; there is no separate index beyond the list.",
  },
  {
    title: "Catalog",
    purpose: "Tienda item list: visibility, featured flags, links to edit.",
    routeLabel: "/admin/tienda/catalog",
    ctaHref: "/admin/tienda/catalog",
    ctaLabel: "Open catalog →",
    status: "TRUE",
  },
  {
    title: "New item",
    purpose: "Create a catalog item (same data model as edit).",
    routeLabel: "/admin/tienda/catalog/new",
    ctaHref: "/admin/tienda/catalog/new",
    ctaLabel: "New item →",
    status: "TRUE",
  },
  {
    title: "Items / products",
    purpose: "Per-item CRUD lives in the catalog; there is no separate products-only route.",
    routeLabel: "/admin/tienda/catalog and /admin/tienda/catalog/[id]",
    ctaHref: "/admin/tienda/catalog",
    ctaLabel: "Open catalog →",
    status: "PARTIAL",
    statusNote: "Edit by UUID under the catalog.",
  },
  {
    title: "Inventory (SKU / stock)",
    purpose: "Dedicated panel for aggregate inventory only.",
    routeLabel: "(not in repo)",
    status: "MISSING",
    statusNote: "No `/admin/tienda/inventory` route in this repo.",
  },
  {
    title: "Fulfillment & statuses",
    purpose: "Transitions and prep are managed in the inbox and on each order.",
    routeLabel: "/admin/tienda/orders and detail",
    ctaHref: "/admin/tienda/orders",
    ctaLabel: "Open orders →",
    status: "PARTIAL",
    statusNote: "No separate fulfillment module.",
  },
  {
    title: "Tienda-only settings",
    purpose: "Settings page under `/admin/tienda/settings`.",
    routeLabel: "(not in repo)",
    status: "MISSING",
    statusNote: "Global site settings remain on other admin routes.",
  },
  {
    title: "Tienda workspace map",
    purpose: "Ops summary and links (team orientation; does not replace forms).",
    routeLabel: "/admin/workspace/tienda",
    ctaHref: "/admin/workspace/tienda",
    ctaLabel: "Open map →",
    status: "TRUE",
  },
  {
    title: "Storefront editor (copy & images)",
    purpose: "Hero, categories, and public storefront copy stored in `site_section_content`.",
    routeLabel: "/admin/workspace/tienda/storefront",
    ctaHref: "/admin/workspace/tienda/storefront",
    ctaLabel: "Open editor →",
    status: "TRUE",
  },
];

function statusClass(s: Truth): string {
  switch (s) {
    case "TRUE":
      return "bg-emerald-50 text-emerald-950 ring-emerald-200";
    case "PARTIAL":
      return "bg-amber-50 text-amber-950 ring-amber-200";
    case "MISSING":
      return "bg-[#F4F0E8] text-[#5C5346] ring-[#E8DFD0]";
    case "HONESTLY_DISABLED":
      return "bg-[#EDE8E0] text-[#4A4744] ring-[#D8D0C4]";
    default:
      return "bg-[#F4F0E8] text-[#5C5346] ring-[#E8DFD0]";
  }
}

export default function AdminTiendaHubPage() {
  return (
    <div className="max-w-5xl space-y-6 pb-12">
      <AdminPageHeader
        eyebrow="Tienda"
        title="Command center — Tienda"
        subtitle="Single entry point: orders, catalog, and links to the storefront workspace. Listed routes are what exist in admin today."
        helperText="TRUE = operational route. PARTIAL = covered inside another screen. MISSING = not implemented in this repo. No invented counters."
        rightSlot={
          <Link href="/tienda" className={adminBtnSecondary} target="_blank" rel="noreferrer">
            View public storefront ↗
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <div key={c.title} className={`${adminCardBase} flex flex-col gap-2 p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-base font-bold text-[#1E1810]">{c.title}</h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusClass(c.status)}`}
              >
                {c.status}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#5C5346]">{c.purpose}</p>
            <p className="font-mono text-[11px] text-[#3D3428]">
              <span className="font-sans font-semibold text-[#7A7164]">Route: </span>
              {c.routeLabel}
            </p>
            {c.statusNote ? <p className="text-[11px] text-[#7A7164]">{c.statusNote}</p> : null}
            {c.ctaHref ? (
              <Link href={c.ctaHref} className="mt-1 text-sm font-bold text-[#6B5B2E] underline">
                {c.ctaLabel ?? "Open →"}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
