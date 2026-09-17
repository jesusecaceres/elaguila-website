/**
 * Servicios False-Gates-Only Final Completion Pass — Gate 1 artifact (2026-09-17).
 *
 * Full field-by-field display-language inventory for the entire Servicios ad-local display model:
 * full application preview, full public preview, published profile, trade template, professional
 * template. Every visible ad-local string is classified into one of the four owner-doctrine classes
 * (UI_CHROME / CANONICAL_PRESET / CUSTOM_TRANSLATABLE / LITERAL_PRESERVE), with a `source` citation
 * pointing at the exact function/field/file that produces it, and a `tag` where the field rides the
 * `serviciosTranslateAd.ts` record protocol (qf/tr/cp/cn/pr/pf/cr/cf/el/pm/am/hb, or "details"/
 * "highlights"/"description"/"customServiceText"/"title"/"shareText" for the direct TranslatableAdFields
 * keys). This is the single source of truth Gate 16's coherence verifier walks against.
 *
 * Sourced from a full read of app/(site)/servicios/lib/serviciosTranslateAd.ts (the canonical rulebook,
 * see its header comment) plus a section-by-section trace of every Servicios display component.
 */

export type ServiciosStringClass =
  | "UI_CHROME"
  | "CANONICAL_PRESET"
  | "CUSTOM_TRANSLATABLE"
  | "LITERAL_PRESERVE";

export type ServiciosInventoryField = {
  section: string;
  field: string;
  cls: ServiciosStringClass;
  /** Record tag/key this field rides in the translate-ad protocol, when applicable. */
  tag?: string;
  source: string;
};

export const SERVICIOS_DISPLAY_LANGUAGE_INVENTORY: ServiciosInventoryField[] = [
  // ── 1. Hero ──────────────────────────────────────────────────────────────────────────────────
  { section: "hero", field: "businessName", cls: "LITERAL_PRESERVE", source: "profile.identity.businessName" },
  { section: "hero", field: "categoryLine (preset business type)", cls: "CANONICAL_PRESET", source: "relabelServiciosCanonicalPresets → canonicalBusinessTypeLabel" },
  { section: "hero", field: "categoryLine (custom \"otro\")", cls: "CUSTOM_TRANSLATABLE", tag: "title", source: "buildServiciosTranslatableContent.title" },
  { section: "hero", field: "locationSummary", cls: "LITERAL_PRESERVE", source: "profile.hero.locationSummary" },
  { section: "hero", field: "language badge (catalog)", cls: "CANONICAL_PRESET", source: "relabelServiciosCanonicalPresets badges block" },
  { section: "hero", field: "language badge (owner custom, non-verified)", cls: "CUSTOM_TRANSLATABLE", tag: "hb", source: "encodeOwnerExtrasForTranslation hb:<i>" },
  { section: "hero", field: "language badge (kind=verified)", cls: "UI_CHROME", source: "resolver-owned copy, excluded from relabel/translate by kind check" },
  { section: "hero", field: "\"Leonix Verified\"/\"Leonix Verificado\"", cls: "UI_CHROME", source: "ServiciosProfessionalHero.tsx inline string" },
  { section: "hero", field: "rating value / review count", cls: "LITERAL_PRESERVE", source: "profile.hero.rating / reviewCount" },
  { section: "category", field: "category line", cls: "CANONICAL_PRESET", source: "see hero.categoryLine (same field)" },
  { section: "language chips", field: "chip label", cls: "CANONICAL_PRESET", source: "see hero language badges" },

  // ── Comunidad Leonix ─────────────────────────────────────────────────────────────────────────
  { section: "Comunidad Leonix", field: "module title / \"Recognize this business\" CTA", cls: "UI_CHROME", source: "ServiciosHeroTrustSummary inline bilingual strings" },
  { section: "Comunidad Leonix", field: "recognition count", cls: "LITERAL_PRESERVE", source: "numeric count" },
  { section: "Comunidad Leonix", field: "results-card trust-strip brand label", cls: "UI_CHROME", source: "data-servicios-card-trust-strip block, displayLang-keyed" },

  // ── 2. Services ──────────────────────────────────────────────────────────────────────────────
  { section: "services", field: "section title/subtitle", cls: "UI_CHROME", source: "getServiciosProfileLabels(displayLang).services / servicesSectionSubtitle" },
  { section: "services", field: "service title (preset, svc_ prefix)", cls: "CANONICAL_PRESET", source: "relabelServiciosCanonicalPresets services block" },
  { section: "services", field: "service title (custom, custom_offer_ / non-svc_ id)", cls: "CUSTOM_TRANSLATABLE", tag: "details", source: "encodeServicesForTranslation → buildServiciosTranslatableContent.details" },
  { section: "services", field: "service secondary line (custom)", cls: "CUSTOM_TRANSLATABLE", tag: "details", source: "encodeServicesForTranslation col[1]" },
  { section: "services", field: "\"Ver todos\"/\"Ver menos\" toggle", cls: "UI_CHROME", source: "ServiciosServicesGrid.tsx showMoreServices/showLessServices" },

  // ── 3. About ─────────────────────────────────────────────────────────────────────────────────
  { section: "About", field: "section heading", cls: "UI_CHROME", source: "getServiciosProfileLabels(displayLang).about" },
  { section: "About", field: "body text", cls: "CUSTOM_TRANSLATABLE", tag: "description", source: "profile.about.text → buildServiciosTranslatableContent.description" },
  { section: "why choose us", field: "specialties line", cls: "CUSTOM_TRANSLATABLE", tag: "customServiceText", source: "profile.about.specialtiesLine → buildServiciosTranslatableContent.customServiceText" },
  { section: "why choose us", field: "trust reason (preset, trust_ prefix)", cls: "CANONICAL_PRESET", source: "relabelServiciosCanonicalPresets trust block" },
  { section: "why choose us", field: "trust reason (custom_reason)", cls: "CUSTOM_TRANSLATABLE", tag: "tr", source: "encodeOwnerExtrasForTranslation tr:<i>" },
  { section: "why choose us", field: "section heading/kicker", cls: "UI_CHROME", source: "getTrustSectionHeading/Kicker" },

  // ── 4. Highlights / quick facts ──────────────────────────────────────────────────────────────
  { section: "highlights", field: "section title/subtitle", cls: "UI_CHROME", source: "ServiciosHighlightsSection.tsx highlightsTitle/highlightsSubtitle" },
  { section: "highlights", field: "highlight (preset, bh_preset_ prefix)", cls: "CANONICAL_PRESET", source: "relabelServiciosCanonicalPresets highlights block" },
  { section: "highlights", field: "highlight (custom, bh_custom_ prefix)", cls: "CUSTOM_TRANSLATABLE", tag: "highlights", source: "encodeHighlightsForTranslation → buildServiciosTranslatableContent.highlights" },
  { section: "quick facts", field: "quick fact (catalog match)", cls: "CANONICAL_PRESET", source: "relabelServiciosCanonicalPresets quickFacts block" },
  { section: "quick facts", field: "quick fact (kind=custom or non-catalog label)", cls: "CUSTOM_TRANSLATABLE", tag: "qf", source: "encodeOwnerExtrasForTranslation qf:<i>" },

  // ── 5. Credentials / licenses / certifications ──────────────────────────────────────────────
  { section: "credentials", field: "title/subtitle/field labels", cls: "UI_CHROME", source: "getServiciosCredentialsCardCopy" },
  { section: "licenses", field: "licenseType value", cls: "CUSTOM_TRANSLATABLE", tag: "cr:licenseType", source: "encodeOwnerExtrasForTranslation cr:licenseType" },
  { section: "licenses", field: "insuranceType value", cls: "CUSTOM_TRANSLATABLE", tag: "cr:insuranceType", source: "encodeOwnerExtrasForTranslation cr:insuranceType" },
  { section: "licenses", field: "licenseAuthority / licenseNumber / licenseExpiration", cls: "LITERAL_PRESERVE", source: "ServiciosCredencialesCard.tsx renders profile.credentials.* raw" },
  { section: "certifications", field: "certification label", cls: "CUSTOM_TRANSLATABLE", tag: "cf", source: "encodeOwnerExtrasForTranslation cf:<i>" },
  { section: "credentials", field: "document URL", cls: "LITERAL_PRESERVE", source: "credential document href" },

  // ── 6. Coupons ───────────────────────────────────────────────────────────────────────────────
  { section: "coupons", field: "section title/subtitle", cls: "UI_CHROME", source: "getServiciosProfileLabels(displayLang).featuredCouponsTitle/Subtitle" },
  { section: "coupons", field: "coupon title / description", cls: "CUSTOM_TRANSLATABLE", tag: "cp", source: "encodeOwnerExtrasForTranslation cp:<i>" },
  { section: "coupons", field: "redemption note / CTA label", cls: "CUSTOM_TRANSLATABLE", tag: "cn", source: "encodeOwnerExtrasForTranslation cn:<i>" },
  { section: "coupons", field: "coupon code / expiration date / prices", cls: "LITERAL_PRESERVE", source: "ServiciosCouponsCard.tsx renders raw" },
  { section: "coupons", field: "\"Código:\"/\"Válido hasta\"/badge/action labels", cls: "UI_CHROME", source: "ServiciosCouponsCard.tsx inline bilingual strings" },

  // ── 7. Promotions ────────────────────────────────────────────────────────────────────────────
  { section: "promotions", field: "section title/subtitle", cls: "UI_CHROME", source: "getServiciosPromocionesSectionCopy" },
  { section: "promotions", field: "promotion headline (index 0)", cls: "CUSTOM_TRANSLATABLE", tag: "shareText", source: "buildServiciosTranslatableContent.shareText" },
  { section: "promotions", field: "promotion headline (index >=1)", cls: "CUSTOM_TRANSLATABLE", tag: "pr", source: "encodeOwnerExtrasForTranslation pr:<i>" },
  { section: "promotions", field: "footnote", cls: "CUSTOM_TRANSLATABLE", tag: "pf", source: "encodeOwnerExtrasForTranslation pf:<i>" },
  { section: "promotions", field: "\"Leonix promotion\" badge / action labels", cls: "UI_CHROME", source: "ServiciosPromocionesCard.tsx leonixPromoBadge/promoActionLabel" },
  { section: "promotions", field: "asset image/PDF/link URL", cls: "LITERAL_PRESERVE", source: "promo.assetImageHrefSafe/assetPdfHrefSafe/hrefSafe" },

  // ── 8. Contact / call / SMS / WhatsApp / email / directions ────────────────────────────────
  { section: "contact", field: "section headings (\"Contacto y ubicación\", etc.)", cls: "UI_CHROME", source: "ServiciosBusinessHubContactCard.tsx labels object" },
  { section: "call", field: "\"Call\"/\"Llamar\" action label", cls: "UI_CHROME", source: "ServiciosBusinessHubContactCard.tsx contactActions" },
  { section: "SMS/message", field: "\"Message\"/\"Mensaje\" action label", cls: "UI_CHROME", source: "ServiciosBusinessHubContactCard.tsx contactActions" },
  { section: "WhatsApp", field: "\"WhatsApp\" action label", cls: "UI_CHROME", source: "ServiciosBusinessHubContactCard.tsx contactActions" },
  { section: "email", field: "\"Email\"/\"Correo\" action label", cls: "UI_CHROME", source: "ServiciosBusinessHubContactCard.tsx contactActions" },
  { section: "directions", field: "\"Directions\"/\"Cómo llegar\" label", cls: "UI_CHROME", source: "ServiciosProfessionalHero.tsx / result card inline string" },
  { section: "contact", field: "phone (display + tel:) / email / physical address / mapsHref", cls: "LITERAL_PRESERVE", source: "profile.contact.* — never in buildServiciosTranslatableContent" },
  { section: "contact", field: "extra-link label", cls: "CUSTOM_TRANSLATABLE", tag: "el", source: "encodeOwnerExtrasForTranslation el:<i>" },
  { section: "contact", field: "custom payment method label", cls: "CUSTOM_TRANSLATABLE", tag: "pm", source: "encodeOwnerExtrasForTranslation pm:<i>" },
  { section: "amenities", field: "custom amenity option label", cls: "CUSTOM_TRANSLATABLE", tag: "am", source: "encodeOwnerExtrasForTranslation am:<group>:<i>" },
  { section: "payment labels", field: "catalog payment method label", cls: "CANONICAL_PRESET", source: "resolved at render time from id via destination-locale catalog (never sent to translation)" },

  // ── 9. Hours / special hours ─────────────────────────────────────────────────────────────────
  { section: "hours", field: "\"Weekly hours\"/\"Horario de la semana\" heading", cls: "UI_CHROME", source: "getServiciosProfileLabels(displayLang).weeklyHours" },
  { section: "special hours", field: "\"Special hours / Holidays\" heading", cls: "UI_CHROME", source: "getServiciosProfileLabels(displayLang).specialHours" },
  { section: "hours", field: "day label", cls: "LITERAL_PRESERVE", source: "hours.weeklyRows[].dayLabel — never masked in serviciosTranslateAd.ts" },
  { section: "hours", field: "hour range text", cls: "LITERAL_PRESERVE", source: "hours.weeklyRows[].line" },
  { section: "hours", field: "Open now / Closed pill", cls: "UI_CHROME", source: "buildServiciosHeroHoursPill via L.openNow/closed" },
  { section: "special hours", field: "row label/note", cls: "LITERAL_PRESERVE", source: "hours.specialHoursRows[]" },

  // ── 10. Gallery ──────────────────────────────────────────────────────────────────────────────
  { section: "gallery", field: "\"Gallery & videos\" heading", cls: "UI_CHROME", source: "ServiciosGalleryWithTabs.tsx inline heading" },
  { section: "Todo/All", field: "media filter switch label", cls: "UI_CHROME", source: "ServiciosMediaFilterSwitch" },
  { section: "Fotos/Photos", field: "media filter switch label", cls: "UI_CHROME", source: "ServiciosMediaFilterSwitch" },
  { section: "Videos", field: "media filter switch label", cls: "UI_CHROME", source: "ServiciosMediaFilterSwitch" },
  { section: "gallery", field: "image alt text (accessibility only, no visible caption field exists)", cls: "UI_CHROME", source: "derived from service/business labels, not owner prose" },

  // ── 11. Reviews ──────────────────────────────────────────────────────────────────────────────
  { section: "reviews", field: "\"Customer reviews\" heading", cls: "UI_CHROME", source: "getServiciosProfileLabels(displayLang).reviews" },
  { section: "reviews", field: "authorName", cls: "LITERAL_PRESERVE", source: "ServiciosReviews.tsx r.authorName" },
  { section: "reviews", field: "review quote text", cls: "LITERAL_PRESERVE", source: "explicit in-code comment: reviews stay LITERAL_PRESERVE, never translated" },
  { section: "reviews", field: "\"Google Reviews\"/\"Yelp Reviews\" link label", cls: "UI_CHROME", source: "SharedConnectionHubReviewButton label" },

  // ── 12. Socials / external links ────────────────────────────────────────────────────────────
  { section: "socials", field: "platform brand name (Facebook, Instagram, ...)", cls: "UI_CHROME", source: "ServiciosBusinessHubContactCard.tsx socialHeadline map (proper nouns, same both langs)" },
  { section: "socials", field: "social profile URL", cls: "LITERAL_PRESERVE", source: "profile.contact.socialLinks.*" },
  { section: "external links", field: "\"Find us online\" section label", cls: "UI_CHROME", source: "labels.find" },
  { section: "external links", field: "extra-link label", cls: "CUSTOM_TRANSLATABLE", tag: "el", source: "see contact.extra-link label (same field)" },

  // ── 13. Trust (Community Trust module) ──────────────────────────────────────────────────────
  { section: "trust", field: "kicker/heading", cls: "UI_CHROME", source: "getTrustSectionHeading/Kicker" },
  { section: "trust", field: "item label (preset)", cls: "CANONICAL_PRESET", source: "see why-choose-us trust reason (preset)" },
  { section: "trust", field: "item label (custom)", cls: "CUSTOM_TRANSLATABLE", tag: "tr", source: "see why-choose-us trust reason (custom)" },
  { section: "trust", field: "LeonixCommunityTrust shared widget copy", cls: "UI_CHROME", source: "app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx (shared, out of Servicios tree)" },

  // ── 14. Email sheet ──────────────────────────────────────────────────────────────────────────
  { section: "email sheet", field: "heading/section labels/button labels", cls: "UI_CHROME", source: "CtaActionSheet.tsx COPY.es/en" },
  { section: "email sheet", field: "intent.email", cls: "LITERAL_PRESERVE", source: "buildSendEmailIntent — sourced from vm.contact.emailMailto" },
  { section: "email sheet", field: "intent.subject template (\"Leonix · \" + businessName)", cls: "UI_CHROME", source: "template literal, businessName portion is LITERAL_PRESERVE" },
  { section: "helper text", field: "\"Contact the business directly for a faster response.\"", cls: "UI_CHROME", source: "ServiciosBusinessHubContactCard.tsx inline hint" },

  // ── 15. Quote/contact modal (shared CtaActionSheet, get_quote intent) ──────────────────────
  { section: "quote/contact modal", field: "heading/section/button labels", cls: "UI_CHROME", source: "CtaActionSheet.tsx COPY.es/en (get_quote branch)" },
  { section: "quote/contact modal", field: "intent.quoteMessage", cls: "UI_CHROME", source: "template-composed (serviciosEffectiveQuoteMessage) — connector phrases UI_CHROME, embedded names LITERAL_PRESERVE" },
  { section: "quote/contact modal", field: "intent.phone/email destination", cls: "LITERAL_PRESERVE", source: "resolveServiciosQuoteDestination" },

  // ── aria labels / tooltip / title text ──────────────────────────────────────────────────────
  { section: "aria labels", field: "\"View profile for <name>\" aria-label", cls: "UI_CHROME", source: "ServiciosHorizontalResultCard.tsx displayLang-keyed aria-label (name portion LITERAL_PRESERVE)" },
  { section: "tooltip/title text", field: "\"Vista previa\"/\"Preview\" inert-save tooltip", cls: "UI_CHROME", source: "LeonixSaveButton.tsx LABELS.es/en.preview" },
];

export const SERVICIOS_INVENTORY_REQUIRED_SECTIONS = [
  "hero", "category", "language chips", "Comunidad Leonix", "services", "About", "why choose us",
  "highlights", "quick facts", "credentials", "licenses", "certifications", "coupons", "promotions",
  "contact", "call", "SMS/message", "WhatsApp", "email", "directions", "hours", "special hours",
  "payment labels", "amenities", "reviews", "socials", "external links", "gallery", "Todo/All",
  "Fotos/Photos", "Videos", "trust", "email sheet", "quote/contact modal", "helper text",
  "aria labels", "tooltip/title text",
] as const;
