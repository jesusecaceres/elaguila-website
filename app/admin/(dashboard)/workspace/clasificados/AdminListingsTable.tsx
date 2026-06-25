"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { deleteListingAction, setListingPublishedAction, bulkSoftDeleteListingsAction, permanentlyDeleteListingsAction, type BulkListingCleanupResult } from "../../../actions";
import { Suspense, useEffect, useMemo, useState } from "react";
import { adminTableWrap, adminCardBase, adminDesktopTableOnly, adminMobileCardList } from "../../../_components/adminTheme";
import {
  adminQueueRowAnchorId,
  adminQueueRowClass,
  buildAdminActionReturnUrl,
  parseAdminActionResultParams,
  stripAdminQueueActionParams,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { ClasificadosQueueActionChrome } from "./_components/ClasificadosQueueActionChrome";
import { listingPlanFromDetailPairs } from "@/app/(site)/dashboard/lib/dashboardListingMeta";
import {
  computeEnVentaVisibilityRenewalVm,
  EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL,
  parseDetailPairValue,
} from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";
import { parseLeonixListingContract, parseLeonixMachineFacetRead } from "@/app/(site)/clasificados/lib/leonixRealEstateListingContract";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";
import { useAdminLang, useAdminT } from "@/app/admin/_components/AdminI18nProvider";
import { ClassifiedAdminQueueRowActionsPanel } from "./_components/ClassifiedAdminQueueRowActionsPanel";
import { ClassifiedAdminQueueBulkBar } from "./_components/ClassifiedAdminQueueBulkBar";
import { AdminListingMonetizationSummary } from "./_components/AdminListingMonetizationSummary";
import { AdminListingFlagTruthBlock } from "./_components/AdminListingFlagTruthBlock";
import type { ListingFlagReportContext } from "@/app/admin/_lib/adminReviewFlagContext";

type Row = {
  id: string;
  leonix_ad_id?: string | null;
  title: string | null;
  description: string | null;
  city: string | null;
  category: string | null;
  price: number | null;
  is_free: boolean | null;
  status: string | null;
  owner_id: string | null;
  created_at: string | null;
  images?: unknown;
  detail_pairs?: unknown;
  republished_at?: string | null;
  republish_count?: number | null;
  republish_override?: boolean | null;
  is_published?: boolean | null;
  leonix_verified?: boolean | null;
  admin_promoted?: boolean | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
};

export type AdminListingsTableRow = Row;

function formatAdminDateTime(ms: number, locale: string): string {
  try {
    const d = new Date(ms);
    return Number.isFinite(d.getTime())
      ? d.toLocaleString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  } catch {
    return "—";
  }
}

function leonixAdminLine(row: Row, detailPairsAvailable: boolean): string {
  if (!detailPairsAvailable) return "—";
  const lx = parseLeonixListingContract(row.detail_pairs);
  const parts: string[] = [];
  if (lx.branch) parts.push(lx.branch);
  if (lx.operation) parts.push(lx.operation);
  if (lx.categoriaPropiedad) parts.push(lx.categoriaPropiedad);
  const pub =
    row.is_published === false ? "is_published=false" : row.is_published === true ? "is_published=true" : "pub=?";
  if (!parts.length) return row.is_published === false ? pub : "—";
  return `${parts.join(" · ")} · ${pub}`;
}

function clasificadosLeonixAdminLine(row: Row, detailPairsAvailable: boolean): string {
  const base = leonixAdminLine(row, detailPairsAvailable);
  if (!detailPairsAvailable) return base;
  const cat = (row.category ?? "").toLowerCase();
  if (cat === "rentas") {
    const rx = parseRentasDetailMachineRead(row.detail_pairs);
    const bits: string[] = [];
  if (rx.leaseTermCode) bits.push(`lease:${rx.leaseTermCode}`);
  if (rx.depositUsdDigits) bits.push(`dep:${rx.depositUsdDigits}`);
  if (rx.listingStatus) bits.push(`avail:${rx.listingStatus}`);
  if (rx.mapUrl) bits.push("map");
  if (rx.videoUrl) bits.push("video");
  if (rx.halfBathsDigits) bits.push(`½:${rx.halfBathsDigits}`);
  if (rx.servicesIncluded) bits.push("services:…");
  if (rx.businessWebsite) bits.push("web");
  if (rx.businessSocial) bits.push("social");
  return bits.length ? `${base} · ${bits.join(" · ")}` : base;
  }
  if (cat === "bienes-raices") {
    const br = parseLeonixMachineFacetRead(row.detail_pairs);
    const bits: string[] = [];
    if (br.resultsPropertyKind) bits.push(`kind:${br.resultsPropertyKind}`);
    if (br.bedroomsCount != null) bits.push(`bd:${br.bedroomsCount}`);
    if (br.bathroomsCount != null) bits.push(`ba:${br.bathroomsCount}`);
    if (br.postalCode) bits.push(`zip:${br.postalCode}`);
    if (br.pool === true) bits.push("pool");
    if (br.petsAllowed === true) bits.push("pets");
    else if (br.petsAllowed === false) bits.push("pets:no");
    if (br.furnished === true) bits.push("furn");
    const invRole = row.inventory_role?.trim();
    if (invRole) bits.push(`inv:${invRole}`);
    if (row.br_inventory_group_id) bits.push("inv-group");
    if (row.br_inventory_parent_listing_id) bits.push("inv-parent");
    return bits.length ? `${base} · ${bits.join(" · ")}` : base;
  }
  return base;
}

function adminDisplayLeonixAdId(row: Row): string {
  const cat = (row.category ?? "").toLowerCase();
  if (cat === "clases" || cat === "comunidad" || cat === "busco") return formatLeonixAdId(row.id) ?? "—";
  const stored = row.leonix_ad_id?.trim();
  if (stored) return stored;
  return "—";
}

function adminListingsCategoryLabel(category: string | null): string {
  const c = (category ?? "").trim().toLowerCase();
  if (c === "busco") return "Looking for / Wanted";
  return (category ?? "").trim() || "—";
}

function enVentaVisibilityAdminLine(
  row: Row,
  detailPairsAvailable: boolean,
  republishColsAvailable: boolean,
  t: (key: string, vars?: Record<string, string | number>) => string,
  locale: string,
): string {
  if ((row.category ?? "").toLowerCase() !== "en-venta") return "—";
  if (!detailPairsAvailable) return t("listings.envLine.missingDetailPairs");
  const plan = listingPlanFromDetailPairs(row.detail_pairs);
  const lastIso = parseDetailPairValue(row.detail_pairs, EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL);
  const lastPart = lastIso
    ? `${t("listings.envLine.lastRenew")} ${formatAdminDateTime(new Date(lastIso).getTime(), locale)}`
    : `${t("listings.envLine.lastRenew")} —`;
  const repPart = !republishColsAvailable
    ? "republish N/A"
    : row.republished_at
      ? `last move to top ${formatAdminDateTime(new Date(String(row.republished_at)).getTime(), locale)}`
      : "never moved to top";
  const cnt = republishColsAvailable && row.republish_count != null ? ` · count ${row.republish_count}` : "";
  if (plan === "free") return `free · ${lastPart} · ${repPart}${cnt}`;

  const vm = computeEnVentaVisibilityRenewalVm({
    plan: "pro",
    republishedAt: row.republished_at,
    detailPairs: row.detail_pairs,
    nowMs: Date.now(),
  });
  const renewPart = !republishColsAvailable
    ? "renew N/A"
    : vm?.canRenewNow
      ? t("listings.envLine.renewOk")
      : vm
        ? `renew≥ ${formatAdminDateTime(vm.nextRenewEligibleAt, locale)}`
        : t("listings.envLine.renewDash");

  return `pro · ${lastPart} · ${repPart}${cnt} · ${renewPart}`;
}

export default function AdminListingsTable({
  listings,
  detailPairsAvailable = true,
  republishColsAvailable = true,
  listingsCategorySlug,
  staffQueueMode = false,
  flagReportByListingId = {},
  ownerEmailByUserId = {},
}: {
  listings: Row[];
  /** When false, DB has no `listings.detail_pairs` — En Venta visibility column is degraded. */
  detailPairsAvailable?: boolean;
  /** When false, select omitted republish columns — En Venta visibility column is degraded. */
  republishColsAvailable?: boolean;
  /** Active `?category=` filter (registry slug), for empty-state copy. */
  listingsCategorySlug?: string;
  /** Restaurante-style staff PATCH actions (Leonix ops). */
  staffQueueMode?: boolean;
  flagReportByListingId?: Record<string, ListingFlagReportContext>;
  ownerEmailByUserId?: Record<string, string>;
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const t = useAdminT();
  const lang = useAdminLang();
  const locale = "en-US";
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishBusyId, setPublishBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const queueStatusFilter = (searchParams?.get("status") ?? "").trim();
  const visibleRowIds = useMemo(() => listings.map((r) => r.id), [listings]);
  const visibleRowIdsKey = visibleRowIds.join(",");

  useEffect(() => {
    setSelectedIds(new Set());
  }, [visibleRowIdsKey]);

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleRowIds.some((id) => selectedIds.has(id));

  const selectedRows = useMemo(
    () => listings.filter((r) => selectedIds.has(r.id)),
    [listings, selectedIds],
  );

  function toggleRowSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisibleSelected() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visibleRowIds));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function buildBulkProofLabel(result: BulkListingCleanupResult, rows: Row[], verb: string): string {
    const idToLeonix = new Map(rows.map((r) => [r.id, adminDisplayLeonixAdId(r)]));
    const samples = result.sampleIds
      .map((id) => {
        const lx = idToLeonix.get(id);
        return lx && lx !== "—" ? lx : id.slice(0, 8) + "…";
      })
      .join(", ");
    if (result.failed > 0) {
      return `${verb} ${result.deleted}, failed ${result.failed}${samples ? ` — ${samples}` : ""} — see details`;
    }
    return `${verb} ${result.deleted} listing(s)${samples ? ` — ${samples}` : ""}`;
  }

  function redirectAfterBulkAction(
    rows: Row[],
    action: "bulk_soft_delete" | "bulk_permanent_delete",
    result: BulkListingCleanupResult,
    verb: string,
  ) {
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const anchorRow = rows[0] ?? listings[0];
    if (!anchorRow) return;
    const meta = rowProofMeta(anchorRow);
    const summary = buildBulkProofLabel(result, rows, verb);
    const status = result.deleted > 0 ? "success" : "error";
    const url = buildAdminActionReturnUrl({
      returnTo,
      action_status: status,
      action,
      target: anchorRow.id,
      target_label: summary,
      target_ad_id: meta.leonixAdId !== "—" ? meta.leonixAdId : undefined,
      scroll_y: scrollY,
      action_error: result.failed > 0 ? result.errors.join("; ") : undefined,
      hash_anchor: "queue",
    });
    window.location.assign(url);
  }

  async function handleBulkSoftDelete() {
    const rows = selectedRows.filter((r) => r.status !== "removed");
    if (rows.length === 0) {
      setError("Selected rows are already removed.");
      return;
    }
    const msg = `Soft delete ${rows.length} listing(s)?\n\nSets status to removed. Not permanent.`;
    if (!confirm(msg)) return;
    setBulkBusy(true);
    setError(null);
    try {
      const result = await bulkSoftDeleteListingsAction(rows.map((r) => r.id));
      clearSelection();
      redirectAfterBulkAction(rows, "bulk_soft_delete", result, "Deleted");
    } catch (e) {
      const msgErr = e instanceof Error ? e.message : t("listings.errDelete");
      setError(msgErr);
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkPermanentDelete() {
    const rows = selectedRows;
    if (rows.length === 0) return;
    const typed = window.prompt(
      `Permanent delete ${rows.length} listing(s). This cannot be undone.\n\nType PERMANENTLY DELETE to confirm.`,
    );
    if (typed?.trim() !== "PERMANENTLY DELETE") return;
    setBulkBusy(true);
    setError(null);
    try {
      const result = await permanentlyDeleteListingsAction(rows.map((r) => r.id));
      clearSelection();
      redirectAfterBulkAction(rows, "bulk_permanent_delete", result, "Permanently deleted");
    } catch (e) {
      const msgErr = e instanceof Error ? e.message : "Permanent delete failed";
      setError(msgErr);
    } finally {
      setBulkBusy(false);
    }
  }

  const highlightTargetId = useMemo(() => {
    if (!searchParams) return "";
    const proof = parseAdminActionResultParams(searchParams);
    return proof?.target ?? "";
  }, [searchParams]);

  const returnTo = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    stripAdminQueueActionParams(sp);
    const q = sp.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  function rowProofMeta(row: Row) {
    return {
      leonixAdId: adminDisplayLeonixAdId(row),
      displayLabel: row.title ?? row.id,
    };
  }

  function redirectAfterStaffAction(
    row: Row,
    action: string,
    status: "success" | "error",
    actionError?: string,
  ) {
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const meta = rowProofMeta(row);
    const url = buildAdminActionReturnUrl({
      returnTo,
      action_status: status,
      action,
      target: row.id,
      target_label: meta.displayLabel,
      target_ad_id: meta.leonixAdId !== "—" ? meta.leonixAdId : undefined,
      scroll_y: scrollY,
      action_error: actionError,
    });
    window.location.assign(url);
  }

  async function handleDelete(row: Row) {
    if (!confirm(t("listings.confirmDelete"))) return;
    setDeletingId(row.id);
    setError(null);
    const scrollY = window.scrollY;
    try {
      await deleteListingAction(row.id);
      const meta = rowProofMeta(row);
      const url = buildAdminActionReturnUrl({
        returnTo,
        action_status: "success",
        action: "delete",
        target: row.id,
        target_label: meta.displayLabel,
        target_ad_id: meta.leonixAdId !== "—" ? meta.leonixAdId : undefined,
        scroll_y: scrollY,
      });
      window.location.assign(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("listings.errDelete");
      redirectAfterStaffAction(row, "delete", "error", msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPublished(row: Row, published: boolean) {
    const msg = published ? t("listings.confirmShow") : t("listings.confirmHide");
    if (!confirm(msg)) return;
    setPublishBusyId(row.id);
    setError(null);
    const action = published ? "show_public" : "hide_public";
    try {
      await setListingPublishedAction(row.id, published);
      redirectAfterStaffAction(row, action, "success");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : t("listings.errPublish");
      redirectAfterStaffAction(row, action, "error", errMsg);
    } finally {
      setPublishBusyId(null);
    }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return Number.isFinite(d.getTime())
        ? d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—";
    } catch {
      return "—";
    }
  }

  if (listings.length === 0) {
    return (
      <div
        className={`rounded-2xl border p-6 text-sm ${
          listingsCategorySlug ? "border-amber-200/90 bg-amber-50/90 text-amber-950" : "border-[#E8DFD0] bg-[#FAF7F2]/80 text-[#5C5346]"
        }`}
        role="status"
      >
        {listingsCategorySlug ? (
          <>
            <p className="font-bold text-[#1E1810]">{t("listings.emptyCategoryTitle")}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">
              {t("listings.emptyCategoryBody", {
                slug: listingsCategorySlug,
                rentasExtra: listingsCategorySlug === "rentas" ? t("listings.emptyRentasExtra") : "",
              })}
            </p>
          </>
        ) : (
          t("listings.emptyGlobal")
        )}
      </div>
    );
  }

  const enVentaColumnDegraded = !detailPairsAvailable || !republishColsAvailable;
  const envVisTitle = !detailPairsAvailable
    ? t("listings.col.envVisTitleNoDetailPairs")
    : !republishColsAvailable
      ? "Republish columns not available — apply classifieds_republish_capability migration"
      : t("listings.col.envVisTitleOk");

  return (
    <>
      <Suspense fallback={null}>
        <ClasificadosQueueActionChrome />
      </Suspense>

      <div
        className={`${adminCardBase} mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-xs text-[#5C5346]`}
        data-testid="clasificados-queue-summary"
      >
        {staffQueueMode ? (
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 sm:min-h-0">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              ref={(el) => {
                if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
              }}
              onChange={toggleAllVisibleSelected}
              className="size-4 shrink-0 rounded border-[#C9B46A] accent-[#5C4E2E]"
              aria-label="Select all visible listings"
              data-testid="clasificados-select-all-visible"
            />
            <span className="font-semibold text-[#5C4E2E]">Select all visible</span>
          </label>
        ) : null}
        <span className="font-bold text-[#1E1810]">
          {listings.length} {listings.length === 1 ? "listing" : "listings"}
        </span>
        {listingsCategorySlug ? (
          <span className="rounded-md border border-[#C9B46A]/50 bg-[#FFFCF7] px-2 py-0.5 font-semibold text-[#5C4E2E]">
            category: {listingsCategorySlug}
          </span>
        ) : null}
        {queueStatusFilter === "flagged" ? (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-900">
            flagged filter active
          </span>
        ) : null}
        <span>
          pending {listings.filter((r) => r.status === "pending").length} · flagged{" "}
          {listings.filter((r) => r.status === "flagged").length} · removed{" "}
          {listings.filter((r) => r.status === "removed").length}
        </span>
        {staffQueueMode && selectedCount > 0 ? (
          <span className="font-bold text-[#1E1810]" data-testid="clasificados-summary-selected-count">
            {selectedCount} selected
          </span>
        ) : null}
      </div>

      {staffQueueMode ? (
        <ClassifiedAdminQueueBulkBar
          selectedCount={selectedCount}
          onClear={clearSelection}
          onSoftDelete={handleBulkSoftDelete}
          onPermanentDelete={handleBulkPermanentDelete}
          busy={bulkBusy}
          showPermanentDelete
          statusFilter={queueStatusFilter}
        />
      ) : null}

      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

    <div className={`${adminTableWrap} ${adminDesktopTableOnly}`} data-testid="clasificados-desktop-table">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90">
              {staffQueueMode ? (
                <>
                  <th className="w-10 p-2 font-semibold text-[#5C4E2E]">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="min-w-[220px] p-3 font-semibold text-[#5C4E2E]">{t("listings.col.title")}</th>
                  <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.category")}</th>
                  <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.status")}</th>
                  <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.owner")}</th>
                  <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.date")}</th>
                  <th className="min-w-[18rem] border-l-2 border-[#C9B46A]/40 bg-[#FFFCF7]/95 p-3 font-semibold text-[#5C4E2E]">
                    {t("listings.col.actions")}
                  </th>
                </>
              ) : (
                <>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.id")}</th>
              <th className="min-w-[9rem] p-3 font-semibold text-[#5C4E2E]">{t("listings.col.leonixId")}</th>
              <th className="min-w-[180px] p-3 font-semibold text-[#5C4E2E]">{t("listings.col.title")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.category")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.city")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.price")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.status")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.actions")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.owner")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.date")}</th>
              <th
                className={
                  detailPairsAvailable
                    ? "min-w-[200px] p-3 font-semibold text-[#5C4E2E]"
                    : "min-w-[200px] bg-amber-50/90 p-3 font-semibold text-amber-950"
                }
                title={t("listings.col.leonixTitle")}
              >
                {t("listings.col.leonix")}
              </th>
              <th className="min-w-[280px] p-3 font-semibold text-[#5C4E2E]">
                Monetization
              </th>
              <th
                className={
                  enVentaColumnDegraded
                    ? "min-w-[220px] bg-amber-50/90 p-3 font-semibold text-amber-950"
                    : "min-w-[220px] p-3 font-semibold text-[#5C4E2E]"
                }
                title={envVisTitle}
              >
                {t("listings.col.envVis")}
              </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {listings.map((row) => {
              const displayLeonixAdId = adminDisplayLeonixAdId(row);
              const highlighted = highlightTargetId === row.id;
              return (
              <tr
                key={row.id}
                id={adminQueueRowAnchorId(row.id)}
                className={adminQueueRowClass(highlighted)}
              >
                {staffQueueMode ? (
                  <>
                    <td className="w-10 p-2 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRowSelected(row.id)}
                        className="size-4 rounded border-[#C9B46A] accent-[#5C4E2E]"
                        aria-label={`Select ${row.title ?? row.id}`}
                        data-testid="clasificados-row-checkbox"
                      />
                    </td>
                    <td className="max-w-[280px] p-3 align-top">
                      <p className="font-semibold text-[#1E1810] break-words" title={row.title ?? ""}>
                        {row.title ?? "—"}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-[#3D3428] break-all" title={displayLeonixAdId}>
                        {displayLeonixAdId}
                      </p>
                      <p className="mt-1 text-xs text-[#5C5346]">
                        {row.city ?? "—"} · {row.is_free ? t("listings.free") : row.price != null ? `$${row.price}` : "—"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase">
                        <span className="rounded-md border border-[#C9B46A]/50 bg-[#FFFCF7] px-1.5 py-0.5 text-[#5C4E2E]">
                          {row.admin_promoted ? t("autosQueue.yes") : t("autosQueue.no")} featured
                        </span>
                        <span className="rounded-md border border-[#2A4536]/30 bg-[#F4FAF2] px-1.5 py-0.5 text-[#2A4536]">
                          {row.leonix_verified ? t("autosQueue.yes") : t("autosQueue.no")} verified
                        </span>
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <span className="rounded-md bg-[#FBF7EF] px-2 py-0.5 text-xs font-semibold text-[#5C4E2E]">
                        {adminListingsCategoryLabel(row.category)}
                      </span>
                    </td>
                    <td className="p-3 align-top">
                      <span
                        className={
                          row.status === "removed"
                            ? "font-bold text-red-700"
                            : row.status === "pending" || row.status === "flagged"
                              ? "font-bold text-amber-800"
                              : "font-semibold text-[#5C5346]"
                        }
                      >
                        {row.status ?? "active"}
                      </span>
                      <AdminListingFlagTruthBlock
                        status={row.status}
                        report={flagReportByListingId[row.id]}
                        compact
                      />
                    </td>
                    <td className="p-3 align-top">
                      {row.owner_id ? (
                        <Link
                          href={`/admin/usuarios/${row.owner_id}`}
                          className="text-xs font-semibold text-[#6B5B2E] underline"
                          title={t("listings.ownerCard")}
                        >
                          {t("listings.ownerCard")}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 align-top text-[#7A7164]">{formatDate(row.created_at)}</td>
                    <td className="min-w-[18rem] border-l-2 border-[#C9B46A]/40 bg-[#FFFCF7]/95 p-3 align-top">
                      <ClassifiedAdminQueueRowActionsPanel
                        row={row}
                        displayLeonixAdId={displayLeonixAdId}
                        layout="compact"
                        staffQueueMode={staffQueueMode}
                        publishBusyId={publishBusyId}
                        deletingId={deletingId}
                        onSetPublished={handleSetPublished}
                        onDelete={handleDelete}
                        ownerEmail={row.owner_id ? ownerEmailByUserId[row.owner_id] ?? null : null}
                      />
                    </td>
                  </>
                ) : (
                  <>
                <td className="p-3 font-mono text-xs text-[#3D3428]">{row.id.slice(0, 8)}…</td>
                <td className="max-w-[10rem] truncate p-3 font-mono text-[10px] text-[#3D3428]" title={displayLeonixAdId}>
                  {displayLeonixAdId}
                </td>
                <td className="max-w-[200px] truncate p-3 text-[#1E1810]" title={row.title ?? ""}>
                  {row.title ?? "—"}
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 text-xs font-semibold text-[#5C4E2E]">
                    {adminListingsCategoryLabel(row.category)}
                  </span>
                </td>
                <td className="p-3 text-[#3D3428]">{row.city ?? "—"}</td>
                <td className="p-3">{row.is_free ? t("listings.free") : row.price != null ? `$${row.price}` : "—"}</td>
                <td className="p-3">
                  <span
                    className={
                      row.status === "removed"
                        ? "text-red-700"
                        : row.status === "pending" || row.status === "flagged"
                          ? "font-bold text-amber-800"
                          : "text-[#5C5346]"
                    }
                  >
                    {row.status ?? "active"}
                  </span>
                </td>
                <td className="p-3 align-top">
                  <ClassifiedAdminQueueRowActionsPanel
                    row={row}
                    displayLeonixAdId={displayLeonixAdId}
                    layout="compact"
                    staffQueueMode={staffQueueMode}
                    publishBusyId={publishBusyId}
                    deletingId={deletingId}
                    onSetPublished={handleSetPublished}
                    onDelete={handleDelete}
                    ownerEmail={row.owner_id ? ownerEmailByUserId[row.owner_id] ?? null : null}
                  />
                </td>
                <td className="p-3">
                  {row.owner_id ? (
                    <Link
                      href={`/admin/usuarios/${row.owner_id}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center text-xs font-semibold text-[#6B5B2E] underline sm:min-h-0 sm:min-w-0"
                      title={t("listings.ownerCard")}
                    >
                      {t("listings.ownerCard")}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-[#7A7164]">{formatDate(row.created_at)}</td>
                <td
                  className={
                    detailPairsAvailable
                      ? "max-w-[240px] p-3 align-top text-[11px] leading-snug text-[#5C5346]"
                      : "max-w-[240px] bg-amber-50/40 p-3 align-top text-[11px] leading-snug text-amber-950"
                  }
                  title={clasificadosLeonixAdminLine(row, detailPairsAvailable)}
                >
                  {clasificadosLeonixAdminLine(row, detailPairsAvailable)}
                </td>
                <td className="max-w-[320px] p-3 align-top">
                  <AdminListingMonetizationSummary
                    category={row.category}
                    source="listings"
                    listing={row as Record<string, unknown>}
                    detailPairs={row.detail_pairs}
                    hints={{ analyticsCapability: "partial" }}
                  />
                </td>
                <td
                  className={
                    enVentaColumnDegraded
                      ? "max-w-[280px] bg-amber-50/40 p-3 align-top text-[11px] leading-snug text-amber-950"
                      : "max-w-[280px] p-3 align-top text-[11px] leading-snug text-[#5C5346]"
                  }
                  title={enVentaVisibilityAdminLine(row, detailPairsAvailable, republishColsAvailable, t, locale)}
                >
                  {enVentaVisibilityAdminLine(row, detailPairsAvailable, republishColsAvailable, t, locale)}
                </td>
                  </>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    <div className={`${adminMobileCardList} min-w-0 overflow-x-hidden`} data-testid="clasificados-mobile-list">
      {listings.length === 0 ? (
        <p className="rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-8 text-center text-sm text-[#7A7164]">
          {t("listings.emptyGlobal")}
        </p>
      ) : (
        listings.map((row) => {
          const displayLeonixAdId = adminDisplayLeonixAdId(row);
          const highlighted = highlightTargetId === row.id;
          return (
            <article
              key={row.id}
              id={adminQueueRowAnchorId(row.id)}
              className={`${adminCardBase} break-words p-4 ${highlighted ? "ring-2 ring-[#C9B46A]" : ""}`}
              data-testid="clasificados-mobile-card"
            >
              {staffQueueMode ? (
                <div className="mb-3 flex items-center gap-2 border-b border-[#E8DFD0]/70 pb-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleRowSelected(row.id)}
                    className="size-5 shrink-0 rounded border-[#C9B46A] accent-[#5C4E2E]"
                    aria-label={`Select ${row.title ?? row.id}`}
                    data-testid="clasificados-mobile-row-checkbox"
                  />
                  <span className="text-xs font-semibold text-[#5C5346]">Select row</span>
                </div>
              ) : null}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 text-base font-bold text-[#1E1810] break-words">{row.title ?? "—"}</h3>
                <span
                  className={
                    row.status === "removed"
                      ? "rounded-md border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-800"
                      : row.status === "pending" || row.status === "flagged"
                        ? "rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900"
                        : "rounded-md border border-[#E8DFD0] bg-[#FAF3E6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#3D3629]"
                  }
                >
                  {row.status ?? "active"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-[#5C5346]">
                <span className="font-semibold text-[#5C4E2E]">{adminListingsCategoryLabel(row.category)}</span>
                <span>
                  {row.city ?? "—"} · {row.is_free ? t("listings.free") : row.price != null ? `$${row.price}` : "—"}
                </span>
                <span className="font-mono text-[10px] break-all text-[#3D3428]">{displayLeonixAdId}</span>
                <span className="text-[#7A7164]">{formatDate(row.created_at)}</span>
                {staffQueueMode ? (
                  <span className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold uppercase">
                    <span className="rounded-md border border-[#C9B46A]/50 bg-[#FFFCF7] px-1.5 py-0.5 text-[#5C4E2E]">
                      {row.admin_promoted ? t("autosQueue.yes") : t("autosQueue.no")} featured
                    </span>
                    <span className="rounded-md border border-[#2A4536]/30 bg-[#F4FAF2] px-1.5 py-0.5 text-[#2A4536]">
                      {row.leonix_verified ? t("autosQueue.yes") : t("autosQueue.no")} verified
                    </span>
                  </span>
                ) : null}
              </div>
              <AdminListingFlagTruthBlock status={row.status} report={flagReportByListingId[row.id]} />
              <div className="mt-4 border-t border-[#E8DFD0]/80 pt-3">
                <ClassifiedAdminQueueRowActionsPanel
                  row={row}
                  displayLeonixAdId={displayLeonixAdId}
                  layout="card"
                  staffQueueMode={staffQueueMode}
                  publishBusyId={publishBusyId}
                  deletingId={deletingId}
                  onSetPublished={handleSetPublished}
                  onDelete={handleDelete}
                  ownerEmail={row.owner_id ? ownerEmailByUserId[row.owner_id] ?? null : null}
                />
              </div>
            </article>
          );
        })
      )}
    </div>
    </>
  );
}
