/**
 * Ofertas Locales scan review runtime — polling, scoping, copy (Gate OFERTAS-ACTIVE-SCAN-UI-1).
 */

import type { OfertasLocalesAppLang } from "./useOfertasLocalesAppLang";
import type {
  OfertaLocalItemReviewStatus,
  OfertaLocalItemReviewViewModel,
  OfertaLocalScanJobSummary,
} from "./ofertasLocalesTypes";

export const OFERTA_LOCAL_SCAN_REVIEW_POLL_MS = 3500;
export const OFERTA_LOCAL_SCAN_REVIEW_POLL_TIMEOUT_MS = 10 * 60 * 1000;
export const OFERTA_LOCAL_SCAN_UI_LONG_WAIT_MS = 3 * 60 * 1000;
export const OFERTA_LOCAL_CROP_POLL_GRACE_MS = 90_000;

export type OfertaLocalScanUiPhase =
  | "preparing"
  | "rendering_pages"
  | "gemini_analysis"
  | "generating_crops"
  | "saving"
  | "long_wait";

export type OfertaLocalSourceFileRole = "flyer" | "coupon";

export type OfertaLocalItemCropListStatus = "crop" | "pending" | "none";

export type OfertaLocalActiveScanCopy = {
  scanningFlyer: string;
  scanningCoupon: string;
  autoResultsHint: string;
  refreshNow: string;
  refreshBackupHint: string;
  currentScan: string;
  previousScans: string;
  readyFlyer: string;
  readyCoupon: string;
  cropPending: string;
  cropNone: string;
  cropAdClipPage: string;
  listCropPending: string;
  listCropNone: string;
  viewPage: string;
  showingPage: string;
  scanPhasePreparing: string;
  scanPhaseRendering: string;
  scanPhaseAnalyzing: string;
  scanPhaseCrops: string;
  scanPhaseReady: string;
  scanPhaseError: string;
  scanInProgressEmpty: string;
};

export function getOfertaLocalActiveScanCopy(lang: OfertasLocalesAppLang): OfertaLocalActiveScanCopy {
  if (lang === "en") {
    return {
      scanningFlyer: "Scanning main flyer…",
      scanningCoupon: "Scanning coupon / additional…",
      autoResultsHint: "New results will appear here automatically.",
      refreshNow: "Refresh now",
      refreshBackupHint: "Results update automatically. Use this only if something is missing.",
      currentScan: "Current scan",
      previousScans: "Previous scans",
      readyFlyer: "Main flyer ready to review.",
      readyCoupon: "Coupon / additional ready to review.",
      cropPending: "Clip pending — generating clip…",
      cropNone: "No clip available — showing full page view.",
      cropAdClipPage: "Ad clip · Page",
      listCropPending: "Clip pending",
      listCropNone: "No clip",
      viewPage: "View page",
      showingPage: "Showing page {page} of the ad.",
      scanPhasePreparing: "Preparing",
      scanPhaseRendering: "Rendering",
      scanPhaseAnalyzing: "Analyzing",
      scanPhaseCrops: "Generating clips",
      scanPhaseReady: "Ready to review",
      scanPhaseError: "Error",
      scanInProgressEmpty: "Scan in progress — new products will appear here automatically.",
    };
  }
  return {
    scanningFlyer: "Escaneando Volante principal…",
    scanningCoupon: "Escaneando Cupón / adicional…",
    autoResultsHint: "Resultados nuevos aparecerán aquí automáticamente.",
    refreshNow: "Actualizar ahora",
    refreshBackupHint:
      "Los resultados se actualizan automáticamente. Usa esto solo si algo no aparece.",
    currentScan: "Escaneo actual",
    previousScans: "Escaneos anteriores",
    readyFlyer: "Volante principal listo para revisar.",
    readyCoupon: "Cupón / adicional listo para revisar.",
    cropPending: "Recorte pendiente — generando recorte…",
    cropNone: "Sin recorte disponible — mostrando página completa.",
    cropAdClipPage: "Recorte del anuncio · Página",
    listCropPending: "Recorte pendiente",
    listCropNone: "Sin recorte",
    viewPage: "Ver página",
    showingPage: "Mostrando página {page} del anuncio.",
    scanPhasePreparing: "Preparando",
    scanPhaseRendering: "Renderizando",
    scanPhaseAnalyzing: "Analizando",
    scanPhaseCrops: "Generando recortes",
    scanPhaseReady: "Listo para revisar",
    scanPhaseError: "Error",
    scanInProgressEmpty: "Escaneo en curso — los productos aparecerán aquí automáticamente.",
  };
}

export function getOfertaLocalScanPhaseMessage(
  elapsedMs: number,
  lang: OfertasLocalesAppLang
): { phase: OfertaLocalScanUiPhase; message: string; longWait: boolean } {
  const es: Record<OfertaLocalScanUiPhase, string> = {
    preparing: "Preparando archivo…",
    rendering_pages: "Renderizando páginas…",
    gemini_analysis: "Analizando con Gemini…",
    generating_crops: "Generando recortes…",
    saving: "Guardando sugerencias…",
    long_wait:
      "El escaneo sigue procesando. Puedes esperar o revisar los resultados que ya estén disponibles abajo.",
  };
  const en: Record<OfertaLocalScanUiPhase, string> = {
    preparing: "Preparing file…",
    rendering_pages: "Rendering pages…",
    gemini_analysis: "Analyzing with Gemini…",
    generating_crops: "Generating ad clips…",
    saving: "Saving suggestions…",
    long_wait:
      "The scan is still processing. You can wait or review any results already available below.",
  };
  const copy = lang === "en" ? en : es;

  if (elapsedMs >= OFERTA_LOCAL_SCAN_UI_LONG_WAIT_MS) {
    return { phase: "long_wait", message: copy.long_wait, longWait: true };
  }
  if (elapsedMs < 15_000) return { phase: "preparing", message: copy.preparing, longWait: false };
  if (elapsedMs < 45_000) return { phase: "rendering_pages", message: copy.rendering_pages, longWait: false };
  if (elapsedMs < 120_000) return { phase: "gemini_analysis", message: copy.gemini_analysis, longWait: false };
  if (elapsedMs < 180_000) return { phase: "generating_crops", message: copy.generating_crops, longWait: false };
  return { phase: "saving", message: copy.saving, longWait: false };
}

export function formatScanElapsed(seconds: number, lang: OfertasLocalesAppLang): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (lang === "en") return m > 0 ? `${m}m ${s}s` : `${s}s`;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

export function logOfertaLocalScanUi(event: string, payload: Record<string, unknown> = {}): void {
  console.info(`[ofertas-locales scan ui] ${event}`, payload);
}

export function isOfertaLocalScanJobActive(status: string | undefined): boolean {
  return status === "pending" || status === "processing";
}

export function pickDefaultOfertaLocalReviewItemId(
  items: OfertaLocalItemReviewViewModel[]
): string | null {
  if (items.length === 0) return null;
  const needsReview = items.find((item) => item.reviewStatus === "needs_review");
  return needsReview?.id ?? items[0].id;
}

export function itemHasPendingCrop(item: {
  sourceBbox: unknown | null;
  sourceCropUrl: string;
}): boolean {
  return Boolean(item.sourceBbox) && !item.sourceCropUrl?.trim();
}

export function resolveItemCropListStatus(
  item: OfertaLocalItemReviewViewModel,
  scanActiveForAsset: boolean
): OfertaLocalItemCropListStatus {
  if (item.sourceCropUrl?.trim()) return "crop";
  if (itemHasPendingCrop(item) && scanActiveForAsset) return "pending";
  return "none";
}

export function summarizeScopedItemReviewCounts(
  items: OfertaLocalItemReviewViewModel[]
): Record<OfertaLocalItemReviewStatus, number> {
  const counts: Record<OfertaLocalItemReviewStatus, number> = {
    pending: 0,
    needs_review: 0,
    approved: 0,
    rejected: 0,
  };
  for (const item of items) {
    counts[item.reviewStatus] += 1;
  }
  return counts;
}

/** Latest scan job for a source file — used after hard refresh and tab switches. */
export function resolveLatestScanJobIdForAsset(
  assetId: string,
  items: OfertaLocalItemReviewViewModel[],
  scanJobs: OfertaLocalScanJobSummary[],
  preferredScanJobId?: string | null
): string | null {
  const assetItems = items.filter((item) => item.sourceAssetId === assetId && item.scanJobId);
  if (assetItems.length === 0) return null;

  if (preferredScanJobId && assetItems.some((item) => item.scanJobId === preferredScanJobId)) {
    return preferredScanJobId;
  }

  const jobIds = new Set(assetItems.map((item) => item.scanJobId!));
  for (const job of scanJobs) {
    if (jobIds.has(job.id)) return job.id;
  }

  const newestByJob = new Map<string, string>();
  for (const item of assetItems) {
    const jobId = item.scanJobId!;
    const prev = newestByJob.get(jobId);
    if (!prev || item.createdAt > prev) newestByJob.set(jobId, item.createdAt);
  }
  const sorted = [...newestByJob.entries()].sort((a, b) => b[1].localeCompare(a[1]));
  return sorted[0]?.[0] ?? null;
}

export function partitionItemsByActiveScanJob(
  items: OfertaLocalItemReviewViewModel[],
  activeScanJobId: string | null
): {
  currentScanItems: OfertaLocalItemReviewViewModel[];
  previousScanItems: OfertaLocalItemReviewViewModel[];
} {
  if (!activeScanJobId) {
    return { currentScanItems: [], previousScanItems: items.filter((item) => Boolean(item.scanJobId)) };
  }
  const currentScanItems = items.filter((item) => item.scanJobId === activeScanJobId);
  const previousScanItems = items.filter((item) => item.scanJobId && item.scanJobId !== activeScanJobId);
  return { currentScanItems, previousScanItems };
}

export function formatShowingPage(copy: string, page: number): string {
  return copy.replace("{page}", String(page));
}

export function withPdfPageHash(url: string, page: number | null | undefined): string {
  if (!url || !page || page < 1) return url;
  return `${url.split("#")[0]}#page=${page}`;
}

export function assetRoleFromEligible(
  assetKind: "flyer" | "coupon" | undefined
): OfertaLocalSourceFileRole {
  return assetKind === "coupon" ? "coupon" : "flyer";
}

export function inferScanningAssetId(
  scanPollingActive: boolean,
  scanJobs: OfertaLocalScanJobSummary[],
  items: OfertaLocalItemReviewViewModel[],
  fallbackAssetId: string | null
): string | null {
  if (!scanPollingActive) return null;
  for (const job of scanJobs) {
    if (!isOfertaLocalScanJobActive(job.status)) continue;
    const first = items.find((item) => item.scanJobId === job.id && item.sourceAssetId);
    if (first?.sourceAssetId) return first.sourceAssetId;
  }
  return fallbackAssetId;
}

/** Active scan job for the review desk — isolates fresh scans from stale rows. */
export function resolveActiveScanJobIdForReviewSession(
  assetId: string,
  items: OfertaLocalItemReviewViewModel[],
  scanJobs: OfertaLocalScanJobSummary[],
  highlightScanJobId: string | null,
  scanPollingActive: boolean,
  scanningAssetId: string | null
): string | null {
  if (scanPollingActive && scanningAssetId === assetId) {
    for (const job of scanJobs) {
      if (!isOfertaLocalScanJobActive(job.status)) continue;
      const match = items.filter((item) => item.scanJobId === job.id && item.sourceAssetId === assetId);
      if (match.length > 0) return job.id;
    }
    if (scanJobs.some((job) => isOfertaLocalScanJobActive(job.status))) return null;
  }

  const latest = resolveLatestScanJobIdForAsset(assetId, items, scanJobs, highlightScanJobId);
  if (!latest || !scanPollingActive || scanningAssetId !== assetId) return latest;

  const latestJob = scanJobs.find((job) => job.id === latest);
  if (latestJob && !isOfertaLocalScanJobActive(latestJob.status)) {
    if (scanJobs.some((job) => isOfertaLocalScanJobActive(job.status))) return null;
  }
  return latest;
}

export function resolveAssetScanTabStatus(
  assetId: string,
  assetKind: "flyer" | "coupon" | undefined,
  items: OfertaLocalItemReviewViewModel[],
  scanJobs: OfertaLocalScanJobSummary[],
  highlightScanJobId: string | null,
  scanPollingActive: boolean,
  scanningAssetId: string | null,
  lang: OfertasLocalesAppLang
): string | null {
  const copy = getOfertaLocalActiveScanCopy(lang);
  const role = assetRoleFromEligible(assetKind);

  if (scanPollingActive && scanningAssetId === assetId) {
    return role === "coupon" ? copy.scanningCoupon : copy.scanningFlyer;
  }

  const activeJobId = resolveActiveScanJobIdForReviewSession(
    assetId,
    items,
    scanJobs,
    highlightScanJobId,
    scanPollingActive,
    scanningAssetId
  );
  if (!activeJobId) return null;

  const job = scanJobs.find((entry) => entry.id === activeJobId);
  if (job?.status === "failed") return copy.scanPhaseError;

  const count = items.filter((item) => item.scanJobId === activeJobId && item.sourceAssetId === assetId).length;
  if (count > 0 && job && !isOfertaLocalScanJobActive(job.status)) return copy.scanPhaseReady;
  if (job && isOfertaLocalScanJobActive(job.status)) {
    if (job.pagesProcessed > 0 && job.itemsExtractedCount === 0) return copy.scanPhaseAnalyzing;
    if (job.pagesProcessed > 0) return copy.scanPhaseCrops;
    return copy.scanPhaseRendering;
  }
  return null;
}
