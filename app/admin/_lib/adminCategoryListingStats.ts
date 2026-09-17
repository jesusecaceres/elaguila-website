/**
 * Live listing counts per Clasificados category slug (Supabase), for admin operations.
 *
 * ADMIN-OS-01 GATE A: 5 of these slugs (servicios, restaurantes, autos, empleos,
 * travel) do not live in `public.listings` at all — they have their own dedicated
 * tables. Querying `listings` filtered by category string for them (the old
 * behavior) silently returned a false "0" for every one of them: not an honest
 * "unavailable," a factually wrong count. See docs/admin-os/ADMIN_OS_CABLE_MAP.md,
 * "/admin/categories" section. Fixed by routing each dedicated-table slug to its
 * own real table; slugs with no genuine moderation-pending status (Restaurantes:
 * published/suspended/archived only; Autos: payment-gated, not review-gated) report
 * `pendingNotApplicable: true` instead of inventing a zero.
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";

function escapeIlikeExact(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type CategoryListingStatsRow = {
  slug: string;
  totalListings: number | null;
  pendingOrFlagged: number | null;
  /** True when this category's real status model has no moderation-pending concept — a genuine "—", not an invented zero. */
  pendingNotApplicable?: boolean;
  queryError: string | null;
};

/** Dedicated-table categories confirmed by the cable map to be absent from `public.listings`. */
const DEDICATED_TABLE_BY_SLUG: Record<
  string,
  { table: string; pendingStatusColumn?: string; pendingStatusValues?: string[] }
> = {
  servicios: { table: "servicios_public_listings", pendingStatusColumn: "listing_status", pendingStatusValues: ["pending_review"] },
  restaurantes: { table: "restaurantes_public_listings" },
  autos: { table: "autos_classifieds_listings" },
  empleos: { table: "empleos_public_listings", pendingStatusColumn: "lifecycle_status", pendingStatusValues: ["pending_review"] },
  travel: { table: "viajes_staged_listings", pendingStatusColumn: "lifecycle_status", pendingStatusValues: ["submitted", "in_review", "changes_requested"] },
  /** GATE 3 — confirmed ALLOWED_STATUS = draft/published/paused/suspended only (comida-local/actions.ts); no review-gate status exists, so no pendingStatusColumn. */
  "comida-local": { table: "comida_local_public_listings" },
};

export async function fetchListingStatsForCategorySlugs(slugs: string[]): Promise<CategoryListingStatsRow[]> {
  const supabase = getAdminSupabase();
  const out: CategoryListingStatsRow[] = [];

  for (const slug of slugs) {
    const dedicated = DEDICATED_TABLE_BY_SLUG[slug];

    if (dedicated) {
      const { count: total, error: e1 } = await supabase
        .from(dedicated.table)
        .select("id", { count: "exact", head: true });

      if (!dedicated.pendingStatusColumn) {
        out.push({
          slug,
          totalListings: e1 ? null : (typeof total === "number" ? total : 0),
          pendingOrFlagged: null,
          pendingNotApplicable: true,
          queryError: e1?.message ?? null,
        });
        continue;
      }

      const { count: pf, error: e2 } = await supabase
        .from(dedicated.table)
        .select("id", { count: "exact", head: true })
        .in(dedicated.pendingStatusColumn, dedicated.pendingStatusValues ?? []);

      const err = e1?.message ?? e2?.message ?? null;
      out.push({
        slug,
        totalListings: err ? null : (typeof total === "number" ? total : 0),
        pendingOrFlagged: err ? null : (typeof pf === "number" ? pf : 0),
        queryError: err,
      });
      continue;
    }

    const { count: total, error: e1 } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .ilike("category", escapeIlikeExact(slug));

    const { count: pf, error: e2 } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .ilike("category", escapeIlikeExact(slug))
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
