import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "app/lib/ofertas-locales/OFERTAS_REVIEW_CTA_CLEANUP_AUDIT.md");
const panelPath = path.join(root, "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");
const copyPath = path.join(root, "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function requireText(label, haystack, needle) {
  if (haystack.includes(needle)) pass(label);
  else fail(`${label} missing "${needle}"`);
}

if (!existsSync(auditPath)) fail("audit file exists");
else pass("audit file exists");

const audit = readFileSync(auditPath, "utf8");
requireText("guided deck", audit, "Guided review deck");
requireText("reject confirmation", audit, "Reject confirmation behavior");

const panel = readFileSync(panelPath, "utf8");
requireText("approve and next primary", panel, "BTN_PRIMARY_LG");
requireText("reject confirm state", panel, "rejectConfirmItemId");
requireText("review later handler", panel, "handleReviewLater");
requireText("collapsed queue", panel, "aiReviewViewProductsOnPage");
requireText("status label helper", panel, "reviewStatusLabel");

const copy = readFileSync(copyPath, "utf8");
requireText("english approve and next", copy, 'aiReviewApproveAndNext: "Approve & next"');
requireText("spanish review later", copy, 'aiReviewReviewLater: "Revisar después"');
if (copy.includes('aiReviewApprove: "Keep"')) fail("Keep label still present in EN");
else pass("Keep removed from EN approve label");

const allowed = new Set([
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
  "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  "app/lib/ofertas-locales/OFERTAS_REVIEW_CTA_CLEANUP_AUDIT.md",
  "scripts/verify-ofertas-review-cta-cleanup.mjs",
  "package.json",
]);

const changed = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const ofertasChanged = changed.filter((file) => allowed.has(file));
if (ofertasChanged.length === 0) fail("no allowed Ofertas CTA files in git diff");
else pass(`Ofertas CTA files in diff: ${ofertasChanged.join(", ")}`);
