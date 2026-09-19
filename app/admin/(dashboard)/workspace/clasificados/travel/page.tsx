import Link from "next/link";
import { Suspense } from "react";

import {
  adminQueueRowAnchorId,
  adminQueueRowClass,
  parseAdminActionResultFromRecord,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import { AdminListingMonetizationSummary } from "../_components/AdminListingMonetizationSummary";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { AdminCategorySummaryPanel } from "../_components/normalized/AdminCategorySummaryPanel";
import { AdminCategoryFilterBar } from "../_components/normalized/AdminCategoryFilterBar";
import { AdminListingTruthSection } from "../_components/normalized/AdminListingCardSections";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import { appendPreservedSearchParams, parseAdminScope } from "../_lib/clasificadosAdminScopeUrls";
import {
  adminRowMatchesLeonixAdIdFilter,
  adminRowMatchesOwnerFilter,
  adminStatusOptionsForCategory,
} from "../_lib/adminNormalizedShell";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { fetchViajesStagedAdminQueue } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import type { ViajesStagedListingRow } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages, adminTr } from "@/app/admin/_lib/adminStrings";
import { fetchAdminCategorySummary, type AdminCategorySummary } from "@/app/admin/_lib/adminCategorySummary";
import {
  loadAdminListingCommercialTruth,
  type AdminListingCommercialTruthMap,
} from "@/app/admin/_lib/adminListingCommercialTruth";
import {
  adminScanWindowNote,
  adminUnavailableCategorySummary,
  planAdminQueueScan,
  readAdminQueueFilters,
} from "@/app/admin/_lib/adminCategoryShellAdoption";
import { classifyPublication } from "@/app/admin/_lib/publicationSemantics";
import { ViajesCommercialTruthCell } from "./_components/ViajesCommercialTruthCell";

export const dynamic = "force-dynamic";

/** Ceiling of `fetchViajesStagedAdminQueue` (its own `Math.min(limit, 500)`). */
const VIAJES_ADMIN_SCAN_CAP = 500;

function fmt(ts: string | null | undefined) {
  if (!ts) return "—";
  try {
    return new Date(ts).toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return ts;
  }
}

export default async function AdminTravelViajesQueuePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const sp = props.searchParams ? await props.searchParams : {};
  const actionProof = parseAdminActionResultFromRecord(sp);
  const filters = readAdminQueueFilters(sp);
  const queueLimit = filters.limit;
  const scope = parseAdminScope(sp);
  const basePath = "/admin/workspace/clasificados/travel";
  const queueHref = appendPreservedSearchParams(basePath, sp, null);
  const liveHref = appendPreservedSearchParams(basePath, sp, "live");

  const configured = isSupabaseAdminConfigured();

  // FILTERS BEFORE THE LIMIT. The search (`q`) is pushed INTO `fetchViajesStagedAdminQueue` (its
  // windowed scan applies the row cap AFTER matching). A Leonix Ad ID typed on its own is searched
  // through that same `q` path and narrowed exactly below. Status / owner (and q + Leonix Ad ID
  // together) cannot be expressed by the data function, so they widen the window to its ceiling,
  // narrow in memory, and the requested limit is applied LAST.
  const sqlSearch = filters.q || filters.leonixAdId;
  const memoryFiltered = Boolean(filters.status || filters.owner || (filters.q && filters.leonixAdId));
  const scan = planAdminQueueScan({ limit: queueLimit, memoryFiltered, cap: VIAJES_ADMIN_SCAN_CAP });
  const fetched: ViajesStagedListingRow[] = configured
    ? await fetchViajesStagedAdminQueue({
        limit: scan.fetchLimit,
        ...(scope === "live" ? { scope: "live" as const } : {}),
        ...(sqlSearch ? { q: sqlSearch } : {}),
      })
    : [];
  const windowNote = adminScanWindowNote(lang, { widened: scan.widened, fetched: fetched.length, fetchLimit: scan.fetchLimit });
  const displayRows = fetched
    .filter((r) => !filters.status || String(r.lifecycle_status ?? "").toLowerCase() === filters.status)
    .filter((r) => !filters.owner || adminRowMatchesOwnerFilter(r, filters.owner))
    .filter((r) => !filters.leonixAdId || adminRowMatchesLeonixAdIdFilter(r, filters.leonixAdId))
    .slice(0, queueLimit);
  const qRaw = filters.q;
  const hasFilters = Boolean(filters.q || filters.status || filters.owner || filters.leonixAdId);

  const surface = clasificadosQueueSurfaceForSlug("travel");

  // Shared operating summary (canonical counts owned by adminCategorySummary — never recomputed
  // from the truncated page rows). A count that cannot be read renders "—", never 0.
  let summary: AdminCategorySummary = adminUnavailableCategorySummary("travel", surface.sourceTable, "Supabase admin is not configured.");
  if (configured) {
    try {
      summary = await fetchAdminCategorySummary("travel");
    } catch (e) {
      summary = adminUnavailableCategorySummary("travel", surface.sourceTable, e instanceof Error ? e.message : "summary query failed");
    }
  }

  // COMMERCIAL TRUTH (READ-ONLY). Viajes has no payment product: when the loader finds no payment /
  // entitlement / subscription record the cell says "No payment product" — never an unpaid state.
  const commercialTruthByListingId: AdminListingCommercialTruthMap =
    configured && displayRows.length > 0
      ? await loadAdminListingCommercialTruth({
          category: "travel",
          listingIds: displayRows.map((r) => r.id),
          listingRowsById: Object.fromEntries(displayRows.map((r) => [r.id, r as unknown as Record<string, unknown>])),
        })
      : {};

  return (
    <div className="max-w-[1200px] space-y-6">
      <ClasificadosQueueHeader
        lang={lang}
        categoryName="Viajes"
        scope={scope === "live" ? "live" : "queue"}
        sourceTable={surface.sourceTable}
        subtitle={scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue")}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        queueHref={queueHref}
        liveHref={liveHref}
      />

      <AdminCategorySummaryPanel summary={summary} lang={lang} technicalDetails={[["Table", surface.sourceTable]]} />

      {configured ? (
        <div data-testid="travel-admin-filter-panel">
          <AdminCategoryFilterBar
            lang={lang}
            action={basePath}
            searchParams={sp}
            statusOptions={adminStatusOptionsForCategory("travel")}
            clearHref={appendPreservedSearchParams(basePath, {}, scope === "live" ? "live" : null)}
            searchPlaceholder="Title, Leonix Ad ID, slug or id…"
          />
          {windowNote ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950" role="status" data-testid="travel-admin-scan-window-note">
              {windowNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {!configured ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>Supabase admin not configured.</p>
      ) : displayRows.length === 0 ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          {hasFilters ? `No results for these filters${qRaw ? ` ("${qRaw}")` : ""}.` : "No rows in viajes_staged_listings."}
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
                <th className="border-b border-[#E8DFD0] px-3 py-2">Title / slug</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{adminTr(lang, "catShell.section.listing")}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{adminTr(lang, "catShell.section.commercial")}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Owner</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Published</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Links</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Actions</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Monetization</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => {
                const lx = r.leonix_ad_id ?? null;
                const promoted = Boolean(r.admin_promoted);
                const verified = Boolean(r.leonix_verified);
                const lifecycle = r.lifecycle_status;
                const isPublic = r.is_public;
                const publicLive = lifecycle === "approved" && isPublic;
                const highlighted = actionProof?.target === r.id;
                return (
                  <tr key={r.id} id={adminQueueRowAnchorId(r.id)} className={adminQueueRowClass(highlighted)}>
                    <td className="px-3 py-2 font-mono text-[10px]">{lx ?? "—"}</td>
                    <td className="max-w-[200px] px-3 py-2">
                      <p className="font-semibold">{r.title ?? "—"}</p>
                      <p className="mt-0.5 break-all font-mono text-[10px] text-[#7A7164]">{r.slug}</p>
                    </td>
                    <td className="min-w-[13rem] max-w-[16rem] px-3 py-2 align-top" data-testid="travel-row-listing-truth">
                      <AdminListingTruthSection
                        lang={lang}
                        status={lifecycle}
                        truth={classifyPublication("viajes_staged_listings", r as unknown as Record<string, unknown>)}
                        compact
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase">
                        <span className="rounded-md border border-[#C9B46A]/50 bg-[#FFFCF7] px-1.5 py-0.5 text-[#5C4E2E]">
                          {promoted ? "yes" : "no"} featured
                        </span>
                        <span className="rounded-md border border-[#2A4536]/30 bg-[#F4FAF2] px-1.5 py-0.5 text-[#2A4536]">
                          {verified ? "yes" : "no"} verified
                        </span>
                      </div>
                    </td>
                    <td className="min-w-[12rem] max-w-[16rem] px-3 py-2 align-top" data-testid="travel-row-commercial-truth">
                      <ViajesCommercialTruthCell lang={lang} truth={commercialTruthByListingId[r.id]} />
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px]" title={r.owner_user_id ?? ""}>
                      {r.owner_user_id ? `${r.owner_user_id.slice(0, 8)}…` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">{fmt(r.published_at)}</td>
                    <td className="space-y-1 px-3 py-2">
                      {publicLive ? (
                        <Link
                          href={`/clasificados/viajes/oferta/${encodeURIComponent(r.slug)}`}
                          className="block font-semibold text-[#6B5B2E] underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View public
                        </Link>
                      ) : (
                        <span className="text-[#7A7164]">—</span>
                      )}
                    </td>
                    <td className="min-w-[200px] px-3 py-2 align-top">
                      <ClassifiedAdminRowActions
                        variant="viajes"
                        rowId={r.id}
                        leonixAdId={lx}
                        displayLabel={r.title}
                        publicLive={publicLive}
                        promoted={promoted}
                        verified={verified}
                        canArchive={lifecycle !== "unpublished" && lifecycle !== "rejected"}
                        staffEditBoardHref="/dashboard/viajes"
                        republishCategory="viajes"
                        republishRow={{
                          lifecycle_status: r.lifecycle_status,
                          is_public: r.is_public,
                          republish_override: (r as { republish_override?: boolean | null }).republish_override,
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <AdminListingMonetizationSummary
                        category="viajes"
                        source="viajes_staged_listings"
                        listing={r as unknown as Record<string, unknown>}
                        hints={{ analyticsCapability: "partial" }}
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
