/**
 * Clasificados admin — operational audit of “open listings / queue” capability per registry category.
 *
 * SOURCE MAP (Gate A — where published rows live):
 * - restaurantes → `restaurantes_public_listings` (dedicated admin route; slug search; public `/clasificados/restaurantes/{slug}`).
 * - servicios → `servicios_public_listings` (NOT `listings.category=servicios` for live directory; generic queue is secondary/legacy).
 * - empleos → `empleos_public_listings` (admin API `/api/admin/empleos/*`; public `/clasificados/empleos/{slug}`).
 * - autos → `autos_classifieds_listings` (paid Leonix flow; public `/clasificados/autos/vehiculo/{id}`).
 * - rentas → `listings` with `category` ~ rentas OR `category` ~ bienes-raices + `detail_pairs` Leonix:operation=rent (admin merges in `fetchListingsForAdminWorkspaceFiltered`).
 * - en-venta, comunidad, clases, travel (“viajes” in UI maps to slug `travel`) → `listings` filtered by `category` (case-insensitive ilike in admin fetch).
 * - travel URL alias: query param `?category=viajes` is normalized to `travel` on the workspace page before hitting `listings`.
 */
import "server-only";

import { adminCategoryWorkspaceQueueHref } from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";
import { fetchListingsForAdminWorkspaceFiltered } from "@/app/admin/_lib/listingsAdminSelect";
import { listServiciosPublicListingsAdminQueueFromDb } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import type { ClasificadosCategoryRegistryEntry } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type ClasificadosCategoryOpsAuditRow = {
  slug: string;
  queueUrl: string;
  sourceTableOrSystem: string;
  canLoadPublishedListings: boolean;
  canSearchFilterListings: boolean;
  canOpenPublicListingLink: boolean;
  canModerateOrStatusManage: boolean;
  /** Staff can change listing content or lifecycle from an authenticated admin surface (queue, inspector, or /api/admin/*). */
  canEditAdInAdmin: boolean;
  falseReasons: string[];
  rowCount: number | null;
};

function pushReason(row: ClasificadosCategoryOpsAuditRow, msg: string) {
  if (!row.falseReasons.includes(msg)) row.falseReasons.push(msg);
}

function escapeIlikeExact(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function countListingsCategoryIlike(supabase: ReturnType<typeof getAdminSupabase>, slug: string): Promise<{ n: number | null; err: string | null }> {
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .ilike("category", escapeIlikeExact(slug));
  if (error) return { n: null, err: error.message };
  return { n: typeof count === "number" ? count : 0, err: null };
}

/** Probes Supabase + shared fetch helpers so TRUE/FALSE reflects real behavior (not copy). */
export async function fetchClasificadosCategoryOpsAuditRows(
  registry: ClasificadosCategoryRegistryEntry[],
): Promise<ClasificadosCategoryOpsAuditRow[]> {
  const configured = isSupabaseAdminConfigured();
  const supabase = configured ? getAdminSupabase() : null;
  const out: ClasificadosCategoryOpsAuditRow[] = [];

  for (const entry of registry) {
    const slug = entry.slug;
    const queueUrl = adminCategoryWorkspaceQueueHref(slug);
    const row: ClasificadosCategoryOpsAuditRow = {
      slug,
      queueUrl,
      sourceTableOrSystem: "—",
      canLoadPublishedListings: false,
      canSearchFilterListings: false,
      canOpenPublicListingLink: false,
      canModerateOrStatusManage: false,
      canEditAdInAdmin: false,
      falseReasons: [],
      rowCount: null,
    };

    if (!configured || !supabase) {
      row.sourceTableOrSystem = "Supabase (admin client)";
      pushReason(row, "Supabase admin client is not configured in this environment (cannot probe tables).");
      out.push(row);
      continue;
    }

    if (slug === "restaurantes") {
      row.sourceTableOrSystem = "restaurantes_public_listings";
      const { count, error } = await supabase
        .from("restaurantes_public_listings")
        .select("id", { count: "exact", head: true });
      if (error) {
        pushReason(row, `Query restaurantes_public_listings failed: ${error.message}`);
        row.rowCount = null;
        row.canLoadPublishedListings = false;
        row.canSearchFilterListings = false;
        row.canOpenPublicListingLink = false;
        row.canModerateOrStatusManage = false;
        row.canEditAdInAdmin = false;
      } else {
        row.rowCount = typeof count === "number" ? count : 0;
        row.canLoadPublishedListings = true;
        row.canSearchFilterListings = true;
        row.canOpenPublicListingLink = true;
        row.canModerateOrStatusManage = true;
        row.canEditAdInAdmin = true;
      }
      out.push(row);
      continue;
    }

    if (slug === "servicios") {
      row.sourceTableOrSystem = "servicios_public_listings (+ optional listings.category=servicios legacy)";
      const q = await listServiciosPublicListingsAdminQueueFromDb({ limit: 1 });
      if (q.unavailable) {
        pushReason(row, "servicios_public_listings unreadable (missing table/columns or RLS/policy error).");
        row.rowCount = null;
        row.canLoadPublishedListings = false;
        row.canSearchFilterListings = false;
        row.canOpenPublicListingLink = false;
        row.canModerateOrStatusManage = false;
        row.canEditAdInAdmin = false;
      } else {
        const { count, error } = await supabase
          .from("servicios_public_listings")
          .select("id", { count: "exact", head: true });
        if (error) {
          pushReason(row, `Count servicios_public_listings failed: ${error.message}`);
          row.rowCount = null;
        } else {
          row.rowCount = typeof count === "number" ? count : 0;
        }
        row.canLoadPublishedListings = true;
        row.canSearchFilterListings = true;
        row.canOpenPublicListingLink = true;
        row.canModerateOrStatusManage = true;
        row.canEditAdInAdmin = true;
      }
      out.push(row);
      continue;
    }

    if (slug === "empleos") {
      row.sourceTableOrSystem = "empleos_public_listings";
      const { count, error } = await supabase
        .from("empleos_public_listings")
        .select("id", { count: "exact", head: true });
      if (error) {
        pushReason(row, `Query empleos_public_listings failed: ${error.message}`);
        row.rowCount = null;
        row.canLoadPublishedListings = false;
        row.canSearchFilterListings = false;
        row.canOpenPublicListingLink = false;
        row.canModerateOrStatusManage = false;
        row.canEditAdInAdmin = false;
      } else {
        row.rowCount = typeof count === "number" ? count : 0;
        row.canLoadPublishedListings = true;
        row.canSearchFilterListings = true;
        row.canOpenPublicListingLink = true;
        row.canModerateOrStatusManage = true;
        row.canEditAdInAdmin = true;
      }
      out.push(row);
      continue;
    }

    if (slug === "autos") {
      row.sourceTableOrSystem = "autos_classifieds_listings";
      const { count, error } = await supabase
        .from("autos_classifieds_listings")
        .select("id", { count: "exact", head: true });
      if (error) {
        pushReason(row, `Query autos_classifieds_listings failed: ${error.message}`);
        row.rowCount = null;
        row.canLoadPublishedListings = false;
        row.canSearchFilterListings = false;
        row.canOpenPublicListingLink = false;
        row.canModerateOrStatusManage = false;
        row.canEditAdInAdmin = false;
      } else {
        row.rowCount = typeof count === "number" ? count : 0;
        row.canLoadPublishedListings = true;
        row.canSearchFilterListings = true;
        row.canOpenPublicListingLink = true;
        row.canModerateOrStatusManage = true;
        row.canEditAdInAdmin = true;
      }
      out.push(row);
      continue;
    }

    row.sourceTableOrSystem =
      slug === "rentas"
        ? "listings (category ~ rentas OR bienes-raices + detail_pairs.operation=rent)"
        : "listings (category column, case-insensitive match to registry slug)";

    const { n: catCount, err: catErr } = await countListingsCategoryIlike(supabase, slug);
    if (catErr) {
      pushReason(row, `listings category probe failed: ${catErr}`);
      row.rowCount = null;
    } else {
      row.rowCount = catCount;
    }

    const fetchRes = await fetchListingsForAdminWorkspaceFiltered(supabase, { category: slug, limit: 5 });
    if (fetchRes.error) {
      pushReason(row, `fetchListingsForAdminWorkspaceFiltered failed: ${fetchRes.error.message}`);
      row.canLoadPublishedListings = false;
    } else {
      row.canLoadPublishedListings = true;
      const searchRes = await fetchListingsForAdminWorkspaceFiltered(supabase, {
        category: slug,
        q: "a",
        limit: 5,
      });
      if (searchRes.error) {
        pushReason(row, `Search probe (q=a) failed: ${searchRes.error.message}`);
        row.canSearchFilterListings = false;
      } else {
        row.canSearchFilterListings = true;
      }
    }

    row.canOpenPublicListingLink = row.canLoadPublishedListings;
    row.canModerateOrStatusManage = row.canLoadPublishedListings;
    row.canEditAdInAdmin = row.canModerateOrStatusManage;

    out.push(row);
  }

  return out;
}
