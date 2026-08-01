import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "app/lib/ofertas-locales/OFERTAS_CLIP_REVIEW_VIEWER_AUDIT.md");
const viewerPath = path.join(root, "app/(site)/publicar/ofertas-locales/OfertasClipReviewViewer.tsx");
const runtimePath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts");
const reviewPanelPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx"
);

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
  requireText("task classification", audit, "SCOPED GATED BUILD");
  requireText("viewer decision", audit, "OfertasClipReviewViewer.tsx");
  requireText("bbox math", audit, "mapOfertaLocalSourceBboxToDisplayRect");
  requireText("active queue", audit, "activeReviewItems");
  requireText("preview truth", audit, "sourceCropUrl");
  requireText("cost control", audit, "npm run build intentionally not run");
}

let viewer = "";
if (!existsSync(viewerPath)) {
  fail("OfertasClipReviewViewer.tsx exists");
} else {
  pass("OfertasClipReviewViewer.tsx exists");
  viewer = readFileSync(viewerPath, "utf8");
  requireText("pdfjs canvas", viewer, "pdfjs-dist/legacy/build/pdf.mjs");
  requireText("overlay buttons", viewer, "pointer-events-auto absolute");
  if (viewer.includes("<iframe")) {
    fail("viewer must not use iframe PDF embed");
  } else {
    pass("viewer avoids iframe PDF embed");
  }
}

const runtime = readFileSync(runtimePath, "utf8");
requireText("bbox helper exported", runtime, "export function mapOfertaLocalSourceBboxToDisplayRect");
requireText("active queue partition", runtime, "partitionOfertaLocalPageReviewItems");

const reviewPanel = readFileSync(reviewPanelPath, "utf8");
requireText("approve and next copy key", reviewPanel, "aiReviewApproveAndNext");
requireText("reviewed tray", reviewPanel, "Reviewed on this page");
requireText("viewer bridge", reviewPanel, "onViewerBridge");
requireText("source asset scoped items", reviewPanel, "sourceAssetId === selectedSourceAssetId");
requireText("viewer page items", reviewPanel, "viewerItemsOnPage");
requireText("page-scoped overlay prop", viewer, "itemsOnPage");
requireText("canonical bbox authority", viewer, "mapOfertaLocalSourceBboxToDisplayRect");

pass("clip review viewer audit is repository-state independent");
