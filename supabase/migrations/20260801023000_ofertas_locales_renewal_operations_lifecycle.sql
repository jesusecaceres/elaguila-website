-- Package 8: Ofertas/Cupones renewal, republish, cleanup execution, and launch operations.
-- Forward-only schema. No data backfill, no payment mutation, no provider/storage/email calls.
begin;

create table if not exists public.ofertas_local_public_terms (
  id uuid primary key default gen_random_uuid(),
  oferta_local_id uuid not null references public.ofertas_locales (id) on delete cascade,
  renewal_attempt_id uuid,
  leonix_ad_id text not null,
  activation_source text not null,
  product_key text not null,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  payment_record_id uuid,
  package_entitlement_id uuid,
  partner_assignment_id uuid references public.ofertas_local_partner_assignments (id) on delete set null,
  source_asset_version_id uuid references public.ofertas_local_source_assets (id) on delete set null,
  approved_by uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint ofertas_public_terms_source_chk
    check (activation_source in ('initial', 'paid_renewal', 'partner_courtesy_renewal', 'admin_recovery')),
  constraint ofertas_public_terms_status_chk
    check (status in ('scheduled', 'active', 'expired', 'cancelled', 'failed')),
  constraint ofertas_public_terms_duration_chk check (expires_at > starts_at)
);

create unique index if not exists ofertas_public_terms_renewal_once_idx
  on public.ofertas_local_public_terms (renewal_attempt_id)
  where renewal_attempt_id is not null;

create index if not exists ofertas_public_terms_offer_window_idx
  on public.ofertas_local_public_terms (oferta_local_id, starts_at, expires_at, status);

alter table public.ofertas_local_public_terms enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ofertas_local_public_terms'
      and policyname = 'ofertas_public_terms_owner_read'
  ) then
    create policy "ofertas_public_terms_owner_read"
      on public.ofertas_local_public_terms for select to authenticated
      using (
        exists (
          select 1 from public.ofertas_locales ol
          where ol.id = oferta_local_id and ol.owner_id = auth.uid()
        )
      );
  end if;
end $$;

create table if not exists public.ofertas_local_renewal_attempts (
  id uuid primary key default gen_random_uuid(),
  oferta_local_id uuid not null references public.ofertas_locales (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  leonix_ad_id text not null,
  product_key text not null,
  prior_term_id uuid references public.ofertas_local_public_terms (id) on delete set null,
  source_asset_version_id uuid references public.ofertas_local_source_assets (id) on delete set null,
  state text not null default 'draft',
  commercial_path text not null default 'paid',
  payment_record_id uuid,
  package_entitlement_id uuid,
  partner_assignment_id uuid references public.ofertas_local_partner_assignments (id) on delete set null,
  requested_at timestamptz not null default now(),
  checkout_created_at timestamptz,
  paid_or_authorized_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  scheduled_activation_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  abandoned_at timestamptz,
  rejection_reason text,
  correction_reason text,
  failure_reason text,
  retry_count integer not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ofertas_renewal_state_chk check (
    state in (
      'draft',
      'awaiting_payment',
      'payment_pending',
      'authorized',
      'preparing_content',
      'scan_pending',
      'review_required',
      'ready_to_submit',
      'pending_review',
      'correction_required',
      'approved_scheduled',
      'active',
      'expired',
      'cancelled',
      'failed'
    )
  ),
  constraint ofertas_renewal_commercial_path_chk check (commercial_path in ('paid', 'partner_courtesy')),
  constraint ofertas_renewal_retry_chk check (retry_count >= 0)
);

create unique index if not exists ofertas_renewal_one_open_attempt_idx
  on public.ofertas_local_renewal_attempts (oferta_local_id, product_key)
  where state in (
    'draft',
    'awaiting_payment',
    'payment_pending',
    'authorized',
    'preparing_content',
    'scan_pending',
    'review_required',
    'ready_to_submit',
    'pending_review',
    'correction_required',
    'approved_scheduled'
  );

create index if not exists ofertas_renewal_owner_state_idx
  on public.ofertas_local_renewal_attempts (owner_id, state, updated_at);

create index if not exists ofertas_renewal_due_activation_idx
  on public.ofertas_local_renewal_attempts (scheduled_activation_at, state)
  where state = 'approved_scheduled';

alter table public.ofertas_local_renewal_attempts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ofertas_local_renewal_attempts'
      and policyname = 'ofertas_renewal_owner_read'
  ) then
    create policy "ofertas_renewal_owner_read"
      on public.ofertas_local_renewal_attempts for select to authenticated
      using (owner_id = auth.uid());
  end if;
end $$;

alter table public.ofertas_local_asset_cleanup_queue
  add column if not exists processing_lease_id uuid,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists retry_after_at timestamptz,
  add column if not exists last_error text,
  add column if not exists max_attempts integer not null default 5;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ofertas_asset_cleanup_max_attempts_chk'
  ) then
    alter table public.ofertas_local_asset_cleanup_queue
      add constraint ofertas_asset_cleanup_max_attempts_chk check (max_attempts > 0);
  end if;
end $$;

create index if not exists ofertas_asset_cleanup_claim_idx
  on public.ofertas_local_asset_cleanup_queue (status, retry_after_at, created_at)
  where status in ('pending', 'failed');

create table if not exists public.ofertas_local_notification_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  oferta_local_id uuid not null references public.ofertas_locales (id) on delete cascade,
  renewal_attempt_id uuid references public.ofertas_local_renewal_attempts (id) on delete set null,
  recipient_role text not null,
  recipient_user_id uuid,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  processing_started_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ofertas_notification_role_chk check (recipient_role in ('owner', 'admin')),
  constraint ofertas_notification_status_chk check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled'))
);

create unique index if not exists ofertas_notification_idempotency_idx
  on public.ofertas_local_notification_events (idempotency_key);

create index if not exists ofertas_notification_status_idx
  on public.ofertas_local_notification_events (status, created_at);

alter table public.ofertas_local_notification_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ofertas_local_notification_events'
      and policyname = 'ofertas_notification_owner_read'
  ) then
    create policy "ofertas_notification_owner_read"
      on public.ofertas_local_notification_events for select to authenticated
      using (recipient_role = 'owner' and recipient_user_id = auth.uid());
  end if;
end $$;

create or replace function public.activate_due_oferta_local_renewal(
  p_renewal_attempt_id uuid,
  p_actor_user_id uuid default null
)
returns table(term_id uuid, activation_at timestamptz, expires_at timestamptz)
language plpgsql
security invoker
as $$
declare
  v_attempt public.ofertas_local_renewal_attempts%rowtype;
  v_parent record;
  v_activation_at timestamptz;
  v_expires_at timestamptz;
  v_term_id uuid;
begin
  select * into v_attempt
  from public.ofertas_local_renewal_attempts
  where id = p_renewal_attempt_id
  for update;

  if not found then
    raise exception 'renewal attempt not found';
  end if;

  if v_attempt.state not in ('pending_review', 'approved_scheduled') then
    raise exception 'renewal attempt is not activation eligible';
  end if;

  select id, published_at, expires_at, public_source_asset_id
    into v_parent
  from public.ofertas_locales
  where id = v_attempt.oferta_local_id
  for update;

  if not found then
    raise exception 'parent listing not found';
  end if;

  v_activation_at := greatest(now(), coalesce(v_parent.expires_at, now()));
  v_expires_at := v_activation_at + interval '30 days';

  insert into public.ofertas_local_public_terms (
    oferta_local_id,
    renewal_attempt_id,
    leonix_ad_id,
    activation_source,
    product_key,
    starts_at,
    expires_at,
    payment_record_id,
    package_entitlement_id,
    partner_assignment_id,
    source_asset_version_id,
    approved_by,
    status
  )
  values (
    v_attempt.oferta_local_id,
    v_attempt.id,
    v_attempt.leonix_ad_id,
    case when v_attempt.commercial_path = 'partner_courtesy' then 'partner_courtesy_renewal' else 'paid_renewal' end,
    v_attempt.product_key,
    v_activation_at,
    v_expires_at,
    v_attempt.payment_record_id,
    v_attempt.package_entitlement_id,
    v_attempt.partner_assignment_id,
    v_attempt.source_asset_version_id,
    p_actor_user_id,
    case when v_activation_at <= now() then 'active' else 'scheduled' end
  )
  on conflict (renewal_attempt_id) where renewal_attempt_id is not null do update
    set expires_at = excluded.expires_at
  returning id into v_term_id;

  update public.ofertas_local_renewal_attempts
  set state = case when v_activation_at <= now() then 'active' else 'approved_scheduled' end,
      approved_at = coalesce(approved_at, now()),
      scheduled_activation_at = v_activation_at,
      activated_at = case when v_activation_at <= now() then v_activation_at else activated_at end,
      expires_at = v_expires_at,
      updated_at = now()
  where id = v_attempt.id;

  if v_activation_at <= now() then
    update public.ofertas_locales
    set status = 'approved',
        published_at = v_activation_at,
        expires_at = v_expires_at,
        public_source_asset_id = coalesce(v_attempt.source_asset_version_id, public_source_asset_id),
        active_source_asset_id = coalesce(v_attempt.source_asset_version_id, active_source_asset_id),
        asset_lifecycle_status = 'current',
        updated_at = now()
    where id = v_attempt.oferta_local_id;

    if v_attempt.source_asset_version_id is not null then
      update public.oferta_local_items
      set source_lifecycle_status = 'superseded',
          is_active = false,
          updated_at = now()
      where oferta_local_id = v_attempt.oferta_local_id
        and (
          source_asset_version_id is null
          or source_asset_version_id <> v_attempt.source_asset_version_id
        );

      update public.oferta_local_items
      set source_lifecycle_status = 'active',
          is_active = true,
          updated_at = now()
      where oferta_local_id = v_attempt.oferta_local_id
        and source_asset_version_id = v_attempt.source_asset_version_id
        and review_status = 'approved';
    end if;
  end if;

  term_id := v_term_id;
  activation_at := v_activation_at;
  expires_at := v_expires_at;
  return next;
end;
$$;

comment on table public.ofertas_local_renewal_attempts is
  'Package 8 canonical same-parent Ofertas renewal/republish attempts. Checkout/webhook authorization does not start a public term.';
comment on table public.ofertas_local_public_terms is
  'Package 8 immutable Ofertas public-term history for initial and renewed terms. No legacy backfill.';
comment on table public.ofertas_local_notification_events is
  'Package 8 Ofertas-local notification event outbox. Pending events do not imply delivery.';
comment on function public.activate_due_oferta_local_renewal(uuid, uuid) is
  'Package 8 renewal activation RPC with no-day-loss scheduling. Intended for service-role server code.';

commit;
