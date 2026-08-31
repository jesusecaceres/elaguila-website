"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { submitOfertaLocalAiScan } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanSubmit";
import { fetchOfertaLocalReviewItems } from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewClient";
import {
  summarizeOfertaLocalPageCompletion,
  summarizeScopedItemReviewCounts,
} from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import type {
  OfertaLocalItemReviewStatus,
  OfertaLocalItemReviewViewModel,
  OfertaLocalPublishedAssetMetadata,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import Link from "next/link";

type Lang = "es" | "en";

export type OfertaLocalOwnerReviewSummary = {
  itemsTotal: number;
  approvedCount: number;
  reviewComplete: boolean;
  totalPages: number;
  completedPages: number;
};

type Props = {
  lang: Lang;
  offerId: string;
  wantsAiSearchableSpecials: boolean;
  flyerAssets: OfertaLocalPublishedAssetMetadata[];
  couponAssets: OfertaLocalPublishedAssetMetadata[];
  offerStatus: string;
  onReviewSummaryChange?: (summary: OfertaLocalOwnerReviewSummary) => void;
};

const SCANNABLE_OWNER_STATUSES: ReadonlySet<string> = new Set([
  "draft",
  "submitted",
  "pending_review",
]);

const ITEMS_PER_PAGE = 2;

function firstScannableAsset(
  flyerAssets: OfertaLocalPublishedAssetMetadata[],
  couponAssets: OfertaLocalPublishedAssetMetadata[]
): { assetId: string; assetKind: "flyer" | "coupon"; assetUrl: string; mimeType: string } | null {
  for (const asset of flyerAssets) {
    const url = asset.url?.trim();
    if (!url?.startsWith("https://")) continue;
    return {
      assetId: asset.id,
      assetKind: "flyer",
      assetUrl: url,
      mimeType: asset.mimeType?.trim() || "application/pdf",
    };
  }
  for (const asset of couponAssets) {
    const url = asset.url?.trim();
    if (!url?.startsWith("https://")) continue;
    return {
      assetId: asset.id,
      assetKind: "coupon",
      assetUrl: url,
      mimeType: asset.mimeType?.trim() || "application/pdf",
    };
  }
  return null;
}

function reviewStatusBadgeText(status: OfertaLocalItemReviewStatus, lang: Lang): string {
  if (status === "approved") return lang === "es" ? "Aprobado" : "Approved";
  if (status === "rejected") return lang === "es" ? "Rechazado" : "Rejected";
  if (status === "needs_review") return lang === "es" ? "Por revisar" : "To review";
  return lang === "es" ? "Pendiente" : "Pending";
}

function reviewStatusBadgeClass(status: OfertaLocalItemReviewStatus): string {
  if (status === "approved") return "bg-emerald-100 text-emerald-900";
  if (status === "rejected") return "bg-red-100 text-red-900";
  return "bg-amber-100 text-amber-900";
}

function ProductSummaryCard({ item, lang }: { item: OfertaLocalItemReviewViewModel; lang: Lang }) {
  const isCoupon = item.candidateType === "coupon" || item.candidateType === "promo";
  const name = (isCoupon ? item.couponTitle || item.itemName : item.itemName) || "—";
  const priceText = isCoupon ? item.offerText || item.priceText : item.priceText;
  return (
    <div className="rounded-xl border border-[#D4C4A8]/70 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${reviewStatusBadgeClass(item.reviewStatus)}`}>
          {reviewStatusBadgeText(item.reviewStatus, lang)}
        </span>
        {item.sourcePage != null ? (
          <span className="text-[10px] text-[#7A7164]">
            {lang === "es" ? "Página" : "Page"} {item.sourcePage}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 font-semibold text-[#1E1810]">{name}</p>
      {priceText ? <p className="text-xs text-[#5C5346]">{priceText}</p> : null}
    </div>
  );
}

export function OfertasLocalesOwnerAiManageSection({
  lang,
  offerId,
  wantsAiSearchableSpecials: _legacyWantsAiSearchableSpecials,
  flyerAssets,
  couponAssets,
  offerStatus,
  onReviewSummaryChange,
}: Props) {
  const [scanJobId, setScanJobId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [items, setItems] = useState<OfertaLocalItemReviewViewModel[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);

  const scannable = useMemo(
    () => firstScannableAsset(flyerAssets, couponAssets),
    [flyerAssets, couponAssets]
  );

  const canScan =
    Boolean(scannable) &&
    SCANNABLE_OWNER_STATUSES.has(offerStatus);

  const loadItems = useCallback(async () => {
    if (!offerId.trim()) return;
    const result = await fetchOfertaLocalReviewItems(offerId, null);
    if (!result.ok) return;
    setItems(result.items ?? []);
    setItemsLoaded(true);
    const counts = summarizeScopedItemReviewCounts(result.items ?? []);
    const pageCompletion = summarizeOfertaLocalPageCompletion(result.items ?? [], result.scanJobs ?? []);
    onReviewSummaryChange?.({
      itemsTotal: (result.items ?? []).length,
      approvedCount: counts.approved,
      reviewComplete: (result.items ?? []).length > 0 && counts.pending === 0 && counts.needs_review === 0,
      totalPages: pageCompletion.totalPages,
      completedPages: pageCompletion.completedPages,
    });
  }, [offerId, onReviewSummaryChange]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleScan = useCallback(async () => {
    if (!canScan || !scannable) return;
    setScanning(true);
    setScanMessage(null);
    const result = await submitOfertaLocalAiScan({
      ofertaLocalId: offerId,
      assetId: scannable.assetId,
      assetKind: scannable.assetKind,
      assetUrl: scannable.assetUrl,
      storagePath: "",
      mimeType: scannable.mimeType,
    });
    setScanning(false);
    if (!result.ok) {
      setScanMessage(result.detail ?? result.message ?? result.error ?? "Scan failed");
      return;
    }
    if (result.scanJobId) setScanJobId(result.scanJobId);
    setScanMessage(result.message ?? (lang === "es" ? "Escaneo completado." : "Scan completed."));
    void loadItems();
  }, [canScan, scannable, offerId, lang, loadItems]);

  if (!scannable) return null;

  const counts = summarizeScopedItemReviewCounts(items);
  const reviewComplete = items.length > 0 && counts.pending === 0 && counts.needs_review === 0;
  const manageHref = withClasificadosPublishLang("/publicar/ofertas-locales", lang, {
    id: offerId,
    step: 5,
    review: 1,
    intent: "continue",
  });

  const pageStart = Math.min(pageOffset, Math.max(0, items.length - 1));
  const visibleItems = items.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const rangeLabel =
    items.length === 0
      ? ""
      : `${pageStart + 1}–${Math.min(pageStart + ITEMS_PER_PAGE, items.length)} ${lang === "es" ? "de" : "of"} ${items.length}`;

  const t =
    lang === "es"
      ? {
          title: "Revisión de análisis con IA",
          scan: "Analizar volante/cupón",
          scanning: "Analizando…",
          scanHint: "El análisis con IA está incluido. Los artículos sugeridos requieren aprobación antes de ser públicos.",
          unavailable: "El análisis nuevo solo está disponible antes de la aprobación final.",
          analysisComplete: "✅ Análisis completado",
          productsFound: (n: number) => `${n} productos encontrados`,
          productsTitle: "PRODUCTOS DEL VOLANTE",
          summaryLine: (approved: number, total: number) => `${approved} aprobados${total > 0 ? ` de ${total}` : ""}`,
          manage: "Gestionar productos",
          prev: "←",
          next: "→",
          noItems: "Todavía no hay productos extraídos.",
        }
      : {
          title: "AI analysis review",
          scan: "Analyze flyer/coupon",
          scanning: "Analyzing…",
          scanHint: "AI analysis is included. Suggested items require approval before they become public.",
          unavailable: "New analysis is only available before final approval.",
          analysisComplete: "✅ Analysis complete",
          productsFound: (n: number) => `${n} products found`,
          productsTitle: "FLYER PRODUCTS",
          summaryLine: (approved: number, total: number) => `${approved} approved${total > 0 ? ` of ${total}` : ""}`,
          manage: "Manage products",
          prev: "←",
          next: "→",
          noItems: "No products extracted yet.",
        };

  return (
    <section className="mb-8 space-y-4">
      <div>
        <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.title}</h2>
        <p className="mt-1 text-xs text-[#7A7164]">{t.scanHint}</p>
      </div>
      {reviewComplete ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          {t.analysisComplete} · {t.productsFound(items.length)}
        </div>
      ) : canScan ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={scanning}
            onClick={() => void handleScan()}
            className="rounded-xl bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {scanning ? t.scanning : t.scan}
          </button>
          {scanMessage ? <p className="text-xs text-[#5C5346]">{scanMessage}</p> : null}
        </div>
      ) : (
        <p className="text-xs text-[#7A7164]">{t.unavailable}</p>
      )}

      {itemsLoaded && items.length > 0 ? (
        <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.productsTitle}</p>
          <p className="mt-1 text-sm font-semibold text-[#1E1810]">
            {t.summaryLine(counts.approved, items.length)}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {visibleItems.map((item) => (
              <ProductSummaryCard key={item.id} item={item} lang={lang} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pageStart <= 0}
                onClick={() => setPageOffset((p) => Math.max(0, p - ITEMS_PER_PAGE))}
                className="min-h-9 rounded-lg border border-[#D4C4A8] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1810] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.prev}
              </button>
              <span className="text-xs text-[#7A7164]">{rangeLabel}</span>
              <button
                type="button"
                disabled={pageStart + ITEMS_PER_PAGE >= items.length}
                onClick={() => setPageOffset((p) => p + ITEMS_PER_PAGE)}
                className="min-h-9 rounded-lg border border-[#D4C4A8] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1810] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.next}
              </button>
            </div>
            <Link
              href={manageHref}
              className="min-h-11 rounded-xl bg-[#2A2620] px-4 py-2 text-sm font-bold text-[#FAF7F2]"
            >
              {t.manage}
            </Link>
          </div>
        </div>
      ) : itemsLoaded ? (
        <p className="text-xs text-[#7A7164]">{t.noItems}</p>
      ) : null}
    </section>
  );
}
