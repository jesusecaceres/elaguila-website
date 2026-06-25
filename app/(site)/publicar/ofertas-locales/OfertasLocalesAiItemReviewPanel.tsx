"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchOfertaLocalReviewItems,
  patchOfertaLocalReviewItem,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewClient";
import type {
  OfertaLocalDraft,
  OfertaLocalItemReviewStatus,
  OfertaLocalItemReviewViewModel,
  OfertaLocalScanJobSummary,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

const CARD = "rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-3 shadow-sm";
const INPUT =
  "w-full rounded-lg border border-[#D4C4A8]/90 bg-white px-2.5 py-2 text-sm text-[#1E1814] focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/20";
const BTN_PRIMARY =
  "rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_SECONDARY =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const BTN_FILTER =
  "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide";

type ReviewFilter = "all" | OfertaLocalItemReviewStatus;

type Props = {
  lang: OfertasLocalesAppLang;
  ofertaLocalId?: string | null;
  scanJobId?: string | null;
  reviewMode?: "weekly" | "coupon";
  variant?: "grid" | "workspace";
  draft?: OfertaLocalDraft;
  selectedSourceAssetId?: string | null;
  highlightScanJobId?: string | null;
};

type ItemDraft = {
  itemName: string;
  priceText: string;
  priceAmount: string;
  regularPriceText: string;
  unit: string;
  category: string;
  description: string;
  terms: string;
  dealType: string;
  searchTags: string;
};

function toDraft(item: OfertaLocalItemReviewViewModel): ItemDraft {
  return {
    itemName: isCouponItem(item) ? item.couponTitle || item.itemName : item.itemName,
    priceText: isCouponItem(item) ? item.offerText || item.priceText : item.priceText,
    priceAmount: item.priceAmount != null ? String(item.priceAmount) : "",
    regularPriceText: item.regularPriceText,
    unit: item.unit,
    category: item.category,
    description: item.description,
    terms: item.terms || item.dealType,
    dealType: item.dealType,
    searchTags: item.searchTags.join(", "),
  };
}

function isCouponItem(item: OfertaLocalItemReviewViewModel): boolean {
  return item.candidateType === "coupon" || item.candidateType === "promo";
}

function patchFromDraft(draft: ItemDraft, isCouponMode: boolean, reviewStatus?: OfertaLocalItemReviewStatus) {
  return {
    itemName: draft.itemName,
    priceText: draft.priceText,
    priceAmount: draft.priceAmount.trim() ? Number(draft.priceAmount) : null,
    regularPriceText: draft.regularPriceText,
    unit: draft.unit,
    category: draft.category,
    description: draft.description,
    couponTitle: isCouponMode ? draft.itemName : undefined,
    offerText: isCouponMode ? draft.priceText : undefined,
    terms: isCouponMode ? draft.terms : undefined,
    dealType: draft.dealType,
    searchTags: draft.searchTags
      .split(/[,;]+/)
      .map((t) => t.trim())
      .filter(Boolean),
    reviewStatus,
  };
}

function statusBadgeClass(status: OfertaLocalItemReviewStatus): string {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-900";
    case "rejected":
      return "bg-red-100 text-red-900";
    case "needs_review":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function confidenceLabelText(
  label: OfertaLocalItemReviewViewModel["confidenceLabel"],
  lang: OfertasLocalesAppLang
): string {
  const es = { high: "Alta", medium: "Media", low: "Baja", unknown: "Desconocida" };
  const en = { high: "High", medium: "Medium", low: "Low", unknown: "Unknown" };
  return (lang === "en" ? en : es)[label];
}

function sourceFileLabel(
  item: OfertaLocalItemReviewViewModel,
  draft: OfertaLocalDraft | undefined,
  lang: OfertasLocalesAppLang
): string {
  if (item.sourceFileName) return item.sourceFileName;
  if (!draft || !item.sourceAssetId) return item.sourceAssetId || "";
  const flyer = draft.flyerAssets.find((a) => a.id === item.sourceAssetId);
  if (flyer) {
    return flyer.fileName || (lang === "en" ? "Main flyer" : "Volante principal");
  }
  const coupon = draft.couponAssets.find((a) => a.id === item.sourceAssetId);
  if (coupon) {
    return coupon.fileName || (lang === "en" ? "Coupon file" : "Archivo de cupón");
  }
  return item.sourceAssetId;
}

function ItemReviewCard({
  item,
  draft,
  draftFields,
  lang,
  isCouponMode,
  busy,
  compact = false,
  onFieldChange,
  onSave,
  onStatus,
}: {
  item: OfertaLocalItemReviewViewModel;
  draft?: OfertaLocalDraft;
  draftFields: ItemDraft;
  lang: OfertasLocalesAppLang;
  isCouponMode: boolean;
  busy: boolean;
  compact?: boolean;
  onFieldChange: (field: keyof ItemDraft, value: string) => void;
  onSave: () => void;
  onStatus: (status: OfertaLocalItemReviewStatus) => void;
}) {
  const c = ofertasLocalesAppCopy(lang);
  const [ocrOpen, setOcrOpen] = useState(false);
  const ocrContext = item.sourceContext?.trim();
  const cardClass = compact
    ? "rounded-lg border border-[#D4C4A8]/70 bg-white px-3 py-2.5 shadow-sm"
    : CARD;
  const inputClass = compact
    ? "w-full rounded-md border border-[#D4C4A8]/90 bg-white px-2 py-1.5 text-xs text-[#1E1814] focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/20"
    : INPUT;

  return (
    <div className={cardClass}>
      <div className={`flex flex-wrap items-center justify-between gap-2 ${compact ? "mb-2" : "mb-3"}`}>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadgeClass(item.reviewStatus)}`}
        >
          {item.reviewStatus.replace("_", " ")}
        </span>
        <span className="text-[10px] text-[#1E1814]/55">
          {c.aiReviewConfidence}: {confidenceLabelText(item.confidenceLabel, lang)}
        </span>
      </div>

      <div
        className={`mb-2 rounded-md border border-[#D4C4A8]/40 bg-[#FDF8F0]/80 px-2 py-1.5 text-[10px] leading-snug text-[#1E1814]/65 ${
          compact ? "flex flex-wrap gap-x-3 gap-y-0.5" : ""
        }`}
      >
        <span>
          <span className="font-semibold uppercase text-[#1E1814]/45">{c.aiReviewSourceFile}:</span>{" "}
          {sourceFileLabel(item, draft, lang)}
        </span>
        {item.sourcePage != null ? (
          <span>
            <span className="font-semibold uppercase text-[#1E1814]/45">{c.aiReviewSourcePage}:</span>{" "}
            {item.sourcePage}
          </span>
        ) : null}
      </div>

      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
          {isCouponMode ? (lang === "en" ? "Coupon title" : "Título del cupón") : c.aiReviewItemName}
          <input
            className={`${inputClass} mt-0.5`}
            value={draftFields.itemName}
            onChange={(e) => onFieldChange("itemName", e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
            {isCouponMode
              ? lang === "en"
                ? "Offer text"
                : "Texto de oferta"
              : c.aiReviewPriceText}
            <input
              className={`${inputClass} mt-0.5`}
              value={draftFields.priceText}
              onChange={(e) => onFieldChange("priceText", e.target.value)}
            />
          </label>
          <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
            {c.aiReviewPriceAmount}
            <input
              className={`${inputClass} mt-0.5`}
              value={draftFields.priceAmount}
              onChange={(e) => onFieldChange("priceAmount", e.target.value)}
            />
          </label>
        </div>
        {!isCouponMode ? (
          <div className="grid grid-cols-2 gap-1.5">
            <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
              {c.aiReviewRegularPrice}
              <input
                className={`${inputClass} mt-0.5`}
                value={draftFields.regularPriceText}
                onChange={(e) => onFieldChange("regularPriceText", e.target.value)}
              />
            </label>
            <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
              {c.aiReviewUnit}
              <input
                className={`${inputClass} mt-0.5`}
                value={draftFields.unit}
                onChange={(e) => onFieldChange("unit", e.target.value)}
              />
            </label>
          </div>
        ) : null}
        {!isCouponMode ? (
          <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
            {c.aiReviewCategory}
            <input
              className={`${inputClass} mt-0.5`}
              value={draftFields.category}
              onChange={(e) => onFieldChange("category", e.target.value)}
            />
          </label>
        ) : null}
        <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
          {isCouponMode ? c.aiReviewTerms : c.aiReviewDescription}
          <textarea
            className={`${inputClass} mt-0.5 ${compact ? "min-h-[44px]" : "min-h-[56px]"}`}
            value={isCouponMode ? draftFields.terms : draftFields.description}
            onChange={(e) => onFieldChange(isCouponMode ? "terms" : "description", e.target.value)}
          />
        </label>
        <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
          {c.aiReviewTags}
          <input
            className={`${inputClass} mt-0.5`}
            value={draftFields.searchTags}
            onChange={(e) => onFieldChange("searchTags", e.target.value)}
            placeholder={lang === "en" ? "comma separated" : "separadas por coma"}
          />
        </label>
      </div>

      {ocrContext ? (
        <div className="mt-2">
          <button
            type="button"
            className="text-[10px] font-medium text-[#7A1E2C]/80 underline decoration-[#7A1E2C]/30"
            onClick={() => setOcrOpen((v) => !v)}
          >
            {ocrOpen ? c.aiReviewHideOcrContext : c.aiReviewViewOcrContext}
          </button>
          {ocrOpen ? (
            <p className="mt-1 max-h-20 overflow-y-auto rounded border border-[#D4C4A8]/40 bg-[#FDF8F0]/60 px-2 py-1 text-[10px] leading-relaxed text-[#1E1814]/55">
              {ocrContext}
            </p>
          ) : null}
        </div>
      ) : null}

      {item.reviewStatus === "approved" ? (
        <p className="mt-2 text-[10px] font-medium text-emerald-800">
          {item.isActive ? c.aiReviewApprovedPublic : c.aiReviewApprovedNote}
        </p>
      ) : null}

      <div className={`flex flex-wrap gap-1.5 ${compact ? "mt-2" : "mt-3"}`}>
        <button type="button" className={BTN_SECONDARY} disabled={busy} onClick={onSave}>
          {c.aiReviewSave}
        </button>
        <button type="button" className={BTN_PRIMARY} disabled={busy} onClick={() => onStatus("approved")}>
          {c.aiReviewApprove}
        </button>
        <button type="button" className={BTN_SECONDARY} disabled={busy} onClick={() => onStatus("needs_review")}>
          {c.aiReviewNeedsReview}
        </button>
        <button type="button" className={BTN_SECONDARY} disabled={busy} onClick={() => onStatus("rejected")}>
          {c.aiReviewReject}
        </button>
      </div>
    </div>
  );
}

export function OfertasLocalesAiItemReviewPanel({
  lang,
  ofertaLocalId,
  scanJobId,
  reviewMode = "weekly",
  variant = "grid",
  draft,
  selectedSourceAssetId,
  highlightScanJobId,
}: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const isCouponMode = reviewMode === "coupon";
  const isWorkspace = variant === "workspace";

  const [items, setItems] = useState<OfertaLocalItemReviewViewModel[]>([]);
  const [scanJobs, setScanJobs] = useState<OfertaLocalScanJobSummary[]>([]);
  const [summary, setSummary] = useState<Record<OfertaLocalItemReviewStatus, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReviewFilter>("all");
  const [focusIndex, setFocusIndex] = useState(0);

  const loadItems = useCallback(async () => {
    if (!ofertaLocalId?.trim()) return;
    setLoading(true);
    setError(null);
    const result = await fetchOfertaLocalReviewItems(
      ofertaLocalId,
      isWorkspace ? null : scanJobId
    );
    setLoading(false);

    if (!result.ok) {
      setError(result.detail ?? result.error ?? c.aiReviewLoadFailed);
      setItems([]);
      setScanJobs([]);
      setSummary(null);
      return;
    }

    const nextItems = result.items ?? [];
    setItems(nextItems);
    setScanJobs(result.scanJobs ?? []);
    setSummary(result.summary ?? null);
    const nextDrafts: Record<string, ItemDraft> = {};
    for (const item of nextItems) {
      nextDrafts[item.id] = toDraft(item);
    }
    setDrafts(nextDrafts);
  }, [ofertaLocalId, scanJobId, isWorkspace, c.aiReviewLoadFailed]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const updateDraftField = useCallback((itemId: string, field: keyof ItemDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  }, []);

  const applyPatch = useCallback(
    async (itemId: string, patch: Parameters<typeof patchOfertaLocalReviewItem>[1]) => {
      setSavingId(itemId);
      setActionMessage(null);
      const result = await patchOfertaLocalReviewItem(itemId, patch);
      setSavingId(null);

      if (!result.ok || !result.item) {
        setActionMessage(result.detail ?? result.error ?? c.aiReviewSaveFailed);
        return;
      }

      setItems((prev) => prev.map((it) => (it.id === itemId ? result.item! : it)));
      setDrafts((prev) => ({ ...prev, [itemId]: toDraft(result.item!) }));
      setActionMessage(c.aiReviewSaved);
      void loadItems();
    },
    [c.aiReviewSaveFailed, c.aiReviewSaved, loadItems]
  );

  const handleSave = useCallback(
    async (itemId: string) => {
      const itemDraft = drafts[itemId];
      if (!itemDraft) return;
      await applyPatch(itemId, patchFromDraft(itemDraft, isCouponMode));
    },
    [applyPatch, drafts, isCouponMode]
  );

  const handleStatusAction = useCallback(
    async (itemId: string, reviewStatus: OfertaLocalItemReviewStatus) => {
      const itemDraft = drafts[itemId];
      if (!itemDraft) return;
      await applyPatch(itemId, patchFromDraft(itemDraft, isCouponMode, reviewStatus));
    },
    [applyPatch, drafts, isCouponMode]
  );

  const filteredItems = useMemo(() => {
    let list = items;
    if (selectedSourceAssetId) {
      list = list.filter((item) => item.sourceAssetId === selectedSourceAssetId);
    }
    if (statusFilter !== "all") {
      list = list.filter((item) => item.reviewStatus === statusFilter);
    }
    return list;
  }, [items, selectedSourceAssetId, statusFilter]);

  const { currentScanItems, previousScanItems } = useMemo(() => {
    if (!isWorkspace || !highlightScanJobId) {
      return { currentScanItems: filteredItems, previousScanItems: [] as OfertaLocalItemReviewViewModel[] };
    }
    const current = filteredItems.filter(
      (item) => !item.scanJobId || item.scanJobId === highlightScanJobId
    );
    const previous = filteredItems.filter(
      (item) => item.scanJobId && item.scanJobId !== highlightScanJobId
    );
    return { currentScanItems: current, previousScanItems: previous };
  }, [filteredItems, highlightScanJobId, isWorkspace]);

  const displayItems = isWorkspace && highlightScanJobId ? currentScanItems : filteredItems;

  useEffect(() => {
    setFocusIndex(0);
  }, [selectedSourceAssetId, statusFilter, highlightScanJobId]);

  useEffect(() => {
    if (focusIndex >= displayItems.length) {
      setFocusIndex(Math.max(0, displayItems.length - 1));
    }
  }, [displayItems.length, focusIndex]);

  const countLabels = useMemo(() => {
    if (!summary) return null;
    return [
      { key: "pending" as const, label: c.aiReviewCountPending, count: summary.pending },
      { key: "needs_review" as const, label: c.aiReviewCountNeedsReview, count: summary.needs_review },
      { key: "approved" as const, label: c.aiReviewCountApproved, count: summary.approved },
      { key: "rejected" as const, label: c.aiReviewCountRejected, count: summary.rejected },
    ];
  }, [summary, c]);

  const filterButtons: { key: ReviewFilter; label: string }[] = [
    { key: "all", label: c.aiReviewFilterAll },
    { key: "needs_review", label: c.aiReviewCountNeedsReview },
    { key: "approved", label: c.aiReviewCountApproved },
    { key: "rejected", label: c.aiReviewCountRejected },
  ];

  if (!ofertaLocalId?.trim()) return null;

  const focusedItem = displayItems[focusIndex];

  const summaryBar = countLabels ? (
    <div className={`grid grid-cols-2 gap-1.5 sm:grid-cols-4 ${isWorkspace ? "" : ""}`}>
      {countLabels.map(({ key, label, count }) => (
        <div
          key={key}
          className={`rounded-lg border border-[#D4C4A8]/60 bg-white text-center ${
            isWorkspace ? "px-2 py-1.5" : "px-3 py-2"
          }`}
        >
          <p className={`font-bold text-[#1E1814] ${isWorkspace ? "text-base" : "text-lg"}`}>{count}</p>
          <p className="text-[10px] uppercase tracking-wide text-[#1E1814]/55">{label}</p>
        </div>
      ))}
    </div>
  ) : null;

  const headerBlock = !isWorkspace ? (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-[#7A1E2C]">{c.aiReviewPanelTitle}</p>
        <p className="mt-1 text-xs text-[#1E1814]/70">{c.aiReviewBeforePublish}</p>
        {isCouponMode ? (
          <p className="mt-2 text-xs text-amber-900/80">{c.aiReviewCouponPartialNote}</p>
        ) : null}
        <p className="mt-2 text-xs text-[#1E1814]/60">{c.aiReviewApprovedNotPublic}</p>
        {items.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-[#7A1E2C]">
            {c.aiReviewSuggestionsFound} {items.length}
          </p>
        ) : null}
        {scanJobs.length > 0 ? (
          <ul className="mt-2 space-y-1 text-[10px] text-[#1E1814]/55">
            {scanJobs.map((job) => (
              <li key={job.id}>
                {lang === "en" ? "Scan" : "Escaneo"} {job.status} · {job.itemsExtractedCount}{" "}
                {lang === "en" ? "items" : "artículos"}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button type="button" className={BTN_SECONDARY} disabled={loading} onClick={() => void loadItems()}>
        {loading ? c.aiReviewRefreshing : c.aiReviewRefresh}
      </button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs font-semibold text-[#1E1814]">
        {c.aiReviewSuggestionsFound} {displayItems.length}
        {selectedSourceAssetId ? ` · ${c.aiReviewSelectSourceFile}` : ""}
      </p>
      <button type="button" className={BTN_SECONDARY} disabled={loading} onClick={() => void loadItems()}>
        {loading ? c.aiReviewRefreshing : c.aiReviewRefresh}
      </button>
    </div>
  );

  return (
    <div
      className={
        isWorkspace
          ? "flex h-full max-h-[calc(100vh-5.5rem)] min-h-0 flex-col overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm"
          : "space-y-4 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] p-4"
      }
    >
      <div className={isWorkspace ? "shrink-0 space-y-3 border-b border-[#D4C4A8]/50 p-3" : "space-y-4"}>
        {headerBlock}
        {summaryBar}

        {isWorkspace ? (
          <div className="flex flex-wrap gap-1.5">
            {filterButtons.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`${BTN_FILTER} ${
                  statusFilter === key
                    ? "border-[#7A1E2C] bg-[#7A1E2C]/10 text-[#7A1E2C]"
                    : "border-[#D4C4A8] bg-white text-[#1E1814]/60"
                }`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? <p className="text-xs text-[#1E1814]/60">{c.aiReviewLoading}</p> : null}
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
        ) : null}
        {actionMessage ? (
          <p className="rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0] px-3 py-2 text-xs text-[#1E1814]/75">
            {actionMessage}
          </p>
        ) : null}

        {!loading && !error && displayItems.length === 0 ? (
          <p className="text-xs text-[#1E1814]/60">
            {scanJobId || selectedSourceAssetId ? c.aiReviewNoSuggestions : c.aiReviewEmpty}
          </p>
        ) : null}

        {isWorkspace && displayItems.length > 0 ? (
          <>
            {highlightScanJobId && previousScanItems.length > 0 ? (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7A1E2C]">
                {c.aiReviewCurrentScan}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0] px-2.5 py-2">
              <p className="text-xs font-semibold text-[#1E1814]">
                {c.aiReviewProductPosition} {focusIndex + 1} {c.aiReviewProductOf} {displayItems.length}
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  disabled={focusIndex <= 0}
                  onClick={() => setFocusIndex((i) => Math.max(0, i - 1))}
                >
                  {c.aiReviewPreviousItem}
                </button>
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  disabled={focusIndex >= displayItems.length - 1}
                  onClick={() => setFocusIndex((i) => Math.min(displayItems.length - 1, i + 1))}
                >
                  {c.aiReviewNextItem}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {isWorkspace && displayItems.length > 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          {focusedItem ? (
            <ItemReviewCard
              key={focusedItem.id}
              item={focusedItem}
              draft={draft}
              draftFields={drafts[focusedItem.id] ?? toDraft(focusedItem)}
              lang={lang}
              isCouponMode={isCouponMode}
              busy={savingId === focusedItem.id}
              compact
              onFieldChange={(field, value) => updateDraftField(focusedItem.id, field, value)}
              onSave={() => void handleSave(focusedItem.id)}
              onStatus={(status) => void handleStatusAction(focusedItem.id, status)}
            />
          ) : null}

          {highlightScanJobId && previousScanItems.length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-[#D4C4A8]/50 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
                {c.aiReviewPreviousScans} ({previousScanItems.length})
              </p>
              <div className="max-h-36 space-y-1.5 overflow-y-auto">
                {previousScanItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-[#D4C4A8]/50 bg-[#FDF8F0] px-2.5 py-1.5 text-xs text-[#1E1814]/70"
                  >
                    <span className="font-medium">{item.itemName}</span>
                    {item.priceText ? ` · ${item.priceText}` : ""}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : !isWorkspace ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {displayItems.map((item) => {
            const itemDraft = drafts[item.id] ?? toDraft(item);
            const busy = savingId === item.id;
            return (
              <ItemReviewCard
                key={item.id}
                item={item}
                draft={draft}
                draftFields={itemDraft}
                lang={lang}
                isCouponMode={isCouponMode}
                busy={busy}
                onFieldChange={(field, value) => updateDraftField(item.id, field, value)}
                onSave={() => void handleSave(item.id)}
                onStatus={(status) => void handleStatusAction(item.id, status)}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
