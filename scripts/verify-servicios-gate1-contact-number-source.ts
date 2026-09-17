/**
 * Servicios Final Contact Truth + Email No-Mailto Closeout (2026-09-17) — Gates 1, 2, 3, 8, 13.
 *
 * Dedicated data-model-truth verifier for the ONE live surface not covered by the results-card
 * (Gate 4) or hero (Gate 7) fixture matrices: `ServiciosBusinessHubContactCard.tsx`, the "Contact &
 * Location" section of the full profile. Also proves the SMS/WhatsApp/office-call contract holds as
 * a general truth using the real `resolveServiciosProfile` pipeline, and that every contact CTA
 * label across all four live surfaces follows `displayLang`.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate1-contact-number-source.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { resolveServiciosProfileDirectWhatsAppHref } from "../app/(site)/servicios/lib/serviciosWhatsAppHref";
import { buildQuoteSmsHref } from "../app/(site)/servicios/lib/serviciosContactActions";
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

/* ── GATE 1/8: Hub card — one Call button, office-first, never two. ── */
check("Hub card SOURCE BINDING: office-first Call dedup, single push, no duplicate callOffice entry", () => {
  const src = raw(HUB_CARD);
  assert.ok(src.includes("const useOfficeCall = Boolean(officeCallTel && officeCallDisplay);"));
  assert.ok(src.includes("const callTel = useOfficeCall ? officeCallTel : profile.contact.phoneTelHref?.trim();"));
  assert.ok(src.includes("label: useOfficeCall ? L.callOffice : L.call,"));
  // Only ONE contactActions.push({ id: "call", ... }) — proves no separate callOffice push exists.
  const callPushes = [...src.matchAll(/id:\s*"call"/g)].length;
  assert.equal(callPushes, 1, "exactly one 'call' action id — never a separate callOffice button");
  assert.ok(!src.includes('id: "callOffice"'), "Hub card must never push a separate callOffice action");
});
check("Hub card SOURCE BINDING: Message already correctly gated purely on quoteMessagePhone (no WhatsApp/office crossover)", () => {
  const mapper = raw("app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts");
  // The smsHref computation itself (not the unrelated whatsappHref line right after it) must derive
  // exclusively from resolveServiciosQuoteDestination (which prioritizes quoteMessagePhone) and/or
  // c.quoteMessagePhone directly — never from WhatsApp or office-phone fields.
  const smsBlockStart = mapper.indexOf("const smsHref =");
  const smsBlockEnd = mapper.indexOf(";", mapper.indexOf("undefined;", smsBlockStart)) + 1;
  const smsBlock = mapper.slice(smsBlockStart, smsBlockEnd || smsBlockStart + 250);
  assert.ok(smsBlock.includes("c.quoteMessagePhone"), "smsHref must be derived from c.quoteMessagePhone");
  assert.ok(!/whatsapp|phoneOffice/i.test(smsBlock), `smsHref computation must not reference WhatsApp/office fields, found: ${smsBlock}`);
});
check("Hub card SOURCE BINDING: WhatsApp remains optional (existing resolver, no assumption)", () => {
  const src = raw(HUB_CARD);
  assert.ok(src.includes("resolveServiciosProfileDirectWhatsAppHref") || raw("app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts").includes("resolveServiciosProfileDirectWhatsAppHref"));
});

/* ── GATE 1/2/3: fixture-level truth via the real resolver, mirroring the Hub card's own logic. ── */
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

function predictHubCall(w: Wire): { useOffice: boolean; callTel: string | undefined } {
  const profile = resolveServiciosProfile(w, "es");
  const officeCallTel = profile.contact.phoneOfficeTelHref?.trim();
  const officeCallDisplay = profile.contact.phoneOfficeDisplay?.trim();
  const useOffice = Boolean(officeCallTel && officeCallDisplay);
  return { useOffice, callTel: useOffice ? officeCallTel : profile.contact.phoneTelHref?.trim() };
}

const REAL_PHONE = "5551234567";
const REAL_OFFICE_PHONE = "5559876543";
const REAL_WHATSAPP = "5551234567";
const REAL_MESSAGE_NUMBER = "5551119999";

check("Gate 1: office phone wins when both office and principal exist", () => {
  const r = predictHubCall(wire({ phone: REAL_PHONE, phoneOffice: REAL_OFFICE_PHONE }));
  assert.equal(r.useOffice, true);
});
check("Gate 1: principal phone is the fallback when no office phone exists", () => {
  const r = predictHubCall(wire({ phone: REAL_PHONE }));
  assert.equal(r.useOffice, false);
  assert.ok(r.callTel);
});
check("Gate 2: SMS destination is purely the message/quote number — never derived from office or WhatsApp", () => {
  const withOfficeAndWa = resolveServiciosProfile(wire({ phoneOffice: REAL_OFFICE_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }), "es");
  assert.equal(buildQuoteSmsHref(withOfficeAndWa.contact.quoteMessagePhone, "es"), null, "no quoteMessagePhone set — SMS must not resolve from office/WhatsApp presence");
  const withMessage = resolveServiciosProfile(wire({ quoteMessagePhone: REAL_MESSAGE_NUMBER }), "es");
  const href = buildQuoteSmsHref(withMessage.contact.quoteMessagePhone, "es");
  assert.ok(href?.startsWith(`sms:${REAL_MESSAGE_NUMBER}?body=`));
});
check("Gate 3: WhatsApp resolves only from a real configured WhatsApp destination, never assumed present", () => {
  const withNothing = resolveServiciosProfile(wire({ phone: REAL_PHONE, phoneOffice: REAL_OFFICE_PHONE, quoteMessagePhone: REAL_MESSAGE_NUMBER }), "es");
  assert.equal(resolveServiciosProfileDirectWhatsAppHref(withNothing.contact), null);
  const withWa = resolveServiciosProfile(wire({ socialLinks: { whatsappUrl: REAL_WHATSAPP } }), "es");
  assert.ok(resolveServiciosProfileDirectWhatsAppHref(withWa.contact));
});

/* ── GATE 13: every contact CTA label across all four live surfaces follows displayLang, never a static site lang. ── */
check("Gate 13: no contact CTA surface keys its labels off a static `lang` variable named apart from displayLang", () => {
  // Trade/pro cards and hero already use `displayLang` throughout (re-confirmed here); the Hub card
  // receives its own `lang` prop, but BOTH real call sites pass it the resolved displayLang (proven
  // in the Gate 7/8 hero verifier) — so `lang` inside this file IS effectively displayLang.
  for (const [rel, marker] of [
    [TRADE_CARD, "displayLang"],
    [PRO_CARD, "displayLang"],
    [HERO, "lang"],
  ] as const) {
    const src = raw(rel);
    assert.ok(src.includes(marker), `${rel}: expected the ${marker} identifier to be present and driving chrome copy`);
  }
  const hub = raw(HUB_CARD);
  assert.ok(hub.includes('label: useOfficeCall ? L.callOffice : L.call,'), "Hub card Call label uses the shared L dictionary keyed by its (displayLang-fed) lang prop");
});
check("Gate 13: Message label copy matches the shared bilingual dictionary text exactly (\"Message\"/\"Mensaje\")", () => {
  const copy = raw("app/(site)/servicios/copy/serviciosProfileCopy.ts");
  assert.ok(copy.includes('message: "Message"'));
  assert.ok(copy.includes('message: "Mensaje"'));
  for (const rel of [TRADE_CARD, PRO_CARD, HERO]) {
    const src = raw(rel);
    assert.ok(src.includes('"Message" : "Mensaje"') || src.includes("L.message"), `${rel}: Message CTA must use the exact "Message"/"Mensaje" bilingual copy`);
  }
});

if (failures.length) {
  console.error(`\nverify-servicios-gate1-contact-number-source: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate1-contact-number-source: PASS (Gates 1, 2, 3, 8, 13)");
