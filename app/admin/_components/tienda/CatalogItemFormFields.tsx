import { TIENDA_CATEGORY_SLUGS } from "@/app/tienda/data/tiendaCategories";
import {
  TIENDA_CATALOG_CTA_MODES,
  TIENDA_CATALOG_PRICING_MODES,
} from "@/app/lib/tienda/tiendaCatalogTypes";
import { adminInputClass } from "@/app/admin/_components/adminTheme";

export type CatalogItemFormDefaults = {
  title_es: string;
  title_en: string;
  slug: string;
  category_slug: string;
  subcategory_slug: string;
  short_description_es: string;
  short_description_en: string;
  description_es: string;
  description_en: string;
  pricing_mode: string;
  price_label: string;
  price_note: string;
  base_price: string;
  cta_mode: string;
  is_featured: boolean;
  is_live: boolean;
  is_hidden: boolean;
  sort_order: number;
  badge_label: string;
  specialty_flag: boolean;
  storefront_visible: boolean;
  category_visible: boolean;
  office_preferred: boolean;
  phone_preferred: boolean;
  email_allowed: boolean;
  linked_product_slug: string;
  meta_json: string;
};

export const catalogItemEmptyDefaults = (): CatalogItemFormDefaults => ({
  title_es: "",
  title_en: "",
  slug: "",
  category_slug: "promo-products",
  subcategory_slug: "",
  short_description_es: "",
  short_description_en: "",
  description_es: "",
  description_en: "",
  pricing_mode: "display_only",
  price_label: "",
  price_note: "",
  base_price: "",
  cta_mode: "request_quote",
  is_featured: false,
  is_live: true,
  is_hidden: false,
  sort_order: 0,
  badge_label: "",
  specialty_flag: false,
  storefront_visible: true,
  category_visible: true,
  office_preferred: true,
  phone_preferred: true,
  email_allowed: true,
  linked_product_slug: "",
  meta_json: "{\n  \"pricingContractVersion\": 1\n}",
});

function selClass() {
  return adminInputClass;
}

export function CatalogItemFormFields({ d }: { d: CatalogItemFormDefaults }) {
  return (
    <div className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-2">Content</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Title (ES)</label>
            <input name="title_es" required className={adminInputClass} defaultValue={d.title_es} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Title (EN)</label>
            <input name="title_en" required className={adminInputClass} defaultValue={d.title_en} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Slug</label>
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className={`${adminInputClass} font-mono text-xs`}
              defaultValue={d.slug}
              placeholder="cms-my-product"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Category</label>
            <select name="category_slug" className={selClass()} defaultValue={d.category_slug}>
              {TIENDA_CATEGORY_SLUGS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">
            Subcategory (optional)
          </label>
          <input name="subcategory_slug" className={adminInputClass} defaultValue={d.subcategory_slug} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Short (ES)</label>
            <textarea name="short_description_es" rows={3} className={adminInputClass} defaultValue={d.short_description_es} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Short (EN)</label>
            <textarea name="short_description_en" rows={3} className={adminInputClass} defaultValue={d.short_description_en} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Description (ES)</label>
            <textarea name="description_es" rows={6} className={adminInputClass} defaultValue={d.description_es} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Description (EN)</label>
            <textarea name="description_en" rows={6} className={adminInputClass} defaultValue={d.description_en} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-[#E8DFD0] pt-6">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-2">Pricing &amp; CTA</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Pricing mode</label>
            <select name="pricing_mode" className={selClass()} defaultValue={d.pricing_mode}>
              {TIENDA_CATALOG_PRICING_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">CTA mode</label>
            <select name="cta_mode" className={selClass()} defaultValue={d.cta_mode}>
              {TIENDA_CATALOG_CTA_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Price label</label>
            <input name="price_label" className={adminInputClass} defaultValue={d.price_label} placeholder="Starting at $X" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Base price (optional)</label>
            <input
              name="base_price"
              className={adminInputClass}
              defaultValue={d.base_price}
              placeholder="199.00"
              inputMode="decimal"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Price note</label>
          <input name="price_note" className={adminInputClass} defaultValue={d.price_note} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">
            Linked product slug (self-serve / upload flows)
          </label>
          <input
            name="linked_product_slug"
            className={`${adminInputClass} font-mono text-xs`}
            defaultValue={d.linked_product_slug}
            placeholder="flyers-standard"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-[#E8DFD0] pt-6">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-2">Visibility &amp; flags</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_featured" value="true" defaultChecked={d.is_featured} className="h-4 w-4 rounded" />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_live" value="true" defaultChecked={d.is_live} className="h-4 w-4 rounded" />
            Live
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_hidden" value="true" defaultChecked={d.is_hidden} className="h-4 w-4 rounded" />
            Hidden
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="specialty_flag" value="true" defaultChecked={d.specialty_flag} className="h-4 w-4 rounded" />
            Specialty / sourced flag
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="storefront_visible"
              value="true"
              defaultChecked={d.storefront_visible}
              className="h-4 w-4 rounded"
            />
            Storefront visible
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="category_visible"
              value="true"
              defaultChecked={d.category_visible}
              className="h-4 w-4 rounded"
            />
            Category grid visible
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Sort order</label>
            <input
              name="sort_order"
              type="number"
              className={adminInputClass}
              defaultValue={d.sort_order}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Badge label</label>
            <input name="badge_label" className={adminInputClass} defaultValue={d.badge_label} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-[#E8DFD0] pt-6">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-2">Contact preferences (public Tienda)</legend>
        <p className="text-xs text-[#7A7164]">
          Phone and office are preferred on catalog/request pages; email is secondary when allowed.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Office preferred</label>
            <select name="office_preferred" className={selClass()} defaultValue={d.office_preferred ? "true" : "false"}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Phone preferred</label>
            <select name="phone_preferred" className={selClass()} defaultValue={d.phone_preferred ? "true" : "false"}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Email allowed</label>
            <select name="email_allowed" className={selClass()} defaultValue={d.email_allowed ? "true" : "false"}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-2 border-t border-[#E8DFD0] pt-6">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-2">Meta (JSON)</legend>
        <textarea name="meta_json" rows={6} className={`${adminInputClass} font-mono text-xs`} defaultValue={d.meta_json} />
      </fieldset>
    </div>
  );
}
