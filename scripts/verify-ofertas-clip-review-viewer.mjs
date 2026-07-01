import { execFileSync } from "node:child_process";
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

if (!existsSync(viewerPath)) {
  fail("OfertasClipReviewViewer.tsx exists");
} else {
  pass("OfertasClipReviewViewer.tsx exists");
  const viewer = readFileSync(viewerPath, "utf8");
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
requireText("approve and next", reviewPanel, "Approve & next");
requireText("reviewed tray", reviewPanel, "Reviewed on this page");
requireText("viewer bridge", reviewPanel, "onViewerBridge");

const changed = execFileSync("git", ["diff", "--name-only"], {
  cwd: root,
  encoding: "utf8",
})
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const forbidden = changed.filter((file) => {
  if (file === "package.json") return false;
  if (file === "scripts/verify-ofertas-clip-review-viewer.mjs") return false;
  if (file.startsWith("app/(site)/publicar/ofertas-locales/")) return false;
  if (file.startsWith("app/api/ofertas-locales/")) return false;
  if (file.startsWith("app/lib/ofertas-locales/")) return false;
  return true;
});

if (forbidden.length) {
  fail(`unrelated modified files: ${forbidden.join(", ")}`);
} else {
  pass("no unrelated category files modified by this gate");
}

const stripeOrPayment = changed.filter((file) => /stripe|payment/i.test(file));
if (stripeOrPayment.length) {
  fail(`Stripe/payment files modified: ${stripeOrPayment.join(", ")}`);
} else {
  pass("no Stripe/payment files modified by this gate");
}
