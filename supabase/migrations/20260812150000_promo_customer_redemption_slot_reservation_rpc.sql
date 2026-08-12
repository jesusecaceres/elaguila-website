-- Package F Build F2 — promo per-customer concurrency closure.
--
-- One additive, SECURITY DEFINER function only. No new tables, columns, indexes, or RLS changes
-- to `leonix_promo_code_redemptions` (its existing status CHECK constraint already permits every
-- status this function writes/reads: pending, validated, redeemed).
--
-- Closes the race the F2 recovery certification found: `resolvePromoForCheckout()`'s
-- SELECT-count-of-redeemed-rows check and `createPendingPromoRedemption()`'s plain INSERT happen
-- as two separate, non-atomic steps — two concurrent checkout attempts by the same customer for
-- the same per-customer-capped promo code can both read "under limit" before either row exists,
-- both reserve, both pay, and both get marked redeemed, exceeding `per_customer_limit`.
--
-- Mirrors the exact pattern already reviewed and shipped in
-- `20260810120000_autos_br_negocio_capacity_activation_rpc.sql`: a transaction-scoped Postgres
-- advisory lock (auto-released on commit/rollback) serializes concurrent attempts for the same
-- (promo_code_id, customer identity) pair — different customers or different promo codes never
-- block each other. Inside the lock, existing PENDING/VALIDATED/REDEEMED rows for that exact pair
-- are counted (not just terminal `redeemed` ones — counting in-flight reservations is what closes
-- the race), and a new `pending` row is inserted only when that count is still below the
-- caller-supplied `per_customer_limit`. This never accepts a caller-supplied *count* — only the
-- limit value already read from the promo row by existing application code — and correctly
-- generalizes to any `per_customer_limit` value, not just 1 (a plain unique constraint could not
-- express that).
--
-- Global `max_redemptions`, expiration, category/package/placement scope, and Stripe session
-- idempotency (`markPromoRedemptionRedeemed`) are all unchanged — this function narrowly replaces
-- only the per-customer reservation step.
--
-- AUTHORED ONLY. NOT APPLIED to any database by this migration file's presence in the repo —
-- application is a separate, later, explicitly-authorized step, matching every prior "authored,
-- not applied" migration in this program (including the Gate 1 analytics RLS migration and the
-- C7 capacity-activation RPCs above).

create or replace function public.reserve_promo_customer_redemption_slot(
  p_promo_code_id uuid,
  p_owner_user_id uuid,
  p_email text,
  p_per_customer_limit int,
  p_payment_record_id uuid,
  p_listing_id text,
  p_leonix_ad_id text,
  p_category text,
  p_package_key text,
  p_placement_tier text,
  p_discount_cents int
)
returns table(reserved boolean, blocked_reason text, redemption_id uuid, customer_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email_norm text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_identity_key text;
  v_limit int;
  v_count int;
  v_new_id uuid;
begin
  if p_owner_user_id is null and v_email_norm is null then
    return query select false, 'no_customer_identity'::text, null::uuid, null::int;
    return;
  end if;

  -- Same (promo, identity) pair always hashes to the same lock key regardless of which identity
  -- field was supplied first, so a customer who checks out once via owner_user_id and once via a
  -- bare email cannot bypass the lock by mixing identity sources.
  v_identity_key := coalesce(p_owner_user_id::text, v_email_norm);
  perform pg_advisory_xact_lock(871003, hashtext(p_promo_code_id::text || ':' || v_identity_key));

  select count(*) into v_count
  from public.leonix_promo_code_redemptions r
  where r.promo_code_id = p_promo_code_id
    and r.status in ('pending', 'validated', 'redeemed')
    and (
      (p_owner_user_id is not null and r.owner_user_id = p_owner_user_id)
      or (v_email_norm is not null and lower(r.email) = v_email_norm)
    );

  -- Mirrors app/lib/listingPlans/promoCodeRules.ts's exact existing semantics:
  -- `const perCustomer = input.perCustomerLimit ?? 1;` then `if (perCustomer >= 1 && count >= perCustomer)`.
  v_limit := coalesce(p_per_customer_limit, 1);
  if v_limit >= 1 and v_count >= v_limit then
    return query select false, 'per_customer_limit_reached'::text, null::uuid, v_count;
    return;
  end if;

  insert into public.leonix_promo_code_redemptions (
    promo_code_id, payment_record_id, owner_user_id, email, listing_id, leonix_ad_id,
    category, package_key, placement_tier, status, discount_cents, metadata
  ) values (
    p_promo_code_id, p_payment_record_id, p_owner_user_id, p_email, p_listing_id, p_leonix_ad_id,
    p_category, p_package_key, p_placement_tier, 'pending', p_discount_cents,
    jsonb_build_object(
      'gate', 'PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01',
      'destructive', false,
      'reserved_via', 'reserve_promo_customer_redemption_slot'
    )
  )
  returning id into v_new_id;

  return query select true, null::text, v_new_id, v_count + 1;
end;
$$;

revoke all on function public.reserve_promo_customer_redemption_slot(uuid, uuid, text, int, uuid, text, text, text, text, text, int) from public;
grant execute on function public.reserve_promo_customer_redemption_slot(uuid, uuid, text, int, uuid, text, text, text, text, text, int) to service_role;

comment on function public.reserve_promo_customer_redemption_slot(uuid, uuid, text, int, uuid, text, text, text, text, text, int) is
  'Package F Build F2 — atomic, SECURITY DEFINER per-customer redemption-slot reservation for leonix_promo_code_redemptions. Serializes concurrent checkout attempts for the same (promo_code_id, customer identity) via a transaction-scoped advisory lock, counts existing pending/validated/redeemed rows for that pair, and only inserts a new pending row when the count is below the caller-supplied per_customer_limit (never a caller-supplied count). service_role execution only.';
