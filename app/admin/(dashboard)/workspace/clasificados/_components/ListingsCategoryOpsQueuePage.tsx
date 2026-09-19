import { ADMIN_QUEUE_DEFAULT_LIMIT, normalizeAdminQueueLimit } from "@/app/admin/_lib/adminQueueActionFlow";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import {
  fetchListingsForAdminWorkspaceFiltered,
  LISTINGS_ADMIN_SCAN_CAP,
} from "@/app/admin/_lib/listingsAdminSelect";
import { adminAnyFilterActive } from "@/app/admin/_lib/adminFilterTruth";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import Link from "next/link";
import { adminCtaChip, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { clasificadosQueueSurfaceForSlug } from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosAdminScopeUrls";
import {
  ADMIN_BR_LANE_OPTIONS,
  adminCategoryDisplayName,
  adminRowMatchesLeonixAdIdFilter,
  adminStatusOptionsForCategory,
  parseAdminBrLane,
} from "@/app/admin/(dashboard)/workspace/clasificados/_lib/adminNormalizedShell";
import {
  fetchAdminCategorySummary,
  type AdminCategorySummary,
} from "@/app/admin/_lib/adminCategorySummary";
import {
  loadAdminListingCommercialTruth,
  type AdminListingCommercialTruthMap,
} from "@/app/admin/_lib/adminListingCommercialTruth";
import {
  fetchListingFlagContextMaps,
  type ListingFlagContextMaps,
} from "@/app/admin/_lib/adminReviewFlagContext";

import AdminListingsTable, { type AdminListingsTableRow } from "../AdminListingsTable";
import { ClasificadosQueueHeader } from "./ClasificadosQueueHeader";
import { ClasificadosLiveScopePanel } from "./ClasificadosLiveScopePanel";
import { BienesNegocioOpsPanel } from "./BienesNegocioOpsPanel";
import { AdminCategorySummaryPanel } from "./normalized/AdminCategorySummaryPanel";
import { AdminCategoryFilterBar } from "./normalized/AdminCategoryFilterBar";
import { AdminListTruncationNotice } from "./normalized/AdminListTruncationNotice";
import {
  loadBienesCapacityAuthorityState,
  loadBienesNegocioParentOps,
  type AdminBienesNegocioParentOps,
} from "@/app/admin/_lib/bienesNegocioCommercialOps";

export const dynamic = "force-dynamic";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

type PageProps = {
  categorySlug: string;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** A summary that says "nothing could be read" — every count null (rendered "—"), never 0. */
function unavailableSummary(slug: string, source: string, error: string | null): AdminCategorySummary {
  return {
    slug,
    total: null,
    live: null,
    needsAttention: null,
    paymentIssue: null,
    expired: null,
    sourceHealth: { ok: false, source, note: error ?? "summary unavailable" },
    queryError: error,
  };
}

export async function ListingsCategoryOpsQueuePage({ categorySlug, searchParams }: PageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const configured = isSupabaseAdminConfigured();
  const sp = searchParams ? await searchParams : {};
  const qInput = firstParam(sp.q) ?? "";
  const statusFilter = (firstParam(sp.status) ?? "").trim().toLowerCase();
  const ownerFrag = (firstParam(sp.owner) ?? "").trim().toLowerCase();
  const leonixAdIdFilter = (firstParam(sp.leonix_ad_id) ?? "").trim();
  const queueLimit = normalizeAdminQueueLimit(firstParam(sp.limit), ADMIN_QUEUE_DEFAULT_LIMIT);
  const scope = parseAdminScope(sp);

  const surface = clasificadosQueueSurfaceForSlug(categorySlug);
  const basePath = `/admin/workspace/clasificados/${encodeURIComponent(categorySlug)}`;
  const queueHref = appendPreservedSearchParams(basePath, sp, null);
  const liveHref = appendPreservedSearchParams(basePath, sp, "live");
  // Bienes Raices has two independent lanes (Negocio: parent + children; Privado: FSBO). The lane is a SQL predicate
  // (list + summary), preserved across Queue / Live and the filter bar.
  const isBr = categorySlug === "bienes-raices";
  const brLane = isBr ? parseAdminBrLane(sp) : "all";
  const brLaneHref = (target: (typeof ADMIN_BR_LANE_OPTIONS)[number]["value"]) =>
    appendPreservedSearchParams(basePath, { ...sp, lane: target === "all" ? undefined : target }, scope === "live" ? "live" : null);

  const supabase = getAdminSupabase();
  // EVERY filter runs in the data layer BEFORE the row limit (2026-09 final normalization, Gate 3):
  //   q -> text search, Leonix Ad ID -> its own SQL predicate (AND-ed with q, never riding on q),
  //   status / full owner UUID -> SQL, partial owner fragment -> the bounded windowed scan.
  // q + an exact filter is an INTERSECTION. Where a bounded scan is unavoidable the data layer reports
  // `scanCapped` and the page discloses it (AdminListTruncationNotice) instead of implying completeness.
  const fetchRes = configured
    ? await fetchListingsForAdminWorkspaceFiltered(supabase, {
        q: qInput || undefined,
        leonixAdId: leonixAdIdFilter || undefined,
        category: categorySlug,
        status: statusFilter || undefined,
        ownerFrag: ownerFrag || undefined,
        limit: queueLimit,
        ...(brLane !== "all" ? { brLane } : {}),
        ...(scope === "live" ? { scope: "live" as const } : {}),
      })
    : { data: [], error: null, detailPairsAvailable: true, republishColsAvailable: true };

  // Defensive exactness guard only (the SQL layer already narrowed): never widens, never re-limits.
  let rows = (fetchRes.data ?? []) as AdminListingsTableRow[];
  if (leonixAdIdFilter) {
    rows = rows.filter((r) => adminRowMatchesLeonixAdIdFilter(r, leonixAdIdFilter));
  }
  // (the Bienes Raices lane is a scope, not a filter: the summary is lane-scoped and says so through `laneLabel`)
  const filtersActive = adminAnyFilterActive(sp, ["q", "status", "owner", "owner_user_id", "leonix_ad_id", "slug", "id"]);

  const categoryName = adminCategoryDisplayName(categorySlug);
  const pageSubtitle =
    scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue");

  // Shared operating summary (canonical counts owned by adminCategorySummary — this page never
  // recomputes them from the truncated page rows).
  let summary: AdminCategorySummary = unavailableSummary(categorySlug, surface.sourceTable, "Supabase admin is not configured.");
  if (configured) {
    try {
      summary = await fetchAdminCategorySummary(categorySlug, brLane !== "all" ? { lane: brLane } : undefined);
    } catch (e) {
      summary = unavailableSummary(categorySlug, surface.sourceTable, e instanceof Error ? e.message : "summary query failed");
    }
  }

  // Report / AI-review / owner-email context — the same maps the global Clasificados page passes.
  let flagContext: ListingFlagContextMaps = { reportsByListingId: {}, ownerEmailByUserId: {}, aiReviewByListingId: {} };
  // Commercial truth (READ-ONLY): payment / entitlement / subscription records for THESE rows only.
  let commercialTruthByListingId: AdminListingCommercialTruthMap = {};
  if (configured && rows.length > 0) {
    try {
      flagContext = await fetchListingFlagContextMaps(
        supabase,
        rows.map((r) => r.id),
        rows.map((r) => r.owner_id ?? "").filter(Boolean),
      );
    } catch {
      /* context is optional chrome — the table degrades to status-only truth */
    }
    commercialTruthByListingId = await loadAdminListingCommercialTruth({
      category: categorySlug,
      listingIds: rows.map((r) => r.id),
      listingRowsById: Object.fromEntries(rows.map((r) => [r.id, r as unknown as Record<string, unknown>])),
    });
  }

  // Gate BIENES-NEGOCIO-2 — Bienes Negocio is a $399 parent + child-inventory product, so the
  // Admin ops queue must show capacity, entitlement and payment truth, not just rows. Built only
  // for this category, only for MAIN parents on the current page, and only from canonical readers.
  // Bounded to the parents actually listed — this never sweeps the table.
  let bienesParentOps: AdminBienesNegocioParentOps[] = [];
  if (configured && categorySlug === "bienes-raices") {
    const parentRows = rows.filter((r) => (r as { inventory_role?: string | null }).inventory_role === "main").slice(0, 25);
    if (parentRows.length > 0) {
      const authority = await loadBienesCapacityAuthorityState();
      bienesParentOps = [];
      for (const parentRow of parentRows) {
        bienesParentOps.push(await loadBienesNegocioParentOps(parentRow, authority));
      }
    }
  }

  return (
    <div className="min-w-0 max-w-[1200px] space-y-6 overflow-x-hidden">
      <ClasificadosQueueHeader
        lang={lang}
        categoryName={categoryName}
        scope={scope === "live" ? "live" : "queue"}
        sourceTable={surface.sourceTable}
        subtitle={pageSubtitle}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        queueHref={queueHref}
        liveHref={liveHref}
        laneSlot={
          isBr ? (
            <div className="space-y-1" data-testid="bienes-lane-selector">
              <p className="text-[10px] leading-snug text-[#7A7164]">
                Bienes Raíces lane — Negocio (parent + inventory children) and Privado (FSBO) are independent operations; pick a
                lane to see only that one. Search, Queue/Live scope and the summary all apply inside the selected lane.
              </p>
              <nav className="flex flex-wrap gap-2" aria-label="Bienes Raíces lane">
                {ADMIN_BR_LANE_OPTIONS.map((opt) => (
                  <Link
                    key={opt.value}
                    href={brLaneHref(opt.value)}
                    className={`${opt.value === brLane ? adminCtaChip : adminCtaChipSecondary} inline-flex`}
                    aria-current={opt.value === brLane ? "page" : undefined}
                    title={opt.hint}
                  >
                    {opt.label}
                  </Link>
                ))}
              </nav>
            </div>
          ) : undefined
        }
      />

      <AdminCategorySummaryPanel
        summary={summary}
        lang={lang}
        laneLabel={isBr && brLane !== "all" ? ADMIN_BR_LANE_OPTIONS.find((o) => o.value === brLane)?.label ?? brLane : null}
        filtersActive={filtersActive}
        technicalDetails={[
          ["Table", surface.sourceTable],
          ["Scan cap (raw rows per filtered scan)", String(LISTINGS_ADMIN_SCAN_CAP)],
        ]}
      />

      <BienesNegocioOpsPanel parents={bienesParentOps} />

      {scope === "live" ? (
        <ClasificadosLiveScopePanel
          categorySlug={categorySlug}
          lang={lang}
          queueHref={queueHref}
          liveHref={liveHref}
          rowCount={rows.length}
          configured={configured}
          fetchError={fetchRes.error?.message ?? null}
          scanCapped={Boolean(fetchRes.scanCapped)}
        />
      ) : null}

      {configured ? (
        <AdminCategoryFilterBar
          lang={lang}
          action={basePath}
          searchParams={sp}
          statusOptions={adminStatusOptionsForCategory(categorySlug)}
          clearHref={appendPreservedSearchParams(basePath, {}, scope === "live" ? "live" : null)}
        />
      ) : null}

      {configured && !fetchRes.error ? (
        <AdminListTruncationNotice
          lang={lang}
          shown={rows.length}
          limit={queueLimit}
          scanCapped={Boolean(fetchRes.scanCapped)}
          scanned={fetchRes.scanned ?? null}
          partialSources={fetchRes.partialSources ?? null}
        />
      ) : null}

      {!configured ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          Supabase admin no está configurado (<code className="rounded bg-[#FBF7EF] px-1">SUPABASE_SERVICE_ROLE_KEY</code>).
        </p>
      ) : fetchRes.error ? (
        <p className={`${adminCardBase} p-4 text-sm text-red-800`}>Error: {fetchRes.error.message}</p>
      ) : (
        <AdminListingsTable
          listings={rows}
          detailPairsAvailable={fetchRes.detailPairsAvailable}
          republishColsAvailable={fetchRes.republishColsAvailable}
          listingsCategorySlug={categorySlug}
          staffQueueMode
          flagReportByListingId={flagContext.reportsByListingId}
          ownerEmailByUserId={flagContext.ownerEmailByUserId}
          aiReviewByListingId={flagContext.aiReviewByListingId}
          commercialTruthByListingId={commercialTruthByListingId}
        />
      )}
    </div>
  );
}
