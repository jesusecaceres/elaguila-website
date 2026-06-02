/**
 * A5.QA-05 Autos Negocios full recovery + final QA readiness static gate.
 * Run: npm run autos:a5-qa-05-full-recovery-final-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Servicios Business Hub files inspected read-only",
  "Autos Negocios dealer contact fields exist",
  "SMS/text support exists or safe source documented",
  "Expanded socials exist: Instagram/Facebook/TikTok/YouTube/LinkedIn/X/Snapchat/Pinterest/WhatsApp profile",
  "Google Reviews link is supported",
  "Yelp Reviews link is supported",
  "Up to 3 custom links with titles are supported",
  "Custom links show under Encuentra más sobre nosotros / Find more about us",
  "Finance/pre-approval fields exist",
  "Optional finance image/logo field exists or blocker documented",
  "Finance image/logo output hides when empty",
  "Finance image/logo output shows when valid",
  "Branded social output exists",
  "Branded review link output exists",
  "Branded map/location panel exists",
  "Empty Business Hub fields hide cleanly",
  "Contact card adapts without blank gaps",
  "Free-text fields allow spaces",
  "Engine accepts 3.5 V6",
  "Calle/street accepts 1601 Coleman Ave",
  "Numeric-only fields remain intentionally restricted",
  "Photo cards support desktop drag reorder",
  "Mobile photo reorder fallback remains",
  "Cover image selection still works",
  "Reordered images persist to preview/detail",
  "Refresh preserves Autos Negocios draft",
  "Preview/back preserves Autos Negocios draft",
  "Inventory module uses $399/month base",
  "Inventory module says 10 active vehicles included",
  "Inventory Boost says +10 for $129/month",
  "Inventory Boost total shows $528/month where useful",
  "$129.99/$528.99 copy removed or documented",
  "Included add-inventory CTA exists",
  "Inventory Boost CTA/pipeline shell exists",
  "Inventory Boost does not fake payment success",
  "Inventory Boost does not unlock slots without payment",
  "Inventory Boost does not touch global Stripe/payment",
  "Draft is saved before upgrade path interaction",
  "Future Stripe return context is prepared or blocker documented",
  "Main listings appear in landing/results",
  "Additional inventory vehicles appear in landing/results",
  "Each vehicle remains its own listing with its own Leonix Ad ID",
  "Detail pages show other dealer vehicles excluding current vehicle",
  "Public buyer does not see owner inventory management CTAs",
  "Dashboard inventory summary exists or blocker documented",
  "Admin inventory visibility exists or blocker documented",
  "Privado was inspected for shared impact",
  "No dealer-only fields were added to Privado",
  "No unrelated categories were touched",
  "No fake ratings/reviews/socials were added",
  "No global Stripe/payment logic was added",
  "npm run build passed",
];

const INVENTORY_COPY_FILES = [
  "app/lib/clasificados/autos/autosDealerInventoryCopy.ts",
  "app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts",
  "app/lib/clasificados/autos/autosDealerInventoryDrawerCopy.ts",
  "app/lib/clasificados/autos/autosInventoryBoostPipeline.ts",
];

const SERVICIOS_READONLY = [
  "app/(site)/servicios/lib/serviciosBusinessHubContactTypes.ts",
  "app/(site)/servicios/lib/serviciosBusinessHubSocialBrand.tsx",
  "app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts",
  "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx",
  "app/(site)/servicios/components/ServiciosBusinessHubFauxMap.tsx",
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

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.ok(toplevel.replace(/\\/g, "/").toLowerCase().includes("elaguila-website"), "Wrong repo root");

  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_QA_05_FULL_RECOVERY_FINAL_AUDIT.md";
  assert.ok(fs.existsSync(path.join(ROOT, mdPath)), "A5.QA-05 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
    assert.ok(md.includes(`| ${row} | TRUE |`), `Audit row must be TRUE: ${row}`);
  }

  for (const f of SERVICIOS_READONLY) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `Servicios reference file missing: ${f}`);
  }

  const copy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(copy.includes("Imagen o logo de financiamiento"), "ES finance image label");
  assert.ok(copy.includes("Finance image or logo"), "EN finance image label");
  assert.ok(copy.includes("Encuentra más sobre nosotros"), "ES custom links heading");
  assert.ok(copy.includes("Find more about us"), "EN custom links heading");
  assert.ok(copy.includes("inventoryMainHelper"), "Main inventory helper");
  assert.ok(copy.includes("inventoryAddHelper"), "Add inventory helper");
  assert.ok(copy.includes("Más vehículos de este dealer"), "ES related inventory title");

  const types = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  assert.ok(types.includes("financeContactImageUrl"), "financeContactImageUrl");
  assert.ok(types.includes("dealerCustomLinks"), "dealerCustomLinks");
  assert.ok(types.includes("googleReviewsUrl"), "googleReviewsUrl");
  assert.ok(types.includes("yelpReviewsUrl"), "yelpReviewsUrl");
  assert.ok(types.includes("dealerSmsPhone"), "dealerSmsPhone");
  assert.ok(types.includes("linkedin"), "linkedin social");
  assert.ok(types.includes("snapchat"), "snapchat social");
  assert.ok(types.includes("pinterest"), "pinterest social");
  assert.ok(types.includes("whatsappProfile"), "whatsappProfile social");

  const financeFields = read("app/(site)/publicar/autos/shared/components/AutosDealerFinanceFields.tsx");
  assert.ok(financeFields.includes("financeContactImageUrl"), "finance image in form");

  const dealerStack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(dealerStack.includes("hasDealerFinanceContact"), "finance visibility uses helper");

  const textHelper = read("app/lib/clasificados/autos/autosPublishFormText.ts");
  assert.ok(textHelper.includes("autosDraftTextValue"), "draft text helper");
  assert.ok(textHelper.includes("3.5 V6") || textHelper.includes("spacebar"), "spacebar documented");

  const engine = read("app/(site)/publicar/autos/shared/components/AutosVehicleEngineField.tsx");
  assert.ok(engine.includes("autosDraftTextValue"), "engine uses draft helper");
  assert.ok(!engine.includes("e.target.value.trim()"), "engine no trim on change");

  const address = read("app/(site)/publicar/autos/shared/components/AutosDealerStructuredAddressFields.tsx");
  assert.ok(address.includes("autosDraftTextValue"), "street uses draft helper");

  const sortable = read("app/(site)/publicar/autos/shared/components/AutosSortablePhotoGrid.tsx");
  assert.ok(sortable.includes("@dnd-kit"), "dnd-kit");
  assert.ok(sortable.includes("TouchSensor"), "touch fallback");

  const persist = read("app/lib/clasificados/autos/useAutosDraftPersistEffects.ts");
  assert.ok(persist.includes("pagehide"), "pagehide flush");

  const boostPanel = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx");
  assert.ok(boostPanel.includes("flushDraft"), "flush before boost");
  assert.ok(boostPanel.includes("autosInventoryBoostCheckoutSoonMessage"), "checkout soon");

  const valueCopy = read("app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts");
  assert.ok(valueCopy.includes("Agregar 10 espacios por $129/mes"), "boost CTA ES");
  assert.ok(valueCopy.includes("Add 10 slots for $129/month"), "boost CTA EN");

  const inventoryCopy = INVENTORY_COPY_FILES.map(read).join("\n");
  assert.ok(inventoryCopy.includes("399"), "$399");
  assert.ok(inventoryCopy.includes("129"), "$129");
  assert.ok(inventoryCopy.includes("528"), "$528");

  for (const f of INVENTORY_COPY_FILES) {
    const body = read(f);
    assert.ok(!body.includes("129.99"), `${f} no 129.99`);
    assert.ok(!body.includes("528.99"), `${f} no 528.99`);
  }

  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privado.includes("googleReviewsUrl"), "no reviews in privado");
  assert.ok(!privado.includes("dealerCustomLinks"), "no custom links in privado");
  assert.ok(!privado.includes("financeContactImageUrl"), "no finance image in privado");
  assert.ok(!privado.includes("InventoryBoost"), "no boost in privado");

  const serviciosTouched = changedFiles().filter((p) => p.startsWith("app/(site)/servicios/"));
  assert.equal(serviciosTouched.length, 0, "Servicios must not be modified");

  const forbidden = [
    "app/(site)/clasificados/bienes-raices/",
    "app/(site)/clasificados/en-venta/",
    "app/(site)/tienda/",
    "app/api/stripe/",
  ];
  for (const p of changedFiles()) {
    if (forbidden.some((x) => p.startsWith(x))) {
      throw new Error(`Forbidden path modified: ${p}`);
    }
  }

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-qa-05-full-recovery-final-audit"), "package script");

  console.log("autos:a5-qa-05-full-recovery-final-audit — OK");
}

run();
