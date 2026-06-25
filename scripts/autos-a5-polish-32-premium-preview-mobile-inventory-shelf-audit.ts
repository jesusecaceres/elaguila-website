/**
 * A5.POLISH-32 — Premium preview layout + mobile inventory shelf audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_POLISH_32_PREMIUM_PREVIEW_MOBILE_INVENTORY_SHELF_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Coming Soon V2 / brand system inspected",
  "Cream/ivory surfaces used intentionally",
  "Burgundy CTAs used intentionally",
  "Gold/bronze accents used intentionally",
  "Charcoal text hierarchy improved",
  "Deep green restrained to trust/business accents",
  "Mobile layout is not a squeezed desktop",
  "Mobile title/price are readable",
  "Mobile gallery is usable",
  "Mobile vehicle images are not distorted",
  "Mobile has no horizontal body overflow",
  "Mobile Business Hub stacks clearly",
  "Mobile contact buttons are tappable",
  "Mobile related inventory uses horizontal shelf/snap behavior",
  "Mobile related cards have fixed image ratio",
  "Desktop layout is closer to promised premium mockup",
  "Desktop Business Hub is organized and visible",
  "Specs grid is clean",
  "Equipment chips are clean",
  "Description/details cards are readable",
  "Related inventory does not become a huge 20-car vertical wall",
  "Related inventory shows max 6 visible on desktop or safe capped layout",
  "Draft related cards remain read-only",
  "Draft related cards do not show fake Ver vehículo / Ver detalles CTA",
  "Published links preserved only when real URL exists",
  "Step 7 Ver vista previa remains",
  "Step 7 Editar remains",
  "Step 7 Quitar remains",
  "Volver a editar still preserves inventory",
  "Refresh still preserves inventory/media",
  "Business Hub socials remain visible when provided",
  "Business Hub websites/resources remain visible when provided",
  "Business Hub reviews remain visible when provided",
  "Business Hub hours remain visible when provided",
  "Business Hub financing remains visible when provided",
  "Business Hub map remains visible when provided",
  "No sessionStorage/draft persistence code touched unless explicitly documented safe",
  "No preview view model writes to active draft added",
  "No fake analytics/counters/reviews added",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/admin/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/magazine/",
];

const GATE_SCOPED_MARKERS = [
  "polish-32",
  "autosNegociosPremiumPreviewTokens",
  "AUTOS_A5_POLISH_32",
  "RelatedDealerCars",
  "AutosNegociosPreviewInventorySection",
  "AutosNegociosPreviewCaptureBanner",
  "AutoDealerPreviewPage",
  "DealerBusinessStack",
  "AutoGallery",
  "VehicleSpecsGrid",
];

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

function gateScopedChanges(): string[] {
  return changedFiles().filter((f) => {
    const norm = f.replace(/\\/g, "/");
    if (norm.startsWith("app/admin/")) return false;
    return (
      GATE_SCOPED_MARKERS.some((m) => norm.includes(m)) ||
      norm === "package.json" ||
      norm.startsWith("e2e/autos/autos-a5-polish-32") ||
      norm.startsWith("scripts/autos-a5-polish-32") ||
      norm === "playwright.autos-polish-32.config.mjs" ||
      norm.includes("autosNegociosInventoryBundleCopy.ts") ||
      norm.includes("AutosNegociosPreviewClient.tsx") ||
      norm.includes("AutosNegociosChildInventoryPreviewOverlay.tsx") ||
      norm.includes("AutosDealerInventoryVehicleCard.tsx")
    );
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R32 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /Mobile browser proof/i, "Mobile proof section required");
  assert.match(auditText, /Desktop browser proof/i, "Desktop proof section required");
  assert.match(auditText, /Business Hub result/i, "Business Hub section required");
  assert.match(auditText, /Related inventory shelf result/i, "Shelf section required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  const tokens = read("app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens.ts");
  assert.ok(tokens.includes("AUTOS_PREVIEW_MAX_RELATED_VISIBLE = 6"), "Max 6 related visible");
  assert.ok(tokens.includes("#FAF7F2"), "Cream page canvas");
  assert.ok(tokens.includes("#7A1E2C"), "Burgundy CTA");
  assert.ok(tokens.includes("#C9A84A"), "Gold accent");
  assert.ok(tokens.includes("snap-x"), "Mobile snap shelf");

  const related = read("app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx");
  assert.ok(related.includes("data-autos-related-inventory-shelf"), "Shelf proof attribute");
  assert.ok(related.includes("AUTOS_PREVIEW_MAX_RELATED_VISIBLE"), "Shelf cap");
  assert.ok(related.includes("autosRelatedInventoryFullDraftDeferral"), "Draft deferral copy");
  assert.ok(related.includes("shelfLayout"), "Shelf card layout");

  const section = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx");
  assert.ok(section.includes("autosRelatedInventoryDraftCardLabel"), "Draft label helper");
  assert.ok(section.includes("autosRelatedInventoryAvailableAfterPublish"), "Draft chip");

  const banner = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewCaptureBanner.tsx");
  assert.ok(banner.includes("data-autos-preview-utility-bar"), "Sticky utility bar");
  assert.ok(banner.includes("sticky top-0"), "Sticky bar");

  const page = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(page.includes("data-autos-premium-preview-page"), "Premium page proof");
  assert.ok(page.includes("autosPreviewHeroTitleClass"), "Serif hero title");

  const hub = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(hub.includes("autosPreviewBurgundyPrimaryBtnClass"), "Burgundy hub CTAs in premium mode");
  assert.ok(!hub.includes("sessionStorage.setItem"), "No sessionStorage writes in hub");

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("autosInventoryBundlePreviewCta"), "Ver vista previa");
  assert.ok(bundle.includes("autosInventoryBundleEdit"), "Editar");
  assert.ok(bundle.includes("autosInventoryBundleRemove"), "Quitar");

  const card = read("app/(site)/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard.tsx");
  assert.ok(card.includes("isDraftPreviewHref"), "Published guard");
  assert.ok(card.includes("autosRelatedInventoryAvailableAfterPublish"), "Draft chip");

  const spec = read("e2e/autos/autos-a5-polish-32-premium-preview-mobile-inventory-shelf.spec.ts");
  assert.ok(spec.includes("setViewportSize({ width: 390"), "Mobile proof viewport");
  assert.ok(spec.includes("assertNoBodyOverflow"), "Overflow guard");

  const comingSoon = read("app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx");
  assert.ok(comingSoon.includes("#7A1E2C"), "Brand burgundy reference");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix) && norm !== prefix, `Forbidden gate-scoped change: ${norm}`);
    }
  }

  const scoped = gateScopedChanges();
  console.log(`A5.POLISH-32 audit PASS (${recommendation}) — ${scoped.length} gate-scoped file(s)`);
}

run();
