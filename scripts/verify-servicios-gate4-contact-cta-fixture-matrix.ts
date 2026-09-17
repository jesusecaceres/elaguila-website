/**
 * Servicios Final Contact Truth + Email No-Mailto Closeout (2026-09-17) — Gate 4 verifier.
 *
 * SUPERSEDES the previous version of this file (Servicios False-Gates-Only pass), which asserted
 * "SMS presence has zero effect on results-card CTA rendering" — that was true only because the
 * results card had no Message CTA at all at the time. The owner has since supplied the real
 * contact-number data model and required a genuine Message CTA driven by
 * `contact.quoteMessagePhone`. This file replaces those now-false assertions with the current
 * contract: office-first Call, optional Message (SMS), optional WhatsApp (bumped to its own row
 * only when Call+Message+WhatsApp all coexist), optional Directions, email-only fallback last.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate4-contact-cta-fixture-matrix.ts
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

const TRADE_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";

check("SOURCE BINDING: trade card gating expressions match the modeled predicates (no drift)", () => {
  const src = raw(TRADE_CARD);
  assert.ok(src.includes("officeTel && officeDisplay"));
  assert.ok(src.includes("tel && phoneDisplay"));
  assert.ok(src.includes("resolveServiciosProfileDirectWhatsAppHref(profile.contact)"));
  assert.ok(src.includes("const smsHref = buildQuoteSmsHref(profile.contact.quoteMessagePhone, displayLang);"));
  assert.ok(src.includes("const forceWhatsAppBelow = Boolean(primaryCall) && Boolean(smsHref) && Boolean(wa);"));
  assert.ok(src.includes("!primaryCall && !smsHref && !wa && (profile.contact.emailMailtoHref || profile.contact.websiteHref)"));
});
check("SOURCE BINDING: professional card gating expressions match the modeled predicates (no drift)", () => {
  const src = raw(PRO_CARD);
  assert.ok(src.includes("const useOfficeCall = Boolean(officeTel && officeDisplay);"));
  assert.ok(src.includes("const tel = useOfficeCall ? officeTel : profile.contact.phoneTelHref;"));
  assert.ok(src.includes("resolveServiciosProfileDirectWhatsAppHref(profile.contact)"));
  assert.ok(src.includes("const smsHref = buildQuoteSmsHref(profile.contact.quoteMessagePhone, displayLang);"));
  assert.ok(src.includes("!tel && !smsHref && !waHrefNormalized && profile.contact.emailMailtoHref"));
});
check("SOURCE BINDING: both results cards now render a real Message/SMS CTA driven by quoteMessagePhone", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(/\bsmsHref\b/.test(src), `${rel}: must compute smsHref from quoteMessagePhone`);
    assert.ok(!/\bwaHrefNormalized\)\s*;\s*\/\/\s*sms/i.test(src)); // sanity: no accidental WA-as-SMS aliasing
  }
});

/* ── Fixture builder + gating predictors (mirrors the card components' own inline logic). ── */
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

type TradePrediction = { call: boolean; message: boolean; whatsapp: boolean; whatsappRow: "row1" | "row2" | "none"; directions: boolean; emailOrWebsiteFallback: boolean };
function predictTradeCard(w: Wire): TradePrediction {
  const profile = resolveServiciosProfile(w, "es");
  const officeTel = (profile.contact.phoneOfficeTelHref || "").trim();
  const officeDisplay = (profile.contact.phoneOfficeDisplay || "").trim();
  const tel = (profile.contact.phoneTelHref || "").trim();
  const phoneDisplay = (profile.contact.phoneDisplay || "").trim();
  const primaryCall = (officeTel && officeDisplay) || (tel && phoneDisplay);
  const wa = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
  const smsHref = buildQuoteSmsHref(profile.contact.quoteMessagePhone, "es");
  const forceWhatsAppBelow = Boolean(primaryCall) && Boolean(smsHref) && Boolean(wa);
  const addressQuery = (profile.contact.physicalAddressDisplay || "").trim();
  const mapsHref = (profile.contact.mapsSearchHref || "").trim();
  const showDirections = Boolean(mapsHref && (addressQuery || /^https?:\/\//i.test(mapsHref)));
  const emailOrWebsiteFallback = Boolean(!primaryCall && !smsHref && !wa && (profile.contact.emailMailtoHref || profile.contact.websiteHref));
  const whatsappRow: "row1" | "row2" | "none" = !wa ? "none" : forceWhatsAppBelow ? "row2" : "row1";
  return { call: Boolean(primaryCall), message: Boolean(smsHref), whatsapp: Boolean(wa), whatsappRow, directions: showDirections, emailOrWebsiteFallback };
}

type ProPrediction = { call: boolean; message: boolean; whatsapp: boolean; whatsappRow: "row1" | "row2" | "none"; directions: boolean; emailOnly: boolean };
function predictProCard(w: Wire): ProPrediction {
  const profile = resolveServiciosProfile(w, "es");
  const officeTel = profile.contact.phoneOfficeTelHref?.trim();
  const officeDisplay = profile.contact.phoneOfficeDisplay?.trim();
  const useOfficeCall = Boolean(officeTel && officeDisplay);
  const tel = useOfficeCall ? officeTel : profile.contact.phoneTelHref;
  const waHrefNormalized = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
  const smsHref = buildQuoteSmsHref(profile.contact.quoteMessagePhone, "es");
  const forceWhatsAppBelow = Boolean(tel) && Boolean(smsHref) && Boolean(waHrefNormalized);
  const showDirections = Boolean(profile.contact.physicalAddressDisplay?.trim() || profile.contact.mapsSearchHref?.trim());
  const emailOnly = Boolean(!tel && !smsHref && !waHrefNormalized && profile.contact.emailMailtoHref);
  const whatsappRow: "row1" | "row2" | "none" = !waHrefNormalized ? "none" : forceWhatsAppBelow ? "row2" : "row1";
  return { call: Boolean(tel), message: Boolean(smsHref), whatsapp: Boolean(waHrefNormalized), whatsappRow, directions: showDirections, emailOnly };
}

/* ── The 9 scenarios (A-I), re-specified against the real 3-channel (Call/Message/WhatsApp) contract. ── */
const REAL_PHONE = "5551234567";
const REAL_OFFICE_PHONE = "5559876543";
const REAL_WHATSAPP = "5551234567";
const REAL_MESSAGE_NUMBER = "5551119999";
const REAL_EMAIL = "owner@leonixmedia.com";

check("A. office + principal + message + WhatsApp — Call uses office, Message shown, WhatsApp bumped to its own row", () => {
  const w = wire({ phone: REAL_PHONE, phoneOffice: REAL_OFFICE_PHONE, quoteMessagePhone: REAL_MESSAGE_NUMBER, socialLinks: { whatsappUrl: REAL_WHATSAPP } });
  const trade = predictTradeCard(w);
  assert.deepEqual(trade, { call: true, message: true, whatsapp: true, whatsappRow: "row2", directions: false, emailOrWebsiteFallback: false });
  const pro = predictProCard(w);
  assert.deepEqual(pro, { call: true, message: true, whatsapp: true, whatsappRow: "row2", directions: false, emailOnly: false });
});

check("B. principal + message, no office, no WhatsApp — Call uses principal, Message shown, no WhatsApp", () => {
  const w = wire({ phone: REAL_PHONE, quoteMessagePhone: REAL_MESSAGE_NUMBER });
  assert.deepEqual(predictTradeCard(w), { call: true, message: true, whatsapp: false, whatsappRow: "none", directions: false, emailOrWebsiteFallback: false });
});

check("C. office + principal, no message, no WhatsApp — office Call only", () => {
  const w = wire({ phone: REAL_PHONE, phoneOffice: REAL_OFFICE_PHONE });
  const p = predictTradeCard(w);
  assert.equal(p.call, true);
  assert.equal(p.message, false);
  assert.equal(p.whatsapp, false);
});

check("D. office + message + WhatsApp — same 3-destination shape as A", () => {
  const w = wire({ phoneOffice: REAL_OFFICE_PHONE, quoteMessagePhone: REAL_MESSAGE_NUMBER, socialLinks: { whatsappUrl: REAL_WHATSAPP } });
  const p = predictTradeCard(w);
  assert.equal(p.call, true);
  assert.equal(p.message, true);
  assert.equal(p.whatsapp, true);
  assert.equal(p.whatsappRow, "row2");
});

check("E. principal only — Call only", () => {
  const p = predictTradeCard(wire({ phone: REAL_PHONE }));
  assert.deepEqual(p, { call: true, message: false, whatsapp: false, whatsappRow: "none", directions: false, emailOrWebsiteFallback: false });
});

check("F. message only — Message only, valid product state (no call/whatsapp, no dead call slot)", () => {
  const p = predictTradeCard(wire({ quoteMessagePhone: REAL_MESSAGE_NUMBER }));
  assert.deepEqual(p, { call: false, message: true, whatsapp: false, whatsappRow: "none", directions: false, emailOrWebsiteFallback: false });
});

check("G. email only — rich email sheet fallback, no other channel", () => {
  const p = predictTradeCard(wire({ email: REAL_EMAIL }));
  assert.deepEqual(p, { call: false, message: false, whatsapp: false, whatsappRow: "none", directions: false, emailOrWebsiteFallback: true });
  const pro = predictProCard(wire({ email: REAL_EMAIL }));
  assert.equal(pro.emailOnly, true);
});

check("Call + WhatsApp, no Message — two balanced CTAs (WhatsApp stays in the primary row)", () => {
  const p = predictTradeCard(wire({ phone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.equal(p.call, true);
  assert.equal(p.message, false);
  assert.equal(p.whatsapp, true);
  assert.equal(p.whatsappRow, "row1", "WhatsApp must not be forced to its own row when Message is absent");
});

check("Message + WhatsApp, no Call — two balanced CTAs (WhatsApp stays in the primary row)", () => {
  const p = predictTradeCard(wire({ quoteMessagePhone: REAL_MESSAGE_NUMBER, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.equal(p.call, false);
  assert.equal(p.message, true);
  assert.equal(p.whatsapp, true);
  assert.equal(p.whatsappRow, "row1", "WhatsApp must not be forced to its own row when Call is absent");
});

check("I. no available contact channel — zero contact CTAs render on either card (no dead buttons)", () => {
  const trade = predictTradeCard(wire({}));
  assert.deepEqual(trade, { call: false, message: false, whatsapp: false, whatsappRow: "none", directions: false, emailOrWebsiteFallback: false });
  const pro = predictProCard(wire({}));
  assert.equal(pro.call, false);
  assert.equal(pro.message, false);
  assert.equal(pro.whatsapp, false);
  assert.equal(pro.emailOnly, false);
});

check("Message is never driven by the office number or WhatsApp number merely because they exist", () => {
  const p = predictTradeCard(wire({ phone: REAL_PHONE, phoneOffice: REAL_OFFICE_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.equal(p.message, false, "no quoteMessagePhone set — Message must not appear");
});

check("Directions is independently gated on a real resolved address/maps destination, never assumed", () => {
  const withAddress = predictTradeCard(
    wire({ phone: REAL_PHONE, physicalStreet: "123 Main St", physicalCity: "Los Angeles", physicalRegion: "CA", physicalCountry: "US" }),
  );
  assert.equal(withAddress.directions, true);
  const withoutAddress = predictTradeCard(wire({ phone: REAL_PHONE }));
  assert.equal(withoutAddress.directions, false);
});

if (failures.length) {
  console.error(`\nverify-servicios-gate4-contact-cta-fixture-matrix: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate4-contact-cta-fixture-matrix: PASS");
