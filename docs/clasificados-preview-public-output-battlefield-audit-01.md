# Clasificados Preview/Public Output Battlefield Audit 01

Gate: `CLASIFICADOS-PREVIEW-PUBLIC-OUTPUT-BATTLEFIELD-QA-01`  
Mode: controlled battlefield output audit. No Stripe work. No schema changes. No migrations.

## Executive Summary

The Clasificados output layer has broad route coverage across preview, public detail, results cards, owner dashboard, and admin. The strongest categories are Servicios, En Venta, Autos, Restaurantes, Bienes Raices, Rentas, Empleos, and the community-listings family because they have visible preview/result/public/dashboard/admin wiring. The primary launch risk is not total absence of routes; it is parity discipline: ensuring fields captured in applications appear consistently in preview, public detail, results cards, owner dashboard, and admin cards.

Current battlefield status:
- Preview surfaces inspected: routes/components under `app/(site)/clasificados/**/preview`, `publicar/**`, and shared preview shells.
- Public detail surfaces inspected: slug/id detail routes such as Servicios, Restaurantes, Autos, Empleos, Rentas, Bienes Raices, En Venta/generic `anuncio`, Viajes, Ofertas/Comida Local.
- Results card surfaces inspected: `results` / `resultados` routes and category card components.
- Owner dashboard surfaces inspected: `mis-anuncios`, `servicios`, detail/edit pages, inventory helpers, and shared action cards.
- Admin listing surfaces inspected: global workspace, category ops pages, admin tables/cards/actions.
- Screenshots: no admin-specific screenshot package found in workspace. Existing audit notes and Tienda design references are used for visual QA guidance.

## Status Legend

- `GOOD`: route and output contract look strong enough for QA.
- `NEEDS POLISH`: visible output works, but copy/layout/details need tighter QA.
- `NEEDS PARITY FIX`: application fields may not fully match preview/public/results/dashboard/admin.
- `NEEDS QA ONLY`: code looks intentionally wired; browser/manual proof remains.
- `BLOCKER`: likely launch blocker or schema/action gap.

## Surface Inventory Matrix

| Category | Preview route/component | Publish route/API | Public detail route | Results card route/component | Owner dashboard card/action | Admin card/action | Battlefield status | Key risks |
|---|---|---|---|---|---|---|---|---|
| En Venta | `/clasificados/en-venta/preview`, `EnVentaPreviewShell`, `EnVentaPreviewResultsCardSample` | `/clasificados/publicar/en-venta/*`, En Venta publish helpers to `listings` | `/clasificados/anuncio/[id]`, `/clasificados/en-venta/results` cards link to generic detail | `/clasificados/en-venta/results`, `EnVentaResultListingCard` | `/dashboard/mis-anuncios`, `LeonixRealEstateListingManageCard`, `DashboardCategoryListingCard` | `/admin/workspace/clasificados/en-venta`, `AdminListingsTable`, row action panels | GOOD / NEEDS QA ONLY | Strong title/price/image hierarchy; verify Other/Otro condition/item-type custom values and edit identity for Pro/free flows. |
| Servicios | `/clasificados/publicar/servicios/preview`, `ServiciosProfessionalPreviewShell`, `ServiciosPreviewCard` | `/clasificados/publicar/servicios`, Servicios publish client/API to `servicios_public_listings` | `/clasificados/servicios/[slug]` | `/clasificados/servicios/results`, `/resultados`, `ServiciosListingResultCard`, `ServiciosProfessionalResultCard`, `ServiciosHorizontalResultCard` | `/dashboard/mis-anuncios`, `/dashboard/servicios`, `buildServiciosDashboardActionContract` | `/admin/workspace/clasificados/servicios`, `ServiciosAdminOpsListingCard` | GOOD / NEEDS QA ONLY | Owner edit hydration is fixed enough for production; exact original application snapshot remains partial because public `profile_json` is the durable source. |
| Autos | `/clasificados/autos/privado/preview`, `/autos/negocios/preview`, `AutosPreviewCard`, dealer preview chrome | Autos publish services to `autos_classifieds_listings` | `/clasificados/autos/vehiculo/[id]`, dealer inventory detail | `/clasificados/autos/resultados`, `AutosResultCard`, `AutosPublicFeaturedCard`, `AutosPublicStandardCard` | `/dashboard/mis-anuncios`, `dashboardInventory` Autos items | `/admin/workspace/clasificados/autos` | NEEDS QA ONLY | Many recent Autos changes exist; QA must verify year/make/model/trim/price/mileage/images/VIN/inventory parity without creating duplicate dealer inventory. |
| Restaurantes | `/clasificados/restaurantes/preview`, `RestaurantePreviewCard`, video preview card | Restaurant application/publish flow to `restaurantes_public_listings` | `/clasificados/restaurantes/[slug]` | `/clasificados/restaurantes/resultados`, result shell/cards | `/dashboard/mis-anuncios`, `/dashboard/restaurantes`, restaurant inventory helper | `/admin/workspace/clasificados/restaurantes` | NEEDS POLISH | Verify hours, specialties, amenities, offers/coupons, website/social, gallery/video output parity and paid-only messaging. |
| Rentas | `/clasificados/rentas/preview/privado`, `/preview/negocio`, `RentasPreviewCard` | Rentas publish flows to `listings` family | `/clasificados/rentas/listing/[id]`, `/rentas/anuncio/[id]` | `/clasificados/rentas/results`, `RentasResultCard` | `/dashboard/mis-anuncios`, generic listing manage cards | `/admin/workspace/clasificados/rentas` | NEEDS QA ONLY | Verify rent, beds/baths, availability, requirements, map/video/detail pairs, and no empty sections. |
| Bienes Raices | `/clasificados/bienes-raices/preview`, `/preview/privado`, `/preview/negocio`, BR preview clients | BR publish core to `listings` with `detail_pairs` / `listing_json` | `/clasificados/bienes-raices/anuncio/[id]`, generic `/anuncio/[id]` | `/clasificados/bienes-raices/resultados`, `BienesRaicesNegocioCard`, featured card | `/dashboard/mis-anuncios`, real-estate manage card | `/admin/workspace/clasificados/bienes-raices` | NEEDS QA ONLY | Existing audits show strong inventory work; QA must verify price/beds/baths/property type/agent contact and child inventory identity. |
| Empleos | `/clasificados/empleos/quick-preview`, `premium-preview`, `feria-preview` clients | Empleos publish to `empleos_public_listings` | `/clasificados/empleos/[slug]` | `/clasificados/empleos/results`, `/resultados`, `EmpleosJobResultCard` | `/dashboard/mis-anuncios`, `/dashboard/empleos`, `/dashboard/empleos/[listingId]` | `/admin/workspace/clasificados/empleos` | NEEDS QA ONLY | Verify pay/schedule/location/apply CTA, job lane preview parity, and application management links. |
| Clases | generic quick/publish community-style flow | `publishCommunityQuickToListings` for `category: clases` | generic `/clasificados/anuncio/[id]` | `/clasificados/clases/results` and `/resultados` | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/clases` | NEEDS POLISH | Paid-class lane is intentionally constrained; verify free/paid labels, price if paid, schedule, online/location, instructor/contact. |
| Comunidad | generic quick/publish community-style flow | `publishCommunityQuickToListings` for `category: comunidad` | generic `/clasificados/anuncio/[id]` | `/clasificados/comunidad/results` and `/resultados`, community cards | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/comunidad` | NEEDS POLISH | Verify event title/date/time/location/contact and no empty community blocks. |
| Viajes | `/clasificados/viajes/preview`, `/preview/privado`, `/preview/negocios` | `POST /api/clasificados/viajes/submit` to `viajes_staged_listings` | `/clasificados/viajes/oferta/[slug]`, `/negocio/[slug]` when approved | `/clasificados/viajes/results`, `/resultados`, affiliate/business/editorial cards | `/dashboard/viajes`, dashboard inventory helper | `/admin/workspace/clasificados/travel` | NEEDS PARITY FIX | Affiliate ops final tables are missing; staged/public approval and affiliate status must be QA-proven. Do not present affiliate revenue as fully real. |
| Mascotas y Perdidos | quick publish route under `/publicar/mascotas-y-perdidos` | `publishMascotasPerdidosQuickToListings` | generic `/clasificados/anuncio/[id]` | `/clasificados/mascotas-y-perdidos/results`, notice cards | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/mascotas-y-perdidos` | NEEDS POLISH | Verify pet type/status/location/contact/image and urgent/lost/found status clarity. |
| Busco / Se busca | quick publish route under `/publicar/busco` | `publishBuscoQuickToListings` | generic `/clasificados/anuncio/[id]` | `/clasificados/busco/results`, request cards | `/dashboard/mis-anuncios` | `/admin/workspace/clasificados/busco` | NEEDS POLISH | Verify request title/category/location/contact and English dashboard labels. |
| Comida Local | `/clasificados/comida-local/preview`, preview client | Comida Local publish/listings support | `/clasificados/comida-local/[slug]` | `/clasificados/comida-local`, listing cards | dashboard inventory source exists for `comida_local_public_listings` where used | `/admin/workspace/clasificados/comida-local` | NEEDS QA ONLY | Route exists but product maturity is partial; verify food/menu/contact fields and do not overstate readiness. |

## Known Parity Risks

- `Other/Otro`: category applications may store custom text under different sibling keys. QA must verify every category that exposes `Other/Otro` renders the custom value in preview, public detail, results card, owner dashboard, and admin where appropriate.
- Edit identity: Servicios is the most explicit current owner edit contract (`listingSlug`, `listingId`, `leonixAdId`). Other categories need QA for `id`, `slug`, source table, and `Leonix Ad ID` preservation before large refactors.
- Application snapshots: some categories store normalized public rows rather than exact original application state. This is acceptable for launch only if preview/public output remains truthful and edit flows do not blank forms.
- Analytics/action risk: owner dashboard analytics must only show real counts or honest unavailable/partial states.

## Mobile Risks

- Dense admin tables remain scroll-based by design; mobile card views and action wrappers must stay readable at 390px.
- Long `Leonix Ad ID`, UUIDs, slugs, URLs, custom Other/Otro text, and long business names must wrap or truncate intentionally.
- Dashboard action bars should use wrapping classes and not force single-line CTAs.

## CTA Risks

- Primary public CTAs must be obvious and category-appropriate.
- WhatsApp, phone, website, and social CTAs should render only when provided.
- Dangerous owner/admin actions must stay separated from safe actions.
- Admin/dashboard labels must stay English: `View public`, `Edit listing`, `Manage ad`, `View in results`, `Archive`, `Republish`.

## Title / Price / Location / Image Hierarchy Risks

- Public and results cards must never bury title, price/rate/status, and location below low-value chips.
- Images/logos need a deliberate frame and cannot collapse layout when missing.
- Cards should not use random emoji as a substitute for a missing image except where the existing category design intentionally uses a subtle placeholder.

## Blockers Found

No new schema, Stripe, auth, or payment blocker was found during this gate. The largest remaining blocker class is category-specific manual QA proof: Viajes affiliate ops readiness, category Other/Otro custom text output, and exact edit identity preservation outside Servicios/En Venta.
# Clasificados Preview/Public Output Battlefield Audit 01

Gate: `CLASIFICADOS-PREVIEW-PUBLIC-OUTPUT-BATTLEFIELD-QA-01`  
Scope: output quality across preview, public detail, results cards, owner dashboard cards, and admin listing cards.  
Mode: controlled QA/readiness gate. No Stripe work. No schema. No migrations.

## Executive Summary

The Clasificados output layer is broad and mostly functional, but launch readiness is uneven by category. The strongest categories have dedicated preview shells, public detail pages, results cards, owner dashboard identity, and admin operations cards. The weakest areas are parity proof, custom `Other/Otro` display consistency, exact edit identity across every category, and category-by-category browser QA at 390px.

The official output hierarchy is now documented in `docs/clasificados-output-hierarchy-contract-01.md`.

Status legend:
- `GOOD`: clear output structure and strong existing component evidence.
- `NEEDS POLISH`: output works but needs visual/copy/mobile cleanup.
- `NEEDS PARITY FIX`: saved application fields may not appear consistently in preview/public/results/dashboard/admin.
- `NEEDS QA ONLY`: code evidence is strong; browser/manual QA remains.
- `BLOCKER`: launch-blocking breakage found in inspected evidence.

No blocker was proven by static inspection in this gate. Some parity risks are too broad to safely rewrite without browser QA and category owners.

## Surfaces Inspected

- Preview routes/components under `app/(site)/clasificados/**/preview*` and category publish preview clients.
- Public detail routes including `anuncio/[id]`, Servicios slug, Restaurantes slug, Autos vehicle, Rentas listing/anuncio, Bienes Raíces anuncio, Empleos slug, Viajes offer/business, Comida Local slug, Ofertas Locales detail.
- Results routes and cards under `results` / `resultados`.
- Owner dashboard surfaces: `app/(site)/dashboard/mis-anuncios`, `/dashboard/servicios`, detail/edit routes, dashboard inventory/action contracts.
- Admin cards/actions: `app/admin/(dashboard)/workspace/clasificados` and category admin row/action components.
- Shared output/helpers: `components/clasificados`, `app/lib/clasificados`, category mapper/normalizer files, verifier scripts, package scripts.

## Category Matrix

| Category | Preview route/component | Publish/API handoff | Public detail | Results card | Owner dashboard | Admin card/actions | Status | Key risks |
|---|---|---|---|---|---|---|---|---|
| En Venta | `/clasificados/en-venta/preview`, `EnVentaPreviewPage`, `EnVentaPreviewShell`, `EnVentaPreviewResultsCardSample` | En Venta publish wizard and preview draft helpers | `/clasificados/anuncio/[id]` and En Venta detail stack | `EnVentaResultListingCard` | `/dashboard/mis-anuncios`, detail/edit routes, `LeonixRealEstateListingManageCard` | Generic `listings` queue/actions | NEEDS QA ONLY | Strong shared preview/detail stack; verify edit identity and `Other/Otro` taxonomy in browser. |
| Servicios | `/clasificados/publicar/servicios` preview client, `ServiciosPreviewCard`, professional shell | `servicios_public_listings`, `profile_json`, owner edit API | `/clasificados/servicios/[slug]` | `ServiciosListingResultCard`, `ServiciosProfessionalResultCard`, horizontal card | `/dashboard/servicios`, dashboard action contract, Servicios edit hydration | Servicios admin listing card + shared row actions | GOOD | Hydration fixed; exact full application snapshot still partial because public `profile_json` is not a full original application state. |
| Autos | Negocios/Privado preview clients, `AutosPreviewCard`, dealer preview chrome | `autos_classifieds_listings`, vehicle payload/inventory flows | `/clasificados/autos/vehiculo/[id]`, dealer pages | `AutosResultCard`, public featured/standard cards | Dashboard inventory rows for autos | Autos admin ops | NEEDS POLISH | Some preview card labels remain Spanish by default; two storage surfaces exist (`listings.category=autos` and `autos_classifieds_listings`); verify VIN/decoded fields, added inventory links, and explicit edit identity for paid rows. |
| Restaurantes | `/clasificados/restaurantes/preview`, `RestaurantePreviewClient`, `RestaurantePreviewCard` | `restaurantes_public_listings`, media/profile mapping | `/clasificados/restaurantes/[slug]` | `RestaurantePublishedListingCard`, `RestaurantesResultsShell`, preview/result shared card | Dashboard restaurant inventory | Restaurantes admin ops with shared row actions | GOOD | Strong `Other/Otro` cleanup in preview/result card; owner dashboard edit href currently points to publish flow without slug/id identity; verify offers/coupons and social/video parity. |
| Rentas | `/clasificados/rentas/preview/*`, `RentasPreviewCard`, privado/negocio clients | Rentas publish preview/builders | `/clasificados/rentas/listing/[id]`, `/anuncio/[id]` | `RentasResultCard` | Generic dashboard listings | Rentas admin/category queue | NEEDS QA ONLY | Good price/beds/baths/availability hierarchy; verify requirements/contact fields and private/business identity. |
| Bienes Raices | BR preview views/cards, negocio/privado/agente preview clients | BR publish core/mappers | `/clasificados/bienes-raices/anuncio/[id]` | `BienesRaicesNegocioCard`, featured card | Dashboard inventory actions for BR negocio/privado | Generic/admin category queue | NEEDS PARITY FIX | Dirty BR schema files exist before this gate; verify new schema fields are output in preview/results/detail before committing. |
| Empleos | Quick/premium/feria preview clients | `empleos_public_listings` | `/clasificados/empleos/[slug]` | `EmpleosJobResultCard` | Dashboard empleos rows | Empleos admin ops/actions | GOOD | Job title/company/pay/location/apply CTA hierarchy is clear; verify quick/premium differences and application/contact CTA. |
| Clases | Publish page + community/shared discovery model | Generic `listings` style publish | `/clasificados/anuncio/[id]` or category detail through community model | `CommunityDiscoveryListingCard` variant `clases` | Generic dashboard listings | Generic admin queue | NEEDS QA ONLY | Free/paid price/schedule/online/instructor output needs manual proof. |
| Comunidad | Publish page + community shared discovery | Generic `listings` style publish | `/clasificados/anuncio/[id]` or community detail | `CommunityDiscoveryListingCard` variant `comunidad` | Generic dashboard listings | Generic admin queue | NEEDS QA ONLY | Date/time/location/contact output needs browser proof; mobile card appears strong. |
| Viajes | Privado/negocios preview clients and result sample data | `viajes_staged_listings`, inquiries | Viajes offer/business detail routes | Viajes results affiliate/business/editorial cards | Dashboard Viajes rows | Viajes admin partial routes | NEEDS POLISH | Affiliate ops is partial; price/partner/destination/contact parity needs proof. |
| Mascotas y Perdidos | Publish page | Generic listing flow | likely generic `/anuncio/[id]`/category results | `MascotasPerdidosNoticeCard` / category results | Generic dashboard listings | Generic admin queue | NEEDS QA ONLY | Pet type/status/location/contact/image output needs manual QA. |
| Busco / Se busca | Publish page | Generic listing flow | likely generic `/anuncio/[id]`/category results | `BuscoRequestCard`, `BuscoResultsClient` | Generic dashboard listings | Generic admin queue | NEEDS QA ONLY | Request title/category/location/contact and budget/need details need QA. |
| Comida Local | `/clasificados/comida-local/preview` | `comida_local_public_listings` | `/clasificados/comida-local/[slug]` | `ComidaLocalListingCard`; `/clasificados/comida-local` doubles as discovery/results | Dashboard inventory source exists | Admin category queue | NEEDS POLISH | Public vertical still partial; no separate `/results` route; some public card CTAs are Spanish-only (`Ver ficha`, `Llamar`, `WhatsApp`); verify menu/offer/hours/contact parity before launch push. |

## Preview/Public Parity Notes

- En Venta uses shared detail primitives (`EnVentaListingHero`, `EnVentaDetailContentStack`, buyer panel/contact buttons) in preview, which is strong parity evidence.
- Servicios preview is a thin wrapper over the horizontal result card, and the publish/edit mapper exists. This is strong for discovery parity, but exact application-state parity is still limited by saved `profile_json`.
- Restaurantes has explicit `cleanOtherLabel` handling in the preview/results card, reducing generic `Other/Otro` risk.
- Autos, Rentas, and Bienes Raíces have premium preview cards with clear media/title/price/location sections, but several defaults are Spanish-oriented and need manual English/customer-language QA.
- Community/Clases use a shared discovery listing card with robust media fallback and mobile layout.
- Viajes has several card types; affiliate/editorial/business routes make parity more complex and should be QA’d separately.
- Dedicated-table categories use their own public tables (`servicios_public_listings`, `restaurantes_public_listings`, `autos_classifieds_listings`, `empleos_public_listings`, `viajes_staged_listings`, `comida_local_public_listings`); generic categories depend on `public.listings`, which increases edit/admin identity risk.
- Restaurante dashboard edit identity is weaker than Servicios because current owner inventory edit URLs do not carry slug/id identity into the publish flow.

## Results Card Risks

- Title/price/location hierarchy is generally present in mature cards: Autos, En Venta, Rentas, BR, Empleos, Servicios, Restaurantes.
- Some categories use many chips/badges; QA should confirm they do not create mobile clutter at 390px.
- Several result cards use icons or fallback emoji-like visuals. These should remain functional but not become clutter.
- No inspected result card should show raw JSON or `undefined`; verifier/manual QA should still test empty data.

## Public Detail Risks

- Public details must hide empty sections for WhatsApp, website, social, maps, gallery, video, offers, and analytics.
- Generic `/clasificados/anuncio/[id]` categories need stronger category-specific field parity proof than specialized pages.
- Long descriptions and user-entered content must wrap without layout break.
- Leonix Ad ID should be visible in dashboard/admin and only public where intentionally part of the user-facing trust/identity model.

## Owner Dashboard Risks

- Owner dashboard management labels must remain English. Recent management surfaces use `Edit listing`, `Manage ad`, `View public`, and `View in results`.
- `DashboardInventoryItem` supports title, status, public/edit/results/analytics links, published/updated dates, image, Leonix Ad ID, package/promoted/verified, source, and action contract.
- Servicios has a category action contract that preserves `listingId`, `slug`, and `leonixAdId` in edit URLs.
- En Venta must remain protected because it already has a working edit/manage pattern.
- Analytics should only appear when real/proven; no fake counts should be displayed.
- Dedicated-table owner edit identity is strongest in Servicios; Restaurantes, Autos paid rows, Viajes, Comida Local, and generic community/listing categories need explicit click-through QA before being called launch-ready.

## Admin Output Risks

- Admin queue row actions now have action explainers for risky lifecycle/trust actions.
- Admin cards should show source/status/owner/Leonix Ad ID before actions.
- Feature/Verify/AI review must remain `PARTIAL` or `NEEDS LIVE PROOF` unless live schema/action proof is complete.
- Dangerous actions should remain visually separated and protected.

## Field Output Review

| Category | Field output review |
|---|---|
| Servicios | Business name, services, service areas, phone/WhatsApp/website, payments, hours, gallery/video, offers, credentials, languages, and description are represented through resolved profile/card/detail patterns. Needs exact saved-row browser proof. |
| Autos | Year/make/model/trim, price, mileage, city/state, dealer/private identity, media, and inventory links are represented. VIN/decoded-field output needs QA against saved payloads. |
| Restaurantes | Business name, cuisine/specialties, hours/address/contact, website/social, amenities, gallery/video, offers/coupons, languages are represented in shell/mapper patterns. Verify social/video/offer hiding. |
| Rentas | Rent price, beds/baths, location, availability, deposit/terms/requirements, images, contact are represented by preview/result models. Verify private vs business details. |
| Bienes Raices | Price, beds/baths, property type, location, seller/agent/business, images, contact, operation type are represented. Dirty schema changes mean parity needs dedicated QA before commit. |
| Empleos | Job title/company/pay/schedule/location/apply CTA are prominent. Verify quick/premium/feria preview parity. |
| En Venta | Title, price, condition, category/subcategory, location, images, seller contact, save/share/report, and dashboard identity are represented. Verify custom taxonomy labels. |
| Clases | Title, free/paid, price if paid, schedule, location/online, instructor/contact need category-specific QA on generic/community card output. |
| Comunidad | Event/community title, date/time, location, organizer/contact need QA on shared community output. |
| Viajes | Trip/offer title, price/affiliate status, destination, partner/contact need QA across affiliate/business/editorial card variants. |
| Mascotas y Perdidos | Pet type, lost/found status, location, contact, image need QA on category card/detail output. |
| Busco | Request title, category, location, contact, budget/need details need QA on `BuscoRequestCard`. |

## Blockers Found

- No static-inspection launch blocker was proven.
- `Bienes Raices` has pre-existing dirty schema files at the start of this gate, so commit readiness depends on separating or intentionally including that work.
- Full parity cannot be certified without browser QA using real draft/published rows per category.
- Restaurante owner edit identity and Autos dual storage surfaces are notable QA risks, not blockers proven by static inspection.

## Recommended Fix / QA Priority

1. Browser QA En Venta and Servicios edit identity first.
2. QA Bienes Raíces dirty schema fields against preview/result/detail before commit.
3. QA Autos inventory/VIN/media parity next.
4. QA Restaurantes offers/video/social and `Other/Otro` custom text.
5. QA generic categories (Clases, Comunidad, Mascotas, Busco) for field completeness.
