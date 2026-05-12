/**
 * Phase 10E smoke: quote destination priority + lead message meta composition.
 * Run: npx tsx scripts/servicios-quote-lead-smoke.ts
 */
import assert from "node:assert/strict";
import type { ServiciosProfileResolved } from "../app/(site)/servicios/types/serviciosBusinessProfile";
import { resolveServiciosQuoteDestination } from "../app/(site)/servicios/lib/serviciosContactActions";
import { composeServiciosPublicLeadStoredMessage } from "../app/(site)/clasificados/servicios/lib/serviciosLeadStoredMessage";

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

console.log("servicios-quote-lead-smoke: OK");
