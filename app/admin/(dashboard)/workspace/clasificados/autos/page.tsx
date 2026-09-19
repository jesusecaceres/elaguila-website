import Link from "next/link";
import { Fragment, Suspense } from "react";
import { autosRowMatchesAdminQueueSearch } from "@/app/admin/_lib/adminAdSearch";
import {
  ADMIN_QUEUE_DEFAULT_LIMIT,
  adminQueueRowAnchorId,
  adminQueueRowClass,
  normalizeAdminQueueLimit,
  parseAdminActionResultFromRecord,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { getAdminLang, adminMessages } from "@/app/admin/_lib/adminI18n";
import {
  autosClassifiedsRowToDashboardRow,
  listAllAutosClassifiedsRowsForAdmin,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { fetchProfileIdsMatchingAdminQueueSearch } from "@/app/lib/supabase/adminQueueProfileSearch";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { AutosClassifiedsListingRow } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosListingAdminVisibilityBucket,
  autosListingStatusLabelEn,
} from "@/app/lib/clasificados/autos/autosClassifiedsVisibility";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import { appendPreservedSearchParams, parseAdminScope } from "../_lib/clasificadosAdminScopeUrls";
import { adminCardBase, adminCtaChip, adminCtaChipSecondary } from "../../../../_components/adminTheme";
import { AdminPagePurposeCard } from "../../../../_components/AdminPagePurposeCard";
import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import { AdminListingMonetizationSummary } from "../_components/AdminListingMonetizationSummary";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import { classifyPublication } from "@/app/admin/_lib/publicationSemantics";
import { fetchAdminCategorySummary, type AdminCategorySummary } from "@/app/admin/_lib/adminCategorySummary";
import { loadAdminListingCommercialTruth, type AdminListingCommercialTruthMap } from "@/app/admin/_lib/adminListingCommercialTruth";
import {
  autosDealerGroupKey,
  describeDealerGroupCapacity,
  fetchAutosDealerCapacityForRows,
  fetchAutosDealerInventoryPackProof,
  resolveDealerGroupCapacity,
  type AutosDealerCapacityView,
  type AutosInventoryPackProof,
} from "@/app/admin/_lib/adminAutosDealerCapacity";
import {
  autosChildParentGateState,
  dealerGroupMainIds,
  groupAutosRowsForAdmin,
} from "@/app/admin/_lib/adminAutosDealerGroups";
import { fetchAutosParents } from "@/app/admin/_lib/adminCategorySummary";
import { adminAnyFilterActive } from "@/app/admin/_lib/adminFilterTruth";
import type { AutosPublicParentCandidate } from "@/app/lib/clasificados/autos/autosPublicChildParentVisibility";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { AdminCategorySummaryPanel } from "../_components/normalized/AdminCategorySummaryPanel";
import { AdminCategoryFilterBar } from "../_components/normalized/AdminCategoryFilterBar";
import { AdminListTruncationNotice } from "../_components/normalized/AdminListTruncationNotice";
import { AdminCommercialTruthSection } from "../_components/normalized/AdminListingCardSections";
import {
  adminRowMatchesLeonixAdIdFilter,
  adminRowMatchesOwnerFilter,
  adminStatusOptionsForCategory,
} from "../_lib/adminNormalizedShell";
import {
  ADMIN_AUTOS_LANE_OPTIONS,
  ADMIN_AUTOS_WORKSPACE_PATH,
  parseAdminAutosLane,
} from "@/app/admin/_lib/adminAutosLanes";

export const dynamic = "force-dynamic";

type AutosAdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function autosStripeAdminHint(row: AutosClassifiedsListingRow): string {
  if (row.stripe_payment_intent_id?.trim()) {
    const id = row.stripe_payment_intent_id.trim();
    return `pi…${id.slice(-8)}`;
  }
  if (row.stripe_checkout_session_id?.trim()) {
    const id = row.stripe_checkout_session_id.trim();
    return `cs…${id.slice(-8)}`;
  }
  return "—";
}

function formatTs(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : "—";
  } catch {
    return "—";
  }
}

function formatUsd(n: number | undefined | null, locale: string): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMiles(n: number | undefined | null, locale: string): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n)} mi`;
}

function visLabel(bucket: string, m: ReturnType<typeof adminMessages>): string {
  if (bucket === "public") return m("autosQueue.visibilityPublic");
  if (bucket === "pre_publish") return m("autosQueue.visibilityPre");
  return m("autosQueue.visibilityInactive");
}

function statusLabel(status: AutosClassifiedsListingRow["status"]): string {
  return autosListingStatusLabelEn(status);
}

export default async function AdminAutosClassifiedsPage(props: AutosAdminPageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const locale = "en-US";

  const sp = (props.searchParams ? await props.searchParams : {}) as Record<string, string | string[] | undefined>;
  const actionProof = parseAdminActionResultFromRecord(sp);
  const queueLimit = normalizeAdminQueueLimit(
    typeof sp.limit === "string" ? sp.limit : undefined,
    ADMIN_QUEUE_DEFAULT_LIMIT,
  );
  const scope = parseAdminScope(sp);
  const qRaw = typeof sp.q === "string" ? sp.q.trim() : "";
  const statusFilter = typeof sp.status === "string" ? sp.status.trim().toLowerCase() : "";
  const ownerFilter = typeof sp.owner === "string" ? sp.owner.trim() : "";
  const leonixAdIdFilter = typeof sp.leonix_ad_id === "string" ? sp.leonix_ad_id.trim() : "";
  // Status, a full owner UUID and the Leonix Ad ID are SQL predicates in the Autos service (AND-ed with lane /
  // scope, BEFORE the row cap). Only free-text search and a PARTIAL owner fragment need the bounded scan.
  const ownerIsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerFilter);
  const memoryFiltered = Boolean(qRaw || (ownerFilter && !ownerIsUuid));
  const autosBase = ADMIN_AUTOS_WORKSPACE_PATH;
  // Dealers vs Privados — one engine, one table; `lane` is the canonical `row.lane` value and is
  // applied in the SQL query (not as a cosmetic client filter over the same rows).
  const lane = parseAdminAutosLane(sp);
  const queueNavHref = appendPreservedSearchParams(autosBase, sp, null, ["lane"]);
  const liveNavHref = appendPreservedSearchParams(autosBase, sp, "live", ["lane"]);
  const laneHref = (target: (typeof ADMIN_AUTOS_LANE_OPTIONS)[number]["value"]) =>
    appendPreservedSearchParams(autosBase, { ...sp, lane: target === "all" ? undefined : target }, scope, ["lane"]);
  // q needs the matching profile ids BEFORE the scan (owner name / e-mail search).
  const profileSet = new Set<string>();
  if (qRaw && isSupabaseAdminConfigured() && qRaw.length >= 2) {
    const supabase = getAdminSupabase();
    const pids = await fetchProfileIdsMatchingAdminQueueSearch(supabase, qRaw);
    for (const id of pids) profileSet.add(id);
  }
  // Search / status / owner / Leonix Ad ID are applied INSIDE the paged scan (before the row limit), so a
  // match older than the newest page is still found and `limit` counts matching rows, not scanned rows.
  type AutosAdminRow = Awaited<ReturnType<typeof listAllAutosClassifiedsRowsForAdmin>>[number];
  const rowFilter = memoryFiltered
    ? (r: AutosAdminRow) => {
        if (statusFilter && String(r.status).toLowerCase() !== statusFilter) return false;
        if (ownerFilter && !adminRowMatchesOwnerFilter(r, ownerFilter)) return false;
        if (leonixAdIdFilter && !adminRowMatchesLeonixAdIdFilter(r, leonixAdIdFilter)) return false;
        if (!qRaw) return true;
        const dash = autosClassifiedsRowToDashboardRow(r);
        const L = r.listing_payload;
        const blob = [
          L.year,
          L.make,
          L.model,
          L.trim,
          L.vin,
          L.stockNumber,
          L.state,
          L.zip,
          L.dealerName,
          (L.description ?? "").slice(0, 500),
        ]
          .filter((x) => x != null && String(x).trim() !== "")
          .join(" ")
          .toLowerCase();
        return autosRowMatchesAdminQueueSearch(
          {
            id: r.id,
            owner_user_id: r.owner_user_id,
            title: dash.title,
            city: dash.city,
            leonix_ad_id: r.leonix_ad_id ?? null,
            vehicleTextBlob: blob,
          },
          qRaw,
          profileSet,
        );
      }
    : undefined;
  let listMeta: { error: string | null; scanCapped: boolean; scanned: number } = { error: null, scanCapped: false, scanned: 0 };
  const rows = await listAllAutosClassifiedsRowsForAdmin(queueLimit, {
    ...(scope === "live" ? { scope: "live" as const } : {}),
    ...(lane !== "all" ? { lane } : {}),
    ...(rowFilter ? { rowFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(ownerIsUuid ? { ownerUserId: ownerFilter } : {}),
    ...(leonixAdIdFilter ? { leonixAdId: leonixAdIdFilter } : {}),
    onMeta: (meta) => {
      listMeta = meta;
    },
  });
  // (the lane is a scope, not a filter: the summary is lane-scoped and says so through `laneLabel`)
  const filtersActive = adminAnyFilterActive(sp, ["q", "status", "owner", "leonix_ad_id"]);

  // Dealer capacity (closeout 2): the active count per dealer inventory GROUP comes from the canonical
  // grouped count (adminCategorySummary.fetchAutosDealerCapacityTruth, scoped to the owners visible
  // here) — never counted over the truncated page rows, never divided by a
  // hard-coded 10. The standard limit is STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT; a paid inventory pack
  // raises it, so a group above the standard limit is flagged for entitlement review instead of being
  // shown as a bare "n/10". If the read fails the page prints "—".
  const capacity: AutosDealerCapacityView = await fetchAutosDealerCapacityForRows(rows);

  // DEALER GROUPS (Gate 4): a parent (main) listing with its inventory children together, the child -> parent
  // public gate, and the inventory-pack ENTITLEMENT proof for each group's main listing. The entitled capacity is
  // shown ONLY when an active entitlement proves it (never fabricated from row data).
  const grouping = groupAutosRowsForAdmin(rows);
  const orderedRows = grouping.ordered;
  const mainIds = dealerGroupMainIds(grouping.groups);
  const packProof: AutosInventoryPackProof = isSupabaseAdminConfigured()
    ? await fetchAutosDealerInventoryPackProof(mainIds)
    : { available: false, error: "supabase_admin_not_configured", provenByMainId: {} };
  // Parents of the visible children: rows on the page first, the rest read (batched) — the gate reads the parent's
  // status / owner / role exactly like the public reader.
  const parentsById = new Map<string, AutosPublicParentCandidate>();
  for (const r of rows) parentsById.set(r.id, r);
  let parentLookupError: string | null = null;
  const missingParentIds = mainIds.filter((id) => !parentsById.has(id));
  if (missingParentIds.length > 0 && isSupabaseAdminConfigured()) {
    try {
      for (const [id, p] of await fetchAutosParents(getAdminSupabase(), missingParentIds)) parentsById.set(id, p);
    } catch (e) {
      parentLookupError = e instanceof Error ? e.message : String(e);
    }
  }

  // Commercial truth (READ-ONLY): payment / entitlement / subscription records for THESE rows.
  const commercialTruthByListingId: AdminListingCommercialTruthMap = isSupabaseAdminConfigured() && rows.length > 0
    ? await loadAdminListingCommercialTruth({
        category: "autos",
        listingIds: rows.map((r) => r.id),
        listingRowsById: Object.fromEntries(rows.map((r) => [r.id, r as unknown as Record<string, unknown>])),
      })
    : {};

  // Shared operating summary, lane-aware.
  const surface = clasificadosQueueSurfaceForSlug("autos");
  let summary: AdminCategorySummary;
  try {
    summary = await fetchAdminCategorySummary("autos", lane !== "all" ? { lane } : undefined);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "summary query failed";
    summary = {
      slug: "autos",
      total: null,
      live: null,
      needsAttention: null,
      paymentIssue: null,
      expired: null,
      sourceHealth: { ok: false, source: surface.sourceTable, note: msg },
      queryError: msg,
    };
  }
  const laneLabel = lane === "all" ? null : ADMIN_AUTOS_LANE_OPTIONS.find((o) => o.value === lane)?.label ?? lane;

  return (
    <div className="mx-auto max-w-[110rem] px-4 py-8 sm:px-6">
      <ClasificadosQueueHeader
        lang={lang}
        categoryName="Autos"
        scope={scope === "live" ? "live" : "queue"}
        sourceTable={surface.sourceTable}
        subtitle={m("autosQueue.pageSubtitle")}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        queueHref={queueNavHref}
        liveHref={liveNavHref}
        laneSlot={
          <div className="space-y-1" data-testid="autos-lane-selector">
            <p className="text-[10px] leading-snug text-[#7A7164]">
              Autos lane — dealers and private sellers share this one Autos workspace and table; pick a
              lane to see only that operation. Search, Queue/Live scope, and row actions all apply inside the selected lane.
            </p>
            <nav className="flex flex-wrap gap-2" aria-label="Autos lane">
              {ADMIN_AUTOS_LANE_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={laneHref(opt.value)}
                  className={`${opt.value === lane ? adminCtaChip : adminCtaChipSecondary} inline-flex`}
                  aria-current={opt.value === lane ? "page" : undefined}
                  title={opt.hint}
                >
                  {opt.label}
                </Link>
              ))}
            </nav>
          </div>
        }
      />

      <div className="mb-6">
        <AdminCategorySummaryPanel
          summary={summary}
          lang={lang}
          laneLabel={laneLabel}
          filtersActive={filtersActive}
          technicalDetails={[["Table", surface.sourceTable]]}
        />
      </div>

      <AdminPagePurposeCard
        title="Autos admin ops"
        purpose="Review dealer and private Autos listings, inspect inventory identity, and run staff lifecycle/trust actions."
        dataSource="public.autos_classifieds_listings plus owner profiles and package/analytics overlays where available."
        status="partial"
        safeActions={["View public", "Suspend", "Archive", "Republish", "Feature", "Verify Leonix"]}
        nextGate="Confirm every button and count on this page against live Supabase data before relying on it for daily decisions."
        warningNote="Public browse and dealer inventory are real; action confirmations/audit consistency still need QA proof."
      />

      <div className="mb-6">
        <AdminCategoryFilterBar
          lang={lang}
          action={autosBase}
          searchParams={sp}
          statusOptions={adminStatusOptionsForCategory("autos")}
          clearHref={appendPreservedSearchParams(autosBase, { lane: sp.lane }, scope, ["lane"])}
          searchPlaceholder={m("autosQueue.placeholderQ")}
        />
      </div>

      {listMeta.error ? (
        <div className={`${adminCardBase} border-red-200 bg-red-50 p-6 text-sm text-red-900`} role="alert" data-testid="autos-admin-read-error">
          <p className="font-bold">Autos data could not be read</p>
          <p className="mt-1 font-mono text-xs">{listMeta.error}</p>
        </div>
      ) : (
        <AdminListTruncationNotice
          lang={lang}
          className="mb-3"
          shown={rows.length}
          limit={queueLimit}
          scanCapped={listMeta.scanCapped}
          scanned={listMeta.scanned}
        />
      )}

      {listMeta.error ? null : rows.length === 0 ? (
        <div className={`${adminCardBase} p-6 text-sm text-[#5C5346]`}>
          {m("autosQueue.emptyTable")}
        </div>
      ) : (
        <div className={`${adminCardBase} overflow-x-auto p-0`}>
          <Suspense fallback={null}>
            <ClasificadosQueueActionChrome />
          </Suspense>
          <table className="min-w-full border-collapse text-left text-xs text-[#2C2416]">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="px-3 py-2">{m("listings.col.id")}</th>
                <th className="px-3 py-2">{m("listings.col.leonixId")}</th>
                <th className="px-3 py-2">{m("listings.col.title")}</th>
                <th className="px-3 py-2">{m("autosQueue.colVia")}</th>
                <th className="px-3 py-2">{m("autosQueue.colDest")}</th>
                <th className="px-3 py-2">{m("listings.col.status")}</th>
                <th className="px-3 py-2">{m("autosQueue.colVis")}</th>
                <th className="px-3 py-2">{m("autosQueue.colPub")}</th>
                <th className="px-3 py-2">Stripe</th>
                <th className="px-3 py-2">{m("listings.col.date")}</th>
                <th className="px-3 py-2">{m("listings.col.owner")}</th>
                <th className="px-3 py-2">{m("autosQueue.colImg")}</th>
                <th className="px-3 py-2" title={m("autosQueue.actionsColTitle")}>
                  {m("autosQueue.colActions")}
                </th>
                <th className="px-3 py-2">{adminTr(lang, "catShell.section.commercial")}</th>
                <th className="px-3 py-2">Monetization</th>
              </tr>
            </thead>
            <tbody>
              {orderedRows.map((r) => {
                const dash = autosClassifiedsRowToDashboardRow(r);
                const bucket = autosListingAdminVisibilityBucket(r.status);
                const vis = visLabel(bucket, m);
                const pub = formatTs(r.published_at, locale);
                const updated = formatTs(r.updated_at, locale);
                const stripeHint = autosStripeAdminHint(r);
                const payload = r.listing_payload;
                const sellerName = (payload.dealerName ?? "").trim();
                const location = [payload.city, payload.state].map((x) => x?.trim()).filter(Boolean).join(", ");
                const contactSignal = [
                  payload.dealerPhoneOffice || payload.dealerPhone,
                  payload.dealerWhatsapp,
                  payload.dealerEmail,
                  payload.dealerWebsite,
                ].some((x) => x?.trim());
                const mediaSignal = [
                  dash.thumbUrl ? "photo" : "",
                  payload.muxPlaybackId?.trim() || payload.muxPlaybackUrl?.trim() || (payload.videoUrls?.length ?? 0) > 0 ? "video" : "",
                ].filter(Boolean).join(" + ");
                const isDealerRow = r.lane === "negocios";
                // TRUE active count for this dealer group (read from the table, not the page rows);
                // null = capacity could not be read → printed as "—", never a guess.
                const dealerActiveCount = isDealerRow && capacity.available
                  ? capacity.activeByGroupKey[autosDealerGroupKey(r)] ?? 0
                  : null;
                const groupKey = grouping.groupKeyByRowId.get(r.id) ?? null;
                const group = groupKey ? grouping.groups.get(groupKey) ?? null : null;
                const groupActiveCount =
                  group && capacity.available ? capacity.activeByGroupKey[group.key] ?? 0 : null;
                const groupCapacityState = resolveDealerGroupCapacity({
                  active: groupActiveCount,
                  mainId: group?.mainId ?? null,
                  proof: packProof,
                  standardLimit: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
                  boostedLimit: capacity.boostedLimit,
                });
                const groupCapacityText = describeDealerGroupCapacity(lang, groupCapacityState);
                const childGate = isDealerRow ? autosChildParentGateState(r, parentsById) : "not_child";
                const isGroupChild = isDealerRow && r.inventory_role === "inventory_vehicle";
                const groupMainRow = group?.mainId ? parentsById.get(group.mainId) ?? null : null;
                const listingTruth = classifyPublication("autos_classifieds_listings", r as unknown as Record<string, unknown>);
                const liveHref =
                  r.status === "active"
                    ? `${autosLiveVehiclePath(r.id)}?lang=${r.lang === "en" ? "en" : "es"}`
                    : null;
                const highlighted = actionProof?.target === r.id;
                return (
                  <Fragment key={r.id}>
                  {group && grouping.groupStartRowIds.has(r.id) ? (
                    <tr className="bg-[#F4F1EA]" data-testid="autos-dealer-group-header">
                      <td colSpan={15} className="px-3 py-2 text-[11px] leading-snug text-[#3D3428]">
                        <p className="font-bold text-[#1E1810]">
                          Dealer group <span className="font-mono">{group.key.slice(0, 8)}…</span> · {group.rowIds.length} row(s) on this page
                          {group.mainOnPage ? "" : " · main listing not on this page"}
                        </p>
                        <p data-testid="autos-dealer-group-capacity">
                          {groupCapacityText.text}
                          {groupCapacityText.warning ? <span className="font-semibold text-amber-900"> · {groupCapacityText.warning}</span> : null}
                        </p>
                        <p data-testid="autos-dealer-group-parent-gate" className="text-[#5C5346]">
                          {group.mainId
                            ? groupMainRow
                              ? `Parent (main) listing ${group.mainId.slice(0, 8)}…: status ${String(groupMainRow.status ?? "unknown")} — inventory children ${
                                  groupMainRow.status === "active" ? "can be public" : "are NOT public (parent gate)"
                                }.`
                              : parentLookupError
                                ? `Parent (main) listing ${group.mainId.slice(0, 8)}…: could not be read (${parentLookupError}) — child visibility not asserted.`
                                : `Parent (main) listing ${group.mainId.slice(0, 8)}…: not found — inventory children are NOT public (parent gate).`
                            : "Parent (main) listing not identified for this group."}
                        </p>
                      </td>
                    </tr>
                  ) : null}
                  <tr id={adminQueueRowAnchorId(r.id)} className={adminQueueRowClass(highlighted)}>
                    <td className="max-w-[7rem] truncate px-3 py-2 font-mono text-[10px]" title={r.id}>
                      {isGroupChild ? <span className="mr-1 text-[#7A7164]" aria-hidden="true">↳</span> : null}
                      {r.id.slice(0, 8)}…
                    </td>
                    <td className="max-w-[9rem] truncate px-3 py-2 font-mono text-[10px]" title={r.leonix_ad_id ?? ""}>
                      {r.leonix_ad_id ?? "—"}
                    </td>
                    <td className="max-w-[18rem] px-3 py-2" title={dash.title}>
                      <p className="line-clamp-2 font-semibold">{dash.title}</p>
                      <p className="mt-1 text-[10px] font-normal text-[#5C5346]">
                        {formatUsd(payload.price, locale)}
                        {payload.mileage != null ? ` · ${formatMiles(payload.mileage, locale)}` : ""}
                        {location ? ` · ${location}` : ""}
                      </p>
                      {(sellerName || contactSignal || mediaSignal || isDealerRow) ? (
                        <p className="mt-0.5 text-[10px] font-normal text-[#7A7164]">
                          {sellerName ? sellerName : r.lane}
                          {isDealerRow ? (
                            <span
                              data-testid="autos-dealer-capacity"
                              title={
                                dealerActiveCount == null
                                  ? adminTr(lang, "catShell.autos.capacityUnavailable") + (capacity.note ? ` (${capacity.note})` : "")
                                  : undefined
                              }
                            >
                              {" · "}
                              {dealerActiveCount == null
                                ? `capacity — (${adminTr(lang, "catShell.autos.capacityUnavailable")})`
                                : groupCapacityText.text}
                              {groupCapacityText.warning ? ` · ${groupCapacityText.warning}` : ""}
                            </span>
                          ) : null}
                          {r.lane === "negocios" && r.inventory_role ? ` · role ${r.inventory_role}` : ""}
                          {r.dealer_inventory_parent_listing_id
                            ? ` · parent ${r.dealer_inventory_parent_listing_id.slice(0, 8)}…`
                            : ""}
                          {r.dealer_inventory_group_id ? ` · group ${r.dealer_inventory_group_id.slice(0, 8)}…` : ""}
                          {contactSignal ? " · contact" : ""}
                          {mediaSignal ? ` · ${mediaSignal}` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2" title={r.lane}>
                      {r.lane === "negocios" ? "Dealer" : "Privado"}
                    </td>
                    <td className="px-3 py-2">{r.featured ? m("autosQueue.yes") : m("autosQueue.no")}</td>
                    <td className="px-3 py-2">{statusLabel(r.status)}</td>
                    <td className="px-3 py-2">
                      {vis}
                      <p className="mt-1 max-w-[14rem] text-[10px] font-normal leading-snug text-[#5C5346]" data-testid="autos-listing-truth-reason">
                        {listingTruth.reason}
                      </p>
                      {r.lane === "privado" && r.expires_at ? (
                        <p className="mt-1 max-w-[14rem] text-[10px] font-normal leading-snug text-[#5C5346]" data-testid="autos-privado-term">
                          Term ends {formatTs(r.expires_at, locale)}
                        </p>
                      ) : null}
                      {isGroupChild ? (
                        <p className="mt-1 max-w-[14rem] text-[10px] font-normal leading-snug text-[#5C5346]" data-testid="autos-child-parent-gate">
                          {childGate === "satisfied"
                            ? "Parent gate: OK (active same-owner main)"
                            : childGate === "parent_not_live"
                              ? "Parent gate: parent is not an active same-owner main — NOT public"
                              : parentLookupError
                                ? "Parent gate: parent could not be read — not asserted"
                                : "Parent gate: parent not found — NOT public"}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] text-[#5C5346]">{pub}</td>
                    <td
                      className="max-w-[8rem] truncate px-3 py-2 font-mono text-[10px]"
                      title={[r.stripe_checkout_session_id, r.stripe_payment_intent_id].filter(Boolean).join(" · ") || undefined}
                    >
                      {stripeHint}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] text-[#5C5346]">{updated}</td>
                    <td className="max-w-[6rem] truncate px-3 py-2 font-mono text-[10px]" title={r.owner_user_id}>
                      {r.owner_user_id.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">{dash.thumbUrl ? m("autosQueue.yes") : m("autosQueue.no")}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-2">
                        {liveHref ? (
                          <Link
                            href={liveHref}
                            className="font-bold text-[#6B5B2E] underline"
                            target="_blank"
                            rel="noreferrer"
                            title={m("autosQueue.viewPublicTitle")}
                          >
                            {m("autosQueue.viewPublic")}
                          </Link>
                        ) : (
                          <span className="text-[#7A7164]">—</span>
                        )}
                        <ClassifiedAdminRowActions
                          variant="autos"
                          rowId={r.id}
                          leonixAdId={r.leonix_ad_id}
                          displayLabel={dash.title}
                          publicLive={r.status === "active"}
                          promoted={r.featured}
                          verified={Boolean(r.leonix_verified)}
                          canArchive={r.status !== "cancelled" && r.status !== "draft" && r.status !== "pending_payment"}
                          republishCategory="autos"
                          republishRow={{
                            lane: r.lane,
                            status: r.status,
                            republish_override: (r as { republish_override?: boolean | null }).republish_override,
                          }}
                        />
                      </div>
                    </td>
                    <td className="min-w-[12rem] max-w-[16rem] px-3 py-2 align-top" data-testid="autos-row-commercial-truth">
                      <AdminCommercialTruthSection lang={lang} truth={commercialTruthByListingId[r.id]} compact />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <AdminListingMonetizationSummary
                        category="autos"
                        source="autos_classifieds_listings"
                        listing={r as unknown as Record<string, unknown>}
                        hints={{ dualAnalyticsPipeline: true, analyticsCapability: "partial" }}
                      />
                    </td>
                  </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
