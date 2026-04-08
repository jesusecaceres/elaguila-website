/**
 * Live listing counts per Clasificados category slug (Supabase), for admin operations.
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";

export type CategoryListingStatsRow = {
  slug: string;
  totalListings: number | null;
  pendingOrFlagged: number | null;
  queryError: string | null;
};

export async function fetchListingStatsForCategorySlugs(slugs: string[]): Promise<CategoryListingStatsRow[]> {
  const supabase = getAdminSupabase();
  const out: CategoryListingStatsRow[] = [];

  for (const slug of slugs) {
    const { count: total, error: e1 } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("category", slug);

    const { count: pf, error: e2 } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("category", slug)
      .in("status", ["pending", "flagged"]);

    const err = e1?.message ?? e2?.message ?? null;
    out.push({
      slug,
      totalListings: err ? null : (typeof total === "number" ? total : 0),
      pendingOrFlagged: err ? null : (typeof pf === "number" ? pf : 0),
      queryError: err,
    });
  }

  return out;
}
