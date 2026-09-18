# Publication circuit / Revenue OS / Admin truth repair — 2026-09-18

Scope: Leonix production Supabase `xuieateniufcrsfdomwl`, Vercel `leonix-media`. All production reads were
SELECT-only; **no production row was created, changed, or deleted.**

## 1. Webhook 503 (Gate 1) — root cause and owner action

- `POST /api/revenue-os/webhook` returned 503 on 6/6 production deliveries across 3 deployments. The only
  503 sources in code are the route-level guards `webhook_secret_missing` / `stripe_not_configured`
  (`app/lib/listingPlans/revenueWebhook.ts`). These reject **before** the event ledger is written, which is
  why the ledger showed nothing.
- The app's `cs_test_` sessions are absent from the only Stripe account that owns the production webhook
  endpoint (an infra-probe account whose endpoint is described as Preview). The app's key and that endpoint
  are therefore probably in different Stripe accounts/modes.
- **Code shipped:** sanitized rejection log in the webhook route; System Health → "Revenue OS webhook"
  (CONFIG PRESENT / RUNTIME PROOF / RECENT FAILURE — never infers reachability from env presence).
- **⚠️ OWNER-ONLY (nothing below can be done from code):**
  1. Vercel → `leonix-media` → Settings → Environment Variables: confirm `STRIPE_SECRET_KEY` and
     `STRIPE_WEBHOOK_SECRET` exist **scoped to Production** (check by name/scope only; never paste values).
  2. Identify which Stripe account X issued the key in `STRIPE_SECRET_KEY` (Dashboard → Developers → API keys).
  3. In account X, ensure one endpoint → `https://leonixmedia.com/api/revenue-os/webhook` subscribed to the 9
     handled events (`checkout.session.completed`, `checkout.session.expired`, `invoice.paid`,
     `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`,
     `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`).
  4. Copy **that endpoint's** signing secret (`whsec_…`) into Production `STRIPE_WEBHOOK_SECRET`, redeploy.
  5. Review the stale endpoint in the probe account.
  6. Confirm in account X what state the five Plomería checkout sessions are in (paid / open / expired).
  7. Do one Stripe **test-mode** payment; confirm System Health shows a new ledger entry.

## 2. Servicios duplicate (Gate 4) — repaired in code

Root cause: the Application form's non-edit mount wiped the primed canonical listing id every time it mounted
(Back to edit / return from cancelled Stripe checkout), so the next pending-payment save carried no
`existingListingId` and the publish route (correctly) INSERTed a new row → `name`, `name-2` … `name-5`.
Fix: identity is bound to the draft (`serviciosDraftListingIdentity.ts`) and cleared only when the draft is
deleted. Server contract unchanged (declared id must resolve or fail closed).

## 3. Production data-integrity report (Gate 14, read-only, 2026-09-18)

| Check | Result |
|---|---|
| Payment records | 39 (paid 11, canceled 22, pending 6); `listing_source` NULL on all 39 (intentional: routing is by `package_key`) |
| Paid without entitlement link / without listing id | 0 / 0 |
| Entitlements without payment record | 0 |
| **Paid but listing NOT public** | **2 Autos** — AUTO-2026-000219 (privado, paid 2026-07-06) and AUTO-2026-000220 (dealer inventory add-on on a `draft` parent, paid 2026-07-12). Cause proven in code: the client "checkout cancelled" route resets `pending_payment → draft` while the Stripe session stays payable; the webhook activation then refused `draft` (`unsafe_status`). **Fixed going forward** (verified payment now activates draft/payment_failed rows). These two rows were NOT touched. |
| Pending payment but listing public | 0 in every category |
| Same listing + package paid twice | 1 — `restaurantes_base_monthly`, listing `12582849…`, two **different** Stripe subscriptions (2026-07-03, 2026-07-07): a double subscription on one listing (test mode; both pre-date the active-entitlement guard). Owner review. |
| Stale pending with session > 24h | 1 (Servicios) |
| Pending with no Stripe session | 2 |
| Synthetic (non-uuid listing_id) payment rows | 5 (`stripe_e2e_test_*` Rentas/Empleos) — e2e seeds |
| Webhook ledger | 7 events, all livemode=false, latest 2026-09-12 |
| Duplicate candidates (owner + normalized name) | Servicios: 2 groups — Plomería 000111–115 (all pending_payment) and `leonix-global-llc` 000006/000007 (both published). Empleos: 0. |
| Public rows with no paid payment and no active entitlement | Servicios 102/103, Restaurantes 5/7, Rentas 59/60, Clases 10/10, Empleos 4/5, Autos 4/5, BR 1/2, En Venta 1/1. All pre-date 2026-07-02 (first real payment) **except**: Servicios 000107–000110 and Restaurantes REST 000010–000013 (published 2026-08-20), and BR-2026-000019 (2026-07-15) — post-Revenue-OS publications without a payment record; owner to confirm they are admin-comped / seeded. |
| `listing_lifecycle_reminder_events` | 0 rows (see §5) |

## 4. Old Plomería QA rows — cleanup PLAN (Gate 17, NOT executed)

`SERV-2026-000111…115` (owner one, all `pending_payment`): 111 = canceled(session) + pending(no session);
112 = canceled + pending(no session); 113/114/115 = pending with a Stripe session.
No mutation was performed and none is proposed without per-row owner approval.

1. Owner checks the three sessions (113–115) in the correct Stripe account. **If any is paid**, it must be
   fulfilled by re-delivering the Stripe event to the (fixed) webhook — never by marking a record paid by hand.
2. Keep 111 as the canonical row (oldest, canonical slug).
3. For unpaid rows 112–115: use the existing Admin Servicios status action to move them to `archived`
   (reversible, no deletion). Their open Stripe sessions expire on their own and the webhook then flips the
   payment records to `canceled`.
4. Hard-delete only after owner sign-off, with a before-image export.

## 5. RLS plan — `public.listing_lifecycle_reminder_events` (Gate 18, NOT executed)

Verified read-only on production: RLS **disabled**; no policies; `anon` and `authenticated` hold
SELECT/INSERT/UPDATE/DELETE/TRUNCATE; table is empty; no trigger, function or view references it; no app code
reads or writes it (only the migration and a string-presence verifier); the reminder runner does not exist yet.

Consequence: anyone holding the public anon key could read, write or truncate it. Because nothing uses it,
locking it down cannot break the app — but the policy choice belongs to the owner because a future runner
will need access.

Recommended migration (apply after owner approval; **not** placed in `supabase/migrations`):

```sql
alter table public.listing_lifecycle_reminder_events enable row level security;
revoke all on public.listing_lifecycle_reminder_events from anon, authenticated;
-- service_role bypasses RLS; the future reminder runner must use the service-role client.
-- No owner-read policy yet: add `for select using (owner_id = auth.uid())` only when a dashboard needs it.
```

Rollback: `alter table … disable row level security; grant … to anon, authenticated;` (no data at risk).

## 6. Controlled Stripe test (Gate 16) — BLOCKED_OWNER_ACTION

A runtime proof needs the production webhook to verify signatures (§1). Until the owner completes §1 steps 1–4
a test payment cannot produce a 2xx delivery, so nothing was run and no QA listing was created.
