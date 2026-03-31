import { getAdminSupabase } from "@/app/lib/supabase/server";
import { mapCatalogItemRow, mapImage, mapRule } from "@/app/lib/tienda/tiendaCatalogQueries";
import type { TiendaCatalogItemRow, TiendaCatalogItemWithMedia } from "@/app/lib/tienda/tiendaCatalogTypes";
import { isTiendaCatalogCtaMode, isTiendaCatalogPricingMode } from "@/app/lib/tienda/tiendaCatalogTypes";

export type AdminCatalogListParams = {
  search?: string;
  categorySlug?: string;
  /** @deprecated prefer visibility */
  liveOnly?: boolean;
  /** all | live (public) | hidden | draft (!is_live) */
  visibility?: "all" | "live" | "hidden" | "draft";
  ctaMode?: string;
  pricingMode?: string;
  limit?: number;
  offset?: number;
};

export async function getAdminCatalogStats(): Promise<{
  total: number;
  live: number;
  featured: number;
  error: string | null;
}> {
  try {
    const supabase = getAdminSupabase();
    const { count: total, error: e1 } = await supabase
      .from("tienda_catalog_items")
      .select("id", { count: "exact", head: true });
    if (e1) throw e1;
    const { count: live, error: e2 } = await supabase
      .from("tienda_catalog_items")
      .select("id", { count: "exact", head: true })
      .eq("is_live", true)
      .eq("is_hidden", false);
    if (e2) throw e2;
    const { count: featured, error: e3 } = await supabase
      .from("tienda_catalog_items")
      .select("id", { count: "exact", head: true })
      .eq("is_featured", true);
    if (e3) throw e3;
    return {
      total: total ?? 0,
      live: live ?? 0,
      featured: featured ?? 0,
      error: null,
    };
  } catch (e) {
    return { total: 0, live: 0, featured: 0, error: e instanceof Error ? e.message : "Stats failed" };
  }
}

export async function listCatalogItemsAdmin(params: AdminCatalogListParams): Promise<{
  rows: TiendaCatalogItemRow[];
  total: number;
  error: string | null;
}> {
  const limit = Math.min(Math.max(params.limit ?? 40, 1), 150);
  const offset = Math.max(params.offset ?? 0, 0);
  const search = (params.search ?? "").trim();
  try {
    const supabase = getAdminSupabase();
    let q = supabase.from("tienda_catalog_items").select("*", { count: "exact" });

    const vis = params.visibility ?? (params.liveOnly ? "live" : "all");
    if (vis === "live") q = q.eq("is_live", true).eq("is_hidden", false);
    else if (vis === "hidden") q = q.eq("is_hidden", true);
    else if (vis === "draft") q = q.eq("is_live", false);

    if (params.categorySlug) q = q.eq("category_slug", params.categorySlug);
    if (params.ctaMode && isTiendaCatalogCtaMode(params.ctaMode)) q = q.eq("cta_mode", params.ctaMode);
    if (params.pricingMode && isTiendaCatalogPricingMode(params.pricingMode)) q = q.eq("pricing_mode", params.pricingMode);

    if (search) {
      const raw = search.replace(/%/g, "").slice(0, 96);
      const term = `%${raw}%`;
      q = q.or(`title_es.ilike.${term},title_en.ilike.${term},slug.ilike.${term},category_slug.ilike.${term}`);
    }

    q = q.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    const rows = (data as Record<string, unknown>[] | null)?.map(mapCatalogItemRow) ?? [];
    return { rows, total: typeof count === "number" ? count : rows.length, error: null };
  } catch (e) {
    return { rows: [], total: 0, error: e instanceof Error ? e.message : "List failed" };
  }
}

export async function getCatalogItemAdminById(id: string): Promise<{
  item: TiendaCatalogItemWithMedia | null;
  error: string | null;
}> {
  try {
    const supabase = getAdminSupabase();
    const { data: row, error: e1 } = await supabase.from("tienda_catalog_items").select("*").eq("id", id).maybeSingle();
    if (e1) throw e1;
    if (!row) return { item: null, error: null };
    const item = mapCatalogItemRow(row as Record<string, unknown>);
    const { data: imgs, error: e2 } = await supabase
      .from("tienda_catalog_images")
      .select("*")
      .eq("item_id", id)
      .order("sort_order", { ascending: true });
    if (e2) throw e2;
    const { data: rules, error: e3 } = await supabase
      .from("tienda_catalog_pricing_rules")
      .select("*")
      .eq("item_id", id)
      .order("sort_order", { ascending: true });
    if (e3) throw e3;
    return {
      item: {
        ...item,
        images: (imgs as Record<string, unknown>[] | null)?.map(mapImage) ?? [],
        pricing_rules: (rules as Record<string, unknown>[] | null)?.map(mapRule) ?? [],
      },
      error: null,
    };
  } catch (e) {
    return { item: null, error: e instanceof Error ? e.message : "Load failed" };
  }
}

export async function isCatalogSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from("tienda_catalog_items").select("id").eq("slug", slug).limit(1);
    if (error) throw error;
    const row = data?.[0] as { id: string } | undefined;
    if (!row) return false;
    if (excludeId && row.id === excludeId) return false;
    return true;
  } catch {
    return true;
  }
}
