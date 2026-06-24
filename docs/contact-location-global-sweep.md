# Contact Location Global Sweep (CONTACT-LOCATION-GLOBAL-SWEEP-01)

Replaced Northern California city dropdowns on public contact/lead forms with a free-text global location field.

## Files inspected

- `app/components/contact/GlobalContactForm.tsx`
- `app/(site)/tienda/components/TiendaContactForm.tsx`
- `app/(site)/newsletter/NewsletterPageClient.tsx`
- `app/components/leonix/coming-soon-v2/ComingSoonLaunchSignupForm.tsx`
- `app/components/forms/NorCalCitySelect.tsx` (unchanged — no longer used on contact forms)
- `app/lib/leonix/leadCaptureServer.ts`, `processLeonixLeadPost.ts`
- `app/lib/email/contactInquiryEmail.ts`
- `app/admin/_components/leads/AdminLeonixLeadDetailDrawer.tsx`
- `app/(site)/contacto`, `/contact`, `/media-kit` (media kit has no location field)

## Forms found

| Route | Component | Location field |
|-------|-----------|----------------|
| `/contacto`, `/contact` | `GlobalContactForm` | `cityArea` (optional) |
| `/tienda/contacto` | `TiendaContactForm` | `cityArea` (optional) |
| `/newsletter` | `NewsletterPageClient` | `city` (optional) |
| `/coming-soon-v2` | `ComingSoonLaunchSignupForm` | `city` (optional) |
| `/media-kit` | — | no location field |

## Forms changed

All four forms above now use `GlobalLocationInput` instead of `NorCalCitySelect`.

## Old location behavior

- `<select>` with fixed NorCal cities + “Other Northern California area”
- Labels referenced Northern California only
- Values stored in existing `city_area` / `city` columns after NorCal normalization (canonical city names or free text)

## New location behavior

- Single-line text input
- User enters any city, state/region, and country
- Same backend fields (`cityArea` → `city_area`, `city` → `city` on newsletter subscribers)
- `normalizeLocationForSubmit()` trims and caps length (120 chars); no geographic restriction

## Data mapping preserved

| Form | Submit payload | Supabase column |
|------|----------------|-----------------|
| Global / Tienda contact | `cityArea` | `leonix_leads.city_area` |
| Newsletter / Coming Soon signup | `city` | `leonix_newsletter_subscribers.city` |

No schema or migration changes.

## Email notification preservation

- Resend provider, env vars, and recipient logic **unchanged**
- Internal notification emails now label the field **Location** (EN) / **Ubicación** (ES) while still sending the submitted value

## Admin display preservation

- Launch Leads inbox and detail drawer still read `city_area` / subscriber `city`
- `formatNorCalCityDisplay()` returns stored text as-is (works for global locations)

## Location copy

| | Spanish | English |
|---|---------|---------|
| Label | Ciudad, estado/región y país | City, state/region, and country |
| Placeholder | Ej. San José, California, Estados Unidos | Example: San Jose, California, United States |
| Helper | Puedes escribir cualquier ciudad o país. | You can enter any city or country. |

## QA URLs

- https://leonixmedia.com/contacto?lang=es
- https://leonixmedia.com/contacto?lang=en
- https://leonixmedia.com/coming-soon-v2
- https://leonixmedia.com/tienda/contacto?sourceCta=promo_quote
- https://leonixmedia.com/media-kit
- https://leonixmedia.com/admin/leads/inbox

## Verification

```bash
npm run verify:contact-location-global-sweep
npm run build
```

## TRUE/FALSE audit

| Flag | Value |
|------|-------|
| CONTACT_LOCATION_REPO_INSPECTED_FIRST | TRUE |
| CONTACT_LOCATION_FORMS_FOUND | TRUE |
| CONTACT_LOCATION_NORCAL_DROPDOWNS_REMOVED | TRUE |
| CONTACT_LOCATION_SPANISH_GLOBAL_LABEL | TRUE |
| CONTACT_LOCATION_ENGLISH_GLOBAL_LABEL | TRUE |
| CONTACT_LOCATION_FREE_TEXT_INPUT | TRUE |
| CONTACT_LOCATION_SUBMIT_MAPPING_PRESERVED | TRUE |
| CONTACT_LOCATION_EMAIL_NOTIFICATION_PRESERVED | TRUE |
| CONTACT_LOCATION_ADMIN_DISPLAY_PRESERVED | TRUE |
| CONTACT_LOCATION_NO_SCHEMA_CHANGES | TRUE |
| CONTACT_LOCATION_NO_EMAIL_PROVIDER_CHANGES | TRUE |
| CONTACT_LOCATION_NO_ADMIN_DASHBOARD_CHANGES | TRUE |
| CONTACT_LOCATION_NO_STRIPE_PAYMENT_CHANGES | TRUE |
