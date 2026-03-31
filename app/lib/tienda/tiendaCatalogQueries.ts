import { getAdminSupabase } from "@/app/lib/supabase/server";
import type {
  TiendaCatalogImageRow,
  TiendaCatalogItemMeta,
  TiendaCatalogItemRow,
  TiendaCatalogItemWithMedia,
  TiendaCatalogPricingRuleRow,
} from "./tiendaCatalogTypes";

function mapMeta(raw: unknown): TiendaCatalogItemMeta {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as TiendaCatalogItemMeta;
  return {};
}

export function mapCatalogItemRow(r: Record<string, unknown>): TiendaCatalogItemRow {
  return {
    id: String(r.id),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
    title_es: String(r.title_es ?? ""),
    title_en: String(r.title_en ?? ""),
    slug: String(r.slug ?? ""),
    category_slug: String(r.category_slug ?? ""),
    subcategory_slug: r.subcategory_slug != null ? String(r.subcategory_slug) : null,
    short_description_es: String(r.short_description_es ?? ""),
    short_description_en: String(r.short_description_en ?? ""),
    description_es: String(r.description_es ?? ""),
    description_en: String(r.description_en ?? ""),
    pricing_mode: String(r.pricing_mode ?? "display_only"),
    price_label: r.price_label != null ? String(r.price_label) : null,
    price_note: r.price_note != null ? String(r.price_note) : null,
    base_price: r.base_price as number | string | null,
    cta_mode: String(r.cta_mode ?? "request_quote"),
    is_featured: Boolean(r.is_featured),
    is_live: Boolean(r.is_live),
    is_hidden: Boolean(r.is_hidden),
    sort_order: Number(r.sort_order ?? 0),
    badge_label: r.badge_label != null ? String(r.badge_label) : null,
    specialty_flag: Boolean(r.specialty_flag),
    storefront_visible: Boolean(r.storefront_visible),
    category_visible: Boolean(r.category_visible),
    office_preferred: Boolean(r.office_preferred),
    phone_preferred: Boolean(r.phone_preferred),
    email_allowed: Boolean(r.email_allowed),
    meta: mapMeta(r.meta),
    linked_product_slug: r.linked_product_slug != null ? String(r.linked_product_slug) : null,
  };
}

export function mapImage(r: Record<string, unknown>): TiendaCatalogImageRow {
  return {
    id: String(r.id),
    item_id: String(r.item_id),
    created_at: String(r.created_at),
    image_url: String(r.image_url ?? ""),
    alt_es: String(r.alt_es ?? ""),
    alt_en: String(r.alt_en ?? ""),
    sort_order: Number(r.sort_order ?? 0),
    is_primary: Boolean(r.is_primary),
  };
}

export function mapRule(r: Record<string, unknown>): TiendaCatalogPricingRuleRow {
  return {
    id: String(r.id),
    item_id: String(r.item_id),
    rule_type: String(r.rule_type ?? "quantity_tier"),
    quantity_min: r.quantity_min != null ? Number(r.quantity_min) : null,
    quantity_max: r.quantity_max != null ? Number(r.quantity_max) : null,
    size_key: r.size_key != null ? String(r.size_key) : null,
    stock_key: r.stock_key != null ? String(r.stock_key) : null,
    finish_key: r.finish_key != null ? String(r.finish_key) : null,
    sides_key: r.sides_key != null ? String(r.sides_key) : null,
    price: r.price as number | string,
    sort_order: Number(r.sort_order ?? 0),
    active: Boolean(r.active),
    created_at: String(r.created_at ?? ""),
  };
}

export type CatalogPublicListFilters = {
  categorySlug?: string;
  featuredStorefront?: boolean;
  includeHidden?: boolean;
};

/** Public/storefront catalog rows (no pricing_rules by default). */
export async function listTiendaCatalogItemsPublic(
  filters: CatalogPublicListFilters
): Promise<{ items: TiendaCatalogItemRow[]; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    let q = supabase.from("tienda_catalog_items").select("*").order("sort_order", { ascending: false });

    if (!filters.includeHidden) {
      q = q.eq("is_live", true).eq("is_hidden", false);
    }
    if (filters.categorySlug) {
      q = q.eq("category_slug", filters.categorySlug);
      q = q.eq("category_visible", true);
    }
    if (filters.featuredStorefront) {
      q = q.eq("is_featured", true).eq("storefront_visible", true);
    }

    const { data, error } = await q;
    if (error) throw error;
    const items = (data as Record<string, unknown>[] | null)?.map(mapCatalogItemRow) ?? [];
    return { items, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Catalog query failed";
    return { items: [], error: msg };
  }
}

export async function getTiendaCatalogItemPublicBySlug(
  slug: string
): Promise<{ item: TiendaCatalogItemWithMedia | null; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const { data: row, error: e1 } = await supabase
      .from("tienda_catalog_items")
      .select("*")
      .eq("slug", slug)
      .eq("is_live", true)
      .eq("is_hidden", false)
      .maybeSingle();
    if (e1) throw e1;
    if (!row) return { item: null, error: null };

    const item = mapCatalogItemRow(row as Record<string, unknown>);
    const { data: imgs } = await supabase
      .from("tienda_catalog_images")
      .select("*")
      .eq("item_id", item.id)
      .order("sort_order", { ascending: true });
    const { data: rules } = await supabase
      .from("tienda_catalog_pricing_rules")
      .select("*")
      .eq("item_id", item.id)
      .eq("active", true)
      .order("sort_order", { ascending: true });

    return {
      item: {
        ...item,
        images: (imgs as Record<string, unknown>[] | null)?.map(mapImage) ?? [],
        pricing_rules: (rules as Record<string, unknown>[] | null)?.map(mapRule) ?? [],
      },
      error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Catalog load failed";
    return { item: null, error: msg };
  }
}

export async function fetchPrimaryImageUrlForItems(itemIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (itemIds.length === 0) return out;
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("tienda_catalog_images")
      .select("item_id, image_url, is_primary, sort_order")
      .in("item_id", itemIds);

    const rows = (data as { item_id: string; image_url: string; is_primary: boolean; sort_order: number }[] | null) ?? [];
    const byItem = new Map<string, typeof rows>();
    for (const r of rows) {
      const a = byItem.get(r.item_id) ?? [];
      a.push(r);
      byItem.set(r.item_id, a);
    }
    for (const [id, list] of byItem) {
      const primary = list.find((x) => x.is_primary) ?? list.sort((a, b) => a.sort_order - b.sort_order)[0];
      if (primary?.image_url) out.set(id, primary.image_url);
    }
  } catch {
    /* ignore */
  }
  return out;
}
