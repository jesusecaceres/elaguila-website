/**
 * Gate P4-C — Varios preview results sample + detail/results polish
 * Run: npm run varios:p4c-preview-results-detail-polish-audit
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

function walkDir(dir: string, acc: string[] = []): string[] {
  if (!exists(dir)) return acc;
  for (const ent of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, ent.name).replace(/\\/g, "/");
    if (ent.isDirectory()) walkDir(rel, acc);
    else if (/\.(tsx?|jsx?)$/.test(ent.name) && !/\/AUDIT_/i.test(rel) && !/\/boosts\//i.test(rel)) acc.push(rel);
  }
  return acc;
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_P4C_PREVIEW_RESULTS_DETAIL_POLISH.md";
const auditMd = exists(auditPath) ? read(auditPath) : "";
const sample = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewResultsCardSample.tsx");
const previewPage = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const card = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
const cardModel = read("app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts");
const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
const brand = read("app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const pkg = read("package.json");

const enVentaPaths = walkDir("app/(site)/clasificados/en-venta").concat(
  walkDir("app/(site)/clasificados/publicar/en-venta"),
  walkDir("app/lib/clasificados/en-venta")
);
const enVentaBundle = enVentaPaths.map((p) => read(p)).join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", auditMd.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Audit has 30+ TRUE rows", (auditMd.match(/\| TRUE \|/g) ?? []).length >= 30, auditPath);

add("Spanish preview section copy", sample.includes("Así aparecerá en los listados"), "EnVentaPreviewResultsCardSample.tsx");
add(
  "English preview section copy",
  sample.includes("How it will appear in listings"),
  "EnVentaPreviewResultsCardSample.tsx"
);
add("Preview wired in preview page", previewPage.includes("EnVentaPreviewResultsCardSample"), "EnVentaPreviewPage.tsx");

add(
  "Draft to card model builder",
  cardModel.includes("buildEnVentaResultsCardModelFromDraftState"),
  "buildEnVentaResultsCardModel.ts"
);
add("Card preview mode", card.includes('mode = "live"') && card.includes("isPreview"), "EnVentaResultListingCard.tsx");
add("Shared results card brand tokens", brand.includes("resultsCard") && card.includes("EN_VENTA_SURFACE"), "brand + card");

add("Label Varios", labels.includes('"Varios"'), "enVentaPublicLabels.ts");
add("Label For Sale", labels.includes('"For Sale"'), "enVentaPublicLabels.ts");
add("Label Publicar anuncio", enVentaBundle.includes("Publicar anuncio"), "en-venta bundle");
add("Label Hacer oferta", enVentaBundle.includes("Hacer oferta"), "en-venta bundle");
add("Label Guardar", engagement.includes("Guardar") || enVentaBundle.includes("Guardar"), "engagement/bundle");
add("Label Compartir", engagement.includes("Compartir") || enVentaBundle.includes("Compartir"), "engagement/bundle");
add("Label Reportar", engagement.includes("Reportar") || enVentaBundle.includes("Reportar"), "engagement/bundle");

add("No public $9.99 in Varios paths", !/\$9\.99|9\.99 USD/.test(enVentaBundle), "en-venta ts/tsx scan");
add(
  "No public Boost/Impulsar in Varios paths",
  !/\bImpulsar\b|"Boost"|'Boost'/.test(enVentaBundle),
  "en-venta ts/tsx scan"
);
add("No fake counter strings in UI", !/0 vistas|0 guardados/i.test(enVentaBundle), "en-venta ts/tsx scan");
add(
  "Preview card no fake views",
  cardModel.includes("showViews: false") && card.includes("showViews && !isPreview"),
  "card model"
);

let unrelatedTouched = false;
for (const cat of ["app/(site)/clasificados/autos", "app/(site)/clasificados/empleos"]) {
  if (!exists(cat)) continue;
  for (const file of walkDir(cat)) {
    if (read(file).includes("EnVentaPreviewResultsCardSample")) unrelatedTouched = true;
  }
}
add("No unrelated category P4-C leaks", !unrelatedTouched, "category scan");
add(
  "No global layout P4-C marker",
  !read("app/(site)/layout.tsx").includes("EnVentaPreviewResultsCardSample"),
  "layout.tsx"
);
add("Gate P4-C npm script", pkg.includes("varios:p4c-preview-results-detail-polish-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate P4-C — Preview results + polish audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
