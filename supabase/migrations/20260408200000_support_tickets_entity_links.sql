-- Optional cross-links for internal support routing (admin-only writes; no end-user portal).
-- Prerequisite: public.support_tickets from 20260408183000_control_center_extensions.sql (or equivalent).
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.tienda_orders (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS support_tickets_order_id_idx ON public.support_tickets (order_id);
CREATE INDEX IF NOT EXISTS support_tickets_listing_id_idx ON public.support_tickets (listing_id);

COMMENT ON COLUMN public.support_tickets.user_id IS 'Optional profile context for admin navigation.';
COMMENT ON COLUMN public.support_tickets.order_id IS 'Optional Tienda order context.';
COMMENT ON COLUMN public.support_tickets.listing_id IS 'Optional Clasificados listing context.';
