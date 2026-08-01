/**
 * Verifier — Ofertas Public Flyer Viewer V1 (clickable approved overlays + product drawer).
 * Run: npm run verify:ofertas-public-flyer-viewer
 */
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
const publicOfferHelpersPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts");
const publicSearchHelpersPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");
const publicSearchClientPath = path.join(
  root,
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx"
);
const publicItemCardPath = path.join(
  root,
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx"
);
const publicItemDrawerPath = path.join(
  root,
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx"
);
const publicOfferDrawerPath = path.join(
  root,
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx"
);

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

const publicOfferHelpers = readFileSync(publicOfferHelpersPath, "utf8");
requireText("public offers approved-only", publicOfferHelpers, 'new Set(["approved"])');
requireText("public offers non-expired", publicOfferHelpers, "isOfertaLocalPublicTermActive(row.published_at, row.expires_at, now)");

const publicSearchHelpers = readFileSync(publicSearchHelpersPath, "utf8");
requireText("public item approved parent gate", publicSearchHelpers, 'new Set(["approved"])');
requireText("public item approved review gate", publicSearchHelpers, 'row.review_status !== "approved"');
requireText("public item active gate", publicSearchHelpers, "!row.is_active");
requireText("public item non-expired parent gate", publicSearchHelpers, "isOfertaLocalPublicTermActive(parent.published_at, parent.expires_at, now)");
requireText("public item source crop", publicSearchHelpers, "sourceCropHref: getSafeOfertaLocalSourceAssetHref(row.source_crop_url)");
requireText("public item source bbox", publicSearchHelpers, "sourceBbox: parseOfertaLocalPublicSourceBbox(row.source_bbox)");
requireText("public item source page", publicSearchHelpers, "sourcePage: row.source_page");

const publicItemCard = readFileSync(publicItemCardPath, "utf8");
requireText("public card crop fallback", publicItemCard, "item.sourceCropHref");
requireText("public card source fallback", publicItemCard, "item.sourceAssetHref");

const publicItemDrawer = readFileSync(publicItemDrawerPath, "utf8");
requireText("public drawer crop fallback", publicItemDrawer, "item.sourceCropHref");
requireText("public drawer source fallback", publicItemDrawer, "item.sourceAssetHref");

const publicSearchClient = readFileSync(publicSearchClientPath, "utf8");
requireText("Cupones hides shopping list cart", publicSearchClient, "const floatingShoppingListCart = !isCupones ?");
requireText("Cupones blocks product list drawer", publicSearchClient, "{!isCupones && selectedItem ?");

const publicOfferDrawer = readFileSync(publicOfferDrawerPath, "utf8");
for (const forbidden of ["addToList", "shoppingList", "quantity", "claim", "redeem", "redemption code"]) {
  if (publicOfferDrawer.toLowerCase().includes(forbidden.toLowerCase())) {
    fail(`Cupones drawer introduced cart/list/claim control: ${forbidden}`);
  } else {
    pass(`Cupones drawer control absent: ${forbidden}`);
  }
}

const publicReturnModels = [
  publicOfferHelpers.slice(publicOfferHelpers.indexOf("export function mapOfertaLocalPublicOfferRowToCard")),
  publicSearchHelpers.slice(publicSearchHelpers.indexOf("export function mapOfertaLocalPublicSearchRowToItem")),
].join("\n");
for (const internal of ["provider:", "normalizerProvider:", "internalError:", "storagePath:", "internalNotes:", "ownerId:"]) {
  if (publicReturnModels.includes(internal)) {
    fail(`public model leaks internal field: ${internal}`);
  } else {
    pass(`public internal field absent: ${internal}`);
  }
}

const gateSources = flyerViewer;
for (const fake of FAKE_STRINGS) {
  if (gateSources.toLowerCase().includes(fake.toLowerCase())) {
    fail(`fake commerce string introduced: ${fake}`);
  } else {
    pass(`no fake string: ${fake}`);
  }
}

pass("viewer repository truth verified without dirty-worktree allowlist");

if (process.exitCode) {
  console.error("\nverify:ofertas-public-flyer-viewer FAILED");
} else {
  console.log("\nverify:ofertas-public-flyer-viewer PASSED");
}
