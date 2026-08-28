/**
 * QA UX Batch — Gate G final certification audit (⚠️24–⚠️53 full-batch seal).
 *
 * This is a structural cross-check that the load-bearing evidence for every
 * prior gate (A–F) is still present in source, that the scanner core remains
 * completely untouched relative to the sealed baseline, and that the final
 * certification document exists and records both deferred items honestly.
 * It does not re-derive each gate's own detailed proofs — those live in
 * ofertas-locales-gate-{a..f}-*-regression-audit.ts and are re-run alongside
 * this one in the Gate G validation sequence.
 *
 * Run: npm run ofertas-locales:gate-g-final-qa-certification-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";

import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";

const SEAL_BASELINE_SHA = "9095b3a97fe8ad4fd36543f41ea0ca6a7a0df0f0";

function run() {
  const panelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "utf8"
  );
  const clientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "utf8"
  );
  const workspaceSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx",
    "utf8"
  );
  const taxonomySrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts", "utf8");
  const previewCardSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx",
    "utf8"
  );
  const certDoc = fs.readFileSync(
    "app/lib/ofertas-locales/OFERTAS_QA_UX_FINAL_CERTIFICATION.md",
    "utf8"
  );

  // --- Case A: Gate A copy remains ---
  assert.match(panelSrc, /aiReviewPreviousItem|aiReviewNextItem/, "CASE A FAILED: Gate A product-nav copy must remain");
  console.log("Case A (Gate A copy remains) passed.");

  // --- Case B: Gate B canonical counters remain ---
  assert.match(
    panelSrc,
    /const scoped = isWorkspace \? summarizeScopedItemReviewCounts\(allCurrentScanItems\) : summary;/,
    "CASE B FAILED: Gate B canonical-collection counter derivation must remain"
  );
  console.log("Case B (Gate B canonical counters remain) passed.");

  // --- Case C: Gate C page/review progression remains ---
  assert.match(panelSrc, /const BTN_SUCCESS_LG =/, "CASE C FAILED: Gate C's green progression button must remain");
  assert.match(
    panelSrc,
    /onClick=\{\(\) => onContinueToNextStep\?\.\(\)\}/,
    "CASE C FAILED: Gate C's final review-complete CTA handler must remain"
  );
  console.log("Case C (Gate C page/review progression remains) passed.");

  // --- Case D: Gate D dedicated workspace remains ---
  assert.match(
    clientSrc,
    /const \[step5ReviewView, setStep5ReviewView\] = useState<"files" \| "products">\("files"\);/,
    "CASE D FAILED: Gate D's Files/Products view-state toggle must remain"
  );
  assert.match(
    workspaceSrc,
    /xl:grid-cols-\[minmax\(0,54fr\)_minmax\(0,46fr\)\]/,
    "CASE D FAILED: Gate D's two-column workspace grid must remain"
  );
  console.log("Case D (Gate D dedicated workspace remains) passed.");

  // --- Case E: Gate E bilingual taxonomy remains ---
  assert.match(
    taxonomySrc,
    /export function getOfertaProductBilingualCategoryDisplay\(/,
    "CASE E FAILED: Gate E's bilingual display helper must remain"
  );
  console.log("Case E (Gate E bilingual taxonomy remains) passed.");

  // --- Case F: Gate F Step 7 simplification remains ---
  const step7ConfirmCheckboxes = [...clientSrc.matchAll(/checked=\{step7Confirmations\.(\w+)\}/g)].map(
    (m) => m[1]
  );
  assert.deepEqual(
    step7ConfirmCheckboxes,
    ["businessFiles", "aiItems", "leonixRules"],
    "CASE F FAILED: Step 7 must still show exactly the 3 Gate F confirmations"
  );
  console.log("Case F (Gate F Step 7 simplification remains) passed.");

  // --- Case G: preview-dashboard handoff remains ---
  assert.match(
    previewCardSrc,
    /const dashboardHref = dashboardId/,
    "CASE G FAILED: Preview's dashboard-handoff computation must remain"
  );
  assert.match(
    previewCardSrc,
    /continueToDashboardEn : c\.continueToDashboardEs/,
    "CASE G FAILED: the dashboard-continuation CTA copy wiring must remain"
  );
  console.log("Case G (preview-dashboard handoff remains) passed.");

  // --- Case H: manual save absent ---
  assert.doesNotMatch(
    clientSrc,
    /handleSaveDraft/,
    "CASE H FAILED: the manual save-draft handler must remain removed"
  );
  console.log("Case H (manual save absent) passed.");

  // --- Case I: direct Step 7 payment CTA absent ---
  assert.doesNotMatch(
    clientSrc,
    /\/dashboard\/ofertas-locales\//,
    "CASE I FAILED: Step 7 must not reintroduce a direct dashboard/payment link"
  );
  console.log("Case I (direct Step 7 payment CTA absent) passed.");

  // --- Case J: scanner baseline manual exists ---
  assert.ok(
    fs.existsSync("app/lib/ofertas-locales/OFERTAS_AI_SCANNER_CERTIFIED_REPAIR_MANUAL.md"),
    "CASE J FAILED: certified repair manual must exist"
  );
  console.log("Case J (scanner baseline manual exists) passed.");

  // --- Case K: scanner sealed doc exists ---
  assert.ok(
    fs.existsSync("app/lib/ofertas-locales/OFERTAS_AI_SCANNER_SEALED.md"),
    "CASE K FAILED: sealed doc must exist"
  );
  console.log("Case K (scanner sealed doc exists) passed.");

  // --- Case L: protected path manifest exists ---
  assert.ok(
    OFERTAS_AI_SCANNER_PROTECTED_PATHS.length > 0,
    "CASE L FAILED: protected path manifest must exist and be non-empty"
  );
  console.log("Case L (protected path manifest exists) passed.");

  // --- Case M: no protected scanner files changed relative to seal baseline ---
  const changedFiles = execSync(`git diff --name-only ${SEAL_BASELINE_SHA} HEAD`, {
    encoding: "utf8",
  })
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  const protectedSet = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  const touchedProtected = changedFiles.filter((f) => protectedSet.has(f));
  assert.deepEqual(
    touchedProtected,
    [],
    `CASE M FAILED: scanner-protected files modified since seal: ${touchedProtected.join(", ")}`
  );
  console.log(
    `Case M (no protected scanner files changed relative to seal baseline — ${changedFiles.length} files diffed) passed.`
  );

  // --- Case N: final certification doc exists ---
  assert.match(
    certDoc,
    /OFERTAS LOCALES — QA UX BATCH FINAL CERTIFICATION \(GATE G\)/,
    "CASE N FAILED: final certification document must exist with the expected title"
  );
  console.log("Case N (final certification doc exists) passed.");

  // --- Case O: deferred ⚠️46 documented ---
  assert.match(
    certDoc,
    /⚠️46 global unsaved-exit deferred \| \*\*DEFERRED\*\*/,
    "CASE O FAILED: ⚠️46 must be explicitly recorded as DEFERRED in the certification doc"
  );
  console.log("Case O (deferred ⚠️46 documented) passed.");

  // --- Case P: deferred ⚠️54 documented ---
  assert.match(
    certDoc,
    /⚠️54 — Product taxonomy classifier substring collision/,
    "CASE P FAILED: ⚠️54 (pantry/bakery taxonomy collision) must be documented as deferred"
  );
  assert.doesNotMatch(
    certDoc.split("⚠️54 — Product taxonomy classifier substring collision")[1]?.slice(0, 400) ?? "",
    /FIXED/,
    "CASE P FAILED: ⚠️54 must remain DEFERRED, not marked fixed, in this gate"
  );
  console.log("Case P (deferred ⚠️54 documented) passed.");

  console.log("Ofertas Locales Gate G final QA certification audit passed.");
}

run();
