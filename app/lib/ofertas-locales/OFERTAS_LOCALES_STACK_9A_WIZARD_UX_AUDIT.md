# Stack 9A — Ofertas Locales Premium Wizard UX Audit

## Summary

Converted the Ofertas Locales application from a long single-page form into a 7-step guided wizard while preserving all product logic from Stacks 6.5A, 7, and 8.

## Wizard steps

1. **Oferta / Offer** — offer type cards + AI intent
2. **Negocio / Business** — category, market, custom Otro, business name, title
3. **Detalles / Details** — offer-type conditional fields + dates
4. **Ubicación / Location** — address, contact, phone formatting
5. **Archivos / Files** — flyer/coupon assets
6. **Extras** — membership, digital coupon, socials, featured intent, Leonix Partner
7. **Revisar / Review** — validation, digital pricing, preview, submit

## Validation

```bash
npm run ofertas-locales:stack-9a-wizard-ux-audit
npm run build
```
