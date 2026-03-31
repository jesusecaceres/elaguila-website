import { getAdminSupabase } from "@/app/lib/supabase/server";
import { mapCatalogItemRow, mapRule } from "@/app/lib/tienda/tiendaCatalogQueries";
import type { TiendaCatalogItemRow, TiendaCatalogPricingRuleRow } from "@/app/lib/tienda/tiendaCatalogTypes";

export async function fetchCatalogItemAndRulesForSelfServeSlug(
  productSlug: string
): Promise<{
  item: TiendaCatalogItemRow | null;
  rules: TiendaCatalogPricingRuleRow[];
  error: string | null;
}> {
  try {
    const supabase = getAdminSupabase();
    const { data: byLink, error: e1 } = await supabase
      .from("tienda_catalog_items")
      .select("*")
      .eq("linked_product_slug", productSlug)
      .eq("is_live", true)
      .eq("is_hidden", false)
      .maybeSingle();
    if (e1) throw e1;

    let row = byLink as Record<string, unknown> | null;
    if (!row) {
      const { data: bySlug, error: e2 } = await supabase
        .from("tienda_catalog_items")
        .select("*")
        .eq("slug", productSlug)
        .eq("is_live", true)
        .eq("is_hidden", false)
        .maybeSingle();
      if (e2) throw e2;
      row = bySlug as Record<string, unknown> | null;
    }

    if (!row) return { item: null, rules: [], error: null };

    const item = mapCatalogItemRow(row);
    const { data: rulesRaw, error: e3 } = await supabase
      .from("tienda_catalog_pricing_rules")
      .select("*")
      .eq("item_id", item.id)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (e3) throw e3;
    const rules = (rulesRaw as Record<string, unknown>[] | null)?.map(mapRule) ?? [];
    return { item, rules, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "pricing fetch failed";
    return { item: null, rules: [], error: msg };
  }
}
