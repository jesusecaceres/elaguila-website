-- Allow global/category analytics rows without fabricating a listing slug.
alter table public.servicios_analytics_events
  alter column listing_slug drop not null;

comment on column public.servicios_analytics_events.listing_slug is
  'Target listing when applicable; NULL for global events (search, filter usage, aggregate views).';
