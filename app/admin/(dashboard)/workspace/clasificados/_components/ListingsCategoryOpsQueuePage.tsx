import { ADMIN_QUEUE_DEFAULT_LIMIT, normalizeAdminQueueLimit } from "@/app/admin/_lib/adminQueueActionFlow";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import {
  fetchListingsForAdminWorkspaceFiltered,
  isUuidString,
} from "@/app/admin/_lib/listingsAdminSelect";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { clasificadosQueueSurfaceForSlug } from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosAdminScopeUrls";
import {
  adminCategoryDisplayName,
  adminRowMatchesLeonixAdIdFilter,
  adminStatusOptionsForCategory,
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

  const supabase = getAdminSupabase();
  const fetchRes = configured
    ? await fetchListingsForAdminWorkspaceFiltered(supabase, {
        // A Leonix Ad ID typed into its own field is searched through the same canonical `q` path
        // (it already resolves exact stored `leonix_ad_id`s), then narrowed exactly below.
        q: qInput || leonixAdIdFilter || undefined,
        category: categorySlug,
        status: statusFilter || undefined,
        ownerFrag: ownerFrag && isUuidString(ownerFrag) ? ownerFrag : undefined,
        limit: queueLimit,
        ...(scope === "live" ? { scope: "live" as const } : {}),
      })
    : { data: [], error: null, detailPairsAvailable: true, republishColsAvailable: true };

  let rows = (fetchRes.data ?? []) as AdminListingsTableRow[];
  if (ownerFrag && !isUuidString(ownerFrag)) {
    rows = rows.filter((r) => (r.owner_id ?? "").toLowerCase().includes(ownerFrag));
  }
  if (leonixAdIdFilter) {
    rows = rows.filter((r) => adminRowMatchesLeonixAdIdFilter(r, leonixAdIdFilter));
  }

  const categoryName = adminCategoryDisplayName(categorySlug);
  const pageSubtitle =
    scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue");

  // Shared operating summary (canonical counts owned by adminCategorySummary — this page never
  // recomputes them from the truncated page rows).
  let summary: AdminCategorySummary = unavailableSummary(categorySlug, surface.sourceTable, "Supabase admin is not configured.");
  if (configured) {
    try {
      summary = await fetchAdminCategorySummary(categorySlug);
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
      />

      <AdminCategorySummaryPanel summary={summary} lang={lang} technicalDetails={[["Table", surface.sourceTable]]} />

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
