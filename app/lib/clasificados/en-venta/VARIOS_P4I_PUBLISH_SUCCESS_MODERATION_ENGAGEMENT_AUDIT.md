# Gate P4-I — Varios Publish Success + Terms Warning + Flag Notification + Real Engagement

## 1. Files inspected

- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts`
- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSuccessPanel.tsx` (new)
- `app/(site)/clasificados/en-venta/publish/enVentaPublishSuccessCopy.ts` (new)
- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx`
- `app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts`
- `app/(site)/clasificados/en-venta/moderation/enVentaFamilySafety.ts`
- `app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx`
- `app/(site)/clasificados/en-venta/republish/enVentaRepublishVisibility.ts`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/lib/dashboardRepublishUi.ts`
- `app/api/clasificados/en-venta/report/route.ts`
- `app/components/clasificados/analytics/LeonixLikeButton.tsx` (read-only)
- `app/components/clasificados/analytics/LeonixSaveButton.tsx` (read-only)
- `app/components/clasificados/analytics/LeonixShareButton.tsx` (read-only)
- `app/lib/clasificadosAnalytics.ts` (read-only)
- `app/clasificados/components/savedListings.ts` (read-only)

## 2. Files changed

- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx` — delegates success UI to panel; failure path unchanged
- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSuccessPanel.tsx` — new success confirmation panel
- `app/(site)/clasificados/en-venta/publish/enVentaPublishSuccessCopy.ts` — ES/EN copy + href helpers
- `package.json` — audit npm script
- `scripts/varios-p4i-publish-success-moderation-engagement-audit.ts` — gate audit script
- `app/lib/clasificados/en-venta/VARIOS_P4I_PUBLISH_SUCCESS_MODERATION_ENGAGEMENT_AUDIT.md` — this file

## 3. Current publish success flow

1. **Publish button:** `EnVentaPublishSubmitBar` button calls `onPublish`.
2. **Handler:** Saves preview draft, calls `publishEnVentaFromDraft(state, lang, plan)`.
3. **API:** Client-side Supabase insert/update via `publishEnVentaFromDraft` (no separate REST publish route).
4. **On success:** Clears `clearEnVentaPublishTempState()` + `clearAllClassifiedsDrafts()`, sets `publishOutcome`.
5. **On failure:** Sets `err`, does **not** clear draft, does **not** set `publishOutcome`.
6. **Success UI:** `EnVentaPublishSuccessPanel` replaces submit bar when `publishOutcome` is set.

## 4. Publish response payload finding

`publishEnVentaFromDraft` returns:

```ts
{ ok: true, listingId: string, gallery: EnVentaGalleryUploadOutcome, leonixAdId: string | null }
```

- `listingId` — Supabase `listings.id` UUID from insert.
- `leonixAdId` — from post-insert fetch of `listings.leonix_ad_id` (may be null if not yet assigned).

## 5. Success confirmation implementation

`EnVentaPublishSuccessPanel` shows after `res.ok` only:

- Title/body (ES/EN per gate)
- Leonix Ad ID when `leonixAdId` present
- 30-day guidance (honest — see §8)
- Republish/refresh guidance (Pro vs Free)
- Mark-as-sold reminder
- Terms/rules confirmation
- Flag/review warning
- Buttons: Ver mi anuncio / Ir a mi panel / Publicar otro anuncio

## 6. View ad link strategy

`buildEnVentaPublishedListingHref(listingId, lang)` → `/clasificados/anuncio/{listingId}?lang={lang}`

Uses real `listingId` from publish response. No hardcoded IDs. Not preview URL.

## 7. Dashboard link strategy

`buildEnVentaSellerDashboardHref(lang)` → `/dashboard/mis-anuncios?lang={lang}`

Existing seller listings hub with `EnVentaListingManageCard` (mark sold, pause, republish for Pro).

## 8. 30-day expiration/enforcement finding

- **Marketing copy:** `EnVentaPlanIntakeCallout` mentions “30 days online”.
- **Enforcement:** No `expires_at` set on Varios publish; no 30-day cron/unpublish found for en-venta.
- **Visibility window:** Pro republish uses `EN_VENTA_VISIBILITY_WINDOW_MS` (48h post-refresh), separate from 30-day intent.
- **Success copy:** Uses honest non-enforced wording (30-day intent + dashboard recommendation).

## 9. Republish/refresh finding

- **Pro:** Dashboard `EnVentaListingManageCard` + `renewEnVentaRepublish` / visibility refresh (“Refrescar anuncio”).
- **Free:** No dashboard republish refresh; seller creates new ad or uses panel options.
- Success copy branches on `plan === "pro"`.

## 10. Mark-as-sold dashboard finding

- **Exists:** `EnVentaListingManageCard` — `sold: "Finalizar / vendido"` / `"Mark sold"`.
- Route: `/dashboard/mis-anuncios` with per-listing manage card actions.
- Success copy uses mark-as-sold wording.

## 11. Terms/rules warning implementation

Success panel includes: “Al publicar, confirmaste que tu anuncio cumple con las reglas de Leonix.” / English equivalent.

Terms checkbox logic in publish form was **not** modified.

## 12. Flagged ad/report path finding

- **Report UI:** `EnVentaListingReportDrawer` on public detail; `EnVentaEngagementRow` scrolls to report block.
- **API:** `POST /api/clasificados/en-venta/report` → `submitEnVentaListingReport`.
- **Storage:** Inserts into `listing_reports` with `status: "pending"`.
- **Admin queue:** `/admin/reportes` referenced in alert email body.

## 13. AI/safety assistant finding

- **Publish-time:** `evaluateEnVentaFamilySafetyFromState` in `enVentaFamilySafety.ts` — deterministic rules, no external AI.
- **Behavior:** `status !== "safe"` (blocked or needs_review) **blocks publish** with user-facing error.
- **Post-publish AI flag:** Not implemented; no post-publish assistant review pipeline.

## 14. Owner/admin notification finding

- **High-severity reports:** `submitEnVentaListingReport` sends email via `sendLeonixResendEmail` when `isHighSeverityEnVentaReport(reasonCode)`.
- **Recipients:** `LEONIX_ADMIN_ALERT_EMAIL` || `LEONIX_REPORTS_ALERT_EMAIL` || `LEONIX_GLOBAL_EMAIL`.
- **Seller notification on report:** Not implemented.
- **AI flag notification:** N/A at publish (blocks instead); no post-publish notify path.

## 15. Notification wiring applied or blocker documented

**Applied (existing):** Varios reports already use `submitEnVentaListingReport` admin email for high-severity codes.

**Blocker (not in scope):** Seller email/in-app notification when listing is reported or flagged post-publish. Recommend next gate if product requires seller alerts.

## 16. Servicios engagement pattern finding (read-only)

- Shared: `LeonixLikeButton`, `LeonixSaveButton`, `LeonixShareButton` from `app/components/clasificados/analytics/`.
- Analytics: `app/lib/clasificadosAnalytics.ts` — event types, anonymous session, Supabase persistence.
- Listing key: `enVentaEngagementListingKey(leonixAdId → listingId)`.

## 17. Varios published engagement result

- **Detail:** `EnVentaEngagementRow` mode `live` — real Like/Save/Share via Leonix buttons; report scroll on detail.
- **Results cards:** `EnVentaResultsClient` — `toggleListingSaved` via `savedListings.ts` (localStorage heart).
- **Share feedback:** Preview toast + LeonixShareButton / anuncio rail copy.

## 18. Varios preview engagement result

- **Preview:** Save/Like disabled with hint “Disponible cuando el anuncio esté publicado.” / English equivalent.
- **Share:** Preview can copy/share preview URL with toast “Enlace copiado” / “Link copied”.
- **No fake persistence** on preview save/heart.

## 19. Analytics wiring finding

- Live engagement buttons pass `listingId` and use shared analytics components (same pattern as Servicios).
- Results heart uses local saved-listings store (documented in P4-G); not fake counters.
- No new fake analytics added in this gate.

## 20. Failure behavior result

- Publish failure: error alert (`data-testid="ev-publish-error"`), no success panel, draft not cleared.
- Success panel only when `publishOutcome` set after `res.ok`.

## 21. Draft cleanup preservation result

- Draft cleared only after successful publish (`clearEnVentaPublishTempState`, `clearAllClassifiedsDrafts`).
- On failure: early return before cleanup — preserved from prior gates.

## 22. Build/check result

Run: `npm run varios:p4i-publish-success-moderation-engagement-audit` and `npm run build` (see validation section).

## 23. Remaining risks

- 30-day active period is product intent copy, not enforced expiration — sellers may expect auto-expiry.
- Admin email on report depends on Resend env configuration.
- Results heart is localStorage-only vs Supabase save on detail — intentional split.
- Seller not notified when listing is reported (admin only for high severity).

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Publish handler was inspected | TRUE | `EnVentaPublishSubmitBar.tsx`, `enVentaPublishFromDraft.ts` |
| Publish response payload was inspected | TRUE | `{ ok, listingId, gallery, leonixAdId }` |
| Published listing id source was identified | TRUE | Supabase insert `listings.id` |
| Leonix Ad ID source was identified if available | TRUE | Post-insert fetch `leonix_ad_id` |
| Current redirect/success behavior was documented | TRUE | §3 — inline panel, no redirect |
| Success confirmation appears only after successful publish | TRUE | `setPublishOutcome` only after `res.ok` |
| Success confirmation does not appear on publish failure | TRUE | Failure sets `err`, no `publishOutcome` |
| Success confirmation includes published success message | TRUE | `enVentaPublishSuccessCopy.ts` title/body |
| Success confirmation includes Leonix Ad ID when available | TRUE | `EnVentaPublishSuccessPanel` conditional |
| Success confirmation includes 30-day guidance | TRUE | Honest duration copy in panel |
| Success confirmation includes republish/refresh guidance or honest fallback | TRUE | Plan-based republish copy |
| Success confirmation reminds seller to mark sold/update listing | TRUE | soldReminder copy |
| Success confirmation reminds seller they accepted rules/terms | TRUE | termsReminder copy |
| Success confirmation warns that flagged/reported ads may be reviewed | TRUE | flagWarning copy |
| “View my ad” links to real public detail URL | TRUE | `/clasificados/anuncio/{id}?lang=` |
| “Go to my dashboard” links to real dashboard/account route | TRUE | `/dashboard/mis-anuncios?lang=` |
| 30-day enforcement was inspected/documented | TRUE | §8 — not enforced |
| Republish/refresh support was inspected/documented | TRUE | §9 — Pro dashboard refresh |
| Mark-as-sold dashboard support was inspected/documented | TRUE | §10 — EnVentaListingManageCard |
| Existing mark-as-sold action was preserved if present | TRUE | No dashboard edits |
| Varios report/flag path was inspected | TRUE | §12 |
| AI/safety assistant flagging path was inspected | TRUE | §13 — publish-time block |
| Owner/admin notification infrastructure was inspected | TRUE | §14 |
| Owner/admin notification was wired for Varios flagged ads if infrastructure exists | TRUE | High-severity report email already wired |
| Notification blocker was documented if infrastructure does not exist | TRUE | §15 — seller notify blocker |
| Servicios engagement pattern inspected read-only | TRUE | §16 |
| Varios public detail Guardar/heart uses real behavior or blocker documented | TRUE | LeonixLike/Save on live detail |
| Varios results/landing heart uses real behavior or blocker documented | TRUE | savedListings localStorage |
| Varios Compartir uses real share/copy behavior | TRUE | LeonixShareButton + preview toast |
| Share success feedback exists | TRUE | Enlace copiado / Link copied |
| Report flow remains real | TRUE | EnVentaListingReportDrawer + API |
| Analytics engagement wiring was inspected | TRUE | §19 |
| Analytics is wired if shared pattern exists, or blocker documented | TRUE | Existing Leonix buttons |
| Preview does not fake unpublished save/heart persistence | TRUE | Disabled + hint in EnVentaEngagementRow |
| No fake counters were added | TRUE | No counter changes |
| No fake analytics were added | TRUE | No analytics changes |
| Stable listing key strategy documented | TRUE | leonix_ad_id → id |
| Draft is not cleared before successful publish | TRUE | Cleanup after `res.ok` |
| Draft is preserved on publish failure | TRUE | Early return on `!res.ok` |
| Used draft cleanup after successful publish was preserved | TRUE | Same cleanup calls |
| Preview layout was not changed | TRUE | No preview file edits |
| Public detail layout was not changed | TRUE | No detail layout edits |
| Media/gallery behavior was not changed | TRUE | Out of scope |
| Video behavior was not changed | TRUE | Out of scope |
| Terms/checkbox logic was not broken | TRUE | No terms file edits |
| Leonix Ad ID generation was not changed | TRUE | No ID gen edits |
| No unrelated categories were edited | TRUE | en-venta + package script only |
| No Stripe/payment files were edited | TRUE | Verified |
| No Supabase migrations/schema were edited | TRUE | Verified |
| npm run build passed | TRUE | See validation output |
