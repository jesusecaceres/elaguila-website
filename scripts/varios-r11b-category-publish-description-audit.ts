/**
 * Gate R11B — category-wide Varios publish description mapping (static).
 * Run: npm run varios:r11b-category-publish-description-audit
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function gitDiffNames(): string[] {
  try {
    const out = execSync("git diff --name-only", { cwd: root, encoding: "utf8" }).trim();
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R11B_CATEGORY_PUBLISH_DESCRIPTION_AUDIT.md";
const audit = read(auditPath);
const publish = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
const validation = read("app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts");
const descLib = read("app/lib/clasificados/en-venta/enVentaPublishDescription.ts");
const stack = read("app/(site)/clasificados/en-venta/shared/utils/buildEnVentaContentStackModel.ts");
const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
const freeApp = read("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx");
const submitBar = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
const pkg = read("package.json");

add("R11B audit file exists", fs.existsSync(path.join(root, auditPath)), auditPath);
add("Category-wide scope documented", audit.includes("Category-wide scope"), auditPath);
add("Fresh Pro route traced", audit.includes("Fresh Pro") && audit.includes("/clasificados/publicar/en-venta/pro"), auditPath);
add("Resume Pro route traced", audit.includes("Resume Pro") && audit.includes("resume=1"), auditPath);
add("Fresh Free route traced", audit.includes("Fresh Free") && audit.includes("/clasificados/publicar/en-venta/free"), auditPath);
add("Resume Free route traced", audit.includes("Resume Free"), auditPath);
add("Last known good investigation", audit.includes("Last known good"), auditPath);
add("DB constraint finding", audit.includes("description_len_check"), auditPath);
add("Preview description source", audit.includes("Preview description source"), auditPath);
add("Publish description source before fix", audit.includes("Publish description source before fix"), auditPath);
add("Root cause documented", audit.includes("Root cause"), auditPath);
add("Fix applied documented", audit.includes("Fix applied"), auditPath);

add(
  "Friendly ES copy",
  descLib.includes("Agrega una descripción más completa antes de publicar."),
  "enVentaPublishDescription.ts",
);
add(
  "Friendly EN copy",
  descLib.includes("Add a more complete description before publishing."),
  "enVentaPublishDescription.ts",
);

add(
  "Canonical preview field enVentaCanonicalMainDescription",
  descLib.includes("enVentaCanonicalMainDescription") && stack.includes("description: state.description.trim()"),
  "desc lib + buildEnVentaContentStackModel.ts",
);
add(
  "Publish uses prepareEnVentaStateForPublish",
  publish.includes("prepareEnVentaStateForPublish"),
  "enVentaPublishFromDraft.ts",
);
add(
  "Publish uses resolveEnVentaPublishDescriptionForDb + canonical",
  publish.includes("resolveEnVentaPublishDescriptionForDb") &&
    publish.includes("enVentaCanonicalMainDescription(draft)"),
  "enVentaPublishFromDraft.ts",
);
add(
  "Gallery/video updates guarded",
  publish.includes("guardEnVentaDescriptionColumnForDb"),
  "enVentaPublishFromDraft.ts",
);
add(
  "No buildDescriptionBody concat",
  !publish.includes("buildDescriptionBody"),
  "enVentaPublishFromDraft.ts",
);
add(
  "Client description blockers",
  validation.includes("collectEnVentaPublishDescriptionBlockers") &&
    validation.includes("prepareEnVentaStateForPublish"),
  "enVentaPublishValidation.ts",
);
add(
  "Pro + Free share EnVentaPublishSubmitBar",
  proApp.includes("EnVentaPublishSubmitBar") && freeApp.includes("EnVentaPublishSubmitBar"),
  "LeonixEnVentaProApplication + LeonixEnVentaFreeApplication",
);
add(
  "Resume hydration on Pro/Free",
  proApp.includes("resolveEnVentaPublishFormInitialState") &&
    freeApp.includes("isEnVentaPublishResumeRequested"),
  "publish applications",
);

add(
  "Raw description_len_check not primary UI in submit bar",
  !submitBar.includes("description_len_check"),
  "EnVentaPublishSubmitBar.tsx",
);
add(
  "Friendly fallback on DB constraint in publish",
  publish.includes("mapLeonixListingsDescriptionConstraintToUserMessage"),
  "enVentaPublishFromDraft.ts",
);

add(
  "R11B npm script registered",
  pkg.includes("varios:r11b-category-publish-description-audit"),
  "package.json",
);

const diffNames = gitDiffNames();
const forbiddenPatterns = [
  /^supabase\/migrations\//,
  /dashboard/i,
  /analytics/i,
  /EnVentaPreviewPage\.tsx$/,
  /EnVentaAnuncioLayout/,
  /results\//i,
  /landing/i,
];
const forbiddenHits = diffNames.filter((f) => forbiddenPatterns.some((re) => re.test(f)));
add(
  "No forbidden paths in git diff",
  forbiddenHits.length === 0,
  forbiddenHits.length ? forbiddenHits.join(", ") : diffNames.join(", ") || "(clean or allowed only)",
);

const allowedR11b = [
  "app/(site)/clasificados/en-venta/publish/",
  "app/lib/clasificados/en-venta/",
  "scripts/varios-r11b",
  "package.json",
];
const unrelated = diffNames.filter(
  (f) => !allowedR11b.some((prefix) => f.startsWith(prefix) || f.includes("VARIOS_R11B")),
);
add(
  "Git diff only R11B-allowed areas (or empty)",
  unrelated.length === 0,
  unrelated.length ? unrelated.join(", ") : diffNames.join(", ") || "(none)",
);

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R11B — category publish description audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "PASS" : "FAIL"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) process.exit(1);
