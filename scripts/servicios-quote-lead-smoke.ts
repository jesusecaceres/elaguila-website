/**
 * Phase 10E smoke: quote destination priority + lead message meta + public lead notify gating.
 * Run: npx tsx scripts/servicios-quote-lead-smoke.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ServiciosProfileResolved } from "../app/(site)/servicios/types/serviciosBusinessProfile";
import type { ServiciosBusinessProfile } from "../app/(site)/servicios/types/serviciosBusinessProfile";
import { resolveServiciosQuoteDestination } from "../app/(site)/servicios/lib/serviciosContactActions";
import {
  resolveServiciosWhatsAppContactHref,
  resolveServiciosProfileDirectWhatsAppHref,
  resolveServiciosWhatsAppSocialRowHref,
  resolveServiciosWhatsAppSocialRowHrefForDisplay,
  isServiciosGenericWhatsAppHomepage,
  isServiciosWhatsAppProfileSocialUrl,
  isServiciosWhatsAppSocialDuplicateOfContact,
} from "../app/(site)/servicios/lib/serviciosWhatsAppHref";
import {
  buildServiciosLanguageLabels,
  formatServiciosHeroLanguageDisplay,
  SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_DESKTOP,
  SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_MOBILE,
} from "../app/(site)/servicios/lib/serviciosLanguageChips";
import {
  buildServiciosPublishedProfileHref,
  buildServiciosSellerDashboardHref,
  getServiciosPublishSuccessCopy,
} from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishSuccessCopy";
import { composeServiciosPublicLeadStoredMessage } from "../app/(site)/clasificados/servicios/lib/serviciosLeadStoredMessage";
import {
  parseEmailFromMailtoHref,
  resolveServiciosLeadBusinessNotifyEmail,
  shouldShowServiciosPublicLeadInquiryForm,
} from "../app/(site)/clasificados/servicios/lib/serviciosLeadNotifyRecipientServer";

function minimalProfile(contact: Partial<ServiciosProfileResolved["contact"]>): ServiciosProfileResolved {
  return {
    identity: { slug: "demo-slug", businessName: "Demo" },
    hero: { badges: [] },
    contact: {
      messageEnabled: true,
      isFeatured: false,
      featuredLabel: "",
      ...contact,
    },
    quickFacts: [],
    services: [],
    gallery: [],
    galleryMore: [],
    galleryVideos: [],
    trust: [],
    highlights: [],
    reviews: [],
    serviceAreas: { items: [] },
    paymentMethodIds: [],
    customPaymentMethods: [],
    amenityOptionIds: [],
    customAmenityOptions: [],
    promotions: [],
  };
}

const wa = "https://wa.me/15551234567";
const mail = "mailto:hi@example.com";

// 1) quoteMessagePhone wins over WhatsApp + email
{
  const q = resolveServiciosQuoteDestination(
    minimalProfile({
      quoteMessagePhone: "+1 (555) 123-4567",
      socialLinks: { whatsapp: wa },
      emailMailtoHref: mail,
    }),
    "es",
  );
  assert.equal(q?.kind, "sms");
  assert.ok(q?.href.startsWith("sms:"), q?.href);
}

// 2) WhatsApp only when no valid quote phone
{
  const q = resolveServiciosQuoteDestination(
    minimalProfile({
      socialLinks: { whatsapp: wa },
      emailMailtoHref: mail,
    }),
    "es",
  );
  assert.equal(q?.kind, "whatsapp");
  assert.equal(q?.href, wa);
}

// 2b) WhatsApp contact href: wa.me from number, reject website mistaken for WA
{
  assert.equal(resolveServiciosWhatsAppContactHref({ whatsappRaw: "(555) 123-4567" }), "https://wa.me/15551234567");
  assert.equal(
    resolveServiciosWhatsAppContactHref({ whatsappRaw: "https://wa.me/5215512345678" }),
    "https://wa.me/5215512345678",
  );
  assert.equal(
    resolveServiciosWhatsAppContactHref({
      whatsappRaw: "https://example.com",
      websiteUrl: "https://example.com",
    }),
    null,
  );
  assert.equal(resolveServiciosWhatsAppContactHref({ whatsappRaw: "https://mybiz.com" }), null);
  assert.equal(resolveServiciosWhatsAppContactHref({ whatsappRaw: "https://www.whatsapp.com" }), null);
  assert.equal(
    resolveServiciosWhatsAppContactHref({ whatsappRaw: "https://wa.me/message/ABC123" }),
    null,
  );
}

// 2c) WhatsApp profile/channel field → “Síguenos” social row only
{
  const channel = "https://whatsapp.com/channel/0029VaExample";
  assert.equal(resolveServiciosWhatsAppSocialRowHref(channel), channel);
  assert.equal(
    resolveServiciosWhatsAppSocialRowHref("https://wa.me/message/ABC123"),
    "https://wa.me/message/ABC123",
  );
  assert.equal(
    resolveServiciosWhatsAppSocialRowHref("https://wa.me/5215512345678"),
    "https://wa.me/5215512345678",
  );
  assert.equal(resolveServiciosWhatsAppSocialRowHref("https://www.whatsapp.com"), null);
  assert.equal(resolveServiciosWhatsAppSocialRowHref("https://whatsapp.com"), null);
  assert.ok(isServiciosGenericWhatsAppHomepage("https://www.whatsapp.com"));
  assert.ok(isServiciosWhatsAppProfileSocialUrl("https://wa.me/message/ABC123"));
}

// 2d) Shared profile direct WhatsApp helper — (408) 802-1531 → wa.me/14088021531
{
  const href = resolveServiciosProfileDirectWhatsAppHref({
    socialLinks: { whatsapp: "https://wa.me/14088021531" },
    websiteHref: "https://example.com",
  });
  assert.equal(href, "https://wa.me/14088021531");
  assert.equal(
    resolveServiciosWhatsAppContactHref({ whatsappRaw: "(408) 802-1531" }),
    "https://wa.me/14088021531",
  );
}

// 2e) Language chips — Español, Inglés, Otro + Portuguese/Tagalog
{
  const labels = buildServiciosLanguageLabels(
    {
      languageIds: ["lang_es", "lang_en", "lang_otro"],
      languageOtherLines: "Portuguese\nTagalog",
    },
    "es",
  );
  assert.deepEqual(labels, ["Español", "Inglés", "Portuguese", "Tagalog"]);
  const heroDesktop = formatServiciosHeroLanguageDisplay(
    labels,
    "es",
    SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_DESKTOP,
  );
  assert.deepEqual(heroDesktop.visible, ["Español", "Inglés", "Portuguese", "Tagalog"]);
  assert.equal(heroDesktop.overflowLabel, null);
  const heroMobile = formatServiciosHeroLanguageDisplay(
    labels,
    "es",
    SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_MOBILE,
  );
  assert.deepEqual(heroMobile.visible, ["Español", "Inglés", "Portuguese", "Tagalog"]);
  assert.equal(heroMobile.overflowLabel, null);
  const crowded = formatServiciosHeroLanguageDisplay(
    [...labels, "French", "German", "Italian"],
    "es",
    SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_DESKTOP,
  );
  assert.equal(crowded.visible.length, SERVICIOS_HERO_LANGUAGE_MAX_VISIBLE_DESKTOP);
  assert.ok(crowded.overflowLabel?.includes("idioma"));
}

// 2f2) Publish success copy — Servicios profile language (Gate 20F)
{
  const t = getServiciosPublishSuccessCopy("es", "database");
  assert.match(t.title, /perfil fue publicado/i);
  assert.ok(!/varios|artículo|vendido/i.test(`${t.title} ${t.body} ${t.termsReminder}`));
  assert.equal(buildServiciosPublishedProfileHref("mi-negocio", "es"), "/clasificados/servicios/mi-negocio?lang=es");
  assert.equal(buildServiciosSellerDashboardHref("es"), "/dashboard/servicios?lang=es");
}

// 2f) Social row de-dupe — same wa.me as contact number hidden from “Síguenos”
{
  const contact = "https://wa.me/14088021531";
  assert.ok(isServiciosWhatsAppSocialDuplicateOfContact("https://wa.me/14088021531", contact));
  assert.equal(
    resolveServiciosWhatsAppSocialRowHrefForDisplay("https://wa.me/14088021531", contact),
    null,
  );
  assert.equal(
    resolveServiciosWhatsAppSocialRowHrefForDisplay("https://wa.me/message/TESTVALUE", contact),
    "https://wa.me/message/TESTVALUE",
  );
  assert.equal(
    resolveServiciosWhatsAppSocialRowHrefForDisplay("https://whatsapp.com/channel/TESTVALUE", contact),
    "https://whatsapp.com/channel/TESTVALUE",
  );
  assert.equal(resolveServiciosWhatsAppSocialRowHrefForDisplay("https://wa.me/14088021531", null), "https://wa.me/14088021531");
}

// 3) Email when no phone / WA
{
  const q = resolveServiciosQuoteDestination(
    minimalProfile({
      emailMailtoHref: mail,
    }),
    "es",
  );
  assert.equal(q?.kind, "mailto");
  assert.ok(q?.href.startsWith("mailto:"));
}

// 4) Lead meta prefix
{
  const m = composeServiciosPublicLeadStoredMessage("Hello body.", {
    senderPhone: "+52 55 1234 5678",
    preferredContactMethod: "whatsapp",
  });
  assert.ok(m.includes("preferred_contact_method: whatsapp"));
  assert.ok(m.includes("sender_phone:"));
  assert.ok(m.endsWith("Hello body."));
}

{
  const m = composeServiciosPublicLeadStoredMessage("Only message", {});
  assert.equal(m, "Only message");
}

// 5) mailto parsing for notify recipient helpers
{
  assert.equal(parseEmailFromMailtoHref("mailto:Biz%40Example.com?subject=Hi"), "Biz@Example.com");
  assert.equal(parseEmailFromMailtoHref("not-mailto"), null);
}

async function runAsyncLeadNotifyChecks() {
  const wire: ServiciosBusinessProfile = {
    identity: { slug: "x", businessName: "B" },
    contact: { email: "  owner@listing.test  " },
    hero: {},
  };
  assert.equal(await resolveServiciosLeadBusinessNotifyEmail(wire, null), "owner@listing.test");

  const savedKey = process.env.RESEND_API_KEY;
  const savedFrom = process.env.LEONIX_RESEND_FROM;
  const savedTiendaFrom = process.env.TIENDA_ORDER_EMAIL_FROM;
  delete process.env.RESEND_API_KEY;
  delete process.env.LEONIX_RESEND_FROM;
  delete process.env.TIENDA_ORDER_EMAIL_FROM;
  try {
    const wire2: ServiciosBusinessProfile = {
      identity: { slug: "x", businessName: "B" },
      contact: { email: "a@b.co" },
      hero: {},
    };
    assert.equal(await shouldShowServiciosPublicLeadInquiryForm(wire2, null), false);
  } finally {
    if (savedKey !== undefined) process.env.RESEND_API_KEY = savedKey;
    else delete process.env.RESEND_API_KEY;
    if (savedFrom !== undefined) process.env.LEONIX_RESEND_FROM = savedFrom;
    else delete process.env.LEONIX_RESEND_FROM;
    if (savedTiendaFrom !== undefined) process.env.TIENDA_ORDER_EMAIL_FROM = savedTiendaFrom;
    else delete process.env.TIENDA_ORDER_EMAIL_FROM;
  }
}

async function main() {
  const inquiry = readFileSync(join(__dirname, "../app/api/clasificados/servicios/inquiry/route.ts"), "utf8");
  assert.ok(inquiry.includes("emailNotified"), "inquiry: exposes emailNotified in JSON");
  assert.ok(inquiry.includes("resolveServiciosLeadBusinessNotifyEmail"), "inquiry: uses shared notify resolver");

  const form = readFileSync(join(__dirname, "../app/(site)/servicios/components/ServiciosLeadInquiryForm.tsx"), "utf8");
  assert.ok(form.includes("emailNotified"), "form: reads emailNotified from API");
  assert.ok(form.includes("j.accepted === false"), "form: honeypot does not show fake success");

  const panel = readFileSync(join(__dirname, "../app/(site)/servicios/components/ServiciosActionPanel.tsx"), "utf8");
  assert.ok(panel.includes("data-servicios-direct-contact-hint"), "panel: direct-contact hint marker");

  const slugPage = readFileSync(join(__dirname, "../app/(site)/clasificados/servicios/[slug]/page.tsx"), "utf8");
  assert.ok(slugPage.includes("shouldShowServiciosPublicLeadInquiryForm"), "slug page: gates lead form SSR");

  await runAsyncLeadNotifyChecks();

  console.log("servicios-quote-lead-smoke: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
