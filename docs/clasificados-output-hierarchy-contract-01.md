# Clasificados Output Hierarchy Contract 01

Gate: `CLASIFICADOS-PREVIEW-PUBLIC-OUTPUT-BATTLEFIELD-QA-01`  
Scope: application → preview → publish → public detail → results card → owner dashboard → admin card.

This contract is the standard every Clasificados category should move toward. It does not create schema, Stripe behavior, or fake readiness.

## Global Rules

- Public listing content may remain in Spanish or the language entered by the client.
- Owner dashboard and Admin OS management labels must be English.
- Do not render raw JSON, `undefined`, raw fallback IDs, or blank sections.
- Hide WhatsApp, phone, website, social, map, video, offer, gallery, and analytics blocks when the source data is missing.
- Preserve `id`, `slug`, `leonix_ad_id`, and source table identity across edit → preview → publish.
- Custom `Other/Otro` values must show the custom text, not a generic `Other` or `Otro` label.
- Mobile 390px is the default. Cards must wrap text, stack CTA groups, and avoid horizontal overflow.

## Public / Results Card Order

1. Main image, logo, or clean fallback media frame.
2. Title, business name, listing name, vehicle title, job title, class/event/request title.
3. Price, rate, pay, rent, status, or availability when applicable.
4. Category, subcategory, seller lane, or business type.
5. Location: city, ZIP/area, destination, service area, or online indicator.
6. Top 3-5 useful chips: beds/baths, mileage, cuisine, service type, schedule, condition, language, trust.
7. Trust/status badges: verified, promoted/featured, recent, pending, available, paid/free.
8. Primary CTA: View details, View public, Apply, Request info, Call, Quote, or Contact.
9. Secondary CTAs: View in results, Save, Share, Message, WhatsApp, Website when real.
10. Leonix Ad ID only where appropriate and not visually noisy.

## Public Detail Order

1. Hero image/gallery or premium media fallback.
2. Title/business/listing name.
3. Price/rate/pay/status/availability.
4. Location or destination.
5. Primary CTA cluster with tappable contact actions.
6. Key facts.
7. Description/about.
8. Category-specific details.
9. Media/gallery/video.
10. Offers/promos when supported and saved.
11. Contact card.
12. Trust/report/share/save actions.
13. Related/results navigation.

## Owner Dashboard Card Order

1. Listing title/business.
2. Category, status, and Leonix Ad ID when available.
3. Published, updated, and expiration/visibility window when available.
4. Analytics snapshot only when backed by real events.
5. Needs attention or new fields available badge only when detectable.
6. Primary action: Edit listing or Manage ad.
7. Secondary actions: View public, View in results, Analytics.
8. Destructive/lifecycle actions separated: Pause, Archive, Delete.

## Admin Card / Row Order

1. Listing identity: title/business, source row ID, slug, Leonix Ad ID.
2. Category/source/status.
3. Owner/user.
4. Risk/report/payment/verification status.
5. Quick inspect links: View public, View in results, owner profile.
6. Safe lifecycle actions: Restore, Suspend, Archive, Republish.
7. Trust/monetization actions: Feature, Verify Leonix, Run AI review, labeled partial/needs live proof when appropriate.
8. Dangerous actions separated and protected.

## Category Field Output Minimums

| Category | Required output fields |
|---|---|
| En Venta | title, price, condition, category/subcategory/item type, location, images, seller contact, negotiable/offer state, Leonix identity in dashboard/admin |
| Servicios | business name, services, service areas, phone, WhatsApp, website, payments, hours, gallery/video, offers, credentials, languages, description, verified/promoted status |
| Autos | year, make, model, trim, price, mileage, city/state, seller/dealer, images, VIN/decoded fields when saved, dealer inventory links, Leonix Ad ID |
| Restaurantes | business name, specialties/cuisine, hours, address, phone, website, social, amenities, gallery/video, offers/coupons, languages |
| Rentas | rent price, beds/baths, location, availability, requirements, deposit/term where saved, images, contact |
| Bienes Raices | price, beds/baths, property type, location, agent/business/private seller, images, contact, operation type |
| Empleos | job title, company, pay, schedule, location/remote, apply/contact CTA, employer trust |
| Clases | class title, free/paid status, price if paid, schedule, location/online, instructor/contact |
| Comunidad | event/community title, date/time, location, organizer/contact |
| Viajes | trip/offer title, price/affiliate status, destination, partner/contact, inquiry CTA |
| Mascotas y Perdidos | pet type, lost/found/status, location, contact, image |
| Busco / Se busca | request title, category, location, contact, budget/need details when saved |
| Comida Local | business/food title, cuisine/product type, location, hours/contact, image, offer/menu detail |

## Preview / Public Parity Rules

- Preview should use the same card/detail primitives as public output when practical.
- If preview uses a separate component, it must show the same title, price/status, location, media, chips, and primary CTAs as the public card/detail.
- Preview must never create analytics writes without a published listing key.
- Public detail must not show empty media/video/contact blocks.
- Results cards must not bury price/rate/status under secondary text.
- Dashboard/admin cards must show identity and action state more clearly than public cards.

## Risk Flags

- `NEEDS PARITY FIX`: application fields are saved but not visible in preview/public/results/dashboard/admin.
- `NEEDS QA ONLY`: output appears wired but needs browser/mobile/manual proof.
- `NEEDS LIVE PROOF`: source table/column/action exists in repo but live Supabase proof is incomplete.
- `BLOCKER`: publish/edit identity, public detail route, or saved field display is broken.
