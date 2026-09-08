/**
 * Certified AI scanner core — protected path manifest.
 *
 * These files were proven scanner-execution-critical at certification time
 * (see OFERTAS_AI_SCANNER_CERTIFIED_REPAIR_MANUAL.md §4). Modifying any of
 * them changes scanner behavior and requires an explicit scanner-reopen
 * authorization per OFERTAS_AI_SCANNER_SEALED.md's REOPEN PROCEDURE.
 *
 * Files NOT listed here (review workspace layout, dashboard chrome, wizard
 * UX, copy) are safe to rearrange as long as they keep calling these
 * contracts without changing their request/response shape.
 */

export type OfertasAiScannerProtectedPathCategory =
  | "CLIENT_GATE"
  | "SCAN_PREP"
  | "SCAN_ROUTE"
  | "PROVIDER"
  | "NORMALIZATION"
  | "PERSISTENCE"
  | "DB_CONTRACT"
  | "REVIEW_DATA";

export type OfertasAiScannerProtectedPathEntry = {
  path: string;
  category: OfertasAiScannerProtectedPathCategory;
  reason: string;
};

export const OFERTAS_AI_SCANNER_PROTECTED_PATHS: readonly OfertasAiScannerProtectedPathEntry[] = [
  // CLIENT_GATE — readiness + the button dispatch itself
  {
    path: "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx",
    category: "CLIENT_GATE",
    reason: "Scan button dispatch, readiness computation, scan-prep/scan client call sequence.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAiScanReadiness.ts",
    category: "CLIENT_GATE",
    reason: "Canonical scanReady gate — entitlement, eligible assets, signed-in, persistability.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesDraftAssetHelpers.ts",
    category: "CLIENT_GATE",
    reason: "Asset eligibility predicates consumed by readiness.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAiScanPersistClient.ts",
    category: "CLIENT_GATE",
    reason: "Client-side ensureOfertaLocalRecordForAiScan call before scan dispatch.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAiScanSubmit.ts",
    category: "CLIENT_GATE",
    reason: "Client-side submitOfertaLocalAiScan call that dispatches the /scan request.",
  },
  {
    path: "app/lib/ofertas-locales/useOfertasLocalesDraft.ts",
    category: "CLIENT_GATE",
    reason: "Draft hydration + owner-stamp reconciliation feeding readiness/eligible-asset state.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts",
    category: "CLIENT_GATE",
    reason: "Browser draft/session storage, owner-stamp read/write consumed by draft identity.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesDraftIdentity.ts",
    category: "CLIENT_GATE",
    reason: "Continue/new/active decision that determines which draft (and canonical id) loads.",
  },

  // SCAN_PREP — canonical parent persistence before scanning
  {
    path: "app/api/ofertas-locales/scan-prep/route.ts",
    category: "SCAN_PREP",
    reason: "Creates/updates the owner-bound canonical ofertas_locales row before scan.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAiScanPersist.ts",
    category: "SCAN_PREP",
    reason: "Scan-time minimum-field validator — deliberately separate from publish validation.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter.ts",
    category: "SCAN_PREP",
    reason: "Builds the exact ofertas_locales insert/update row + return-column contract.",
  },

  // SCAN_ROUTE — the actual scan execution endpoint
  {
    path: "app/api/ofertas-locales/scan/route.ts",
    category: "SCAN_ROUTE",
    reason: "Scan endpoint entry point.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts",
    category: "SCAN_ROUTE",
    reason: "Full scan orchestration: ownership, source version, job creation, provider call, item insert, progress updates, error handling.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAssetLifecycle.ts",
    category: "SCAN_ROUTE",
    reason: "Source asset version resolution/creation used by scan-prep and scan.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesScanProgress.ts",
    category: "SCAN_ROUTE",
    reason: "Scan job + scan page progress writers used during extraction.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesReviewAuth.ts",
    category: "SCAN_ROUTE",
    reason: "Owner/admin auth resolution shared by scan, scan-prep, and item review routes.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAiScanSizeLimits.ts",
    category: "SCAN_ROUTE",
    reason: "Asset byte-size enforcement before provider invocation.",
  },

  // PROVIDER — Gemini + Document AI + fallback gate
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAiScanOrchestrator.ts",
    category: "PROVIDER",
    reason: "The Gemini-success / Document-AI-fallback decision gate (items.length > 0, not gemini.ok).",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesGeminiScanPipeline.ts",
    category: "PROVIDER",
    reason: "Gemini multimodal extraction pipeline.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesGeminiPageExtractor.ts",
    category: "PROVIDER",
    reason: "Per-page Gemini extraction.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesGeminiConfig.ts",
    category: "PROVIDER",
    reason: "Provider resolution (GEMINI_API_KEY presence) and configured-provider checks.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesDocumentAiClient.ts",
    category: "PROVIDER",
    reason: "Document AI fallback extraction call.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesDocumentAiConfig.ts",
    category: "PROVIDER",
    reason: "Document AI env/configuration resolution.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts",
    category: "PROVIDER",
    reason: "PDF-to-page-image rasterization consumed by both providers.",
  },

  // NORMALIZATION — raw provider output -> candidate drafts
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAiNormalizer.ts",
    category: "NORMALIZATION",
    reason: "Document AI raw extraction -> OfertaLocalSearchableItemDraft[] normalization.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesGeminiNormalizer.ts",
    category: "NORMALIZATION",
    reason: "Gemini raw response normalization.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAiPriceNormalizer.ts",
    category: "NORMALIZATION",
    reason: "Candidate price-text normalization during extraction.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesPriceNormalization.ts",
    category: "NORMALIZATION",
    reason: "Final server-side price truth applied immediately before DB insert.",
  },

  // PERSISTENCE — candidate rows -> database
  {
    path: "app/lib/ofertas-locales/ofertasLocalesAiDbMapper.ts",
    category: "PERSISTENCE",
    reason: "Maps normalized item/scan-job drafts to their exact DB insert row shape.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesScanCropGenerator.ts",
    category: "PERSISTENCE",
    reason: "Crop generation applied to persisted items (non-fatal if it fails — see manual §16).",
  },

  // DB_CONTRACT — the schema surface the above code assumes
  {
    path: "app/lib/ofertas-locales/ofertasLocalesDbSchema.ts",
    category: "DB_CONTRACT",
    reason: "Single source of truth for production ofertas_locales column set + legacy-removed columns.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesSupabaseSchema.ts",
    category: "DB_CONTRACT",
    reason: "Schema-cache-missing-table/column error detection used across scanner routes.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesMigrationManifest.ts",
    category: "DB_CONTRACT",
    reason: "Canonical migration package dependency manifest.",
  },

  // REVIEW_DATA — retrieval and mutation of scan results
  {
    path: "app/api/ofertas-locales/items/route.ts",
    category: "REVIEW_DATA",
    reason: "Review item + scan job retrieval endpoint.",
  },
  {
    path: "app/api/ofertas-locales/items/[itemId]/route.ts",
    category: "REVIEW_DATA",
    reason: "Review item mutation (approve/reject/review-later) endpoint.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesItemReviewClient.ts",
    category: "REVIEW_DATA",
    reason: "Client fetch wrapper for review item retrieval, used by scan-panel polling.",
  },
  {
    path: "app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts",
    category: "REVIEW_DATA",
    reason: "Review patch validation + DB row <-> view-model mapping.",
  },
] as const;

export function isOfertasAiScannerProtectedPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  return OFERTAS_AI_SCANNER_PROTECTED_PATHS.some((entry) => normalized.endsWith(entry.path));
}
