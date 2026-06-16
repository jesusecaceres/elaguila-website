# LANG-CONTENT-COVERAGE1 — Public Copy Coverage Audit

Developer checklist for public native copy coverage (`?lang=` routes).

## Coverage routes

| Route | Registry / source | Notes |
| --- | --- | --- |
| `/coming-soon-v2` | `comingSoonV2Copy/languages/*` | Per-lang native copy |
| `/qr/translator` | `qrGuideCopy` `TRANSLATOR_BY_LANG` | Device steps localized |
| `/translate-site` | `googleTranslateWebsite` `getTranslateSitePageCopy` | 4-step helper |
| `/productos-promocion` | `productosPromocionPageCopy` + `promoProductCopy` | Page UI + product fields |
| `/tienda/contacto` | `publicFormCopy` + `tiendaContactPageCopy` | Form + page chrome |
| `/magazine/2026/june/read` | `issueContent` + `qrGuideCopy` + `june2026CompanionContent` | Reader UI; visual PDF/flipbook Spanish |
| `/contacto` | `publicFormCopy` | Full locale registry |
| `/newsletter` | `publicFormCopy` | Full locale registry |
| `/home` | Redirect to `/coming-soon-v2` for community langs | es/en only on `/home` |
| `/media-kit` | `mediaKitPageCopy` | Native all active langs |
| Footer / shared chrome | `publicChromeCopy` | All active langs |

## Named holds

- Original magazine visual / PDF / FlipHTML5 remains Spanish by design.
- Proper nouns: Leonix Media, Media Kit, QR, Google Lens, Google Translate, Negocios Locales (brand).
- Non-featured promo catalog items: English product title + community generic subtitle when no slug override.

## QA matrix (minimum)

- VI canary: all 10 coverage routes with `?lang=vi`
- Spot check: `lang=pt`, `lang=ja`, `lang=pa` on coming-soon-v2, productos-promocion, qr/translator, contacto, newsletter, tienda/contacto, home redirect
