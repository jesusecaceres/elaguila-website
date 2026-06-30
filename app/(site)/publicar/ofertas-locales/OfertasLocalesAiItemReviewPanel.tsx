"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchOfertaLocalReviewItems,
  patchOfertaLocalReviewItem,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewClient";
import {
  getOfertaLocalActiveScanCopy,
  inferScanningAssetId,
  isOfertaLocalScanJobActive,
  itemHasPendingCrop,
  logOfertaLocalScanUi,
  OFERTA_LOCAL_CROP_POLL_GRACE_MS,
  OFERTA_LOCAL_SCAN_REVIEW_POLL_MS,
  OFERTA_LOCAL_SCAN_REVIEW_POLL_TIMEOUT_MS,
  partitionItemsByActiveScanJob,
  pickDefaultOfertaLocalReviewItemId,
  resolveActiveScanJobIdForReviewSession,
  resolveAssetScanTabStatus,
  resolveItemCropListStatus,
  summarizeScopedItemReviewCounts,
} from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import type { OfertaLocalSourceFileRole } from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
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
  "min-h-11 rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_SECONDARY =
  "min-h-11 rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const BTN_FILTER =
  "min-h-10 rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide";

type ReviewFilter = "all" | OfertaLocalItemReviewStatus;
type PageFilter = "all" | number;
type PageReviewSummary = {
  page: number;
  total: number;
  approved: number;
  rejected: number;
  needsReview: number;
};

export type OfertaLocalAiReviewGateState = {
  activeSourceAssetId: string | null;
  activeScanJobId: string | null;
  totalItems: number;
  needsReviewCount: number;
};

type Props = {
  lang: OfertasLocalesAppLang;
  ofertaLocalId?: string | null;
  scanJobId?: string | null;
  reviewMode?: "weekly" | "coupon";
  variant?: "grid" | "workspace";
  draft?: OfertaLocalDraft;
  selectedSourceAssetId?: string | null;
  highlightScanJobId?: string | null;
  scanPollingActive?: boolean;
  scanRefreshToken?: number;
  onFocusedItemChange?: (item: OfertaLocalItemReviewViewModel | null) => void;
  onReviewGateChange?: (state: OfertaLocalAiReviewGateState) => void;
  onScopeChange?: (scope: {
    scanActiveForAsset: boolean;
    scanningAssetId: string | null;
    selectedAssetRole: OfertaLocalSourceFileRole | null;
    activeScanJobId: string | null;
  }) => void;
  onAssetTabStatuses?: (statuses: Record<string, string>) => void;
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

function noActiveFileTitle(lang: OfertasLocalesAppLang, reviewMode: "weekly" | "coupon"): string {
  if (reviewMode === "coupon") {
    return lang === "en" ? "No active coupon uploaded." : "No hay cupón activo subido.";
  }
  return lang === "en" ? "No active flyer uploaded." : "No hay volante activo subido.";
}

function noActiveFileBody(lang: OfertasLocalesAppLang, reviewMode: "weekly" | "coupon"): string {
  if (reviewMode === "coupon") {
    return lang === "en"
      ? "Upload and scan a coupon to review extracted products."
      : "Sube y escanea un cupón para revisar los productos extraídos.";
  }
  return lang === "en"
    ? "Upload and scan a flyer to review extracted products."
    : "Sube y escanea un volante para revisar los productos extraídos.";
}

function isReviewTerminal(status: OfertaLocalItemReviewStatus): boolean {
  return status === "approved" || status === "rejected";
}

function sourceRoleText(role: OfertaLocalSourceFileRole | null, lang: OfertasLocalesAppLang): string {
  if (role === "coupon") return lang === "en" ? "Coupon" : "Cupón";
  return lang === "en" ? "Main flyer" : "Volante principal";
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
  onGoNext,
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
  onGoNext?: () => void;
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

      <div className={`grid gap-2 sm:flex sm:flex-wrap ${compact ? "mt-2" : "mt-3"}`}>
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
        {onGoNext ? (
          <button type="button" className={BTN_PRIMARY} disabled={busy} onClick={onGoNext}>
            {c.aiReviewNextItem}
          </button>
        ) : null}
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
  scanPollingActive = false,
  scanRefreshToken = 0,
  onFocusedItemChange,
  onReviewGateChange,
  onScopeChange,
  onAssetTabStatuses,
}: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const scanCopy = getOfertaLocalActiveScanCopy(lang);
  const isCouponMode = reviewMode === "coupon";
  const isWorkspace = variant === "workspace";

  const [items, setItems] = useState<OfertaLocalItemReviewViewModel[]>([]);
  const [scanJobs, setScanJobs] = useState<OfertaLocalScanJobSummary[]>([]);
  const [summary, setSummary] = useState<Record<OfertaLocalItemReviewStatus, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pageBlockMessage, setPageBlockMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReviewFilter>("all");
  const [selectedPageFilter, setSelectedPageFilter] = useState<PageFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [previousScansOpen, setPreviousScansOpen] = useState(false);
  const [scanCompletedAt, setScanCompletedAt] = useState<number | null>(null);

  const selectionContextRef = useRef("");
  const prevScanPollingRef = useRef(scanPollingActive);
  const pollStartedAtRef = useRef<number | null>(null);
  const formPanelRef = useRef<HTMLDivElement | null>(null);
  const selectedItemIdRef = useRef<string | null>(null);
  const itemCountRef = useRef(0);

  useEffect(() => {
    selectedItemIdRef.current = selectedItemId;
  }, [selectedItemId]);

  const activeSourceAssetIds = useMemo(() => {
    if (!draft) return new Set<string>();
    return new Set(
      [...draft.flyerAssets, ...draft.couponAssets]
        .filter((asset) => asset.status !== "removed")
        .map((asset) => asset.id)
    );
  }, [draft]);

  const hasActiveSourceAsset =
    !isWorkspace || Boolean(selectedSourceAssetId && activeSourceAssetIds.has(selectedSourceAssetId));

  const clearReviewState = useCallback(() => {
    itemCountRef.current = 0;
    selectionContextRef.current = "";
    pollStartedAtRef.current = null;
    setItems([]);
    setScanJobs([]);
    setSummary(null);
    setDrafts({});
    setSelectedItemId(null);
    setPreviousScansOpen(false);
    setScanCompletedAt(null);
    setError(null);
    setActionMessage(null);
    setPageBlockMessage(null);
    setAutoRefreshing(false);
    setLoading(false);
    setSelectedPageFilter("all");
    onFocusedItemChange?.(null);
    onReviewGateChange?.({
      activeSourceAssetId: null,
      activeScanJobId: null,
      totalItems: 0,
      needsReviewCount: 0,
    });
    onScopeChange?.({
      scanActiveForAsset: false,
      scanningAssetId: null,
      selectedAssetRole: null,
      activeScanJobId: null,
    });
    onAssetTabStatuses?.({});
  }, [onAssetTabStatuses, onFocusedItemChange, onReviewGateChange, onScopeChange]);

  const mergeDraftsFromItems = useCallback(
    (nextItems: OfertaLocalItemReviewViewModel[], preserveSelectedDraft: boolean) => {
      setDrafts((prev) => {
        const next: Record<string, ItemDraft> = { ...prev };
        for (const item of nextItems) {
          if (preserveSelectedDraft && item.id === selectedItemIdRef.current && prev[item.id]) {
            continue;
          }
          next[item.id] = toDraft(item);
        }
        return next;
      });
    },
    []
  );

  const loadItems = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!ofertaLocalId?.trim()) return;
      if (!hasActiveSourceAsset) {
        clearReviewState();
        return;
      }
      const silent = options?.silent ?? false;
      if (silent) {
        setAutoRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await fetchOfertaLocalReviewItems(
        ofertaLocalId,
        isWorkspace ? null : scanJobId
      );

      if (silent) {
        setAutoRefreshing(false);
      } else {
        setLoading(false);
      }

      if (!result.ok) {
        if (!silent) {
          setError(result.detail ?? result.error ?? c.aiReviewLoadFailed);
          setItems([]);
          setScanJobs([]);
          setSummary(null);
        }
        return;
      }

      const nextItems = result.items ?? [];
      const prevCount = itemCountRef.current;
      itemCountRef.current = nextItems.length;
      setItems(nextItems);
      setScanJobs(result.scanJobs ?? []);
      setSummary(result.summary ?? null);
      mergeDraftsFromItems(nextItems, silent);

      if (nextItems.length > prevCount) {
        logOfertaLocalScanUi("items received", {
          count: nextItems.length,
          added: nextItems.length - prevCount,
          scanJobId: highlightScanJobId,
        });
      }
    },
    [
      ofertaLocalId,
      scanJobId,
      isWorkspace,
      hasActiveSourceAsset,
      clearReviewState,
      c.aiReviewLoadFailed,
      highlightScanJobId,
      mergeDraftsFromItems,
    ]
  );

  useEffect(() => {
    if (hasActiveSourceAsset) return;
    clearReviewState();
  }, [clearReviewState, hasActiveSourceAsset]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!scanRefreshToken) return;
    void loadItems({ silent: itemCountRef.current > 0 });
  }, [scanRefreshToken, loadItems]);

  useEffect(() => {
    if (prevScanPollingRef.current && !scanPollingActive) {
      setScanCompletedAt(Date.now());
    }
    if (scanPollingActive) setScanCompletedAt(null);
    prevScanPollingRef.current = scanPollingActive;
  }, [scanPollingActive]);

  const scanningAssetId = useMemo(
    () => inferScanningAssetId(scanPollingActive, scanJobs, items, selectedSourceAssetId ?? null),
    [scanPollingActive, scanJobs, items, selectedSourceAssetId]
  );

  const selectedAssetRole = useMemo((): OfertaLocalSourceFileRole | null => {
    if (!selectedSourceAssetId || !draft) return null;
    if (draft.flyerAssets.some((asset) => asset.id === selectedSourceAssetId && asset.status !== "removed")) {
      return "flyer";
    }
    if (draft.couponAssets.some((asset) => asset.id === selectedSourceAssetId && asset.status !== "removed")) {
      return "coupon";
    }
    return null;
  }, [selectedSourceAssetId, draft]);

  const activeScanJobId = useMemo(() => {
    if (!isWorkspace || !selectedSourceAssetId) return highlightScanJobId ?? null;
    return resolveActiveScanJobIdForReviewSession(
      selectedSourceAssetId,
      items,
      scanJobs,
      highlightScanJobId ?? null,
      scanPollingActive,
      scanningAssetId
    );
  }, [
    isWorkspace,
    selectedSourceAssetId,
    items,
    scanJobs,
    highlightScanJobId,
    scanPollingActive,
    scanningAssetId,
  ]);

  const highlightedScanJob = useMemo(
    () => (activeScanJobId ? scanJobs.find((job) => job.id === activeScanJobId) ?? null : null),
    [scanJobs, activeScanJobId]
  );

  const scanJobStillActive = highlightedScanJob
    ? isOfertaLocalScanJobActive(highlightedScanJob.status)
    : false;

  const scanActiveForAsset = Boolean(
    selectedSourceAssetId &&
      ((scanPollingActive && scanningAssetId === selectedSourceAssetId) || scanJobStillActive)
  );

  const cropGraceActive =
    scanCompletedAt != null && Date.now() - scanCompletedAt < OFERTA_LOCAL_CROP_POLL_GRACE_MS;

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
      void loadItems({ silent: true });
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

  const assetScopedItems = useMemo(() => {
    let list = items;
    if (selectedSourceAssetId) {
      list = list.filter((item) => item.sourceAssetId === selectedSourceAssetId);
    }
    return list;
  }, [items, selectedSourceAssetId]);

  const { currentScanItems: allCurrentScanItems, previousScanItems } = useMemo(() => {
    if (!isWorkspace || !selectedSourceAssetId) {
      return { currentScanItems: assetScopedItems, previousScanItems: [] as OfertaLocalItemReviewViewModel[] };
    }
    return partitionItemsByActiveScanJob(assetScopedItems, activeScanJobId);
  }, [activeScanJobId, assetScopedItems, isWorkspace, selectedSourceAssetId]);

  const pageSummaries = useMemo(() => {
    const pages = new Map<number, PageReviewSummary>();
    const summaryItems = isWorkspace ? allCurrentScanItems : assetScopedItems;
    for (const item of summaryItems) {
      const page = item.sourcePage && item.sourcePage > 0 ? item.sourcePage : 1;
      const current = pages.get(page) ?? {
        page,
        total: 0,
        approved: 0,
        rejected: 0,
        needsReview: 0,
      };
      current.total += 1;
      if (item.reviewStatus === "approved") current.approved += 1;
      if (item.reviewStatus === "rejected") current.rejected += 1;
      if (!isReviewTerminal(item.reviewStatus)) current.needsReview += 1;
      pages.set(page, current);
    }
    return [...pages.values()].sort((a, b) => a.page - b.page);
  }, [allCurrentScanItems, assetScopedItems, isWorkspace]);

  const firstPageNumber = pageSummaries[0]?.page ?? null;
  const currentPageNumber =
    selectedPageFilter === "all" ? firstPageNumber : selectedPageFilter;
  const currentPageSummary =
    currentPageNumber != null
      ? pageSummaries.find((page) => page.page === currentPageNumber) ?? null
      : null;
  const currentPageIndex = currentPageSummary
    ? Math.max(0, pageSummaries.findIndex((page) => page.page === currentPageSummary.page))
    : -1;
  const nextPageSummary =
    currentPageIndex >= 0 && currentPageIndex < pageSummaries.length - 1
      ? pageSummaries[currentPageIndex + 1]
      : null;
  const firstIncompletePage = pageSummaries.find((page) => page.needsReview > 0) ?? null;
  const allPagesComplete = pageSummaries.length > 0 && pageSummaries.every((page) => page.needsReview === 0);

  const pageFilteredItems = useMemo(() => {
    let list = isWorkspace ? allCurrentScanItems : assetScopedItems;
    if (isWorkspace && currentPageNumber != null) {
      list = list.filter((item) => (item.sourcePage && item.sourcePage > 0 ? item.sourcePage : 1) === currentPageNumber);
    }
    return list;
  }, [allCurrentScanItems, assetScopedItems, currentPageNumber, isWorkspace]);

  const filteredItems = useMemo(() => {
    let list = pageFilteredItems;
    if (statusFilter !== "all") {
      list = list.filter((item) => item.reviewStatus === statusFilter);
    }
    return list;
  }, [pageFilteredItems, statusFilter]);

  const displayItems = filteredItems;

  const itemsMissingCrop = displayItems.some(itemHasPendingCrop);
  const shouldPollCrops = itemsMissingCrop && (scanActiveForAsset || cropGraceActive);

  useEffect(() => {
    const shouldPoll =
      Boolean(ofertaLocalId?.trim()) && (scanPollingActive || scanJobStillActive || shouldPollCrops);
    if (!shouldPoll) {
      if (pollStartedAtRef.current != null) {
        logOfertaLocalScanUi("polling stopped", { reason: "inactive" });
        pollStartedAtRef.current = null;
      }
      return;
    }

    if (pollStartedAtRef.current == null) {
      pollStartedAtRef.current = Date.now();
      logOfertaLocalScanUi("polling started", {
        ofertaLocalId,
        activeScanJobId,
        scanPollingActive,
        shouldPollCrops,
      });
    }

    const tick = () => {
      const startedAt = pollStartedAtRef.current ?? Date.now();
      if (Date.now() - startedAt > OFERTA_LOCAL_SCAN_REVIEW_POLL_TIMEOUT_MS) {
        logOfertaLocalScanUi("polling stopped", { reason: "timeout" });
        pollStartedAtRef.current = null;
        return;
      }
      void loadItems({ silent: true });
    };

    void loadItems({ silent: true });
    const intervalId = window.setInterval(tick, OFERTA_LOCAL_SCAN_REVIEW_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
      logOfertaLocalScanUi("polling stopped", { reason: "cleanup" });
      pollStartedAtRef.current = null;
    };
  }, [
    ofertaLocalId,
    scanPollingActive,
    scanJobStillActive,
    activeScanJobId,
    loadItems,
    shouldPollCrops,
  ]);

  useEffect(() => {
    onScopeChange?.({
      scanActiveForAsset: scanActiveForAsset || shouldPollCrops,
      scanningAssetId,
      selectedAssetRole,
      activeScanJobId,
    });
  }, [
    onScopeChange,
    scanActiveForAsset,
    shouldPollCrops,
    scanningAssetId,
    selectedAssetRole,
    activeScanJobId,
  ]);

  useEffect(() => {
    if (!isWorkspace || !onAssetTabStatuses || !draft) return;
    const statuses: Record<string, string> = {};
    const assets = [
      ...draft.flyerAssets
        .filter((asset) => asset.status !== "removed")
        .map((asset) => ({ id: asset.id, kind: "flyer" as const })),
      ...draft.couponAssets
        .filter((asset) => asset.status !== "removed")
        .map((asset) => ({ id: asset.id, kind: "coupon" as const })),
    ];
    for (const asset of assets) {
      const label = resolveAssetScanTabStatus(
        asset.id,
        asset.kind,
        items,
        scanJobs,
        highlightScanJobId ?? null,
        scanPollingActive,
        scanningAssetId,
        lang
      );
      if (label) statuses[asset.id] = label;
    }
    onAssetTabStatuses(statuses);
  }, [
    isWorkspace,
    onAssetTabStatuses,
    draft,
    items,
    scanJobs,
    highlightScanJobId,
    scanPollingActive,
    scanningAssetId,
    lang,
  ]);

  const selectionContext = `${activeScanJobId ?? ""}|${selectedSourceAssetId ?? ""}|${statusFilter}|${selectedPageFilter}|${scanPollingActive ? "poll" : "idle"}`;

  const selectItem = useCallback((itemId: string) => {
    logOfertaLocalScanUi("selected item changed", { itemId });
    setSelectedItemId(itemId);
  }, []);

  useEffect(() => {
    if (selectionContextRef.current !== selectionContext) {
      selectionContextRef.current = selectionContext;
      setSelectedItemId(pickDefaultOfertaLocalReviewItemId(displayItems));
      setPreviousScansOpen(false);
      return;
    }
    if (selectedItemId && !displayItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(pickDefaultOfertaLocalReviewItemId(displayItems));
    } else if (!selectedItemId && displayItems.length > 0) {
      setSelectedItemId(pickDefaultOfertaLocalReviewItemId(displayItems));
    }
  }, [selectionContext, displayItems, selectedItemId]);

  const focusIndex = useMemo(() => {
    if (!selectedItemId) return 0;
    const idx = displayItems.findIndex((item) => item.id === selectedItemId);
    return idx >= 0 ? idx : 0;
  }, [displayItems, selectedItemId]);

  const focusedItem = useMemo(
    () => displayItems.find((item) => item.id === selectedItemId) ?? null,
    [displayItems, selectedItemId]
  );

  useEffect(() => {
    setSelectedPageFilter("all");
    setPageBlockMessage(null);
  }, [activeScanJobId, selectedSourceAssetId]);

  useEffect(() => {
    if (!isWorkspace || pageSummaries.length === 0) return;
    if (selectedPageFilter === "all") {
      setSelectedPageFilter(pageSummaries[0].page);
      return;
    }
    if (!pageSummaries.some((page) => page.page === selectedPageFilter)) {
      setSelectedPageFilter(pageSummaries[0].page);
    }
  }, [isWorkspace, pageSummaries, selectedPageFilter]);

  useEffect(() => {
    if (!currentPageSummary || currentPageSummary.needsReview === 0) {
      setPageBlockMessage(null);
    }
  }, [currentPageSummary?.needsReview, currentPageSummary?.page]);

  const focusedPageItems = useMemo(() => {
    if (!focusedItem?.sourcePage) return displayItems;
    return displayItems.filter((item) => item.sourcePage === focusedItem.sourcePage);
  }, [displayItems, focusedItem?.sourcePage]);

  const focusedPageIndex = focusedItem
    ? Math.max(0, focusedPageItems.findIndex((item) => item.id === focusedItem.id))
    : 0;

  const selectedAssetFileLabel = useMemo(() => {
    if (!selectedSourceAssetId || !draft) return "";
    const asset = [...draft.flyerAssets, ...draft.couponAssets].find(
      (entry) => entry.id === selectedSourceAssetId && entry.status !== "removed"
    );
    return asset?.fileName || asset?.title || "";
  }, [draft, selectedSourceAssetId]);

  useEffect(() => {
    onFocusedItemChange?.(focusedItem ?? null);
  }, [focusedItem, onFocusedItemChange]);

  useEffect(() => {
    if (!hasActiveSourceAsset) return;
    const gateItems = isWorkspace ? allCurrentScanItems : displayItems;
    onReviewGateChange?.({
      activeSourceAssetId: selectedSourceAssetId ?? null,
      activeScanJobId,
      totalItems: gateItems.length,
      needsReviewCount: gateItems.filter((item) => !isReviewTerminal(item.reviewStatus)).length,
    });
  }, [
    activeScanJobId,
    allCurrentScanItems,
    displayItems,
    hasActiveSourceAsset,
    isWorkspace,
    onReviewGateChange,
    selectedSourceAssetId,
  ]);

  useEffect(() => {
    if (!isWorkspace || !selectedItemId) return;
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedItemId, isWorkspace]);

  const countLabels = useMemo(() => {
    const scoped = isWorkspace ? summarizeScopedItemReviewCounts(displayItems) : summary;
    if (!scoped) return null;
    return [
      { key: "pending" as const, label: c.aiReviewCountPending, count: scoped.pending },
      { key: "needs_review" as const, label: c.aiReviewCountNeedsReview, count: scoped.needs_review },
      { key: "approved" as const, label: c.aiReviewCountApproved, count: scoped.approved },
      { key: "rejected" as const, label: c.aiReviewCountRejected, count: scoped.rejected },
    ];
  }, [summary, c, isWorkspace, displayItems]);

  const filterButtons: { key: ReviewFilter; label: string }[] = [
    { key: "all", label: c.aiReviewFilterAll },
    { key: "needs_review", label: c.aiReviewCountNeedsReview },
    { key: "approved", label: c.aiReviewCountApproved },
    { key: "rejected", label: c.aiReviewCountRejected },
  ];

  if (!ofertaLocalId?.trim()) return null;

  if (isWorkspace && !hasActiveSourceAsset) {
    return (
      <div className="flex h-full min-h-[260px] flex-col justify-center rounded-xl border border-dashed border-[#D4C4A8]/80 bg-white px-4 py-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-[#7A1E2C]">
          {noActiveFileTitle(lang, reviewMode)}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#1E1814]/65">
          {noActiveFileBody(lang, reviewMode)}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-[10px] leading-relaxed text-[#1E1814]/50">
          {lang === "en"
            ? "Previous scan results are hidden because the source file was removed."
            : "Los resultados anteriores están ocultos porque se quitó el archivo fuente."}
        </p>
      </div>
    );
  }

  const goPreviousItem = () => {
    if (focusIndex <= 0) return;
    selectItem(displayItems[focusIndex - 1].id);
  };

  const goNextItem = () => {
    if (focusIndex >= displayItems.length - 1) return;
    selectItem(displayItems[focusIndex + 1].id);
  };

  const pageIncompleteMessage = (page: PageReviewSummary) =>
    lang === "en"
      ? `You still have ${page.needsReview} product(s) to review on Page ${page.page}. Approve or reject every item before continuing.`
      : `Todavía tienes ${page.needsReview} producto(s) por revisar en la Página ${page.page}. Aprueba o rechaza cada producto antes de continuar.`;

  const pageStatusLabel = (page: PageReviewSummary) => {
    if (page.needsReview === 0) return lang === "en" ? "Complete" : "Completa";
    if (page.approved > 0 || page.rejected > 0) return lang === "en" ? "Needs review" : "Pendiente";
    return lang === "en" ? "Not started" : "Sin empezar";
  };

  const pageStatusClass = (page: PageReviewSummary) => {
    if (page.needsReview === 0) return "border-emerald-300/80 bg-emerald-50 text-emerald-900";
    if (page.approved > 0 || page.rejected > 0) return "border-amber-300/80 bg-amber-50 text-amber-900";
    return "border-[#D4C4A8] bg-white text-[#1E1814]/65";
  };

  const pageIsLocked = (page: PageReviewSummary) =>
    Boolean(firstIncompletePage && page.page > firstIncompletePage.page);

  const selectReviewPage = (page: PageReviewSummary) => {
    if (pageIsLocked(page)) {
      const blocker = firstIncompletePage ?? currentPageSummary;
      if (blocker) setPageBlockMessage(pageIncompleteMessage(blocker));
      return;
    }
    setPageBlockMessage(null);
    setStatusFilter("all");
    setSelectedPageFilter(page.page);
  };

  const proceedToNextPage = () => {
    if (!currentPageSummary) return;
    if (currentPageSummary.needsReview > 0) {
      setPageBlockMessage(pageIncompleteMessage(currentPageSummary));
      return;
    }
    setPageBlockMessage(null);
    setStatusFilter("all");
    if (nextPageSummary) {
      setSelectedPageFilter(nextPageSummary.page);
      return;
    }
    setActionMessage(
      lang === "en"
        ? "All pages are reviewed. You can continue to preview."
        : "Todas las páginas están revisadas. Puedes continuar a la vista previa."
    );
  };

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
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[#1E1814]">
          {scanCopy.currentScan}: {isWorkspace ? allCurrentScanItems.length : displayItems.length}
          {previousScanItems.length > 0 ? ` · ${scanCopy.previousScans}: ${previousScanItems.length}` : ""}
        </p>
        <button
          type="button"
          className={BTN_SECONDARY}
          disabled={loading || autoRefreshing}
          onClick={() => void loadItems()}
        >
          {loading || autoRefreshing ? c.aiReviewRefreshing : scanCopy.refreshNow}
        </button>
      </div>
      <p className="text-[10px] text-[#1E1814]/55">{scanCopy.refreshBackupHint}</p>
    </div>
  );

  return (
    <div
      className={
        isWorkspace
          ? "flex min-h-0 flex-col rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm xl:h-full xl:max-h-[calc(100vh-5.5rem)] xl:overflow-hidden"
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
        {autoRefreshing && !loading ? (
          <p className="text-xs text-[#1E1814]/55">{c.aiReviewAutoRefreshing}</p>
        ) : null}
        {isWorkspace && scanActiveForAsset ? (
          <div className="rounded-lg border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-3 py-2 text-xs text-[#1E1814]/75">
            <p className="font-medium text-[#7A1E2C]">
              {selectedAssetRole === "coupon" ? scanCopy.scanningCoupon : scanCopy.scanningFlyer}
            </p>
            <p className="mt-1">{scanCopy.autoResultsHint}</p>
          </div>
        ) : null}
        {isWorkspace &&
        !scanActiveForAsset &&
        !shouldPollCrops &&
        activeScanJobId &&
        displayItems.length > 0 ? (
          <p className="text-xs font-medium text-emerald-900/85">
            {selectedAssetRole === "coupon" ? scanCopy.readyCoupon : scanCopy.readyFlyer}
          </p>
        ) : null}
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
            {scanActiveForAsset
              ? scanCopy.scanInProgressEmpty
              : scanJobId || selectedSourceAssetId
                ? c.aiReviewNoSuggestions
                : c.aiReviewEmpty}
          </p>
        ) : null}

        {isWorkspace && displayItems.length > 0 ? (
          <>
            <div className="rounded-lg border border-[#D4C4A8]/60 bg-white px-3 py-2 text-xs text-[#1E1814]/75">
              <p className="font-semibold text-[#7A1E2C]">
                {sourceRoleText(selectedAssetRole, lang)}
                {selectedAssetFileLabel ? ` — ${selectedAssetFileLabel}` : ""}
              </p>
              {pageSummaries.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/50">
                    {lang === "en" ? "Guided page review" : "Revisión guiada por página"}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {pageSummaries.map((page) => (
                      <button
                        key={page.page}
                        type="button"
                        className={`min-h-20 rounded-xl border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                          currentPageSummary?.page === page.page
                            ? "border-[#7A1E2C] bg-[#7A1E2C]/10 text-[#1E1814] ring-1 ring-[#7A1E2C]/20"
                            : "border-[#D4C4A8] bg-white text-[#1E1814]/70 hover:border-[#7A1E2C]/35"
                        }`}
                        disabled={pageIsLocked(page)}
                        onClick={() => selectReviewPage(page)}
                      >
                        <span className="block font-semibold text-[#1E1814]">
                          {lang === "en" ? "Page" : "Página"} {page.page}
                        </span>
                        <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${pageStatusClass(page)}`}>
                          {pageStatusLabel(page)}
                        </span>
                        <span className="mt-1 block text-[10px] text-[#1E1814]/60">
                          {page.total} {lang === "en" ? "items" : "productos"} · {page.approved}{" "}
                          {lang === "en" ? "approved" : "aprobados"} · {page.rejected}{" "}
                          {lang === "en" ? "rejected" : "rechazados"} · {page.needsReview}{" "}
                          {lang === "en" ? "remaining" : "pendientes"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {currentPageSummary ? (
                <div className="mt-3 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-3 py-2">
                  <p className="text-sm font-semibold text-[#1E1814]">
                    {lang === "en" ? "Reviewing Page" : "Revisando Página"} {currentPageSummary.page}{" "}
                    {lang === "en" ? "of" : "de"} {pageSummaries.length}
                  </p>
                  <p className="mt-1 text-xs text-[#1E1814]/65">
                    {currentPageSummary.needsReview > 0
                      ? lang === "en"
                        ? `You still have ${currentPageSummary.needsReview} product(s) to review on this page.`
                        : `Todavía tienes ${currentPageSummary.needsReview} producto(s) por revisar en esta página.`
                      : lang === "en"
                        ? "This page is complete."
                        : "Esta página está completa."}
                  </p>
                  {pageBlockMessage ? (
                    <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                      {pageBlockMessage}
                    </p>
                  ) : null}
                  {allPagesComplete ? (
                    <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
                      {lang === "en"
                        ? "All pages are reviewed. Continue to preview when you are ready."
                        : "Todas las páginas están revisadas. Continúa a la vista previa cuando estés listo."}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      className={BTN_PRIMARY}
                      disabled={currentPageSummary.needsReview > 0 || !nextPageSummary}
                      onClick={proceedToNextPage}
                    >
                      {nextPageSummary
                        ? lang === "en"
                          ? `Proceed to Page ${nextPageSummary.page}`
                          : `Continuar a Página ${nextPageSummary.page}`
                        : lang === "en"
                          ? "All pages reviewed"
                          : "Todas las páginas revisadas"}
                    </button>
                    {currentPageSummary.needsReview > 0 ? (
                      <p className="text-xs font-medium text-red-800">
                        {lang === "en"
                          ? "Approve or reject every item on this page to continue."
                          : "Aprueba o rechaza cada producto de esta página para continuar."}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            {activeScanJobId && previousScanItems.length > 0 ? (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7A1E2C]">
                {scanCopy.currentScan}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0] px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-[#1E1814]">
                {focusedItem?.sourcePage
                  ? `${c.aiReviewProductPosition} ${focusedPageIndex + 1} ${c.aiReviewProductOf} ${
                      focusedPageItems.length
                    } ${lang === "en" ? "on page" : "en página"} ${focusedItem.sourcePage}`
                  : `${c.aiReviewProductPosition} ${focusIndex + 1} ${c.aiReviewProductOf} ${
                      displayItems.length
                    }`}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-1.5">
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  disabled={focusIndex <= 0}
                  onClick={goPreviousItem}
                >
                  {c.aiReviewPreviousItem}
                </button>
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  disabled={focusIndex >= displayItems.length - 1}
                  onClick={goNextItem}
                >
                  {c.aiReviewNextItem}
                </button>
              </div>
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#D4C4A8]/50 bg-white p-1.5">
              {displayItems.map((item) => {
                const active = item.id === selectedItemId;
                const cropStatus = resolveItemCropListStatus(item, scanActiveForAsset || shouldPollCrops);
                const cropStatusLabel =
                  cropStatus === "crop"
                    ? lang === "en"
                      ? "Clip ready"
                      : "Recorte listo"
                    : cropStatus === "pending"
                      ? lang === "en"
                        ? "Clip pending"
                        : "Recorte pendiente"
                      : lang === "en"
                        ? "No clip yet"
                        : "Sin recorte todavía";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(item.id)}
                    className={`flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                      active
                        ? "bg-[#7A1E2C]/10 ring-1 ring-[#7A1E2C]/25"
                        : "hover:bg-[#FDF8F0]"
                    }`}
                  >
                    {cropStatus === "crop" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.sourceCropUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded border border-[#D4C4A8]/60 object-cover"
                      />
                    ) : (
                      <span
                        className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded border border-dashed px-0.5 text-center text-[8px] leading-tight ${
                          cropStatus === "pending"
                            ? "border-amber-300/80 bg-amber-50/80 text-amber-900/75"
                            : "border-[#D4C4A8]/60 bg-[#FDF8F0] text-[#1E1814]/45"
                        }`}
                      >
                        {cropStatus === "pending" ? scanCopy.listCropPending : scanCopy.listCropNone}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[#1E1814]">{item.itemName}</span>
                      <span className="block truncate text-[10px] text-[#1E1814]/55">
                        {item.priceText || "—"}
                        {item.sourcePage != null ? ` · p${item.sourcePage}` : ""}
                        {` · ${cropStatusLabel}`}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${statusBadgeClass(item.reviewStatus)}`}
                    >
                      {item.reviewStatus.replace("_", " ").slice(0, 8)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      {isWorkspace && displayItems.length > 0 ? (
        <div ref={formPanelRef} className="p-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain">
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
              onGoNext={focusIndex < displayItems.length - 1 ? goNextItem : undefined}
            />
          ) : null}

          {activeScanJobId && previousScanItems.length > 0 ? (
            <div className="mt-4 border-t border-[#D4C4A8]/50 pt-3">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/55"
                onClick={() => setPreviousScansOpen((v) => !v)}
              >
                <span>
                  {scanCopy.previousScans} ({previousScanItems.length})
                </span>
                <span>{previousScansOpen ? "−" : "+"}</span>
              </button>
              {previousScansOpen ? (
                <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
                  {previousScanItems.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border border-[#D4C4A8]/50 bg-[#FDF8F0] px-2.5 py-1.5 text-xs text-[#1E1814]/70"
                    >
                      <span className="font-medium">{item.itemName}</span>
                      {item.priceText ? ` · ${item.priceText}` : ""}
                    </div>
                  ))}
                </div>
              ) : null}
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
