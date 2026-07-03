-- RESTAURANTES-PENDING-PAYMENT-STATUS-CONSTRAINT-FIX-01
-- Pre-Stripe checkout rows use pending_payment (hidden from public RLS).
-- Webhook fulfillment activates pending_payment (or legacy archived) → published.
-- Safe additive constraint refresh: preserves published, suspended, archived.

alter table public.restaurantes_public_listings
  drop constraint if exists restaurantes_public_listings_status_check;

alter table public.restaurantes_public_listings
  add constraint restaurantes_public_listings_status_check
  check (status in ('pending_payment', 'published', 'suspended', 'archived'));

comment on column public.restaurantes_public_listings.status is
  'published = live directory; pending_payment = hidden pre-Stripe checkout; suspended = staff hide; archived = staff archive.';
