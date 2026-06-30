/**
 * Local smoke test — Ofertas Locales PDF scan/crop pipeline.
 *
 * Uses an EXTERNAL PDF path only (never commit the fixture unless under test/fixtures/).
 * Does not hardcode product names from the ad.
 *
 * Usage:
 *   set OFERTAS_SMOKE_PDF_PATH=c:\temp_LEONIX_ZIPS\ofertas locales\weekly ad.pdf
 *   npm run ofertas-locales:local-pdf-smoke
 *
 * Optional:
 *   OFERTAS_SMOKE_MAX_PAGES=2   (default 2 — limits Gemini/crop cost)
 *   OFERTAS_SMOKE_SKIP_GEMINI=1   (page render only)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

/** Load .env.local for local smoke (GEMINI_API_KEY, BLOB_READ_WRITE_TOKEN). */
function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

type StepResult = {
  step: string;
  ok: boolean;
  detail: Record<string, unknown>;
};

const results: StepResult[] = [];

function record(step: string, ok: boolean, detail: Record<string, unknown>) {
  results.push({ step, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`\n[${mark}] ${step}`);
  console.log(JSON.stringify(detail, null, 2));
}

function resolvePdfPath(): string {
  const fromEnv = process.env.OFERTAS_SMOKE_PDF_PATH?.trim();
  const fromArg = process.argv.slice(2).find((a) => !a.startsWith("-"));
  const raw = fromArg || fromEnv;
  if (!raw) {
    throw new Error(
      "Set OFERTAS_SMOKE_PDF_PATH or pass PDF path as first CLI argument."
    );
  }
  return path.resolve(raw);
}

function reviewUiLogicSmoke(): void {
  const clipPanel = fs.readFileSync(
    path.join(ROOT, "app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx"),
    "utf8"
  );
  const hasCropImg = clipPanel.includes("if (cropUrl)") && clipPanel.includes("src={cropUrl}");
  const hasPdfFallback = clipPanel.includes("showPdfFallback") && clipPanel.includes("<iframe");
  const hasBboxOverlay = clipPanel.includes("bboxOverlayStyle") && clipPanel.includes("overlayStyle");
  const hasCropPending = clipPanel.includes("cropPending");
  record("7. review UI crop/fallback wiring (static)", hasCropImg && hasPdfFallback && hasBboxOverlay, {
    cropUrlBranch: hasCropImg,
    pdfIframeFallback: hasPdfFallback,
    bboxOverlayOnImage: hasBboxOverlay,
    cropPendingState: hasCropPending,
  });
}

async function main() {
  const pdfPath = resolvePdfPath();
  const maxPages = Math.max(1, Number.parseInt(process.env.OFERTAS_SMOKE_MAX_PAGES ?? "2", 10) || 2);
  process.env.OFERTAS_GEMINI_MAX_PAGES = String(maxPages);

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY?.trim());
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const skipGemini = process.env.OFERTAS_SMOKE_SKIP_GEMINI === "1";

  console.log("Ofertas Locales — local PDF smoke test");
  console.log({ pdfPath, maxPages, geminiConfigured, blobConfigured, skipGemini });

  if (!fs.existsSync(pdfPath)) {
    record("0. fixture path exists", false, { pdfPath });
    process.exitCode = 1;
    return;
  }

  const stat = fs.statSync(pdfPath);
  const fileBuffer = fs.readFileSync(pdfPath);
  const readable = fileBuffer.length > 0 && fileBuffer.subarray(0, 5).toString("ascii") === "%PDF-";
  record("1. upload/readability", readable, {
    sizeBytes: stat.size,
    sizeMb: Number((stat.size / (1024 * 1024)).toFixed(2)),
    pdfMagic: fileBuffer.subarray(0, 5).toString("ascii"),
  });
  if (!readable) {
    process.exitCode = 1;
    return;
  }

  const { prepareOfertaLocalScanPageImages } = await import(
    "../app/lib/ofertas-locales/ofertasLocalesPdfPageImages"
  );

  let prepared: Awaited<ReturnType<typeof prepareOfertaLocalScanPageImages>>;
  try {
    prepared = await prepareOfertaLocalScanPageImages({
      fileBuffer,
      mimeType: "application/pdf",
    });
    const renderOk = prepared.pages.length > 0;
    record("2. PDF page render", renderOk, {
      totalPageCount: prepared.totalPageCount,
      pagesProcessed: prepared.pages.length,
      pagesCapped: prepared.pagesCapped,
      rasterizationFallback: prepared.rasterizationFallback,
      renderMethods: prepared.pages.map((p) => ({
        page: p.pageNumber,
        method: p.renderMethod,
        bytes: p.imageBytes.length,
        width: p.width ?? null,
        height: p.height ?? null,
      })),
      warnings: prepared.renderWarnings.slice(0, 5),
    });
    if (!renderOk) {
      process.exitCode = 1;
      return;
    }
  } catch (err) {
    record("2. PDF page render", false, {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exitCode = 1;
    return;
  }

  if (skipGemini || !geminiConfigured) {
    record("3. Gemini scan", true, {
      skipped: true,
      reason: skipGemini ? "OFERTAS_SMOKE_SKIP_GEMINI=1" : "GEMINI_API_KEY not set",
    });
    record("4. source_bbox extraction", true, { skipped: true });
    record("5. crop generation", true, { skipped: true });
    record("6. source_crop_url on items", true, { skipped: true });
    reviewUiLogicSmoke();
    printSummary();
    return;
  }

  const { runGeminiMultimodalOfertaLocalScan } = await import(
    "../app/lib/ofertas-locales/ofertasLocalesGeminiScanPipeline"
  );

  const smokeId = `smoke-${Date.now()}`;
  let scan: Awaited<ReturnType<typeof runGeminiMultimodalOfertaLocalScan>>;
  try {
    scan = await runGeminiMultimodalOfertaLocalScan({
      fileBuffer,
      mimeType: "application/pdf",
      assetId: `${smokeId}-asset`,
      assetKind: "flyer",
      ofertaLocalId: `${smokeId}-oferta`,
      scanJobId: `${smokeId}-job`,
      ownerId: `${smokeId}-owner`,
      sourceAssetUrl: "https://smoke.local/weekly-ad.pdf",
      sourceFileName: path.basename(pdfPath),
      sourceStoragePath: `smoke/${path.basename(pdfPath)}`,
      businessName: "Smoke Test Store",
      businessAddress: "123 Test St",
      businessCity: "San Jose",
      businessState: "CA",
      businessZipCode: "95112",
    });
  } catch (err) {
    record("3. Gemini scan", false, {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exitCode = 1;
    reviewUiLogicSmoke();
    printSummary();
    return;
  }

  record("3. Gemini scan", scan.ok || scan.items.length > 0, {
    ok: scan.ok,
    modelUsed: scan.modelUsed,
    pagesProcessed: scan.pagesProcessed,
    pageCountTotal: scan.pageCountTotal,
    itemCount: scan.items.length,
    rawCandidateCount: scan.rawCandidateCount,
    rejectedCount: scan.rejectedCount,
    cropsGenerated: scan.cropsGenerated,
    cropErrors: scan.cropErrors.slice(0, 8),
    pageErrors: scan.pageErrors.slice(0, 5),
    note: scan.note,
  });

  const withBbox = scan.items.filter((item) => item.sourceBbox != null);
  const bboxSample = withBbox.slice(0, 3).map((item) => ({
    page: item.sourcePage,
    bbox: item.sourceBbox,
    hasGeminiBboxInJson: Boolean(item.extractedJson?.sourceBboxGemini),
  }));
  record("4. source_bbox extraction", withBbox.length > 0 || scan.items.length === 0, {
    itemsTotal: scan.items.length,
    itemsWithBbox: withBbox.length,
    bboxSample,
    rejectedReasonCounts: scan.rejectedReasonCounts,
  });

  record("5. crop generation", scan.cropsGenerated > 0 || withBbox.length === 0, {
    cropsGenerated: scan.cropsGenerated,
    cropErrors: scan.cropErrors,
    blobConfigured,
    sharpRequired: true,
  });

  const withCropUrl = scan.items.filter((item) => item.sourceCropUrl?.trim());
  record("6. source_crop_url on scan items", withCropUrl.length > 0 || withBbox.length === 0, {
    itemsWithCropUrl: withCropUrl.length,
    cropUrlSample: withCropUrl.slice(0, 2).map((item) => ({
      page: item.sourcePage,
      urlPrefix: item.sourceCropUrl?.slice(0, 60) ?? "",
    })),
    persistenceNote:
      "Full DB persist requires scan API + Supabase; this step validates in-memory item.sourceCropUrl after crop upload.",
  });

  reviewUiLogicSmoke();
  printSummary();
}

function printSummary() {
  const failed = results.filter((r) => !r.ok);
  console.log("\n=== SUMMARY ===");
  console.log(`Steps: ${results.length}, failed: ${failed.length}`);
  if (failed.length) {
    console.log("Failed:", failed.map((f) => f.step).join(", "));
    process.exitCode = 1;
  } else {
    console.log("All smoke steps passed (or skipped where env missing).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
