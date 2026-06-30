# Clasificados Preview/Public Output Final QA 01

Gate: `CLASIFICADOS-PREVIEW-PUBLIC-OUTPUT-BATTLEFIELD-QA-01`

Use real test listings where possible. Do not use Stripe/payment flows in this QA gate. Owner dashboard and admin management labels should be English. User-entered ad content may remain in Spanish or the language the client entered.

## 1. Global Preview Parity QA

1. For each category, start a new draft from `/clasificados/publicar`.
2. Fill title/business name, price/status, location, image, description, category-specific fields, and at least one contact method.
3. Open the preview route.
4. Expected result: preview shows title/business prominently, price/status where applicable, location, media, useful chips, contact CTA, and no `undefined` or blank sections.
5. Return to edit and change title, price/status, location, image, and one custom field.
6. Expected result: preview updates without losing draft identity.

## 2. Global Results Card QA

1. Publish or use an existing test listing.
2. Open the category results route: `/results` and `/resultados` where both exist.
3. Find the listing card.
4. Expected result: card order follows image/logo, title, price/status, category/subcategory, location, useful chips, trust/status badge, CTA.
5. Resize to 390px.
6. Expected result: no horizontal overflow, no cramped CTA row, no giant empty block, no raw JSON/raw IDs/fallback `undefined`.

## 3. Global Public Detail QA

1. Open the public detail page from the results card or dashboard `View public`.
2. Confirm hero/gallery, title, price/status, location, CTA cluster, facts, description, details, media/video, offers, contact, report/share/save.
3. Remove optional fields from a test draft and republish if safe.
4. Expected result: missing optional blocks are hidden cleanly; WhatsApp/website/social/map only show if provided.

## 4. Owner Dashboard QA

1. Log in as a listing owner.
2. Open `/dashboard/mis-anuncios?lang=en`.
3. Confirm cards show title/business, category/status, Leonix Ad ID when available, updated/published/expiration when available, and real analytics only.
4. Confirm primary actions are `Edit listing` or `Manage ad`.
5. Confirm secondary actions are `View public`, `View in results`, and analytics only when real.
6. Expected result: destructive actions are separated; no `Open panel`; no `Continue editing`.

## 5. Admin Listing QA

1. Open `/admin/workspace/clasificados`.
2. Open category queues for Servicios, Autos, Restaurantes, and generic listings.
3. Confirm cards/rows show listing identity, source/status, owner/user, Leonix Ad ID, risk/payment/verification state where available.
4. Expand action explainers for Feature, Verify Leonix, Run AI review, Archive, Delete, Republish.
5. Expected result: risky actions explain data touched, status, and next gate; Feature/Verify/AI do not claim live readiness unless proof exists.

## 6. Mobile 390px QA

1. Test preview, results, public detail, owner dashboard, and admin queue at 390px width.
2. Confirm cards stack cleanly.
3. Confirm buttons are tappable and wrap.
4. Confirm long titles/descriptions/locations wrap.
5. Expected result: no horizontal scrolling except intentional table wrappers in admin.

## 7. English UX QA

1. Search owner dashboard and admin management surfaces for Spanish management labels.
2. Confirm management labels use English: `View public`, `Edit listing`, `Manage ad`, `View in results`, `Pause`, `Archive`, `Republish`, `Delete`.
3. Confirm listing content entered by users remains unchanged.
4. Expected result: admin/dashboard chrome is English; public content is user-entered.

## 8. Category-by-Category QA

### En Venta
1. Create a free and pro draft.
2. Fill title, price, condition, category/subcategory/item type, location, images, seller contact.
3. Preview, publish, open results, public detail, owner dashboard, and admin queue.
4. Expected result: fields carry through and identity is preserved.

### Servicios
1. Edit an existing Servicios listing from `/dashboard/mis-anuncios?cat=servicios`.
2. Confirm business name, services, service areas, phone, WhatsApp, website, payments, hours, gallery/video, offers, credentials, languages, description.
3. Publish/update, open public detail and results.
4. Expected result: no blank form, no duplicate listing, slug/id/Leonix Ad ID preserved.

### Autos
1. Test private and business/dealer listing outputs.
2. Confirm year, make, model, trim, price, mileage, city, seller/dealer, images, VIN/decoded fields if saved, added inventory links.
3. Expected result: preview and public output do not drop vehicle facts or media.

### Restaurantes
1. Fill business name, cuisine/specialties, hours, address, phone, website, social, amenities, gallery/video, offers/coupons, languages.
2. Test `Other/Otro` custom cuisine/service text.
3. Expected result: custom text appears; generic `Other/Otro` does not appear by itself.

### Rentas
1. Fill rent price, beds/baths, location, availability, requirements, deposit/term, images, contact.
2. Expected result: price and availability are prominent in results/detail.

### Bienes Raices
1. Fill price, beds/baths, property type, location, agent/business/private seller, images, contact, operation type.
2. Include any newly added dirty-tree schema fields if they are intended for launch.
3. Expected result: preview/result/detail show the intended new fields or blockers are documented.

### Empleos
1. Test quick, premium, and feria preview flows if available.
2. Confirm job title, company, pay, schedule, location, apply/contact CTA.
3. Expected result: pay and apply CTA are visible and mobile-tappable.

### Clases
1. Test free and paid class.
2. Confirm title, free/paid status, price if paid, schedule, location/online, instructor/contact.
3. Expected result: paid/free state is obvious.

### Comunidad
1. Test event/community listing.
2. Confirm title, date/time, location, organizer/contact.
3. Expected result: schedule and location are not buried.

### Viajes
1. Test private/business/offer output if available.
2. Confirm trip/offer title, price/affiliate status, destination, partner/contact.
3. Expected result: affiliate/partner content is labeled partial where not fully backed.

### Mascotas y Perdidos
1. Test lost/found pet listing.
2. Confirm pet type, status, location, contact, image.
3. Expected result: status and contact are clear.

### Busco / Se busca
1. Test a request listing.
2. Confirm request title, category, location, contact, budget/need details.
3. Expected result: request intent is clear from results card.

### Comida Local
1. Test a local food listing.
2. Confirm business/food title, cuisine/product type, location, hours/contact, image, offer/menu detail.
3. Expected result: partial public vertical is labeled and output is not empty.

## 9. CTA QA

1. Test primary and secondary CTAs on preview, results, detail, dashboard, and admin.
2. Confirm call opens phone sheet/link only when phone exists.
3. Confirm WhatsApp only appears when WhatsApp exists.
4. Confirm website/social links only appear when URLs exist.
5. Expected result: no hidden broken buttons and no fake contact actions.

## 10. Edit Identity QA

1. Record listing ID, slug, source table, and Leonix Ad ID before editing.
2. Edit from owner dashboard.
3. Preview and publish/update.
4. Reopen dashboard, public detail, and admin queue.
5. Expected result: same listing identity, no duplicate listing, no blank edit form.

## 11. Other/Otro Custom Text QA

1. In categories with `Other/Otro`, choose Other and enter custom text.
2. Preview and publish.
3. Open results, public detail, owner dashboard, and admin card.
4. Expected result: custom text displays. Generic `Other` or `Otro` alone should not appear.

## 12. Analytics Visibility QA

1. Open owner dashboard for a listing with no analytics.
2. Expected result: analytics is hidden or truthfully empty; no fake counts.
3. Open a listing with real engagement events.
4. Expected result: only real event counts appear.

## 13. Ready to Commit Checklist

1. Run `git status --short`.
2. Confirm unrelated dirty files are separated or intentionally included.
3. Run `npm run verify:clasificados-preview-public-output-battlefield-qa-01`.
4. Run `npm run build`.
5. Confirm no migration was added.
6. Confirm no Stripe route/file was added.
7. Confirm no public website redesign outside Clasificados output surfaces.
8. Expected result: ready to commit only if verifier and build pass and dirty tree is cleanly understood.
