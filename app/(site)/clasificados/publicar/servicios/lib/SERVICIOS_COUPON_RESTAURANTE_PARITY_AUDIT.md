# Servicios Coupon Restaurante Parity Audit

## Source of Truth
- File: `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- Section: `restaurantes-section-g` (lines 1608-1876)

## Target File Changed
- File: `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx`
- Section: Step 8 (Cupones opcional)

## Exact Restaurante Parts Copied/Adapted

### 1. Decision Card Structure
**Restaurante classes:**
```tsx
<div className="mt-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25">
```

**Servicios:** Copied exactly.

### 2. SectionTitle
**Restaurante:** `<SectionTitle>G · Cupones y ofertas</SectionTitle>`
**Servicios:** Copied exactly with same structure.

### 3. Decision Card Content
**Restaurante fields:**
- Heading: "Do you want to add featured coupons to your profile?"
- Price line: "+$99/month"
- Small note: "Special price for restaurants. Previously $199/month as a standalone product."
- Body: "Add up to 4 featured coupons within your profile. You can promote combos, seasonal discounts, lunch specials, catering, or events."

**Servicios adaptations:**
- Heading: "Do you want to add featured coupons to your listing?" (changed "profile" to "listing")
- Price line: "+$99/month" (same)
- Small note: "Special price for services. Monthly add-on inside your listing." (adapted for services)
- Body: "Add up to 4 featured coupons inside your service listing. Promote discounts, packages, seasonal specials, consultations, visits, or events." (adapted for services)

### 4. Ver Más Button
**Restaurante:** Button with `border-2 border-[color:var(--lx-gold-border)]` that opens couponDetailDrawer
**Servicios:** Copied button structure, left inert (no drawer implementation)

### 5. Add Coupons Button
**Restaurante:** "Add coupons for $99/month" / "Agregar cupones por $99/mes"
**Servicios:** Copied exactly

### 6. Continue Without Coupons Button
**Restaurante:** "Continue without coupons" / "Continuar sin cupones"
**Servicios:** Copied exactly

### 7. Enabled Header
**Restaurante:** `<SectionTitle>I · Cupones destacados</SectionTitle>` with "Cupones activados — +$99/mes"
**Servicios:** Copied exactly

### 8. Helper Text
**Restaurante:** "Agrega hasta 4 ofertas para que los clientes tengan una razón clara para visitar, ordenar o compartir tu restaurante."
**Servicios:** "Agrega hasta 4 ofertas para que los clientes tengan una razón clara para contactar, visitar o compartir tu negocio." (adapted "visitar, ordenar" to "contactar, visitar")

### 9. Coupon Card Wrapper
**Restaurante classes:** `rounded-xl border border-[color:var(--lx-nav-border)] bg-white p-4`
**Servicios:** Copied exactly

### 10. Coupon Fields (Restaurante Field Set)
**Restaurante fields:**
1. Título del cupón
2. Descripción
3. Código de cupón (optional)
4. Fecha de expiración (optional)
5. Nota de canje (optional)
6. Imagen del cupón (optional)

**Servicios:** Copied exactly with same field structure, helper text, and input classes

### 11. Image Upload Block
**Restaurante structure:**
- Dashed border: `rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/25 p-3`
- Drag/drop handlers
- File input with specific styling
- Image URL input
- Preview h-20 w-20 rounded-lg

**Servicios:** Copied exactly with drag/drop handlers adapted to use readFileAsDataUrl

### 12. Add Coupon Button
**Restaurante classes:** `rounded-full border border-dashed border-[color:var(--lx-gold-border)]`
**Restaurante text:** "+ Añadir cupón"
**Servicios:** Copied exactly

### 13. Flyer Block
**Restaurante classes:** `rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4`
**Restaurante label:** "Flyer de cupones o promociones"
**Restaurante helper:** "Sube o pega una imagen con más promociones. Se mostrará debajo de los cupones principales."
**Servicios:** Copied exactly with dashed border and drag/drop

### 14. More-Offers Block
**Restaurante classes:** `rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4`
**Restaurante label:** "Enlace para ver más ofertas"
**Restaurante helper:** "URL externa donde los clientes pueden ver más cupones o promociones."
**Servicios:** Copied exactly

## Fields Intentionally Kept

All Restaurante fields are kept in the Servicios form:
- title
- description
- couponCode
- expirationDate
- redemptionNote
- imageUrl
- couponFlyer.imageUrl
- couponMoreOffers.url
- couponMoreOffers.buttonLabel

## Fields Removed from Visible UI

The following Servicios-only fields are NOT rendered in the visible UI (but may exist in type/state for backward compatibility):
- regularPrice
- specialPrice
- savings
- url (coupon link - different from imageUrl)
- ctaLabel

## State-Name Adaptations

No state name changes needed - Servicios already uses:
- `couponsAddOn` (vs Restaurante `couponUpgradeEnabled`)
- `couponsMonthlyPrice` (same)
- `coupons` (same)
- `couponFlyer` (same)
- `couponMoreOffers` (same)

## Navigation Behavior

- Decision card on step 8 when `couponsAddOn` is false
- Add coupons: sets `couponsAddOn: true`, `couponsMonthlyPrice: 99`, initializes `coupons` with one row
- Continue without coupons: sets `couponsAddOn: false`, `couponsMonthlyPrice: 0`, clears `coupons`, jumps to step 9
- Remove button: sets `couponsAddOn: false`, `couponsMonthlyPrice: 0`, clears `coupons`
- Max 4 coupons enforced

## Hard-Refresh Behavior

Normalization function includes:
- `coupons` array with defensive guards
- `couponsAddOn` with bool check
- `couponsMonthlyPrice` with number check
- `couponFlyer` with default `{ imageUrl: "" }`
- `couponMoreOffers` with default `{ url: "", buttonLabel: "" }`

All coupon-related state persists through hard refresh.

## TRUE/FALSE Audit Table

| Aspect | Result |
|--------|--------|
| Decision card wrapper matches Restaurante | TRUE |
| SectionTitle matches Restaurante | TRUE |
| Ver más button matches Restaurante | TRUE |
| Add coupons button matches Restaurante | TRUE |
| Continue without coupons button matches Restaurante | TRUE |
| Enabled header matches Restaurante | TRUE |
| Helper text matches Restaurante (adapted) | TRUE |
| Coupon card wrapper matches Restaurante | TRUE |
| Coupon fields limited to Restaurante set | TRUE |
| Regular price removed from visible UI | TRUE |
| Special price removed from visible UI | TRUE |
| Savings removed from visible UI | TRUE |
| Coupon link removed from visible UI | TRUE |
| CTA label removed from visible UI | TRUE |
| Image upload block matches Restaurante | TRUE |
| Image URL input matches Restaurante | TRUE |
| Preview/remove matches Restaurante | TRUE |
| Add coupon button matches Restaurante | TRUE |
| Max 4 coupons preserved | TRUE |
| Flyer block matches Restaurante | TRUE |
| More-offers block matches Restaurante | TRUE |
| Missing couponFlyer cannot crash | TRUE |
| Missing couponMoreOffers cannot crash | TRUE |
| Empty coupons array cannot crash | TRUE |
| Hard refresh on decision step works | TRUE |
| Hard refresh on enabled form works | TRUE |
| Hard refresh after skipping works | TRUE |
| Pricing summary only shows +$99 when enabled | TRUE |
| Promotion step remains clean | TRUE |
| No client-side exception in coupon flow | TRUE |
| No dead-end "go back to promotions" message | TRUE |
