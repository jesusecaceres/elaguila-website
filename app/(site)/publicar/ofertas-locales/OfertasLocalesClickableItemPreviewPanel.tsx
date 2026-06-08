"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOfertaLocalReviewItems } from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewClient";
import {
  formatOfertaLocalItemConfidenceDisplay,
  formatOfertaLocalItemReviewStatusDisplay,
  mapToOfertaLocalClickablePreviewCard,
} from "@/app/lib/ofertas-locales/ofertasLocalesClickableItemPreviewHelpers";
import type { OfertaLocalDraft, OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";
import { OfertasLocalesItemDetailDrawer } from "./OfertasLocalesItemDetailDrawer";

const CARD =
  "w-full rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[#7A1E2C]/45 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25 active:scale-[0.99]";
const BTN_SECONDARY =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";

type Props = {
  lang: OfertasLocalesAppLang;
  ofertaLocalId?: string | null;
  scanJobId?: string | null;
  draft?: OfertaLocalDraft | null;
};

function statusBadgeClass(status: OfertaLocalItemReviewViewModel["reviewStatus"]): string {
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

export function OfertasLocalesClickableItemPreviewPanel({
  lang,
  ofertaLocalId,
  scanJobId,
  draft,
}: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const [items, setItems] = useState<OfertaLocalItemReviewViewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<OfertaLocalItemReviewViewModel | null>(null);

  const hasContext = Boolean(ofertaLocalId?.trim());

  const loadItems = useCallback(async () => {
    if (!ofertaLocalId?.trim()) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOfertaLocalReviewItems(ofertaLocalId, scanJobId);
      if (!res.ok) {
        setError(res.error ?? c.clickablePreviewLoadFailed);
        setItems([]);
        return;
      }
      setItems(res.items ?? []);
    } catch {
      setError(c.clickablePreviewLoadFailed);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [c.clickablePreviewLoadFailed, ofertaLocalId, scanJobId]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const cards = useMemo(() => items.map(mapToOfertaLocalClickablePreviewCard), [items]);

  if (!hasContext) return null;

  return (
    <section className="rounded-2xl border border-[#D4C4A8]/80 bg-[#FAF6F0]/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#1E1814]">{c.clickablePreviewPanelTitle}</h3>
          <p className="mt-1 text-xs text-[#1E1814]/70">{c.clickablePreviewIntro}</p>
        </div>
        <button
          type="button"
          className={BTN_SECONDARY}
          disabled={loading}
          onClick={() => void loadItems()}
        >
          {loading ? c.clickablePreviewRefreshing : c.clickablePreviewRefresh}
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-3 py-2 text-xs text-[#1E1814]/80">
        {c.clickablePreviewPrivateSafety}
      </div>

      {loading && items.length === 0 ? (
        <p className="mt-4 text-sm text-[#1E1814]/70">{c.clickablePreviewLoading}</p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && cards.length === 0 ? (
        <p className="mt-4 text-sm text-[#1E1814]/70">{c.clickablePreviewEmpty}</p>
      ) : null}

      {cards.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const item = items.find((x) => x.id === card.id);
            if (!item) return null;
            const statusLabel = formatOfertaLocalItemReviewStatusDisplay(card.reviewStatus, lang);
            const confidenceLabel = formatOfertaLocalItemConfidenceDisplay(card.confidenceLabel, lang);
            return (
              <li key={card.id}>
                <button
                  type="button"
                  className={CARD}
                  onClick={() => setSelectedItem(item)}
                  aria-label={`${card.itemName} — ${c.clickablePreviewTapHint}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1E1814]">{card.itemName || "—"}</p>
                    <span className="shrink-0 rounded-full bg-[#1E1814]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1E1814]">
                      {c.clickablePreviewNotPublicBadge}
                    </span>
                  </div>
                  <p className="mt-1 text-base font-bold text-[#7A1E2C]">{card.priceDisplay}</p>
                  {card.categoryLabel ? (
                    <p className="mt-1 text-xs text-[#1E1814]/65">{card.categoryLabel}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(card.reviewStatus)}`}>
                      {statusLabel}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {c.aiReviewConfidence}: {confidenceLabel}
                    </span>
                    {card.sourcePage != null && card.sourcePage > 0 ? (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-[#1E1814]/70 ring-1 ring-[#D4C4A8]/80">
                        {c.clickablePreviewSourcePage} {card.sourcePage}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[11px] text-[#1E1814]/50">{c.clickablePreviewTapHint}</p>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selectedItem ? (
        <OfertasLocalesItemDetailDrawer
          lang={lang}
          item={selectedItem}
          draft={draft}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </section>
  );
}
