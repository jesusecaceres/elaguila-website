# Clasificados — field ownership (workspace vs code)

## Admin-backed today

| Area | Where | Notes |
|------|--------|--------|
| Listing moderation | `/admin/workspace/clasificados` | Table + filters; data from `listings` (Supabase). |
| En-venta moderation helpers | Embedded `EnVentaModerationFields` | Existing workflow preserved. |
| Clasificados category registry | `/admin/categories` | **Not** Tienda `category_slug`. |

## Code-only / schema-owned

| Concern | Reason |
|---------|--------|
| Category tree, slug rules, validation | App + DB constraints. |
| Search / filter / report behavior | Operational logic stays in code. |
| Public routes & listing UI structure | Layout engine remains code. |
| Featured placement rules | Until a dedicated placements store exists. |

## Future (not in this pass)

- Category landing copy / banners as CMS keys or table.
- Locale-specific moderation helper blurbs.

## Compatibility

Redirects and compatibility routes were not modified.
