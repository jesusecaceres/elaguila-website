# Admin Action QA and Live Schema Proof 01

Gate: `ADMIN-ACTION-QA-AND-LIVE-SCHEMA-PROOF-01`  
Date: 2026-06-29  
Scope: Admin OS action reliability only. No public Clasificados output polish, no Stripe work, no schema changes, no migrations.

## 1. Executive Summary

This gate confirms that the Admin OS has real operating actions in the core July 1 surfaces, but not every action is equally launch-safe.

Actions proven launch-safe for July 1:
- Read-only navigation/inspection: View public, Edit listing entry, Manage listing entry, View in results, Lead view, User search, User detail/support view.
- Proven write actions with existing API/server-action paths and visible proof: generic `public.listings` Suspend, Restore, Archive, Republish where eligible, soft Delete, Permanent delete from the bulk removed workflow, Run AI review, Bulk AI review, lead status/archive/delete, team invite/create/disable, magazine issue lifecycle, Tienda order status, and Tienda catalog edit/publish.

Partial actions:
- Category-specific feature/verify/republish actions across Servicios, Autos, Restaurantes, Empleos, Viajes, and generic listings because column availability and behavior vary by source table.
- Reports/moderation actions such as Mark reviewed and Clear flag because they have `listing_reports` update proof, but no single universal queue action contract for every flag source.
- Website settings and site section saves because they write real content/settings paths, but rollback/revision proof is not complete.

Needs live schema proof:
- Feature/promote and Verify Leonix wherever they depend on `admin_promoted`, `promoted`, or `leonix_verified`.
- Run AI review and Bulk AI review because they depend on `listing_moderation_reviews` and provider/runtime configuration.
- Republish / Move to top wherever category-specific republish columns or generated sort fields must be present live.

Needs confirmation/proof banners:
- The main classifieds queue has confirmations and query-string success/error proof.
- Generic listing row lifecycle actions were hardened in this gate with confirmations for suspend, restore, republish, feature, remove featured, verify, and remove verified.
- Magazine issue forms, Tienda order status buttons, and some catalog image/rule deletes still rely on server-action redirect/error behavior and need a client confirmation/proof-banner pass.

Should remain disabled or warning-labeled:
- Settings stub actions and Draw/stub actions.
- System health, bug finder, payment readiness, fake AI readiness, and revenue cockpit claims.
- Any schema-dependent action not live-proven after migrations are applied.

Highest launch risks:
- Operators treating Feature/Verify/AI review as fully proven before production schema and provider proof.
- Destructive or visibility-changing server-action forms that do not yet share one confirmation/proof component.
- Uneven `admin_audit_log` coverage for leads exports, newsletter/media-kit lifecycle, category-specific admin APIs, and Tienda catalog helper actions.

## 2. Action Matrix

| Action label | Where it appears | Component/file | API/server action file | Table touched | Audit log | Confirmation | Success proof | Error proof | Schema dependency | Status | Launch recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| View public | Admin listing rows, category ops, Tienda catalog, magazine preview | `app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx`; `app/admin/(dashboard)/tienda/catalog/[id]/page.tsx`; `app/admin/(dashboard)/workspace/revista/page.tsx` | Link only | none | No | No | Browser navigation | Browser/route error | Public route/data availability | REAL | Launch-safe read-only inspection. |
| Edit listing | Generic queue edit link | `app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx` | `app/admin/actions.ts` (`updateListingCoreFieldsStaffAdminAction`) | `listings` | Yes | Form submit, no extra confirm | Redirect/page state | Throws/route error | `listings` columns only | PARTIAL | Safe for generic fields; category-exact edit fidelity remains partial. |
| Manage listing | Dashboard/owner/admin entry points | Admin queue/dashboard cards | Inner actions only | none until inner action | Depends on inner action | Depends on inner action | Depends on inner action | Depends on inner action | Category support varies | PARTIAL | Launch-safe as a navigation/toolbox label. |
| View in results | Admin/category row links | Admin CTA components | Link only | none | No | No | Browser navigation | Browser/route error | Results route/sort proof | PARTIAL | Safe as inspection; visibility checker still needed. |
| Suspend | Generic and category listing rows | `ClassifiedAdminRowActions.tsx` | `/api/admin/clasificados/listings/[id]` and category API routes | source listing status fields | Yes for `listings`; partial category coverage | Yes after this gate for shared row actions | Yes via action-status proof banner | Yes via action-status proof banner | Source status columns | PARTIAL | Launch-safe for generic queue; category-specific proof still required. |
| Restore | Generic and category listing rows | `ClassifiedAdminRowActions.tsx` | `/api/admin/clasificados/listings/[id]` and category API routes | source listing status fields | Yes for `listings`; partial category coverage | Yes after this gate for shared row actions | Yes via action-status proof banner | Yes via action-status proof banner | Source status columns | PARTIAL | Launch-safe for generic queue; category-specific proof still required. |
| Archive | Generic and category listing rows; leads; magazine | `ClassifiedAdminRowActions.tsx`; lead clients; revista page | listing API, lead APIs, `magazineIssuesActions.ts` | source row status/archive fields | Yes for listings/magazine; partial leads | Yes for listing rows and lead clients; missing on magazine server form | Yes for queue and server redirects | Yes for queue and server redirects | Source archive/status columns | PARTIAL | Launch-safe where confirmation/proof exists; magazine needs client confirmation. |
| Republish | Generic/category listing rows | `ClassifiedAdminRowActions.tsx` | `/api/admin/clasificados/listings/[id]` and category API routes | `republished_at`, `republish_count`, source republish fields | Yes for `listings`; partial category coverage | Yes after this gate | Yes via action-status proof banner | Yes via action-status proof banner | republish columns live | NEEDS LIVE PROOF | Warning-labeled; use only after live category proof. |
| Move to top | Same as Republish | `ClassifiedAdminRowActions.tsx` | same as Republish | same as Republish | Same | Same | Same | Same | same as Republish | NEEDS LIVE PROOF | Treat as Republish, not a separate fully proven action. |
| Feature | Generic/category listing rows | `ClassifiedAdminRowActions.tsx` | `/api/admin/clasificados/listings/[id]` and category API routes | `admin_promoted` / `promoted` | Yes for `listings`; partial category coverage | Yes after this gate | Yes via action-status proof banner | Yes via action-status proof banner | promote columns live | NEEDS LIVE PROOF | Warning-labeled; needs live schema/payment-package alignment. |
| Remove featured | Generic/category listing rows | `ClassifiedAdminRowActions.tsx` | same as Feature | `admin_promoted` / `promoted` | Yes for `listings`; partial category coverage | Yes after this gate | Yes via action-status proof banner | Yes via action-status proof banner | promote columns live | NEEDS LIVE PROOF | Same as Feature. |
| Verify Leonix | Generic/category listing rows; Servicios card | `ClassifiedAdminRowActions.tsx`; Servicios ops components | listing/category API routes; `servicios/actions.ts` | `leonix_verified` | Yes for `listings`; Servicios uses analytics event, no audit log | Yes after this gate for shared row actions | Yes via action-status or server refresh | Yes via action-status/server errors | verification columns live | NEEDS LIVE PROOF | Warning-labeled; use after staff review and live column proof. |
| Remove verified | Generic/category listing rows | `ClassifiedAdminRowActions.tsx` | listing/category API routes | `leonix_verified` | Yes for `listings`; partial category coverage | Yes after this gate | Yes via action-status proof banner | Yes via action-status proof banner | verification columns live | NEEDS LIVE PROOF | Same as Verify Leonix. |
| Run AI review | Generic listing row | `AdminRunAiReviewButton.tsx` | `/api/admin/clasificados/listings/[id]/ai-review` | `listing_moderation_reviews` | Unknown/partial in service | Yes recommended in registry; button itself no confirm | Yes via action-status proof banner | Yes via action-status proof banner | `listing_moderation_reviews`, provider env | NEEDS LIVE PROOF | Launch-safe only as advisory if live schema/provider verified. |
| Bulk AI review | Queue bulk action bar | `AdminListingsTable.tsx`; `ClassifiedAdminQueueBulkBar.tsx` | `/api/admin/clasificados/listings/ai-review/bulk` | `listing_moderation_reviews` | Unknown/partial in service | Yes | Yes via action-status proof banner | Yes via action-status proof banner and inline error | `listing_moderation_reviews`, provider env | NEEDS LIVE PROOF | Limit to test batches until live proof is complete. |
| Mark reviewed | Reports / review context | `app/admin/actions.ts`; review cards | `updateListingReportStatusAction` | `listing_reports` | Yes | Not universal | Partial | Partial | `listing_reports` | PARTIAL | Needs unified report action proof gate. |
| Clear flag | Reports / review context | Review cards and registry | no universal action found | `listing_reports` or source moderation flags | Unknown | Not universal | Unknown | Unknown | flag source varies | PARTIAL | Keep warning-labeled until implemented/proven per source. |
| Delete | Listing queue, leads, newsletter/media-kit clients | `AdminListingsTable.tsx`; lead clients | `deleteListingAction`; lead APIs | `listings`; lead tables | Yes for `listings`; partial lead audit | Yes | Yes via queue proof or client state | Yes via queue proof/client error | deleted/status fields | PARTIAL | Launch-safe for soft delete on test/proven rows; prefer Archive. |
| Permanent delete | Bulk removed listing workflow; magazine draft; Tienda image/rule deletes | `AdminListingsTable.tsx`; revista/catalog pages | `permanentlyDeleteListingsAction`; `deleteMagazineDraftAction`; catalog delete actions | `listings`; `magazine_issues`; catalog image/rule tables | Yes | Typed prompt for listing bulk; missing client confirm for magazine/catalog server forms | Yes via queue/server refresh | Yes via queue/server errors | source table delete permission | PARTIAL | Keep visually separated and restrict use; add shared confirm for all server forms next. |
| Lead view | `/admin/leads/inbox` | `AdminLeonixLeadsInboxClient.tsx` | `listLeonixLeadsForAdmin` | `leonix_leads` | No read audit | No | Page data/unavailable states | Page data/unavailable states | `leonix_leads` | REAL | Launch-safe read model. |
| Lead status update | Leads inbox | lead client and `/api/admin/leads/inbox/[id]` | `updateLeonixLeadAdmin` | `leonix_leads` | Unknown | Client-controlled, partial | Client state/proof | Client error | CRM status columns | REAL | Launch-safe, but audit logging should be added. |
| Lead archive/delete | Leads inbox | lead client and `/api/admin/leads/inbox/[id]` | `applyLeonixLeadLifecycleAdmin` | `leonix_leads` | Unknown | Yes for destructive client paths | Client state/proof | Client error | archive/delete columns | REAL | Launch-safe, audit logging follow-up. |
| Lead export CSV | Leads, newsletter, media kit | export routes | `/api/admin/leads/*/export` | lead tables | No/unknown | No | Browser CSV response | HTTP 503/500 text | lead tables | REAL | Launch-safe, but sensitive export audit should be added. |
| Team invite/create | `/admin/team/roster`, `/admin/team/users/new` | roster page; provisioning page | `adminTeamActions.ts`; `teamProvisioningActions.ts` | `admin_team_invites`, `admin_team_members`, Auth | Yes for roster actions | Form submit; create copy is explicit | Query flash banners | Query flash banners | team tables/Auth | PARTIAL | Launch-safe for trusted admin; invite email delivery remains manual/partial. |
| Disable staff | `/admin/team/roster` | roster page | `toggleTeamMemberActiveAction` | `admin_team_members.is_active` | Yes | Server form only; no client confirm | Query flash banners | Query flash banners | roster table | PARTIAL | Launch-safe with caution; add shared confirm next. |
| User search | `/admin/usuarios`, `/admin/ops` | user pages/helpers | `adminProfilesQuery.ts`, support context helpers | `profiles` and related read models | No read audit | No | Page results | Page unavailable/error states | profiles live | REAL | Launch-safe read/search. |
| User detail/support view | `/admin/usuarios/[id]` | user detail page | server page/actions | profiles, listings, orders, entitlements | Partial for writes | No sensitive write exposed | Page state | Redirect errors | support notes/sessions missing | PARTIAL | Launch-safe read/support context; no impersonation/password tooling. |
| Save site settings | `/admin/site-settings`, `/admin/settings` | settings pages | `globalSiteActions.ts` and settings helpers | settings/content tables | Partial | Server form only | Query flash | Query flash/errors | final settings schema not complete | PARTIAL | Use for known fields only; no fake system settings. |
| Save site section/content | `/admin/workspace/*/content` | content pages | section action files | `site_section_content` | Partial/unknown | Server form only | `?saved=1` redirect | route errors | `site_section_content` | PARTIAL | Launch-safe content edits; rollback/revisions needed later. |
| Magazine publish | `/admin/workspace/revista` | revista page | `publishMagazineIssueAction` | `magazine_issues` | Yes | Server form only | `?issue_saved=1` | `?issue_error=1`/throw | `magazine_issues` | PARTIAL | Launch-safe on test rows; needs client confirm and public resolver proof. |
| Magazine mark current | `/admin/workspace/revista` | revista page | `setMagazineCurrentIssueAction` | `magazine_issues` | Yes | Server form only | `?issue_saved=1` | `?issue_error=1`/throw | `magazine_issues` | PARTIAL | Launch-safe with caution; archives previous featured issue. |
| Magazine archive | `/admin/workspace/revista` | revista page | `archiveMagazineIssueAction` | `magazine_issues` | Yes | Server form only | `?issue_saved=1` | `?issue_error=1`/throw | `magazine_issues` | PARTIAL | Launch-safe with caution; add confirm. |
| Magazine delete draft | `/admin/workspace/revista` | revista page | `deleteMagazineDraftAction` | `magazine_issues` | Yes | Server form only | `?issue_saved=1` | `?issue_error=1`/throw | `magazine_issues` | PARTIAL | Only draft rows; add confirm. |
| Tienda order status update | `/admin/tienda/orders/[id]` | `AdminTiendaOrderOpsPanel.tsx` | `tiendaOrderActions.ts` | `tienda_orders` | Yes | No client confirm | Server refresh/revalidate | Throw/error route | `tienda_orders` | REAL | Launch-safe internal ops; no customer email is sent. |
| Tienda catalog edit/publish | `/admin/tienda/catalog`, `/admin/tienda/catalog/[id]` | catalog pages | `tiendaCatalogActions.ts` | `tienda_catalog_items/images/pricing_rules` | Yes for item create/update and deletes; missing add image/rule audit | No client confirm for deletes | Server refresh/navigation | Throws/errors | catalog tables | REAL | Launch-safe catalog ops; add confirm/audit for helper mutations. |
| Settings stub actions | `/admin/settings` and related planning cards | settings pages | none/partial | none or unknown | No | No | Disabled/stub copy | N/A | final settings schema | DISABLED | Must remain disabled/warning-labeled. |
| Draw/stub actions | `/admin/draw` | draw page | none/partial | none | No | No | Stub copy | N/A | future draw schema | DISABLED | Do not present as launch-ready. |

## 3. Launch-Safe Actions

Launch-safe enough for July 1:
- View public.
- View in results as read-only inspection.
- Manage listing as a navigation/toolbox entry.
- Edit listing for proven generic `listings` fields.
- Suspend, Restore, Archive, and Delete for generic `public.listings` rows through the existing API/server-action paths.
- Permanent delete only through the bulk typed-confirmation workflow and only for protected cleanup/test cases.
- Lead view, lead status update, lead archive/delete, and lead export CSV.
- Team invite/create/disable with trusted-admin caution.
- User search and user detail/support view as read/support surfaces.
- Save site settings and site section/content for known existing fields.
- Magazine save/publish/current/archive/delete draft on test/proven rows.
- Tienda order status update and Tienda catalog edit/publish.

## 4. Needs Live Proof

Actions requiring production Supabase proof after migrations are applied:
- Feature/promote on `listings.admin_promoted`, `servicios_public_listings.promoted`, `empleos_public_listings.admin_promoted`, `viajes_staged_listings.admin_promoted`, and category equivalents.
- Verify Leonix on `listings.leonix_verified`, `servicios_public_listings.leonix_verified`, `empleos_public_listings.leonix_verified`, `viajes_staged_listings.leonix_verified`, and category equivalents.
- AI moderation review persistence to `listing_moderation_reviews`.
- Bulk AI review persistence to `listing_moderation_reviews`.
- Any action depending on `listing_moderation_reviews`.
- Any action depending on `admin_promoted`, `promoted`, or `leonix_verified`.
- Republish / Move to top on category rows needing live `republished_at`, `republish_count`, `last_republished_source`, generated sort fields, or category-specific republish compatibility.

## 5. Dangerous Actions

| Action | Confirmation status | Visual separation | Audit logging status | Recommendation |
|---|---|---|---|---|
| Soft delete | Yes in generic queue and bulk flow; yes in lead clients | Danger section/button | Yes for `listings`; unknown/partial for lead APIs | Launch-safe with caution; prefer Archive for routine ops. |
| Permanent delete | Typed confirmation in bulk listing flow; server-only submit for magazine draft/catalog helper deletes | Strong danger button in listing bulk; danger text in magazine/catalog | Yes for listings/magazine/catalog deletes | Keep restricted; add shared confirmation component to server forms. |
| Archive | Yes for listing row; lead clients confirm where destructive; magazine form lacks client confirm | Lifecycle/danger-adjacent | Yes for listings/magazine; partial leads | Launch-safe where proven; add server-form confirmation. |
| Suspend | Added confirmation in this gate for shared row actions | Lifecycle warning style | Yes for `listings`; partial category coverage | Launch-safe for generic queue, live-proof category APIs. |
| Staff disable | No client confirm on server form | Roster action button | Yes | Add confirmation before July 1 staff handoff. |
| Magazine delete draft | No client confirm on server form | Rose text and draft-only server guard | Yes | Add client confirmation next; server correctly limits to draft. |
| Tienda order destructive actions | No hard delete found; status changes only | Operations panel | Yes for status/read/notes | Status updates are launch-safe; keep "no automatic customer email" copy. |

## 6. Audit Log Coverage

Writes to `admin_audit_log` or `auditAdminWrite`:
- Generic listing republish, suspend, restore, feature, verify, archive through `/api/admin/clasificados/listings/[id]`.
- Generic listing publish toggle, staff core edit, soft delete, permanent delete, and report status update through `app/admin/actions.ts`.
- Team invite intent, team member create, permission update, and active toggle.
- User disabled toggle.
- Magazine issue upsert, publish, set current, archive, and delete draft.
- Tienda order status, admin notes, unread toggle.
- Tienda catalog item create/update, image delete, and pricing rule delete.

Does not write or audit is unknown:
- Lead status/archive/delete APIs.
- Lead export CSV routes.
- Newsletter/media-kit lifecycle/export routes.
- Category-specific listing APIs for Servicios, Autos, Restaurantes, Empleos, and Viajes unless each route writes audit in its own implementation.
- AI moderation service write path.
- Site section/content saves and global settings saves.
- Tienda catalog add image and add pricing rule helper actions.

Needs audit logging later:
- All lead lifecycle/export actions.
- All category-specific listing actions.
- AI moderation review and bulk review.
- Site content/settings saves.
- Every delete/archive/suspend/status change should include actor context once the final admin auth model is settled.

## 7. Success/Error Proof Coverage

Pages/actions with proof banners or visible flash:
- Generic classifieds queue uses `action_status`, `action_error`, target label, target ad id, and scroll restoration.
- Bulk listing cleanup and bulk AI review redirect to proof state.
- Lead clients show client state/error feedback and CSV export relies on browser response.
- Team roster uses `invite_saved`, `invite_error`, `member_saved`, and `member_error` banners.
- Magazine manager uses `saved`, `issue_saved`, and `issue_error` banners.
- Site content pages use `?saved=1` redirects.
- Tienda pages revalidate/refresh and show live status, but need a stronger post-action proof banner.

Silent or unclear:
- Some server-action form submits rely on route refresh rather than a clear success banner.
- Tienda order status changes do not show a dedicated proof banner.
- Tienda catalog image/rule helper actions do not all audit or show strong proof.
- Category-specific admin APIs need per-route success/error proof confirmation.

Needs proof banners:
- Magazine action forms should use a shared confirmation/proof helper.
- Team disable and permission changes should use a shared confirmation/proof helper.
- Tienda order and catalog helper mutations should show post-action proof.
- Category-specific action APIs should all return the shared action proof format.

## 8. Recommended Fixes Done In This Gate

- Added `DISABLED` support to the shared Admin OS truth status taxonomy.
- Added an exported `ADMIN_OS_ACTION_STATUS_TAXONOMY` containing `REAL`, `PARTIAL`, `PLANNED`, `NEEDS LIVE PROOF`, `NEEDS SCHEMA GATE`, and `DISABLED`.
- Added confirmation prompts to shared classifieds row actions for Republish / Move to top, Suspend, Restore, Feature, Remove featured, Verify Leonix, and Remove verified.
- Created this Admin OS action proof document.
- Added a verifier for this gate.

## 9. Remaining Follow-Up Gates

- `ADMIN-AUDIT-LOG-COVERAGE-01`: add complete audit rows and actor context for lead lifecycle/export, category APIs, AI review, site content, settings, and helper mutations.
- `ADMIN-ACTION-PROOF-BANNERS-01`: create a shared confirmation/proof wrapper for server-action forms and standardize success/error banners.
- `ADMIN-LIVE-SUPABASE-PROOF-CHECK-01`: run live checks for `listing_moderation_reviews`, promote/verify columns, republish fields, Tienda tables, magazine tables, lead tables, and settings/site content tables.
- `ADMIN-SYSTEM-HEALTH-BUG-FINDER-01`: build real system health/bug finder only after schema/read model exists.
- `ADMIN-REVENUE-STRIPE-OS-01`: handle payment/revenue/Stripe separately after Admin OS action reliability is stable.
