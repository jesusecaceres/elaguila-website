import Link from "next/link";
import { Suspense } from "react";
import { listRestaurantesPublicListingsAdminFromDb } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { restauranteRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import {
  adminQueueRowAnchorId,
  adminQueueRowClass,
  parseAdminActionResultFromRecord,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages, adminTr } from "@/app/admin/_lib/adminStrings";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import { AdminListingMonetizationSummary } from "../_components/AdminListingMonetizationSummary";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { AdminCategorySummaryPanel } from "../_components/normalized/AdminCategorySummaryPanel";
import { AdminCategoryFilterBar } from "../_components/normalized/AdminCategoryFilterBar";
import {
  AdminCommercialTruthSection,
  AdminListingTruthSection,
} from "../_components/normalized/AdminListingCardSections";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "../_lib/clasificadosAdminScopeUrls";
import { adminRowMatchesOwnerFilter, adminStatusOptionsForCategory } from "../_lib/adminNormalizedShell";
import { AdminPagePurposeCard } from "../../../../_components/AdminPagePurposeCard";
import { fetchAdminCategorySummary, type AdminCategorySummary } from "@/app/admin/_lib/adminCategorySummary";
import {
  loadAdminListingCommercialTruth,
  type AdminListingCommercialTruthMap,
} from "@/app/admin/_lib/adminListingCommercialTruth";
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

export const dynamic = "force-dynamic";

function fmt(ts: string | null | undefined) {
  if (!ts) return "—";
  try {
    return new Date(ts).toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return ts;
  }
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

/** Ceiling of `listRestaurantesPublicListingsAdminFromDb` (its own `Math.min(limit, 800)`). */
const RESTAURANTES_ADMIN_SCAN_CAP = 800;

const RESTAURANTES_EXTRA_FILTER_FIELDS = ["slug", "id", "owner_user_id"] as const;
const RESTAURANTES_EXTRA_FIELD_CLASS =
  "rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs text-[#1E1810] min-h-[40px] font-mono";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRestaurantesPublicListingsPage(props: PageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const configured = isSupabaseAdminConfigured();
  const sp = props.searchParams ? await props.searchParams : {};
  const scope = parseAdminScope(sp);
  const basePath = "/admin/workspace/clasificados/restaurantes";
  const queueHref = appendPreservedSearchParams(basePath, sp, null);
  const liveHref = appendPreservedSearchParams(basePath, sp, "live");
  const filters = readAdminQueueFilters(sp);
  const queueLimit = filters.limit;
  const hasFilters = !!(
    filters.q ||
    filters.status ||
    filters.owner ||
    filters.leonixAdId ||
    firstParam(sp.slug) ||
    firstParam(sp.id)
  );
  const actionProof = parseAdminActionResultFromRecord(sp);
  // Filters BEFORE the limit. status / Leonix Ad ID / slug / id / a full owner UUID / q are applied in
  // SQL by the data function (which applies `.limit()` last). Only a PARTIAL owner fragment (not a
  // UUID) cannot be expressed in SQL — then the window is widened to the function's ceiling, narrowed
  // in memory, and the requested limit is applied last.
  const ownerNeedsMemory = Boolean(filters.owner && !filters.ownerIsUuid);
  const scan = planAdminQueueScan({ limit: queueLimit, memoryFiltered: ownerNeedsMemory, cap: RESTAURANTES_ADMIN_SCAN_CAP });
  const rowsRaw = configured
    ? await listRestaurantesPublicListingsAdminFromDb({
        limit: scan.fetchLimit,
        ...(scope === "live" ? { scope: "live" as const } : {}),
        q: filters.q || undefined,
        slug: firstParam(sp.slug),
        id: firstParam(sp.id),
        leonix_ad_id: filters.leonixAdId || undefined,
        owner_user_id: filters.owner && filters.ownerIsUuid ? filters.owner : undefined,
        status: filters.status || undefined,
      })
    : [];
  const windowNote = adminScanWindowNote(lang, { widened: scan.widened, fetched: rowsRaw.length, fetchLimit: scan.fetchLimit });
  const rowsScoped =
    scope === "live"
      ? rowsRaw.filter((r) => restauranteRowIsPublicLive(r as unknown as Record<string, unknown>))
      : rowsRaw;
  const rowsOwnerNarrowed = ownerNeedsMemory
    ? rowsScoped.filter((r) => adminRowMatchesOwnerFilter({ owner_user_id: r.owner_user_id }, filters.owner))
    : rowsScoped;
  // The requested limit is applied LAST (the `q` search path of the data function caps at 100 on its own).
  const rows = rowsOwnerNarrowed.slice(0, queueLimit);

  const surface = clasificadosQueueSurfaceForSlug("restaurantes");

  // Shared operating summary (canonical counts owned by adminCategorySummary — never recomputed
  // from the truncated page rows). A count that cannot be read renders "—", never 0.
  let summary: AdminCategorySummary = adminUnavailableCategorySummary("restaurantes", surface.sourceTable, "Supabase admin is not configured.");
  if (configured) {
    try {
      summary = await fetchAdminCategorySummary("restaurantes");
    } catch (e) {
      summary = adminUnavailableCategorySummary("restaurantes", surface.sourceTable, e instanceof Error ? e.message : "summary query failed");
    }
  }

  // LISTING TRUTH (shared publicationSemantics) + COMMERCIAL TRUTH (READ-ONLY: payment / entitlement /
  // subscription records) for THESE rows only. The list select does not carry `suspended_reason`, so
  // it is read (read-only, bounded) for the SUSPENDED rows on this page only.
  const suspendedReasons =
    configured && rows.length > 0
      ? await loadAdminLaneSuspendedReasons(
          "restaurantes_public_listings",
          rows.filter((r) => String(r.status ?? "").toLowerCase() === "suspended").map((r) => r.id),
        )
      : { loaded: false, byId: {} as Record<string, string | null> };
  const listingRecById: Record<string, Record<string, unknown>> = {};
  const listingTruthByRowId = new Map<string, PublicationTruth>();
  for (const r of rows) {
    const rowRec: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>) };
    if (suspendedReasons.loaded && Object.prototype.hasOwnProperty.call(suspendedReasons.byId, r.id)) {
      rowRec.suspended_reason = suspendedReasons.byId[r.id];
    }
    listingRecById[r.id] = rowRec;
    listingTruthByRowId.set(r.id, adminLaneListingTruth("restaurantes_public_listings", rowRec));
  }
  const commercialTruthByListingId: AdminListingCommercialTruthMap =
    configured && rows.length > 0
      ? await loadAdminListingCommercialTruth({
          category: "restaurantes",
          listingIds: rows.map((r) => r.id),
          listingRowsById: listingRecById,
        })
      : {};

  return (
    <div className="max-w-[1200px] space-y-6">
      <ClasificadosQueueHeader
        lang={lang}
        categoryName="Restaurantes"
        scope={scope === "live" ? "live" : "queue"}
        sourceTable={surface.sourceTable}
        subtitle={scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue")}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        queueHref={queueHref}
        liveHref={liveHref}
      />

      <AdminCategorySummaryPanel summary={summary} lang={lang} technicalDetails={[["Table", surface.sourceTable]]} />

      <AdminPagePurposeCard
        title="Restaurantes admin ops"
        purpose="Operate paid Restaurante listings, public visibility, trust flags, package signals, and owner lookup."
        dataSource="public.restaurantes_public_listings plus package entitlement and owner profile context."
        status="partial"
        safeActions={["View public", "View in results", "Suspend", "Archive", "Republish", "Feature", "Verify Leonix"]}
        nextGate="Confirm every button and count on this page against live Supabase data before relying on it for daily decisions."
        warningNote="Paid-only category behavior is real, but package/payment alignment and action QA still need proof."
      />

      {configured ? (
        <div data-testid="restaurantes-admin-filter-panel">
          <AdminCategoryFilterBar
            lang={lang}
            action={basePath}
            searchParams={withOwnerAlias(sp)}
            statusOptions={adminStatusOptionsForCategory("restaurantes")}
            clearHref={appendPreservedSearchParams(basePath, {}, scope === "live" ? "live" : null)}
            extraFieldNames={RESTAURANTES_EXTRA_FILTER_FIELDS}
            searchPlaceholder="REST-2026-000002, tacos-el-chuy, UUID, /clasificados/restaurantes/… URL, negocio, perfil"
          >
            {/* Restaurantes exact-match fields kept from the previous filter form (slug / id). */}
            <label className="flex min-w-[9rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">slug</span>
              <input name="slug" defaultValue={firstParam(sp.slug) ?? ""} className={RESTAURANTES_EXTRA_FIELD_CLASS} autoComplete="off" />
            </label>
            <label className="flex min-w-[9rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">id (UUID)</span>
              <input name="id" defaultValue={firstParam(sp.id) ?? ""} className={RESTAURANTES_EXTRA_FIELD_CLASS} autoComplete="off" />
            </label>
          </AdminCategoryFilterBar>
          {windowNote ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950" role="status" data-testid="restaurantes-admin-scan-window-note">
              {windowNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {!configured ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          Supabase admin is not configured in this environment (<code className="rounded bg-[#FBF7EF] px-1">SUPABASE_SERVICE_ROLE_KEY</code>
          ). No rows to show.
        </p>
      ) : rows.length === 0 ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          {hasFilters ? "No results for these filters." : "Table exists but has no rows yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] shadow-sm">
          <Suspense fallback={null}>
            <ClasificadosQueueActionChrome />
          </Suspense>
          <table className="min-w-full border-collapse text-left text-xs text-[#2C2416]">
            <thead className="bg-[#F3EBDD] text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Leonix Ad ID</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Business / slug</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{adminTr(lang, "catShell.section.listing")}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{adminTr(lang, "catShell.section.commercial")}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Owner</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Plan</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">City · cuisine / type</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Published / updated</th>
                <th
                  className="border-b border-[#E8DFD0] px-3 py-2"
                  title="Public + results. Status moderation in Actions column (same row; no staff content editor)."
                >
                  Links
                </th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Actions</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Monetization</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cuisineBits = [r.primary_cuisine, r.secondary_cuisine].filter(Boolean).join(" · ");
                const cuisineSummary = [cuisineBits || "—", r.business_type || ""].filter(Boolean).join(" · ");
                const resultsHref = `/clasificados/restaurantes/resultados?lang=es&q=${encodeURIComponent(r.business_name)}`;
                const highlighted = actionProof?.target === r.id;
                return (
                  <tr key={r.id} id={adminQueueRowAnchorId(r.id)} className={adminQueueRowClass(highlighted)}>
                    <td className="max-w-[140px] whitespace-nowrap px-3 py-2 font-mono text-[10px] font-bold text-[#5C4E2E]">
                      {r.leonix_ad_id ?? "—"}
                    </td>
                    <td className="max-w-[200px] px-3 py-2">
                      <p className="font-semibold">{r.business_name}</p>
                      <p className="mt-0.5 break-all font-mono text-[10px] text-[#7A7164]">{r.slug}</p>
                    </td>
                    <td className="min-w-[13rem] max-w-[16rem] px-3 py-2 align-top" data-testid="restaurantes-row-listing-truth">
                      <AdminListingTruthSection lang={lang} status={r.status} truth={listingTruthByRowId.get(r.id)} compact />
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase">
                        <span className="rounded-md border border-[#C9B46A]/50 bg-[#FFFCF7] px-1.5 py-0.5 text-[#5C4E2E]">
                          {r.promoted ? "yes" : "no"} featured
                        </span>
                        <span className="rounded-md border border-[#2A4536]/30 bg-[#F4FAF2] px-1.5 py-0.5 text-[#2A4536]">
                          {r.leonix_verified ? "yes" : "no"} verified
                        </span>
                      </div>
                    </td>
                    <td className="min-w-[12rem] max-w-[16rem] px-3 py-2 align-top" data-testid="restaurantes-row-commercial-truth">
                      <AdminCommercialTruthSection lang={lang} truth={commercialTruthByListingId[r.id]} compact />
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px]" title={r.owner_user_id ?? ""}>
                      {r.owner_user_id ?? "—"}
                    </td>
                    <td className="px-3 py-2">{r.package_tier ?? "—"}</td>
                    <td className="max-w-[220px] px-3 py-2 text-[11px] text-[#5C5346]">
                      <p className="font-semibold text-[#2C2416]">{r.city_canonical}</p>
                      <p>{cuisineSummary}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">
                      <p>{fmt(r.published_at)}</p>
                      <p className="text-[#7A7164]">{fmt(r.updated_at)}</p>
                    </td>
                    <td className="space-y-1 px-3 py-2">
                      <Link
                        href={`/clasificados/restaurantes/${encodeURIComponent(r.slug)}?lang=es`}
                        className="block font-semibold text-[#6B5B2E] underline"
                        target="_blank"
                        rel="noreferrer"
                        title="Public view. Business edit: advertiser flow, not Leonix staff."
                      >
                        View public
                      </Link>
                      <Link href={resultsHref} className="block text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
                        Results
                      </Link>
                    </td>
                    <td className="min-w-[200px] px-3 py-2 align-top">
                      <ClassifiedAdminRowActions
                        variant="restaurante"
                        rowId={r.id}
                        leonixAdId={r.leonix_ad_id}
                        displayLabel={r.business_name}
                        publicLive={r.status === "published"}
                        promoted={r.promoted}
                        verified={r.leonix_verified}
                        canArchive={r.status !== "archived"}
                        staffEditBoardHref={`/admin/workspace/clasificados/restaurantes?slug=${encodeURIComponent(r.slug)}`}
                        republishCategory="restaurantes"
                        republishRow={{
                          status: r.status,
                          republish_override: r.republish_override,
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <AdminListingMonetizationSummary
                        category="restaurantes"
                        source="restaurantes_public_listings"
                        listing={r as unknown as Record<string, unknown>}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
