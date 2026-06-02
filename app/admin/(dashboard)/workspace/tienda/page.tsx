import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminCardBase, adminBtnSecondary } from "../../../_components/adminTheme";

type TiendaWorkspaceArea = {
  title: string;
  body: string;
  href: string;
  cta: string;
  openInNewTab?: boolean;
};

const AREAS: TiendaWorkspaceArea[] = [
  {
    title: "Public storefront",
    body: "How visitors see the shop at `/tienda`. Editable content (copy, photos, prices, visibility) is managed in the admin catalog.",
    href: "/tienda",
    cta: "Open storefront in new tab",
    openInNewTab: true,
  },
  {
    title: "Product categories",
    body: "Tienda families and slugs live in the code category registry; use the catalog list to align each item with its public category.",
    href: "/admin/tienda/catalog",
    cta: "Go to catalog",
  },
  {
    title: "Catalog items",
    body: "Create, edit, visibility, and metadata per item. Same CRUD you already use under `/admin/tienda/catalog`.",
    href: "/admin/tienda/catalog",
    cta: "Open catalog",
  },
  {
    title: "Images and primary photo",
    body: "Uploads per product and primary image selection inside each catalog item (no parallel flow).",
    href: "/admin/tienda/catalog",
    cta: "Choose on each item",
  },
  {
    title: "Pricing and rules",
    body: "Base price, visible label, pricing mode, and CTA per item on the item page; self-serve rules depend on product type.",
    href: "/admin/tienda/catalog",
    cta: "Edit in catalog",
  },
  {
    title: "Storefront featured items",
    body: "Mark items for the storefront (`featuredStorefront` and public queries) from catalog admin.",
    href: "/admin/tienda/catalog",
    cta: "Manage featured",
  },
  {
    title: "Orders (inbox)",
    body: "Self-serve order inbox: statuses, internal notes, and customer files. Unread count stays in the header and global Dashboard.",
    href: "/admin/tienda/orders",
    cta: "Open orders",
  },
];

export default function AdminWorkspaceTiendaPage() {
  return (
    <div>
      <AdminPageHeader
        title="Tienda — storefront workspace"
        subtitle="Team operations map: same CRUD routes that already work under `/admin/tienda/*`. This page does not replace forms; it guides what to open for each task."
        eyebrow="Workspace · Tienda"
        helperText='Use the "Inside Tienda" strip when on orders or catalog to jump between areas without returning to the global menu.'
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Tienda"
        publicPath="/tienda"
        sourceOfTruth="Storefront: copy/images in `site_section_content.tienda_storefront`. Products: catalog tables + `tienda_orders` for self-serve orders."
        siteSectionKey="tienda_storefront"
        adminEditors={[
          { label: "Storefront editor (hero, categories, copy)", href: "/admin/workspace/tienda/storefront" },
          { label: "Admin catalog (real CRUD)", href: "/admin/tienda/catalog" },
          { label: "Orders / inbox", href: "/admin/tienda/orders" },
          { label: "Customer ops (order ref, email, phone)", href: "/admin/ops" },
        ]}
        notYet={["Unify margin / fulfillment metrics if operations requests them."]}
      />

      <div className={`${adminCardBase} mb-6 border-[#C9B46A]/35 bg-[#FFFCF7] p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Storefront copy and images</p>
        <p className="mt-1 text-xs text-[#7A7164]">
          Database-backed editor: hero, promo strip below hero, category card order, covers by slug, and section copy —{" "}
          <Link href="/admin/workspace/tienda/storefront" className="font-bold text-[#6B5B2E] underline">
            open storefront editor
          </Link>
          .
        </p>
        <p className="mt-3 font-semibold text-[#1E1810]">Suggested training order</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-[#7A7164]">
          <li>Public storefront → see the result.</li>
          <li>Catalog → items, photos, prices, and featured.</li>
          <li>Orders → fulfillment after purchase.</li>
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {AREAS.map((a) => (
          <div key={a.title} className={`${adminCardBase} p-5`}>
            <h2 className="font-bold text-[#1E1810]">{a.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{a.body}</p>
            <Link
              href={a.href}
              className={`${adminBtnSecondary} mt-4 inline-flex min-h-[44px] items-center sm:min-h-0`}
              {...(a.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {a.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
