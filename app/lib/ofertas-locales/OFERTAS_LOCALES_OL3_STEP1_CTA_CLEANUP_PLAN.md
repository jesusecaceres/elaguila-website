# Gate OL-3 — Ofertas Locales Step 1 CTA Cleanup Plan

## Current issue

Step 1 showed two public upsell panels:

1. **¿Quieres más exposición?** — valid self-serve upsell into magazine/featured exposure.
2. **¿Quieres ser Leonix Partner?** — invalid as public self-serve; partner status is sales/admin-controlled and tied to magazine distribution.

The same partner panel also appeared on Step 6 (contact) and Step 7 (review summary).

## Exposure upsell plan

- Keep a single Step 1 callout: **¿Quieres más exposición?** / **Want more exposure?**
- Updated body mentions print magazine, featured Leonix placement, newsletter, social media, and special campaigns.
- CTA: **Hablar con Leonix** / **Talk to Leonix** → existing `publicContactHref` with `more_exposure_contact`.
- No payment, no guaranteed placement language, no partner discount mention.

## Partner CTA removal plan

- Remove public partner panels from `OfertasLocalesApplicationClient.tsx` (Steps 1, 6, 7 review).
- Remove `contactPartnerHref` / `leonix_partner_contact` from application UI.
- **Do not** remove draft fields (`isMagazinePickupPartner`, etc.) or publish mapper columns.
- Partner pricing constants remain in `ofertasLocalesConstants.ts` for admin/internal use.

## Backend / data preservation

| Item | Action |
|------|--------|
| `isMagazinePickupPartner` draft field | Preserved; defaults `false` |
| `ofertasLocalesPublishMapper` partner columns | Unchanged |
| Partner rate constants | Unchanged |
| Server publish validation | Partner not required — safe to hide UI |
| Existing drafts with partner flags | Backward compatible via persistence merge |

Leonix Partner is handled by internal sales/admin review and is **not** self-selected in the public application.

## Spanish copy

- Title: ¿Quieres más exposición?
- Body: Aumenta tu visibilidad con opciones de revista impresa, ubicación destacada en Leonix, newsletter, redes sociales y campañas especiales.
- CTA: Hablar con Leonix

## English copy

- Title: Want more exposure?
- Body: Increase your visibility with print magazine options, featured placement on Leonix, newsletter exposure, social media, and special campaigns.
- CTA: Talk to Leonix

## What is not being touched

- Payment / Stripe
- Publish API / mapper logic (except read-only verification)
- AI scan / upload
- Public results / preview partner badge internals
- Admin / dashboard
- Featured placement checkbox on Step 6 (separate intent capture)

## QA checklist

- [ ] Step 1 shows only exposure callout (ES + EN)
- [ ] No “¿Quieres ser Leonix Partner?” on application
- [ ] No “Want to become a Leonix Partner?” on application
- [ ] Exposure CTA links to contact page
- [ ] Step 7 review shows exposure summary only
- [ ] Mobile Step 1 layout balanced (single callout)
- [ ] Draft save/reset still works
- [ ] Publish still accepts drafts without partner self-selection
