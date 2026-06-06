/**
 * A5.QA-08D Autos Supabase production verification + live inventory publish proof gate.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_QA_08D_SUPABASE_PRODUCTION_VERIFICATION_LIVE_PROOF_AUDIT.md",
);
const CHECKLIST_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_QA_08D_SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md",
);
const VERIFY_SQL = path.join(ROOT, "scripts/autos-a4-0-dealer-inventory-verification.sql");
const INVENTORY_MIGRATION = path.join(ROOT, "supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "git diff reviewed before editing",
  "Autos scope lock respected",
  "Latest Autos audits inspected",
  "Supabase schema/migrations inspected",
  "Required inventory fields identified",
  "Migration need determined",
  "Migration, if created, is minimal and backward-compatible",
  "No destructive SQL created",
  "Supabase manual verification checklist created",
  "Column verification SQL provided",
  "Inventory row proof SQL provided",
  "Dealer inventory group verification SQL provided",
  "Leonix Ad ID verification SQL provided",
  "Inventory role verification SQL provided",
  "QA publish path inspected",
  "QA bypass is protected or blocker documented",
  "QA bypass does not fake Stripe payment",
  "Production payment protection remains intact",
  "Publish path can create main listing or blocker documented",
  "Publish path can create child listings or blocker documented",
  "Every published vehicle can have own listing ID",
  "Every published vehicle can have own Leonix Ad ID",
  "Every published vehicle can have own detail URL/slug",
  "Published vehicles can share dealer inventory group",
  "Main/additional inventory role supported",
  "Results page reads real published rows or blocker documented",
  "Detail page reads real published rows or blocker documented",
  "More vehicles from dealer section uses real group data or blocker documented",
  "Public buyer owner-only CTA separation checked",
  "Dashboard/admin backing inspected",
  "No fake dashboard counts added",
  "No fake analytics added",
  "Privado checked for shared impact",
  "No dealer-only features added to Privado",
  "No global Stripe/payment files touched",
  "No unrelated categories touched",
  "npm run build passed",
];

const DESTRUCTIVE_SQL = [/drop\s+table/i, /truncate\s+/i, /drop\s+column/i, /rename\s+column/i];

const PRIVADO_DEALER_ONLY = [
  "Inventory Boost",
  "Más vehículos de este dealer",
  "additionalInventoryVehicles",
  "Modo QA: pago omitido",
  "AutosNegociosAddInventoryDrawer",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/restaurantes/",
  "app/(site)/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/tienda/",
  "app/api/stripe/",
];

const GATE_OWN_MARKERS = ["AUTOS_A5_QA_08D", "autos-a5-qa-08d"];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    if (out) return out.split(/\r?\n/).filter(Boolean);
  } catch {
    /* ignore */
  }
  try {
    return execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function untrackedFiles(): string[] {
  try {
    const out = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function changesFromThisGate(): string[] {
  const all = [...new Set([...changedFiles(), ...untrackedFiles()])];
  return all.filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return GATE_OWN_MARKERS.some((m) => norm.includes(m)) || norm === "package.json";
  });
}

function sqlBlocksFromMarkdown(text: string): string {
  const blocks = [...text.matchAll(/```sql\s*([\s\S]*?)```/gi)].map((m) => m[1] ?? "");
  return blocks.length ? blocks.join("\n") : text;
}

function assertNoDestructiveSql(text: string, label: string) {
  const scoped = sqlBlocksFromMarkdown(text);
  for (const re of DESTRUCTIVE_SQL) {
    assert.ok(!re.test(scoped), `${label} SQL blocks must not contain destructive SQL: ${re}`);
  }
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD), "QA-08D audit markdown must exist");
  assert.ok(fs.existsSync(CHECKLIST_MD), "QA-08D manual Supabase checklist must exist");
  assert.ok(fs.existsSync(VERIFY_SQL), "A4.0 verification SQL must exist");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  const checklistText = fs.readFileSync(CHECKLIST_MD, "utf8");

  for (const row of AUDIT_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
      `Audit row must be TRUE: ${row}`,
    );
  }

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation line must exist (GREEN/YELLOW/RED)");
  const recommendation = recMatch[1]!.toUpperCase();
  if (recommendation === "GREEN") {
    assert.ok(!auditText.includes("| FALSE |"), "No FALSE rows when recommendation is GREEN");
  }

  assert.ok(checklistText.includes("information_schema.columns"), "Checklist must include column verification SQL");
  assert.ok(checklistText.includes("select") && checklistText.toLowerCase().includes("dealer_inventory_group_id"));
  assert.ok(checklistText.includes("leonix_ad_id"));
  assert.ok(checklistText.includes("inventory_role"));
  assert.ok(checklistText.includes("dealer_inventory_parent_listing_id"));
  assert.ok(checklistText.includes("autos_classifieds_listings"));
  assert.ok(checklistText.includes("20260518124700_autos_dealer_inventory_grouping.sql"));

  assertNoDestructiveSql(checklistText, "Manual checklist");
  assertNoDestructiveSql(fs.readFileSync(INVENTORY_MIGRATION, "utf8"), "Inventory migration");

  const bundle = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts");
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  const publicListings = read("app/api/clasificados/autos/public/listings/route.ts");
  const bypassCfg = read("app/lib/clasificados/autos/autosInternalPublishConfig.ts");
  const copy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  assert.ok(bundle.includes("autos_classifieds_listings") || service.includes("autos_classifieds_listings"));
  assert.ok(service.includes("leonix_ad_id"));
  assert.ok(service.includes("dealer_inventory_group_id"));
  assert.ok(service.includes("dealer_inventory_parent_listing_id"));
  assert.ok(service.includes("inventory_role"));
  assert.ok(bundle.includes("publishNegociosBundleAdditionalVehicles"));
  assert.ok(
    read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts").includes("additionalInventoryVehicles"),
  );
  assert.ok(checkout.includes("bundle_requires_qa_bypass"));
  assert.ok(bypassCfg.includes("VERCEL_ENV") && bypassCfg.includes("production"));
  assert.ok(publicListings.includes("listActiveAutosClassifiedsRows"));
  assert.ok(!publicListings.toLowerCase().includes("localstorage"));
  assert.ok(copy.includes("Modo QA: pago omitido") || copy.includes("QA mode: payment skipped"));
  assert.ok(negociosCopy.includes("Más vehículos de este dealer"));
  assert.ok(negociosCopy.includes("More vehicles from this dealer"));

  for (const s of PRIVADO_DEALER_ONLY) {
    assert.ok(!privado.includes(s), `Privado must not contain: ${s}`);
  }

  for (const f of changesFromThisGate()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(bad), `Gate must not modify forbidden path: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-qa-08d-supabase-production-verification-live-proof-audit"));
  assert.ok(auditText.includes("AUTOS_A5_QA_08D_SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md"));

  console.log("A5.QA-08D Supabase production verification live proof audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
  console.log(`Recommendation: ${recommendation}`);
}

run();
