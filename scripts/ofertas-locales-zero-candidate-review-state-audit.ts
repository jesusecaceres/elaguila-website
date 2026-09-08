/**
 * QA item #19 — zero AI-scan candidates must never present as "review
 * complete" in the Ofertas Locales publish wizard. A completed scan that
 * extracted zero usable products is an empty/failed result, not a reviewed
 * set, and must route the user to the honest "no suggestions found" state
 * (with the scan panel still open to retry) instead of the green completion
 * checkpoint.
 *
 * Run: npm run ofertas-locales:zero-candidate-review-state-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const REVIEW_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx";
const PACKAGE_JSON = "package.json";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  const app = read(APP_CLIENT);
  const reviewPanel = read(REVIEW_PANEL);
  const pkg = read(PACKAGE_JSON);

  assert.doesNotMatch(
    app,
    /aiReviewGate\.totalItems === 0 \|\| aiReviewGate\.needsReviewCount === 0/,
    "regression: step5ReviewComplete must not treat zero total candidates as equivalent to " +
      "'nothing left to review' — a completed scan with zero items is an empty result, not a " +
      "reviewed one, and must not satisfy the completion gate"
  );
  assert.match(
    app,
    /step5ScanComplete && aiReviewGate\.totalItems > 0 && aiReviewGate\.needsReviewCount === 0/,
    "step5ReviewComplete must require at least one real candidate AND nothing left pending"
  );

  // The honest empty-state message must still exist and be reachable once
  // step5ReviewComplete correctly routes the user to the review checkpoint
  // instead of a false completion banner.
  assert.match(
    reviewPanel,
    /aiReviewNoSuggestions/,
    "the review panel must show an honest 'no suggestions found' message for a completed scan " +
      "with zero items, rather than silently rendering nothing"
  );

  assert.match(
    pkg,
    /ofertas-locales:zero-candidate-review-state-audit/,
    "package.json must wire this regression audit script"
  );

  console.log("Ofertas Locales zero-candidate / false-review-complete regression audit passed.");
}

run();
