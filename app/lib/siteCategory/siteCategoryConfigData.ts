import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";

export type SiteCategoryOverrideRow = {
  slug: string;
  visibility: "public" | "hidden";
  sort_order: number;
  operational_status: "live" | "staged" | "coming_soon" | "hidden";
  highlight: boolean;
  notes: string | null;
  updated_at: string;
};

export async function fetchSiteCategoryConfigMap(): Promise<Map<string, SiteCategoryOverrideRow>> {
  const out = new Map<string, SiteCategoryOverrideRow>();
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from("site_category_config").select("*");
    if (error) return out;
    for (const raw of data ?? []) {
      const r = raw as Record<string, unknown>;
      const slug = String(r.slug ?? "");
      if (!slug) continue;
      out.set(slug, {
        slug,
        visibility: r.visibility === "hidden" ? "hidden" : "public",
        sort_order: typeof r.sort_order === "number" ? r.sort_order : Number(r.sort_order) || 0,
        operational_status: (r.operational_status as SiteCategoryOverrideRow["operational_status"]) || "coming_soon",
        highlight: Boolean(r.highlight),
        notes: r.notes != null ? String(r.notes) : null,
        updated_at: String(r.updated_at ?? ""),
      });
    }
  } catch {
    /* table may not exist until migration */
  }
  return out;
}
