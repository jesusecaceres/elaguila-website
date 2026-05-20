/**
 * A5.3 Autos Negocios live QA static gate.
 * Run: npm run autos:a5-3-negocios-live-qa-audit
 *
 * Runtime publish/inventory proof: `npm run verify:autos:e2e` (Playwright + test bypass).
 * Full `/publicar/autos/negocios` wizard UI is manual QA — not automated here.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "A5.2 files were inspected",
  "Negocios real publish flow was tested or blocker documented",
  "Test bypass does not route to Stripe when enabled",
  "Published Negocio listing gets real id",
  "Published Negocio listing gets real leonix_ad_id",
  "Published listing appears in public detail",
  "Published listing appears in results",
  "Published listing appears in user dashboard or blocker documented",
  "Published listing appears in admin Autos or blocker documented",
  "Inventory add mode was tested or blocker documented",
  "Inventory add vehicle remains its own real listing",
  "Inventory add vehicle gets its own leonix_ad_id",
  "Parent/child inventory grouping works or blocker documented",
  "Dealer gallery shows real related inventory only",
  "Current vehicle is excluded from related inventory",
  "Preview has no fake analytics",
  "Public detail has no fake analytics",
  "Contact card uses real CTAs only",
  "Address/map CTA uses structured address where available",
  "Photo reorder remains working",
  "Mobile layout remains usable",
  "No unrelated categories were touched",
  "npm run build passed",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function changedFiles(): string[] {
  const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isAllowedPath(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("scripts/autos-") ||
    p.startsWith("e2e/autos/")
  );
}

function run() {
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_3_NEGOCIOS_LIVE_QA_AUDIT.md";
  assert.ok(exists(mdPath), "A5.3 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
  }

  assert.ok(exists("app/lib/clasificados/autos/AUTOS_A5_2_NEGOCIOS_LAUNCH_POLISH_AUDIT.md"), "A5.2 audit file");
  assert.ok(exists("scripts/autos-a5-2-negocios-launch-polish-audit.ts"), "A5.2 audit script");

  assert.ok(exists("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx"), "Contact card");
  assert.ok(exists("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryValueModule.tsx"), "Inventory value module");
  assert.ok(exists("app/(site)/publicar/autos/shared/components/AutosSortablePhotoGrid.tsx"), "Sortable photo grid");
  assert.ok(exists("app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx"), "Related dealer cars");

  const addFlow = read("app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts");
  assert.ok(addFlow.includes("inventoryMode"), "Inventory add query support");

  const preview = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(!preview.includes("AUTOS_LISTING_ANALYTICS_DRAFT_DEMO"), "No draft demo analytics in preview");
  assert.ok(preview.includes("publicPlaybackOnly"), "Analytics gated on live playback");

  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  assert.ok(checkout.includes("testPublishBypass"), "Test bypass branch in checkout");
  assert.ok(checkout.includes("isAutosAllowTestPublishBypassEnabled"), "Test bypass guard");

  const e2e = read("e2e/autos/autos-go-live-smoke.spec.ts");
  assert.ok(e2e.includes("parentListingId: negId"), "E2E inventory add via parentListingId");
  assert.ok(e2e.includes("leonix_ad_id"), "E2E asserts leonix_ad_id");
  assert.ok(e2e.includes("relatedDealerListings"), "E2E asserts related inventory");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-3-negocios-live-qa-audit"), "package script registered");

  const forbiddenStripeTouch = changedFiles().filter(
    (p) => p.includes("stripe") && !p.startsWith("app/lib/clasificados/autos/") && !p.startsWith("app/api/clasificados/autos/"),
  );
  assert.equal(forbiddenStripeTouch.length, 0, `Global Stripe files modified: ${forbiddenStripeTouch.join(", ")}`);

  const bad = changedFiles().filter((p) => !isAllowedPath(p));
  if (bad.length > 0) {
    console.warn("A5.3 scope warning — files outside Autos allow-list:");
    for (const p of bad) console.warn(`  - ${p}`);
  }

  console.log("autos:a5-3-negocios-live-qa-audit OK");
}

run();
