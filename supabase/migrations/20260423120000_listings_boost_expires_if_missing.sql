-- Align remote `listings` with Clasificados Rentas / En Venta when older migrations were skipped.
-- Idempotent: each ADD COLUMN IF NOT EXISTS is safe alone.

alter table public.listings add column if not exists boost_expires timestamptz null;

comment on column public.listings.boost_expires is
  'End of paid/featured visibility window; complements Leonix:promoted in detail_pairs (Clasificados browse).';

alter table public.listings add column if not exists seller_type text null;
alter table public.listings add column if not exists rentas_tier text null;
alter table public.listings add column if not exists business_name text null;
alter table public.listings add column if not exists business_meta text null;

comment on column public.listings.seller_type is 'personal | business (Rentas negocio, En Venta business)';
comment on column public.listings.business_meta is 'JSON string for business listings (negocio agent, redes, etc.)';
