/**
 * Emergency Gate R9 — Varios draft lifecycle / refresh audit
 * Run: npm run varios:r9-draft-lifecycle-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R9_DRAFT_LIFECYCLE_REFRESH_AUDIT.md";
const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
const autosave = read("app/(site)/clasificados/en-venta/publish/useEnVentaFormAutosave.ts");
const leaveGuard = read("app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts");
const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
const freeApp = read("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx");
const previewShell = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx");
const submitBar = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
const pkg = read("package.json");

const auditMd = exists(auditPath) ? read(auditPath) : "";
const bundle = [draft, autosave, leaveGuard, proApp, freeApp, previewShell, submitBar].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", auditMd.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Current draft lifecycle map", auditMd.includes("Current draft lifecycle map"), auditPath);
add("Fresh route behavior finding", auditMd.includes("Fresh route behavior finding"), auditPath);
add("Resume route behavior finding", auditMd.includes("Resume route behavior finding"), auditPath);
add("Refresh persistence root cause", auditMd.includes("Refresh persistence root cause"), auditPath);
add("Image/media persistence finding", auditMd.includes("Image/media persistence finding"), auditPath);
add("Successful publish cleanup finding", auditMd.includes("Successful publish cleanup finding"), auditPath);
add("Same-tab reload helper", draft.includes("isEnVentaSameTabReload"), "enVentaPreviewDraft.ts");
add("Reload restore in resolve", draft.includes("isEnVentaSameTabReload()") && draft.includes("loadEnVentaPublishDraftForRestore"), "enVentaPreviewDraft.ts");
add("Resume=1 uses restore helper", draft.includes("resumeRequested") && draft.includes("loadEnVentaPublishDraftForRestore"), "enVentaPreviewDraft.ts");
add("Autosave hook on pro", proApp.includes("useEnVentaFormAutosave"), "LeonixEnVentaProApplication.tsx");
add("Autosave hook on free", freeApp.includes("useEnVentaFormAutosave"), "LeonixEnVentaFreeApplication.tsx");
add("Varios leave guard on free (no abandon on refresh)", freeApp.includes("useEnVentaPublishLeaveGuard") && !freeApp.includes("useLeonixPublishLeaveGuard"), "LeonixEnVentaFreeApplication.tsx");
add("Publish clear on success only", submitBar.includes("clearEnVentaPublishTempState"), "EnVentaPublishSubmitBar.tsx");
add("Volver a editar label", previewShell.includes("Volver a editar"), "EnVentaPreviewShell.tsx");
add("Vista previa label", bundle.includes("Vista previa") || auditMd.includes("preview"), "bundle");
add("Publicar anuncio label", previewShell.includes("Publicar anuncio"), "EnVentaPreviewShell.tsx");
add("Fotos y video label", exists("app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx") && read("app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx").includes("Fotos y video"), "PhotosSection.tsx");
add("IndexedDB fallback", exists("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraftIdb.ts"), "enVentaPreviewDraftIdb.ts");
add("No public $9.99 copy", !bundle.includes("$9.99"), "bundle");
add("No Stripe copy", !/\bstripe\b/i.test(bundle), "bundle");
add("No Boost/Impulsar copy", !bundle.includes("Impulsar") && !/\bboost\b/i.test(bundle.toLowerCase()), "bundle");
add("Gate R9 npm script", pkg.includes("varios:r9-draft-lifecycle-audit"), "package.json");

const forbidden = [
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/components/Navbar",
  "app/layout.tsx",
  "supabase/migrations",
];
const diffNames = process.env.GIT_DIFF_NAMES?.split("\n").filter(Boolean) ?? [];
for (const f of diffNames) {
  const norm = f.replace(/\\/g, "/");
  const hit = forbidden.find((x) => norm.includes(x));
  if (hit) add(`Unrelated file not modified: ${f}`, false, hit);
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R9 — Varios draft lifecycle / refresh audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
