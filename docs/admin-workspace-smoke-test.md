# Admin Workspace Smoke Test Documentation

This document provides a route-by-route analysis of website editing capabilities based on the truth matrix in `app/admin/_lib/websiteEditingTruthMatrix.ts`.

## Status Definitions

- **TRUE**: Fully editable from admin today with real forms, save actions, and working workflows
- **PARTIAL**: Some content is editable but template/layout still lives in code. Admin can edit specific fields but not the full page structure
- **MISSING**: No admin route exists yet. Requires development work to become editable
- **HONESTLY_DISABLED**: Intentionally disabled, requires code changes. Not editable from admin by design

## Route-by-Route Analysis

### ✅ TRUE - Fully Editable Areas

| Area | Admin Route | Real Editor | What Can Be Edited | Public Route | Add New Content |
|-------|-------------|-------------|-------------------|--------------|----------------|
| Home (`/home`) | `/admin/workspace/home/content` | ✅ Form with save action | Hero text, CTAs, manual chips, all visible modules | `/home` | Use existing fields. New block types require schema field or block editor |
| Tienda — storefront | `/admin/workspace/tienda/storefront` | ✅ Form with save action | Storefront copy, hero images, featured items | `/tienda` | Use existing fields. New sections require development |
| Tienda — catalog/items | `/admin/tienda/catalog` | ✅ Full CRUD interface | All catalog items, pricing, images, descriptions | `/tienda/catalog` | Use catalog CRUD. New item types require schema changes |
| Global site settings | `/admin/site-settings` | ✅ Persisting form (`global_site`) | Banner texts, global toggles, strip content | Multiple pages | Use existing fields. New strip types require development |

### ⚠️ PARTIAL - Partially Editable Areas

| Area | Admin Route | What Exists | What Can Be Edited | What Still Requires Code | Public Route | Add New Content |
|-------|-------------|-------------|-------------------|------------------|--------------|----------------|
| Clasificados — categories and operations | `/admin/workspace/clasificados` | Category editor, moderation queue, form field editors | Landing page templates, new category structures | `/clasificados` | Use category editor for form fields. New landing layouts need code |
| Restaurantes — public pages | `/admin/workspace/clasificados/category/restaurantes` | Category-specific copy, form field labels | Hub page layout, listing detail templates | `/clasificados/restaurantes` | Use category editor for form fields. New block types require development |
| Servicios — public pages | `/admin/workspace/clasificados/category/servicios` | Category copy, form field labels | Landing page layouts, listing templates | `/clasificados/servicios` | Use category editor for form fields. New layouts need development |
| Autos — public pages | `/admin/workspace/clasificados/category/autos` | Form field labels, moderation queue | Listing detail templates, search layouts | `/clasificados/autos` | Use category editor for form fields. New templates require development |
| Empleos — public pages | `/admin/workspace/clasificados/category/empleos` | Form field labels, moderation queue | Job listing templates, search layouts | `/clasificados/empleos` | Use category editor for form fields. New layouts need development |
| Header/main navigation | `/admin/site-settings` | Banner texts, toggle switches for strips | Navigation structure, new menu items | All pages (header) | Use global settings for banners. New nav items need code changes |
| SEO/metadata | `/admin/workspace/revista` | Individual page metadata, magazine issue data | Unified SEO panel, automated metadata generation | All pages (varied) | Edit metadata per section. Unified SEO needs development |

### ❌ MISSING - No Editor Yet

| Area | Admin Route | What's Missing | What Needs To Be Built | Public Route | Add New Content |
|-------|-------------|-------------|-------------------|--------------|----------------|
| Legal/legal pages | None | Legal page editor, content management system | Various (legal pages) | Not editable from admin yet. Requires legal page editor development |

### 🚫 HONESTLY_DISABLED - Intentionally Disabled

| Area | Admin Route | Why Disabled | What Requires Code | Public Route | Add New Content |
|-------|-------------|-------------|-------------------|--------------|----------------|
| Footer (pie de página) | None | Footer content, layout, links | All pages (footer) | Not editable from admin. Requires code changes |

## Summary Statistics

- **TRUE areas**: 4 (Home, Tienda storefront, Tienda catalog, Global settings)
- **PARTIAL areas**: 6 (Clasificados categories, Restaurantes, Servicios, Autos, Empleos, Header, SEO)
- **MISSING areas**: 1 (Legal pages)
- **HONESTLY_DISABLED areas**: 1 (Footer)
- **Areas needing development**: 8 (all non-TRUE areas)

## Recommendations to Reach TRUE Status

### High Priority
1. **Unified page block editor** - This would address most PARTIAL areas by allowing reusable content blocks
2. **Legal page editor** - Simple CMS for static legal content
3. **Footer editor** - Make footer content manageable from admin

### Medium Priority
4. **Header/navigation editor** - Allow menu structure changes without code deployment
5. **Unified SEO panel** - Centralized metadata management with automated generation

### Low Priority
6. **Landing page templates** - Make category landing layouts editable
7. **Listing detail templates** - Standardize presentation across verticals

## How to Add Content - Current Patterns

### Structured Fields Only
- **Home, Tienda storefront**: Use existing form fields
- **Global settings**: Edit existing toggle switches and text fields
- **Category editors**: Modify form field labels and validation

### Repeatable Items/Cards
- **Tienda catalog**: Full CRUD for catalog items
- **Clasificados moderation**: Queue management for ads
- **Magazine issues**: Issue-based content management

### Code-Controlled Areas
- **Navigation structure**: Requires code changes for new menu items
- **Page layouts**: Templates live in code, need development for changes
- **Footer content**: Intentionally hardcoded, requires code changes
- **Legal pages**: No admin interface exists yet

## Validation Rules

The smoke test validates:
1. **Route existence**: All TRUE/PARTIAL rows must have working `ctaHref`
2. **Editor reality**: TRUE status must correspond to actual working edit/save workflows
3. **Guidance completeness**: Non-TRUE rows need `requiresCode` and `editableToday` fields
4. **Public route mapping**: Where applicable, public routes should be correctly identified

## Testing Checklist

For each area, verify:
- [ ] Admin route loads without errors
- [ ] Form saves data correctly (for TRUE areas)
- [ ] Public page reflects admin changes
- [ ] Validation works as expected
- [ ] Error handling is user-friendly
- [ ] Loading states are appropriate
- [ ] Mobile responsiveness works
- [ ] Accessibility features are functional

## Next Steps

1. **Immediate**: Use existing TRUE editors for content updates
2. **Short-term**: Address HIGH priority recommendations
3. **Medium-term**: Implement unified page block editor
4. **Long-term**: Full page builder with drag/drop capabilities

---

*This document is maintained alongside the truth matrix and should be updated when editing capabilities change.*
