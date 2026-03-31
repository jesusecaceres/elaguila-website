-- Staff-only fulfillment notes (not customer-facing).
ALTER TABLE public.tienda_orders
  ADD COLUMN IF NOT EXISTS admin_internal_notes text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.tienda_orders.admin_internal_notes IS 'Leonix internal fulfillment notes; not shown to customers.';
