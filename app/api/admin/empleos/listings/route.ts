import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

import { empleosRowMatchesAdminQueueSearch } from "@/app/admin/_lib/adminAdSearch";
import { empleosStaffRestoreBlockedReason } from "@/app/admin/_lib/adminEmpleosStaffActions";
import { loadAdminListingCommercialTruth, type AdminListingCommercialTruthMap } from "@/app/admin/_lib/adminListingCommercialTruth";
import { ADMIN_QUEUE_DEFAULT_LIMIT, normalizeAdminQueueLimit } from "@/app/admin/_lib/adminQueueActionFlow";
import { empleosRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import { classifyPublication } from "@/app/admin/_lib/publicationSemantics";
import { adminRowMatchesLeonixAdIdFilter, adminRowMatchesOwnerFilter } from "@/app/admin/(dashboard)/workspace/clasificados/_lib/adminNormalizedShell";
import {
  fetchAllEmpleosListingsForAdmin,
  fetchEmpleosApplicationHealthByListingIds,
  type EmpleosPublicListingRow,
} from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { fetchProfileIdsMatchingAdminQueueSearch } from "@/app/lib/supabase/adminQueueProfileSearch";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { rowToJobRecord } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { empleosJobRecordListLocationLine } from "@/app/clasificados/empleos/lib/empleosJobRecordListLocation";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/** Columns the shared admin queue select omits but the lifecycle / payment truth needs (read-only, <=100 ids per query). */
async function fetchEmpleosLifecycleExtras(ids: string[]): Promise<Map<string, { published_at: string | null; republish_count: number | null }>> {
  const out = new Map<string, { published_at: string | null; republish_count: number | null }>();
  if (ids.length === 0) return out;
  const supabase = getAdminSupabase();
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await supabase
      .from("empleos_public_listings")
      .select("id, published_at, republish_count")
      .in("id", ids.slice(i, i + 100));
    for (const r of (data ?? []) as { id: string; published_at?: string | null; republish_count?: number | null }[]) {
      out.set(r.id, { published_at: r.published_at ?? null, republish_count: r.republish_count ?? null });
    }
  }
  return out;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  noStore();
  if (req.cookies.get("leonix_admin")?.value !== "1") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const scopeRaw = req.nextUrl.searchParams.get("scope")?.trim().toLowerCase();
  const scope = scopeRaw === "live" ? ("live" as const) : undefined;
  const limit = normalizeAdminQueueLimit(req.nextUrl.searchParams.get("limit") ?? undefined, ADMIN_QUEUE_DEFAULT_LIMIT);
  // 2026-09 closeout 2 — normalized filters (status, owner, Leonix Ad ID, lane) join the search in ONE
  // predicate that runs inside the data layer, BEFORE the row limit.
  const statusRaw = req.nextUrl.searchParams.get("status")?.trim().toLowerCase() ?? "";
  // Exact-match filters: an unknown status / lane value matches nothing (never silently ignored).
  const statusFilter = statusRaw;
  const ownerFilter = req.nextUrl.searchParams.get("owner")?.trim() ?? "";
  const leonixAdIdFilter = req.nextUrl.searchParams.get("leonix_ad_id")?.trim() ?? "";
  const laneRaw = req.nextUrl.searchParams.get("lane")?.trim().toLowerCase() ?? "";
  const laneFilter = laneRaw;
  // 2026-09 closeout 2 — the search runs INSIDE the data layer, before the row limit: the fetch reads
  // windows until `limit` rows MATCH, so an older matching listing is not hidden behind newer non-matches.
  let rowFilter: ((r: EmpleosPublicListingRow) => boolean) | undefined;
  let profileSet: ReadonlySet<string> = new Set<string>();
  if (q) {
    const supabase = getAdminSupabase();
    const profileIds = await fetchProfileIdsMatchingAdminQueueSearch(supabase, q);
    profileSet = new Set(profileIds);
  }
  if (q || statusFilter || ownerFilter || leonixAdIdFilter || laneFilter) {
    rowFilter = (r) => {
      if (statusFilter && String(r.lifecycle_status).toLowerCase() !== statusFilter) return false;
      if (laneFilter && String(r.lane ?? "").toLowerCase() !== laneFilter) return false;
      if (ownerFilter && !adminRowMatchesOwnerFilter(r, ownerFilter)) return false;
      if (leonixAdIdFilter && !adminRowMatchesLeonixAdIdFilter(r, leonixAdIdFilter)) return false;
      if (!q) return true;
      const job = rowToJobRecord(r);
      return empleosRowMatchesAdminQueueSearch(
        {
          id: r.id,
          slug: r.slug,
          title: r.title,
          company_name: r.company_name,
          owner_user_id: r.owner_user_id,
          city: r.city,
          state: r.state,
          location_line: empleosJobRecordListLocationLine(job),
          leonix_ad_id: r.leonix_ad_id ?? null,
        },
        q,
        profileSet,
      );
    };
  }
  let rows = await fetchAllEmpleosListingsForAdmin({ limit, scope, rowFilter });
  if (scope === "live") {
    rows = rows.filter((r) => empleosRowIsPublicLive(r as unknown as Record<string, unknown>));
  }
  const ids = rows.map((r) => r.id);
  const health = await fetchEmpleosApplicationHealthByListingIds(ids);
  const extras = await fetchEmpleosLifecycleExtras(ids);
  // Commercial truth (READ-ONLY payment / entitlement / subscription records). Never a guess: unreadable => "unknown".
  const rowsById = Object.fromEntries(
    rows.map((r) => [r.id, { ...(r as unknown as Record<string, unknown>), published_at: extras.get(r.id)?.published_at ?? null }]),
  );
  const commercial: AdminListingCommercialTruthMap = ids.length > 0 ? await loadAdminListingCommercialTruth({ category: "empleos", listingIds: ids, listingRowsById: rowsById }) : {};
  const enriched = rows.map((r) => {
    const job = rowToJobRecord(r);
    const ex = extras.get(r.id);
    const ct = commercial[r.id];
    const paymentCleared = ct ? ct.state === "known" && ["paid", "succeeded", "cleared", "payment_cleared"].includes(String(ct.paymentStatus ?? "").trim().toLowerCase()) : false;
    const rowState = {
      lifecycle_status: r.lifecycle_status,
      lane: r.lane,
      published_at: ex?.published_at ?? null,
      moderation_reason: r.moderation_reason,
      republish_override: (r as { republish_override?: boolean | null }).republish_override ?? null,
    };
    return {
    id: r.id,
    slug: r.slug,
    leonix_ad_id: r.leonix_ad_id ?? null,
    title: r.title,
    company_name: r.company_name,
    lifecycle_status: r.lifecycle_status,
    lane: r.lane,
    published_at: ex?.published_at ?? null,
    republish_override: (r as { republish_override?: boolean | null }).republish_override ?? null,
    publication: classifyPublication("empleos_public_listings", { ...(r as unknown as Record<string, unknown>), published_at: ex?.published_at ?? null }),
    // Hint only (the server action re-decides): why Restore / Republish would be refused for this row.
    restore_blocked_reason: empleosStaffRestoreBlockedReason(rowState, paymentCleared),
    location_line: empleosJobRecordListLocationLine(job),
    owner_user_id: r.owner_user_id,
    moderation_reason: r.moderation_reason,
    leonix_verified: Boolean((r as { leonix_verified?: boolean }).leonix_verified),
    admin_promoted: Boolean((r as { admin_promoted?: boolean }).admin_promoted),
    apply_count: typeof (r as { apply_count?: number }).apply_count === "number" ? (r as { apply_count: number }).apply_count : 0,
    view_count: typeof (r as { view_count?: number }).view_count === "number" ? (r as { view_count: number }).view_count : 0,
    application_health: health.get(r.id) ?? {
      listing_id: r.id,
      total: 0,
      submitted: 0,
      viewed: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    },
  };
  });
  return NextResponse.json({ ok: true, rows: enriched, commercial });
}
