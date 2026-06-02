/**
 * Gate R9-B — Varios refresh-safe draft without scary reload warning
 * Run: npm run varios:r9b-refresh-safe-draft-warning-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R9B_REFRESH_SAFE_DRAFT_WARNING_AUDIT.md";
const leaveGuard = read("app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts");
const autosave = read("app/(site)/clasificados/en-venta/publish/useEnVentaFormAutosave.ts");
const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
const unsafe = read("app/(site)/clasificados/en-venta/publish/enVentaPublishLeaveUnsafe.ts");
const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
const pkg = read("package.json");

const auditMd = exists(auditPath) ? read(auditPath) : "";
const publishBundle = [leaveGuard, autosave, draft, unsafe, proApp].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", auditMd.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Reload warning root cause", auditMd.includes("Reload warning root cause"), auditPath);
add("sessionStorage draft storage", auditMd.includes("sessionStorage"), auditPath);
add("Autosave copy ES", autosave.includes("Borrador guardado automáticamente"), "useEnVentaFormAutosave.ts");
add("Autosave copy EN", autosave.includes("Draft saved automatically"), "useEnVentaFormAutosave.ts");
add("shouldWarnBeforeUnload guard", leaveGuard.includes("shouldWarnBeforeUnload"), "useEnVentaPublishLeaveGuard.ts");
add("hasEnVentaPreviewDraft check", leaveGuard.includes("hasEnVentaPreviewDraft"), "useEnVentaPublishLeaveGuard.ts");
add("Unsafe publish flag", unsafe.includes("setEnVentaPublishInFlight"), "enVentaPublishLeaveUnsafe.ts");
add("Unsafe media upload flag", unsafe.includes("setEnVentaMediaUploadInFlight"), "enVentaPublishLeaveUnsafe.ts");
add("Pro uses Varios leave guard", proApp.includes("useEnVentaPublishLeaveGuard"), "LeonixEnVentaProApplication.tsx");
add("Same-tab reload restore", draft.includes("isEnVentaSameTabReload"), "enVentaPreviewDraft.ts");
add(
  "No scary none-saved copy",
  !publishBundle.includes("none of your information is saved") &&
    !publishBundle.includes("no se guardará nada") &&
    !publishBundle.includes("perderás toda tu información") &&
    !publishBundle.includes("everything is lost"),
  "publish/preview bundle"
);
add(
  "beforeunload gated not always dirty",
  leaveGuard.includes("if (!shouldWarnBeforeUnload") && leaveGuard.includes("return;"),
  "useEnVentaPublishLeaveGuard.ts"
);
add("Gate R9-B npm script", pkg.includes("varios:r9b-refresh-safe-draft-warning-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R9-B — Varios refresh-safe draft warning audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
