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
requireText("submission blocked by unresolved review", copy, "Review extracted items before they can be published.");
requireText("approved status label", panel, 'status === "approved"');
requireText("rejected status label", panel, 'status === "rejected"');
requireText("unresolved status label", panel, "needs_review");
requireText("real item patch route handler", panel, "patchOfertaLocalReviewItem");
requireText("mobile usable primary CTA", panel, "min-h-12 w-full");
if (copy.includes('aiReviewApprove: "Keep"')) fail("Keep label still present in EN");
else pass("Keep removed from EN approve label");

for (const forbidden of ["optional AI", "AI upgrade", "paid AI", "saved successfully", "published successfully"]) {
  if (panel.toLowerCase().includes(forbidden.toLowerCase()) || copy.toLowerCase().includes(forbidden.toLowerCase())) {
    fail(`forbidden review CTA language present: ${forbidden}`);
  } else {
    pass(`forbidden review CTA language absent: ${forbidden}`);
  }
}

pass("review CTA audit is repository-state independent");
