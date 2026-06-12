# Ofertas Locales — Category + Subtype UX Plan

## Current problem

Step 2 used a flat **Categoría del negocio** list (including Llantera, Servicio automotriz, etc. as top-level options) and always showed a global **Tipo de mercado** dropdown (`OFERTAS_LOCALES_MARKET_TYPE_OPTIONS`: Mexicano, Asiático, Americano, etc.) regardless of category. Tire shops, tax services, and beauty salons were forced to pick food-market types — bad UX.

## Old category list (primary dropdown)

- Supermercado, Carnicería, Panadería, Mercado de produce, Restaurante
- Llantera, Servicio automotriz, Salón de belleza, Servicios de impuestos
- Retail / tienda, Salón de eventos, Otro servicio

## New category model

14 primary categories with conditional subtypes:

| Primary (ES) | Primary (EN) | Subtype label family |
|---|---|---|
| Supermercado | Supermarket | Tipo de mercado |
| Carnicería | Butcher shop | Tipo de carnicería |
| Panadería | Bakery | Tipo de panadería |
| Mercado de frutas y verduras | Produce market | Tipo de mercado |
| Restaurante | Restaurant | Tipo de comida |
| Comida preparada | Prepared food | Tipo de comida preparada |
| Servicios automotrices | Automotive services | Tipo de servicio automotriz |
| Belleza y cuidado personal | Beauty & personal care | Tipo de servicio de belleza |
| Servicios profesionales | Professional services | Tipo de servicio profesional |
| Servicios para el hogar | Home services | Tipo de servicio para el hogar |
| Salud y bienestar | Health & wellness | Tipo de servicio de salud |
| Tienda | Retail store | Tipo de tienda |
| Eventos y entretenimiento | Events & entertainment | Tipo de evento o entretenimiento |
| Otro negocio | Other business | Custom text input (no dropdown) |

Subtype map lives in `ofertasLocalesBusinessCategoryUx.ts` as `OFERTAS_LOCALES_BUSINESS_SUBCATEGORY_OPTIONS_BY_CATEGORY`.

## No-migration / backward compatibility

- DB columns remain `business_category` (text) and `market_type` (text) — no Supabase migration.
- New primary values (e.g. `automotive_services`) stored in `business_category`.
- Subtype values stored in existing `market_type` column.
- `customMarketType` draft field + `internal_notes` metadata (`customMarketType`) for custom text (Other business + subtype "other").
- Legacy primary categories map on load via `OFERTAS_LOCALES_LEGACY_BUSINESS_CATEGORY_MAP`:
  - `tire_shop` → `automotive_services` + subtype `tire_shop`
  - `auto_service` → `automotive_services` + `general_mechanic`
  - `beauty_salon` → `beauty_personal_care` + `beauty_salon`
  - `tax_service` → `professional_services` + `tax_services`
  - `retail` → `retail_store`
  - `event_hall` → `events_entertainment` + `event_hall`
  - `other_service` → `other_business`

Future migration (optional): normalize legacy `business_category` rows in DB to new primaries.

## Validation strategy

- Primary `businessCategory` required (existing).
- `other_business` requires `customMarketType` text.
- Subtype `other` (within dropdown categories) requires `customMarketType`.
- Wizard hints: ES "Selecciona la categoría del negocio." / "Agrega el tipo de negocio."; EN equivalents.

## Spanish / English labels

Conditional subtype labels per category family in `OFERTAS_LOCALES_SUBTYPE_LABELS`. Primary labels in `OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS`.

## Files changed

- `app/lib/ofertas-locales/ofertasLocalesBusinessCategoryUx.ts` (new)
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/ofertasLocalesConstants.ts`
- `app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesValidation.ts`
- `app/lib/ofertas-locales/ofertasLocalesWizardSteps.ts`
- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `scripts/ofertas-locales-category-subtype-ux-audit.ts`
- `package.json`

## Risks

- Public/admin display of legacy `business_category` strings still shows mapped labels via `labelForPrimaryBusinessCategory` legacy fallback.
- `customMarketType` in metadata is new; admin UI may not surface it until a follow-up.
- Gate 1 audit still references global `OFERTAS_LOCALES_MARKET_TYPE_OPTIONS` for legacy fallback only.
