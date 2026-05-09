/**
 * Clasificados admin — operational audit of “open listings / queue” capability per registry category.
 *
 * SOURCE MAP (Gate A — where published rows live):
 * - restaurantes → `restaurantes_public_listings` (dedicated admin route; slug search; public `/clasificados/restaurantes/{slug}`).
 * - servicios → `servicios_public_listings` (NOT `listings.category=servicios` for live directory; generic queue is secondary/legacy).
 * - empleos → `empleos_public_listings` (admin API `/api/admin/empleos/*`; public `/clasificados/empleos/{slug}`).
 * - autos → `autos_classifieds_listings` (paid Leonix flow; public `/clasificados/autos/vehiculo/{id}`).
 * - rentas → `listings` with `category` ~ rentas OR `category` ~ bienes-raices + `detail_pairs` Leonix:operation=rent (admin merges in `fetchListingsForAdminWorkspaceFiltered`).
 * - en-venta, comunidad, clases → `listings` filtered by `category` (case-insensitive ilike in admin fetch).
 * - travel (registry slug) → `viajes_staged_listings` for the live Viajes catalog (public `/clasificados/viajes/...`); `listings.category=travel` is not the primary store.
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
  /** Every published/live row in the source table has a non-empty `leonix_ad_id` (or equivalent) and the column is readable. */
  canLeonixAdIdEmbedded: boolean;
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

async function countPublishedListingsMissingLeonix(
  supabase: ReturnType<typeof getAdminSupabase>,
  slug: string,
): Promise<{ missing: number | null; err: string | null }> {
  const esc = escapeIlikeExact(slug);
  const [{ count: nNull, error: e0 }, { count: nEmpty, error: e1 }] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .ilike("category", esc)
      .eq("is_published", true)
      .is("leonix_ad_id", null),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .ilike("category", esc)
      .eq("is_published", true)
      .eq("leonix_ad_id", ""),
  ]);
  if (e0 || e1) return { missing: null, err: e0?.message ?? e1?.message ?? "count error" };
  return { missing: (nNull ?? 0) + (nEmpty ?? 0), err: null };
}

async function countRentasMergedMissingLeonix(
  supabase: ReturnType<typeof getAdminSupabase>,
  limit: number,
): Promise<{ missing: number; err: string | null }> {
  const res = await fetchListingsForAdminWorkspaceFiltered(supabase, { category: "rentas", limit });
  if (res.error) return { missing: 0, err: res.error.message };
  const rows = res.data ?? [];
  const missing = rows.filter((r) => !String((r as { leonix_ad_id?: string | null }).leonix_ad_id ?? "").trim()).length;
  return { missing, err: null };
}

async function auditDedicatedLeonix(
  supabase: ReturnType<typeof getAdminSupabase>,
  row: ClasificadosCategoryOpsAuditRow,
  table: string,
  labelPublished: string,
  countPublished: () => Promise<{ count: number | null; error: { message: string } | null }>,
  countMissing: () => Promise<{ n0: number; n1: number; error: { message: string } | null }>,
): Promise<void> {
  const probe = await supabase.from(table).select("leonix_ad_id").limit(1);
  if (probe.error) {
    pushReason(row, `leonix_ad_id column unreadable on ${table}: ${probe.error.message}`);
    row.canLeonixAdIdEmbedded = false;
    return;
  }
  const pub = await countPublished();
  if (pub.error) {
    pushReason(row, `${labelPublished} count on ${table} failed: ${pub.error.message}`);
    row.canLeonixAdIdEmbedded = false;
    return;
  }
  const totalPub = pub.count ?? 0;
  if (totalPub === 0) {
    row.canLeonixAdIdEmbedded = true;
    return;
  }
  const miss = await countMissing();
  if (miss.error) {
    pushReason(row, `Leonix null/empty probe on ${table} failed: ${miss.error.message}`);
    row.canLeonixAdIdEmbedded = false;
    return;
  }
  const missing = miss.n0 + miss.n1;
  if (missing > 0) {
    pushReason(row, `${table}: ${missing} ${labelPublished} row(s) missing leonix_ad_id (of ${totalPub}).`);
    row.canLeonixAdIdEmbedded = false;
    return;
  }
  row.canLeonixAdIdEmbedded = true;
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
      canLeonixAdIdEmbedded: false,
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
      } else {
        row.rowCount = typeof count === "number" ? count : 0;
        row.canLoadPublishedListings = true;
        row.canSearchFilterListings = true;
        row.canOpenPublicListingLink = true;
        row.canModerateOrStatusManage = true;
        row.canEditAdInAdmin = true;
      }
      await auditDedicatedLeonix(
        supabase,
        row,
        "restaurantes_public_listings",
        "status=published",
        async () => {
          const r = await supabase
            .from("restaurantes_public_listings")
            .select("id", { count: "exact", head: true })
            .eq("status", "published");
          return { count: r.count, error: r.error };
        },
        async () => {
          const [a, b] = await Promise.all([
            supabase
              .from("restaurantes_public_listings")
              .select("id", { count: "exact", head: true })
              .eq("status", "published")
              .is("leonix_ad_id", null),
            supabase
              .from("restaurantes_public_listings")
              .select("id", { count: "exact", head: true })
              .eq("status", "published")
              .eq("leonix_ad_id", ""),
          ]);
          return {
            n0: a.count ?? 0,
            n1: b.count ?? 0,
            error: a.error ?? b.error,
          };
        },
      );
      out.push(row);
      continue;
    }

    if (slug === "servicios") {
      row.sourceTableOrSystem = "servicios_public_listings (+ optional listings.category=servicios legacy)";
      const q = await listServiciosPublicListingsAdminQueueFromDb({ limit: 1 });
      if (q.unavailable) {
        pushReason(row, "servicios_public_listings unreadable (missing table/columns or RLS/policy error).");
        row.rowCount = null;
        row.canLeonixAdIdEmbedded = false;
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
        await auditDedicatedLeonix(
          supabase,
          row,
          "servicios_public_listings",
          "listing_status=published",
          async () => {
            const r = await supabase
              .from("servicios_public_listings")
              .select("id", { count: "exact", head: true })
              .eq("listing_status", "published");
            return { count: r.count, error: r.error };
          },
          async () => {
            const [a, b] = await Promise.all([
              supabase
                .from("servicios_public_listings")
                .select("id", { count: "exact", head: true })
                .eq("listing_status", "published")
                .is("leonix_ad_id", null),
              supabase
                .from("servicios_public_listings")
                .select("id", { count: "exact", head: true })
                .eq("listing_status", "published")
                .eq("leonix_ad_id", ""),
            ]);
            return { n0: a.count ?? 0, n1: b.count ?? 0, error: a.error ?? b.error };
          },
        );
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
      } else {
        row.rowCount = typeof count === "number" ? count : 0;
        row.canLoadPublishedListings = true;
        row.canSearchFilterListings = true;
        row.canOpenPublicListingLink = true;
        row.canModerateOrStatusManage = true;
        row.canEditAdInAdmin = true;
      }
      await auditDedicatedLeonix(
        supabase,
        row,
        "empleos_public_listings",
        "lifecycle_status=published",
        async () => {
          const r = await supabase
            .from("empleos_public_listings")
            .select("id", { count: "exact", head: true })
            .eq("lifecycle_status", "published");
          return { count: r.count, error: r.error };
        },
        async () => {
          const [a, b] = await Promise.all([
            supabase
              .from("empleos_public_listings")
              .select("id", { count: "exact", head: true })
              .eq("lifecycle_status", "published")
              .is("leonix_ad_id", null),
            supabase
              .from("empleos_public_listings")
              .select("id", { count: "exact", head: true })
              .eq("lifecycle_status", "published")
              .eq("leonix_ad_id", ""),
          ]);
          return { n0: a.count ?? 0, n1: b.count ?? 0, error: a.error ?? b.error };
        },
      );
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
      } else {
        row.rowCount = typeof count === "number" ? count : 0;
        row.canLoadPublishedListings = true;
        row.canSearchFilterListings = true;
        row.canOpenPublicListingLink = true;
        row.canModerateOrStatusManage = true;
        row.canEditAdInAdmin = true;
      }
      await auditDedicatedLeonix(
        supabase,
        row,
        "autos_classifieds_listings",
        "status=active",
        async () => {
          const r = await supabase
            .from("autos_classifieds_listings")
            .select("id", { count: "exact", head: true })
            .eq("status", "active");
          return { count: r.count, error: r.error };
        },
        async () => {
          const [a, b] = await Promise.all([
            supabase
              .from("autos_classifieds_listings")
              .select("id", { count: "exact", head: true })
              .eq("status", "active")
              .is("leonix_ad_id", null),
            supabase
              .from("autos_classifieds_listings")
              .select("id", { count: "exact", head: true })
              .eq("status", "active")
              .eq("leonix_ad_id", ""),
          ]);
          return { n0: a.count ?? 0, n1: b.count ?? 0, error: a.error ?? b.error };
        },
      );
      out.push(row);
      continue;
    }

    if (slug === "travel") {
      row.sourceTableOrSystem = "viajes_staged_listings (approved + is_public = live catalog)";
      const { count, error } = await supabase.from("viajes_staged_listings").select("id", { count: "exact", head: true });
      if (error) {
        pushReason(row, `Query viajes_staged_listings failed: ${error.message}`);
        row.rowCount = null;
      } else {
        row.rowCount = typeof count === "number" ? count : 0;
        row.canLoadPublishedListings = true;
        row.canSearchFilterListings = true;
        row.canOpenPublicListingLink = true;
        row.canModerateOrStatusManage = true;
        row.canEditAdInAdmin = true;
      }
      await auditDedicatedLeonix(
        supabase,
        row,
        "viajes_staged_listings",
        "approved+public",
        async () => {
          const r = await supabase
            .from("viajes_staged_listings")
            .select("id", { count: "exact", head: true })
            .eq("lifecycle_status", "approved")
            .eq("is_public", true);
          return { count: r.count, error: r.error };
        },
        async () => {
          const [a, b] = await Promise.all([
            supabase
              .from("viajes_staged_listings")
              .select("id", { count: "exact", head: true })
              .eq("lifecycle_status", "approved")
              .eq("is_public", true)
              .is("leonix_ad_id", null),
            supabase
              .from("viajes_staged_listings")
              .select("id", { count: "exact", head: true })
              .eq("lifecycle_status", "approved")
              .eq("is_public", true)
              .eq("leonix_ad_id", ""),
          ]);
          return { n0: a.count ?? 0, n1: b.count ?? 0, error: a.error ?? b.error };
        },
      );
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

    const probe = await supabase.from("listings").select("leonix_ad_id").ilike("category", escapeIlikeExact(slug)).limit(1);
    if (probe.error) {
      pushReason(row, `listings.leonix_ad_id unreadable for category=${slug}: ${probe.error.message}`);
      row.canLeonixAdIdEmbedded = false;
      out.push(row);
      continue;
    }

    if (slug === "rentas") {
      const { missing, err } = await countRentasMergedMissingLeonix(supabase, 400);
      if (err) {
        pushReason(row, `Rentas merged Leonix probe failed: ${err}`);
        row.canLeonixAdIdEmbedded = false;
      } else if (missing > 0) {
        pushReason(row, `listings (rentas merged queue): ${missing} row(s) in merged sample missing leonix_ad_id (limit 400).`);
        row.canLeonixAdIdEmbedded = false;
      } else {
        row.canLeonixAdIdEmbedded = true;
      }
    } else {
      const { missing, err } = await countPublishedListingsMissingLeonix(supabase, slug);
      if (err) {
        pushReason(row, `Leonix published probe failed: ${err}`);
        row.canLeonixAdIdEmbedded = false;
      } else if ((missing ?? 0) > 0) {
        pushReason(row, `listings: ${missing} is_published row(s) with empty leonix_ad_id for category=${slug}.`);
        row.canLeonixAdIdEmbedded = false;
      } else {
        row.canLeonixAdIdEmbedded = true;
      }
    }

    out.push(row);
  }

  return out;
}
