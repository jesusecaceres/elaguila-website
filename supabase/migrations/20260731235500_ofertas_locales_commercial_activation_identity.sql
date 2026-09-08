-- Package 5: Ofertas/Cupones commercial activation + canonical Leonix Ad ID.
-- Forward-only metadata; no paid backfill, no Stripe ID invention, no public activation, no RLS change.

begin;

alter table public.ofertas_locales
  add column if not exists leonix_ad_id text,
  add column if not exists commercial_product_key text,
  add column if not exists commercial_amount_cents integer,
  add column if not exists commercial_currency text,
  add column if not exists commercial_duration_days integer,
  add column if not exists commercial_ai_included boolean,
  add column if not exists payment_status text,
  add column if not exists paid_at timestamptz,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_record_id uuid,
  add column if not exists package_entitlement_id uuid,
  add column if not exists entitlement_status text,
  add column if not exists entitlement_granted_at timestamptz,
  add column if not exists entitlement_ends_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ofertas_locales_leonix_ad_id_format_chk'
  ) then
    alter table public.ofertas_locales
      add constraint ofertas_locales_leonix_ad_id_format_chk
      check (leonix_ad_id is null or leonix_ad_id ~ '^LNX-[A-Z0-9]{8}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ofertas_locales_commercial_product_key_chk'
  ) then
    alter table public.ofertas_locales
      add constraint ofertas_locales_commercial_product_key_chk
      check (
        commercial_product_key is null or
        commercial_product_key in ('ofertas_locales_flyer_30d', 'ofertas_locales_coupons_30d')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ofertas_locales_payment_status_chk'
  ) then
    alter table public.ofertas_locales
      add constraint ofertas_locales_payment_status_chk
      check (
        payment_status is null or
        payment_status in ('unpaid', 'pending', 'paid', 'failed', 'canceled', 'refunded', 'disputed')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ofertas_locales_entitlement_status_chk'
  ) then
    alter table public.ofertas_locales
      add constraint ofertas_locales_entitlement_status_chk
      check (
        entitlement_status is null or
        entitlement_status in ('none', 'pending', 'active', 'revoked', 'expired')
      );
  end if;
end $$;

create unique index if not exists ofertas_locales_leonix_ad_id_unique_idx
  on public.ofertas_locales (leonix_ad_id)
  where leonix_ad_id is not null;

create index if not exists ofertas_locales_commercial_product_key_idx
  on public.ofertas_locales (commercial_product_key);

create index if not exists ofertas_locales_payment_status_idx
  on public.ofertas_locales (payment_status);

create index if not exists ofertas_locales_payment_record_id_idx
  on public.ofertas_locales (payment_record_id)
  where payment_record_id is not null;

comment on column public.ofertas_locales.leonix_ad_id is
  'Stable public Leonix ad identifier for the canonical Ofertas/Cupones parent row. Generated server-side; UUID remains canonical.';
comment on column public.ofertas_locales.commercial_product_key is
  'Revenue OS product key purchased for this Ofertas/Cupones listing.';
comment on column public.ofertas_locales.commercial_amount_cents is
  'Server-derived expected Stripe amount in cents for the purchased Ofertas/Cupones package.';
comment on column public.ofertas_locales.payment_status is
  'Summary of verified commercial payment state; source of truth remains Revenue OS payment and entitlement records.';
comment on column public.ofertas_locales.entitlement_status is
  'Summary of listing entitlement state used for owner/admin truth and submission gating.';

commit;
