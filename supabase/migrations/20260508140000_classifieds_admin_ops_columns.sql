-- Staff moderation parity: promote/top + Leonix verify on generic listings, servicios, empleos, autos, viajes.

-- ---------------------------------------------------------------------------
-- listings (Rentas, En venta, Comunidad, Clases, etc.)
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists leonix_verified boolean not null default false;

alter table public.listings
  add column if not exists admin_promoted boolean not null default false;

comment on column public.listings.leonix_verified is
  'Leonix staff verification flag for generic classified rows.';

comment on column public.listings.admin_promoted is
  'Staff “top” / spotlight flag; browse may order by this.';

-- ---------------------------------------------------------------------------
-- servicios_public_listings
-- ---------------------------------------------------------------------------
alter table public.servicios_public_listings
  add column if not exists promoted boolean not null default false;

comment on column public.servicios_public_listings.promoted is
  'Staff spotlight / top placement (mirrors restaurantes.promoted).';

-- ---------------------------------------------------------------------------
-- empleos_public_listings
-- ---------------------------------------------------------------------------
alter table public.empleos_public_listings
  add column if not exists leonix_verified boolean not null default false;

alter table public.empleos_public_listings
  add column if not exists admin_promoted boolean not null default false;

comment on column public.empleos_public_listings.leonix_verified is
  'Leonix staff verification (distinct from verified_employer product flag).';

comment on column public.empleos_public_listings.admin_promoted is
  'Staff spotlight / top placement for jobs queue.';

-- ---------------------------------------------------------------------------
-- autos_classifieds_listings
-- ---------------------------------------------------------------------------
alter table public.autos_classifieds_listings
  add column if not exists leonix_verified boolean not null default false;

comment on column public.autos_classifieds_listings.leonix_verified is
  'Leonix staff verification for paid Autos listings.';

-- ---------------------------------------------------------------------------
-- viajes_staged_listings
-- ---------------------------------------------------------------------------
alter table public.viajes_staged_listings
  add column if not exists leonix_verified boolean not null default false;

alter table public.viajes_staged_listings
  add column if not exists admin_promoted boolean not null default false;

comment on column public.viajes_staged_listings.leonix_verified is
  'Leonix staff verification for approved Viajes offers.';

comment on column public.viajes_staged_listings.admin_promoted is
  'Staff spotlight / top placement for Viajes browse.';
