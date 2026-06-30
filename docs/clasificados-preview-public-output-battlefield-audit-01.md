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
