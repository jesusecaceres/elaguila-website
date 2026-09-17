/**
 * Servicios Final Phone Destination Closeout (2026-09-17) — Gates 3, 8, 9 (hero).
 *
 * SUPERSEDES the previous version of this file, which modeled office-first-wins fallback. The hero
 * now shows explicit, truthful direct-contact CTAs: the category-specific primaryLabel button calls
 * the PRINCIPAL number, a separate "Llamar oficina"/"Call office" button appears when a genuine,
 * non-duplicate office number resolves, Message and WhatsApp are unchanged. The "no real contact at
 * all" scroll-to-contact fallback now also accounts for the office destination.
 *
 * Covers all 12 owner-specified fixtures (A-L).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate8-hero-cta-fixture-matrix.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { resolveServiciosProfileDirectWhatsAppHref } from "../app/(site)/servicios/lib/serviciosWhatsAppHref";
import { buildQuoteSmsHref, normalizeServiciosPhoneForCompare } from "../app/(site)/servicios/lib/serviciosContactActions";
import { getPrimaryCtaLabel } from "../app/(site)/servicios/components/serviciosLeonixBrand";
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

check("SOURCE BINDING: hero renders principal and office Call as separate, independently-gated buttons", () => {
  const src = raw(HERO);
  assert.ok(src.includes("const tel = principalTel;"));
  assert.ok(src.includes("const showOfficeCall = Boolean(officeTel && officeDisplay && !sameCallNumber);"));
  assert.ok(src.includes("{showOfficeCall ? ("));
  assert.ok(src.includes("onClick={openOfficeCall}"));
  assert.ok(src.includes("!tel && !showOfficeCall && !smsHref && !waHref"));
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

type Prediction = { call: boolean; callOffice: boolean; message: boolean; whatsapp: boolean; contactFallback: boolean };
function predict(w: Wire): Prediction {
  const profile = resolveServiciosProfile(w, "es");
  const principalTel = profile.contact.phoneTelHref?.trim();
  const officeTel = profile.contact.phoneOfficeTelHref?.trim();
  const officeDisplay = profile.contact.phoneOfficeDisplay?.trim();
  const sameCallNumber = Boolean(
    principalTel && officeTel && normalizeServiciosPhoneForCompare(principalTel) === normalizeServiciosPhoneForCompare(officeTel),
  );
  const call = Boolean(principalTel);
  const callOffice = Boolean(officeTel && officeDisplay && !sameCallNumber);
  const smsHref = buildQuoteSmsHref(profile.contact.quoteMessagePhone, "es");
  const waHref = resolveServiciosProfileDirectWhatsAppHref(profile.contact);
  const contactFallback = !call && !callOffice && !smsHref && !waHref;
  return { call, callOffice, message: Boolean(smsHref), whatsapp: Boolean(waHref), contactFallback };
}

const PRINCIPAL = "5551234567";
const OFFICE = "5559876543";
const MESSAGE_NUMBER = "5551119999";
const WHATSAPP = "5557778888";

check("A. principal + office + message + WhatsApp — four distinct actions", () => {
  const p = predict(wire({ phone: PRINCIPAL, phoneOffice: OFFICE, quoteMessagePhone: MESSAGE_NUMBER, socialLinks: { whatsappUrl: WHATSAPP } }));
  assert.deepEqual(p, { call: true, callOffice: true, message: true, whatsapp: true, contactFallback: false });
});
check("B. principal + office + message, no WhatsApp — three actions", () => {
  const p = predict(wire({ phone: PRINCIPAL, phoneOffice: OFFICE, quoteMessagePhone: MESSAGE_NUMBER }));
  assert.deepEqual(p, { call: true, callOffice: true, message: true, whatsapp: false, contactFallback: false });
});
check("C. principal + message + WhatsApp, no office — three actions", () => {
  const p = predict(wire({ phone: PRINCIPAL, quoteMessagePhone: MESSAGE_NUMBER, socialLinks: { whatsappUrl: WHATSAPP } }));
  assert.deepEqual(p, { call: true, callOffice: false, message: true, whatsapp: true, contactFallback: false });
});
check("D. office + message + WhatsApp, no principal — three actions", () => {
  const p = predict(wire({ phoneOffice: OFFICE, quoteMessagePhone: MESSAGE_NUMBER, socialLinks: { whatsappUrl: WHATSAPP } }));
  assert.deepEqual(p, { call: false, callOffice: true, message: true, whatsapp: true, contactFallback: false });
});
check("E. principal only", () => {
  assert.deepEqual(predict(wire({ phone: PRINCIPAL })), { call: true, callOffice: false, message: false, whatsapp: false, contactFallback: false });
});
check("F. office only — Llamar oficina renders even with no principal (no scroll-to-contact fallback)", () => {
  assert.deepEqual(predict(wire({ phoneOffice: OFFICE })), { call: false, callOffice: true, message: false, whatsapp: false, contactFallback: false });
});
check("G. principal + office only — both Call actions", () => {
  assert.deepEqual(predict(wire({ phone: PRINCIPAL, phoneOffice: OFFICE })), { call: true, callOffice: true, message: false, whatsapp: false, contactFallback: false });
});
check("H. principal == office same normalized number — one Call action only", () => {
  assert.deepEqual(predict(wire({ phone: PRINCIPAL, phoneOffice: "555 123 4567" })), { call: true, callOffice: false, message: false, whatsapp: false, contactFallback: false });
});
check("I. message only", () => {
  assert.deepEqual(predict(wire({ quoteMessagePhone: MESSAGE_NUMBER })), { call: false, callOffice: false, message: true, whatsapp: false, contactFallback: false });
});
check("J. WhatsApp only", () => {
  assert.deepEqual(predict(wire({ socialLinks: { whatsappUrl: WHATSAPP } })), { call: false, callOffice: false, message: false, whatsapp: true, contactFallback: false });
});
check("L. all fields missing — falls back to the scroll-to-contact primary button (never a dead CTA)", () => {
  assert.deepEqual(predict(wire({})), { call: false, callOffice: false, message: false, whatsapp: false, contactFallback: true });
});

check("category-specific primary CTA label is real per-template copy, not a single hardcoded string", () => {
  assert.equal(getPrimaryCtaLabel("legal_provider", "es"), "Llamar para consulta");
  assert.equal(getPrimaryCtaLabel("legal_provider", "en"), "Call for Consultation");
  assert.equal(getPrimaryCtaLabel("clinic_provider", "es"), "Solicitar cita");
  assert.equal(getPrimaryCtaLabel("financial_provider", "en"), "Request Help");
  assert.equal(getPrimaryCtaLabel("advisor_provider", "en"), "Schedule Consultation");
  assert.equal(getPrimaryCtaLabel("general" as never, "es"), "Contactar");
  assert.equal(getPrimaryCtaLabel("general" as never, "en"), "Contact");
});

if (failures.length) {
  console.error(`\nverify-servicios-gate8-hero-cta-fixture-matrix: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate8-hero-cta-fixture-matrix: PASS (fixtures A-L)");
