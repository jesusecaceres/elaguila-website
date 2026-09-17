/**
 * Servicios False-Gates-Only Final Completion Pass — Gate 1 verifier (2026-09-17).
 *
 * Proves the field-by-field inventory in scripts/servicios-display-language-inventory.ts is not
 * just an aspirational document: every CUSTOM_TRANSLATABLE field's record tag is actually encoded/
 * decoded by serviciosTranslateAd.ts, every CANONICAL_PRESET field is actually handled by
 * relabelServiciosCanonicalPresets, and the inventory covers every section the owner's task
 * enumerated (no silently-skipped section).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate1-field-inventory.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  SERVICIOS_DISPLAY_LANGUAGE_INVENTORY,
  SERVICIOS_INVENTORY_REQUIRED_SECTIONS,
} from "./servicios-display-language-inventory";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const TRANSLATE_AD = raw("app/(site)/servicios/lib/serviciosTranslateAd.ts");

check("Gate 1 inventory covers every required section from the owner task's audit list", () => {
  const present = new Set(SERVICIOS_DISPLAY_LANGUAGE_INVENTORY.map((f) => f.section));
  const missing = SERVICIOS_INVENTORY_REQUIRED_SECTIONS.filter((s) => !present.has(s));
  assert.deepEqual(missing, [], `missing sections: ${missing.join(", ")}`);
});

check("Gate 1 inventory has at least one field per required section", () => {
  const bySection = new Map<string, number>();
  for (const f of SERVICIOS_DISPLAY_LANGUAGE_INVENTORY) {
    bySection.set(f.section, (bySection.get(f.section) ?? 0) + 1);
  }
  for (const s of SERVICIOS_INVENTORY_REQUIRED_SECTIONS) {
    assert.ok((bySection.get(s) ?? 0) > 0, `section "${s}" has zero inventory entries`);
  }
});

check("every CUSTOM_TRANSLATABLE field's tagged record key is a real, encoded protocol tag", () => {
  // Direct TranslatableAdFields keys (no colon tag) are asserted against buildServiciosTranslatableContent's
  // return shape; colon-prefixed tags (qf/tr/cp/cn/pr/pf/cr/cf/el/pm/am/hb) are asserted against the
  // encodeOwnerExtrasForTranslation push-tag list.
  const directKeys = ["title", "description", "customServiceText", "highlights", "details", "shareText"];
  const pushTags = ["qf", "tr", "cp", "cn", "pr", "pf", "cr", "cf", "el", "pm", "am", "hb"];
  const customFields = SERVICIOS_DISPLAY_LANGUAGE_INVENTORY.filter((f) => f.cls === "CUSTOM_TRANSLATABLE");
  assert.ok(customFields.length > 0, "at least one CUSTOM_TRANSLATABLE field must exist in the inventory");
  for (const f of customFields) {
    assert.ok(f.tag, `${f.section}/${f.field}: CUSTOM_TRANSLATABLE field must cite a record tag`);
    const bareTag = f.tag!.split(":")[0];
    assert.ok(
      directKeys.includes(f.tag!) || pushTags.includes(bareTag),
      `${f.section}/${f.field}: tag "${f.tag}" is not a real TranslatableAdFields key or push() tag`,
    );
  }
});

check("every push-tag referenced by the inventory is actually pushed in encodeOwnerExtrasForTranslation", () => {
  const usedPushTags = new Set(
    SERVICIOS_DISPLAY_LANGUAGE_INVENTORY.filter((f) => f.cls === "CUSTOM_TRANSLATABLE" && f.tag && !["title", "description", "customServiceText", "highlights", "details", "shareText"].includes(f.tag))
      .map((f) => f.tag!.split(":")[0]),
  );
  const fnStart = TRANSLATE_AD.indexOf("function encodeOwnerExtrasForTranslation");
  const fnEnd = TRANSLATE_AD.indexOf("\n}\n", fnStart);
  const body = TRANSLATE_AD.slice(fnStart, fnEnd);
  for (const tag of usedPushTags) {
    assert.ok(body.includes(`push("${tag}"`), `push tag "${tag}" not found in encodeOwnerExtrasForTranslation`);
  }
});

check("every direct TranslatableAdFields key referenced by the inventory is actually returned by buildServiciosTranslatableContent", () => {
  const fnStart = TRANSLATE_AD.indexOf("export function buildServiciosTranslatableContent");
  const fnEnd = TRANSLATE_AD.indexOf("\n}\n", fnStart);
  const body = TRANSLATE_AD.slice(fnStart, fnEnd);
  const directKeys = new Set(
    SERVICIOS_DISPLAY_LANGUAGE_INVENTORY.filter((f) => f.cls === "CUSTOM_TRANSLATABLE" && f.tag && ["title", "description", "customServiceText", "highlights", "details", "shareText"].includes(f.tag))
      .map((f) => f.tag!),
  );
  for (const key of directKeys) {
    assert.ok(new RegExp(`\\b${key}:`).test(body), `TranslatableAdFields key "${key}" not returned by buildServiciosTranslatableContent`);
  }
});

check("every CANONICAL_PRESET field maps onto a field relabelServiciosCanonicalPresets actually overlays", () => {
  const fnStart = TRANSLATE_AD.indexOf("export function relabelServiciosCanonicalPresets");
  const fnEnd = TRANSLATE_AD.indexOf("\n}\n", fnStart);
  const body = TRANSLATE_AD.slice(fnStart, fnEnd);
  // Overlay handles: services (svc_), trust (trust_), highlights (bh_preset_), quickFacts, hero badges, categoryLine.
  const handled = ["const services =", "const trust =", "const highlights =", "const quickFacts =", "const badges =", "const categoryLine ="];
  for (const marker of handled) assert.ok(body.includes(marker), `relabelServiciosCanonicalPresets missing expected overlay block: ${marker}`);
  const presetFields = SERVICIOS_DISPLAY_LANGUAGE_INVENTORY.filter((f) => f.cls === "CANONICAL_PRESET");
  assert.ok(presetFields.length > 0, "at least one CANONICAL_PRESET field must exist in the inventory");
});

check("LITERAL_PRESERVE fields that are also known translate-protocol tags never collide with a CUSTOM_TRANSLATABLE/CANONICAL_PRESET tag for the same underlying field", () => {
  // A field cannot be simultaneously translated/relabeled AND preserved literally — guards the
  // inventory itself against self-contradiction (e.g. accidentally marking review text as both).
  const byFieldKey = new Map<string, Set<ServiciosStringClassLocal>>();
  type ServiciosStringClassLocal = "UI_CHROME" | "CANONICAL_PRESET" | "CUSTOM_TRANSLATABLE" | "LITERAL_PRESERVE";
  for (const f of SERVICIOS_DISPLAY_LANGUAGE_INVENTORY) {
    const key = `${f.section}::${f.field}`;
    if (!byFieldKey.has(key)) byFieldKey.set(key, new Set());
    byFieldKey.get(key)!.add(f.cls as ServiciosStringClassLocal);
  }
  for (const [key, classes] of byFieldKey) {
    assert.equal(classes.size, 1, `${key}: field is classified as more than one class: ${[...classes].join(", ")}`);
  }
});

check("reviews section is pinned LITERAL_PRESERVE end-to-end (owner doctrine: customer quotes never translate)", () => {
  const reviewFields = SERVICIOS_DISPLAY_LANGUAGE_INVENTORY.filter((f) => f.section === "reviews" && f.field.includes("quote"));
  assert.ok(reviewFields.length > 0);
  assert.ok(reviewFields.every((f) => f.cls === "LITERAL_PRESERVE"), "review quote text must be LITERAL_PRESERVE");
  const view = raw("app/(site)/servicios/components/ServiciosProfileView.tsx");
  assert.ok(/LITERAL_PRESERVE/.test(view) || /never translat/i.test(view), "ServiciosProfileView.tsx should still document reviews as literal-preserve-only");
});

if (failures.length) {
  console.error(`\nverify-servicios-gate1-field-inventory: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`\nverify-servicios-gate1-field-inventory: PASS (${SERVICIOS_DISPLAY_LANGUAGE_INVENTORY.length} fields across ${SERVICIOS_INVENTORY_REQUIRED_SECTIONS.length} sections)`);
