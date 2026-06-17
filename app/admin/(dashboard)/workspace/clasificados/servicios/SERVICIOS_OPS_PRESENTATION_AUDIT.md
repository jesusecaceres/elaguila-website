# Servicios Ops Presentation — ADMIN-SERVICIOS-OPS-PRESENTATION-01

## 1. Files inspected

- `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/servicios/ServiciosAdminClient.tsx` (sandbox only)
- `app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts`
- `app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/AdminListingMonetizationSummary.tsx`
- `supabase/migrations/*servicios*` (reference)

## 2. Files changed

- `servicios/page.tsx` — card-first ops layout
- `servicios/_components/ServiciosAdminOpsListingCard.tsx` (new)
- `servicios/_components/ServiciosAdminMonetizationPanel.tsx` (new)
- `servicios/_components/ServiciosAdminOpsChrome.tsx` (new)
- `servicios/_lib/serviciosAdminOpsTypes.ts` (new)
- `serviciosPublicListingsServer.ts` — safe `readError` on failed reads
- `scripts/verify-admin-servicios-ops-presentation.mjs` (new)
- `package.json`

## 3. Current Servicios UX problems (before)

- 13-column horizontal table as default UX
- Monetization squeezed in narrow column
- Rounded/pill CTAs inconsistent with Leonix admin
- No Supabase truth summary for operators

## 4. Supabase truth diagnosis

| Item | Status |
|------|--------|
| Table | `servicios_public_listings` |
| Migrations | `20260407140000_servicios_listing_status.sql`, `20260411120000_servicios_leads_reviews_analytics.sql`, `20260506150000_leonix_ad_id_all_classifieds.sql`, `20260508140000_classifieds_admin_ops_columns.sql`, `20260509120000_classifieds_republish_capability.sql` |
| Columns used by admin queue | id, slug, leonix_ad_id, business_name, city, published_at, updated_at, profile_json, leonix_verified, listing_status, internal_group, owner_user_id, moderation_notes, promoted |
| Live proof | Row counts are from actual service-role query at page load; production volume needs live env |
| Schema mismatch risk | `fullSchema: false` when recent columns missing — page shows reduced-mode message |

## 5. New page architecture

1. Command header (hub back, eyebrow, title, source, purpose)
2. Quick actions (queue, live, public, publish, hub, registry)
3. Supabase truth card (loaded count, published count, schema status)
4. Filter panel (q, slug, id, leonix_ad_id, owner_user_id)
5. Card-first listing operations list
6. Advanced table behind `<details>`
7. Reviews / leads / sandbox (preserved, card layout)

## 6. Card-first listing presentation

Each card: identity, status/moderation forms, trust, engagement, monetization panel, staff actions (`ClassifiedAdminRowActions` layout=card), public view CTA.

## 7. Monetization presentation

`ServiciosAdminMonetizationPanel`: plan chip, pipeline, rectangular tool status chips, max 3 warnings, details for full notes.

## 8. CTA rectangle / color mapping

| Action | Color |
|--------|-------|
| Ad queue / Save status | Burgundy |
| Live listings / Save verify / Verify Leonix | Green |
| Public view / Publish | Royal blue |
| Advanced registry / Feature | Gold/bronze |
| Suspend | Orange |
| Archive / Clear | Neutral cream |
| Danger | Red (reviews reject only) |

## 9. Mobile result

- Page `overflow-x-hidden`, cards stack, 2-col action grid on staff actions
- No horizontal scroll in default view

## 10. Links/actions preserved

Move to top (republish), Suspend, Archive, Feature, Verify Leonix, public view, publish, filters, scope=live, review approve/reject, leads list.

## 11. Risks / deferred work

- Production row counts vary — truth card documents NEEDS_LIVE_SUPABASE_PROOF for volume QA
- Engagement/analytics still partial by design
- Advanced table is optional power-user view

## 12. TRUE/FALSE audit

All flags true after verify + build.
