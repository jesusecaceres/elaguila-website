/**
 * Gate OFERTAS-REVIEW-RUNTIME-1 — auto-refresh scan review + click-to-review crop workflow audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getOfertaLocalScanPhaseMessage,
  isOfertaLocalScanJobActive,
  OFERTA_LOCAL_SCAN_REVIEW_POLL_MS,
  pickDefaultOfertaLocalReviewItemId,
} from "../app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  const runtime = read("app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts");
  const scanPanel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx");
  const reviewPanel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");
  const workspace = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx");
  const clipPanel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx");
  const appClient = read("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
  const copy = read("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
  const scanHandler = read("app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts");

  assert.match(runtime, /OFERTA_LOCAL_SCAN_REVIEW_POLL_MS = 3500/, "poll interval");
  assert.match(runtime, /logOfertaLocalScanUi/, "ui logging helper");
  assert.match(runtime, /pickDefaultOfertaLocalReviewItemId/, "default item picker");
  assert.match(scanPanel, /getOfertaLocalScanPhaseMessage/, "scan phase copy");
  assert.match(scanPanel, /onScanStarted/, "scan started callback");
  assert.match(scanPanel, /onScanFinished/, "scan finished callback");
  assert.match(reviewPanel, /selectedItemId/, "stable selected item id");
  assert.match(reviewPanel, /loadItems\(\{ silent: true \}\)/, "silent polling refresh");
  assert.match(reviewPanel, /polling started/, "polling start log");
  assert.match(reviewPanel, /selected item changed/, "selection change log");
  assert.match(reviewPanel, /scanPollingActive/, "scan polling prop");
  assert.match(reviewPanel, /scanRefreshToken/, "refresh token prop");
  assert.match(workspace, /scanPollingActive/, "workspace passes polling");
  assert.match(clipPanel, /aiReviewCropPending/, "crop pending copy");
  assert.match(appClient, /scanRefreshToken/, "app wires refresh token");
  assert.match(appClient, /OfertasLocalesUploadedFilesSummary/, "upload summary preserved");
  assert.match(copy, /aiReviewScanInProgress/, "scan in progress copy");
  assert.match(scanHandler, /\[ofertas-locales scan\] duration ms/, "scan duration log");

  assert.ok(isOfertaLocalScanJobActive("processing"));
  assert.ok(!isOfertaLocalScanJobActive("needs_review"));
  assert.equal(OFERTA_LOCAL_SCAN_REVIEW_POLL_MS, 3500);

  const phase = getOfertaLocalScanPhaseMessage(150_000, "es");
  assert.match(phase.message, /Generando recortes/);

  const defaultId = pickDefaultOfertaLocalReviewItemId([
    {
      id: "a",
      reviewStatus: "approved",
    } as Parameters<typeof pickDefaultOfertaLocalReviewItemId>[0][number],
    {
      id: "b",
      reviewStatus: "needs_review",
    } as Parameters<typeof pickDefaultOfertaLocalReviewItemId>[0][number],
  ]);
  assert.equal(defaultId, "b");

  console.log("OFERTAS-REVIEW-RUNTIME-1 audit passed.");
}

run();
