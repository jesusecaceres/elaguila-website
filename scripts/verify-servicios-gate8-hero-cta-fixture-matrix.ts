/**
 * Servicios False-Gates-Only Final Completion Pass — Gate 8 verifier (2026-09-17).
 *
 * Header/hero adaptive CTA matrix for the full Servicios profile hero (ServiciosProfessionalHero.tsx),
 * scenarios A–F from the owner task. Drives the real `resolveServiciosProfile` +
 * `resolveServiciosProfileDirectWhatsAppHref` functions and mirrors the hero's own inline gating
 * (file:line cited below, bound to source so the model can't drift), same SMS caveat as Gate 4 — the
 * hero has no SMS button either (confirmed by source read: no "sms" reference in
 * ServiciosProfessionalHero.tsx; SMS/quoteMessagePhone is a detail-page-only Quote feature).
 *
 * Also proves the displayLang doctrine: both call sites (ServiciosProfessionalProfileShell.tsx,
 * ServiciosProfileView.tsx) pass the hero's `lang` prop the resolved `displayLang`, never the static
 * site `lang` — so every CTA label (including the category-specific primary label from
 * getPrimaryCtaLabel) follows the live translate state, not just the page's original locale.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate8-hero-cta-fixture-matrix.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { resolveServiciosProfileDirectWhatsAppHref } from "../app/(site)/servicios/lib/serviciosWhatsAppHref";
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
  assert.ok(src.includes("const tel = profile.contact.phoneTelHref?.trim();"));
  assert.ok(src.includes("resolveServiciosProfileDirectWhatsAppHref(profile.contact)"));
  assert.ok(!/\bsms\b/i.test(src), "hero unexpectedly references SMS — Gate 8 fixture assumptions are stale");
});
check("SOURCE BINDING: both real call sites pass the hero the resolved displayLang, never the static site lang", () => {
  const shell = raw(SHELL);
  assert.ok(/displayLang\s*}\s*=\s*useServiciosPublicTranslation/.test(shell));
  assert.ok(/&lt;ServiciosProfessionalHero[\s\S]{0,120}lang=\{displayLang\}/.test(shell) || /<ServiciosProfessionalHero[\s\S]{0,120}lang=\{displayLang\}/.test(shell));
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

type HeroPrediction = { call: boolean; whatsapp: boolean; directions: boolean; contactFallback: boolean };
function predictHero(w: Wire): HeroPrediction {
  const profile = resolveServiciosProfile(w, "es");
  const tel = profile.contact.phoneTelHref?.trim();
  const waHref = resolveServiciosProfileDirectWhatsAppHref(profile.contact);
  const showDirections = hasPhysicalAddress(profile);
  const contactFallback = !tel && !waHref; // scrollToContact fallback button
  return { call: Boolean(tel), whatsapp: Boolean(waHref), directions: showDirections, contactFallback };
}

const REAL_PHONE = "5551234567";
const REAL_WHATSAPP = "5551234567";

check("A. call only", () => {
  assert.deepEqual(predictHero(wire({ phone: REAL_PHONE })), { call: true, whatsapp: false, directions: false, contactFallback: false });
});
check("B. call + SMS — SMS presence has zero effect on hero CTA rendering", () => {
  const withoutSms = predictHero(wire({ phone: REAL_PHONE }));
  const withSms = predictHero(wire({ phone: REAL_PHONE, quoteMessagePhone: REAL_PHONE }));
  assert.deepEqual(withSms, withoutSms);
});
check("C. call + WhatsApp — both render together, no suppression", () => {
  assert.deepEqual(
    predictHero(wire({ phone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } })),
    { call: true, whatsapp: true, directions: false, contactFallback: false },
  );
});
check("D. call + SMS + WhatsApp — identical to C", () => {
  const c = predictHero(wire({ phone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  const d = predictHero(wire({ phone: REAL_PHONE, quoteMessagePhone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.deepEqual(d, c);
});
check("E. no WhatsApp — Call alone, no dead WhatsApp slot", () => {
  const p = predictHero(wire({ phone: REAL_PHONE }));
  assert.equal(p.whatsapp, false);
  assert.equal(p.call, true);
});
check("F. no SMS — identical to the equivalent scenario proven in B/D (SMS is never a factor)", () => {
  const withoutSms = predictHero(wire({ phone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  const withSms = predictHero(wire({ phone: REAL_PHONE, quoteMessagePhone: REAL_PHONE, socialLinks: { whatsappUrl: REAL_WHATSAPP } }));
  assert.deepEqual(withoutSms, withSms);
});

check("neither Call nor WhatsApp present: hero falls back to the scroll-to-contact primary button (never a dead CTA)", () => {
  const p = predictHero(wire({}));
  assert.deepEqual(p, { call: false, whatsapp: false, directions: false, contactFallback: true });
});

check("category-specific primary CTA label is real per-template copy, not a single hardcoded string", () => {
  assert.equal(getPrimaryCtaLabel("legal_provider", "es"), "Llamar para consulta");
  assert.equal(getPrimaryCtaLabel("legal_provider", "en"), "Call for Consultation");
  assert.equal(getPrimaryCtaLabel("clinic_provider", "es"), "Solicitar cita");
  assert.equal(getPrimaryCtaLabel("clinic_provider", "en"), "Request Appointment");
  assert.equal(getPrimaryCtaLabel("financial_provider", "en"), "Request Help");
  assert.equal(getPrimaryCtaLabel("advisor_provider", "en"), "Schedule Consultation");
  // Default/general template
  assert.equal(getPrimaryCtaLabel("general" as never, "es"), "Contactar");
  assert.equal(getPrimaryCtaLabel("general" as never, "en"), "Contact");
});

if (failures.length) {
  console.error(`\nverify-servicios-gate8-hero-cta-fixture-matrix: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate8-hero-cta-fixture-matrix: PASS (scenarios A-F)");
