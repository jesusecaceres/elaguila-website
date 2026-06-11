import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase } from "../../_components/adminTheme";
import { ADMIN_LEADS_PROMO_INBOX_HREF } from "../../_lib/adminNavOps";

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
  /** Launch workflow cards render first in the grid. */
  launchPriority?: boolean;
};

const CARDS: HubCard[] = [
  {
    title: "Promo / print quote leads",
    purpose:
      "Follow up on promotional product and print-quote inquiries. Quotes currently flow through Launch Leads — there is no separate quote inbox yet.",
    routeLabel: ADMIN_LEADS_PROMO_INBOX_HREF,
    ctaHref: ADMIN_LEADS_PROMO_INBOX_HREF,
    ctaLabel: "Open promo leads →",
    status: "TRUE",
    launchPriority: true,
  },
  {
    title: "Promo codes (admin lifecycle)",
    purpose: "Create and manage admin promo codes tied to sales reps — not the public Cupones CMS.",
    routeLabel: "/admin/workspace/promo-codes",
    ctaHref: "/admin/workspace/promo-codes",
    ctaLabel: "Promo codes →",
    status: "TRUE",
    launchPriority: true,
  },
  {
    title: "Catalog",
    purpose: "Review Tienda items: visibility, featured flags, pricing labels, and edit links.",
    routeLabel: "/admin/tienda/catalog",
    ctaHref: "/admin/tienda/catalog",
    ctaLabel: "Open catalog →",
    status: "TRUE",
    launchPriority: true,
  },
  {
    title: "New item",
    purpose: "Create a catalog item (same data model as edit).",
    routeLabel: "/admin/tienda/catalog/new",
    ctaHref: "/admin/tienda/catalog/new",
    ctaLabel: "New item →",
    status: "TRUE",
    launchPriority: true,
  },
  {
    title: "Storefront editor (copy & images)",
    purpose: "Hero, categories, and public storefront copy stored in `site_section_content`.",
    routeLabel: "/admin/workspace/tienda/storefront",
    ctaHref: "/admin/workspace/tienda/storefront",
    ctaLabel: "Open editor →",
    status: "TRUE",
    launchPriority: true,
  },
  {
    title: "Orders (inbox)",
    purpose:
      "Self-serve order inbox when purchases exist: search, filter, mark read, and open detail. Not the primary launch workflow today.",
    routeLabel: "/admin/tienda/orders",
    ctaHref: "/admin/tienda/orders",
    ctaLabel: "Open orders →",
    status: "TRUE",
    statusNote: "Available when orders exist; quote follow-up usually starts in Launch Leads.",
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
  const launchCards = CARDS.filter((c) => c.launchPriority);
  const otherCards = CARDS.filter((c) => !c.launchPriority);

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      <AdminPageHeader
        eyebrow="Tienda"
        title="Command center — Tienda"
        subtitle="Launch focus: promo/print-quote follow-up (via Launch Leads), catalog review, and storefront copy. Orders inbox stays available when self-serve purchases exist."
        helperText="Quote and product inquiries are handled in Launch Leads today — not a fake quote module. TRUE = operational route. MISSING = not in repo."
        rightSlot={
          <Link href="/tienda" className={adminBtnSecondary} target="_blank" rel="noreferrer">
            View public storefront ↗
          </Link>
        }
      />

      <div className={`${adminCardBase} border-[#C9B46A]/35 bg-[#FFFCF7] p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Suggested launch order</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-[#7A7164]">
          <li>
            <Link href={ADMIN_LEADS_PROMO_INBOX_HREF} className="font-bold text-[#6B5B2E] underline">
              Promo / print quote leads
            </Link>{" "}
            in Launch Leads.
          </li>
          <li>Catalog + storefront editor — align products and public copy.</li>
          <li>Orders inbox — when customers complete self-serve checkout.</li>
        </ol>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {launchCards.map((c) => (
          <div key={c.title} className={`${adminCardBase} flex flex-col gap-2 p-4 ring-1 ring-[#C9B46A]/25`}>
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

      <div className="grid gap-4 sm:grid-cols-2">
        {otherCards.map((c) => (
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
