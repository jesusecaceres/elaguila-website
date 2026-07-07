# Publish Checkout Checkpoint Standard — Gate 01

## 1. Executive Summary

Gate **PUBLISH-CHECKOUT-CHECKPOINT-STANDARD-01** introduces a shared Leonix **Publish Checkout Checkpoint** used at the final preview/publish moment. It standardizes plan summary, optional add-ons display, newsletter opt-in, required confirmation checkboxes, and the paid vs free final action — without replacing each category’s full preview layout.

**Proof categories in this gate:**

1. **Restaurantes** — paid monthly `$399/mo` via `restaurantes_base_monthly`
2. **Bienes Raíces negocio** — paid Agent Showcase `$399/mo` via `br_agent_monthly`, with honest Inventory Pack (+$99/mo) display

## 2. Why Shared Final Checkpoint Exists

Category preview pages previously mixed inline pricing, ad-hoc confirmations, and category-specific publish/payment bypasses. The shared checkpoint:

- Keeps preview easy (no confirmations required to view)
- Gates final checkout/publish behind required confirmations
- Routes paid flows through central Revenue OS checkout
- Preserves Leonix brand (cream/burgundy/gold, mobile-first)
- Prevents fake paid, promo, or newsletter claims

## 3. Preview vs Final Action Rule

| Stage | Confirmations | Action |
|-------|---------------|--------|
| Preview (card + full story) | Not required | View only |
| Final checkpoint | All required boxes checked | Continue to secure payment / Publish listing |

Preview scroll and top CTAs never require confirmation checkboxes.

## 4. Paid Category Flow

1. User completes category form and opens preview
2. Preview renders without confirmation gates
3. User scrolls to **Publish Checkout Checkpoint**
4. User checks required confirmations (+ optional newsletter)
5. Final button: **Continue to secure payment** / **Continuar al pago seguro**
6. Client calls `POST /api/revenue-os/checkout` via `startRevenueCategoryCheckout`
7. Stripe Checkout creates **pending** payment record
8. Webhook is the **only** activator for paid status and entitlements
9. Success page `/revenue-os/pago/exito` remains lookup-only

## 5. Free Category Flow (future gates)

Free categories will use `mode: "free_publish"` with final button **Publish listing** / **Publicar anuncio**. No Stripe session; no fake entitlement activation.

## 6. Promo Code Ownership Rule

- Promo input belongs in the Leonix checkpoint **before** Stripe
- Leonix validates server-side through Revenue OS promo rules on checkout POST
- **Do not** mark promo redeemed on Apply
- **Do not** depend on Stripe-native promo codes as source of truth
- **This gate:** no safe client-side validate API exposed — promo field is **deferred** (honest “coming soon” message when eligible). Checkout POST still accepts `promoCode` when wired in a future gate.

**Next gate:** `PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01`

## 7. Newsletter / Updates Opt-In Rule

Optional checkbox copy (ES/EN) is rendered in the checkpoint. It **does not block** checkout.

- **Persistence:** deferred for publish-flow checkpoint (no fake “you are subscribed” claim)
- Safe path exists elsewhere (`/api/newsletter/subscribe`, `leonix_newsletter_subscribers`) but is not invoked from this gate’s checkpoint to avoid unauthenticated partial state
- Future gate may persist opt-in before checkout and include `newsletter_opt_in` in payment metadata when checkout route accepts it

## 8. Shared Component Contract

| File | Role |
|------|------|
| `app/lib/listingPlans/publishCheckoutCheckpoint.ts` | Types + pure `resolvePublishCheckoutCheckpoint()` |
| `app/lib/listingPlans/publishCheckoutCopy.ts` | Shared ES/EN strings |
| `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx` | Shared UI |

Resolver rules: no mutations, no Stripe secrets, no DB writes, no fake paid/promo/newsletter state.

## 9. Restaurantes Proof Migration

**File:** `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`

- Replaced inline pricing + confirmations + direct `POST /api/clasificados/restaurantes/publish`
- Uses `PublishCheckoutCheckpoint` + `RESTAURANTES_BASE_CHECKOUT` (`restaurantes_base_monthly`)
- Checkout uses `listingDraftId` (session draft) — listing persistence after payment is a follow-up gate
- Coupon add-on (+$99/mo): shown when selected in draft; checkout **blocked** until Revenue OS supports bundled add-on (`REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = false`)

## 10. Bienes Raíces Negocio Proof Migration

**File:** `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx`

- Replaced sticky direct-pay button with scroll-to-checkpoint for main negocio flow
- Uses `PublishCheckoutCheckpoint` + existing Revenue OS checkout after `publishLeonixListingFromAgenteResidencialDraft` (`pending_payment`)
- Inventory-add (child) flow unchanged — free publish button retained

## 11. Bienes Inventory Pack Rule

| Child inventory count | Display | Checkout |
|----------------------|---------|----------|
| 0 | $399/mo base only | Allowed (base package) |
| 1–4 | $498/mo (base + Inventory Pack +$99) | **Blocked** until Revenue OS supports add-on line item |
| >4 | Block message | Blocked |

Constant: `REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED = false`

**No silent $399 charge when children exist.** UI shows truthful $498; checkout blocked with honest message.

**Next gate:** `STRIPE-REVENUE-OS-BIENES-INVENTORY-PACK-ADDON-01`

## 12. Account Plan vs Listing/Ad Plan Rule

- **Account plan** — user-level subscription (separate product)
- **Listing/ad plan** — category/package-specific (`restaurantes_base_monthly`, `br_agent_monthly`, etc.)
- Dashboard paid state must be entitlement/payment-backed, not client-set

## 13. Security Rules

- No Stripe secrets in client or docs
- No fake paid status, entitlement, promo redemption, or newsletter subscription
- No raw Stripe/Supabase/JSON errors shown to users
- Central checkout/webhook routes not rewritten in this gate

## 14. Category Migration Map

| Category | Status |
|----------|--------|
| Restaurantes | **Migrated** (this gate) |
| Bienes Raíces negocio | **Migrated** (this gate; inventory pack checkout blocked honestly) |
| Rentas | Future paid migration |
| Autos privado | Future paid migration |
| Empleos paid job post | Future paid migration |
| Empleos job fair | Future free/non-Stripe |
| Servicios | Future paid migration |
| Comunidad | Future free checkpoint |
| En Venta | Future free/pro/mixed checkpoint |
| Clases | Future free/paid mixed checkpoint |
| Viajes | Future paid/affiliate checkpoint |
| Mascotas / Perdidos | Future free checkpoint |
| Busco / Se busca | Future free checkpoint |

## 15. Manual QA Checklist

- [ ] Restaurant preview opens without checking boxes
- [ ] Restaurant final checkout disabled until boxes checked
- [ ] Restaurant checkout opens central Revenue OS Stripe Checkout
- [ ] Restaurant does not show fake paid before webhook
- [ ] Bienes negocio preview opens without checking boxes
- [ ] Bienes negocio base-only shows $399/mo
- [ ] Bienes negocio with 1–4 child properties shows $498/mo
- [ ] Bienes negocio 5th additional property blocks checkout
- [ ] Bienes negocio with inventory pack blocks checkout (add-on not in Revenue OS yet)
- [ ] Promo field is deferred (no fake Apply)
- [ ] Newsletter opt-in does not block checkout
- [ ] Success page remains Revenue OS lookup-only
- [ ] Cancel page remains honest
- [ ] No old `STRIPE_PRICE_BIENES_NEGOCIO` error in Bienes negocio path
- [ ] ES/EN copy works
- [ ] Mobile layout stacks cleanly

## 16. What This Gate Does Not Do

- Does not migrate Rentas, Autos, Empleos, Servicios, En Venta, Comunidad, Clases, Viajes, Mascotas, Busco
- Does not rewrite central checkout or webhook routes
- Does not add Supabase migrations
- Does not persist restaurant listing before payment (draft checkout only)
- Does not enable Bienes Inventory Pack Stripe line item
- Does not enable promo Apply UI
- Does not persist newsletter opt-in from checkpoint

## 17. Next Gates

1. `PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01` — server-backed promo Apply before checkout
2. `STRIPE-REVENUE-OS-BIENES-INVENTORY-PACK-ADDON-01` — central +$99 inventory pack checkout
3. `RESTAURANTES-PENDING-PUBLISH-BEFORE-CHECKOUT-01` — persist restaurant listing pending payment
4. `PUBLISH-CHECKOUT-NEWSLETTER-PERSISTENCE-01` — safe opt-in capture before checkout
5. Category migrations per map above

## 18. Final Recommendation

Ship shared checkpoint + Restaurantes proof + Bienes negocio proof (with honest inventory pack block). Enable full Bienes $498 checkout only after Revenue OS add-on support lands.

---

**Extended by Standard 02:** `docs/revenue-os-category-pipeline-matrix-and-checkpoint-standard-02.md` — full category/pipeline monetization matrix, dashboard existing-listing upgrade doctrine (Restaurantes P0G model), promo/newsletter future gate, and add-on persistence/media rules. Run `npm run verify:revenue-os-category-pipeline-matrix-and-checkpoint-standard-02`.
