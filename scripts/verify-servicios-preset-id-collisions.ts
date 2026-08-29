#!/usr/bin/env -S npx tsx
/**
 * Exhaustive cross-type chip-id collision scan for Servicios business-type presets.
 *
 * Executes the real, live BUSINESS_TYPE_PRESETS module (not a regex approximation of the
 * source text) and checks every chip id in suggestedServices/reasonsToChoose/quickFacts across
 * all 78 business types for cross-preset collisions. `businessTypePresets.ts` namespaces every
 * chip id as `${presetId}::${rawId}` at construction (see `namespaceChips`), which makes a
 * collision structurally impossible as long as (a) every preset's own `id` is unique and (b)
 * every chip actually goes through `namespaceChips`. This script proves both hold for the full
 * catalog, not just the 4 pairs originally found by the forensic audit (carpinteria/
 * carroceria_pintura, electricista/reparacion_electronicos, traduccion_interpretacion/
 * traduccion_documentos, consultoria_negocios/consultoria_variada).
 *
 * CTA chip ids (primaryCtaOptions/secondaryCtaOptions) are intentionally excluded: they are a
 * shared, fixed cross-preset vocabulary that mergeStateForBusinessTypeChange always clears
 * rather than filters by membership, so reuse there is by design, not a defect.
 */
import { BUSINESS_TYPE_PRESETS } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";

let failed = false;

// 1. Every business-type id must itself be unique (canonical id requirement, ⚠️31).
const presetIdOwners = new Map<string, number>();
for (const p of BUSINESS_TYPE_PRESETS) {
  presetIdOwners.set(p.id, (presetIdOwners.get(p.id) ?? 0) + 1);
}
const duplicatePresetIds = [...presetIdOwners.entries()].filter(([, count]) => count > 1);
if (duplicatePresetIds.length > 0) {
  failed = true;
  console.log(`✗ Duplicate business-type ids found: ${duplicatePresetIds.map(([id]) => id).join(", ")}`);
}

// 2. Cross-type chip-id collision scan across the three merge-filtered registries.
const REGISTRIES: Array<"suggestedServices" | "reasonsToChoose" | "quickFacts"> = [
  "suggestedServices",
  "reasonsToChoose",
  "quickFacts",
];

const owners = new Map<string, { presetId: string; registry: string }[]>();
for (const p of BUSINESS_TYPE_PRESETS) {
  for (const registry of REGISTRIES) {
    for (const chip of p[registry]) {
      const list = owners.get(chip.id) ?? [];
      list.push({ presetId: p.id, registry });
      owners.set(chip.id, list);
    }
  }
}

const collisions: string[] = [];
for (const [chipId, ownerList] of owners.entries()) {
  const distinctPresets = new Set(ownerList.map((o) => o.presetId));
  if (distinctPresets.size > 1) {
    collisions.push(`  - "${chipId}" shared by: ${ownerList.map((o) => `${o.presetId}.${o.registry}`).join(", ")}`);
  }
}

const totalChips = [...owners.values()].reduce((n, l) => n + l.length, 0);

console.log("=== Servicios Preset Chip-ID Collision Scan ===\n");
console.log(`Business types scanned: ${BUSINESS_TYPE_PRESETS.length}`);
console.log(`Chip ids scanned (suggestedServices + reasonsToChoose + quickFacts): ${totalChips}`);

if (collisions.length > 0) {
  failed = true;
  console.log(`\n✗ FAIL — ${collisions.length} cross-type chip-id collision(s) found:\n${collisions.join("\n")}`);
} else {
  console.log(`\n✓ PASS — zero cross-type chip-id collisions across all ${BUSINESS_TYPE_PRESETS.length} business types.`);
}

if (failed) process.exitCode = 1;
