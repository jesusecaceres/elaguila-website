/**
 * A5.POLISH-33 — Premium layout reference match + Business Hub contact card audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_POLISH_33_PREMIUM_LAYOUT_REFERENCE_MATCH_BUSINESS_HUB_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Attached premium reference image used",
  "Current production screenshot compared",
  "Exact preview route traced",
  "Exact visible components identified before editing",
  "R32 insufficiency/route issue documented",
  "Desktop layout visibly changed",
  "Desktop no longer feels like tiny narrow form preview",
  "Desktop uses main + Business Hub two-column layout",
  "Main hero/title/price hierarchy improved",
  "Gallery visually improved",
  "Business Hub/contact card visibly elevated",
  "Business Hub uses burgundy header or equivalent premium header",
  "Dealer identity block polished",
  "WhatsApp/contact actions polished and tappable",
  "Google review card polished",
  "Yelp review card polished",
  "Website/resources links polished",
  "Social icons consistent size/alignment",
  "Languages chips polished",
  "Financing contact section polished",
  "Hours section readable",
  "Map/location section polished",
  "Specs grid improved",
  "Equipment chips/cards improved",
  "Description/details cards improved",
  "Related inventory shelf controlled on desktop",
  "Related inventory mobile shelf implemented",
  "Draft related cards remain read-only",
  "No fake Ver vehículo / Ver detalles CTA in draft preview",
  "Mobile layout visibly changed",
  "Mobile is not squeezed desktop",
  "Mobile title/price readable",
  "Mobile gallery usable",
  "Mobile contact buttons tappable",
  "Mobile Business Hub readable",
  "Mobile has no horizontal body overflow",
  "Step 7 Ver vista previa remains",
  "Step 7 Editar remains",
  "Step 7 Quitar remains",
  "Volver a editar still works",
  "Refresh still preserves inventory/media",
  "No sessionStorage/draft persistence logic touched",
  "No child save/edit/hydrate logic touched",
  "No publish payload touched",
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
  "polish-33",
  "AUTOS_A5_POLISH_33",
  "autosPreviewBusinessHub",
  "autosPreviewMainGridClass",
  "AutosNegociosPreviewPromiseStrip",
  "autosNegociosPremiumPreviewTokens",
  "DealerBusinessStack",
  "AutoDealerPreviewPage",
  "AutoGallery",
  "VehicleHeroSpecsStrip",
  "VehicleSpecsGrid",
  "VehicleDescription",
  "VehicleHighlights",
  "AutosNegociosPreviewClient",
  "AutosNegociosPreviewCaptureBanner",
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
      norm.startsWith("scripts/autos-a5-polish-33") ||
      norm.includes("RelatedDealerCars.tsx") ||
      norm.includes("AutosNegociosPreviewInventorySection.tsx")
    );
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R33 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /Attached reference image used/i, "Reference image section required");
  assert.match(auditText, /Exact visible route\/component trace/i, "Route trace section required");
  assert.match(auditText, /Desktop browser proof/i, "Desktop proof section required");
  assert.match(auditText, /Mobile browser proof/i, "Mobile proof section required");
  assert.match(auditText, /Business Hub\/contact card result/i, "Business Hub result section required");
  assert.match(auditText, /Contact buttons result/i, "Contact buttons section required");
  assert.match(auditText, /Google\/Yelp review cards result/i, "Reviews section required");
  assert.match(auditText, /Websites\/resources result/i, "Resources section required");
  assert.match(auditText, /Social icons result/i, "Socials section required");
  assert.match(auditText, /Financing contact result/i, "Financing section required");
  assert.match(auditText, /Hours result/i, "Hours section required");
  assert.match(auditText, /Map\/location result/i, "Map section required");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

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
  assert.ok(tokens.includes("autosPreviewMainGridClass"), "Two-column grid token");
  assert.ok(tokens.includes("autosPreviewBusinessHubHeaderClass"), "Burgundy hub header token");
  assert.ok(tokens.includes("autosPreviewWhatsappBtnClass"), "WhatsApp button token");
  assert.ok(tokens.includes("#7A1E2C"), "Burgundy accent");
  assert.ok(tokens.includes("max-w-[1320px]"), "Wider canvas");

  const hub = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(hub.includes("autosPreviewBusinessHubHeaderClass"), "Premium hub header wired");
  assert.ok(hub.includes("autosPreviewWhatsappBtnClass"), "WhatsApp green in premium mode");
  assert.ok(hub.includes("renderPairRow"), "Paired contact buttons");
  assert.ok(!hub.includes("sessionStorage.setItem"), "No sessionStorage writes");

  const page = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(page.includes("autosPreviewMainGridClass"), "Main grid layout");
  assert.ok(page.includes("autosPreviewBusinessHubShellClass"), "Hub shell");
  assert.ok(page.includes("data-autos-premium-preview-page"), "Page proof attr");

  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");
  assert.ok(gallery.includes("lg:flex-row"), "Desktop gallery split");

  const client = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(client.includes("AutosNegociosPreviewPromiseStrip"), "Promise strip wired");
  assert.ok(client.includes("Autos en Leonix"), "Premium page identity");

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("autosInventoryBundlePreviewCta"), "Ver vista previa");
  assert.ok(bundle.includes("autosInventoryBundleEdit"), "Editar");
  assert.ok(bundle.includes("autosInventoryBundleRemove"), "Quitar");

  const card = read("app/(site)/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard.tsx");
  assert.ok(card.includes("autosRelatedInventoryAvailableAfterPublish"), "Draft chip");
  assert.ok(card.includes("isDraftPreviewHref"), "Draft guard");

  const section = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx");
  assert.ok(section.includes("Vista previa / borrador") || section.includes("autosRelatedInventoryDraftCardLabel"), "Draft label");
  assert.ok(section.includes("Disponible después de publicar") || section.includes("autosRelatedInventoryAvailableAfterPublish"), "Draft deferral chip");

  assert.ok(!auditText.match(/4\.8\s*stars|★★★★★|\d+\s+reviews/i), "No fake rating strings in audit");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix) && norm !== prefix, `Forbidden gate-scoped change: ${norm}`);
    }
  }

  const scoped = gateScopedChanges();
  console.log(`A5.POLISH-33 audit PASS (${recommendation}) — ${scoped.length} gate-scoped file(s)`);
}

run();
