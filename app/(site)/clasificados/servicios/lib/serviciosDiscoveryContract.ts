/**
 * Servicios public discovery — how published profile + listing row fields map to discovery UX.
 * Source of truth: `servicios_public_listings` row + `profile_json` (ServiciosBusinessProfile).
 *
 * | Field source                         | Discovery role |
 * |-------------------------------------|------------------|
 * | business_name (row)                 | keyword search, card title |
 * | city (row)                          | location filter, keyword, card |
 * | internal_group (row)                | group filter, card chip |
 * | published_at (row)                  | sort newest, recency |
 * | leonix_verified (row)               | verified filter, "Verificado" badge |
 * | profile_json.contact.isFeatured     | Destacado / promoted sort block |
 * | profile_json.contact.websiteUrl     | seller inference (Negocio), web filter |
 * | profile_json.contact.physical*      | seller inference, location filter text |
 * | profile_json.hero.locationSummary   | location filter, card |
 * | profile_json.serviceAreas.items     | location filter |
 * | profile_json.quickFacts (bilingual) | bilingual filter |
 * | profile_json.hero.categoryLine      | keyword, card |
 * | profile_json.about.text             | keyword |
 * | profile_json.contact.phone*, social | whatsapp/call filters, card |
 * | profile_json.promo.headline         | promo filter, card ribbon |
 *
 * Not used as URL filters (badge/meta only or internal): review counts, gallery order,
 * optional hours/open-now (requires reliable data pipeline first).
 */
export const SERVICIOS_DISCOVERY_CONTRACT_VERSION = 1 as const;
