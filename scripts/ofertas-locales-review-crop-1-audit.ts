/**
 * Gate OFERTAS-REVIEW-CROP-1 — Gemini bbox + crop review workstation audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  geminiBboxToPixelCropRect,
  validateGeminiSourceBbox,
} from "../app/lib/ofertas-locales/ofertasLocalesGeminiBbox";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  const prompt = read("app/lib/ofertas-locales/ofertasLocalesGeminiPrompt.ts");
  const validator = read("app/lib/ofertas-locales/ofertasLocalesGeminiCandidateValidator.ts");
  const cropGen = read("app/lib/ofertas-locales/ofertasLocalesScanCropGenerator.ts");
  const pipeline = read("app/lib/ofertas-locales/ofertasLocalesGeminiScanPipeline.ts");
  const clipPanel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx");
  const workspace = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx");
  const reviewPanel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");
  const appClient = read("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
  const extractor = read("app/lib/ofertas-locales/ofertasLocalesGeminiPageExtractor.ts");

  assert.match(prompt, /\[ymin, xmin, ymax, xmax\]/, "prompt requests gemini bbox format");
  assert.match(prompt, /0–1000|0-1000/, "prompt mentions 0-1000 scale");
  assert.match(validator, /validateGeminiSourceBbox/, "bbox validation wired");
  assert.match(cropGen, /applyOfertaLocalScanItemCrops/, "crop generator exists");
  assert.match(cropGen, /scan-crops/, "crop storage path");
  assert.match(pipeline, /applyOfertaLocalScanItemCrops/, "pipeline applies crops");
  assert.match(extractor, /temperature:\s*0/, "temperature 0 extraction");
  assert.match(clipPanel, /sourceCropUrl/, "clip panel uses crop url");
  assert.match(clipPanel, /Recorte del anuncio|aiReviewAdClipTitle/, "clip label");
  assert.match(workspace, /OfertasLocalesProductClipPanel/, "workspace uses clip panel");
  assert.match(reviewPanel, /onFocusedItemChange/, "focus callback");
  assert.match(reviewPanel, /sourceCropUrl/, "navigator thumbnails");
  assert.match(appClient, /OfertasLocalesUploadedFilesSummary/, "compact upload summary");
  assert.match(appClient, /!showFullWidthReviewDesk/, "hides duplicate preview grid");

  const bbox = validateGeminiSourceBbox([120, 80, 420, 360]);
  assert.ok(bbox);
  const rect = geminiBboxToPixelCropRect({
    bbox: bbox!.geminiBbox,
    imageWidth: 1700,
    imageHeight: 2200,
  });
  assert.ok(rect);
  assert.ok(rect!.width > 0 && rect!.height > 0);

  const tiny = validateGeminiSourceBbox([100, 100, 105, 105]);
  assert.equal(tiny, null, "rejects tiny bbox");

  console.log("OFERTAS-REVIEW-CROP-1 audit passed.");
}

run();
