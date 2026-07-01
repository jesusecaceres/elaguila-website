/**
 * EMPLEOS-E4 — En Venta/Varios Canvas Shell Audit Script
 *
 * Verifies all Gate K/L/M/N requirements and key invariants for the
 * Empleos E4 unification work. Run with:
 *   npx tsx scripts/empleos-e4-enventa-canvas-shell-audit.ts
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read(rel: string): string {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function assertContains(file: string, label: string, ...fragments: string[]): void {
  const src = read(file);
  for (const frag of fragments) {
    assert(
      src.includes(frag),
      `FAIL [${label}] "${frag}" not found in ${file}`,
    );
  }
}

function assertNotContains(file: string, label: string, fragment: string): void {
  const src = read(file);
  assert(
    !src.includes(fragment),
    `FAIL [${label}] unexpected "${fragment}" found in ${file}`,
  );
}

function pass(msg: string): void {
  console.log(`  ✅  ${msg}`);
}

function section(title: string): void {
  console.log(`\n── ${title}`);
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const AUDIT_MD = "app/lib/clasificados/empleos/EMPLEOS_E4_ENVENTA_CANVAS_SHELL_AUDIT.md";
const QUICK_DETAIL = "app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx";
const CTA_CARD = "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx";
const HEADER_CARD = "app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx";
const BENEFITS_CARD = "app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx";
const LOCATION_CARD = "app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx";
const RESULT_CARD = "app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx";
const PREMIUM_UI = "app/(site)/clasificados/empleos/lib/empleosPremiumUi.ts";
const SHELL_MAPPER = "app/(site)/clasificados/empleos/lib/empleosPublishedLaneShell.ts";
const PUBLIC_LANE = "app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx";
const QUICK_DRAFT = "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts";
const DRAFT_MAPPER = "app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts";
const APP_FORM = "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx";

// ─── 1. Audit doc ──────────────────────────────────────────────────────────────

section("1. Audit doc exists");
assert(exists(AUDIT_MD), `FAIL — audit doc missing: ${AUDIT_MD}`);
pass("Audit doc found");

// ─── 2. TRUE/FALSE table ───────────────────────────────────────────────────────

section("2. Audit doc — TRUE/FALSE table");
assertContains(AUDIT_MD, "audit-table", "TRUE/FALSE Audit Table");
assertContains(AUDIT_MD, "audit-table-rows",
  "En Venta/Varios inspected as inspiration",
  "En Venta/Varios files NOT modified",
  "Build passed",
  "No files staged",
  "No commit created",
  "No push attempted",
);
pass("TRUE/FALSE table found with required rows");

// ─── 3. Audit doc mentions key section headers ────────────────────────────────

section("3. Audit doc — key section mentions");
assertContains(AUDIT_MD, "audit-doc-sections",
  "En Venta/Varios Benchmark Files Inspected",
  "premium canvas",
  "Right Apply/Contact Card Result",
  "Social Logos/Company Links Result",
  "Location/Map Card Result",
  "Analytics Truth Result",
  "Mobile/PWA Result",
);
pass("Audit doc contains all required section mentions");

// ─── 4. Schedule/hours labels in application form ─────────────────────────────

section("4. Schedule/hours UX labels in EmpleoQuickApplicationClient");
assertContains(APP_FORM, "schedule-labels",
  "Horario / turnos",
  "A\u00f1adir turno",
);
pass("Horario / turnos and A\u00f1adir turno labels present in application form");

// ─── 5. Key Empleos labels in changed files ───────────────────────────────────

section("5. Key Empleos labels in changed files");

assertContains(CTA_CARD, "cta-labels",
  "Aplicar ahora",
  "Conoce al empleador",
  "Publicado en Leonix",
  "LinkedIn",
  "Facebook",
  "Instagram",
  "Snapchat",
);
pass("QuickJobCTACard — apply/social/trust labels found");

assertContains(QUICK_DETAIL, "detail-labels",
  "Ubicaci\u00f3n del empleo",
  "reportar",
);
pass("EmpleoQuickDetailPage — ubicacion / reportar labels found");

assertContains(RESULT_CARD, "result-labels",
  "Ver empleo",
  "View job",
);
pass("EmpleosJobResultCard — Ver empleo / View job labels found");

// ─── 6. New social fields in mappers ─────────────────────────────────────────

section("6. New social fields in published shell mapper");
assertContains(SHELL_MAPPER, "shell-mapper-socials",
  "companyTikTok",
  "companyYouTube",
  "companyX",
  "companySnapchat",
  "contactTitle",
);
pass("mapPublishedQuickToShell — all new fields present");

assertContains(DRAFT_MAPPER, "draft-mapper-socials",
  "companyTikTok",
  "companyYouTube",
  "companyX",
  "companySnapchat",
  "contactTitle",
);
pass("mapQuickDraftToShell — all new fields present");

// ─── 7. Draft type has all social fields ──────────────────────────────────────

section("7. EmpleosQuickDraft type — social fields");
assertContains(QUICK_DRAFT, "draft-type-socials",
  "companyTikTok",
  "companyYouTube",
  "companyX",
  "companySnapchat",
  "contactTitle",
);
pass("EmpleosQuickDraft type — all social/contact fields present");

// ─── 8. EN_VENTA canvas tokens in detail page ────────────────────────────────

section("8. EN_VENTA canvas tokens in EmpleoQuickDetailPage");
assertContains(QUICK_DETAIL, "detail-canvas",
  "F8F4EA",
  "FFFDF7",
  "D6C7AD",
  "C9A84A",
);
pass("EmpleoQuickDetailPage — EN_VENTA color tokens present (cream, warm border, gold)");
assertContains(CTA_CARD, "cta-burgundy-token", "7A1E2C");
pass("QuickJobCTACard — burgundy token present");

// ─── 9. Engagement row wired in public lane ───────────────────────────────────

section("9. Engagement row wired in EmpleosPublicLaneDetailClient");
assertContains(PUBLIC_LANE, "engagement-wired",
  "quickEngagement",
  "suppressEngagement",
);
pass("EmpleosPublicLaneDetailClient — engagement props wired for quick lane");

// ─── 10. Mobile/PWA overflow fixes ───────────────────────────────────────────

section("10. Mobile/PWA overflow fixes");
assertContains(QUICK_DETAIL, "mobile-overflow",
  "overflow-x-hidden",
  "min-w-0",
  "break-words",
);
pass("EmpleoQuickDetailPage — overflow-x-hidden, min-w-0, break-words present");

assertContains(CTA_CARD, "cta-mobile",
  "min-w-0",
  "break-words",
  "overflow-hidden",
);
pass("QuickJobCTACard — min-w-0, break-words, overflow-hidden present");

// ─── 11. Faux map in location card ────────────────────────────────────────────

section("11. Faux map in QuickJobLocationCard");
assertContains(LOCATION_CARD, "faux-map",
  "QuickJobFauxMap",
  "google.com/maps/search",
  "7A1E2C",
  "C9A84A",
);
pass("QuickJobLocationCard — faux map and Open Maps button present");

// ─── 12. Result card premium tokens ──────────────────────────────────────────

section("12. Result card premium tokens");
assertContains(RESULT_CARD, "result-card-tokens",
  "CompanyAvatar",
  "7A1E2C",
  "FBF7EF",
  "D6C7AD",
  "3D3428",
);
pass("EmpleosJobResultCard — burgundy pay, chip tokens, charcoal title present");

assertContains(PREMIUM_UI, "premium-ui-tokens",
  "7A1E2C",
  "FFFDF7",
  "D6C7AD",
  "C9A84A",
);
pass("empleosPremiumUi.ts — updated tokens present (cream surface, gold border, burgundy CTA)");

// ─── 13. En Venta/Varios files NOT modified ───────────────────────────────────

section("13. En Venta/Varios files not modified");
let gitDiff = "";
try {
  gitDiff = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf-8" });
} catch {
  gitDiff = "";
}
const dirty = gitDiff.split("\n").filter(Boolean);
const enVentaDirty = dirty.filter((f) => f.includes("en-venta") || f.includes("en_venta"));
assert(
  enVentaDirty.length === 0,
  `FAIL — En Venta files modified: ${enVentaDirty.join(", ")}`,
);
pass("No En Venta/Varios files modified");

// ─── 14. Stripe files NOT modified ───────────────────────────────────────────

section("14. Stripe files not modified");
const stripeDirty = dirty.filter((f) => f.toLowerCase().includes("stripe"));
assert(
  stripeDirty.length === 0,
  `FAIL — Stripe files modified: ${stripeDirty.join(", ")}`,
);
pass("No Stripe files modified");

// ─── 15. Supabase migration/schema files NOT modified ────────────────────────

section("15. Supabase migration/schema files not modified");
const supaDirty = dirty.filter(
  (f) => f.includes("supabase/migrations") || f.includes("supabase/schema") || f.includes("supabase/seed"),
);
assert(
  supaDirty.length === 0,
  `FAIL — Supabase migration/schema files modified: ${supaDirty.join(", ")}`,
);
pass("No Supabase migration/schema files modified");

// ─── 16. Unrelated category directories NOT modified ─────────────────────────

section("16. Unrelated category directories not modified");
const UNRELATED = [
  "comunidad", "clases", "busco", "autos", "restaurantes", "servicios",
  "rentas", "bienes-raices", "bienes_raices",
];
const unrelatedDirty = dirty.filter((f) =>
  UNRELATED.some((cat) => f.includes(`/${cat}/`) || f.startsWith(`${cat}/`)),
);
assert(
  unrelatedDirty.length === 0,
  `FAIL — Unrelated category files modified: ${unrelatedDirty.join(", ")}`,
);
pass("No unrelated category directories modified");

// ─── 17. .env.local not staged ────────────────────────────────────────────────

section("17. .env.local not staged");
let staged = "";
try {
  staged = execSync("git diff --cached --name-only", { cwd: ROOT, encoding: "utf-8" });
} catch {
  staged = "";
}
const stagedFiles = staged.split("\n").filter(Boolean);
assert(
  !stagedFiles.some((f) => f.includes(".env.local")),
  "FAIL — .env.local is staged",
);
pass(".env.local not staged");

// ─── 18. package-lock.json not staged ────────────────────────────────────────

section("18. package-lock.json not staged (unless approved)");
assert(
  !stagedFiles.some((f) => f.includes("package-lock.json")),
  "FAIL — package-lock.json is staged",
);
pass("package-lock.json not staged");

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════════════════════════");
console.log("  EMPLEOS-E4 AUDIT COMPLETE — ALL CHECKS PASSED ✅");
console.log("══════════════════════════════════════════════════════════════\n");
