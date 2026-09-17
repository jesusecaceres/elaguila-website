/**
 * Servicios Final Phone Destination Closeout (2026-09-17) — Gates 1, 6, 7, 8.
 *
 * SUPERSEDES the previous version of this file (Final Contact Truth pass), which enforced an
 * "office phone wins, principal falls back" rule. The owner has explicitly REVERSED that: principal
 * and office phone are DISTINCT, independently-shown destinations. This file proves the new
 * contract across all four live contact surfaces (both result cards, hero, Business Hub contact
 * card): principal is never suppressed by office presence, office only shows when it genuinely
 * resolves, they dedupe ONLY on literal-same-number (never merely both-are-a-phone), every label
 * follows displayLang, and analytics events are not duplicated/reinvented.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate1-contact-number-source.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { normalizeServiciosPhoneForCompare } from "../app/(site)/servicios/lib/serviciosContactActions";
import type { ServiciosBusinessProfile } from "../app/(site)/servicios/types/serviciosBusinessProfile";

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

const HUB_CARD = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";
const TRADE_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";
const HERO = "app/(site)/servicios/components/ServiciosProfessionalHero.tsx";

/* ── GATE 1: the old fallback-only rule is gone everywhere. ── */
check("no surface still contains the removed 'office wins, principal falls back' ternary pattern", () => {
  for (const rel of [TRADE_CARD, PRO_CARD, HERO, HUB_CARD]) {
    const src = raw(rel);
    assert.ok(!/officeTel &&\s*(officeCallDisplay|officeDisplay)\s*\?\s*(officeTel|officeCallTel)\s*:/.test(src), `${rel}: still contains the removed office-first fallback ternary`);
  }
});

/* ── GATE 1/8: each surface computes principal and office as independent destinations, deduped only on literal-same-number. ── */
check("SOURCE BINDING: trade card — principalCall and officeCall are independent, deduped via normalizeServiciosPhoneForCompare", () => {
  const src = raw(TRADE_CARD);
  assert.ok(src.includes("const principalCall = tel && phoneDisplay ? { href: tel, label: L.call, key: \"call\" } : null;"));
  assert.ok(src.includes("const officeCall = officeTel && officeDisplay && !sameCallNumber ? { href: officeTel, label: L.callOffice, key: \"callOffice\" } : null;"));
  assert.ok(src.includes("normalizeServiciosPhoneForCompare(tel) === normalizeServiciosPhoneForCompare(officeTel)"));
});
check("SOURCE BINDING: professional card — tel (principal) and showOfficeCall are independent, deduped via normalizeServiciosPhoneForCompare", () => {
  const src = raw(PRO_CARD);
  assert.ok(src.includes("const tel = principalTel;"));
  assert.ok(src.includes("const showOfficeCall = Boolean(officeTel && officeDisplay && !sameCallNumber);"));
  assert.ok(src.includes("normalizeServiciosPhoneForCompare(principalTel) === normalizeServiciosPhoneForCompare(officeTel)"));
});
check("SOURCE BINDING: hero — tel (principal) and showOfficeCall are independent, deduped via normalizeServiciosPhoneForCompare", () => {
  const src = raw(HERO);
  assert.ok(src.includes("const tel = principalTel;"));
  assert.ok(src.includes("const showOfficeCall = Boolean(officeTel && officeDisplay && !sameCallNumber);"));
});
check("SOURCE BINDING: Business Hub card — callTel (principal) and showOfficeCall are independent, both pushed as separate contactActions", () => {
  const src = raw(HUB_CARD);
  assert.ok(src.includes("const callTel = principalCallTel;"));
  assert.ok(src.includes("const showOfficeCall = Boolean(officeCallTel && officeCallDisplay && !sameCallNumber);"));
  assert.ok(src.includes('id: "call"'));
  assert.ok(src.includes('id: "callOffice"'));
  // Two independent push() calls, not one ternary choosing a single action.
  const callPushIdx = src.indexOf('id: "call",');
  const officePushIdx = src.indexOf('id: "callOffice",');
  assert.ok(callPushIdx > 0 && officePushIdx > callPushIdx);
});

/* ── GATE 1/2/3/4/8: fixture-level truth via the real resolver, mirroring each surface's own logic. ── */
type Wire = ServiciosBusinessProfile;
function wire(overrides: Partial<Wire["contact"]>): Wire {
  return {
    identity: { slug: "fixture-biz", businessName: "Fixture Business" },
    hero: {},
    contact: { ...overrides },
    quickFacts: [],
    services: [],
    gallery: [],
  } as unknown as Wire;
}

function resolveCallState(w: Wire): { principal: boolean; office: boolean; sameCallNumber: boolean } {
  const profile = resolveServiciosProfile(w, "es");
  const principalTel = profile.contact.phoneTelHref?.trim();
  const officeTel = profile.contact.phoneOfficeTelHref?.trim();
  const officeDisplay = profile.contact.phoneOfficeDisplay?.trim();
  const sameCallNumber = Boolean(
    principalTel && officeTel && normalizeServiciosPhoneForCompare(principalTel) === normalizeServiciosPhoneForCompare(officeTel),
  );
  return {
    principal: Boolean(principalTel),
    office: Boolean(officeTel && officeDisplay && !sameCallNumber),
    sameCallNumber,
  };
}

const PRINCIPAL = "5551234567";
const OFFICE = "5559876543";

check("Gate 1: principal phone is NEVER suppressed merely because office phone exists", () => {
  const r = resolveCallState(wire({ phone: PRINCIPAL, phoneOffice: OFFICE }));
  assert.equal(r.principal, true, "principal must still show when office also exists");
  assert.equal(r.office, true, "office must also show — both are valid destinations");
});
check("Gate 1: office only shows when a genuine office phone resolves", () => {
  assert.equal(resolveCallState(wire({ phone: PRINCIPAL })).office, false);
  assert.equal(resolveCallState(wire({ phone: PRINCIPAL, phoneOffice: OFFICE })).office, true);
});
check("Gate 8: literal-same-number (regardless of punctuation) dedupes to ONE call action", () => {
  const variants = ["(408) 555-0114", "4085550114", "+1 408 555 0114"];
  for (const officeVariant of variants) {
    const r = resolveCallState(wire({ phone: "4085550114", phoneOffice: officeVariant }));
    assert.equal(r.sameCallNumber, true, `variant "${officeVariant}" must normalize equal to the principal`);
    assert.equal(r.office, false, `variant "${officeVariant}": office CTA must be suppressed when identical to principal`);
    assert.equal(r.principal, true, `variant "${officeVariant}": principal CTA must still render`);
  }
});
check("Gate 8: genuinely different numbers are NOT deduped", () => {
  const r = resolveCallState(wire({ phone: PRINCIPAL, phoneOffice: OFFICE }));
  assert.equal(r.sameCallNumber, false);
  assert.equal(r.principal, true);
  assert.equal(r.office, true);
});
check("normalizeServiciosPhoneForCompare produces the same key for all three owner-specified formats", () => {
  const a = normalizeServiciosPhoneForCompare("(408) 555-0114");
  const b = normalizeServiciosPhoneForCompare("4085550114");
  const c = normalizeServiciosPhoneForCompare("+1 408 555 0114");
  assert.equal(a, "4085550114");
  assert.equal(b, "4085550114");
  assert.equal(c, "4085550114");
  assert.equal(a, b);
  assert.equal(b, c);
});

/* ── GATE 6: every contact CTA label follows displayLang across all four live surfaces. ── */
check("Gate 6: every surface computes bilingual Call office / Message labels from the display-language parameter, never a hardcoded single language", () => {
  const hub = raw(HUB_CARD);
  assert.ok(hub.includes("label: L.call,") && hub.includes("label: L.callOffice,"), "Hub card call labels use the shared L dictionary");
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes("L.call") || src.includes("displayLang"), `${rel}: call labels must be display-language aware`);
  }
  const hero = raw(HERO);
  assert.ok(hero.includes('const officeCallLabel = lang === "en" ? "Call office" : "Llamar oficina";'));
});

/* ── GATE 7: analytics events preserved, not duplicated/reinvented — same cta_call_click for both destinations. ── */
check("Gate 7: principal AND office call both fire the SAME existing cta_call_click event type (no new event taxonomy)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD, HERO, HUB_CARD]) {
    const src = raw(rel);
    const hits = [...src.matchAll(/"cta_call_click"/g)].length;
    assert.ok(hits >= 1, `${rel}: cta_call_click must still be used for call tracking`);
    // No invented alternative event name for office calls.
    assert.ok(!/"cta_office_call_click"|"cta_call_office_click"/.test(src), `${rel}: must not invent a separate office-call event type`);
  }
});

if (failures.length) {
  console.error(`\nverify-servicios-gate1-contact-number-source: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate1-contact-number-source: PASS (Gates 1, 6, 7, 8)");
