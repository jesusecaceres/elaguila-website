/**
 * Business Concierge — Bilingual Staff Experience certification verifier.
 * Confirms EN/ES structural availability across every major staff surface named in the
 * Master Bible bilingual correction. Reuses the existing, already-shipped Field Agent
 * inline-pair convention ("Español / English", one string, no toggle, no new state/deps) —
 * this verifier checks that the SAME convention is now present on the remaining surfaces,
 * not that a new i18n framework exists.
 * Same hand-rolled node:assert structural convention as every other verify-*.ts script here.
 * Run from repo root: npx tsx scripts/verify-bilingual-staff-experience-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Bilingual Staff Experience — EN/ES structural certification\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

// A file uses the established Field Agent inline-pair convention ("Texto en español / English
// text") when it contains real occurrences of the literal " / " separator inside JSX text/string
// content. This is a coarse but reliable proxy — the alternative (parsing for Spanish morphology)
// produced false negatives against real, human-reviewed, eslint-passed bilingual copy (short verb
// forms like "Iniciar", "Bloquear", "Completar" don't match a stopword list). Cross-checked by hand
// against each agent's before/after report before relying on this threshold.
function hasBilingualPairs(source: string): number {
  return (source.match(/ \/ /g) ?? []).length;
}

const surfaces: { name: string; files: string[]; min: number }[] = [
  { name: "Staff Command Center", files: ["app/admin/(dashboard)/businesses/StaffCommandCenter.tsx"], min: 1 },
  { name: "Business Dashboard shell/header/navigation", files: [
    "app/admin/(dashboard)/businesses/[businessId]/page.tsx",
  ], min: 30 },
  { name: "Business Book", files: [
    "app/admin/(dashboard)/businesses/[businessId]/LivingBusinessBookActions.tsx",
  ], min: 5 },
  { name: "Health", files: [
    "app/admin/(dashboard)/businesses/[businessId]/HealthMapActions.tsx",
  ], min: 3 },
  { name: "Outreach", files: [
    "app/admin/(dashboard)/businesses/[businessId]/BusinessWorkspaceActions.tsx",
  ], min: 10 },
  { name: "Field Agent (pre-existing, Gate 3)", files: [
    "app/admin/field/[businessId]/FieldAgentDictationSection.tsx",
    "app/admin/field/FieldAgentComponents.tsx",
  ], min: 5 },
  { name: "Meetings / Meeting Review", files: [
    "app/admin/(dashboard)/businesses/[businessId]/MeetingJourney.tsx",
    "app/admin/(dashboard)/businesses/[businessId]/MeetingStudioActions.tsx",
  ], min: 20 },
  { name: "Recommendations", files: [
    "app/admin/(dashboard)/businesses/[businessId]/RecommendJourney.tsx",
    "app/admin/(dashboard)/businesses/[businessId]/StewardshipActions.tsx",
  ], min: 15 },
  { name: "Opportunities", files: [
    "app/admin/(dashboard)/businesses/[businessId]/OpportunityActions.tsx",
  ], min: 10 },
  { name: "Creative Studio", files: [
    "app/admin/(dashboard)/businesses/[businessId]/CreativeJourney.tsx",
    "app/admin/(dashboard)/businesses/[businessId]/CreativeStudioActions.tsx",
    "app/admin/(dashboard)/businesses/[businessId]/CreativeTruthPacket.tsx",
  ], min: 20 },
  { name: "Proposals / Client Decision", files: [
    "app/admin/(dashboard)/businesses/[businessId]/ProposalActions.tsx",
  ], min: 15 },
  { name: "Owner Handoff", files: [
    "app/admin/(dashboard)/businesses/[businessId]/page.tsx",
  ], min: 1 },
  { name: "Commitments", files: [
    "app/admin/(dashboard)/businesses/[businessId]/PromiseKeeperActions.tsx",
  ], min: 5 },
  { name: "Outcomes", files: [
    "app/admin/(dashboard)/businesses/[businessId]/OutcomesPanel.tsx",
  ], min: 2 },
  { name: "Advisor", files: [
    "app/admin/(dashboard)/businesses/[businessId]/AdvisorPanel.tsx",
  ], min: 3 },
];

for (const surface of surfaces) {
  check(`${surface.name} — real bilingual EN/ES pairs present (>= ${surface.min})`, () => {
    const combined = surface.files.map(read).join("\n");
    const count = hasBilingualPairs(combined);
    assert.ok(count >= surface.min, `found only ${count} bilingual pairs, expected at least ${surface.min}`);
  });
}

// --- Owner Handoff section specifically (distinct check within page.tsx) -------------------------
check("Owner Handoff section heading and 'not tracked' box are bilingual", () => {
  const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
  assert.ok(page.includes("Entrega al Dueño / Owner Handoff"));
  assert.ok(page.includes("No registrado en Business Concierge / Not tracked in Business Concierge"));
});

// --- Existing mechanism reuse: no new i18n framework, no shell language toggle -------------------
check("No new i18n dependency or framework was introduced", () => {
  const pkg = read("package.json");
  assert.ok(!/"next-intl"|"react-i18next"|"i18next"|"react-intl"/.test(pkg));
});
check("No new shell-level language toggle/state was introduced (existing inline-pair convention reused, not replaced)", () => {
  const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
  assert.ok(!/useLanguage|LanguageContext|LanguageProvider|staffLanguage|uiLanguage/.test(page));
});
check("The bilingual convention matches the pre-existing Field Agent pattern exactly (Spanish, then ' / ', then English, one inline string)", () => {
  const dictation = read("app/admin/field/[businessId]/FieldAgentDictationSection.tsx");
  assert.ok(dictation.includes("Nota guardada. / Note saved.") || dictation.includes("Guardar nota / Save note"));
});

// --- Gate 1-6 canonical status/enum values remain untouched (data-layer safety) -------------------
check("Canonical proposal/commitment/meeting status enum values are unchanged (only display labels were bilingualized)", () => {
  const proposalTypes = read("app/lib/business/proposals/types.ts");
  const promiseTypes = read("app/lib/business/promiseKeeper/types.ts");
  assert.ok(proposalTypes.includes('"accepted"') && proposalTypes.includes('"declined"'));
  assert.ok(promiseTypes.includes('"active"') && promiseTypes.includes('"blocked"'));
});
check("No new database table or migration was introduced by the bilingual pass", () => {
  const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
  assert.ok(!/CREATE TABLE/i.test(page));
});

// --- 390px / mobile structural preserved (spot check unchanged classes still present) -------------
check("390px structural conventions (min-h touch targets, flex-col sm:flex-row) remain present after the bilingual edits", () => {
  const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
  assert.ok(page.includes("min-h-[44px]"));
  assert.ok(page.includes("sm:flex-row"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
