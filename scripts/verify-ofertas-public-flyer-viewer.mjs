/**
 * Verifier — Ofertas Public Flyer Viewer V1 (clickable approved overlays + product drawer).
 * Run: npm run verify:ofertas-public-flyer-viewer
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "app/lib/ofertas-locales/OFERTAS_PUBLIC_FLYER_VIEWER_AUDIT.md");
const flyerViewerPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesFlyerViewerModal.tsx"
);
const previewCardPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx"
);
const productGridPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx"
);
const previewCopyPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts"
);
const productDrawerPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesProductDetailDrawer.tsx"
);

const GATE_ALLOWED_PREFIXES = [
  "app/(site)/publicar/ofertas-locales/preview/",
  "app/lib/ofertas-locales/OFERTAS_PUBLIC_FLYER_VIEWER_AUDIT.md",
  "scripts/verify-ofertas-public-flyer-viewer.mjs",
  "package.json",
];

const FORBIDDEN_TOUCH = [
  "app/lib/ofertas-locales/ofertasLocalesScanCropGenerator.ts",
  "app/lib/ofertas-locales/ofertasLocalesGeminiScanPipeline.ts",
  "app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts",
  "app/api/ofertas-locales/scan/",
];

const FAKE_STRINGS = [
  "wallet",
  "add to cart",
  "checkout",
  "claimed",
  "redeemed",
  "scan to redeem",
  "save coupon",
];

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

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

if (!existsSync(auditPath)) {
  fail("audit file exists");
} else {
  pass("audit file exists");
  const audit = readFileSync(auditPath, "utf8");
  requireText("task classification", audit, "SCOPED GATED BUILD");
  requireText("Step 5 pattern", audit, "OfertasClipReviewViewer");
  requireText("bbox strategy", audit, "mapOfertaLocalSourceBboxToDisplayRect");
  requireText("drawer behavior", audit, "OfertasLocalesProductDetailDrawer");
}

const flyerViewer = readFileSync(flyerViewerPath, "utf8");
requireText("flyer viewer items prop", flyerViewer, "items?: OfertaLocalItemReviewViewModel[]");
requireText("flyer viewer bbox math", flyerViewer, "mapOfertaLocalSourceBboxToDisplayRect");
requireText("flyer viewer overlay buttons", flyerViewer, "pointer-events-auto absolute");
requireText("flyer viewer open detail", flyerViewer, "onOpenProductDetail");
requireText("flyer viewer aria prefix ES", flyerViewer, "flyerViewDetailAriaEs");
requireText("flyer viewer aria prefix EN", flyerViewer, "flyerViewDetailAriaEn");

const previewCopy = readFileSync(previewCopyPath, "utf8");
requireText("ES interactive helper", previewCopy, "Toca una oferta resaltada");
requireText("EN interactive helper", previewCopy, "Tap a highlighted offer");

const previewCard = readFileSync(previewCardPath, "utf8");
requireText("preview card passes items to viewer", previewCard, "items={approvedAiItems}");
requireText("preview card open product detail", previewCard, "onOpenProductDetail={openProductDetail}");
requireText("preview card shared drawer", previewCard, "OfertasLocalesProductDetailDrawer");

const productGrid = readFileSync(productGridPath, "utf8");
requireText("product grid open detail callback", productGrid, "onOpenDetail");
if (productGrid.includes("OfertasLocalesProductDetailDrawer")) {
  fail("product grid must not render duplicate drawer");
} else {
  pass("product grid delegates drawer to parent");
}

const productDrawer = readFileSync(productDrawerPath, "utf8");
requireText("product detail drawer still exists", productDrawer, "export function OfertasLocalesProductDetailDrawer");

const gateSources = flyerViewer;
for (const fake of FAKE_STRINGS) {
  if (gateSources.toLowerCase().includes(fake.toLowerCase())) {
    fail(`fake commerce string introduced: ${fake}`);
  } else {
    pass(`no fake string: ${fake}`);
  }
}

let changed = [];
try {
  changed = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean);
} catch {
  changed = [];
}

let untracked = [];
try {
  untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean);
} catch {
  untracked = [];
}

const allChanged = [...new Set([...changed, ...untracked])].filter((f) => !f.startsWith(".next/"));

const gateTouched = allChanged.filter((file) =>
  GATE_ALLOWED_PREFIXES.some((prefix) => file === prefix || file.startsWith(prefix))
);

const forbiddenTouched = allChanged.filter((file) =>
  FORBIDDEN_TOUCH.some((prefix) => file === prefix || file.startsWith(prefix))
);

if (forbiddenTouched.length) {
  fail(`forbidden files touched: ${forbiddenTouched.join(", ")}`);
} else {
  pass("no scan/crop engine files changed");
}

const unrelated = allChanged.filter(
  (file) => !gateTouched.includes(file) && !forbiddenTouched.includes(file)
);
if (unrelated.length) {
  console.log(`NOTE: unrelated dirty files present (not failing): ${unrelated.join(", ")}`);
} else {
  pass("no unrelated dirty files in working tree");
}

if (gateTouched.length === 0) {
  fail("expected gate files to be modified or added");
} else {
  pass(`gate files touched: ${gateTouched.join(", ")}`);
}

if (process.exitCode) {
  console.error("\nverify:ofertas-public-flyer-viewer FAILED");
} else {
  console.log("\nverify:ofertas-public-flyer-viewer PASSED");
}
