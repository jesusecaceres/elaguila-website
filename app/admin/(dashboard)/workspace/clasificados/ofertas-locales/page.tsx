import { Suspense } from "react";

import {
  ADMIN_QUEUE_DEFAULT_LIMIT,
  normalizeAdminQueueLimit,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { ClasificadosScopeNav } from "../_components/ClasificadosScopeNav";
import { AdminCategoryFilterBar } from "../_components/normalized/AdminCategoryFilterBar";
import { AdminListTruncationNotice } from "../_components/normalized/AdminListTruncationNotice";
import { adminAnyFilterActive } from "@/app/admin/_lib/adminFilterTruth";
import { AdminCategorySummaryPanel } from "../_components/normalized/AdminCategorySummaryPanel";
import { adminRowMatchesLeonixAdIdFilter } from "../_lib/adminNormalizedShell";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import { fetchAdminCategorySummary, type AdminCategorySummary } from "@/app/admin/_lib/adminCategorySummary";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import {
  loadAdminListingCommercialTruth,
  type AdminListingCommercialTruthMap,
} from "@/app/admin/_lib/adminListingCommercialTruth";
import type { PublicationTruth } from "@/app/admin/_lib/publicationSemantics";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import {
  OFERTAS_ADMIN_LIST_MAX,
  OFERTAS_LOCALES_ADMIN_SELECT,
  listOfertasLocalesAdminRowsDetailed,
  mapOfertaLocalAdminRowToDetailVm,
  mapOfertasLocalesAdminRowsToListVms,
  type OfertaLocalAdminRow,
} from "@/app/lib/ofertas-locales/ofertasLocalesAdminHelpers";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import { OfertasLocalesAdminReviewList } from "./OfertasLocalesAdminReviewList";
import {
  OFERTAS_ADMIN_STATUS_GROUP_OPTIONS,
  OFERTAS_ADMIN_STATUS_OPTIONS,
  OFERTAS_ADMIN_TERM_OPTIONS,
  OFERTAS_ADMIN_UUID_RE,
  ofertaListingTruth,
  ofertasScopeHref,
  ofertasServerSearchTerm,
  parseOfertasAdminScope,
} from "./ofertasAdminView";

export const dynamic = "force-dynamic";

const BASE_PATH = "/admin/workspace/clasificados/ofertas-locales";
const CATEGORY_NAME = "Ofertas Locales";
/** The data layer's ceiling for one page of rows (matches the largest Rows choice). */
const OFERTAS_LIST_CAP = OFERTAS_ADMIN_LIST_MAX;

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const SELECT_FIELD = "rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs text-[#1E1810] min-h-[40px]";

/** Keeps a URL value that is outside the scope's vocabulary visible (never silently dropped). */
function withCurrent(options: readonly { value: string; label: string }[], current: string) {
  return current && !options.some((o) => o.value === current) ? [...options, { value: current, label: `${current} (custom)` }] : options;
}

function FilterSelect({
  name,
  label,
  current,
  options,
  allLabel,
}: {
  name: string;
  label: string;
  current: string;
  options: readonly { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
      <span className="font-semibold text-[#5C5346]">{label}</span>
      <select name={name} defaultValue={current} className={SELECT_FIELD}>
        <option value="">{allLabel}</option>
        {withCurrent(options, current).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const LANE_OPTIONS = [
  { value: "flyer", label: "Flyer" },
  { value: "coupon", label: "Coupon" },
] as const;
const READY_BLOCKED_OPTIONS = [
  { value: "ready", label: "Ready" },
  { value: "blocked", label: "Blocked" },
] as const;

export default async function AdminOfertasLocalesReviewPage(props: PageProps) {
  const lang = await getAdminLang();
  const configured = isSupabaseAdminConfigured();
  const sp = props.searchParams ? await props.searchParams : {};
  const scope = parseOfertasAdminScope(sp);

  const q = (firstParam(sp.q) ?? "").trim();
  const leonixAdId = (firstParam(sp.leonix_ad_id) ?? "").trim();
  const statusFilter = (firstParam(sp.status) ?? "").trim().toLowerCase();
  const ownerRaw = (firstParam(sp.owner) ?? firstParam(sp.owner_id) ?? "").trim();
  const inspectId = (firstParam(sp.id) ?? "").trim();
  const statusGroup = (firstParam(sp.status_group) ?? "").trim();
  const laneFilter = (firstParam(sp.lane) ?? "").trim();
  const commercial = (firstParam(sp.commercial) ?? "").trim();
  const scanReview = (firstParam(sp.scan_review) ?? "").trim();
  const term = (firstParam(sp.term) ?? "").trim();
  const queueLimit = normalizeAdminQueueLimit(firstParam(sp.limit), ADMIN_QUEUE_DEFAULT_LIMIT);

  // Raw status and the Leonix Ad ID are SQL predicates in the data layer now (AND-ed with scope, q, id, owner and
  // the derived filters, all BEFORE its row limit). The in-memory checks below are a defensive exactness guard only.

  let filterError: string | null = null;
  if (ownerRaw && !OFERTAS_ADMIN_UUID_RE.test(ownerRaw)) filterError = "owner must be a full user UUID";
  else if (inspectId && !OFERTAS_ADMIN_UUID_RE.test(inspectId)) filterError = "id must be a full UUID";

  let rows: OfertaLocalAdminRow[] = [];
  let listError: string | null = null;
  let capped = false;
  let scanned = 0;
  if (configured && !filterError) {
    const res = await listOfertasLocalesAdminRowsDetailed(getAdminSupabase(), {
      limit: Math.min(queueLimit, OFERTAS_LIST_CAP),
      scope,
      q: ofertasServerSearchTerm(q, leonixAdId),
      status: statusFilter || undefined,
      leonix_ad_id: leonixAdId || undefined,
      id: inspectId || undefined,
      owner_id: ownerRaw || undefined,
      status_group: statusGroup || undefined,
      lane: laneFilter || undefined,
      commercial: commercial || undefined,
      scan_review: scanReview || undefined,
      term: term || undefined,
    });
    rows = res.rows;
    listError = res.error;
    capped = res.capped;
    scanned = res.scanned;
  }
  if (statusFilter) rows = rows.filter((r) => String(r.status).toLowerCase() === statusFilter);
  if (leonixAdId) rows = rows.filter((r) => adminRowMatchesLeonixAdIdFilter(r, leonixAdId));

  // Inspect any offer by id — even one that is no longer in this scope (an archived offer leaves the Queue but
  // must stay inspectable right after the action).
  let inspectRow: OfertaLocalAdminRow | null = inspectId ? rows.find((r) => r.id === inspectId) ?? null : null;
  if (!inspectRow && configured && inspectId && OFERTAS_ADMIN_UUID_RE.test(inspectId)) {
    const { data } = await getAdminSupabase()
      .from("ofertas_locales")
      .select(OFERTAS_LOCALES_ADMIN_SELECT)
      .eq("id", inspectId)
      .maybeSingle();
    inspectRow = (data as unknown as OfertaLocalAdminRow | null) ?? null;
  }

  const items = mapOfertasLocalesAdminRowsToListVms(rows);
  const inspectItem = inspectRow ? mapOfertaLocalAdminRowToDetailVm(inspectRow) : null;

  // Listing truth (publication semantics) + read-only commercial truth (payment / entitlement records).
  const truthRows = inspectRow && !rows.some((r) => r.id === inspectRow!.id) ? [...rows, inspectRow] : rows;
  const listingTruthById: Record<string, PublicationTruth> = Object.fromEntries(
    truthRows.map((r) => [r.id, ofertaListingTruth(r as unknown as Record<string, unknown>)]),
  );
  const commercialTruthByListingId: AdminListingCommercialTruthMap =
    configured && truthRows.length > 0
      ? await loadAdminListingCommercialTruth({
          category: "ofertas-locales",
          listingIds: truthRows.map((r) => r.id),
          listingRowsById: Object.fromEntries(truthRows.map((r) => [r.id, r as unknown as Record<string, unknown>])),
        })
      : {};

  const surface = clasificadosQueueSurfaceForSlug("ofertas-locales");
  let summary: AdminCategorySummary;
  try {
    summary = await fetchAdminCategorySummary("ofertas-locales");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "summary query failed";
    summary = {
      slug: "ofertas-locales",
      total: null,
      live: null,
      needsAttention: null,
      paymentIssue: null,
      expired: null,
      sourceHealth: { ok: false, source: surface.sourceTable, note: msg },
      queryError: msg,
    };
  }

  const queueHref = ofertasScopeHref(BASE_PATH, sp, "queue");
  const liveHref = ofertasScopeHref(BASE_PATH, sp, "live");
  const historyHref = ofertasScopeHref(BASE_PATH, sp, "history");
  const subtitle = adminTr(lang, scope === "live" ? "ofertasAdmin.subLive" : scope === "history" ? "ofertasAdmin.subHistory" : "ofertasAdmin.subQueue");
  const allLabel = adminTr(lang, "catShell.filter.statusAll");

  return (
    <div className="max-w-[1200px] space-y-6">
      <ClasificadosQueueHeader
        lang={lang}
        {...(scope === "history"
          ? {
              title: adminTr(lang, "catShell.titleHistory", { name: CATEGORY_NAME }),
              scopeLabel: adminTr(lang, "catShell.scopeHistory"),
            }
          : { categoryName: CATEGORY_NAME, scope })}
        sourceTable={surface.sourceTable}
        subtitle={subtitle}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        rightSlot={
          <ClasificadosScopeNav lang={lang} queueHref={queueHref} liveHref={liveHref} historyHref={historyHref} active={scope} />
        }
      />

      <Suspense fallback={null}>
        <ClasificadosQueueActionChrome />
      </Suspense>

      <AdminCategorySummaryPanel
        summary={summary}
        lang={lang}
        filtersActive={adminAnyFilterActive(sp, ["q", "status", "owner", "owner_id", "leonix_ad_id", "id", "status_group", "lane", "commercial", "scan_review", "term"])}
        technicalDetails={[["Table", surface.sourceTable]]}
      />

      {configured ? (
        <AdminCategoryFilterBar
          lang={lang}
          action={BASE_PATH}
          searchParams={{ ...sp, owner: ownerRaw || undefined }}
          statusOptions={[...OFERTAS_ADMIN_STATUS_OPTIONS[scope]]}
          clearHref={ofertasScopeHref(BASE_PATH, { scope: sp.scope }, scope)}
          extraFieldNames={["id", "owner_id", "status_group", "lane", "commercial", "scan_review", "term"]}
          searchPlaceholder="negocio, oferta, ciudad, ZIP, Leonix Ad ID, UUID"
        >
          <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
            <span className="font-semibold text-[#5C5346]">{adminTr(lang, "ofertasAdmin.filter.id")}</span>
            <input name="id" defaultValue={inspectId} className={`${SELECT_FIELD} font-mono`} autoComplete="off" />
          </label>
          <FilterSelect
            name="status_group"
            label={adminTr(lang, "ofertasAdmin.filter.statusGroup")}
            current={statusGroup}
            options={OFERTAS_ADMIN_STATUS_GROUP_OPTIONS[scope]}
            allLabel={allLabel}
          />
          <FilterSelect name="lane" label={adminTr(lang, "ofertasAdmin.filter.lane")} current={laneFilter} options={LANE_OPTIONS} allLabel={allLabel} />
          <FilterSelect
            name="commercial"
            label={adminTr(lang, "ofertasAdmin.filter.commercial")}
            current={commercial}
            options={READY_BLOCKED_OPTIONS}
            allLabel={allLabel}
          />
          <FilterSelect
            name="scan_review"
            label={adminTr(lang, "ofertasAdmin.filter.scanReview")}
            current={scanReview}
            options={READY_BLOCKED_OPTIONS}
            allLabel={allLabel}
          />
          <FilterSelect
            name="term"
            label={adminTr(lang, "ofertasAdmin.filter.term")}
            current={term}
            options={OFERTAS_ADMIN_TERM_OPTIONS[scope]}
            allLabel={allLabel}
          />
        </AdminCategoryFilterBar>
      ) : (
        <p className="text-sm text-amber-900">Supabase admin no configurado.</p>
      )}

      {filterError || listError ? (
        <div className={`${adminCardBase} border-red-200 p-3 text-sm text-red-900`} role="alert" data-testid="ofertas-query-error">
          {adminTr(lang, "ofertasAdmin.queryError", { error: filterError ?? listError ?? "" })}
        </div>
      ) : null}
      {capped ? (
        <p className="text-xs text-amber-900" data-testid="ofertas-capped">
          {adminTr(lang, "ofertasAdmin.capped", { scanned })}
        </p>
      ) : null}
      {configured && !filterError && !listError ? (
        <AdminListTruncationNotice
          lang={lang}
          shown={rows.length}
          limit={queueLimit}
          // `ofertas-capped` above already discloses a capped scan; this adds the "list is as long as the limit" notice.
          scanCapped={false}
        />
      ) : null}

      <OfertasLocalesAdminReviewList
        items={items}
        inspectItem={inspectItem}
        basePath={BASE_PATH}
        scope={scope}
        reviewEnabled={configured}
        lang={lang}
        listingTruthById={listingTruthById}
        commercialTruthByListingId={commercialTruthByListingId}
      />
    </div>
  );
}
