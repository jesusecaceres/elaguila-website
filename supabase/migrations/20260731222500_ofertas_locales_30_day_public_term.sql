-- Package 4B: canonical 30-day public advertising term for Ofertas/Cupones.
-- Forward-only shape change; no data backfill, no RLS change, no commerce schema.

begin;

alter table public.ofertas_locales
  add column if not exists published_at timestamptz;

alter table public.ofertas_locales
  add column if not exists expires_at timestamptz;

comment on column public.ofertas_locales.published_at is
  'Authoritative public activation timestamp for the paid Ofertas/Cupones public term.';

comment on column public.ofertas_locales.expires_at is
  'Public advertising term expiration. Set from first approval/public activation plus the canonical 30-day term.';

create index if not exists ofertas_locales_public_term_active_idx
  on public.ofertas_locales (expires_at)
  where status = 'approved'
    and published_at is not null
    and expires_at is not null;

commit;
