/**
 * Community family — final 177-item owner change ledger (⚠️1–⚠️177) source audit.
 *
 * Verifies SOURCE-PROVABLE requirements only — never encodes visual taste or runtime/native
 * app-handoff behavior as a static check (those stay 🟡/🟠 in
 * docs/community/FINAL_OWNER_LEDGER_AUDIT.md regardless of what this script can prove). Does not
 * duplicate the existing gate-1/2a/2b/2d/3/4/final-community-family-certification/
 * community-owner-qa-final-repair-audit checks, which already cover the bulk of ⚠️1-177 in depth
 * and still pass unmodified as part of this same audit.
 *
 * Run: npx tsx scripts/community-owner-ledger-final-audit.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

let passed = 0;
function check(label: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  [PASS] ${label}`);
}

console.log("Community family final 177-item owner ledger — source audit\n");

// ---------------------------------------------------------------------------
// ⚠️76 — RED found and fixed this audit: stale "paid activation not available /
// publishing blocked" copy contradicted the working Gate 2B Revenue OS checkout.
// ---------------------------------------------------------------------------
check("⚠️76 — paid-class disclosure no longer claims checkout is unavailable/blocked", () => {
  const sharedCopy = read("app/(site)/publicar/community/shared/copy/communityPublishCopy.ts");
  const clasesForm = read("app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx");
  for (const src of [sharedCopy, clasesForm]) {
    assert.doesNotMatch(src, /activaci[oó]n de pago a[uú]n no est[aá] disponible/i);
    assert.doesNotMatch(src, /paid activation isn't available here yet/i);
    assert.doesNotMatch(src, /publicaci[oó]n (queda|est[aá]) bloqueada/i);
    assert.doesNotMatch(src, /publishing (stays|is) blocked for now/i);
  }
  assert.match(sharedCopy, /\$24\.99/);
  assert.match(clasesForm, /\$24\.99/);
});

// ---------------------------------------------------------------------------
// ⚠️100-109 — the fix above must not have touched the real checkout mechanics.
// ---------------------------------------------------------------------------
check("⚠️100-109 — Clases paid publish still routes through canonical Revenue OS checkout", () => {
  const bar = read("app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx");
  assert.match(bar, /startRevenueCategoryCheckout/);
  assert.match(bar, /CLASES_CATEGORY_CHECKOUT/);
  assert.match(bar, /activationMode:\s*"pending_payment"/);
});

// ---------------------------------------------------------------------------
// ⚠️12/95/154 — no preferred-contact-method selector anywhere in the family.
// ---------------------------------------------------------------------------
check("⚠️12/95/154 — no preferred-contact selector in Clases or Busco forms", () => {
  const clasesForm = read("app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx");
  const buscoForm = read("app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx");
  for (const src of [clasesForm, buscoForm]) {
    assert.doesNotMatch(src, /preferredContact/i);
    assert.doesNotMatch(src, /m[eé]todo preferido/i);
    assert.doesNotMatch(src, /acci[oó]n principal preferida/i);
  }
});

// ---------------------------------------------------------------------------
// ⚠️66/68 — multi-class-type selection with Pilates in the taxonomy.
// ---------------------------------------------------------------------------
check("⚠️66/68 — Clases supports multiple class types including Pilates", () => {
  const clasesForm = read("app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx");
  assert.match(clasesForm, /MAX_CLASES_CATEGORIES/);
  assert.match(clasesForm, /state\.categories\.length/);
  const taxonomy = read("app/(site)/publicar/community/shared/taxonomy/communityTaxonomy.ts");
  assert.match(taxonomy, /value:\s*"pilates"/);
});

// ---------------------------------------------------------------------------
// ⚠️90 — Clases resource links are grouped, not a flat wall of buttons.
// ---------------------------------------------------------------------------
check("⚠️90 — Clases resource links carry a group label", () => {
  const model = read("app/(site)/publicar/clases/lib/buildClasesContactCanvasModel.ts");
  assert.match(model, /groupLabel/);
});

// ---------------------------------------------------------------------------
// ⚠️41 — Comunidad event taxonomy is broad with a truthful Otro fallback.
// ---------------------------------------------------------------------------
check("⚠️41 — Comunidad event taxonomy has real categories plus Otro", () => {
  const taxonomy = read("app/(site)/publicar/community/shared/taxonomy/communityTaxonomy.ts");
  assert.match(taxonomy, /COMUNIDAD_CATEGORY_OPTIONS/);
  assert.match(taxonomy, /value:\s*"otro"/);
  const start = taxonomy.indexOf("COMUNIDAD_CATEGORY_OPTIONS");
  const end = taxonomy.indexOf("] as const", start);
  const block = taxonomy.slice(start, end);
  const optionCount = (block.match(/\{ value: "[^"]+"/g) ?? []).length;
  assert.ok(optionCount >= 9, `expected at least 9 real Comunidad event types plus Otro, found ${optionCount}`);
});

// ---------------------------------------------------------------------------
// ⚠️33/57 — no duplicate country/state fragments in the shared location line.
// ---------------------------------------------------------------------------
check("⚠️33/57 — cityStateZipLine appends country exactly once", () => {
  const primitives = read("app/(site)/publicar/community/shared/preview/communityQuickAdPrimitives.tsx");
  const countryPushes = (primitives.match(/locationParts\.push\(co\)/g) ?? []).length;
  assert.equal(countryPushes, 1, "country must be pushed into the location line exactly once");
});

// ---------------------------------------------------------------------------
// ⚠️129/130 — Mascotas has genuinely separate Phone/SMS/WhatsApp/Email fields.
// ---------------------------------------------------------------------------
check("⚠️129/130 — Mascotas has distinct phone, SMS, WhatsApp, and email fields", () => {
  const form = read("app/(site)/publicar/mascotas-y-perdidos/quick/MascotasPerdidosQuickFormClient.tsx");
  assert.match(form, /state\.phone\b/);
  assert.match(form, /state\.smsPhone\b/);
  assert.match(form, /state\.whatsapp\b/);
  assert.match(form, /state\.email\b/);
});

// ---------------------------------------------------------------------------
// ⚠️138/139 — Mascotas reward is $-prefixed and hidden when not supplied.
// ---------------------------------------------------------------------------
check("⚠️138/139 — Mascotas reward line is $-formatted and conditional", () => {
  const canvas = read("app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx");
  assert.match(canvas, /draft\.offersReward && draft\.rewardAmount\.trim\(\)/);
  assert.match(canvas, /\$\{draft\.rewardAmount\.trim\(\)\}/);
});

// ---------------------------------------------------------------------------
// ⚠️148/150/152/153 — Busco has a real "trabajo" taxonomy value and a
// structured budget model (amount/Gratis/Intercambio), not free-text.
// ---------------------------------------------------------------------------
check("⚠️148/150 — Busco taxonomy includes trabajo/side-work", () => {
  const taxonomy = read("app/(site)/publicar/busco/shared/buscoTaxonomy.ts");
  assert.match(taxonomy, /value:\s*"trabajo"/);
});
check("⚠️152/153 — Busco budget is a structured mode, not free text", () => {
  const types = read("app/(site)/publicar/busco/shared/buscoQuickTypes.ts");
  assert.match(types, /BuscoBudgetMode/);
  assert.match(types, /"gratis"/);
  assert.match(types, /"intercambio"/);
});

// ---------------------------------------------------------------------------
// ⚠️19/35/156 — true, correctly-colored brand icons for social links.
// ---------------------------------------------------------------------------
check("⚠️19/35/156 — Community contact canvas uses true social brand colors", () => {
  const canvas = read("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  assert.match(canvas, /brandColor:\s*"#1877F2"/); // Facebook
  assert.match(canvas, /brandColor:\s*"#E4405F"/); // Instagram
  assert.match(canvas, /brandColor:\s*"#FF0000"/); // YouTube
});

console.log(`\nAll ${passed} ledger-audit checks passed.`);
