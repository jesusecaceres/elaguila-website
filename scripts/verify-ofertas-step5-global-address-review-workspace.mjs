import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(
  root,
  "app/lib/ofertas-locales/OFERTAS_STEP5_GLOBAL_ADDRESS_REVIEW_WORKSPACE_AUDIT.md"
);
const reviewPanelPath = path.join(root, "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");
const appCopyPath = path.join(root, "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const previewHelpersPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function requireText(label, haystack, needle) {
  if (haystack.includes(needle)) {
    pass(label);
  } else {
    fail(`${label} missing "${needle}"`);
  }
}

if (!existsSync(auditPath)) {
  fail("audit file exists");
} else {
  pass("audit file exists");
  const audit = readFileSync(auditPath, "utf8");
  requireText("country/postal wording", audit, "city, state/province, country, and postal code");
  requireText("coupon collapse wording", audit, "Want to add coupons or extra files?");
  requireText("clip fallback wording", audit, "No product clip or location available yet");
  requireText("brand mapping", audit, "Cream/ivory");
}

const reviewPanel = readFileSync(reviewPanelPath, "utf8");
const appCopy = readFileSync(appCopyPath, "utf8");
const previewHelpers = readFileSync(previewHelpersPath, "utf8");

requireText("location state label current", appCopy, "State / Province / Region");
requireText("postal label current", appCopy, "ZIP / Postal code");
requireText("review workspace source file", reviewPanel, "sourceFileLabel");
requireText("review workspace source page", reviewPanel, "aiReviewSourcePage");
requireText("unresolved work remains visible", reviewPanel, "needsReview");
requireText("active source scoped review", reviewPanel, "selectedSourceAssetId");
requireText("real address directions helper", previewHelpers, "resolveOfertaLocalDirectionsHref");
requireText("location line helper", previewHelpers, "buildOfertaLocalPreviewLocationLine");

pass("Step 5 address/review audit is repository-state independent");
