"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchOfertaLocalReviewItems,
  patchOfertaLocalReviewItem,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewClient";
import type {
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

type Props = {
  lang: OfertasLocalesAppLang;
  ofertaLocalId?: string | null;
  scanJobId?: string | null;
};

type ItemDraft = {
  itemName: string;
  priceText: string;
  priceAmount: string;
  unit: string;
  category: string;
  searchTags: string;
};

function toDraft(item: OfertaLocalItemReviewViewModel): ItemDraft {
  return {
    itemName: item.itemName,
    priceText: item.priceText,
    priceAmount: item.priceAmount != null ? String(item.priceAmount) : "",
    unit: item.unit,
    category: item.category,
    searchTags: item.searchTags.join(", "),
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

export function OfertasLocalesAiItemReviewPanel({ lang, ofertaLocalId, scanJobId }: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const [items, setItems] = useState<OfertaLocalItemReviewViewModel[]>([]);
  const [scanJobs, setScanJobs] = useState<OfertaLocalScanJobSummary[]>([]);
  const [summary, setSummary] = useState<Record<OfertaLocalItemReviewStatus, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!ofertaLocalId?.trim()) return;
    setLoading(true);
    setError(null);
    const result = await fetchOfertaLocalReviewItems(ofertaLocalId, scanJobId);
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
  }, [ofertaLocalId, scanJobId, c.aiReviewLoadFailed]);

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
      const draft = drafts[itemId];
      if (!draft) return;
      await applyPatch(itemId, {
        itemName: draft.itemName,
        priceText: draft.priceText,
        priceAmount: draft.priceAmount.trim() ? Number(draft.priceAmount) : null,
        unit: draft.unit,
        category: draft.category,
        searchTags: draft.searchTags
          .split(/[,;]+/)
          .map((t) => t.trim())
          .filter(Boolean),
      });
    },
    [applyPatch, drafts]
  );

  const handleStatusAction = useCallback(
    async (itemId: string, reviewStatus: OfertaLocalItemReviewStatus) => {
      const draft = drafts[itemId];
      await applyPatch(itemId, {
        itemName: draft?.itemName,
        priceText: draft?.priceText,
        priceAmount: draft?.priceAmount.trim() ? Number(draft.priceAmount) : null,
        unit: draft?.unit,
        category: draft?.category,
        searchTags: draft?.searchTags
          .split(/[,;]+/)
          .map((t) => t.trim())
          .filter(Boolean),
        reviewStatus,
      });
    },
    [applyPatch, drafts]
  );

  const countLabels = useMemo(() => {
    if (!summary) return null;
    return [
      { key: "pending" as const, label: c.aiReviewCountPending, count: summary.pending },
      { key: "needs_review" as const, label: c.aiReviewCountNeedsReview, count: summary.needs_review },
      { key: "approved" as const, label: c.aiReviewCountApproved, count: summary.approved },
      { key: "rejected" as const, label: c.aiReviewCountRejected, count: summary.rejected },
    ];
  }, [summary, c]);

  if (!ofertaLocalId?.trim()) return null;

  return (
    <div className="space-y-4 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#7A1E2C]">{c.aiReviewPanelTitle}</p>
          <p className="mt-1 text-xs text-[#1E1814]/70">{c.aiReviewBeforePublish}</p>
          <p className="mt-2 text-xs text-[#1E1814]/60">{c.aiReviewApprovedNotPublic}</p>
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

      {countLabels ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {countLabels.map(({ key, label, count }) => (
            <div key={key} className="rounded-lg border border-[#D4C4A8]/60 bg-white px-3 py-2 text-center">
              <p className="text-lg font-bold text-[#1E1814]">{count}</p>
              <p className="text-[10px] uppercase tracking-wide text-[#1E1814]/55">{label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="text-xs text-[#1E1814]/60">{c.aiReviewLoading}</p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
      ) : null}

      {actionMessage ? (
        <p className="rounded-lg border border-[#D4C4A8]/60 bg-white px-3 py-2 text-xs text-[#1E1814]/75">
          {actionMessage}
        </p>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-xs text-[#1E1814]/60">{c.aiReviewEmpty}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => {
          const draft = drafts[item.id] ?? toDraft(item);
          const busy = savingId === item.id;
          return (
            <div key={item.id} className={CARD}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadgeClass(item.reviewStatus)}`}>
                  {item.reviewStatus.replace("_", " ")}
                </span>
                <span className="text-[10px] text-[#1E1814]/55">
                  {c.aiReviewConfidence}: {confidenceLabelText(item.confidenceLabel, lang)}
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
                  {c.aiReviewItemName}
                  <input
                    className={`${INPUT} mt-1`}
                    value={draft.itemName}
                    onChange={(e) => updateDraftField(item.id, "itemName", e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
                    {c.aiReviewPriceText}
                    <input
                      className={`${INPUT} mt-1`}
                      value={draft.priceText}
                      onChange={(e) => updateDraftField(item.id, "priceText", e.target.value)}
                    />
                  </label>
                  <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
                    {c.aiReviewPriceAmount}
                    <input
                      className={`${INPUT} mt-1`}
                      value={draft.priceAmount}
                      onChange={(e) => updateDraftField(item.id, "priceAmount", e.target.value)}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
                    {c.aiReviewUnit}
                    <input
                      className={`${INPUT} mt-1`}
                      value={draft.unit}
                      onChange={(e) => updateDraftField(item.id, "unit", e.target.value)}
                    />
                  </label>
                  <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
                    {c.aiReviewCategory}
                    <input
                      className={`${INPUT} mt-1`}
                      value={draft.category}
                      onChange={(e) => updateDraftField(item.id, "category", e.target.value)}
                    />
                  </label>
                </div>
                <label className="block text-[10px] font-semibold uppercase text-[#1E1814]/55">
                  {c.aiReviewTags}
                  <input
                    className={`${INPUT} mt-1`}
                    value={draft.searchTags}
                    onChange={(e) => updateDraftField(item.id, "searchTags", e.target.value)}
                    placeholder={lang === "en" ? "comma separated" : "separadas por coma"}
                  />
                </label>
              </div>

              <p className="mt-3 text-[10px] text-[#1E1814]/50">
                {c.aiReviewSource}:{" "}
                {item.sourceAssetId || item.sourceAssetUrl
                  ? `${item.sourceAssetId || "asset"}${item.sourcePage != null ? ` · p.${item.sourcePage}` : ""}`
                  : c.aiReviewSourceUnknown}
              </p>

              {item.reviewStatus === "approved" ? (
                <p className="mt-2 text-[10px] font-medium text-emerald-800">
                  {item.isActive ? c.aiReviewApprovedPublic : c.aiReviewApprovedNote}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={BTN_SECONDARY} disabled={busy} onClick={() => void handleSave(item.id)}>
                  {c.aiReviewSave}
                </button>
                <button
                  type="button"
                  className={BTN_PRIMARY}
                  disabled={busy}
                  onClick={() => void handleStatusAction(item.id, "approved")}
                >
                  {c.aiReviewApprove}
                </button>
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  disabled={busy}
                  onClick={() => void handleStatusAction(item.id, "needs_review")}
                >
                  {c.aiReviewNeedsReview}
                </button>
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  disabled={busy}
                  onClick={() => void handleStatusAction(item.id, "rejected")}
                >
                  {c.aiReviewReject}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
