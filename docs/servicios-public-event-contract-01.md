# Servicios Public Event Contract 01

**Canonical reporting table:** `listing_analytics`  
**Category detail / audit log:** `servicios_analytics_events` (mirrored when not `clientListingAnalytics`)

## Contract rules

1. Preview/draft routes must not write (`persistListingEngagement=false`, no `sourceId`).
2. Cancelled native share → no event.
3. Failed Like/lead/clipboard → no success event.
4. One user action → one canonical write (ops mirror skipped when client already wrote global).
5. Result impressions → current page render only (`ServiciosResultsViewAnalytics`).

## Event inventory (summary)

| User action | Event (canonical) | Ops event | Writer | API | Success condition |
|-------------|-------------------|-----------|--------|-----|-------------------|
| Results impression | listing_impression* | search_results_view | ResultsViewAnalytics | servicios/analytics | Row visible on page |
| Result card open | result_card_click | — | trackServiciosResultCardClick | /api/analytics/events | User click |
| Detail view | listing_view | profile_view | trackServiciosPublicProfileView | both | Published page load |
| Like | listing_like | — | LeonixLikeButton + global recorder | /api/analytics/events | DB upsert ok |
| Unlike | listing_unlike | — | LeonixLikeButton | /api/analytics/events | DB delete ok |
| Share native | listing_share | — | LeonixShareButton | /api/analytics/events | navigator.share resolved |
| Share clipboard | listing_share | — | LeonixShareButton | /api/analytics/events | copy ok |
| Save/Unsave | listing_save / listing_unsave | — | LeonixSaveButton | /api/analytics/events | DB write ok |
| Call | phone_click | cta_call_click | trackServiciosListingCta | both | CTA fired |
| SMS/Quote | message_click | cta_quote_sms_click | trackServiciosListingCta | both | CTA fired |
| WhatsApp | whatsapp_click | cta_whatsapp_click | trackServiciosListingCta | both | CTA fired |
| Email | email_click | cta_email_click | trackServiciosListingCta | both | Modal open intent |
| Website | website_click | cta_website_click | trackServiciosListingCta | both | Outbound |
| Directions | directions_click | cta_maps_click | trackServiciosListingCta | both | Maps intent |
| Reviews outbound | cta_click | cta_review_click | trackServiciosListingCta | both | Link click |
| Lead submitted | lead_created | lead_created | inquiry route | ops + mirror | Lead row inserted |

\* `listing_impression` — verify live emission; ops uses `search_results_view` for discovery.

## Dual-table policy (SVC-LAUNCH-INTELLIGENCE-1)

- **Dashboard + admin totals:** `listing_analytics` only.
- **Ops log:** `servicios_analytics_events` for audit/search/filter/provider_manage.
- **Mirror:** `mirrorServiciosOpsEventToListingAnalytics` on ops insert unless `meta.clientListingAnalytics === true`.
- **Leads count:** `servicios_public_leads` for lead inventory; `lead_created` in `listing_analytics` for funnel metrics.

## Preview block

All writers require published listing identity (`sourceId`, live slug, `persistListingEngagement=true`).
