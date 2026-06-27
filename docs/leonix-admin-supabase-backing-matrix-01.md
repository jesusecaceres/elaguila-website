# Leonix Admin Supabase Backing Matrix 01

Audit gate: `ADMIN-SUPABASE-BACKING-MATRIX-01`  
Date: 2026-06-27  
Scope: audit-only Supabase truth gate for the Leonix Admin OS. No UI rebuild, no schema changes, no migrations, no staging.

## 1. Executive Summary

Confirmed real admin systems:
- Core marketplace operations are substantially real: `listings`, `servicios_public_listings`, `restaurantes_public_listings`, `autos_classifieds_listings`, `empleos_public_listings`, `viajes_staged_listings`, `ofertas_locales`, `listing_reports`, and `listing_moderation_reviews` all have migration and/or API evidence.
- Launch Leads, newsletter, media kit, activity log, team roster, support tickets, site sections, magazine issues, promo codes, package entitlements, payment records, Tienda catalog/orders, and category ops have real Supabase backing in repo evidence.
- Servicios owner edit hydration is now real at the owner-scoped API/form level: `/api/clasificados/servicios/my-listing`, `serviciosPublishedToApplicationDraft`, and edit URLs with `listingSlug`/`listingId`/`leonixAdId`.
- En Venta owner edit is real for base `listings` rows via `/dashboard/mis-anuncios/[id]/editar`, owner-scoped `listings` query, and the En Venta dashboard manage card.

Partial systems:
- Admin dashboard, global nav/sidebar, reports, AI review, user support view, category ops, website control, magazine, payment tracker, sales tracker, promo codes, package entitlements, and staff permissions are real but incomplete. They need live Supabase proof and action-proof standardization.
- Viajes has `viajes_staged_listings` and `viajes_public_inquiries`, but affiliate ops tables are missing.
- Website control has `site_section_content`, `site_page_blocks`, and `site_category_config`, but homepage/banners/announcements/themes/category visibility are not complete as final OS modules.

UI-only or future:
- Bug Finder, System Health, System Alerts, Listing Visibility Checker, Business Concierge, affiliate partners/offers/clicks, safe support sessions, homepage/banners/announcements/themes, and final category visibility controls are future architecture only or missing-table features.

Needs migrations later:
- `admin_system_alerts`, `affiliate_partners`, `travel_offers`, `travel_inquiries`, `affiliate_click_events`, `concierge_requests`, `announcements`, `homepage_sections`, `site_banners`, `category_visibility` or `category_settings`, `theme_presets`, `listing_visibility_checks`, `support_view_sessions`, `support_notes`, `promo_code_redemptions`, and a durable application-state snapshot field/table for exact category edit hydration.

Needs live Supabase proof:
- Any table referenced by migrations but not live-probed in this gate.
- Any fallback-coded admin feature that catches schema errors: category queues, payments, promo/package tooling, support rollups, and site content.
- Columns that may exist in migrations but not in production Supabase until applied: `republished_at`, `leonix_ad_id`, `profile_json`, `listing_json`, `admin_promoted`, `leonix_verified`, `moderation_notes`, `follow_up_at`, and newer CRM lifecycle columns.

Live Supabase proof received from the admin/API audit subagent:
- Live core tables were reported present for `listings`, `servicios_public_listings`, `servicios_public_leads`, `servicios_listing_reviews`, `servicios_analytics_events`, `listing_analytics`, `listing_package_entitlements`, `autos_classifieds_listings`, `empleos_public_listings`, `viajes_staged_listings`, `restaurantes_public_listings`, `comida_local_public_listings`, `admin_audit_log`, and `admin_team_members`.
- `listing_moderation_reviews` was reported missing live even though a migration exists locally. Treat AI moderation saved-review proof as `MISSING TABLE` in live Supabase until that migration is applied.
- `listings.admin_promoted`, `listings.leonix_verified`, `servicios_public_listings.promoted`, `empleos_public_listings.admin_promoted`, `empleos_public_listings.leonix_verified`, `viajes_staged_listings.admin_promoted`, and `viajes_staged_listings.leonix_verified` were reported missing live. Treat feature/promote and verify actions on those sources as `MISSING COLUMN` live risks.

Launch-critical risks:
- System health/bug alerts are missing-table and cannot be presented as real.
- Support view requires strict permission/audit design before adding reset or sensitive account tools.
- Reports/complaints have real read backing but incomplete resolve/clear/mark-reviewed proof.
- Servicios exact edit fidelity is partial because existing published rows store public `profile_json`, not a full original application state snapshot.

Recommended next gate: `ADMIN-ACTION-TRUTH-MAP-01`, followed by `ADMIN-SYSTEM-ALERTS-SCHEMA-01`.

## 2. Methodology

Files/directories inspected:
- `docs/leonix-admin-os-master-audit-02.md`
- `package.json`
- `supabase/migrations`
- `app/admin`
- `app/api/admin`
- `app/api/clasificados`
- `app/lib/supabase`
- `app/admin/_lib`
- `app/(site)/dashboard`
- `app/(site)/clasificados/publicar`
- `app/(site)/clasificados/servicios`
- `components/admin`
- `scripts`
- existing verify scripts

Migrations inspected directly or through search:
- `20250312000001_listing_reports.sql`
- `20260402140000_site_section_content.sql`
- `20260402160000_servicios_public_listings.sql`
- `20260408140000_magazine_issues.sql`
- `20260408141000_site_category_config.sql`
- `20260408183000_control_center_extensions.sql`
- `20260409120000_autos_classifieds_listings.sql`
- `20260410120000_admin_audit_log_and_team_invites.sql`
- `20260410180000_viajes_staged_listings.sql`
- `20260410210000_empleos_public_listings.sql`
- `20260411120000_servicios_leads_reviews_analytics.sql`
- `20260423140000_viajes_public_inquiries.sql`
- `20260507143000_site_page_blocks.sql`
- `20260508140000_classifieds_admin_ops_columns.sql`
- `20260509120000_classifieds_republish_capability.sql`
- `20260521120000_listing_package_entitlements.sql`
- `20260522120000_leonix_promo_codes.sql`
- `20260526120000_leonix_payment_records.sql`
- `20260527200000_leonix_lead_capture.sql`
- `20260609120000_leonix_leads_lifecycle.sql`
- `20260611120000_newsletter_media_kit_lifecycle.sql`
- `20260625180000_listing_moderation_reviews.sql`

Commands/searches used:
- `git status --short`
- `git diff --name-only`
- `git diff --cached --name-only`
- ripgrep searches for `create table`, `alter table`, `.from(`, `rpc(`, and feature/table names across admin/API/app/supabase/scripts.
- glob searches for admin routes, API routes, migrations, existing verify scripts, and existing matrix document.
- read-only subagent review of migrations plus admin/API backing evidence, including live Supabase proof reported by the admin/API audit subagent.

Status options:
- `REAL`: migration/table evidence and code read/write path exist.
- `PARTIAL`: some table/action/UI evidence exists, but capability is incomplete or not fully proven.
- `UI-ONLY`: UI exists without durable server/table/action proof.
- `MISSING TABLE`: expected table is not found in migrations or code evidence.
- `MISSING COLUMN`: expected column is absent or only implied by future architecture.
- `MISSING ACTION`: UI/tool expectation exists but no handler/API/server action proof was found.
- `NEEDS LIVE SUPABASE PROOF`: repo evidence exists but live production schema/data was not queried in this gate.
- `FUTURE ARCHITECTURE ONLY`: documented target state, not current buildable capability.

## 3. Confirmed Tables From Migrations

| Table name | Migration file | Purpose | Key columns seen | Related admin route/tool | Confidence |
|---|---|---|---|---|---|
| `admin_audit_log` | `20260410120000_admin_audit_log_and_team_invites.sql` | Admin write trail | `id`, `action`, `target_type`, `target_id`, `meta`, `created_at` | `/admin/activity-log`, action audit helpers | High |
| `admin_team_invites` | `20260410120000_admin_audit_log_and_team_invites.sql` | Staff invite intent | `email`, `role`, `status`, `note` | `/admin/team/users/new` | High |
| `admin_team_members` | `20260408183000_control_center_extensions.sql` | Staff roster/roles | `email`, `display_name`, `role`, `is_active`, `permissions`, `notes` | `/admin/team/roster`, admin access helpers | High |
| `support_tickets` | `20260408183000_control_center_extensions.sql`, `20260408200000_support_tickets_entity_links.sql` | Internal support log | `subject`, `body`, `status`, entity link columns later | `/admin/support`, `/admin/ops` support context | High |
| `listing_reports` | `20250312000001_listing_reports.sql` | Complaint/report queue | `listing_id`, `reporter_id`, `status`, `created_at` | `/admin/reportes`, queue flag context | High |
| `listing_moderation_reviews` | `20260625180000_listing_moderation_reviews.sql` | AI/human review results | `listing_id`, `leonix_ad_id`, `source_table`, `decision`, `raw_result`, `error_message` | AI review and bulk AI review APIs | High |
| `listing_moderation_reviews` live Supabase | live admin/API audit subagent | AI/human review persistence | expected same as migration | AI review and bulk AI review APIs | Missing live table despite migration evidence |
| `listings` | baseline + many alters | Generic classified listings | `id`, `owner_id`, `category`, `status`, `detail_pairs`, `leonix_ad_id`, `profile_json`, `listing_json`, `republished_at` | En Venta/Rentas/BR/Clases/Comunidad/Busco ops | High |
| `servicios_public_listings` | `20260402160000_servicios_public_listings.sql` and alters | Servicios public profiles | `id`, `slug`, `business_name`, `city`, `profile_json`, `owner_user_id`, `leonix_ad_id`, `listing_status`, `moderation_notes` | `/admin/workspace/clasificados/servicios`, owner edit hydration | High |
| `servicios_public_leads` | `20260411120000_servicios_leads_reviews_analytics.sql` | Servicios quote/contact leads | `listing_slug`, contact/message fields, `created_at` | Servicios owner/admin leads | High |
| `servicios_listing_reviews` | `20260411120000_servicios_leads_reviews_analytics.sql` | Servicios moderated reviews | review fields, status | Servicios ops reviews | High |
| `servicios_analytics_events` | `20260411120000_servicios_leads_reviews_analytics.sql` | Servicios engagement | `listing_slug`, event fields | Servicios analytics | High |
| `restaurantes_public_listings` | migrations and alters | Restaurant listings | `slug`, `leonix_ad_id`, `status`, republish columns | Restaurante ops | Medium/high |
| `autos_classifieds_listings` | `20260409120000_autos_classifieds_listings.sql` and alters | Autos listings | `id`, `owner_user_id`, `listing_payload`, `status`, `leonix_ad_id`, republish columns | Autos admin ops | High |
| `empleos_public_listings` | `20260410210000_empleos_public_listings.sql` and alters | Job listings | `id`, `slug`, `lifecycle_status`, `lane`, `leonix_ad_id`, metrics | Empleos ops | High |
| `empleos_job_applications` | `20260410210000_empleos_public_listings.sql` | Job applications | candidate/listing fields | Empleos dashboard/admin | High |
| `viajes_staged_listings` | `20260410180000_viajes_staged_listings.sql` and alters | Viajes staged offers | `id`, `slug`, `owner_user_id`, `listing_json`, `is_public`, `leonix_ad_id`, republish columns | Viajes classified ops | High |
| `viajes_public_inquiries` | `20260423140000_viajes_public_inquiries.sql` | Viajes inquiries | `staged_listing_id`, contact/message fields | Viajes leads | High |
| `comida_local_public_listings` | `20260604120000_comida_local_public_listings.sql` | Local food listings | profile/listing fields | Comida Local ops/dashboard | Medium/high |
| `ofertas_locales` | `20260605120000_ofertas_locales.sql` and alignment migration | Local offers | offer/listing fields | Ofertas Locales ops | High |
| `oferta_local_ai_scan_items` | `20260606120000_create_oferta_local_ai_scan_items.sql` | Offer AI scan candidate items | scan item fields | Ofertas Locales AI review | High |
| `leonix_leads` | `20260609120000_leonix_leads_lifecycle.sql`, `20260610120000_leonix_leads_crm_pipeline.sql` | Unified launch/business leads | `status`, `archived_at`, `deleted_at`, `follow_up_at`, `last_contacted_at` | `/admin/leads/inbox` | High |
| `leonix_newsletter_subscribers` | `20260527200000_leonix_lead_capture.sql`, `20260611120000_newsletter_media_kit_lifecycle.sql` | Newsletter/launch subscribers | `email`, `status`, `business_name`, `archived_at`, `deleted_at` | `/admin/leads/newsletter` | High |
| `leonix_media_kit_leads` | `20260527200000_leonix_lead_capture.sql`, `20260611120000_newsletter_media_kit_lifecycle.sql` | Media kit leads | `name`, `email`, `status`, archive/delete columns | `/admin/leads/media-kit` | High |
| `site_section_content` | `20260402140000_site_section_content.sql` | Website module JSON payloads | `section_key`, `payload`, `updated_at` | `/admin/workspace/*/content`, `/admin/site-sections` | High |
| `site_page_blocks` | `20260507143000_site_page_blocks.sql` | Ordered page content blocks | `page_key`, `locale`, block payload/order fields | Website control foundation | Medium/high |
| `site_category_config` | `20260408141000_site_category_config.sql` | Category config overlays | category/config fields | `/admin/categories`, category visibility foundation | Medium/high |
| `magazine_issues` | `20260408140000_magazine_issues.sql` | Magazine metadata | `year`, `month_slug`, title/url/status fields, `is_featured` | `/admin/workspace/revista`, `/admin/magazine` | High |
| `listing_package_entitlements` | `20260521120000_listing_package_entitlements.sql` | Paid package grants | `category`, `listing_source`, `listing_id`, `package_tier`, `status`, `benefits`, `metadata` | Package entitlement admin/revenue | High |
| `leonix_promo_codes` | `20260522120000_leonix_promo_codes.sql` | Promo/discount/attribution codes | `code`, `status`, `code_type`, `redemption_count`, customer/sales/listing fields | Promo code admin | High |
| `leonix_payment_records` | `20260526120000_leonix_payment_records.sql` | Payment/revenue tracker | Stripe IDs, `payment_status`, amounts, commission fields | Payment tracker/sales tracker | High |
| `tienda_orders` | `20260331180000_tienda_orders.sql` | Store orders | customer/status/order fields | Tienda orders | High |
| `tienda_order_assets` | Tienda order asset migration | Order assets | `order_id`, asset fields | Tienda fulfillment | Medium/high |
| `tienda_catalog_items`, `tienda_catalog_images`, `tienda_catalog_pricing_rules` | Tienda catalog migrations | Product catalog | product/image/pricing fields | Tienda catalog | Medium/high |
| `listing_analytics` | `20250311000000_listing_analytics.sql` and extensions | Listing analytics | listing/event count fields | owner/admin analytics | High |
| `user_liked_listings`, `saved_listings` | saved/liked migrations | Engagement saves/likes | `user_id`, `listing_id` | saved/like rollups | High |
| `messages` | `20250313000001_messages.sql` | Buyer/seller messages | sender/listing/message/read fields | dashboard messages/inquiries | Medium/high |
| `translation_records` | `20260527210000_create_translation_records.sql` | Translation cache/audit | locale/provider/status fields | language audit | Medium/high |

## 4. Admin Tool Backing Matrix

| Feature/tool | Route(s) | UI evidence file(s) | Server/API/action evidence file(s) | Expected table(s) | Table evidence | Expected columns | Missing table/columns | Status | Risk | Recommended next gate |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin dashboard | `/admin` | `app/admin/_components/AdminCommandCenterDashboard.tsx` | `app/admin/_lib/adminDashboardData.ts` | mixed read models | `.from("listings")`, `leonix_leads`, `listing_reports`, category public tables | counts/status snapshots | live data proof | PARTIAL | MEDIUM | Admin data proof |
| Admin global nav/sidebar | `/admin/*` | `adminGlobalNav.ts`, sidebar components | access helpers | none | route config | nav metadata | no table needed | REAL | LOW | Nav architecture |
| Activity log | `/admin/activity-log` | page file | `adminAuditLogServer.ts` | `admin_audit_log` | migration + insert/read helper | action, target, meta | actor/context limited | PARTIAL | MEDIUM | Action truth |
| Settings | `/admin/settings`, `/admin/site-settings` | settings pages | mixed helpers | site/settings tables unclear | partial code only | settings payloads | final settings table | PARTIAL | MEDIUM | Website/System settings gate |
| Language audit | `/admin/workspace/language-audit` | language audit page | translation server cache/provider | `translation_records` | migration/search evidence | locale/status/provider | live proof | PARTIAL | LOW | Language audit proof |
| Launch Leads inbox | `/admin/leads/inbox` | lead row/card components | lead actions/export API | `leonix_leads` | migration + data files | status, archive/delete, notes, follow-up | email send not server-backed | REAL | MEDIUM | Lead action truth |
| Promo leads view | `/admin/leads/inbox?view=promo` | inbox UI | filtered `leonix_leads` | `leonix_leads` | same | inquiry_type/source filters | dedicated table not needed | PARTIAL | MEDIUM | Revenue CRM gate |
| Newsletter subscribers | `/admin/leads/newsletter` | newsletter page/drawer | newsletter actions/export APIs | `leonix_newsletter_subscribers` | migration | email/status/archive/delete | campaign integration | REAL | LOW | CRM lifecycle |
| Media kit requests | `/admin/leads/media-kit` | media kit page | media kit APIs | `leonix_media_kit_leads` | migration | status/archive/delete/notes | sales pipeline handoff | REAL | LOW | CRM lifecycle |
| Lead archive/delete/status | leads routes | lead components | `/api/admin/leads/*/[id]` | lead tables | API evidence | status/archive/delete fields | audit proof uneven | PARTIAL | MEDIUM | Action truth |
| Lead export CSV | leads export routes | export CTAs | `/api/admin/leads/*/export` | lead tables | API evidence | read fields | audit log unknown | REAL | LOW | Export audit |
| Classifieds queue | `/admin/workspace/clasificados` | queue components | `ListingsCategoryOpsQueuePage`, admin APIs | listings + category tables | many `.from()` | status/category/owner/ad id | live proof per category | PARTIAL | HIGH | Action truth |
| Listing detail/edit action | `/admin/workspace/clasificados/listings/[id]/edit` | edit page | Supabase read/update page/API | `listings` | `.from("listings")` | editable generic fields | category exact edit missing | PARTIAL | HIGH | Category edit contracts |
| View public listing | queue rows | row action panels | URL helpers | none | link evidence | public URL fields | visibility proof | PARTIAL | MEDIUM | Listing visibility checker |
| Suspend/pause | queue/category ops | action panels/cards | admin APIs for listings/servicios/autos/restaurantes/viajes | source listing tables | API routes | status/listing_status | confirmation/audit consistency | PARTIAL | HIGH | Action truth |
| Archive | queue/leads/magazine/support | action UI | server actions/APIs | source tables | action files | archived/deleted/status fields | consistency | PARTIAL | HIGH | Action truth |
| Restore | queue/leads | action UI | owner/admin lifecycle helpers | source tables | partial APIs | status/is_published | incomplete for all cats | PARTIAL | MEDIUM | Action truth |
| Soft delete | leads/listings | action UI | lead APIs/listing helpers | lead/listing tables | partial | deleted_at/status | not universal | PARTIAL | MEDIUM | Action truth |
| Permanent delete | magazine draft/catalog images | action UI | revista/catalog actions | `magazine_issues`, catalog image tables | action files | delete row | dangerous confirmation proof | PARTIAL | MEDIUM | Action truth |
| Republish/move to top | queue/category ops | republish UI | `classifiedsRepublishCapability.ts`, APIs | source listing tables | republish migration | `republished_at`, `republish_count`, source fields | live proof | PARTIAL | HIGH | Republish proof |
| Feature/promote | category ops | ops cards | admin APIs | category tables | admin ops columns migration | `promoted`/`admin_promoted` | paid entitlement link | PARTIAL | HIGH | Revenue/action truth |
| Verify Leonix | category ops | ops cards | admin APIs | category tables | admin ops columns migration | `leonix_verified` | policy/proof | PARTIAL | HIGH | Verify policy gate |
| Reports/complaints | `/admin/reportes` | reports table | reports page + queue context | `listing_reports` | migration + `.from()` | status/report fields | resolve/mark reviewed missing | PARTIAL | HIGH | Reports action gate |
| AI review | queue actions | AI summary/actions | `/api/admin/clasificados/listings/[id]/ai-review` | `listing_moderation_reviews` | migration + API, but live table reported missing | decision/raw_result/model | live table missing | MISSING TABLE | HIGH | Apply AI review migration gate |
| Bulk AI review | queue bulk action | bulk UI | `/api/admin/clasificados/listings/ai-review/bulk` | `listing_moderation_reviews` | migration + API, but live table reported missing | batch reviews | live table missing | MISSING TABLE | MEDIUM | Apply AI review migration gate |
| Clear flag / mark reviewed | reports/queue | implied by review UX | no clear universal API found | `listing_reports`, reviews | partial | status/reviewed_at | action missing | MISSING ACTION | HIGH | Reports action gate |
| Servicios admin ops | `/admin/workspace/clasificados/servicios` | Servicios admin cards | `actions.ts`, `/api/admin/servicios/listings/[id]` | `servicios_public_listings`, reviews, leads | migration + actions | status/promoted/verified/republish | live proof | PARTIAL | MEDIUM | Servicios ops proof |
| Servicios owner dashboard edit/hydration | `/dashboard/mis-anuncios?cat=servicios`, `/clasificados/publicar/servicios?edit=1` | dashboard card/form banner | `/api/clasificados/servicios/my-listing`, mapper, publish slug prime | `servicios_public_listings` | API + `.from()` | `id`, `slug`, `leonix_ad_id`, `profile_json`, owner | exact `application_state_json` missing | PARTIAL | HIGH | Category application snapshot |
| Autos admin ops | `/admin/workspace/clasificados/autos` | autos ops page/card | `/api/admin/autos/listings/[id]` | `autos_classifieds_listings` | migration/API | status/promoted/verified/republish | live proof | PARTIAL | MEDIUM | Autos action proof |
| Restaurantes admin ops | `/admin/workspace/clasificados/restaurantes` | restaurant ops page | `/api/admin/restaurantes/listings/[id]` | `restaurantes_public_listings` | migration/API evidence | status/leonix_ad_id/republish | live proof | PARTIAL | MEDIUM | Restaurant action proof |
| Viajes classified ops | `/admin/workspace/clasificados/travel`, `/admin/clasificados/viajes` | viajes pages | `/api/admin/viajes/*` | `viajes_staged_listings`, `viajes_public_inquiries` | migrations/API | listing_json/lifecycle/owner/ad id | affiliate tables missing | PARTIAL | HIGH | Viajes affiliate schema |
| En Venta owner edit flow | `/dashboard/mis-anuncios/[id]/editar` | `EnVentaListingManageCard`, edit page | owner-scoped browser Supabase read | `listings` | edit page `.from("listings").eq("owner_id")` | base listing fields | exact modern app snapshot partial | PARTIAL | MEDIUM | Category snapshot gate |
| Other category admin pages | many `/admin/workspace/clasificados/*` | category pages | generic queue helpers | `listings` or category tables | partial | per-category status/ad id | table mismatch risk | PARTIAL | HIGH | Category proof sweep |
| Users list/search | `/admin/usuarios` | user list pages | `adminProfilesQuery.ts` | `profiles` | `.from("profiles")` | email/phone/display_name | live proof | REAL | MEDIUM | Support view gate |
| User profile page | `/admin/usuarios/[id]` | user detail page/actions | user rollups/actions | `profiles`, listings, reports, orders, entitlements | `.from()` evidence | many links/statuses | sensitive action audit | PARTIAL | HIGH | Support view |
| User by email/phone/ID/Leonix Ad ID | `/admin/ops`, user pages | ops lookup UI | `adminOpsSupportContext`, `adminAdSearch` | profiles + listing tables | helper evidence | search fields/ad ids | live proof | PARTIAL | HIGH | Support lookup proof |
| Password reset support | user/security pages | reset link copy | Supabase Auth only, no admin reset action | Auth | no admin reset server action | reset audit fields | action missing | MISSING ACTION | HIGH | Support view schema |
| Safe support view | `/admin/usuarios/[id]`, `/admin/ops` | safe support copy | support context/actions | profiles/support/listings/orders | partial | reason/session/notes absent | `support_view_sessions`, `support_notes` missing | PARTIAL | CRITICAL | Support view schema |
| Staff notes | team/support | notes fields | roster/actions | `admin_team_members`, `support_tickets` | migrations | notes/body | per-user support notes missing | PARTIAL | MEDIUM | Support notes schema |
| Team roster | `/admin/team/roster` | roster page | `adminTeamActions.ts` | `admin_team_members`, invites | migration/actions | role/is_active/permissions | final role taxonomy | REAL | MEDIUM | Permissions truth |
| Create staff user | `/admin/team/users/new` | create page | provisioning/team actions | Auth + `admin_team_members` | actions | email/role | email invite delivery partial | PARTIAL | HIGH | Staff provisioning proof |
| Disable staff | roster | roster actions | `adminTeamActions.ts` | `admin_team_members` | update evidence | `is_active` | confirmation/audit proof | PARTIAL | HIGH | Permissions/action truth |
| Role permissions | admin shell/access helpers | access checks | `adminAccessControl.ts`, `staffAdminAccess.ts` | `admin_team_members` | `.from()` evidence | role/permissions jsonb | final role names mismatch | PARTIAL | HIGH | Permissions truth |
| Site sections | `/admin/site-sections`, `/admin/workspace/*/content` | workspace pages | section actions/data | `site_section_content` | migration + data helper | `section_key`, `payload` | rollback/revisions missing | PARTIAL | MEDIUM | Website control schema |
| Magazine manager | `/admin/workspace/revista`, `/admin/magazine` | revista actions/pages | `revistaIssueRegistryActions`, upload API | `magazine_issues` | migration/actions | current issue fields | final field names differ | PARTIAL | MEDIUM | Magazine manager |
| Homepage manager | workspace home | home content page | site section actions | `site_section_content`, `site_page_blocks` | partial | payload/block fields | dedicated homepage table missing | PARTIAL | MEDIUM | Website control |
| Banners | future | none/future | none | `site_banners` | missing | banner fields | missing table | MISSING TABLE | MEDIUM | Website control schema |
| Announcements | future | none/future | none | `announcements` | missing | announcement fields | missing table | MISSING TABLE | MEDIUM | Website control schema |
| Category visibility | `/admin/categories` partial | category config UI | `siteCategoryConfigActions.ts` | `site_category_config` | migration/action | category config | final visibility rules incomplete | PARTIAL | HIGH | Category visibility gate |
| Themes | future | none/future | none | `theme_presets` | missing | theme tokens | missing table | MISSING TABLE | MEDIUM | Theme schema |
| Footer/contact/social content | workspace content | contacto/content pages | site section actions | `site_section_content`, `site_page_blocks` | migration/action | payload/block fields | preview/rollback | PARTIAL | MEDIUM | Website control |
| Promo codes | `/admin/workspace/promo-codes`, `/admin/team/promo-codes` | promo pages | promo actions/data | `leonix_promo_codes` | migration/actions | code/status/type/redemptions | redemption table missing | PARTIAL | HIGH | Promo backing |
| Promo code redemptions | future | none | none | `promo_code_redemptions` | missing | redeem records | missing table | MISSING TABLE | HIGH | Promo redemption schema |
| Package entitlements | `/admin/workspace/package-entitlements` | entitlement pages | entitlement actions | `listing_package_entitlements` | migration/actions | category/listing/tier/status | live payment linkage | PARTIAL | HIGH | Entitlement proof |
| Payment tracker | `/admin/workspace/payment-tracker` | payment page | payment record helpers | `leonix_payment_records` | migration/read evidence | Stripe/payment/amount/status | live Stripe not complete | PARTIAL | HIGH | Payment tracker |
| Sales tracker | `/admin/workspace/sales-tracker`, `/admin/team/sales-tracker` | sales pages | revenue helpers | `leonix_payment_records`, promo codes | migration/read evidence | sales_rep/commission | payout ledger absent | PARTIAL | HIGH | Sales tracker |
| Featured placement | category ops/revenue | entitlement badges | entitlement overlay helpers | package entitlements + source tables | migration/helpers | benefits/metadata/promoted | placement proof per category | PARTIAL | HIGH | Placement proof |
| Verify request revenue | Servicios verified interest | form/profile opsMeta | Servicios publish/profile | `servicios_public_listings.profile_json` | code evidence | `opsMeta.leonixVerifiedInterest` | revenue workflow missing | PARTIAL | MEDIUM | Verify revenue gate |
| Republish eligibility | queues/dashboard | republish UI | republish capability helpers | source listing tables | migration | republish fields | live proof | PARTIAL | MEDIUM | Republish proof |
| Revenue opportunity finder | future | planned cards | none | future read model | missing | opportunity fields | missing action/table | FUTURE ARCHITECTURE ONLY | MEDIUM | Revenue cockpit |
| Affiliate partners | Viajes affiliate pages | affiliate UI/mock | mock/form types | `affiliate_partners` | missing | partner fields | missing table | MISSING TABLE | HIGH | Viajes affiliate schema |
| Travel offers | Viajes offer pages | offers UI/mock | partial staged listings | `travel_offers` | missing | offer fields | missing table | MISSING TABLE | HIGH | Viajes affiliate schema |
| Travel inquiries | Viajes leads | inquiry route | `/api/clasificados/viajes/inquiry` | `viajes_public_inquiries`, future `travel_inquiries` | partial | inquiry fields | final table missing | PARTIAL | MEDIUM | Viajes affiliate schema |
| Affiliate click events | Viajes future | no durable proof | none | `affiliate_click_events` | missing | click fields | missing table | MISSING TABLE | MEDIUM | Affiliate click schema |
| Viajes health checks | future | health planned | none | multiple future tables | missing | health status | missing table/action | FUTURE ARCHITECTURE ONLY | MEDIUM | Viajes health |
| Bug Finder | future `/admin/bug-finder` | planned card only | none | `admin_system_alerts` | missing | alert fields | missing table | MISSING TABLE | CRITICAL | System alerts schema |
| System Health | future `/admin/system-health` | planned card only | none | `admin_system_alerts` | missing | severity/status/area | missing table | MISSING TABLE | CRITICAL | System alerts schema |
| System alerts | future | planned | none | `admin_system_alerts` | missing | alert workflow | missing table/action | MISSING TABLE | CRITICAL | System alerts schema |
| Integration/email/AI/Supabase/storage health | future | planned | none | system alert/integration tables | missing | health fields | missing tables | FUTURE ARCHITECTURE ONLY | HIGH | System health schema |
| Broken link scanner | future | none | none | `broken_link_checks` or alert model | missing | URL/status fields | missing table | FUTURE ARCHITECTURE ONLY | MEDIUM | System health schema |
| Listing visibility checker | future | planned | none | `listing_visibility_checks` or computed read | missing | source/status/public URL/search proof | missing table/action | FUTURE ARCHITECTURE ONLY | CRITICAL | Visibility checker |
| Concierge requests/statuses/assignment/notes/follow-up | future | planned | none | `concierge_requests` | missing | request/status/assigned_to/follow_up_at | missing table | MISSING TABLE | HIGH | Concierge schema |
| Client Growth Center tie-in | future | planned | none | concierge + profiles + package/payment | partial/missing | client links | missing model | FUTURE ARCHITECTURE ONLY | MEDIUM | Concierge schema |

## 5. Missing Table Register

| Missing/future table | Needed for | Why needed | Status |
|---|---|---|---|
| `admin_system_alerts` | Bug Finder/System Health/email alerts | Durable alert queue with severity/status/dedupe/email timestamps | MISSING TABLE |
| `affiliate_partners` | Viajes Affiliate Ops | Partner records, contacts, commission terms, status | MISSING TABLE |
| `travel_offers` | Viajes offers | Affiliate/partner offer catalog separate from staged classifieds | MISSING TABLE |
| `travel_inquiries` | Viajes affiliate leads | Final affiliate lead table; current `viajes_public_inquiries` only partially covers staged listings | MISSING TABLE |
| `affiliate_click_events` | Viajes click tracking | Attribution, conversion, broken affiliate link monitoring | MISSING TABLE |
| `concierge_requests` | Business Concierge | Request intake, packages, assignment, status/follow-up | MISSING TABLE |
| `announcements` | Website Control | Controlled site notices and campaigns | MISSING TABLE |
| `homepage_sections` or equivalent | Homepage manager | Structured homepage modules beyond generic JSON payloads | MISSING TABLE/PARTIAL via `site_section_content` |
| `banners` or `site_banners` | Banners | Durable banner scheduling/placement/targeting | MISSING TABLE |
| `category_visibility` or `category_settings` | Category visibility | Final category enable/disable and visibility rules | PARTIAL via `site_category_config` |
| `theme_presets` | Themes | Approved Leonix theme token sets and publish history | MISSING TABLE |
| `listing_visibility_checks` or equivalent | Listing Visibility Checker | Historical visibility proof and diagnostics | MISSING TABLE |
| `listing_moderation_reviews` live table | AI moderation proof | Local migration exists, but live Supabase was reported missing this table | MISSING TABLE in live Supabase |
| `support_view_sessions` or equivalent | Safe support view | Reason-required support access sessions with audit trail | MISSING TABLE |
| `support_notes` | Staff/support notes | Per-user/listing support notes separate from tickets | MISSING TABLE |
| `promo_codes` | Promo codes | Generic name not used; current real table is `leonix_promo_codes` | NOT NEEDED if canonical remains `leonix_promo_codes` |
| `promo_code_redemptions` | Promo redemption proof | Redemption history, one-time enforcement, customer/listing attachment | MISSING TABLE |
| `package_entitlements` | Package entitlements | Generic name not used; current real table is `listing_package_entitlements` | NOT NEEDED if canonical remains `listing_package_entitlements` |
| `payment_records` | Payments | Generic name not used; current real table is `leonix_payment_records` | NOT NEEDED if canonical remains `leonix_payment_records` |
| `sales_pipeline` or `sales_tracker` | Sales CRM | True deal pipeline, rep assignments, stages, commissions/payouts | MISSING TABLE |

## 6. Missing Column Register

| Existing table/tool | Suspected missing column(s) | Why needed | Status |
|---|---|---|---|
| `servicios_public_listings` | `application_state_json` | Exact owner edit hydration for all original form fields instead of lossy `profile_json` inverse mapping | MISSING COLUMN |
| `listings` | `application_state_json` | Future exact edit/repost for En Venta and generic categories | MISSING COLUMN |
| `listing_reports` | `assigned_to`, `priority`, `resolved_at`, `resolved_by`, `resolution_note`, `reviewed_at` | Reports need complete moderation lifecycle | MISSING COLUMN/NEEDS LIVE PROOF |
| `listing_moderation_reviews` | `assigned_to`, human override status, notification fields | AI review is stored, but human workflow is partial | MISSING COLUMN/PARTIAL |
| `admin_audit_log` | `actor_id`, `actor_email`, `ip_hash`, `reason` | Stronger audit/legal support for sensitive tools | MISSING COLUMN |
| `support_tickets` | `user_id`, `listing_id`, `assigned_to`, `priority`, `follow_up_at` | Basic tickets exist; full support workflow needs richer links | PARTIAL, some entity-link migration may cover part |
| `admin_team_members` | final role taxonomy, `disabled_at`, `created_by`, `updated_by` | Final permissions and staff lifecycle | MISSING COLUMN/NEEDS LIVE PROOF |
| `leonix_leads` | `assigned_to`, `priority`, `follow_up_at`, `last_contacted_at` | CRM pipeline; some CRM migration adds follow-up fields | NEEDS LIVE SUPABASE PROOF |
| `leonix_promo_codes` | redemption records relationship | Current table tracks count but not durable per-redemption rows | MISSING TABLE/COLUMN |
| `listing_package_entitlements` | payment/payment_record link clarity, redeemed_by/attached_by | Sales pre-ad grant and payment alignment | PARTIAL |
| `leonix_payment_records` | payout ledger fields | Payment tracker exists but payout/commission lifecycle is not full | PARTIAL |
| `site_section_content` | `created_by`, `updated_by`, `published_at`, `archived_at`, revision/rollback fields | Website Control needs preview/rollback/audit | MISSING COLUMN |
| `site_page_blocks` | publication/revision fields | Page blocks are a foundation but not full workflow | MISSING COLUMN |
| `magazine_issues` | final aliases `slug`, `language`, `issue_date`, `created_by`, `updated_by` | Existing fields differ from future manager terminology | MISSING COLUMN/PARTIAL |
| `viajes_staged_listings` | affiliate partner/offer references | Classified Viajes is not affiliate ops | MISSING COLUMN |
| source listing tables | `featured_until`, `verified_at`, `suspended_at`, `report_count`, `ai_review_status` | Stronger ops/status surfaces | MISSING COLUMN/NEEDS LIVE PROOF |
| `listings` live Supabase | `admin_promoted`, `leonix_verified` | Feature/promote and Verify Leonix actions target these generic listing columns | MISSING COLUMN live |
| `servicios_public_listings` live Supabase | `promoted` | Servicios feature/remove-feature action target | MISSING COLUMN live |
| `empleos_public_listings` live Supabase | `admin_promoted`, `leonix_verified` | Empleos feature and verify actions target these columns | MISSING COLUMN live |
| `viajes_staged_listings` live Supabase | `admin_promoted`, `leonix_verified` | Viajes feature and verify actions target these columns | MISSING COLUMN live |

Checked example fields:
- `leonix_ad_id`: found on major classified tables by migration, needs live proof.
- `owner_id`/`owner_user_id`: found across `listings`/category tables.
- `category_slug`: found in `listing_moderation_reviews`; category varies elsewhere.
- `source_table`: found in `listing_moderation_reviews`; useful for visibility checker.
- `status`: broadly present; status taxonomies vary.
- `archived_at`: found in leads/newsletter/media kit; not universal.
- `suspended_at`: not found as standard column.
- `republished_at`: migration exists for major classified tables.
- `featured_until`: not found as standard column.
- `verified_at`: not found as standard column.
- `ai_review_status`: not found as standard listing column; reviews table stores decisions.
- `report_count`: not found as denormalized standard column.
- `assigned_to`, `priority`, `follow_up_at`: partially found in CRM/future needs, not universal.
- `created_by`, `updated_by`, audit fields: present in some revenue/payment tables, missing elsewhere.
- `profile_json`: found on `listings` and Servicios; other category support varies.
- `application_state_json`: missing; recommended for exact edit hydration.

## 7. Action Backing Matrix

| Action | Route/component where action appears | API/server action exists | Table touched | Required permission | Audit log exists | Confirmation exists | Error handling exists | Action proof/banner exists | Status | Next fix |
|---|---|---|---|---|---|---|---|---|---|---|
| View public | Classified queue/cards/dashboard cards | Yes, link only | None | admin/session where shown | No | No | Link may 404 | Unknown | PARTIAL | Visibility checker |
| Edit listing | Admin listing edit, En Venta edit, Servicios edit | Yes for selected flows | `listings`, `servicios_public_listings` read/update via publish | owner/admin/moderator | Partial | Partial | Yes in pages/APIs | Partial | PARTIAL | Category edit contracts |
| Open owner/user | queue/user tools | Yes, link/read pages | `profiles` | support/admin | No | No | Partial | No | REAL/PARTIAL | Support view |
| Contact owner/seller | queue/leads | Partial mailto/copy | None/messages for inquiries | support/admin | No | No | Partial | No | PARTIAL | Label as mailto/copy |
| Archive | leads/magazine/listings/support | Yes in several actions | source tables | admin/moderator | Partial | Partial | Yes | Partial | PARTIAL | Standardize |
| Restore | leads/listings | Partial | source tables | admin/moderator | Partial | Partial | Yes | Partial | PARTIAL | Action truth |
| Soft delete | leads/listings | Partial | source tables | admin/moderator | Partial | Yes in some | Yes | Partial | PARTIAL | Action truth |
| Permanent delete | magazine/catalog images | Partial | `magazine_issues`, catalog image tables | admin/content/store | Partial | Yes expected | Yes | Partial | PARTIAL | Confirm/audit proof |
| Republish | admin queue/category ops | Yes for major listing sources | source listing tables | admin/moderator | Partial | Partial | Yes | Partial | PARTIAL | Republish proof |
| Move to top | republish alias | Same as republish | source listing tables | admin/moderator | Partial | Partial | Yes | Partial | PARTIAL | Naming standard |
| Feature/promote | category ops | Yes in several APIs | source tables | admin/sales | Partial | Unknown | Yes | Partial | PARTIAL | Monetization proof |
| Verify Leonix | category ops | Yes in several APIs | source tables | admin/moderator | Partial | Unknown | Yes | Partial | PARTIAL | Verification policy |
| Suspend/pause | category ops/dashboard | Yes in several APIs | source tables | admin/owner | Partial | Partial | Yes | Partial | PARTIAL | Standard confirm/audit |
| Mark reviewed | reports/reviews expected | No universal action found | `listing_reports`, `listing_moderation_reviews` | moderator | Unknown | Unknown | Unknown | Unknown | MISSING ACTION | Reports action gate |
| Clear flag | queue/reports expected | No universal action found | `listing_reports`, source listings | moderator | Unknown | Unknown | Unknown | Unknown | MISSING ACTION | Reports action gate |
| Run AI review | queue action | Yes | `listing_moderation_reviews` | admin/moderator | Partial | No | Yes | Yes summary | PARTIAL | Live provider proof |
| Bulk AI review | queue bulk | Yes | `listing_moderation_reviews` | admin/moderator | Partial | Yes recommended | Yes | Yes counts | PARTIAL | Rate/dedupe proof |
| Assign staff | support/moderation future | No | future columns/tables | owner/admin | No | No | No | No | MISSING ACTION | Staff assignment schema |
| Export CSV | lead pages | Yes | lead tables read | admin/sales | Unknown | No | Yes | Download | REAL/PARTIAL | Add audit |
| Send password reset | support future | No admin action | Supabase Auth | support/admin | No | No | No | No | MISSING ACTION | Support view schema |
| Publish magazine | revista | Yes | `magazine_issues` | content/admin | Partial | Partial | Yes | redirect/proof | REAL/PARTIAL | Magazine action proof |
| Archive magazine | revista | Yes | `magazine_issues` | content/admin | Partial | Partial | Yes | redirect/proof | REAL/PARTIAL | Standardize |
| Activate promo code | promo code pages | Yes/partial lifecycle | `leonix_promo_codes` | sales/admin | Partial | Unknown | Yes | Partial | PARTIAL | Promo action proof |
| Disable staff | roster | Yes | `admin_team_members` | owner/admin | Partial | Partial | Yes | Partial | PARTIAL | Permissions gate |
| Resolve alert | future | No | `admin_system_alerts` | owner/admin | No | No | No | No | MISSING TABLE | System alerts schema |
| Owner Servicios edit hydration | dashboard + publish form | Yes | `servicios_public_listings` | authenticated owner | No write until publish | Not needed for load | Yes | Edit-mode banner | PARTIAL | Application snapshot |
| Owner En Venta edit hydration | `/dashboard/mis-anuncios/[id]/editar` | Yes | `listings` | authenticated owner | No/partial | Edit lock | Yes | Edit page | PARTIAL | Application snapshot |

## 8. Security / RLS / Permission Notes

Admin auth/helper evidence:
- `app/admin/_lib/leonixAdminGate.ts`
- `app/admin/_lib/adminAuthBoundary.ts`
- `app/admin/_lib/adminAccessControl.ts`
- `app/admin/_lib/staffAdminAccess.ts`
- `app/lib/supabase/server` helpers are used by admin server code.

Staff role helper evidence:
- `admin_team_members` migration has `role`, `permissions`, and `is_active`.
- Admin access helpers read `admin_team_members` and enforce owner/staff rules.
- Final role taxonomy still differs from requested `owner/admin/moderator/sales/content_manager/support/viewer`.

Service-role usage:
- Server/admin actions use service role helpers (`getAdminSupabase`) for privileged reads/writes.
- This is correct for admin-only tooling, but every dangerous write needs explicit app-level permission checks because RLS policies do not protect service-role access.

RLS concerns:
- Many admin tables enable RLS with no broad anon/auth policies and rely on service role. This is acceptable only for trusted server routes.
- Any future browser client direct access to admin tables would be unsafe unless policies are added.

Dangerous actions needing role protection:
- Staff disable/create, user enable/disable, listing suspend/archive/restore, permanent delete, promo/package/payment creation, magazine publish/archive, support reset links, and future alert resolve.

Support view legal/security concerns:
- No uncontrolled impersonation.
- Reason required for sensitive support view sessions.
- Audit log required.
- No passwords visible.
- No raw cards/payment secrets/tokens.
- Password reset must be a sent link only; never expose passwords.

Owner-scoped Servicios edit endpoint evidence:
- `/api/clasificados/servicios/my-listing/route.ts` validates bearer session with Supabase Auth, filters `servicios_public_listings` by `owner_user_id`, and returns `profile_json` for hydration.

Owner-scoped En Venta edit evidence:
- `/dashboard/mis-anuncios/[id]/editar/page.tsx` reads `listings` by `id` and `owner_id` from the current authenticated user before editing.

## 9. Supabase Error Risk Map

Most likely schema/runtime error zones:
- Missing future tables: `admin_system_alerts`, `affiliate_partners`, `travel_offers`, `affiliate_click_events`, `concierge_requests`, website control tables.
- Live missing table despite local migration: `listing_moderation_reviews`; AI review APIs may fail to persist proof until migration is applied to production.
- Live missing admin action columns: `listings.admin_promoted`, `listings.leonix_verified`, `servicios_public_listings.promoted`, `empleos_public_listings.admin_promoted`, `empleos_public_listings.leonix_verified`, `viajes_staged_listings.admin_promoted`, and `viajes_staged_listings.leonix_verified`.
- Missing columns in production even when migrations exist locally: `leonix_ad_id`, `republished_at`, `profile_json`, `listing_json`, `admin_promoted`, `leonix_verified`, `moderation_notes`.
- UI-only features: Bug Finder, System Health, Concierge, affiliate partner/click analytics, final Website Control modules.
- Table rename mismatch: `promo_codes` vs `leonix_promo_codes`, `package_entitlements` vs `listing_package_entitlements`, `payment_records` vs `leonix_payment_records`.
- Route expects data not present: admin category pages with optional/fallback schemas, analytics summaries, payment/package rollups.
- API action expects column not migrated: category ops promoted/verified/republish columns.
- Live Supabase proof needed: every service-role path with catch/fallback unavailable states.
- Published row only stores display profile but not full application state: Servicios exact edit hydration and future category re-editing.

## 10. Recommended Migration Gates

Do not create migrations in this gate. This audit document does not require any migration file to exist, and it does not create schema. Recommended order:
1. `ADMIN-SYSTEM-ALERTS-SCHEMA-01`
2. `ADMIN-ACTION-TRUTH-MAP-01`
3. `ADMIN-VIAJES-AFFILIATE-SCHEMA-01`
4. `ADMIN-CONCIERGE-SCHEMA-01`
5. `ADMIN-WEBSITE-CONTROL-SCHEMA-01`
6. `ADMIN-PROMO-CODES-BACKING-01`
7. `ADMIN-PACKAGE-ENTITLEMENTS-01`
8. `ADMIN-PAYMENT-TRACKER-01`
9. `ADMIN-SUPPORT-VIEW-SCHEMA-01`
10. `ADMIN-LISTING-VISIBILITY-CHECKER-01`
11. `CATEGORY-APPLICATION-STATE-SNAPSHOT-01`

## 11. Final Recommendation

Build `ADMIN-ACTION-TRUTH-MAP-01` next. The Supabase table truth is strong enough to prove that many admin surfaces are real or partial, but the highest launch risk is action ambiguity: buttons need confirmed handlers, permission checks, confirmation behavior, audit writes, failure states, and notification rules before major Admin OS UI expansion.

After the action truth map, create `ADMIN-SYSTEM-ALERTS-SCHEMA-01` because Bug Finder/System Health is currently impossible without `admin_system_alerts`.

## Final True/False Audit

- git status checked: TRUE
- no git add: TRUE
- no staging: TRUE
- no commit: TRUE
- no push: TRUE
- no schema changed: TRUE
- no migrations added: TRUE
- no admin redesign: TRUE
- no public pages changed: TRUE
- master audit doc inspected: TRUE
- migrations inspected: TRUE
- admin tools inspected: TRUE
- Supabase matrix created: TRUE
- action backing matrix created: TRUE
- missing table register created: TRUE
- missing column register created: TRUE
- Servicios owner edit hydration documented: TRUE
- En Venta owner edit hydration documented: TRUE
- verifier added: PENDING
- verifier passed: PENDING
- build passed: PENDING
