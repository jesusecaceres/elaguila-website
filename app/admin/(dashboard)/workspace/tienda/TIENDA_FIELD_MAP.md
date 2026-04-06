# Tienda — admin field map

## Fully admin-backed (Supabase)

| Surface | Admin route | Storage |
|---------|-------------|---------|
| Catalog items (titles, slugs, descriptions, pricing mode, CTA mode, featured, sort, visibility, linked product) | `/admin/tienda/catalog`, `/admin/tienda/catalog/[id]` | `tienda_catalog_items` |
| Product images + primary | Same edit page | `tienda_catalog_images` |
| Pricing rules (tiers) | Same edit page | `tienda_catalog_pricing_rules` |
| Orders inbox | `/admin/tienda/orders` | `tienda_orders` (+ assets) |

## Storefront marketing shell (`/tienda`)

| What | Admin | Storage |
|------|--------|---------|
| Hero copy, section headings, trust bullets, final CTA, category card cover URLs, hero tile image URLs, optional category title/description JSON | `/admin/workspace/tienda/storefront` | `site_section_content` → `tienda_storefront` |

## Still code-only

- Checkout paths, order submission, blob uploads, self-serve pricing API logic.
- Product configurators (business cards, print-upload builders).
- Tienda **category taxonomy** (slugs, families, `tiendaCategories.ts`) — items reference `category_slug` but labels/structure live in code until a taxonomy table exists.
- Hero **process steps** inside `TiendaHero` (numbered 1–2–3) — copy partially from `tiendaCopy`; full step titles still code-driven in `tiendaCopy.sections.howItWorks.steps`.
