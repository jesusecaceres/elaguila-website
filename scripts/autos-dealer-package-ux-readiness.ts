/**
 * Autos Dealers — package selection + inventory boost UX readiness verifier.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_DEALER_PACKAGE_UX_READINESS.md");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    const tracked = out ? out.split(/\r?\n/).filter(Boolean) : [];
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    return [...new Set([...tracked, ...untracked])];
  } catch {
    return [];
  }
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "AUTOS_DEALER_PACKAGE_UX_READINESS.md required");

  const draftStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  const draftHook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  const valueModule = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryValueModule.tsx");
  const pricingSummary = read("app/(site)/publicar/autos/negocios/components/AutosNegociosPackagePricingSummary.tsx");
  const reviewSummary = read("app/(site)/publicar/autos/negocios/components/AutosNegociosPackageReviewSummary.tsx");
  const application = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const copy = read("app/lib/clasificados/autos/autosDealerPackageSelectionCopy.ts");
  const inventoryCopy = read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts");
  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  assert.ok(draftStorage.includes("inventoryBoostSelected"), "Draft must persist inventory boost selection");
  assert.ok(draftHook.includes("inventoryBoostSelected"), "Draft hook must expose boost selection state");
  assert.ok(draftHook.includes("setInventoryBoostSelected"), "Draft hook must expose boost selection setter");

  assert.ok(valueModule.includes("data-autos-inventory-boost-toggle"), "Pre-publish boost toggle required");
  assert.ok(
    valueModule.includes("onInventoryBoostSelectedChange(!inventoryBoostSelected)"),
    "Boost button must toggle local state",
  );
  assert.ok(
    !valueModule.match(/prePublishMode[\s\S]{0,800}redirectAutosDealerInventoryPack/),
    "Pre-publish boost must not redirect to Stripe checkout",
  );
  assert.ok(
    !valueModule.match(/prePublishMode[\s\S]{0,1200}AutosNegociosInventoryBoostPanel/),
    "Pre-publish must not open Stripe checkout boost panel",
  );

  assert.ok(copy.includes("Remove inventory boost"), "English remove boost label required");
  assert.ok(copy.includes("Quitar paquete de inventario"), "Spanish remove boost label required");
  assert.ok(copy.includes("autosDealerPackageAddBoostCta"), "Boost add CTA copy helper required");
  assert.ok(copy.includes("INVENTORY_BOOST_MONTHLY_USD"), "Boost price in add CTA helper");

  assert.ok(inventoryCopy.includes("BASE_AUTOS_NEGOCIO_MONTHLY_USD = 399"), "$399 base price constant");
  assert.ok(inventoryCopy.includes("INVENTORY_BOOST_MONTHLY_USD = 129"), "$129 boost price constant");
  assert.ok(inventoryCopy.includes("AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD = 528"), "$528 combined total constant");

  assert.ok(pricingSummary.includes("autosDealerPackageTotalMonthlyPrice"), "Pricing summary shows computed total");
  assert.ok(pricingSummary.includes("autosDealerPackageBoostMonthlyPrice"), "Pricing summary shows boost line");
  assert.ok(pricingSummary.includes("autosDealerPackageBaseMonthlyPrice"), "Pricing summary shows base line");

  assert.ok(reviewSummary.includes("inventoryBoostSelected"), "Final review uses boost selected state");
  assert.ok(reviewSummary.includes("autosDealerPackageReviewPaymentNote"), "Final review payment note");
  assert.ok(copy.includes("Payment is completed after preview"), "Final review payment note EN in copy");
  assert.ok(copy.includes("El pago se completa después de la vista previa"), "Final review payment note ES in copy");

  assert.ok(application.includes("AutosNegociosPackageReviewSummary"), "Application wires package review");
  assert.ok(application.includes("onInventoryBoostSelectedChange"), "Application wires boost toggle");

  assert.ok(!privadoApp.includes("inventoryBoostSelected"), "Privado must not use dealer boost selection");

  const lockedTouches = changedFiles().filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return (
      norm.includes("stripe/webhook") ||
      norm.includes("api/revenue-os/checkout") ||
      norm.includes("api/clasificados/autos/checkout") ||
      norm.includes("api/clasificados/autos/inventory-pack/checkout") ||
      norm.startsWith("app/(site)/publicar/autos/privado/") ||
      norm.startsWith("app/(site)/clasificados/bienes-raices/") ||
      norm.startsWith("app/(site)/clasificados/ofertas") ||
      norm.startsWith("supabase/migrations/")
    );
  });
  assert.equal(lockedTouches.length, 0, `Locked paths modified: ${lockedTouches.join(", ")}`);

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:dealer-package-ux-readiness"), "package.json script required");

  console.log("AUTOS dealer package UX readiness: PASS");
}

run();
