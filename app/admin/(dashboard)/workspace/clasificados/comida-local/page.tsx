import { Suspense } from "react";

import {
  ADMIN_QUEUE_DEFAULT_LIMIT,
  normalizeAdminQueueLimit,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { AdminCategoryFilterBar } from "../_components/normalized/AdminCategoryFilterBar";
import { AdminCategorySummaryPanel } from "../_components/normalized/AdminCategorySummaryPanel";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "../_lib/clasificadosAdminScopeUrls";
import { fetchAdminCategorySummary, type AdminCategorySummary } from "@/app/admin/_lib/adminCategorySummary";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import {
  loadAdminListingCommercialTruth,
  type AdminListingCommercialTruthMap,
} from "@/app/admin/_lib/adminListingCommercialTruth";
import type { PublicationTruth } from "@/app/admin/_lib/publicationSemantics";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import { ComidaLocalAdminListings } from "@/app/lib/clasificados/comida-local/ComidaLocalAdminListings";
import {
  listAdminComidaLocalListingsDetailed,
  type ComidaLocalAdminListResult,
} from "@/app/lib/clasificados/comida-local/comidaLocalAdminQueries";
import { mapComidaLocalRowsToAdminVms } from "@/app/lib/clasificados/comida-local/mapComidaLocalAdminListing";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import {
  COMIDA_LOCAL_STATUS_FILTER_OPTIONS,
  comidaListingTruth,
  comidaPublishedPaymentAnomaly,
  comidaRowLifecycleActions,
} from "./comidaAdminView";

export const dynamic = "force-dynamic";

const BASE_PATH = "/admin/workspace/clasificados/comida-local";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const FIELD = "rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs text-[#1E1810] min-h-[40px] font-mono";

export default async function AdminComidaLocalPublicListingsPage(props: PageProps) {
  const lang = await getAdminLang();
  const configured = isSupabaseAdminConfigured();
  const sp = props.searchParams ? await props.searchParams : {};
  const scope = parseAdminScope(sp);
  const queueHref = appendPreservedSearchParams(BASE_PATH, sp, null);
  const liveHref = appendPreservedSearchParams(BASE_PATH, sp, "live");

  const q = (firstParam(sp.q) ?? "").trim();
  const slug = (firstParam(sp.slug) ?? "").trim();
  const id = (firstParam(sp.id) ?? "").trim();
  const leonixAdId = (firstParam(sp.leonix_ad_id) ?? "").trim();
  // The filter bar's Owner field is `owner`; the old page used `owner_user_id` (still honoured).
  const owner = (firstParam(sp.owner) ?? firstParam(sp.owner_user_id) ?? "").trim();
  const status = (firstParam(sp.status) ?? "").trim().toLowerCase();
  const queueLimit = normalizeAdminQueueLimit(firstParam(sp.limit), ADMIN_QUEUE_DEFAULT_LIMIT);
  const inspectId = id || null;
  const hasFilters = Boolean(q || slug || id || leonixAdId || owner || status);

  // Every filter (status, owner, Leonix Ad ID, q, slug, id) runs in SQL BEFORE the row limit.
  const list: ComidaLocalAdminListResult = configured
    ? await listAdminComidaLocalListingsDetailed(getAdminSupabase(), {
        limit: queueLimit,
        scope: scope === "live" ? "live" : "queue",
        q: q || undefined,
        slug: slug || undefined,
        id: id || undefined,
        leonix_ad_id: leonixAdId || undefined,
        owner_user_id: owner || undefined,
        status: status || undefined,
      })
    : { rows: [], error: null };
  const rowsRaw = list.rows;

  const items = mapComidaLocalRowsToAdminVms(rowsRaw, lang === "en" ? "en" : "es");

  // Listing truth + read-only commercial truth + the canonical payment-aware action set, per row.
  const rowRecords = Object.fromEntries(rowsRaw.map((r) => [r.id, r as unknown as Record<string, unknown>]));
  const listingTruthById: Record<string, PublicationTruth> = {};
  const actionsById: Record<string, ReturnType<typeof comidaRowLifecycleActions>> = {};
  const paymentAnomalyById: Record<string, string | null> = {};
  const suspendedReasonById: Record<string, string | null> = {};
  for (const r of rowsRaw) {
    const rec = rowRecords[r.id];
    listingTruthById[r.id] = comidaListingTruth(rec);
    actionsById[r.id] = comidaRowLifecycleActions(r);
    paymentAnomalyById[r.id] = comidaPublishedPaymentAnomaly(rec);
    suspendedReasonById[r.id] = r.suspended_reason ?? null;
  }
  const commercialTruthByListingId: AdminListingCommercialTruthMap =
    configured && rowsRaw.length > 0
      ? await loadAdminListingCommercialTruth({
          category: "comida-local",
          listingIds: rowsRaw.map((r) => r.id),
          listingRowsById: rowRecords,
        })
      : {};

  const surface = clasificadosQueueSurfaceForSlug("comida-local");
  let summary: AdminCategorySummary;
  try {
    summary = await fetchAdminCategorySummary("comida-local");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "summary query failed";
    summary = {
      slug: "comida-local",
      total: null,
      live: null,
      needsAttention: null,
      paymentIssue: null,
      expired: null,
      sourceHealth: { ok: false, source: surface.sourceTable, note: msg },
      queryError: msg,
    };
  }

  return (
    <div className="max-w-[1200px] space-y-6">
      <ClasificadosQueueHeader
        lang={lang}
        categoryName="Comida Local"
        scope={scope === "live" ? "live" : "queue"}
        sourceTable={surface.sourceTable}
        subtitle={adminTr(lang, scope === "live" ? "comidaAdmin.subLive" : "comidaAdmin.subQueue")}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        queueHref={queueHref}
        liveHref={liveHref}
      />

      <Suspense fallback={null}>
        <ClasificadosQueueActionChrome />
      </Suspense>

      <AdminCategorySummaryPanel
        summary={summary}
        lang={lang}
        technicalDetails={[["Table", surface.sourceTable]]}
      />

      {configured ? (
        <AdminCategoryFilterBar
          lang={lang}
          action={BASE_PATH}
          searchParams={{ ...sp, owner: owner || undefined }}
          statusOptions={[...COMIDA_LOCAL_STATUS_FILTER_OPTIONS]}
          clearHref={appendPreservedSearchParams(BASE_PATH, {}, scope)}
          extraFieldNames={["slug", "id", "owner_user_id"]}
          searchPlaceholder="COMIDA-2026-000001 o tacos-el-chuy"
        >
          <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
            <span className="font-semibold text-[#5C5346]">{adminTr(lang, "comidaAdmin.filter.slug")}</span>
            <input name="slug" defaultValue={slug} className={FIELD} autoComplete="off" />
          </label>
          <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
            <span className="font-semibold text-[#5C5346]">{adminTr(lang, "comidaAdmin.filter.id")}</span>
            <input name="id" defaultValue={id} className={FIELD} autoComplete="off" />
          </label>
        </AdminCategoryFilterBar>
      ) : (
        <p className="text-sm text-amber-900">Supabase admin no configurado.</p>
      )}

      {list.error ? (
        <div className={`${adminCardBase} border-red-200 p-3 text-sm text-red-900`} role="alert" data-testid="comida-query-error">
          {adminTr(lang, "comidaAdmin.queryError", { error: list.error })}
        </div>
      ) : null}

      <ComidaLocalAdminListings
        lang={lang === "en" ? "en" : "es"}
        items={items}
        inspectId={inspectId}
        listingTruthById={listingTruthById}
        commercialTruthByListingId={commercialTruthByListingId}
        actionsById={configured ? actionsById : undefined}
        paymentAnomalyById={paymentAnomalyById}
        suspendedReasonById={suspendedReasonById}
        emptyMessage={hasFilters ? adminTr(lang, "comidaAdmin.empty") : undefined}
      />
    </div>
  );
}
