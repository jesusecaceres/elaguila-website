# PR #52 — Preview QA runbook (2026-09)

Branch `integration/category-circuit-closeout-2026-09` (draft PR #52). **Do not merge from this runbook.** Production is `dc25e0a5`.
Goal: build THIS branch once for browser QA without turning branch auto-builds back on permanently.

## 0. Why there is no preview today
Non-production Git builds are cancelled by the project's **Ignored Build Step** (a Vercel dashboard setting — it is not in the repo:
`vercel.json` only declares the subscription-sweep cron). Nothing in this branch changes deployment rules, and nothing here should.

## 1. Smallest safe temporary Preview-build procedure (owner runs; no setting is changed)

**Preferred — one CLI preview deployment of the branch worktree.** Vercel CLI deployments are uploaded from disk; the Ignored Build Step
only gates Git-triggered builds, so no dashboard setting is touched and nothing stays enabled afterwards.

```bash
cd C:\projects\elaguila-website-admin-live-qa      # branch integration/category-circuit-closeout-2026-09, clean, HEAD = FINAL_HEAD
git rev-parse --short HEAD                          # record it in the QA log
npx vercel@latest deploy --target=preview           # NO --prod. Prints a *.vercel.app preview URL
```

Notes:
* `leonix-media` has SSO protection on all non-custom domains: open the preview URL while logged in to the Vercel team, or use the
  team's "Shareable link". Do not disable protection.
* The Preview environment must have the variables the app needs (Supabase URL/anon/service-role, Stripe **sandbox** keys,
  `NEXT_PUBLIC_*`). Check Vercel → Settings → Environment Variables → *Preview* column BEFORE deploying. If Stripe keys are missing in
  Preview, do not add live keys — stop; paid QA moves to the controlled RC in §4.
* **Preview shares the production Supabase project** unless the Preview env points elsewhere. Treat every mutating step as
  production-data: use only the disposable fixtures listed in §3 (owned by the QA account), never real customers' rows.
* The Stripe webhook endpoint is registered for the production URL only, so a preview checkout will NOT deliver a signed webhook to the
  preview. Paid end-to-end therefore belongs to §4, not §3.
* After QA: nothing to revert. Delete the preview deployment in the dashboard if desired.

**Fallback — dashboard temporary override (only if the CLI path is impossible).** Vercel → Settings → Git → *Ignored Build Step*: record the
current command verbatim, change it to allow this one branch (or `exit 1`), push an empty commit `git commit --allow-empty -m "chore: trigger preview"`,
wait for READY, then **restore the recorded command exactly** and confirm a later push is cancelled again. Log the before/after value.

## 2. Preview QA matrix — Admin (run on mobile 390 px AND desktop 1280 px)
Admin login required. For each row: page renders, no console errors, header grammar (Queue/Live, Public, Publish, Back to Clasificados,
lane selector where applicable), summary numbers, filter bar, listing card (listing truth / commercial truth / performance / moderation),
actions, category module.

| Area | Checks |
|---|---|
| Clasificados hub `/admin/workspace/clasificados` | every category tile, counts labelled (capped/filtered wording), links |
| Servicios | Queue + Live, card keeps payment/entitlement/subscription/analytics/reviews/leads/moderation/verification/feature; filter q + exact id/slug/owner/Ad ID **intersect** |
| Restaurantes | same; q + exact filter intersect; pre-payment row shows no Suspend/Archive/Restore |
| Autos | lane selector (Dealer negocios / Privado), Dealer parent card with grouped children, capacity (standard vs entitlement-proven only), Live scope = public predicate, status/owner/Ad ID filter finds an old row |
| Bienes Raíces | Negocio parent → children grouped; FSBO independent (no Negocio actions); Live |
| Rentas / Clases / En Venta / Comunidad / Mascotas / Busco | Queue/Live, status chip = Live scope, sold rows for Busco/Mascotas/Comunidad/Clases, capped-scan banner if shown |
| Empleos | one action set (Restore/Send to review/Suspend/Reject/Archive), unpaid draft can't be suspended/sent to review, applications counts, "payment issue" summary |
| Ofertas Locales | Queue / Live / **History** scope, term filter kept only where valid, approve gate messages, restore |
| Comida Local | payment-aware actions only, suspend/restore reason |
| Viajes | staged lifecycle, notes preserved on moderate, expiry shown |

## 3. Non-payment interactive QA (Preview, disposable fixtures only)
1. **Autos Privado same-row edit**: edit a draft/pending row → same UUID + Leonix Ad ID in URL and Admin.
2. **Empleos edit → Preview same row** (no new row, no new checkout).
3. **Ofertas** approve → reject → restore → History on a disposable offer.
4. **Comida Admin lifecycle**: suspend (reason) → restore; draft/pending_payment never made live.
5. **Bienes Negocio parent/child display** and **Autos Dealer parent/child display** (Admin + dashboard).
6. **Safe delete** against a disposable fixture: soft-delete, then permanent delete (guard messages readable when refused: parent with children,
   public-live, active subscription).
7. Owner dashboard state check: one row each in pending, paused, expired, sold → correct actions, no dead "View public".
8. Admin negative tests: try Restore/Republish/Edit-status on a never-paid Rentas / Clases / FSBO / Servicios / Restaurantes / Autos row → refused.

## 4. Paid QA — production sandbox after merge, or a controlled RC (webhook must be reachable)
Stripe **sandbox** (Leonix Global LLC account); the operator enters credentials and card; the agent must not.
Record for every flow: payment record id, webhook ledger row (`leonix_stripe_webhook_events` completed), entitlement row, subscription row,
listing UUID, Leonix Ad ID.

**A. Fresh Servicios paid flow** — signed webhook 2xx → `leonix_payment_records` paid → entitlement active → subscription active →
**same UUID + same Leonix Ad ID** → public results → public detail → Dashboard → Admin Queue → Admin Live → owner edit + Save & republish
→ **no second base charge** (no new payment record for the base package).

**B. Complete-Payment resume flows** (each: save, abandon checkout, use dashboard "Complete payment", pay, verify same UUID):
Rentas · FSBO · Clases paid · Autos Privado · Comida Local (subscription consent box) · Restaurantes (consent/checkpoint resume).

Also: cancel-and-retry keeps the same listing id (no replacement row); duplicate click reuses the open Stripe session;
paying while the previous session is `complete` returns `payment_in_progress`.

## 5. Exit criteria
All §2 rows pass on both viewports; §3 all pass; §4 A and B pass. Any failure → file with route, listing id, expected vs actual.
Only then can PR #52 leave draft — that decision stays with the owner.
