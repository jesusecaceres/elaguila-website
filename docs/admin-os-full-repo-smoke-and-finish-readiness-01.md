# Admin OS Full Repo Smoke and Finish Readiness 01

Gate: `ADMIN-OS-FULL-REPO-SMOKE-AND-FINISH-READINESS-01`  
Date: 2026-06-30  
Scope: Admin OS repo smoke/readiness proof for the July 1 implementation sequence. No public Clasificados output polish, no Stripe implementation, no schema changes, no migrations.

## 1. Executive Summary

The Admin OS foundation is present and buildable in repo evidence. Core Admin OS pages, purpose cards, action helpers, docs, action proof audit, Supabase backing matrix, live schema drift migration, and verifier scripts exist. The strongest launch-ready surfaces are the command center, marketplace operations queue, lead inbox, user search/support context, staff/team roster, website control entry points, magazine manager, Tienda catalog/orders, and Admin OS action proof layer.

The current state is launch-ready for the final July 1 implementation sequence if the Admin OS verifiers and production build pass. It is not a claim that every future OS capability is live. Feature/Verify Leonix, AI moderation persistence, republish placement proof, system health/bug finder, and revenue/Stripe OS remain partial or future gates.

## 2. Admin OS Current State

- Foundation: `AdminPagePurposeCard`, `AdminActionExplainer`, and `adminOsActionRegistry` exist and are used on critical admin surfaces.
- Documentation: master audit, Supabase matrix, final QA checklist, action proof audit, and live schema drift migration are present.
- Actions: generic listing lifecycle actions call real API/server actions and have proof redirects; category-specific actions remain partial until live schema proof is finished.
- UX language: Admin OS chrome/action copy is English in touched surfaces. User-created ad/listing content is not translated.
- Mobile/PWA: purpose cards, action explainers, and action groups are mobile-aware; dense tables still require manual 390px smoke.
- Truth labels: `REAL`, `PARTIAL`, `PLANNED`, `NEEDS LIVE PROOF`, `NEEDS SCHEMA GATE`, and `DISABLED` are available in the Admin OS taxonomy.

## 3. Admin Route Smoke Map

| Route | File path | Exists | Redirect | Purpose card | Action helper | Launch status |
|---|---|---:|---:|---:|---:|---|
| `/admin` | `app/admin/(dashboard)/page.tsx` + `AdminCommandCenterDashboard.tsx` | Yes | Auth-gated by layout | Yes | Mixed dashboard CTAs | PARTIAL |
| `/admin/workspace` | `app/admin/(dashboard)/workspace/page.tsx` | Yes | Auth-gated by layout | Yes | Section CTAs | PARTIAL |
| `/admin/workspace/clasificados` | `app/admin/(dashboard)/workspace/clasificados/page.tsx` | Yes | Auth-gated by layout | Yes | Yes, action explainers | PARTIAL |
| `/admin/workspace/clasificados/servicios` | `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx` | Yes | Auth-gated by layout | Yes | Yes, action explainers | PARTIAL |
| `/admin/workspace/clasificados/autos` | `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx` | Yes | Auth-gated by layout | Yes | Yes, shared staff actions | PARTIAL |
| `/admin/workspace/clasificados/restaurantes` | `app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx` | Yes | Auth-gated by layout | Yes | Yes, shared staff actions | PARTIAL |
| `/admin/reportes` | `app/admin/(dashboard)/reportes/page.tsx` | Yes | Auth-gated by layout | Yes | Review/action cards | PARTIAL |
| `/admin/leads/inbox` | `app/admin/(dashboard)/leads/inbox/page.tsx` | Yes | Auth-gated by layout | Yes | Lead client actions | REAL |
| `/admin/team` | `app/admin/(dashboard)/team/page.tsx` | Yes | Auth-gated by layout | Yes | Navigation/action CTAs | PARTIAL |
| `/admin/usuarios` | `app/admin/(dashboard)/usuarios/page.tsx` | Yes | Auth-gated by layout | Yes | Search/support links | REAL |
| `/admin/site-settings` | `app/admin/(dashboard)/site-settings/page.tsx` | Yes | Auth-gated by layout | Yes | Settings forms | PARTIAL |
| `/admin/settings` | `app/admin/(dashboard)/settings/page.tsx` | Yes | Auth-gated by layout | Yes | Stub/partial actions | PLANNED |
| `/admin/workspace/language-audit` | `app/admin/(dashboard)/workspace/language-audit/page.tsx` | Yes | Auth-gated by layout | Yes | Audit controls | PARTIAL |
| `/admin/tienda` | `app/admin/(dashboard)/tienda/page.tsx` | Yes | Auth-gated by layout | Yes | Tienda CTAs | PARTIAL |
| `/admin/tienda/catalog` | `app/admin/(dashboard)/tienda/catalog/page.tsx` | Yes | Auth-gated by layout | Yes | Catalog actions | REAL |
| `/admin/workspace/revista` | `app/admin/(dashboard)/workspace/revista/page.tsx` | Yes | Auth-gated by layout | Yes | Magazine server actions | PARTIAL |
| `/admin/draw` | `app/admin/(dashboard)/draw/page.tsx` | Yes | Auth-gated by layout | Yes | Stub actions | DISABLED |

## 4. Admin Action Smoke Map

| Action | Visible label | Route/component | API/server action evidence | Confirmation | Proof banner/flash | Audit log | Schema dependency | Launch status | Recommendation |
|---|---|---|---|---|---|---|---|---|---|
| View public | View public | Admin rows/Tienda/Magazine links | Link only | Not needed | Browser route | No write | Public route/data | REAL | Launch-safe inspection. |
| Edit listing | Edit listing | Generic queue edit link | `updateListingCoreFieldsStaffAdminAction` | Form submit | Redirect/page state | Yes | `listings` | PARTIAL | Safe for generic fields. |
| Manage listing | Manage listing | Dashboard/admin entry points | Inner actions only | Inner action | Inner action | Inner action | Category support | PARTIAL | Safe as toolbox label. |
| View in results | View in results | Category row links | Link only | Not needed | Browser route | No write | Results route | PARTIAL | Safe inspection; visibility checker later. |
| Suspend | Suspend | `ClassifiedAdminRowActions.tsx` | `/api/admin/clasificados/listings/[id]`, category APIs | Yes | `action_status` proof | Yes for generic listings | Status fields | PARTIAL | Generic queue safe; category live proof later. |
| Restore | Restore | `ClassifiedAdminRowActions.tsx` | same as Suspend | Yes | `action_status` proof | Yes for generic listings | Status fields | PARTIAL | Generic queue safe; category live proof later. |
| Archive | Archive | Row actions, lead clients, magazine | listing API, lead APIs, magazine actions | Yes for listing/leads; partial forms | Queue proof or query flash | Yes for listings/magazine | archive/status fields | PARTIAL | Use Archive before Delete where possible. |
| Republish | Republish / Move to top | Row actions | listing/category APIs | Yes | `action_status` proof | Yes for generic listings | republish fields | NEEDS LIVE PROOF | Use only after source-table proof. |
| Feature | Feature | Row actions | listing/category APIs | Yes | `action_status` proof | Yes for generic listings | `admin_promoted` / `promoted` | NEEDS LIVE PROOF | Warning-labeled until live column proof. |
| Remove featured | Remove featured | Row actions | listing/category APIs | Yes | `action_status` proof | Yes for generic listings | `admin_promoted` / `promoted` | NEEDS LIVE PROOF | Same as Feature. |
| Verify Leonix | Verify Leonix | Row actions/Servicios cards | listing/category APIs, Servicios action | Yes on shared row action | `action_status` or server refresh | Partial | `leonix_verified` | NEEDS LIVE PROOF | Use after staff review and live proof. |
| Remove verified | Remove verified | Row actions | listing/category APIs | Yes | `action_status` proof | Yes for generic listings | `leonix_verified` | NEEDS LIVE PROOF | Same as Verify Leonix. |
| Run AI review | Run AI review | `AdminRunAiReviewButton.tsx` | `/api/admin/clasificados/listings/[id]/ai-review` | Helper warns; no blocking prompt | `action_status` proof | Partial/unknown in service | `listing_moderation_reviews` | NEEDS LIVE PROOF | Advisory only until live table/provider proof. |
| Bulk AI review | Run AI review on selected | `AdminListingsTable.tsx` bulk flow | `/api/admin/clasificados/listings/ai-review/bulk` | Yes | `action_status` proof | Partial/unknown in service | `listing_moderation_reviews` | NEEDS LIVE PROOF | Limit to safe test batches. |
| Mark reviewed | Mark reviewed | Reports/review cards | `updateListingReportStatusAction` | Partial | Partial | Yes | `listing_reports` | PARTIAL | Needs report action proof gate. |
| Clear flag | Clear flag | Registry/review context | No universal action found | Partial | Unknown | Unknown | flag source varies | PARTIAL | Keep warning-labeled until implemented/proven. |
| Delete | Delete / remove | Queue/leads clients | `deleteListingAction`, lead APIs | Yes | Queue proof/client state | Yes for listings, partial leads | deleted/status fields | PARTIAL | Launch-safe only for soft delete/test rows. |
| Permanent delete | Permanent delete | Bulk cleanup, magazine/catalog forms | `permanentlyDeleteListingsAction`, draft/catalog deletes | Typed prompt for listing bulk; partial forms | Queue proof/server refresh | Yes | source table delete | PARTIAL | Restricted cleanup only. |
| Lead view | Lead view | `/admin/leads/inbox` | `listLeonixLeadsForAdmin` | Not needed | Page state | No read audit | `leonix_leads` | REAL | Launch-safe. |
| Lead status update | Status update | Lead inbox client/API | `/api/admin/leads/inbox/[id]` | Partial | Client proof | Unknown | CRM status fields | REAL | Launch-safe; add audit later. |
| Lead archive/delete | Archive/Delete | Lead inbox client/API | `applyLeonixLeadLifecycleAdmin` | Yes for destructive flows | Client proof | Unknown | archive/delete columns | REAL | Launch-safe; audit follow-up. |
| Lead export CSV | Export CSV | Lead export routes | `/api/admin/leads/*/export` | Not needed | CSV/HTTP response | Unknown | lead tables | REAL | Launch-safe; sensitive export audit later. |
| Team invite/create | Create staff/invite | Team pages/actions | `adminTeamActions.ts`, `teamProvisioningActions.ts` | Form copy explicit | Query flash | Yes for roster actions | team/Auth tables | PARTIAL | Launch-safe for trusted admins. |
| Disable staff | Disable/activate staff | Team roster | `toggleTeamMemberActiveAction` | Server form only | Query flash | Yes | `admin_team_members` | PARTIAL | Add confirmation/proof wrapper later. |
| User search | Search | `/admin/usuarios`, `/admin/ops` | profile/support helpers | Not needed | Page state | No read audit | `profiles` | REAL | Launch-safe read/search. |
| User detail/support view | Support view | `/admin/usuarios/[id]` | server page/actions | Not needed for read | Page/redirect state | Partial | support/session tables missing | PARTIAL | Launch-safe read; no impersonation/password tools. |
| Save site settings | Save settings | site/settings pages | `globalSiteActions.ts` and helpers | Server form | Query flash | Partial | settings/content tables | PARTIAL | Known fields only. |
| Save site section/content | Save content | workspace content pages | section action files | Server form | `?saved=1` | Partial | `site_section_content` | PARTIAL | Launch-safe content edits; rollback later. |
| Magazine publish | Publish issue | Revista page | `publishMagazineIssueAction` | Server form only | `?issue_saved` / `?issue_error` | Yes | `magazine_issues` | PARTIAL | Use test rows; add confirmation. |
| Magazine mark current | Mark as current issue | Revista page | `setMagazineCurrentIssueAction` | Server form only | query flash | Yes | `magazine_issues` | PARTIAL | Safe with caution; archives previous featured issue. |
| Magazine archive | Archive issue | Revista page | `archiveMagazineIssueAction` | Server form only | query flash | Yes | `magazine_issues` | PARTIAL | Add confirmation. |
| Magazine delete draft | Delete draft | Revista page | `deleteMagazineDraftAction` | Server form only | query flash | Yes | `magazine_issues` | PARTIAL | Draft-only server guard; add confirmation. |
| Tienda order status update | Set status | Tienda order panel | `tiendaOrderActions.ts` | No client confirm | Revalidate/refresh | Yes | `tienda_orders` | REAL | Launch-safe internal ops; no automatic email. |
| Tienda catalog edit/publish | Save changes/live flags | Tienda catalog pages/actions | `tiendaCatalogActions.ts` | Form submit; delete helpers partial | Refresh/navigation | Mostly yes | catalog tables | REAL | Launch-safe; add helper audit/proof later. |
| Settings stub actions | Save theme preference (not wired) | `/admin/settings` | Stub only | N/A | Stub copy | No | future settings schema | DISABLED | Must remain disabled/warning-labeled. |
| Draw/stub actions | Draw/stub controls | `/admin/draw` | Stub only | N/A | Stub copy | No | future draw/system tools | DISABLED | Must not be treated as launch-ready. |

## 5. Verifier Inventory

Relevant Admin OS verifiers selected from `package.json` for this gate:
- `verify:admin:listings-actions-column`
- `verify:admin-dashboard-cleanup`
- `verify:admin-dashboard-mobile-command-center`
- `verify:admin-dashboard-mobile-command-center-01`
- `verify:leonix-admin-supabase-backing-matrix-01`
- `verify:admin-live-schema-drift-fix-01`
- `verify:admin-os-action-purpose-stack-01`
- `verify:admin-os-battlefield-finish-to-qa-01`
- `verify:admin-action-qa-and-live-schema-proof-01`
- `verify:admin-review-cta-actions`
- `verify:admin-reports-complaints-supabase`
- `verify:admin-classifieds-queue-polish`
- `verify:admin-analytics-monetization-table-audit`
- `verify:admin-review-queue-truth`
- `verify:admin-bulk-flagged-cleanup`
- `verify:admin-leads-style`
- `verify:admin-categories-command-center`
- `verify:admin-ops-global-lookup`
- `verify:admin-category-live-truth-style`
- `verify:admin-servicios-ops-presentation`
- `verify:staff-admin-sales-access`
- `verify:staff-admin-supabase-activation`
- `verify:admin-staff-auth-boundary`
- `verify:admin-staff-launch-readiness`
- `verify:leonix-admin-command-center-master-audit`
- `verify:leonix-admin-os-master-audit-02`
- `verify:admin-dashboard-ceo-command-center`
- `verify:admin-review-mobile-moderation-truth`
- `verify:admin-ai-moderation-engine`
- `verify:admin-ai-moderation-policy`
- `verify:admin-monetization-readonly`
- `verify:admin-package-entitlement-generator`
- `verify:admin-pricing-promo-generator-ui`
- `verify:admin-promo-code-lifecycle`
- `verify:admin-leads-inbox-ui-lifecycle`
- `verify:admin-leads-crm`
- `verify:admin-mobile-shell`
- `verify:admin-mobile-shell-hamburger`
- `verify:admin-nav-ops`
- `verify:admin-leads-promocionales-tab`
- `verify:admin-sales-rep-access`
- `verify:admin-os-full-repo-smoke-and-finish-readiness-01`

Excluded from this gate:
- `verify:stripe-payment-tracker-foundation` because this gate explicitly forbids Stripe implementation/work.
- Browser/live mutation smoke scripts because this gate avoids destructive or externally dependent tests.

## 6. Verifier Results

New gate verifier:
- `npm run verify:admin-os-full-repo-smoke-and-finish-readiness-01`: PASS

Selected existing Admin OS verifier suite:
- Result: FAIL
- Passing verifiers included the route/action foundation checks, Supabase backing matrix, live schema drift verifier, action purpose stack, battlefield QA, action proof QA, reports/complaints, analytics monetization table audit, review queue truth, bulk flagged cleanup, leads style, categories command center, ops lookup, category live truth style, staff admin access/activation/auth boundary/launch readiness, master audits, AI moderation policy/engine, mobile shell hamburger, nav ops, leads promocionales tab, and sales rep access.

Failing verifiers:
- `verify:admin-dashboard-cleanup`: `/admin` missing pending review queue.
- `verify:admin-dashboard-mobile-command-center`: missing expected dashboard section strings and review reason fallback.
- `verify:admin-review-cta-actions`: missing pending review section, flagged items render, and reason fallback.
- `verify:admin-classifieds-queue-polish`: action string checks for archive/restore/republish/feature/Verify Leonix no longer match current shared confirmed action wrapper.
- `verify:admin-servicios-ops-presentation`: Servicios action presentation string checks do not match current shared action wrapper/cards.
- `verify:admin-dashboard-ceo-command-center`: failed during the selected suite; inspect this verifier before final commit.
- `verify:admin-monetization-readonly`: Servicios admin page does not reference the shared monetization summary component expected by the verifier.
- `verify:admin-package-entitlement-generator`: package entitlement generator/dashboard/public-ranking guard checks failed.
- `verify:admin-pricing-promo-generator-ui`: no-public-redemption guard check failed.
- `verify:admin-promo-code-lifecycle`: expected promo list UI check failed.
- `verify:admin-leads-inbox-ui-lifecycle`: expected active/archive tabs, filters, and row actions checks failed.
- `verify:admin-leads-crm`: expected View/Email/Archive/Restore/Delete row action checks failed.
- `verify:admin-mobile-shell`: expected lead row action/mobile min-height checks failed.

## 7. Build Result

`npm run build`: PASS

Known warning:
- `app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts`: `module.createRequire failed parsing argument.`
- This warning matches the already-known local build warning and did not block the build (`exit_code: 0`).

## 8. Manual Smoke Test Checklist

1. Login as an admin at `/admin/login`.
2. Open `/admin`; confirm `Leonix Command Center`, purpose card, truthful partial/planned system health, and no fake revenue/AI/system health.
3. Open every primary route in the route smoke map.
4. Confirm each major page has a purpose/status card or equivalent truthful top context.
5. Confirm `REAL`, `PARTIAL`, `PLANNED`, `NEEDS LIVE PROOF`, `NEEDS SCHEMA GATE`, or `DISABLED` labels appear where appropriate.
6. In `/admin/workspace/clasificados`, expand action helpers for Republish, Suspend, Restore, Archive, Feature, Verify Leonix, and Run AI review.
7. Confirm dangerous actions are visually separated and protected before using only safe test records.
8. Confirm Admin OS UX/action labels are English.
9. Confirm user-created ad/listing content remains untouched and is not force-translated.
10. Confirm pages that need live proof do not claim full production readiness.
11. Test 390px responsive layout for `/admin`, `/admin/workspace/clasificados`, Servicios, Autos, Restaurantes, Reports, Leads, Users, Tienda Catalog, Revista, Settings, and Draw.
12. Confirm no hidden broken buttons are presented as live tools.

## 9. Mobile/PWA Readiness Notes

- Purpose cards and action explainer blocks are mobile-safe and wrap.
- Shared action grids use wrap/grid patterns; classifieds row action sections collapse on card/mobile layouts.
- Dense admin tables still require horizontal scroll and manual 390px QA.
- Tienda catalog, reports, activity log, and user detail are the highest-risk mobile surfaces because they contain dense operational data.
- PWA install/offline behavior is not proven in this gate; this is route/build/admin readiness, not offline QA.

## 10. Launch-Safe Actions

Launch-safe enough for July 1 when used on proven rows:
- View public, View in results, Manage listing navigation, Lead view, Lead export CSV, User search, User detail/support view.
- Generic `public.listings` Suspend, Restore, Archive, soft Delete, and typed-confirmation Permanent delete in protected cleanup flow.
- Lead status update and lead archive/delete.
- Team invite/create and Disable staff with trusted-admin caution.
- Save site settings and save site section/content for existing known fields.
- Magazine save/publish/current/archive/delete draft on safe test/proven rows.
- Tienda order status update and Tienda catalog edit/publish.

## 11. Needs Live Proof Actions

Needs live proof before full launch confidence:
- Feature/promote.
- Remove featured.
- Verify Leonix.
- Remove verified.
- Republish / Move to top on each source table.
- Run AI review and Bulk AI review.
- Any action depending on `listing_moderation_reviews`.
- Any action depending on `admin_promoted`, `promoted`, or `leonix_verified`.
- Report Mark reviewed / Clear flag across every flag source.
- Category-specific listing actions for Servicios, Autos, Restaurantes, Empleos, and Viajes.

## 12. Blockers

Blocking for this gate:
- Existing selected Admin OS verifier suite failed.
- Production build passed, but verifier failures keep this gate from commit readiness.

Operational blockers that remain outside this gate:
- Live Supabase proof still required for `listing_moderation_reviews` and promote/verify columns.
- System health/bug finder remains future schema/read-model work.
- Revenue/Stripe OS remains a later gate.

## 13. Next Admin OS Gates

- `ADMIN-LIVE-SUPABASE-PROOF-CHECK-01`
- `ADMIN-AUDIT-LOG-COVERAGE-01`
- `ADMIN-ACTION-PROOF-BANNERS-01`
- `ADMIN-SYSTEM-HEALTH-BUG-FINDER-01`
- `ADMIN-REVENUE-STRIPE-OS-01`

## 14. Final Recommendation

Do not mark this gate ready to commit until the failing Admin OS verifiers above are either fixed or formally retired/replaced as stale checks. The new full-repo smoke verifier passes and the production build passes, but this broader readiness gate is blocked by the selected existing Admin OS verifier suite.
