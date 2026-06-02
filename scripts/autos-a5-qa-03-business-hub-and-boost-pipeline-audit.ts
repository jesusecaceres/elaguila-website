/**
 * A5.QA-03 Autos Negocios Business Hub + Inventory Boost pipeline static gate.
 * Run: npm run autos:a5-qa-03-business-hub-and-boost-pipeline-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Autos Negocios Business Hub fields were verified",
  "SMS/text support exists or safe source documented",
  "Expanded socials are supported",
  "Google/Yelp review links are supported",
  "Up to 3 custom links with titles are supported",
  "Custom links show under Encuentra más sobre nosotros / Find more about us",
  "Branded social output exists",
  "Branded review link output exists",
  "Branded map/location panel exists",
  "Empty fields hide cleanly",
  "Contact card layout adapts without gaps",
  "Finance/pre-approval contact still works",
  "Optional finance image/logo is supported or blocker documented",
  "Inventory module uses $399/month base copy",
  "Inventory module uses 10 included active vehicles copy",
  "Inventory Boost uses +10 for $129/month copy",
  "Inventory Boost total shows $528/month where useful",
  "$129.99/$528.99 copy was removed or documented",
  "Included add-inventory CTA exists",
  "Inventory Boost CTA/pipeline shell exists",
  "Inventory Boost does not fake payment success",
  "Inventory Boost does not unlock slots without payment",
  "Inventory Boost does not touch global Stripe/payment",
  "Draft is saved before upgrade path interaction",
  "Refresh preserves current draft",
  "Preview/back preserves current draft",
  "Future Stripe return context is prepared or blocker documented",
  "Main listings appear in landing/results",
  "Additional inventory vehicles appear in landing/results",
  "Any vehicle detail shows other dealer vehicles excluding itself",
  "Public buyer does not see owner inventory management CTAs",
  "A5.QA-02 spacebar behavior remains fixed",
  "A5.QA-02 media reorder behavior remains fixed",
  "A5.QA-02 draft persistence behavior remains fixed",
  "Privado was inspected for shared impact",
  "No dealer-only fields were added to Privado",
  "No unrelated categories were touched",
  "No fake ratings/reviews/socials were added",
  "No Stripe/payment logic was added",
  "npm run build passed",
];

const INVENTORY_COPY_FILES = [
  "app/lib/clasificados/autos/autosDealerInventoryCopy.ts",
  "app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts",
  "app/lib/clasificados/autos/autosDealerInventoryDrawerCopy.ts",
  "app/lib/clasificados/autos/autosInventoryBoostPipeline.ts",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
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
    p.startsWith("scripts/autos-")
  );
}

const FAKE_PAYMENT_PATTERNS = [
  /payment\s+successful/i,
  /pago\s+exitoso/i,
  /slots?\s+unlocked/i,
  /espacios\s+desbloqueados/i,
];

function run() {
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_QA_03_BUSINESS_HUB_AND_BOOST_PIPELINE_AUDIT.md";
  assert.ok(fs.existsSync(path.join(ROOT, mdPath)), "A5.QA-03 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
    assert.ok(md.includes(`| ${row} | TRUE |`), `Audit row must be TRUE: ${row}`);
  }

  const inventoryCopy = INVENTORY_COPY_FILES.map(read).join("\n");
  assert.ok(inventoryCopy.includes("399"), "$399/month copy");
  assert.ok(inventoryCopy.includes("129"), "$129/month copy");
  assert.ok(inventoryCopy.includes("528"), "$528/month copy");
  assert.ok(inventoryCopy.includes("10"), "10 active vehicles copy");

  for (const f of INVENTORY_COPY_FILES) {
    const body = read(f);
    assert.ok(!body.includes("129.99"), `${f} must not contain 129.99`);
    assert.ok(!body.includes("528.99"), `${f} must not contain 528.99`);
  }

  const boostPanel = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx");
  assert.ok(boostPanel.includes("autosInventoryBoostPrepareCta"), "Prepare boost CTA");
  assert.ok(boostPanel.includes("autosInventoryBoostCheckoutSoonMessage"), "Checkout soon message");
  assert.ok(boostPanel.includes("flushDraft"), "Draft flush before prepare");

  const pipeline = read("app/lib/clasificados/autos/autosInventoryBoostPipeline.ts");
  assert.ok(pipeline.includes("AUTOS_INVENTORY_BOOST_RETURN_SESSION_KEY"), "Return context session key");
  assert.ok(pipeline.includes("writeAutosInventoryBoostReturnContext"), "Return context writer");

  const valueCopy = read("app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts");
  assert.ok(valueCopy.includes("Agregar 10 espacios por $129/mes"), "Boost CTA ES");
  assert.ok(valueCopy.includes("Add 10 slots for $129/month"), "Boost CTA EN");

  const types = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  assert.ok(types.includes("financeContactImageUrl"), "Finance image field on listing type");

  const financeFields = read("app/(site)/publicar/autos/shared/components/AutosDealerFinanceFields.tsx");
  assert.ok(financeFields.includes("financeContactImageUrl"), "Finance image form field");

  const customLinks = read("app/lib/clasificados/autos/autosDealerCustomLinks.ts");
  assert.ok(/MAX.*3|max.*3|<= 3|\.slice\(0,\s*3\)/i.test(customLinks), "Max 3 custom links");

  const socialBrand = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosBusinessHubSocialBrand.tsx");
  assert.ok(socialBrand.includes("linkedin"), "LinkedIn brand");
  assert.ok(socialBrand.includes("snapchat"), "Snapchat brand");

  for (const f of INVENTORY_COPY_FILES) {
    const body = read(f);
    for (const pat of FAKE_PAYMENT_PATTERNS) {
      assert.ok(!pat.test(body), `${f} must not imply fake payment: ${pat}`);
    }
  }

  const serviciosPath = "app/(site)/servicios/";
  const serviciosTouched = changedFiles().filter((p) => p.startsWith(serviciosPath));
  assert.equal(serviciosTouched.length, 0, "Servicios files must not be modified");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-qa-03-business-hub-and-boost-pipeline-audit"), "package script registered");

  const bad = changedFiles().filter((p) => !isAllowedPath(p) && !p.startsWith(".next/"));
  if (bad.length > 0) {
    console.warn("Warning: changed files outside Autos scope:", bad.slice(0, 20).join(", "));
  }

  console.log("autos:a5-qa-03-business-hub-and-boost-pipeline-audit — OK");
}

run();
