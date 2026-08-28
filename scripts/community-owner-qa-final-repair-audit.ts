/**
 * Community family — final owner-QA numbered repair batch (⚠️67–⚠️76) self-test.
 *
 * Verifies, at the source level, the ten numbered tickets from the final owner-QA
 * repair batch. Does not duplicate the existing gate-1/2a/2b/2d/3/4 or
 * final-community-family-certification checks — those still run separately and
 * must also pass. This script only asserts the specific fixes/no-op decisions
 * made for ⚠️67 through ⚠️76.
 *
 * No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/community-owner-qa-final-repair-audit.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf8");
}

let passed = 0;
function check(label: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  [PASS] ${label}`);
}

console.log("Community family final owner-QA repair batch (⚠️67–⚠️76) — source audit\n");

// ---------------------------------------------------------------------------
// ⚠️67 — internal jargon removed from shared final-step copy (ES + EN)
// ---------------------------------------------------------------------------
check("⚠️67 — no internal jargon in communityPublishCopy.ts", () => {
  const src = read("app/(site)/publicar/community/shared/copy/communityPublishCopy.ts");
  const jargonPatterns = [/tabla listings/i, /bucket listing-images/i, /ruta de tu usuario/i, /listings table/i];
  for (const re of jargonPatterns) {
    assert.ok(!re.test(src), `communityPublishCopy.ts must not contain jargon pattern ${re}`);
  }
  assert.match(src, /Publicar crea tu anuncio en Leonix Clasificados/);
  assert.match(src, /Publish creates your listing in Leonix Clasificados/);
});

// ---------------------------------------------------------------------------
// ⚠️68 — Mascotas structured country/state location
// ---------------------------------------------------------------------------
check("⚠️68 — Mascotas structured country/US-state dataset exists and is wired in", () => {
  const dataset = read("app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosLocationOptions.ts");
  assert.match(dataset, /export const MASCOTAS_COUNTRY_OPTIONS/);
  assert.match(dataset, /export const MASCOTAS_US_STATE_OPTIONS/);
  assert.match(dataset, /export const MASCOTAS_LOCATION_OTHER_VALUE/);
  assert.match(dataset, /export function findMascotasLocationOption/);
  assert.match(dataset, /export function isMascotasUsCountry/);
  // 50 states + DC
  const stateMatches = dataset.match(/\{ value: "[^"]+", labelEs: "[^"]+", labelEn: "[^"]+" \}/g) ?? [];
  assert.ok(stateMatches.length >= 60, "expected country + US state option entries to be present");

  const client = read("app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx");
  assert.match(client, /from "\.\.\/shared\/mascotasPerdidosLocationOptions"/);
  assert.match(client, /MASCOTAS_COUNTRY_OPTIONS/);
  assert.match(client, /MASCOTAS_US_STATE_OPTIONS/);
  assert.match(client, /isUsCountry/);
  // Legacy free-text values must still be editable, never silently dropped.
  assert.match(client, /stateIsOther/);
  assert.match(client, /countryIsOther/);
});

// ---------------------------------------------------------------------------
// ⚠️69 — Comunidad "Ver más" checkpoint sells event value (what to bring bullet)
// ---------------------------------------------------------------------------
check("⚠️69 — Comunidad checkpoint includes a what-to-bring bullet (ES + EN)", () => {
  const src = read("app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts");
  assert.match(src, /Qué llevar y qué no llevar/);
  assert.match(src, /What to bring and what not to bring/);
});

// ---------------------------------------------------------------------------
// ⚠️70 — Paid admission price already renders with a $ sign (no schema change)
// ---------------------------------------------------------------------------
check("⚠️70 — paid/donation admission summary already applies $ formatting", () => {
  const summary = read("app/lib/clasificados/comunidad/comunidadCostDisplay.ts");
  assert.match(summary, /eventCost === "pagado" \|\| eventCost === "donacion"/);
  assert.match(summary, /formatAdmissionWithDollar\(note\)/);

  const dollar = read("app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx");
  assert.match(dollar, /if \(\/\^\\d\/\.test\(s\)\) return `\$\$\{s\}`;/);
});

// ---------------------------------------------------------------------------
// ⚠️71 — "Entrada pagada" badge hidden for FREE events, top-right, high contrast
// ---------------------------------------------------------------------------
check("⚠️71 — Comunidad canvas hides the cost badge for free events", () => {
  const src = read("app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx");
  assert.match(src, /\{draft\.eventCost !== "gratis" \? \(/);
  assert.match(src, /absolute right-3 top-3/);
  assert.doesNotMatch(src, /draft\.eventCost === "gratis"\s*\n\s*\?\s*"border-emerald/);
});

// ---------------------------------------------------------------------------
// ⚠️72 — Date/schedule presentation already readable/localized
// ---------------------------------------------------------------------------
check("⚠️72 — date/time formatting already localizes via Intl (no raw values)", () => {
  const primitives = read("app/(site)/publicar/community/shared/preview/communityQuickAdPrimitives.tsx");
  assert.match(primitives, /toLocaleDateString\(lang === "en" \? "en-US" : "es-MX"/);

  const schedule = read("app/(site)/publicar/community/shared/lib/communityWeeklySchedule.ts");
  assert.match(schedule, /toLocaleTimeString\(lang === "en" \? "en-US" : "es-MX"/);
});

// ---------------------------------------------------------------------------
// ⚠️73 — Comunidad flyer fits fully inside its container (no destructive crop)
// ---------------------------------------------------------------------------
check("⚠️73 — Comunidad flyer hero already uses object-contain (no crop)", () => {
  const canvas = read("app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx");
  assert.match(canvas, /className="object-contain object-center"/);
  assert.doesNotMatch(canvas, /object-cover/);
});

// ---------------------------------------------------------------------------
// ⚠️74 — Clases organizer/business logo field now exists and wires into the canvas
// ---------------------------------------------------------------------------
check("⚠️74 — Clases application form now has an organizer logo field", () => {
  const form = read("app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx");
  assert.match(form, /organizerLogoUrl: e\.target\.value/);
  assert.match(form, /handleOrganizerLogoUpload/);
  assert.match(form, /organizerLogoFileRef/);

  const canvas = read("app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx");
  assert.match(canvas, /organizerLogoUrl=\{draft\.organizerLogoUrl\}/);

  const shell = read("app/(site)/publicar/community/shared/preview/communityQuickPremiumShell.tsx");
  // Empty logo must fall back to an initial avatar, never a broken/empty image tag.
  assert.match(shell, /logo \? \(/);
  assert.match(shell, /aria-hidden/);
});

// ---------------------------------------------------------------------------
// ⚠️75 — Busco reference image feels like the flyer (single contain treatment)
// ---------------------------------------------------------------------------
check("⚠️75 — Busco hero always renders with a single, non-cropping treatment", () => {
  const canvas = read("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  assert.doesNotMatch(canvas, /detectLayoutMode/);
  assert.doesNotMatch(canvas, /LayoutMode/);
  assert.doesNotMatch(canvas, /object-cover/);
  assert.match(canvas, /object-contain object-center/);
  // Single-image contract preserved: still one heroSrc, no gallery/array rendering added.
  assert.doesNotMatch(canvas, /heroSrcs|images\.map/);
});

// ---------------------------------------------------------------------------
// ⚠️76 — Busco title chips more legible, still max two, budget/city untouched
// ---------------------------------------------------------------------------
check("⚠️76 — Busco card chips are bumped to text-xs, still exactly two primary chips", () => {
  const card = read("app/(site)/clasificados/busco/BuscoRequestCard.tsx");
  assert.doesNotMatch(card, /px-2\.5 py-0\.5 text-\[11px\]/);
  assert.doesNotMatch(card, /px-2\.5 py-0\.5 text-\[10px\]/);
  assert.match(card, /px-3 py-1 text-xs font-semibold/);
  assert.match(card, /px-3 py-1 text-xs font-bold/);
  const chipSpanMatches = card.match(/inline-flex max-w-full truncate rounded-full/g) ?? [];
  assert.equal(chipSpanMatches.length, 2, "expected exactly two primary chip spans (type + urgency)");
  assert.match(card, /Presupuesto:/);
  assert.match(card, /model\.locationLine/);
});

console.log(`\nAll ${passed} owner-QA repair batch checks passed.`);
