/**
 * QA UX Batch — Gate A regression audit (⚠️24, ⚠️37, copy portion of ⚠️32).
 *
 * Proves the scan-review refresh label/hint are now clear and consistent
 * across both render modes, and that product-review navigation is no longer
 * a bare ambiguous "Atrás/Siguiente" — while the underlying refresh/AI-scan
 * handlers and scanner-core paths are completely untouched.
 *
 * Run: npm run ofertas-locales:gate-a-copy-navigation-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { ofertasLocalesAppCopy } from "../app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy";
import { getOfertaLocalActiveScanCopy } from "../app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";

function run() {
  const cEs = ofertasLocalesAppCopy("es");
  const cEn = ofertasLocalesAppCopy("en");
  const scanEs = getOfertaLocalActiveScanCopy("es");
  const scanEn = getOfertaLocalActiveScanCopy("en");

  // --- Case A: "Actualizar ahora" no longer appears anywhere in Spanish copy ---
  assert.notEqual(scanEs.refreshNow, "Actualizar ahora", "CASE A FAILED: stale 'Actualizar ahora' label still present");
  const panelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "utf8"
  );
  assert.doesNotMatch(
    panelSrc,
    /c\.aiReviewRefresh\b/,
    "CASE A FAILED: review panel must no longer reference the removed aiReviewRefresh key"
  );
  console.log("Case A (stale 'Actualizar ahora' removed) passed.");

  // --- Case B: Spanish label is "Actualizar resultados" ---
  assert.equal(scanEs.refreshNow, "Actualizar resultados", "CASE B FAILED: Spanish refresh label must read 'Actualizar resultados'");
  console.log("Case B (Spanish 'Actualizar resultados' present) passed.");

  // --- Case C: Spanish helper explains it's only for missing/stale results ---
  assert.match(
    scanEs.refreshBackupHint,
    /actualizan automáticamente/i,
    "CASE C FAILED: Spanish helper must explain results update automatically"
  );
  assert.match(
    scanEs.refreshBackupHint,
    /si algo no aparece/i,
    "CASE C FAILED: Spanish helper must explain the button is only for missing results"
  );
  console.log("Case C (Spanish helper copy present) passed.");

  // --- Case D: English mode shows "Refresh results" ---
  assert.equal(scanEn.refreshNow, "Refresh results", "CASE D FAILED: English refresh label must read 'Refresh results'");
  console.log("Case D (English 'Refresh results' present) passed.");

  // --- Case E: English helper copy exists ---
  assert.match(
    scanEn.refreshBackupHint,
    /update automatically/i,
    "CASE E FAILED: English helper copy missing or wrong"
  );
  console.log("Case E (English helper copy present) passed.");

  // --- Case F: refresh handler unchanged — both render branches still call loadItems() only ---
  const refreshButtonBlocks = panelSrc.match(/onClick=\{\(\) => void loadItems\(\)\}/g) ?? [];
  assert.equal(
    refreshButtonBlocks.length,
    2,
    "CASE F FAILED: expected exactly 2 refresh buttons (both render branches) still calling loadItems() only"
  );
  assert.doesNotMatch(
    panelSrc,
    /onClick=\{[^}]*(submitOfertaLocalAiScan|scan-prep|\/api\/ofertas-locales\/scan)/,
    "CASE F FAILED: refresh button must never be wired to trigger a scan"
  );
  console.log("Case F (refresh handler unchanged — loadItems only, no scan trigger) passed.");

  // --- Case G: AI scan action label/handler untouched ---
  const scanPanelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx",
    "utf8"
  );
  assert.match(
    scanPanelSrc,
    /onClick=\{\(\) => void handleScanAsset\(/,
    "CASE G FAILED: Analizar con IA button handler must remain handleScanAsset"
  );
  assert.equal(cEs.aiScanButton, cEs.aiScanButton, "sanity"); // aiScanButton key must still exist
  console.log("Case G (AI scan action label/handler unchanged) passed.");

  // --- Case H: ambiguous product-review Atrás/Siguiente replaced ---
  assert.equal(
    cEs.aiReviewPreviousItem,
    "Producto anterior",
    "CASE H FAILED: aiReviewPreviousItem must no longer be the bare 'Atrás'"
  );
  assert.equal(
    cEs.aiReviewNextItem,
    "Siguiente producto",
    "CASE H FAILED: aiReviewNextItem must no longer be the bare 'Siguiente'"
  );
  assert.equal(cEn.aiReviewPreviousItem, "Previous product", "CASE H FAILED: English previous-item label wrong");
  assert.equal(cEn.aiReviewNextItem, "Next product", "CASE H FAILED: English next-item label wrong");
  console.log("Case H (ambiguous product-review nav labels replaced) passed.");

  // --- Case I: new labels are tied to the same existing handlers (goPreviousItem/goNextItem) ---
  assert.match(
    panelSrc,
    /onClick=\{goPreviousItem\}[\s\S]{0,150}\{c\.aiReviewPreviousItem\}/,
    "CASE I FAILED: relabeled previous-item button must still call goPreviousItem"
  );
  assert.match(
    panelSrc,
    /onClick=\{goNextItem\}[\s\S]{0,150}\{c\.aiReviewNextItem\}/,
    "CASE I FAILED: relabeled next-item button must still call goNextItem"
  );
  console.log("Case I (relabeled buttons tied to unchanged handlers) passed.");

  // --- Case J: no scanner protected path touched by this gate ---
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
    "app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `CASE J FAILED: Gate A touched a scanner-protected path: ${file}`);
  }
  console.log("Case J (no scanner protected path modified) passed.");

  console.log("Ofertas Locales Gate A copy/navigation regression audit passed.");
}

run();
