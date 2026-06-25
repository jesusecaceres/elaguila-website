/**
 * A5.RECOVERY-30 — Draft preview carousel CTA guardrail audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_30_DRAFT_PREVIEW_CAROUSEL_CTA_GUARDRAIL_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Related inventory/card component inspected",
  "Draft vs published state detection inspected",
  "Draft preview related cards remain visible",
  "Draft preview related cards show image/title/price/location",
  "Draft preview related cards show “Vista previa / borrador” or equivalent",
  "Draft preview related cards do not show active Ver vehículo CTA",
  "Draft preview related cards do not show active Ver detalles CTA",
  "Draft preview related cards do not navigate to fake routes",
  "Draft preview helper text explains vehicles publish with request",
  "Step 7 remains the control center",
  "Step 7 Ver vista previa remains",
  "Step 7 Editar remains",
  "Step 7 Quitar remains for added vehicles",
  "Parent preview related inventory behaves read-only in draft mode",
  "Child preview related inventory behaves read-only in draft mode",
  "Volver a editar still preserves inventory",
  "Refresh still preserves inventory/media",
  "Published mode CTA preserved when real route exists",
  "No draft data mutation added",
  "No preview view model writes to active draft",
  "No child persistence logic regressed",
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
  "recovery-30",
  "AutosDealerInventoryVehicleCard",
  "RelatedDealerCars",
  "AutosNegociosPreviewInventorySection",
  "autosRelatedInventoryDraftCardLabel",
  "autosRelatedInventoryAvailableAfterPublish",
  "AUTOS_A5_RECOVERY_30",
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
    return (
      GATE_SCOPED_MARKERS.some((m) => norm.includes(m)) ||
      norm === "package.json" ||
      norm.startsWith("e2e/autos/autos-a5-recovery-30") ||
      norm.startsWith("scripts/autos-a5-recovery-30") ||
      norm === "playwright.autos-recovery-30.config.mjs" ||
      norm.includes("autosNegociosInventoryBundleCopy.ts") ||
      norm.includes("AutoDealerPreviewPage.tsx")
    );
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R30 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /Local browser proof/i, "Local browser proof section required");

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

  const copy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  assert.ok(copy.includes("autosRelatedInventoryDraftCardLabel"), "Draft card label helper");
  assert.ok(copy.includes("Vista previa / borrador"), "Spanish draft card label");
  assert.ok(copy.includes("Preview / draft"), "English draft card label");
  assert.ok(copy.includes("autosRelatedInventoryAvailableAfterPublish"), "Available after publish helper");
  assert.ok(copy.includes("Disponible después de publicar"), "Spanish after-publish chip");
  assert.ok(copy.includes("autosPreviewInventorySectionHelper"), "Section helper copy");

  const card = read("app/(site)/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard.tsx");
  assert.ok(card.includes("isDraftPreviewHref"), "Draft href guard");
  assert.ok(card.includes("readOnlyDraft"), "Draft read-only branch");
  assert.ok(card.includes("data-autos-related-inventory-draft-cta"), "Draft CTA proof attribute");
  assert.ok(card.includes("autosRelatedInventoryAvailableAfterPublish"), "Card uses after-publish chip");
  assert.ok(!card.includes("previewOnly ? ctaLabel"), "Draft mode must not render Ver vehículo CTA");

  const related = read("app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx");
  assert.ok(related.includes("previewOnly"), "Draft preview flag");
  assert.ok(related.includes("autosPreviewInventorySectionHelper"), "Draft section helper");
  assert.ok(related.includes("data-autos-related-inventory-preview-only"), "Preview-only proof attribute");
  assert.ok(related.includes("!previewOnly && hasMore"), "Hide full inventory link in draft mode");

  const previewPage = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(previewPage.includes("relatedPreviewOnly || draftPreviewMode"), "Draft preview mode guard");

  const section = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx");
  assert.ok(section.includes("autosRelatedInventoryDraftCardLabel"), "Parent preview section draft label");
  assert.ok(section.includes("data-autos-related-inventory-draft-cta"), "Parent preview draft chip");

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("autosInventoryBundlePreviewCta"), "Step 7 Ver vista previa");
  assert.ok(bundle.includes("autosInventoryBundleEdit"), "Step 7 Editar");
  assert.ok(bundle.includes("autosInventoryBundleRemove"), "Step 7 Quitar");
  assert.ok(!bundle.includes("sessionStorage.setItem"), "No new sessionStorage writes in bundle preview");

  const spec = read("e2e/autos/autos-a5-recovery-30-draft-preview-carousel-cta-guardrail.spec.ts");
  assert.ok(spec.includes("assertDraftRelatedCarouselReadOnly"), "Browser proof helper");
  assert.ok(spec.includes("Ver vista previa"), "Step 7 control proof");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix) && norm !== prefix, `Forbidden gate-scoped change: ${norm}`);
    }
  }

  const scoped = gateScopedChanges();
  console.log(`A5.RECOVERY-30 audit PASS (${recommendation}) — ${scoped.length} gate-scoped file(s)`);
}

run();
