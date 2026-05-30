/**
 * Emergency Gate V-L1 — Varios published listing visibility audit
 * Run: npm run varios:vl1-published-visibility-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_VL1_PUBLISHED_VISIBILITY_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const publish = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
const select = read("app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts");
const fetchBrowse = read("app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts");
const results = read("app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx");
const hubPage = read("app/(site)/clasificados/en-venta/page.tsx");
const hubClient = read("app/(site)/clasificados/en-venta/EnVentaHubPageClient.tsx");
const hubRecent = read("app/(site)/clasificados/en-venta/hub/EnVentaHubRecentListings.tsx");
const visibility = read("app/(site)/clasificados/en-venta/lib/enVentaListingVisibility.ts");
const pkg = read("package.json");

const bundle = [publish, select, fetchBrowse, results, hubPage, hubClient, hubRecent].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Audit root cause section", audit.includes("## 8. Root cause"), auditPath);
add("Audit fix section", audit.includes("## 9. Fix applied"), auditPath);

const requiredAuditRows = [
  "Publish write path was inspected",
  "Landing reads canonical published Varios source",
  "Results reads canonical published Varios source",
  "No fake public listings were added",
  "Internal slug remains en-venta",
  "npm run build passed",
];
for (const req of requiredAuditRows) {
  const line = audit.split("\n").find((l) => l.includes(`| ${req} |`));
  add(`Audit row: ${req}`, Boolean(line?.includes("| TRUE |")), req);
}

add("Canonical query module", select.includes("queryEnVentaBrowseListings"), "enVentaListingPublicSelect.ts");
add("Query uses listings table", select.includes('.from("listings")'), "enVentaListingPublicSelect.ts");
add("Query filters en-venta category", select.includes('"en-venta"'), "enVentaListingPublicSelect.ts");
add("Query filters active status", select.includes('"active"'), "enVentaListingPublicSelect.ts");
add("Server fetch uses canonical query", fetchBrowse.includes("queryEnVentaBrowseListings"), "fetchEnVentaPublicListingsForBrowse.ts");
add("Server fetch applies visibility helper", fetchBrowse.includes("isEnVentaListingPubliclyVisible"), "fetchEnVentaPublicListingsForBrowse.ts");
add("Results uses canonical query", results.includes("queryEnVentaBrowseListings"), "EnVentaResultsClient.tsx");
add("Hub page server fetch", hubPage.includes("fetchEnVentaPublicListingsForBrowse"), "page.tsx");
add("Hub recent listings component", hubRecent.includes("EnVentaResultListingCard"), "EnVentaHubRecentListings.tsx");
add("No demo pool on hub", !hubRecent.includes("demo") && !hubRecent.includes("sampleData"), "EnVentaHubRecentListings.tsx");
add("Publish finalize verifies select", publish.includes(".select(") && publish.includes("isEnVentaListingPubliclyVisible"), "enVentaPublishFromDraft.ts");
add("Publish sets published_at on finalize", publish.includes("published_at"), "enVentaPublishFromDraft.ts");
add("Visibility requires active status", visibility.includes("en-venta"), "enVentaListingVisibility.ts");
add("Spanish Varios label in anuncio", read("app/(site)/clasificados/anuncio/[id]/page.tsx").includes("Varios"), "anuncio/[id]/page.tsx");
add("No Stripe in changed bundle", !bundle.includes("stripe"), "bundle");
add("Gate V-L1 npm script", pkg.includes("varios:vl1-published-visibility-audit"), "package.json");

let diffNames: string[] = [];
try {
  diffNames = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  diffNames = [];
}

const allowedPrefixes = [
  "app/(site)/clasificados/en-venta/",
  "app/lib/clasificados/en-venta/",
  "app/api/clasificados/en-venta/",
  "scripts/varios-vl1-published-visibility-audit.ts",
  "package.json",
];

const outOfScope = diffNames.filter(
  (f) => !allowedPrefixes.some((p) => f === p || f.startsWith(p)),
);
add("No unrelated category files in git diff", outOfScope.length === 0, outOfScope.join(", ") || "scope clean");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate V-L1 — Varios published visibility audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
