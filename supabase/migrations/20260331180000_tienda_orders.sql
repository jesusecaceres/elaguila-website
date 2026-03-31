-- Tienda operational orders inbox (admin + fulfillment).
-- Inserts/reads use service role from Next.js admin + public order API.

CREATE TABLE IF NOT EXISTS public.tienda_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source_type text NOT NULL,
  product_slug text NOT NULL,
  product_title text NOT NULL,
  category_slug text NOT NULL DEFAULT '',
  customer_user_id uuid,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  business_name text NOT NULL DEFAULT '',
  fulfillment_preference text NOT NULL,
  notes text NOT NULL DEFAULT '',
  approval_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  warnings_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  specs_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  sidedness_summary jsonb,
  status text NOT NULL DEFAULT 'new',
  unread_admin boolean NOT NULL DEFAULT true,
  email_delivery_status text NOT NULL DEFAULT 'pending',
  email_last_error text,
  order_payload jsonb NOT NULL,
  approval_complete boolean NOT NULL DEFAULT false,
  CONSTRAINT tienda_orders_status_chk CHECK (status IN (
    'new',
    'reviewing',
    'ready_to_fulfill',
    'ordered',
    'completed',
    'needs_customer_followup',
    'failed_submission'
  )),
  CONSTRAINT tienda_orders_email_delivery_chk CHECK (email_delivery_status IN ('pending', 'sent', 'failed', 'skipped'))
);

CREATE TABLE IF NOT EXISTS public.tienda_order_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.tienda_orders (id) ON DELETE CASCADE,
  asset_role text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  width_px int,
  height_px int,
  storage_key text NOT NULL,
  asset_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS tienda_orders_created_at_idx ON public.tienda_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS tienda_orders_status_idx ON public.tienda_orders (status);
CREATE INDEX IF NOT EXISTS tienda_orders_unread_idx ON public.tienda_orders (unread_admin) WHERE unread_admin = true;
CREATE INDEX IF NOT EXISTS tienda_orders_customer_email_lower_idx ON public.tienda_orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS tienda_orders_order_ref_idx ON public.tienda_orders (order_ref);
CREATE INDEX IF NOT EXISTS tienda_order_assets_order_id_idx ON public.tienda_order_assets (order_id);

ALTER TABLE public.tienda_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tienda_order_assets ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: access via service role only.

COMMENT ON TABLE public.tienda_orders IS 'Tienda checkout submissions persisted for admin inbox (not email-only).';
COMMENT ON TABLE public.tienda_order_assets IS 'Durable Blob assets linked to tienda_orders.';
