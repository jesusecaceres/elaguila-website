/**
 * Servicios Final Phone Destination Closeout (2026-09-17) — Gates 2, 8, 9 (results cards).
 *
 * SUPERSEDES the previous version of this file, which modeled office-first-wins fallback and a
 * forced WhatsApp-bumped-below-row rule. The owner has REVERSED the office/principal rule
 * (independent, deduped only on literal-same-number) and REMOVED the WhatsApp row-forcing — the
 * layout is now a plain adaptive 2-column CSS grid over the real available actions in priority
 * order (Llamar, Llamar oficina, Mensaje, WhatsApp, Directions), which naturally reproduces every
 * layout the owner specified with zero special-casing.
 *
 * Covers ALL 12 owner-specified fixtures (A-L).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate4-contact-cta-fixture-matrix.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { resolveServiciosProfileDirectWhatsAppHref } from "../app/(site)/servicios/lib/serviciosWhatsAppHref";
import { buildQuoteSmsHref, normalizeServiciosPhoneForCompare } from "../app/(site)/servicios/lib/serviciosContactActions";
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

const TRADE_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";

check("SOURCE BINDING: both cards use a plain adaptive grid-cols-2, no WhatsApp row-forcing special case", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes('className="grid grid-cols-2 gap-2"'), `${rel}: must use the adaptive 2-column grid`);
    assert.ok(!/forceWhatsAppBelow/.test(src), `${rel}: forceWhatsAppBelow row-forcing must be removed`);
  }
});
check("SOURCE BINDING: email-only fallback now excludes both call destinations, not just one", () => {
  const trade = raw(TRADE_CARD);
  assert.ok(trade.includes("!principalCall && !officeCall && !smsHref && !wa && (profile.contact.emailMailtoHref || profile.contact.websiteHref)"));
  const pro = raw(PRO_CARD);
  assert.ok(pro.includes("!tel && !showOfficeCall && !smsHref && !waHrefNormalized && profile.contact.emailMailtoHref"));
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

type Prediction = { call: boolean; callOffice: boolean; message: boolean; whatsapp: boolean; emailOnly: boolean };
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
  const wa = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
  const emailOnly = Boolean(!call && !callOffice && !smsHref && !wa && profile.contact.emailMailtoHref);
  return { call, callOffice, message: Boolean(smsHref), whatsapp: Boolean(wa), emailOnly };
}

const PRINCIPAL = "5551234567";
const OFFICE = "5559876543";
const MESSAGE_NUMBER = "5551119999";
const WHATSAPP = "5557778888";
const EMAIL = "owner@leonixmedia.com";

check("A. principal + office + message + WhatsApp — four distinct actions", () => {
  const p = predict(wire({ phone: PRINCIPAL, phoneOffice: OFFICE, quoteMessagePhone: MESSAGE_NUMBER, socialLinks: { whatsappUrl: WHATSAPP } }));
  assert.deepEqual(p, { call: true, callOffice: true, message: true, whatsapp: true, emailOnly: false });
});
check("B. principal + office + message, no WhatsApp — three actions", () => {
  const p = predict(wire({ phone: PRINCIPAL, phoneOffice: OFFICE, quoteMessagePhone: MESSAGE_NUMBER }));
  assert.deepEqual(p, { call: true, callOffice: true, message: true, whatsapp: false, emailOnly: false });
});
check("C. principal + message + WhatsApp, no office — three actions", () => {
  const p = predict(wire({ phone: PRINCIPAL, quoteMessagePhone: MESSAGE_NUMBER, socialLinks: { whatsappUrl: WHATSAPP } }));
  assert.deepEqual(p, { call: true, callOffice: false, message: true, whatsapp: true, emailOnly: false });
});
check("D. office + message + WhatsApp, no principal — three actions", () => {
  const p = predict(wire({ phoneOffice: OFFICE, quoteMessagePhone: MESSAGE_NUMBER, socialLinks: { whatsappUrl: WHATSAPP } }));
  assert.deepEqual(p, { call: false, callOffice: true, message: true, whatsapp: true, emailOnly: false });
});
check("E. principal only — Llamar only", () => {
  const p = predict(wire({ phone: PRINCIPAL }));
  assert.deepEqual(p, { call: true, callOffice: false, message: false, whatsapp: false, emailOnly: false });
});
check("F. office only — Llamar oficina only", () => {
  const p = predict(wire({ phoneOffice: OFFICE }));
  assert.deepEqual(p, { call: false, callOffice: true, message: false, whatsapp: false, emailOnly: false });
});
check("G. principal + office only — both Call actions", () => {
  const p = predict(wire({ phone: PRINCIPAL, phoneOffice: OFFICE }));
  assert.deepEqual(p, { call: true, callOffice: true, message: false, whatsapp: false, emailOnly: false });
});
check("H. principal == office same normalized number — one Call action only", () => {
  const p = predict(wire({ phone: PRINCIPAL, phoneOffice: "555 123 4567" }));
  assert.deepEqual(p, { call: true, callOffice: false, message: false, whatsapp: false, emailOnly: false });
});
check("I. message only — Message only", () => {
  const p = predict(wire({ quoteMessagePhone: MESSAGE_NUMBER }));
  assert.deepEqual(p, { call: false, callOffice: false, message: true, whatsapp: false, emailOnly: false });
});
check("J. WhatsApp only — WhatsApp only", () => {
  const p = predict(wire({ socialLinks: { whatsappUrl: WHATSAPP } }));
  assert.deepEqual(p, { call: false, callOffice: false, message: false, whatsapp: true, emailOnly: false });
});
check("K. email-only — Correo rich sheet fallback", () => {
  const p = predict(wire({ email: EMAIL }));
  assert.deepEqual(p, { call: false, callOffice: false, message: false, whatsapp: false, emailOnly: true });
});
check("L. all fields missing — no dead CTA placeholders", () => {
  const p = predict(wire({}));
  assert.deepEqual(p, { call: false, callOffice: false, message: false, whatsapp: false, emailOnly: false });
});

if (failures.length) {
  console.error(`\nverify-servicios-gate4-contact-cta-fixture-matrix: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate4-contact-cta-fixture-matrix: PASS (fixtures A-L)");
