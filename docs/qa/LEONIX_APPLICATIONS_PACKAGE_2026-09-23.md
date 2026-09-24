# Leonix Applications Package — Launch QA Ledger

Canonical branch: `integration/leonix-canonical-launch-consolidation-2026-09-22`

## Doctrine

This package covers applications only: checkpoint/application → validation → media → Preview → results-card/public output → publish handoff. Dashboard and Admin deep QA are later packages.

Servicios is the golden shared-capability reference. Strong behavior may be forward-ported only when it logically applies; category-specific product rules remain intact.

No Vercel Preview is allowed for this package until:
1. `verify:applications-package` is green,
2. launch/source gates are green,
3. i18n/translation gates are green,
4. full typecheck is green,
5. `npm run build` is green.

## Strategic runtime coverage

| Family | Runtime strategy after source package is green |
|---|---|
| Servicios | Audit multiple business-type branches (mechanic, barber, dentist, trade/professional) for correct preset pills; publish one premium representative shell with custom service, languages, hours, service areas, payment methods, verified/manual address states, phone/SMS/explicit WhatsApp/email/web/maps, media, translation and trust. |
| Restaurantes | Exercise cuisine/style/service-mode branches, hours/open-now, catering/events, coupons and contact variants; publish one representative premium restaurant unless a genuinely different lane requires another. |
| Comida Local | Exercise seller-type branches and Find Me Today/location/privacy behavior; publish representative output while preserving its separate product identity. |
| Autos Dealer | One dealer parent. Exercise vehicle field variants/VIN/media. Fill included inventory to 10; attempt #11; prove +10 pack; extend capacity to 20. Fully differentiate a few vehicles while remaining rows prove entitlement/capacity. |
| Autos Privado | Separate canonical private flow; one representative listing because ownership/pricing/pipeline differs from Dealer. |
| Bienes Negocio | One agent/business parent. Use child inventory strategically: Casa/Home, Terreno/Lot, Comercial. Hit included capacity; trigger +3 inventory pack; verify added capacity and parent/child identity. |
| Bienes Privado / FSBO | Separate private pipeline; one representative listing because ownership/pricing differ from business inventory. |
| Rentas | Exercise property/lease requirement and amenity branches; test private/business distinctions only where current product truth actually separates them. |
| Empleos | Exercise Quick/Premium/Feria paths where they are genuinely distinct; salary/schedule/questions/video/contact fields must survive Preview and publish handoff. |
| En Venta | Exercise taxonomy department→subcategory→item, Free/Pro differences, media, contact, Preview return, Translate Ad, and published shell. |
| Busco | Exercise request-type branches and custom/Otro path; publish one representative shared shell after branch validation. |
| Clases | Exercise schedule/organizer/logo/contact/category branches; one representative publish if shared shell remains common. |
| Comunidad | Exercise event cost/date/schedule/organizer/flyer/location branches; one representative publish. |
| Mascotas y Perdidos | Exercise lost/found/adoption plus lost/found object branches and urgency/location/contact/image behavior; minimize permanent test rows while covering branch logic. |
| Ofertas Locales | Flyer and Coupon are distinct products; both must be exercised. Verify scan/review where supported, Preview, product items, location, price/term and publish handoff. |
| Quick Assisted Sales | Prove all eight staff-assisted families open the existing canonical application; Quick/Full entitlement changes benefits, not form/public-output quality. Excluded families remain Viajes/Iglesias/Recursos. |

## Source-gate coverage

The package aggregator reuses the strongest existing category verifiers rather than duplicating application logic:
- Business application shared contract
- Quick all-program proof
- Servicios golden owner/application delta
- Restaurantes preview readiness
- Comida Local final customer flow lock
- Autos final acceptance + Dealer inventory add-on
- Bienes golden launch + inventory parity
- Rentas launch + field contract
- Empleos final QA readiness
- En Venta full completion + preview persistence
- Community family + Busco + Comunidad identity
- Ofertas Locales two-lane final verifier

## Current repaired delta carried into this package

- En Venta Preview now uses the shared Translate Ad engine and protects price/contact/location/machine fields.
- En Venta live results cards now expose shared Translate Ad without changing card navigation or Preview-card interaction.
- Existing later fixes for Servicios/Restaurantes are preserved rather than reopened: included-coupon pricing truth, custom-language hydration, rich Correo, international WhatsApp, Restaurant Preview/Edit context and duplicate-CTA repairs.
- Quick gateway remains canonical-form based; no duplicate Quick application shell is introduced.

## Runtime certification rule

A source-green category is not runtime-certified until the milestone Vercel Preview is created and the strategic path above is actually exercised. Test rows are designed for maximum branch/entitlement coverage with minimum duplicate ads.
