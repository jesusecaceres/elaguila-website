# Admin Live Supabase Mutation Proof 01

Gate: `ADMIN-LIVE-SUPABASE-MUTATION-PROOF-01`  
Date: 2026-06-30  
Scope: Admin OS live Supabase data/action proof. No schema changes, no migrations, no Stripe work, no public Clasificados output polish, and no destructive production mutations.

## 1. Executive Summary

Live Supabase access is available through the Supabase MCP for the `Leonix Media` project. Safe read-only table, column, and count proof was run against the live `public` schema. One explicitly safe audit-log mutation was performed: a harmless permanent `admin_live_proof_test` row in `admin_audit_log`, tied to this gate and containing no secrets or customer data.

The live database proves many Admin OS foundations are real: `admin_audit_log`, `admin_team_members`, `listings`, `listing_reports`, category listing tables, leads tables, site section/category config, magazine issues, Tienda orders/catalog, and package entitlements. The critical blocker is that the local drift-fix migration has not been applied live: `listing_moderation_reviews` is missing, and the requested Feature/Verify columns are missing from `listings`, `servicios_public_listings`, `empleos_public_listings`, and `viajes_staged_listings`. Therefore AI moderation persistence and several Feature/Verify paths must remain `NEEDS LIVE PROOF` or `NEEDS SCHEMA GATE` until the live schema is repaired.

## 2. Live Supabase Access Status

| Check | Result | Evidence |
|---|---:|---|
| Supabase MCP/client available | TRUE | `list_projects`, `list_tables`, and `execute_sql` succeeded. |
| Live read possible | TRUE | Live table metadata and safe read-only counts succeeded. |
| Live mutation possible | TRUE | Safe audit-log insert succeeded. |
| Live mutation allowed for this gate | LIMITED | Only the safe audit-log test row was inserted. No client/listing/staff/order/payment row was mutated. |
| Vercel production env proof available | FALSE | No Vercel environment variables or deployment settings were inspected in this gate. |
| Secrets printed | FALSE | No keys, JWTs, database URLs, or `.env` contents were printed or documented. |

## 3. Live Table/Column Proof

| Area | Table | Live status | Row count from safe read | Notes |
|---|---|---:|---:|---|
| Core | `admin_audit_log` | PASS | 374 before audit probe | Required columns present; accepts safe audit insert. |
| Core | `admin_team_members` | PASS | 1 | Staff roster table exists live. |
| Core | `listings` | PASS | 94 | Base table exists, but `admin_promoted` and `leonix_verified` are missing live. |
| Core | `listing_reports` | PASS | 2 | Reports table exists live. |
| Core | `listing_moderation_reviews` | FAIL | n/a | Missing live; local drift-fix migration exists but is not applied. |
| Category/action | `servicios_public_listings` | PASS | 99 | Exists, but `promoted` is missing live. `leonix_verified` exists. |
| Category/action | `autos_classifieds_listings` | PASS | 12 | Exists with `featured`, `leonix_verified`, and republish columns. |
| Category/action | `restaurantes_public_listings` | PASS | 2 | Exists with `promoted`, `leonix_verified`, and republish columns. |
| Category/action | `empleos_public_listings` | PASS | 4 | Exists, but `admin_promoted` and `leonix_verified` are missing live. |
| Category/action | `viajes_staged_listings` | PASS | 13 | Exists, but `admin_promoted` and `leonix_verified` are missing live. |
| Category/action | `comida_local_public_listings` | PASS | 0 | Table exists live with no rows. |
| Leads/CRM | `leonix_leads` | PASS | 11 | Primary leads inbox table exists live. |
| Leads/CRM | `leonix_contact_inquiries` | FAIL | n/a | Missing live; use `leonix_leads` for current primary contact/launch inbox. |
| Leads/CRM | `leonix_newsletter_subscribers` | PASS | 9 | Newsletter table exists live. |
| Leads/CRM | `leonix_media_kit_leads` | PASS | 4 | Media kit leads table exists live. |
| Website/magazine/tienda | `site_section_content` | PASS | 8 | Structured site content table exists live. |
| Website/magazine/tienda | `site_page_blocks` | FAIL | n/a | Missing live. |
| Website/magazine/tienda | `site_category_config` | PASS | 5 | Category config table exists live. |
| Website/magazine/tienda | `magazine_issues` | PASS | 1 | Magazine issue registry exists live. |
| Website/magazine/tienda | `tienda_orders` | PASS | 0 | Table exists live with no orders. |
| Website/magazine/tienda | `tienda_catalog_items` | PASS | 0 | Table exists live with no catalog items. |
| Revenue foundations | `listing_package_entitlements` | PASS | 1 | Entitlements table exists live. |
| Revenue foundations | `leonix_promo_codes` | FAIL | n/a | Missing live. |
| Revenue foundations | `leonix_payment_records` | FAIL | n/a | Missing live; payment/revenue proof remains partial. |

Required column proof:

| Required column | Live status |
|---|---:|
| `admin_audit_log.action` | PASS |
| `admin_audit_log.target_type` | PASS |
| `admin_audit_log.target_id` | PASS |
| `admin_audit_log.meta` | PASS |
| `listings.admin_promoted` | FAIL |
| `listings.leonix_verified` | FAIL |
| `servicios_public_listings.promoted` | FAIL |
| `empleos_public_listings.admin_promoted` | FAIL |
| `empleos_public_listings.leonix_verified` | FAIL |
| `viajes_staged_listings.admin_promoted` | FAIL |
| `viajes_staged_listings.leonix_verified` | FAIL |
| `listing_moderation_reviews.listing_id` | FAIL |
| `listing_moderation_reviews.listing_source` | FAIL |
| `listing_moderation_reviews.decision` | FAIL |
| `listing_moderation_reviews.risk_level` | FAIL |
| `listing_moderation_reviews.raw_result` | FAIL |

## 4. Safe Read Query Proof

Safe read-only SQL was executed through Supabase MCP. It queried metadata, exact counts, and `information_schema.columns` only. No sensitive rows, messages, payment data, full customer payloads, or private bodies were dumped.

The read proof returned exact counts for present requested tables and `present=false` for missing requested tables. It confirmed the same live drift as `list_tables`: `listing_moderation_reviews`, `site_page_blocks`, `leonix_contact_inquiries`, `leonix_promo_codes`, and `leonix_payment_records` are not present in the live `public` schema.

## 5. Admin Action Live Proof Matrix

| Admin OS action | Live proof status | Evidence / reason |
|---|---:|---|
| View public | LIVE READ PROVEN | Route/link helpers are code-backed; source listing tables exist live. Public visibility itself was not mutated. |
| Edit listing | LIVE READ PROVEN | `listings` exists live; staff edit action updates real columns, but no real listing was mutated. |
| Manage listing | LIVE READ PROVEN | Admin routes/API read live tables; auth-protected UI was previously browser-blocked by auth. |
| View in results | LIVE READ PROVEN | Results routes use live-backed listing/category tables; no public content changed. |
| Suspend | SAFE BUT NOT MUTATED | APIs update status/public flags and audit for supported tables; no safe test row was provided. |
| Restore | SAFE BUT NOT MUTATED | Supported as unsuspend/restore paths; no safe test row was provided. |
| Archive | SAFE BUT NOT MUTATED | Supported as status updates for several tables; no client listing was mutated. |
| Republish | NEEDS TEST ROW | Republish columns exist for many tables, but live mutation was not run on real listings. |
| Move to top | NEEDS TEST ROW | Same backing as republish; needs reversible test listing proof. |
| Feature | NEEDS SCHEMA GATE | Missing live columns block base `listings`, Servicios, Empleos, and Viajes feature paths. Autos/Restaurantes have live columns but were not mutated. |
| Remove featured | NEEDS SCHEMA GATE | Same as Feature. |
| Verify Leonix | NEEDS SCHEMA GATE | Missing live columns block base `listings`, Empleos, and Viajes verification paths. Servicios/Autos/Restaurantes have live columns but were not mutated. |
| Remove verified | NEEDS SCHEMA GATE | Same as Verify Leonix. |
| Run AI review | NEEDS SCHEMA GATE | `listing_moderation_reviews` is missing live, so persisted review proof cannot pass. |
| Bulk AI review | NEEDS SCHEMA GATE | Same missing live table. |
| Mark reviewed | NEEDS LIVE PROOF | `listing_reports` exists live; universal reviewed/clear action proof remains incomplete. |
| Clear flag | NEEDS LIVE PROOF | Report/review tables need dedicated safe test-row proof. |
| Delete | NOT SAFE TO TEST ON REAL DATA | Soft-delete paths exist for supported rows, but no real client data was touched. |
| Permanent delete | NOT SAFE TO TEST ON REAL DATA | Hard delete exists for `listings` and draft-only magazine/catalog cases; not tested on production data. |
| Lead view | LIVE READ PROVEN | `leonix_leads`, newsletter, and media kit lead tables exist and have live counts. |
| Lead status update | NEEDS TEST ROW | `leonix_leads` lifecycle columns exist; no safe test lead was provided. |
| Lead archive/delete | NEEDS TEST ROW | Soft archive/delete columns exist; no safe test lead was provided. |
| Lead export CSV | LIVE READ PROVEN | Export reads from live lead tables; no mutation required. |
| Team invite/create | SAFE BUT NOT MUTATED | `admin_team_members` exists; invite/create actions need safe test account proof. |
| Disable staff | NOT SAFE TO TEST ON REAL DATA | Never disable real staff without an explicit safe test account. |
| User search | LIVE READ PROVEN | `profiles` exists live from table metadata, but sensitive support actions were not mutated. |
| User detail/support view | LIVE READ PROVEN | Read-backed by profiles/listings/orders helpers; support-session schema remains future. |
| Save site settings | SAFE BUT NOT MUTATED | `site_section_content` exists; no site content was changed. |
| Save site section/content | SAFE BUT NOT MUTATED | Same live table evidence; no production content changed. |
| Magazine publish | SAFE BUT NOT MUTATED | `magazine_issues` exists; publishing real issue was not safe without a test draft. |
| Magazine mark current | SAFE BUT NOT MUTATED | Backed by `magazine_issues`; no real issue was changed. |
| Magazine archive | SAFE BUT NOT MUTATED | Backed by `magazine_issues`; no real issue was changed. |
| Magazine delete draft | NOT SAFE TO TEST ON REAL DATA | Draft-only delete exists, but no safe test draft was provided. |
| Tienda order status update | NEEDS TEST ROW | `tienda_orders` exists but has zero rows; needs safe test order. |
| Tienda catalog edit/publish | NEEDS TEST ROW | `tienda_catalog_items` exists but has zero rows; needs safe test item. |
| Settings stub actions | DISABLED / PLANNED | Stub/planned tools are not presented as live-ready. |
| Draw/stub actions | DISABLED / PLANNED | Legacy/planned tools remain honest placeholders. |

## 6. Mutation Safety Rules Applied

Only read-only metadata/count SQL and one safe audit-log insert were performed. No production client listing, lead, staff account, order, payment record, magazine issue, Tienda catalog item, public listing content, or Stripe/payment state was mutated.

Disallowed actions were not attempted: permanent deletion of real rows, staff disable, payment/order changes, publish/unpublish real magazine content, live AI review writes, and real listing Feature/Verify/Republish changes.

## 7. Safe Mutation Proof Performed

Performed: `admin_audit_log` insert.

Inserted row:

- `action`: `admin_live_proof_test`
- `target_type`: `admin_os_gate`
- `target_id`: `ADMIN-LIVE-SUPABASE-MUTATION-PROOF-01`
- `id`: `cc35b45f-30c2-442c-aad0-a418c8a4c93c`
- `meta`: harmless gate metadata only; no secrets, customer data, listing data, staff data, order data, or payment data.

Follow-up read proof confirmed exactly one audit row for this gate marker. The row was intentionally not deleted because audit rows are expected to be durable.

## 8. Audit Log Proof

`admin_audit_log` is live, has required columns, had 374 rows before this gate's probe, accepted the safe proof row, and was readable afterward.

Code-level audit coverage exists for:

- Generic `listings` actions: republish, suspend, restore/unsuspend, promote, verify, archive.
- Servicios, Autos, Restaurantes category actions: republish, suspend/restore, promote, verify, archive.
- Listing report status updates.
- User disable/enable actions.
- Site section saves and global site settings-style writes.
- Magazine issue upsert, publish, current issue, archive, and draft delete.
- Tienda order status/notes/unread and Tienda catalog item/image/rule actions.

Known audit gaps or uneven areas:

- Lead lifecycle updates read/write live lead tables, but the inspected lead lifecycle helpers did not show `admin_audit_log` writes.
- Empleos/Viajes action routes are code-backed but currently blocked live for Feature/Verify by missing columns.
- AI moderation persistence cannot write audit-quality proof until `listing_moderation_reviews` exists live.
- Report mark-reviewed/clear-flag semantics still need a dedicated action proof pass.

## 9. Schema Drift Fix Live Proof

| Drift-fix item | Live status |
|---|---:|
| `listing_moderation_reviews` table | MISSING LIVE |
| `listings.admin_promoted` | MISSING LIVE |
| `listings.leonix_verified` | MISSING LIVE |
| `servicios_public_listings.promoted` | MISSING LIVE |
| `empleos_public_listings.admin_promoted` | MISSING LIVE |
| `empleos_public_listings.leonix_verified` | MISSING LIVE |
| `viajes_staged_listings.admin_promoted` | MISSING LIVE |
| `viajes_staged_listings.leonix_verified` | MISSING LIVE |

Local migration `supabase/migrations/20260628180000_admin_live_schema_drift_fix_01.sql` contains the intended additive/idempotent repair, but live Supabase proof shows it is not applied to production.

## 10. Actions Still Needing Test Rows

- Republish / Move to top on a safe test listing for each supported source table.
- Feature and Remove featured after live drift columns are applied.
- Verify Leonix and Remove verified after live drift columns are applied.
- Run AI review and Bulk AI review after `listing_moderation_reviews` exists live.
- Lead status update, archive, restore, and soft-delete on a safe test lead.
- Team invite/create and staff disable using an explicit safe staff test account only.
- Tienda order status changes using a safe test order.
- Tienda catalog edit/publish using a safe test item.
- Magazine publish/current/archive/delete using a safe test draft issue only.
- Report mark-reviewed and clear-flag using safe test report/review rows.

## 11. Actions Not Safe To Test On Real Data

- Permanent delete on real listings.
- Staff disable on real staff/admin accounts.
- Real payment/order status changes.
- Publish, unpublish, archive, or delete real magazine issues without a test draft.
- Public listing Feature/Verify/Republish changes on real client listings.
- Live AI moderation that writes against a real listing before dry-run/test-row policy is set.
- Deleting real leads, subscribers, customers, orders, catalog items, assets, or public content.

## 12. Blockers

Launch-critical blockers for claiming full live action readiness:

- `listing_moderation_reviews` is missing live, blocking AI moderation persistence.
- Feature/Verify drift columns are missing live on `listings`, `servicios_public_listings`, `empleos_public_listings`, and `viajes_staged_listings`.
- `site_page_blocks`, `leonix_promo_codes`, and `leonix_payment_records` are missing live, so website block/revenue proof remains partial.
- No safe test listing/lead/order/catalog/magazine/staff rows were provided for reversible mutation proof.

These are not blockers for this proof/doc/verifier gate because the gate required truthful live documentation, safe read proof, safe mutation rules, verifier pass, and build pass.

## 13. Manual SQL Checklist For Chuy

Run only in Supabase SQL Editor after confirming the target project is production and you are ready to apply the additive drift repair:

1. Review `supabase/migrations/20260628180000_admin_live_schema_drift_fix_01.sql`.
2. Apply the additive migration exactly once through the normal Supabase migration workflow.
3. Re-run live proof:
   - Check `public.listing_moderation_reviews` exists.
   - Check `public.listings.admin_promoted` and `public.listings.leonix_verified`.
   - Check `public.servicios_public_listings.promoted`.
   - Check `public.empleos_public_listings.admin_promoted` and `public.empleos_public_listings.leonix_verified`.
   - Check `public.viajes_staged_listings.admin_promoted` and `public.viajes_staged_listings.leonix_verified`.
4. Create clearly labeled safe test rows for listing, lead, order, catalog item, magazine draft, and staff invite proof.
5. Re-run the next gate without touching real client/staff/payment data.

## 14. Next Recommended Admin OS Gate

`ADMIN-LIVE-SCHEMA-DRIFT-APPLY-AND-TEST-ROWS-01`: apply the additive live schema drift fix through the approved Supabase migration path, create safe test rows, then prove Feature, Verify Leonix, Republish, AI moderation persistence, report actions, lead lifecycle audit logging, Tienda order/catalog updates, and magazine draft actions end-to-end.

## 15. Final Recommendation

Keep the Admin OS action labels conservative. Mark Feature/Verify and AI moderation persistence as `NEEDS SCHEMA GATE` or `NEEDS LIVE PROOF` where the live schema is missing. Treat the core read surfaces and audit-log foundation as live-proven, but do not claim full live mutation readiness until the drift migration is applied and safe test-row action proof passes.
