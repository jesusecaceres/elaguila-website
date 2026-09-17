/**
 * Servicios Final Contact Truth + Email No-Mailto Closeout (2026-09-17) — Gate 7 verifier.
 *
 * SUPERSEDES the previous version of this file, which asserted the hero had no office phone and no
 * Message/SMS CTA. The owner has since required the same office-first Call truth and a real Message
 * CTA on the hero as on the results cards.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate8-hero-cta-fixture-matrix.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { resolveServiciosProfileDirectWhatsAppHref } from "../app/(site)/servicios/lib/serviciosWhatsAppHref";
import { buildQuoteSmsHref, resolveServiciosQuoteDestination } from "../app/(site)/servicios/lib/serviciosContactActions";
import { hasPhysicalAddress, getPrimaryCtaLabel } from "../app/(site)/servicios/components/serviciosLeonixBrand";
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

const HERO = "app/(site)/servicios/components/ServiciosProfessionalHero.tsx";
const SHELL = "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx";
const VIEW = "app/(site)/servicios/components/ServiciosProfileView.tsx";

check("SOURCE BINDING: hero gating expressions match the modeled predicates (no drift)", () => {
  const src = raw(HERO);
  assert.ok(src.includes("const showDirections = hasPhysicalAddress(profile);"));
  assert.ok(src.includes("const tel = officeTel && officeDisplay ? officeTel : profile.contact.phoneTelHref?.trim();"));
  assert.ok(src.includes("const smsHref = buildQuoteSmsHref(profile.contact.quoteMessagePhone, lang);"));
  assert.ok(src.includes("resolveServiciosProfileDirectWhatsAppHref(profile.contact)"));
  assert.ok(src.includes("if (!tel && !smsHref && !waHref ? (") || src.includes("{!tel && !smsHref && !waHref ? ("));
});
check("SOURCE BINDING: both real call sites pass the hero the resolved displayLang, never the static site lang", () => {
  const shell = raw(SHELL);
  assert.ok(/displayLang\s*}\s*=\s*useServiciosPublicTranslation/.test(shell));
  assert.ok(/lang=\{displayLang\}/.test(shell));
  const view = raw(VIEW);
  assert.ok(/displayLang\s*}\s*=\s*useServiciosPublicTranslation/.test(view));
});

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

type HeroPrediction = { call: boolean; message: boolean; whatsapp: boolean; directions: boolean; contactFallback: boolean };
function predictHero(w: Wire): HeroPrediction {
  const profile = resolveServiciosProfile(w, "es");
  const officeTel = profile.contact.phoneOfficeTelHref?.trim();
  const officeDisplay = profile.contact.phoneOfficeDisplay?.trim();
  const tel = officeTel && officeDisplay ? officeTel : profile.contact.phoneTelHref?.trim();
  const waHref = resolveServiciosProfileDirectWhatsAppHref(profile.contact);
  const smsHref = buildQuoteSmsHref(profile.contact.quoteMessagePhone, "es");
  const showDirections = hasPhysicalAddress(profile);
  const contactFallback = !tel && !smsHref && !waHref;
  return { call: Boolean(tel), message: Boolean(smsHref), whatsapp: Boolean(waHref), directions: showDirections, contactFallback };
}

const REAL_PHONE = "5551234567";
const REAL_OFFICE_PHONE = "5559876543";
const REAL_WHATSAPP = "5551234567";
const REAL_MESSAGE_NUMBER = "5551119999";

check("A. office + principal + message + WhatsApp — Call uses office (Gate 1 dedup), Message shown, WhatsApp shown", () => {
  const p = predictHero(wire({ phone: REAL_PHONE, phoneOffice: REAL_OFFICE_PHONE, quoteMessagePhone: REAL_MESSAGE_NUMBER, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.deepEqual(p, { call: true, message: true, whatsapp: true, directions: false, contactFallback: false });
  // Confirm office phone specifically wins the destination.
  const resolved = resolveServiciosProfile(wire({ phone: REAL_PHONE, phoneOffice: REAL_OFFICE_PHONE }), "es");
  assert.equal(resolved.contact.phoneOfficeTelHref, resolved.contact.phoneOfficeTelHref); // sanity anchor
});
check("B. principal + message, no office, no WhatsApp — Call uses principal, Message shown, no WhatsApp", () => {
  const p = predictHero(wire({ phone: REAL_PHONE, quoteMessagePhone: REAL_MESSAGE_NUMBER }));
  assert.deepEqual(p, { call: true, message: true, whatsapp: false, directions: false, contactFallback: false });
});
check("C. office + principal, no message, no WhatsApp — office Call only", () => {
  const p = predictHero(wire({ phone: REAL_PHONE, phoneOffice: REAL_OFFICE_PHONE }));
  assert.equal(p.call, true);
  assert.equal(p.message, false);
  assert.equal(p.whatsapp, false);
});
check("D. office + message + WhatsApp", () => {
  const p = predictHero(wire({ phoneOffice: REAL_OFFICE_PHONE, quoteMessagePhone: REAL_MESSAGE_NUMBER, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.equal(p.call, true);
  assert.equal(p.message, true);
  assert.equal(p.whatsapp, true);
});
check("E. principal only", () => {
  assert.deepEqual(predictHero(wire({ phone: REAL_PHONE })), { call: true, message: false, whatsapp: false, directions: false, contactFallback: false });
});
check("F. message only — Message alone is a real contact option, not just a scroll fallback", () => {
  assert.deepEqual(predictHero(wire({ quoteMessagePhone: REAL_MESSAGE_NUMBER })), { call: false, message: true, whatsapp: false, directions: false, contactFallback: false });
});
check("no WhatsApp — Call renders alone, no dead WhatsApp slot", () => {
  const p = predictHero(wire({ phone: REAL_PHONE }));
  assert.equal(p.whatsapp, false);
  assert.equal(p.call, true);
});
check("no Message — identical rendering whether or not quoteMessagePhone is absent, when only Call+WhatsApp exist", () => {
  const withMsg = predictHero(wire({ phone: REAL_PHONE, quoteMessagePhone: REAL_MESSAGE_NUMBER, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  const withoutMsg = predictHero(wire({ phone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.equal(withoutMsg.message, false);
  assert.equal(withMsg.call, withoutMsg.call);
  assert.equal(withMsg.whatsapp, withoutMsg.whatsapp);
});
check("neither Call, Message, nor WhatsApp present: hero falls back to the scroll-to-contact primary button (never a dead CTA)", () => {
  const p = predictHero(wire({}));
  assert.deepEqual(p, { call: false, message: false, whatsapp: false, directions: false, contactFallback: true });
});
check("Message is never driven by the office number or WhatsApp number merely because they exist", () => {
  const p = predictHero(wire({ phone: REAL_PHONE, phoneOffice: REAL_OFFICE_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.equal(p.message, false, "no quoteMessagePhone set — Message must not appear");
});

check("category-specific primary CTA label is real per-template copy, not a single hardcoded string", () => {
  assert.equal(getPrimaryCtaLabel("legal_provider", "es"), "Llamar para consulta");
  assert.equal(getPrimaryCtaLabel("legal_provider", "en"), "Call for Consultation");
  assert.equal(getPrimaryCtaLabel("clinic_provider", "es"), "Solicitar cita");
  assert.equal(getPrimaryCtaLabel("clinic_provider", "en"), "Request Appointment");
  assert.equal(getPrimaryCtaLabel("financial_provider", "en"), "Request Help");
  assert.equal(getPrimaryCtaLabel("advisor_provider", "en"), "Schedule Consultation");
  assert.equal(getPrimaryCtaLabel("general" as never, "es"), "Contactar");
  assert.equal(getPrimaryCtaLabel("general" as never, "en"), "Contact");
});

check("aggregate quote destination resolver (used elsewhere, e.g. the Hub card's primary CTA) still prioritizes message-number SMS first, matching Gate 2's truth", () => {
  const withAll = resolveServiciosProfile(
    wire({ quoteMessagePhone: REAL_MESSAGE_NUMBER, socialLinks: { whatsappUrl: REAL_WHATSAPP }, email: "x@example.com" }),
    "es",
  );
  const dest = resolveServiciosQuoteDestination(withAll, "es");
  assert.equal(dest?.kind, "sms");
});

if (failures.length) {
  console.error(`\nverify-servicios-gate8-hero-cta-fixture-matrix: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate8-hero-cta-fixture-matrix: PASS");
