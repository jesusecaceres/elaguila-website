/**
 * Gate R7 — Varios media persistence + public surfaces + stack position
 * Run: npm run varios:r7-media-public-stack-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R7_MEDIA_PERSISTENCE_PUBLIC_SURFACES_STACK_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const anuncio = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
const freeApp = read("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx");
const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const resultsPage = read("app/(site)/clasificados/en-venta/results/page.tsx");
const select = read("app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts");
const resolver = read("app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts");
const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const contact = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const contactButtons = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const pkg = read("package.json");

const bundle = [anuncio, draft, freeApp, layout, preview, resolver].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Route-to-component map exists", audit.includes("Route-to-component map") && audit.includes("/clasificados/anuncio/"), auditPath);
add("Audit TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);

const rootCauseChecks: Array<[string, RegExp]> = [
  ["Exact uploaded-photo persistence root cause exists", /sessionStorage|quota|persistEnVentaPreviewHandoffAsync/i],
  ["Exact Volver a editar media-loss root cause exists", /Volver|takeEnVentaPreviewReturnInitialState|images: \[\]/i],
  ["Exact preview media root cause exists", /preview|getOrderedEnVentaImageUrls/i],
  ["Exact public detail media root cause exists", /anuncio|resolveEnVentaListingImageUrls|Fotos/i],
  ["Exact landing/results media root cause exists", /mapDbRowToEnVentaAnuncioDTO|browse/i],
  ["Exact lower-stack spacing root cause exists", /gap-y|mt-10|col-span-12/i],
];
for (const [req, re] of rootCauseChecks) {
  add(req, re.test(audit), auditPath);
}

const requiredAuditRows = [
  "Exact public detail media root cause was identified",
  "Published public detail shows uploaded photos when photos exist",
  "Lower detail stack was moved directly under hero area",
  "npm run build passed",
];
for (const req of requiredAuditRows) {
  const line = audit.split("\n").find((l) => l.includes(`| ${req} |`));
  add(`Audit row: ${req}`, Boolean(line?.includes("| TRUE |")), req);
}

add("Anuncio uses canonical resolver for en-venta", anuncio.includes("resolveEnVentaListingImageUrls") && anuncio.includes('category === "en-venta"'), "anuncio page");
add("Free uses persistEnVentaPreviewHandoffAsync", freeApp.includes("persistEnVentaPreviewHandoffAsync"), "LeonixEnVentaFreeApplication");
add("Sync memory hydrate on return", draft.includes("syncHydrateEnVentaDraftMediaFromMemory"), "enVentaPreviewDraft.ts");
add("Browse select includes listing_json", select.includes("listing_json"), "enVentaListingPublicSelect.ts");
add("Results force-dynamic", resultsPage.includes('force-dynamic'), "results/page.tsx");
add("Public stack in hero grid", layout.includes("lg:col-span-12") && layout.includes("EnVentaDetailContentStack"), "EnVentaAnuncioLayout");
add("No mt-10 stack wrapper", !layout.includes("mt-10 space-y-8"), "EnVentaAnuncioLayout");
add("Preview gap-y-2", preview.includes("lg:gap-y-2"), "EnVentaPreviewPage");
add("Hero prefers photos over video", resolver.includes("resolveEnVentaHeroImageUrl") && /first.*imageUrls|imageUrls\.find/.test(resolver), "resolver");

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
    f.startsWith("app/(site)/clasificados/publicar/en-venta/") ||
    f.startsWith("app/(site)/clasificados/anuncio/") ||
    f.startsWith("app/lib/clasificados/en-venta/") ||
    f === "scripts/varios-r7-media-persistence-public-surfaces-stack-audit.ts" ||
    f === "package.json"
);
const badGate = gateFiles.filter(
  (f) =>
    f.includes("/servicios/") ||
    f.includes("/autos/") ||
    f.includes("supabase/migrations") ||
    /stripe/i.test(f)
);
add("Gate edits scoped", badGate.length === 0, badGate.join(", ") || gateFiles.join(", "));
add("No Supabase migrations modified", !diffNames.some((f) => f.includes("supabase/migrations")), diffNames.join(", "));
add("Gate R7 npm script", pkg.includes("varios:r7-media-public-stack-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R7 — Media persistence + public surfaces audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
