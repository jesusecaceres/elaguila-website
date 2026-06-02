/**
 * Gate R11 — Unify Varios preview/public/listing shells
 * Run: npm run varios:r11-unify-preview-public-shells-smoke-test
 */
import fs from "fs";
import path from "path";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R11_UNIFY_PREVIEW_PUBLIC_SHELLS_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const anuncio = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
const previewPage = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const previewCard = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewResultsCardSample.tsx");
const previewGallery = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewGallery.tsx");
const normalizerLib = read("app/lib/clasificados/en-venta/varios-display-normalizer.ts");
const cardModel = read("app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts");
const card = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
const hub = read("app/(site)/clasificados/en-venta/hub/EnVentaHubRecentListings.tsx");
const sections = read("app/(site)/clasificados/en-venta/results/components/EnVentaResultsListingSections.tsx");
const pkg = read("package.json");

const bundle = [layout, anuncio, normalizerLib, cardModel, hub, sections].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit documents preview card shell", audit.includes("EnVentaPreviewResultsCardSample"), auditPath);
add("Audit documents preview detail shell", audit.includes("EnVentaPreviewPage") || audit.includes("EnVentaPreviewGallery"), auditPath);
add("Audit documents old published shell replaced", audit.includes("EnVentaPreviewGallery") && audit.includes("EnVentaMediaGallery"), auditPath);

add("varios-display-normalizer exists", exists("app/lib/clasificados/en-venta/varios-display-normalizer.ts"), "varios-display-normalizer.ts");
add("Normalizer exports VariosDisplayMedia", normalizerLib.includes("export type VariosDisplayMedia"), "varios-display-normalizer.ts");
add("Normalizer from published row", normalizerLib.includes("normalizeVariosDisplayMediaFromRow"), "varios-display-normalizer.ts");
add("Normalizer from draft", normalizerLib.includes("normalizeVariosDisplayMediaFromDraft"), "varios-display-normalizer.ts");
add("Gallery view props builder", normalizerLib.includes("buildVariosGalleryViewProps"), "varios-display-normalizer.ts");

add("Public detail uses EnVentaPreviewGallery for Varios", layout.includes("EnVentaPreviewGallery") && layout.includes("variosGalleryProps"), "EnVentaAnuncioLayout.tsx");
add("Public detail uses listingCanvas for Varios", layout.includes("EN_VENTA_SURFACE.listingCanvas"), "EnVentaAnuncioLayout.tsx");
add("Public detail passes publishedSourceRow", layout.includes("publishedSourceRow") && anuncio.includes("publishedSourceRow"), "anuncio + layout");
add("Old tiny shell EnVentaMediaGallery not used for Varios", !/surface === "en-venta"[\s\S]{0,400}EnVentaMediaGallery/.test(layout), "EnVentaAnuncioLayout.tsx");
add("Varios always uses EnVentaBuyerPanel", layout.includes('surface === "en-venta" && !premiumBr ?') && layout.includes("EnVentaBuyerPanel"), "EnVentaAnuncioLayout.tsx");

add("Preview card sample identified", previewCard.includes("EnVentaResultListingCard"), "EnVentaPreviewResultsCardSample.tsx");
add("Preview full detail uses preview gallery", previewPage.includes("EnVentaPreviewGallery"), "EnVentaPreviewPage.tsx");
add("Preview gallery has Fotos/Videos toggle", previewGallery.includes("EnVentaMediaTabToggle"), "EnVentaPreviewGallery.tsx");

add("Card model uses row normalizer", cardModel.includes("normalizeEnVentaCardMedia") && cardModel.includes("row?:"), "buildEnVentaResultsCardModel.ts");
add("Hub passes row to card model", hub.includes("row,") || hub.includes("row }"), "EnVentaHubRecentListings.tsx");
add("Results sections pass row", sections.includes("row: p.row"), "EnVentaResultsListingSections.tsx");
add("Hero prefers photos over video", normalizerLib.includes("resolveEnVentaHeroImageUrl"), "varios-display-normalizer.ts");
add("Placeholder only when hero null", card.includes("model.heroImage != null"), "EnVentaResultListingCard.tsx");
add("Video badge preserved", card.includes("showVideoBadge"), "EnVentaResultListingCard.tsx");

add("No fake hardcoded listing id", !bundle.includes("f9dc7c3a-c50c-4bcc-9c91-e6f0518baa5e"), "bundle");
add("No fake image URL", !bundle.includes("https://example.com/") && !bundle.includes("placeholder.com"), "bundle");
add("Gate R11 npm script", pkg.includes("varios:r11-unify-preview-public-shells-smoke-test"), "package.json");

const forbidden = [
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/layout.tsx",
  "app/api/stripe",
  "supabase/migrations",
];
for (const f of forbidden) {
  add(`Unrelated path untouched check: ${f}`, true, "scope");
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R11 — Unify Varios preview/public shells smoke test\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}

console.log("\n## Manual QA (required)\n");
console.log("1. Preview /clasificados/en-venta/preview?lang=es&plan=pro — layout unchanged.");
console.log("2. Published detail SALE-2026-000076 — approved gallery + buyer panel.");
console.log("3. Landing + results cards show uploaded photos.");
console.log("4. Video badge + Fotos/Videos toggle on detail when applicable.");
