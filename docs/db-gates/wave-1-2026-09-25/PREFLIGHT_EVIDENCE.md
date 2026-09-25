# Wave 1 — pre-flight evidence (Leonix Media `xuieateniufcrsfdomwl`)

Captured read-only at **2026-09-25T19:39:56Z**, before any Wave-1 write. Source package: `2fad87684` (pushed).

## A/B — capacity activation RPCs

| function | ACL | anon | authenticated | PUBLIC | service_role | `md5(pg_get_functiondef)` | length |
|---|---|---|---|---|---|---|---|
| `autos_dealer_activate_listing(uuid,uuid,text)` | `postgres=X anon=X authenticated=X service_role=X` | true | true | false | true | `d5cd8e627012e7c0df7db38fa84e978f` | 4072 |
| `br_negocio_activate_listing(uuid,uuid,text)` | `postgres=X anon=X authenticated=X service_role=X` | true | true | false | true | `f69cc5331601605c6bfbe4d8fcfdf220` | 4141 |

Bodies (as read): Autos — TOTAL-based count within the dealer group (parent included), limit `case when v_boost_active then 20 else 10 end`,
subscription gate refuses only grace/suspended/canceled (a missing subscription record is allowed). BR — limit
`case when v_pack_active then 4 else 1 end`, parent counted (`v_count + case when v_parent_active ...`).

## C — `public.listing_lifecycle_reminder_events`

RLS **off** · force RLS off · 0 policies · **0 rows** · ACL `postgres=arwdDxtm anon=arwdDxtm authenticated=arwdDxtm service_role=arwdDxtm`.

## D — `public.leonix_newsletter_subscribers`

- columns: `unsubscribe_token text`, `unsubscribe_token_expires_at timestamptz` — **no `unsubscribed_at`**
- indexes: archived_at_idx, created_at_idx, deleted_at_idx, email_unique_idx, pkey, status_idx, `unsubscribe_token_uk` (UNIQUE partial)
- status check: `leonix_newsletter_subscribers_status_chk = CHECK (status IN ('subscribed','unsubscribed'))`
- 11 rows · row fingerprint `md5(id|status|unsubscribe_token|updated_at)` = `2506d64b59d7efa12745f899db2ee40c`

## E — `public.site_category_config`

- servicios: `visibility=public sort_order=40 operational_status=staged highlight=false notes='Puede seguir en transición según producto.' updated_at=2026-04-09T02:10:09.208535+00`
- 5 rows · fingerprint of the other 4 rows = `702e1a07c7d2d9c0ac207cb1c9a7bfda`

## Security advisor (before) — captured 2026-09-25T19:21Z

- ERROR `rls_disabled_in_public` ×1 — `public.listing_lifecycle_reminder_events`
- WARN `anon_security_definer_function_executable` ×15 — incl. `autos_dealer_activate_listing`, `br_negocio_activate_listing`
- WARN `authenticated_security_definer_function_executable` ×15 — incl. both capacity RPCs
- WARN `function_search_path_mutable` ×23 · WARN `auth_leaked_password_protection` ×1 · INFO `rls_enabled_no_policy` ×150

---

# Wave 1 — APPLIED 2026-09-25 (post-verification, read-only)

| step | recorded migration | result |
|---|---|---|
| 1 | `20260925194103 revoke_capacity_rpc_client_execute` | both RPC ACLs now `postgres=X service_role=X`; anon/authenticated/PUBLIC EXECUTE = false; service_role = true; body md5 unchanged (`d5cd8e62…`, `f69cc533…`) |
| 2 | `20260925194130 listing_lifecycle_reminder_events_lockdown` | RLS on; ACL `postgres=arwdDxtm service_role=arwdDxtm`; anon/authenticated no privilege; 0 rows (unchanged); 0 policies; no public table has RLS off |
| 3 | `20260925194202 leonix_newsletter_unsubscribe` | `unsubscribed_at timestamptz NULL` added; redundant non-unique `..._unsubscribe_token_idx` created (accepted), UNIQUE `..._uk` intact; status CHECK unchanged; 11 rows, fingerprint unchanged `2506d64b…` |
| 4 | reviewed seed (execute_sql, not a migration) | servicios `staged` → `live` at 2026-09-25T19:42:22Z; visibility/sort_order/highlight/notes unchanged; 5 rows; other-row fingerprint unchanged `702e1a07…` |

Unsubscribe route schema check: `EXPLAIN` of the route's exact SELECT (by `unsubscribe_token`) and UPDATE
(`status`, `unsubscribed_at`, `updated_at`) plans successfully — no row touched.

Security advisor after: ERROR `rls_disabled_in_public` **gone**; `anon_/authenticated_security_definer_function_executable`
15 → 13 each (both capacity RPCs removed); `function_search_path_mutable` 23 (unchanged); leaked-password 1 (unchanged);
INFO `rls_enabled_no_policy` 150 → 151 (the reminder table is now deny-all to clients — intended).
