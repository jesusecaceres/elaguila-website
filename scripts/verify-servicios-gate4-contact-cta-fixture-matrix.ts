/**
 * Servicios False-Gates-Only Final Completion Pass — Gate 4 verifier (2026-09-17).
 *
 * Complete contact CTA fixture matrix for the results cards (trade + professional templates),
 * scenarios A–I from the owner task. Drives the REAL production functions —
 * `resolveServiciosProfile` (wire → resolved contact fields) and
 * `resolveServiciosProfileDirectWhatsAppHref` (WhatsApp gating) — against a wire fixture per
 * scenario, then evaluates the exact gating predicates each card component computes inline
 * (cited by file:line below) to predict which CTA buttons render, and cross-checks that prediction
 * against the live component source so the model can never silently drift from reality.
 *
 * IMPORTANT — SMS does not exist as a results-card CTA today (confirmed by source read: neither
 * ServiciosHorizontalResultCard.tsx nor ServiciosProfessionalResultCard.tsx references "sms" at
 * all; SMS/`quoteMessagePhone` is exclusively a detail-page "Quote" feature in
 * ServiciosActionPanel.tsx). Scenarios B/D/E/G, which vary SMS presence, are therefore fixtures that
 * PROVE SMS presence/absence has zero effect on which results-card buttons render — this is the
 * correct, honest behavior per "NO new features" (adding an SMS button would be new UI, not a fix).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate4-contact-cta-fixture-matrix.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { resolveServiciosProfileDirectWhatsAppHref } from "../app/(site)/servicios/lib/serviciosWhatsAppHref";
import { hasPhysicalAddress } from "../app/(site)/servicios/components/serviciosLeonixBrand";
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

/* ── Bind the model to reality: the exact gating expressions must still be present in the components. ── */
check("SOURCE BINDING: trade card gating expressions match the modeled predicates (no drift)", () => {
  const src = raw(TRADE_CARD);
  assert.ok(src.includes("officeTel && officeDisplay"));
  assert.ok(src.includes("tel && phoneDisplay"));
  assert.ok(src.includes("resolveServiciosProfileDirectWhatsAppHref(profile.contact)"));
  assert.ok(src.includes("!primaryCall && !wa && (profile.contact.emailMailtoHref || profile.contact.websiteHref)"));
});
check("SOURCE BINDING: professional card gating expressions match the modeled predicates (no drift)", () => {
  const src = raw(PRO_CARD);
  assert.ok(src.includes("const tel = profile.contact.phoneTelHref;"));
  assert.ok(src.includes("resolveServiciosProfileDirectWhatsAppHref(profile.contact)"));
  assert.ok(src.includes("hasPhysicalAddress(profile)"));
});
check("SOURCE BINDING: neither results card renders an SMS CTA (SMS is a detail-page-only Quote feature)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(!/\bsms\b/i.test(src), `${rel}: unexpectedly references SMS — Gate 4 fixture assumptions are stale`);
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

type TradePrediction = { call: boolean; whatsapp: boolean; directions: boolean; emailOrWebsiteFallback: boolean };
function predictTradeCard(w: Wire): TradePrediction {
  const profile = resolveServiciosProfile(w, "es");
  const officeTel = (profile.contact.phoneOfficeTelHref || "").trim();
  const officeDisplay = (profile.contact.phoneOfficeDisplay || "").trim();
  const tel = (profile.contact.phoneTelHref || "").trim();
  const phoneDisplay = (profile.contact.phoneDisplay || "").trim();
  const primaryCall = (officeTel && officeDisplay) || (tel && phoneDisplay);
  const wa = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
  const addressQuery = (profile.contact.physicalAddressDisplay || "").trim();
  const mapsHref = ((profile.contact.mapsSearchHref || "").trim() || "").trim();
  const showDirections = Boolean(mapsHref && (addressQuery || /^https?:\/\//i.test(mapsHref)));
  const emailOrWebsiteFallback = Boolean(!primaryCall && !wa && (profile.contact.emailMailtoHref || profile.contact.websiteHref));
  return { call: Boolean(primaryCall), whatsapp: Boolean(wa), directions: showDirections, emailOrWebsiteFallback };
}

type ProPrediction = { call: boolean; whatsapp: boolean; directions: boolean };
function predictProCard(w: Wire): ProPrediction {
  const profile = resolveServiciosProfile(w, "es");
  const tel = profile.contact.phoneTelHref;
  const waHrefNormalized = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
  const showDirections = hasPhysicalAddress(profile);
  return { call: Boolean(tel), whatsapp: Boolean(waHrefNormalized), directions: showDirections };
}

/* ── The 9 scenarios. ── */
const REAL_PHONE = "5551234567";
const REAL_WHATSAPP = "5551234567";
const REAL_EMAIL = "owner@leonixmedia.com";

check("A. call only — trade card shows Call, no WhatsApp, no email/website fallback", () => {
  const p = predictTradeCard(wire({ phone: REAL_PHONE }));
  assert.deepEqual(p, { call: true, whatsapp: false, directions: false, emailOrWebsiteFallback: false });
});
check("A. call only — professional card shows Call, no WhatsApp", () => {
  const p = predictProCard(wire({ phone: REAL_PHONE }));
  assert.deepEqual(p, { call: true, whatsapp: false, directions: false });
});

check("B. call + SMS — SMS field presence has ZERO effect on trade-card CTA rendering", () => {
  const withoutSms = predictTradeCard(wire({ phone: REAL_PHONE }));
  const withSms = predictTradeCard(wire({ phone: REAL_PHONE, quoteMessagePhone: REAL_PHONE }));
  assert.deepEqual(withSms, withoutSms, "SMS/quoteMessagePhone must not change results-card CTA set");
});

check("C. call + WhatsApp — both cards show Call and WhatsApp together (no mutual suppression)", () => {
  const trade = predictTradeCard(wire({ phone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.deepEqual(trade, { call: true, whatsapp: true, directions: false, emailOrWebsiteFallback: false });
  const pro = predictProCard(wire({ phone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.deepEqual(pro, { call: true, whatsapp: true, directions: false });
});

check("D. call + SMS + WhatsApp — identical to C; SMS remains inert on both cards", () => {
  const c = predictTradeCard(wire({ phone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  const d = predictTradeCard(wire({ phone: REAL_PHONE, quoteMessagePhone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.deepEqual(d, c);
});

check("E. SMS + WhatsApp, no office/main phone — no Call button, WhatsApp still renders", () => {
  const p = predictTradeCard(wire({ quoteMessagePhone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.deepEqual(p, { call: false, whatsapp: true, directions: false, emailOrWebsiteFallback: false });
  const pro = predictProCard(wire({ quoteMessagePhone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.deepEqual(pro, { call: false, whatsapp: true, directions: false });
});

check("F. no WhatsApp — Call renders alone, no dead WhatsApp slot", () => {
  const p = predictTradeCard(wire({ phone: REAL_PHONE }));
  assert.equal(p.whatsapp, false);
  assert.equal(p.call, true);
});

check("G. no SMS — identical rendering to the equivalent scenario with SMS present (already proven in B/D)", () => {
  const withoutSms = predictProCard(wire({ phone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  const withSms = predictProCard(wire({ phone: REAL_PHONE, quoteMessagePhone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.deepEqual(withoutSms, withSms);
});

check("H. email-only fallback — no phone, no WhatsApp, real email: trade card shows the email fallback", () => {
  const p = predictTradeCard(wire({ email: REAL_EMAIL }));
  assert.deepEqual(p, { call: false, whatsapp: false, directions: false, emailOrWebsiteFallback: true });
});
check("H. email-only fallback — professional card: no Call/WhatsApp/Directions render (email-sheet wiring covered by Gate 12)", () => {
  const p = predictProCard(wire({ email: REAL_EMAIL }));
  assert.deepEqual(p, { call: false, whatsapp: false, directions: false });
});

check("I. no available contact channel — zero contact CTAs render on either card (no dead buttons)", () => {
  const trade = predictTradeCard(wire({}));
  assert.deepEqual(trade, { call: false, whatsapp: false, directions: false, emailOrWebsiteFallback: false });
  const pro = predictProCard(wire({}));
  assert.deepEqual(pro, { call: false, whatsapp: false, directions: false });
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
console.log("\nverify-servicios-gate4-contact-cta-fixture-matrix: PASS (scenarios A-I)");
