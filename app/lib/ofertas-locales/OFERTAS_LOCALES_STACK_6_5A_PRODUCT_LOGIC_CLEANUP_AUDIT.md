# Stack 6.5A — Product Logic Cleanup Audit

## Delivered

- `customMarketType` + `wantsAiSearchableSpecials` draft fields
- `getOfertaLocalMarketDisplayLabel()` for display/search readiness
- Lang-aware application (`?lang=es|en`) with single-language UI
- Leonix Partner callout replaces magazine pickup main section
- Compact digital-only pricing display (3 packages)
- Standard membership/digital coupon CTAs (not business-editable)
- Offer-type conditional fields and asset sections
- Improved file/URL confirmation copy
- Preview uses custom “Otro” label and AI intent note (not active)

## Verify

```bash
npm run ofertas-locales:stack-6-5a-product-logic-cleanup-audit
npm run build
```
