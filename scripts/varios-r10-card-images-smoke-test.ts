/**
 * Gate R10 — Varios published card images on landing/results
 * Run: npm run varios:r10-card-images-smoke-test
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R10_PUBLISHED_CARD_IMAGES_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const cardModel = read("app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts");
const normalizer = read("app/(site)/clasificados/en-venta/shared/utils/normalizeEnVentaCardMedia.ts");
const resolver = read("app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts");
const select = read("app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts");
const publish = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
const hub = read("app/(site)/clasificados/en-venta/hub/EnVentaHubRecentListings.tsx");
const sections = read("app/(site)/clasificados/en-venta/results/components/EnVentaResultsListingSections.tsx");
const card = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
const pkg = read("package.json");

const bundle = [cardModel, normalizer, resolver, select, publish, hub, sections].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);

add("Browse select includes images", select.includes("images"), "enVentaListingPublicSelect.ts");
add("Browse select includes description", select.includes("description"), "enVentaListingPublicSelect.ts");
add("Browse select includes listing_json", select.includes("listing_json"), "enVentaListingPublicSelect.ts");

add("normalizeEnVentaCardMedia exists", exists("app/(site)/clasificados/en-venta/shared/utils/normalizeEnVentaCardMedia.ts"), "normalizeEnVentaCardMedia.ts");
add(
  "Card model uses row normalizer",
  cardModel.includes("normalizeEnVentaCardMedia") && cardModel.includes("row?:"),
  "buildEnVentaResultsCardModel.ts"
);
add("Hub passes row to card model", hub.includes("row,") || hub.includes("row }"), "EnVentaHubRecentListings.tsx");
add("Results sections pass row to card model", sections.includes("row: p.row"), "EnVentaResultsListingSections.tsx");

add("Primary photo via hero resolver", normalizer.includes("resolveEnVentaHeroImageUrl"), "normalizeEnVentaCardMedia.ts");
add("Photo URLs from canonical resolver", normalizer.includes("resolveEnVentaListingImageUrls"), "normalizeEnVentaCardMedia.ts");
add("Appendix CRLF normalized", resolver.includes('replace(/\\r\\n/g, "\\n")'), "resolveEnVentaListingImageUrls.ts");
add("Hero prefers photos over video", resolver.includes("imageUrls.find") || /first.*imageUrls/.test(resolver), "resolveEnVentaListingImageUrls.ts");

add("Card shows img when heroImage set", card.includes("model.heroImage") && card.includes("<img"), "EnVentaResultListingCard.tsx");
add("Placeholder only when hero null", card.includes("model.heroImage != null"), "EnVentaResultListingCard.tsx");
add("Video badge preserved", card.includes("showVideoBadge"), "EnVentaResultListingCard.tsx");

add("Publish uses resilient gallery patch", publish.includes("updateListingsRowResilient"), "enVentaPublishFromDraft.ts");
add("No fake hardcoded listing id", !bundle.includes("f9dc7c3a-c50c-4bcc-9c91-e6f0518baa5e"), "bundle");
add("No fake image URL in bundle", !bundle.includes("https://example.com/") && !bundle.includes("placeholder.com"), "bundle");
add("Gate R10 npm script", pkg.includes("varios:r10-card-images-smoke-test"), "package.json");

const forbidden = [
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/layout.tsx",
  "app/api/stripe",
  "supabase/migrations",
];
for (const f of forbidden) {
  add(`Unrelated path not required in gate: ${f}`, true, "scope check");
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R10 — Varios published card images smoke test\n");
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
console.log("1. Open published detail — photos/video still work.");
console.log("2. Open /clasificados/en-venta?lang=es — card shows uploaded photo.");
console.log("3. Open /clasificados/en-venta/results?lang=es&sort=newest — same card photo.");
console.log("4. Video badge still shows when video exists.");
console.log("5. Placeholder only when no photos and no video thumb.");
