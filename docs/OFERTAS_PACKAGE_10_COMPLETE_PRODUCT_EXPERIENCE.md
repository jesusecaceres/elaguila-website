# OFERTAS PACKAGE 10 — COMPLETE PRODUCT EXPERIENCE

Package 10 connects the repository-side advertiser-to-shopper product journey for Ofertas Locales and Cupones without applying migrations, connecting to a database, calling Stripe, Gemini, storage, notifications, broad browser QA, deployment, merge, commit, or push.

## Canonical Vision

- The item gets the shopper in.
- The flyer proves the source.
- The Business Hub drives contact, directions, website visits, and store visits.
- `ofertas_locales_flyer_30d` is the $399 / 30-day Volante interactivo product with IA incluida, searchable products, exact source/page proof, Business Hub, analytics, and flyer-only Lista de compras.
- `ofertas_locales_coupons_30d` is the $199 / 30-day Cupones product with IA incluida, public coupon cards/detail, terms, validity, Business Hub, analytics, and no shopping list, cart, quantity purchase, fake wallet, or fake redemption.

## Checkpoint And Advertiser Journey

Advertiser entry remains Ofertas-local:

- `/publicar` routes Ofertas Locales into `/publicar/ofertas-locales`.
- `/publicar/ofertas-locales` now reads the `product` query and preselects the flyer or coupon lane through the existing two-lane draft model.
- Lane switching with existing draft content asks for confirmation instead of silently rewriting incompatible flyer/coupon state.
- Step 1 sells both products before the business application: `Crear volante interactivo` / `Create interactive flyer` and `Publicar cupones` / `Publish coupons`.
- The application continues through business identity, contact/location, source upload, AI scan, review, preview readiness, checkout/submission readiness, and owner continuation.
- The final step explains that payment authorizes review submission, the public 30-day term starts after Leonix approval, corrections/rejections do not consume days or require a second payment, and approval is not guaranteed.
- When scan-prep has created the canonical parent, the application links to the existing owner checkout continuation at `/dashboard/ofertas-locales/[id]`.

## Shopper Journey

Public shopper routes remain canonical:

- `/clasificados/ofertas-locales` and `/clasificados/ofertas-locales/results` for flyer/product discovery.
- `/cupones` and `/cupones/resultados` for coupon discovery over the Ofertas data model.
- `/coupons` now redirects to `/cupones?lang=en` so the legacy English route no longer diverges.
- `/clasificados/ofertas-locales/[id]` remains the public Offer Hub with flyer/source presentation, approved product grid, Business Hub, and shopping list access for flyer lane.

## Search And Filters

Search and filters use real stored fields:

- keyword/product/business search;
- city, state, ZIP, country;
- business name filter;
- category, market type, offer type;
- deterministic relevance/newest/expiring and price-low only for flyer products.

No fake counts, fake distance sorting, pending/rejected records, hidden expired records, or exact-distance claims were added.

## Cards, Drawers, Flyer Source, And Hubs

- Product cards keep real crop/image fallback, title, price, business, location, source page, and open-detail action.
- Product drawer includes exact source proof language, source asset/page identity, Business Hub actions, share/copy link, SMS when a real phone exists, WhatsApp when real, and flyer-only add/remove shopping list actions.
- Coupon detail keeps title, discount/price text, terms, validity, public asset fallback, Business Hub actions, share/copy link, SMS when a real phone exists, and truthful “Leonix does not verify redemption” copy.
- Offer Hub and Business Hub expose only conditional actions backed by public data: call, SMS, WhatsApp, email/website where available, directions from usable address/link, social links, and share.

## Shopping List

The shopping list is a flyer-lane planning utility, not a cart:

- add/remove products;
- duplicate prevention through item identity;
- quantity and note support where the current hook already supports it;
- grouping by business;
- source/parent/item identity and price text snapshot preservation;
- local-device persistence;
- map handoff without route optimization claims.

Coupons do not enter the shopping list.

## Identity And Parity

The package preserves one identity chain:

- canonical parent UUID;
- Leonix Ad ID;
- product key;
- primary lane;
- source asset version;
- scan/review item ID;
- preview/public boundary;
- owner/admin/public views;
- renewal continuity.

Preview/public parity does not expose pending data publicly.

## States, Mobile, ES/EN, Accessibility

Package 10 repository work covers:

- loading, empty, error, unavailable source, expired, scan failed, review incomplete, checkout pending, and submission failed states;
- mobile/tablet-safe cards, drawers, filters, upload/review controls, flyer viewer, Business Hub actions, and shopping list spacing;
- Spanish/English parity for modified customer-visible copy;
- baseline semantic buttons/links, labels, dialog roles, close controls, alt text, focus rings, and touch targets.

## Deferred Work

Still pending outside this repository-only package:

- controlled migration application;
- Stripe staging validation;
- Gemini staging validation;
- real upload/storage validation;
- real flyer scan;
- real coupon scan;
- focused browser QA;
- partner onboarding;
- scheduled worker setup;
- cleanup worker setup;
- notification adapter validation;
- integration merge;
- deployment.

External services were not called. Database connections and writes were not performed. Browser QA was deferred. No staging certification is claimed.
