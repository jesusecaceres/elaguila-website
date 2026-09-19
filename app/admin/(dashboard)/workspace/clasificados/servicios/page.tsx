import Link from "next/link";
import { Suspense } from "react";
import {
  adminQueueRowAnchorId,
  adminQueueRowClass,
  parseAdminActionResultFromRecord,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminListingMonetizationSummary } from "../_components/AdminListingMonetizationSummary";
import {
  isServiciosDevPublishPersistenceEnabled,
  listServiciosDevPublishRows,
} from "@/app/clasificados/servicios/lib/serviciosDevPublishPersistence";
import {
  fetchServiciosUserLikedCountsByKeys,
  fetchServiciosUserSavedCountsByKeys,
  listServiciosPublicListingsAdminQueueFromDb,
} from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { listPendingServiciosReviews } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { setServiciosReviewModerationStatusAction } from "./actions";
import { serviciosRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { AdminCategorySummaryPanel } from "../_components/normalized/AdminCategorySummaryPanel";
import { AdminCategoryFilterBar } from "../_components/normalized/AdminCategoryFilterBar";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "../_lib/clasificadosAdminScopeUrls";
import { adminRowMatchesOwnerFilter, adminStatusOptionsForCategory } from "../_lib/adminNormalizedShell";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { fetchAdminCategorySummary, type AdminCategorySummary } from "@/app/admin/_lib/adminCategorySummary";
import {
  adminLaneListingTruth,
  adminScanWindowNote,
  adminUnavailableCategorySummary,
  planAdminQueueScan,
  readAdminQueueFilters,
  withOwnerAlias,
} from "@/app/admin/_lib/adminCategoryShellAdoption";
import { loadAdminLaneSuspendedReasons } from "@/app/admin/_lib/adminLaneSuspendedReason";
import type { PublicationTruth } from "@/app/admin/_lib/publicationSemantics";
import {
  serviciosLikeCountAliasKeys,
  serviciosNetLikeCountForPublicRow,
} from "@/app/clasificados/servicios/lib/serviciosPublicListingSort";
import type { ServiciosPublicAdminRow } from "./_lib/serviciosAdminOpsTypes";
import { ServiciosAdminOpsListingCard } from "./_components/ServiciosAdminOpsListingCard";
import { loadServiciosCommercialOps } from "@/app/admin/_lib/serviciosCommercialOps";
import { fetchServiciosAdminCanonicalAnalyticsByRows } from "./_lib/serviciosAdminCanonicalAnalytics";

export const dynamic = "force-dynamic";

export type { ServiciosPublicAdminRow };

type ServiciosLeadAdminRow = {
  id: string;
  listing_slug: string;
  sender_name: string;
  sender_email: string;
  message: string;
  request_kind: string;
  created_at: string;
};

const SERVICIOS_ADMIN_COLUMNS = [
  "id",
  "slug",
  "leonix_ad_id",
  "business_name",
  "city",
  "published_at",
  "updated_at",
  "profile_json",
  "leonix_verified",
  "listing_status",
  "internal_group",
  "owner_user_id",
  "moderation_notes",
  "promoted",
] as const;

async function fetchServiciosLeadsForAdmin(): Promise<ServiciosLeadAdminRow[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_leads")
      .select("id, listing_slug, sender_name, sender_email, message, request_kind, created_at")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error || !data) return [];
    return data as ServiciosLeadAdminRow[];
  } catch {
    return [];
  }
}

function devFileRowsAsAdmin(): ServiciosPublicAdminRow[] {
  if (!isServiciosDevPublishPersistenceEnabled()) return [];
  return listServiciosDevPublishRows().map((r) => ({
    id: `dev-file:${r.slug}`,
    slug: r.slug,
    business_name: r.business_name,
    city: r.city,
    published_at: r.published_at,
    updated_at: r.published_at,
    leonix_verified: r.leonix_verified,
    listing_status: "published_dev_file",
    internal_group: r.internal_group,
  }));
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

/** Ceiling of `listServiciosPublicListingsAdminQueueFromDb` (its own `Math.min(limit, 800)`). */
const SERVICIOS_ADMIN_SCAN_CAP = 800;

const SERVICIOS_EXTRA_FILTER_FIELDS = ["slug", "id", "owner_user_id"] as const;
const SERVICIOS_EXTRA_FIELD_CLASS =
  "rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs text-[#1E1810] min-h-[40px] font-mono";

function filterDevServiciosRows(rows: ServiciosPublicAdminRow[], q: string | undefined): ServiciosPublicAdminRow[] {
  const n = (q ?? "").trim().toLowerCase();
  if (!n) return rows;
  return rows.filter(
    (r) =>
      r.slug.toLowerCase().includes(n) ||
      r.business_name.toLowerCase().includes(n) ||
      r.id.toLowerCase().includes(n),
  );
}

function countByStatus(rows: ServiciosPublicAdminRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const key = (r.listing_status ?? "unknown").toLowerCase();
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export default async function AdminServiciosWorkspacePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = await getAdminLang();
  const msg = adminMessages(lang);
  const sp = props.searchParams ? await props.searchParams : {};
  const actionProof = parseAdminActionResultFromRecord(sp);
  const filters = readAdminQueueFilters(sp);
  const queueLimit = filters.limit;
  const scope = parseAdminScope(sp);
  const serviciosBase = "/admin/workspace/clasificados/servicios";
  const queueHref = appendPreservedSearchParams(serviciosBase, sp, null);
  const liveHref = appendPreservedSearchParams(serviciosBase, sp, "live");
  // Filters BEFORE the limit. status / Leonix Ad ID / slug / id / a full owner UUID / q are all applied
  // in SQL by the data function (it applies `.limit()` last). Only a PARTIAL owner fragment (not a
  // UUID) cannot be expressed in SQL — then the window is widened to the function's ceiling, narrowed
  // in memory, and the requested limit is applied last.
  const ownerNeedsMemory = Boolean(filters.owner && !filters.ownerIsUuid);
  const scan = planAdminQueueScan({ limit: queueLimit, memoryFiltered: ownerNeedsMemory, cap: SERVICIOS_ADMIN_SCAN_CAP });
  const queueFilters = {
    limit: scan.fetchLimit,
    ...(scope === "live" ? { scope: "live" as const } : {}),
    q: filters.q || undefined,
    slug: firstParam(sp.slug),
    id: firstParam(sp.id),
    leonix_ad_id: filters.leonixAdId || undefined,
    owner_user_id: filters.owner && filters.ownerIsUuid ? filters.owner : undefined,
    status: filters.status || undefined,
  };
  const queueRes = await listServiciosPublicListingsAdminQueueFromDb(queueFilters);
  const { unavailable, fullSchema, readError } = queueRes;
  const fetchedRowCount = queueRes.rows.length;
  const queueRowsNarrowed = ownerNeedsMemory
    ? queueRes.rows.filter((r) => adminRowMatchesOwnerFilter({ owner_user_id: r.owner_user_id }, filters.owner)).slice(0, queueLimit)
    : queueRes.rows;
  const windowNote = adminScanWindowNote(lang, { widened: scan.widened, fetched: fetchedRowCount, fetchLimit: scan.fetchLimit });
  const rows: ServiciosPublicAdminRow[] = queueRowsNarrowed.map((r) => ({
    id: r.id,
    slug: r.slug,
    leonix_ad_id: r.leonix_ad_id ?? null,
    business_name: r.business_name,
    city: r.city,
    published_at: r.published_at,
    updated_at: r.updated_at,
    leonix_verified: r.leonix_verified,
    listing_status: r.listing_status,
    internal_group: r.internal_group,
    owner_user_id: r.owner_user_id,
    moderation_notes: (r.moderation_notes ?? null) as string | null,
    profile_json: r.profile_json as ServiciosPublicAdminRow["profile_json"],
    promoted: Boolean((r as { promoted?: boolean }).promoted),
    republish_override: (r as { republish_override?: boolean | null }).republish_override ?? null,
  }));
  const rowsFiltered =
    scope === "live"
      ? rows.filter((r) => serviciosRowIsPublicLive(r as unknown as Record<string, unknown>))
      : rows;
  const statusCounts = countByStatus(rows);
  const publishedCount = statusCounts.published ?? 0;

  const allEngagementKeys = new Set<string>();
  for (const r of rows) {
    for (const k of serviciosLikeCountAliasKeys({ slug: r.slug, leonix_ad_id: r.leonix_ad_id ?? null, id: r.id })) {
      allEngagementKeys.add(k);
    }
  }
  const [serviciosAdminLikeMap, serviciosAdminSaveMap] = unavailable
    ? [new Map<string, number>(), new Map<string, number>()]
    : await Promise.all([
        fetchServiciosUserLikedCountsByKeys([...allEngagementKeys]),
        fetchServiciosUserSavedCountsByKeys([...allEngagementKeys]),
      ]);
  const serviciosAdminEngagementByRowId = new Map<string, { likes: number; saves: number }>();
  for (const r of rows) {
    const rowLike = { slug: r.slug, leonix_ad_id: r.leonix_ad_id ?? null, id: r.id };
    serviciosAdminEngagementByRowId.set(r.id, {
      likes: serviciosNetLikeCountForPublicRow(rowLike, serviciosAdminLikeMap),
      saves: serviciosNetLikeCountForPublicRow(rowLike, serviciosAdminSaveMap),
    });
  }
  const serviciosAdminCanonicalBySourceId = unavailable
    ? new Map()
    : await fetchServiciosAdminCanonicalAnalyticsByRows(
        rows.map((r) => ({ id: r.id, slug: r.slug, leonix_ad_id: r.leonix_ad_id ?? null })),
      );
  // Gate SERVICIOS-3 (D-4) — read-only commercial truth, bounded to the rows this page is already
  // showing. Never sweeps the table, never writes, and degrades to explicit truth states rather
  // than to zeros when a source is unreadable.
  const commercialOps = unavailable
    ? new Map()
    : await loadServiciosCommercialOps(rows.map((r) => r.id));
  const devAdminRows = filterDevServiciosRows(devFileRowsAsAdmin(), queueFilters.q);
  const pendingReviews = await listPendingServiciosReviews(80);
  const recentLeads = await fetchServiciosLeadsForAdmin();
  const surface = clasificadosQueueSurfaceForSlug("servicios");

  // Shared operating summary (canonical counts owned by adminCategorySummary — never recomputed
  // from the truncated page rows). A count that cannot be read renders "—", never 0.
  let summary: AdminCategorySummary;
  try {
    summary = await fetchAdminCategorySummary("servicios");
  } catch (e) {
    summary = adminUnavailableCategorySummary("servicios", surface.sourceTable, e instanceof Error ? e.message : "summary query failed");
  }

  // Shared LISTING TRUTH per row (publicationSemantics). The list select does not carry
  // `suspended_reason`, so it is read (read-only, bounded) for the SUSPENDED rows on this page only.
  const suspendedReasons = unavailable
    ? { loaded: false, byId: {} as Record<string, string | null> }
    : await loadAdminLaneSuspendedReasons(
        "servicios_public_listings",
        rows.filter((r) => (r.listing_status ?? "").toLowerCase() === "suspended").map((r) => r.id),
      );
  const listingTruthByRowId = new Map<string, PublicationTruth>();
  for (const r of rows) {
    const rowRec: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>) };
    if (suspendedReasons.loaded && Object.prototype.hasOwnProperty.call(suspendedReasons.byId, r.id)) {
      rowRec.suspended_reason = suspendedReasons.byId[r.id];
    }
    listingTruthByRowId.set(r.id, adminLaneListingTruth("servicios_public_listings", rowRec));
  }

  return (
    <div className="min-w-0 max-w-5xl space-y-6 overflow-x-hidden" data-testid="servicios-admin-ops-page">
      {/* Shared category header (scope-aware title, Queue/Live switch, Public/Publish, technical source under Advanced). */}
      <div data-testid="servicios-admin-command-header">
        <ClasificadosQueueHeader
          lang={lang}
          categoryName="Servicios"
          scope={scope === "live" ? "live" : "queue"}
          sourceTable={surface.sourceTable}
          subtitle={scope === "live" ? msg("listingsCategoryOps.subLive") : msg("listingsCategoryOps.subQueue")}
          publicHref={surface.publicHref}
          publishHref={surface.publishHref}
          queueHref={queueHref}
          liveHref={liveHref}
        />
      </div>

      <AdminCategorySummaryPanel summary={summary} lang={lang} technicalDetails={[["Table", surface.sourceTable]]} />

      <AdminPagePurposeCard
        title="Servicios admin ops"
        purpose="Operate Servicios listings, leads, reviews, analytics signals, and owner-facing listing health from one queue."
        dataSource="public.servicios_public_listings, servicios_public_leads, servicios_listing_reviews, saved/liked engagement, and owner profile JSON."
        status={unavailable || !fullSchema ? "needs live proof" : "partial"}
        safeActions={["View public", "Manage listing", "Suspend", "Archive", "Republish", "Feature", "Verify Leonix"]}
        nextGate="Confirm every button and count on this page against live Supabase data before relying on it for daily decisions."
        warningNote="Promote/Verify actions require the live schema drift migration. Analytics remain partial when engagement tables are unavailable."
      />

      <details
        className={`${adminCardBase} border-[#E8DFD0]/80 bg-[#FAF7F2]/90 p-4 sm:p-5`}
        data-testid="servicios-admin-supabase-truth"
      >
        <summary className="cursor-pointer select-none text-sm font-bold text-[#1E1810]">Supabase truth (advanced)</summary>
        <dl className="mt-3 grid gap-2 text-sm text-[#5C5346] sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-bold uppercase text-[#7A7164]">Source table</dt>
            <dd className="font-mono text-xs">servicios_public_listings</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase text-[#7A7164]">Records loaded</dt>
            <dd className="font-semibold text-[#1E1810]">{unavailable ? "—" : rowsFiltered.length}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase text-[#7A7164]">Published (loaded set)</dt>
            <dd>{unavailable ? "—" : publishedCount}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase text-[#7A7164]">Schema status</dt>
            <dd>
              {unavailable
                ? readError ?? "Servicios data unavailable"
                : fullSchema
                  ? "Migrations found in repo; needs live Supabase proof in production"
                  : "Reduced mode — apply Servicios migrations"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[#7A7164]">
          Columns used: {SERVICIOS_ADMIN_COLUMNS.join(", ")}. Engagement uses user_liked_listings / saved_listings when
          readable.
        </p>
      </details>

      {!unavailable ? (
        <div data-testid="servicios-admin-filter-panel">
          <AdminCategoryFilterBar
            lang={lang}
            action={serviciosBase}
            searchParams={withOwnerAlias(sp)}
            statusOptions={adminStatusOptionsForCategory("servicios")}
            clearHref={appendPreservedSearchParams(serviciosBase, {}, scope === "live" ? "live" : null)}
            extraFieldNames={SERVICIOS_EXTRA_FILTER_FIELDS}
            searchPlaceholder="Leonix Ad ID, UUID, slug, /clasificados/servicios/… URL, business, owner profile"
          >
            {/* Servicios exact-match fields kept from the previous filter panel (slug / id). */}
            <label className="flex min-w-[9rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">slug</span>
              <input name="slug" defaultValue={firstParam(sp.slug) ?? ""} className={SERVICIOS_EXTRA_FIELD_CLASS} autoComplete="off" />
            </label>
            <label className="flex min-w-[9rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">id (UUID)</span>
              <input name="id" defaultValue={firstParam(sp.id) ?? ""} className={SERVICIOS_EXTRA_FIELD_CLASS} autoComplete="off" />
            </label>
          </AdminCategoryFilterBar>
          {windowNote ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950" role="status" data-testid="servicios-admin-scan-window-note">
              {windowNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {!unavailable ? (
        <section className="min-w-0 space-y-4" data-testid="servicios-admin-listing-cards">
          <Suspense fallback={null}>
            <ClasificadosQueueActionChrome />
          </Suspense>
          {rowsFiltered.length === 0 ? (
            <div className={`${adminCardBase} p-5 text-sm text-[#5C5346]`} role="status" data-testid="servicios-admin-empty-state">
              <p className="font-bold text-[#1E1810]">No published listings found for this category.</p>
              <p className="mt-2 leading-relaxed">
                Query <span className="font-mono">servicios_public_listings</span> returned zero rows with current filters
                (or the table is empty). The live source is wired; this is not a broken page.
              </p>
            </div>
          ) : (
            rowsFiltered.map((r) => {
              const engagement = serviciosAdminEngagementByRowId.get(r.id) ?? { likes: 0, saves: 0 };
              const canonical = serviciosAdminCanonicalBySourceId.get(r.id);
              const highlighted = actionProof?.target === r.id;
              return (
                <ServiciosAdminOpsListingCard
                  key={r.id}
                  row={r}
                  likes={engagement.likes}
                  saves={engagement.saves}
                  canonicalViews={canonical?.views ?? 0}
                  canonicalCtaClicks={
                    (canonical?.phone_clicks ?? 0) +
                    (canonical?.whatsapp_clicks ?? 0) +
                    (canonical?.email_clicks ?? 0) +
                    (canonical?.website_clicks ?? 0) +
                    (canonical?.directions_clicks ?? 0) +
                    (canonical?.message_clicks ?? 0)
                  }
                  canonicalLeads={canonical?.leads ?? 0}
                  commercial={commercialOps.get(r.id)}
                  listingTruth={listingTruthByRowId.get(r.id) ?? null}
                  lang={lang}
                  highlighted={highlighted}
                />
              );
            })
          )}

          {rowsFiltered.length > 0 ? (
            <details className={`${adminCardBase} p-4`} data-testid="servicios-advanced-table">
              <summary className="cursor-pointer text-sm font-semibold text-[#3D3629]">Advanced table view (power users)</summary>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                    <tr>
                      <th className="p-2">Business</th>
                      <th className="p-2">City</th>
                      <th className="p-2">Slug</th>
                      <th className="p-2">Leonix Ad ID</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Owner</th>
                      <th className="p-2">Updated</th>
                      <th className="p-2">Monetization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsFiltered.map((r) => (
                      <tr key={r.id} id={adminQueueRowAnchorId(r.id)} className={`border-t border-[#E8DFD0]/70 ${adminQueueRowClass(actionProof?.target === r.id)}`}>
                        <td className="p-2 font-semibold">{r.business_name}</td>
                        <td className="p-2 text-xs">{r.city}</td>
                        <td className="p-2 font-mono text-xs">{r.slug}</td>
                        <td className="p-2 font-mono text-[10px]">{r.leonix_ad_id ?? "—"}</td>
                        <td className="p-2 text-xs">{r.listing_status}</td>
                        <td className="p-2 font-mono text-[10px]">{r.owner_user_id?.slice(0, 8) ?? "—"}</td>
                        <td className="p-2 text-xs">{r.updated_at ? new Date(r.updated_at).toLocaleString() : "—"}</td>
                        <td className="p-2 align-top">
                          <AdminListingMonetizationSummary
                            category="servicios"
                            source="servicios_public_listings"
                            listing={r as unknown as Record<string, unknown>}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}
        </section>
      ) : (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`} role="alert">
          <p className="font-bold text-[#1E1810]">Servicios data unavailable</p>
          <p className="mt-2">
            Could not read <code className="rounded bg-white/80 px-1">servicios_public_listings</code>.{" "}
            {readError ?? "Check migrations and service-role credentials."}
          </p>
        </div>
      )}

      {devAdminRows.length > 0 ? (
        <div className={`${adminCardBase} border-amber-200/80 bg-amber-50/90 p-4`}>
          <p className="text-xs font-semibold text-amber-950">
            Test publishes (local file) — development only
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {devAdminRows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {r.business_name} · {r.slug}
                </span>
                <Link href={`/clasificados/servicios/${r.slug}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#6B5B2E] underline">
                  View public ↗
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!unavailable && pendingReviews.length > 0 ? (
        <div className={`${adminCardBase} p-4`}>
          <p className="text-sm font-bold text-[#1E1810]">Pending reviews ({pendingReviews.length})</p>
          <ul className="mt-3 space-y-3">
            {pendingReviews.map((rev) => (
              <li key={rev.id} className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7] p-3 text-sm">
                <p className="font-mono text-xs">{rev.listing_slug}</p>
                <p className="mt-1 text-xs text-[#5C5346]">
                  {rev.author_name} · {rev.rating}★ — <span className="line-clamp-2">{rev.body}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={setServiciosReviewModerationStatusAction}>
                    <input type="hidden" name="review_id" value={rev.id} />
                    <input type="hidden" name="listing_slug" value={rev.listing_slug} />
                    <input type="hidden" name="review_status" value="approved" />
                    <button type="submit" className="rounded-lg border border-[#2A4536] bg-[#2A4536] px-3 py-1.5 text-xs font-semibold text-white">
                      Approve
                    </button>
                  </form>
                  <form action={setServiciosReviewModerationStatusAction}>
                    <input type="hidden" name="review_id" value={rev.id} />
                    <input type="hidden" name="listing_slug" value={rev.listing_slug} />
                    <input type="hidden" name="review_status" value="rejected" />
                    <button type="submit" className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900">
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!unavailable && recentLeads.length > 0 ? (
        <div className={`${adminCardBase} p-4`}>
          <p className="text-sm font-bold text-[#1E1810]">Recent inquiries (servicios_public_leads)</p>
          <ul className="mt-3 space-y-3">
            {recentLeads.map((l) => (
              <li key={l.id} className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7] p-3 text-sm">
                <p className="font-mono text-xs">{l.listing_slug}</p>
                <p className="mt-1 text-xs">
                  {l.sender_name} · {l.sender_email} · {l.request_kind}
                </p>
                <p className="mt-1 line-clamp-3 text-xs text-[#5C5346]">{l.message}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${adminCardBase} border-[#E8DFD0] bg-[#FFFCF7]/90 p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Tier sandbox (localStorage)</p>
        <p className="mt-1 text-xs">Legacy design tool — does not write to Supabase.</p>
        <Link href="/admin/workspace/clasificados/servicios/sandbox" className={`${adminCtaChipSecondary} mt-3 inline-flex justify-center text-xs`}>
          Open tier sandbox →
        </Link>
      </div>
    </div>
  );
}
