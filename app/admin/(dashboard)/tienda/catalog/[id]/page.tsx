import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import {
  CatalogItemFormFields,
  type CatalogItemFormDefaults,
} from "@/app/admin/_components/tienda/CatalogItemFormFields";
import { getCatalogItemAdminById } from "@/app/admin/_lib/tiendaCatalogAdminData";
import {
  addTiendaCatalogImageAction,
  addTiendaCatalogPricingRuleAction,
  deleteTiendaCatalogImageAction,
  deleteTiendaCatalogPricingRuleAction,
  setTiendaCatalogPrimaryImageAction,
  updateTiendaCatalogItemAction,
} from "@/app/admin/tiendaCatalogActions";
import type { TiendaCatalogItemWithMedia } from "@/app/lib/tienda/tiendaCatalogTypes";

export const dynamic = "force-dynamic";

function toDefaults(item: TiendaCatalogItemWithMedia): CatalogItemFormDefaults {
  const bp =
    item.base_price != null && item.base_price !== ""
      ? String(Number(item.base_price))
      : "";
  return {
    title_es: item.title_es,
    title_en: item.title_en,
    slug: item.slug,
    category_slug: item.category_slug,
    subcategory_slug: item.subcategory_slug ?? "",
    short_description_es: item.short_description_es,
    short_description_en: item.short_description_en,
    description_es: item.description_es,
    description_en: item.description_en,
    pricing_mode: item.pricing_mode,
    price_label: item.price_label ?? "",
    price_note: item.price_note ?? "",
    base_price: bp,
    cta_mode: item.cta_mode,
    is_featured: item.is_featured,
    is_live: item.is_live,
    is_hidden: item.is_hidden,
    sort_order: item.sort_order,
    badge_label: item.badge_label ?? "",
    specialty_flag: item.specialty_flag,
    storefront_visible: item.storefront_visible,
    category_visible: item.category_visible,
    office_preferred: item.office_preferred,
    phone_preferred: item.phone_preferred,
    email_allowed: item.email_allowed,
    linked_product_slug: item.linked_product_slug ?? "",
    meta_json: JSON.stringify(item.meta && Object.keys(item.meta).length ? item.meta : { pricingContractVersion: 1 }, null, 2),
  };
}

export default async function AdminTiendaCatalogEditPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { item, error } = await getCatalogItemAdminById(id);
  if (error) {
    return (
      <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
        <strong>Could not load item.</strong> {error}
      </div>
    );
  }
  if (!item) notFound();

  const d = toDefaults(item);
  const imgs = item.images.slice().sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  const rules = item.pricing_rules.slice().sort((a, b) => a.sort_order - b.sort_order);

  const publicHref = item.is_live && !item.is_hidden ? `/tienda/catalog/${item.slug}` : null;

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminPageHeader
        title="Edit catalog item"
        subtitle={`ID ${item.id} · last updated ${new Date(item.updated_at).toLocaleString()}`}
        rightSlot={
          <div className="flex flex-wrap gap-2">
            {publicHref ? (
              <Link href={publicHref} className={adminBtnPrimary} target="_blank" rel="noopener noreferrer">
                View public
              </Link>
            ) : null}
            <Link href="/admin/tienda/catalog" className={adminBtnSecondary}>
              ← List
            </Link>
          </div>
        }
      />

      <section className={`${adminCardBase} p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346] mb-4">Content, pricing &amp; visibility</h2>
        <form action={updateTiendaCatalogItemAction.bind(null, item.id)} className="space-y-6">
          <CatalogItemFormFields d={d} />
          <button type="submit" className={adminBtnPrimary}>
            Save changes
          </button>
        </form>
      </section>

      <section className={`${adminCardBase} p-6 space-y-4`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Images</h2>
        <p className="text-xs text-[#7A7164]">Set one primary for storefront cards. Order follows sort_order (future: drag to reorder in admin).</p>

        <ul className="space-y-3">
          {imgs.length === 0 ? (
            <li className="text-sm text-[#7A7164]">No images yet.</li>
          ) : (
            imgs.map((im) => (
              <li
                key={im.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E8DFD0] bg-white/80 p-3"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F2] border border-[#E8DFD0]">
                  <Image src={im.image_url} alt="" fill className="object-cover" sizes="96px" unoptimized />
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-mono break-all text-[#3D3629]">{im.image_url}</div>
                  <div className="text-[#7A7164] mt-1">
                    primary: {im.is_primary ? "yes" : "no"} · sort {im.sort_order}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!im.is_primary ? (
                    <form action={setTiendaCatalogPrimaryImageAction.bind(null, item.id, im.id)}>
                      <button type="submit" className={`${adminBtnSecondary} !py-1.5 !text-xs`}>
                        Make primary
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteTiendaCatalogImageAction.bind(null, item.id, im.id)}>
                    <button
                      type="submit"
                      className={`${adminBtnSecondary} !py-1.5 !text-xs text-rose-800 border-rose-200`}
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))
          )}
        </ul>

        <form action={addTiendaCatalogImageAction.bind(null, item.id)} className="mt-4 grid gap-3 sm:grid-cols-2 border-t border-[#E8DFD0] pt-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Add image URL</label>
            <input name="image_url" required className={adminInputClass} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Alt ES</label>
              <input name="alt_es" className={adminInputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Alt EN</label>
              <input name="alt_en" className={adminInputClass} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={adminBtnSecondary}>
              Add image
            </button>
          </div>
        </form>
      </section>

      <section className={`${adminCardBase} p-6 space-y-4`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Pricing rules (calculated_ready)</h2>
        <p className="text-xs text-[#7A7164]">
          Starter rows for quantity/material/size pricing. Checkout integration can read these in a future pass.
        </p>
        {rules.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {rules.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8DFD0] bg-white/80 px-3 py-2"
              >
                <span className="font-mono text-xs">
                  {r.rule_type}
                  {r.quantity_min != null ? ` · ${r.quantity_min}` : ""}
                  {r.quantity_max != null ? `–${r.quantity_max}` : ""}
                  {r.size_key ? ` · ${r.size_key}` : ""}
                </span>
                <span className="tabular-nums font-semibold">${Number(r.price).toFixed(2)}</span>
                <form action={deleteTiendaCatalogPricingRuleAction.bind(null, item.id, r.id)}>
                  <button type="submit" className="text-xs font-bold text-rose-800 underline">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#7A7164]">No pricing rules.</p>
        )}

        <form action={addTiendaCatalogPricingRuleAction.bind(null, item.id)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 border-t border-[#E8DFD0] pt-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Rule type</label>
            <input name="rule_type" className={adminInputClass} defaultValue="quantity_tier" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Price (USD)</label>
            <input name="price" required className={adminInputClass} inputMode="decimal" placeholder="99.00" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Sort</label>
            <input name="sort_order" type="number" className={adminInputClass} defaultValue={0} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Qty min</label>
            <input name="quantity_min" type="number" className={adminInputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Qty max</label>
            <input name="quantity_max" type="number" className={adminInputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Size key</label>
            <input name="size_key" className={adminInputClass} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className={adminBtnSecondary}>
              Add rule
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
