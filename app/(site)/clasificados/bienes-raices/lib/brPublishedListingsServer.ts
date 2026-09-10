import "server-only";

/**
 * Gate BIENES-NEGOCIO-2 — server-side published Bienes Raíces reader.
 *
 * Why this exists: unlike Servicios, Restaurantes and Comida Local, this category's public browse
 * is a BROWSER reader (`fetchBrPublishedListingsBrowser`, RLS-scoped, `createSupabaseBrowserClient`).
 * `app/sitemap.ts` is a server route and cannot call it. Rather than duplicate the eligibility
 * rules, this module reuses the SAME pure predicates the browser path already applies:
 *
 *   1. `isListingRowActiveAndPublishedForBrowse` — the shared row-level rule
 *      (`status === "active" && is_published !== false`).
 *   2. `collectBrChildParentIds` + `filterBrRowsByActiveParent` — the shared Gate G.2.3.4
 *      parent-liveness gate, imported verbatim from `brPublicChildParentVisibility.ts`. A Negocio
 *      inventory child is dropped unless its canonical parent (resolved BY REAL UUID) is itself an
 *      active, published, same-owner, `inventory_role="main"` bienes-raices business row.
 *
 * So a suspended, paused or unpublished PARENT silently removes its children from the sitemap, the
 * same way it removes them from browse and from public detail. No second eligibility model, and no
 * second sitemap engine — this module only reads rows.
 *
 * It deliberately selects a NARROW column set: the sitemap needs identity, timestamps and the four
 * fields the two shared gates read. It does not fetch media, prose or contact data.
 */
import { getAdminSupabase, getServerSupabaseAnon, isSupabaseAdminConfigured, isSupabasePublicReadConfigured } from "@/app/lib/supabase/server";
import { isListingRowActiveAndPublishedForBrowse } from "@/app/(site)/clasificados/lib/listingPublicBrowseEligibility";
import {
  collectBrChildParentIds,
  filterBrRowsByActiveParent,
  type BrPublicParentCandidate,
} from "@/app/(site)/clasificados/lib/brPublicChildParentVisibility";

/** Exactly what the sitemap and the two shared gates need — nothing more. */
export type BrPublishedSitemapRow = {
  id: string;
  owner_id: string | null;
  status: string | null;
  is_published: boolean | null;
  inventory_role: string | null;
  br_inventory_parent_listing_id: string | null;
  updated_at: string | null;
  published_at: string | null;
  created_at: string | null;
};

const SITEMAP_SELECT =
  "id, owner_id, status, is_published, inventory_role, br_inventory_parent_listing_id, updated_at, published_at, created_at";

/** Parent candidates carry only the fields `isBrChildParentGateSatisfied` actually evaluates. */
const PARENT_SELECT = "id, category, seller_type, inventory_role, owner_id, status, is_published";

/**
 * Well under the 50k per-sitemap limit; a larger catalog needs a paginated sitemap index, not a
 * bigger constant.
 */
export const BR_SITEMAP_MAX = 2000;

export type BrPublishedListingsServerResult =
  | { ok: true; rows: BrPublishedSitemapRow[] }
  | { ok: false; error: string };

function resolveClient() {
  if (isSupabasePublicReadConfigured()) return getServerSupabaseAnon();
  if (isSupabaseAdminConfigured()) return null;
  return null;
}

/**
 * Published, publicly-eligible Bienes Raíces rows — parent gate applied. Returns `ok:false` on any
 * failure so the caller can emit NO entries rather than a partial or fabricated list.
 */
export async function listPublishedBrListingsForSitemap(
  limit: number = BR_SITEMAP_MAX,
): Promise<BrPublishedListingsServerResult> {
  const anon = resolveClient();
  const supabase = anon ?? (isSupabaseAdminConfigured() ? getAdminSupabase() : null);
  if (!supabase) return { ok: false, error: "supabase_unconfigured" };

  try {
    const { data, error } = await supabase
      .from("listings")
      .select(SITEMAP_SELECT)
      .eq("category", "bienes-raices")
      .eq("is_published", true)
      .eq("status", "active")
      .limit(limit);
    if (error) return { ok: false, error: error.message };

    const rows = ((data ?? []) as unknown as BrPublishedSitemapRow[]).filter((row) =>
      // The shared row-level public rule, applied verbatim — never re-expressed here.
      isListingRowActiveAndPublishedForBrowse(row),
    );

    // The shared parent-liveness gate, applied verbatim. Parents are resolved by real UUID.
    const parentIds = collectBrChildParentIds(rows);
    const parentsById = new Map<string, BrPublicParentCandidate>();
    if (parentIds.length > 0) {
      const { data: parentRows, error: parentError } = await supabase
        .from("listings")
        .select(PARENT_SELECT)
        .in("id", parentIds);
      // A parent read failure must NOT silently publish orphan children — fail the whole section.
      if (parentError) return { ok: false, error: parentError.message };
      for (const p of (parentRows ?? []) as unknown as BrPublicParentCandidate[]) {
        if (p?.id) parentsById.set(p.id, p);
      }
    }

    return { ok: true, rows: filterBrRowsByActiveParent(rows, parentsById) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
