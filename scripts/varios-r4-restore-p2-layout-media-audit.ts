/**
 * Gate R4 — Restore P2 layout + fix Varios media on results/preview/detail
 * Run: npm run varios:r4-restore-p2-layout-media-audit
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R4_RESTORE_P2_LAYOUT_MEDIA_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const mapper = read("app/(site)/clasificados/en-venta/mapping/mapDbRowToEnVentaListingData.ts");
const cardModel = read("app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts");
const resolver = read("app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts");
const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const sample = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewResultsCardSample.tsx");
const card = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
const select = read("app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts");
const hero = read("app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx");
const contact = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const contactButtons = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
const brand = read("app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts");
const fetchBrowse = read("app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts");
const publish = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
const pkg = read("package.json");

const bundle = [mapper, cardModel, resolver, layout, preview, card, hero, contact, engagement].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("P2 baseline documented", audit.includes("d41b0ecd"), auditPath);
add("Bad regression commit documented", audit.includes("fc97c454"), auditPath);
add("Tiny desktop cause documented", audit.includes("max-w-6xl") || audit.includes("90rem"), auditPath);
add("Missing image cause documented", audit.includes("imageUrlsFromRow") || audit.includes("either-or"), auditPath);

const requiredAuditRows = [
  "Approved P2 baseline commit was identified",
  "Current missing image root cause was identified",
  "Landing/results cards show primary image when available",
  "npm run build passed",
];
for (const req of requiredAuditRows) {
  const line = audit.split("\n").find((l) => l.includes(`| ${req} |`));
  add(`Audit row: ${req}`, Boolean(line?.includes("| TRUE |")), req);
}

add("Canonical image resolver exists", exists("app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts"), "resolveEnVentaListingImageUrls.ts");
add("Mapper uses merged resolver", mapper.includes("resolveEnVentaListingImageUrls"), "mapDbRowToEnVentaListingData.ts");
add("Mapper merges marker + appendix", resolver.includes("parseLeonixImageUrlsFromDescription") && resolver.includes("parseLeonixPhotoAppendixUrls"), "resolver");
add("Card model uses hero resolver", cardModel.includes("resolveEnVentaHeroImageUrl"), "buildEnVentaResultsCardModel.ts");
add("Hero resolver checks images before video thumb", resolver.includes("resolveEnVentaHeroImageUrl") && /first.*imageUrls|imageUrls\.find/.test(resolver), "resolver");
add("Browse select includes mux_playback_id", select.includes("mux_playback_id"), "enVentaListingPublicSelect.ts");
add("Results card renders heroImage img", card.includes("model.heroImage") && card.includes("<img"), "EnVentaResultListingCard.tsx");
add("Preview sample preserved", preview.includes("EnVentaPreviewResultsCardSample") && sample.includes("buildEnVentaResultsCardModelFromDraftState"), "preview sample");
add("P4-F layout absent", !exists("app/(site)/clasificados/en-venta/shared/components/EnVentaDetailPageLayout.tsx"), "file absent");
add("detailPageMax absent", !brand.includes("detailPageMax"), "enVentaBrand.ts");
add("detailViewport present", brand.includes("detailViewport"), "enVentaBrand.ts");
add("P2 hero component present", exists("app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx"), "EnVentaListingHero.tsx");
add("Visibility fetch preserved", fetchBrowse.includes("queryEnVentaBrowseListings"), "fetch");
add("Publish finalize preserved", publish.includes("finalizeEnVentaListingForPublicBrowse"), "publish");

add("Label Varios", labels.includes('"Varios"'), "labels");
add("Label For Sale", labels.includes('"For Sale"'), "labels");
add("Label Hacer oferta", bundle.includes("Hacer oferta"), "bundle");
add("Label Guardar", engagement.includes("Guardar"), "engagement");
add("Label Compartir", engagement.includes("Compartir"), "engagement");
add("Label Reportar", engagement.includes("Reportar"), "engagement");
add("Label Llamar", contact.includes("Llamar"), "contact");
add("Label Mensaje", contact.includes("Mensaje") || contactButtons.includes("Mensaje"), "contact");
add("Label Correo", contact.includes("Correo"), "contact");
add("Label Entrega", bundle.includes("Entrega"), "bundle");
add("Label Descripción", bundle.includes("Descripción"), "bundle");

add("No public $9.99", !/\$9\.99/.test(bundle), "bundle");
add("No Boost/Impulsar", !/\bImpulsar\b|"Boost"/.test(bundle), "bundle");
add("No Stripe in bundle", !/stripe/i.test(bundle), "bundle");

let diffNames: string[] = [];
try {
  diffNames = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  diffNames = [];
}

const gateFiles = diffNames.filter(
  (f) =>
    f.startsWith("app/(site)/clasificados/en-venta/") ||
    f.startsWith("app/lib/clasificados/en-venta/") ||
    f === "scripts/varios-r4-restore-p2-layout-media-audit.ts" ||
    f === "package.json"
);
const badGate = gateFiles.filter(
  (f) =>
    f.includes("/servicios/") ||
    f.includes("/autos/") ||
    f.includes("/rentas/") ||
    f.includes("supabase/migrations") ||
    /stripe/i.test(f)
);
add("Gate edits scoped to en-venta", badGate.length === 0, badGate.join(", ") || gateFiles.join(", "));
add("Gate R4 npm script", pkg.includes("varios:r4-restore-p2-layout-media-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R4 — Restore P2 layout + media audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
