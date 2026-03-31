-- Admin-managed Tienda catalog (CMS). Access via service role from Next.js only.

CREATE TABLE IF NOT EXISTS public.tienda_catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title_es text NOT NULL,
  title_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  category_slug text NOT NULL,
  subcategory_slug text,
  short_description_es text NOT NULL DEFAULT '',
  short_description_en text NOT NULL DEFAULT '',
  description_es text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  pricing_mode text NOT NULL DEFAULT 'display_only'
    CONSTRAINT tienda_catalog_items_pricing_mode_chk CHECK (pricing_mode IN ('display_only', 'calculated_ready', 'quote_only')),
  price_label text,
  price_note text,
  base_price numeric(12, 2),
  cta_mode text NOT NULL DEFAULT 'request_quote'
    CONSTRAINT tienda_catalog_items_cta_mode_chk CHECK (cta_mode IN (
      'self_serve', 'upload_ready', 'request_quote', 'contact_us', 'catalog_only', 'representative_assisted'
    )),
  is_featured boolean NOT NULL DEFAULT false,
  is_live boolean NOT NULL DEFAULT true,
  is_hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  badge_label text,
  specialty_flag boolean NOT NULL DEFAULT false,
  storefront_visible boolean NOT NULL DEFAULT true,
  category_visible boolean NOT NULL DEFAULT true,
  office_preferred boolean NOT NULL DEFAULT true,
  phone_preferred boolean NOT NULL DEFAULT true,
  email_allowed boolean NOT NULL DEFAULT true,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  linked_product_slug text,
  CONSTRAINT tienda_catalog_items_slug_format_chk CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS tienda_catalog_items_category_idx ON public.tienda_catalog_items (category_slug);
CREATE INDEX IF NOT EXISTS tienda_catalog_items_live_sort_idx ON public.tienda_catalog_items (is_live, sort_order DESC);
CREATE INDEX IF NOT EXISTS tienda_catalog_items_featured_idx ON public.tienda_catalog_items (is_featured) WHERE is_featured = true;

CREATE TABLE IF NOT EXISTS public.tienda_catalog_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.tienda_catalog_items (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  image_url text NOT NULL,
  alt_es text NOT NULL DEFAULT '',
  alt_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS tienda_catalog_images_item_idx ON public.tienda_catalog_images (item_id, sort_order);

CREATE TABLE IF NOT EXISTS public.tienda_catalog_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.tienda_catalog_items (id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'quantity_tier',
  quantity_min integer,
  quantity_max integer,
  size_key text,
  stock_key text,
  finish_key text,
  sides_key text,
  price numeric(12, 2) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tienda_catalog_pricing_rules_item_idx ON public.tienda_catalog_pricing_rules (item_id, active, sort_order);

ALTER TABLE public.tienda_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tienda_catalog_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tienda_catalog_pricing_rules ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.tienda_catalog_items IS 'Leonix admin Tienda catalog entries; public read via API/service role.';
COMMENT ON COLUMN public.tienda_catalog_items.linked_product_slug IS 'Optional link to static tienda product slug for self_serve/upload_ready CTAs.';
COMMENT ON COLUMN public.tienda_catalog_items.meta IS 'Extensible JSON: future pricing config, SKU hints, checkout hooks (v1).';

-- ---- Starter seed (idempotent-ish: skip if slug exists)
INSERT INTO public.tienda_catalog_items (
  title_es, title_en, slug, category_slug, short_description_es, short_description_en,
  description_es, description_en, pricing_mode, price_label, price_note, base_price, cta_mode,
  is_featured, is_live, sort_order, badge_label, storefront_visible, category_visible,
  office_preferred, phone_preferred, email_allowed, linked_product_slug, meta
)
SELECT * FROM (VALUES
  ('Bolígrafos promocionales', 'Promotional pens', 'cms-promo-pens', 'promo-products',
    'Bolígrafos con marca para ferias y equipos.', 'Branded pens for events and teams.',
    'Selección de estilos económicos a metal. Cotización con opciones de tinta y grabado.',
    'Budget to metal styles. Quote covers imprint methods and ink colors.',
    'display_only', 'Desde $125 pedido típico', 'MOQ y tiempo según proveedor', 125,
    'representative_assisted', true, true, 10, 'Catálogo', true, true, true, true, true, NULL,
    '{"pricingContractVersion":1}'::jsonb),
  ('Tazas y drinkware', 'Mugs & drinkware', 'cms-promo-mugs', 'promo-products',
    'Cerámica y acero con tu logo.', 'Ceramic and stainless pieces with your logo.',
    'Termos, tazas y botellas. Ideal para kits de bienvenida.', 'Travel mugs, cups, bottles—great for welcome kits.',
    'quote_only', 'Cotización', 'Precio según cantidad y técnica', NULL,
    'request_quote', true, true, 20, NULL, true, true, true, true, true, NULL, '{}'::jsonb),
  ('Vasos y tumblers', 'Tumblers', 'cms-promo-tumblers', 'promo-products',
    'Aislamiento y marca duradera.', 'Insulated drinkware with durable branding.',
    'Opciones de capacidad y recubrimiento. Leonix propone mockup antes de producir.',
    'Capacity and coating options. Leonix provides mockup before production.',
    'quote_only', 'Solicitar cotización', NULL, NULL,
    'representative_assisted', false, true, 30, NULL, true, true, true, true, true, NULL, '{}'::jsonb),
  ('Bolsas tote', 'Tote bags', 'cms-promo-totes', 'promo-products',
    'Lonas y no tejido para eventos.', 'Canvas and non-woven totes for events.',
    'Serigrafía o transfer según arte y tiraje.', 'Screen or transfer by art and run size.',
    'display_only', 'Desde $200', 'Mínimos por estilo', 200,
    'contact_us', true, true, 40, 'Eventos', true, true, true, true, true, NULL, '{}'::jsonb),
  ('Libretas corporativas', 'Corporate notebooks', 'cms-promo-notebooks', 'promo-products',
    'Cuadernos y agendas con marca.', 'Notebooks and journals with branding.',
    'Tapas flexibles o rígidas, hojas rayadas o punteadas.', 'Soft or hard covers; ruled or dotted interiors.',
    'quote_only', 'Cotización', NULL, NULL,
    'request_quote', false, true, 50, NULL, true, true, true, true, true, NULL, '{}'::jsonb),
  ('Stickers promocionales', 'Promo stickers', 'cms-promo-stickers', 'promo-products',
    'Etiquetas y stickers para marca.', 'Labels and stickers for brand campaigns.',
    'Vinilos y acabados según uso interior/exterior.', 'Vinyl and finishes for indoor/outdoor use.',
    'display_only', 'Desde $180', 'Según tamaño y corte', 180,
    'representative_assisted', false, true, 60, NULL, true, true, true, true, true, NULL, '{}'::jsonb),
  ('Kits de regalo', 'Giveaway kits', 'cms-promo-giveaway-kits', 'promo-products',
    'Combinaciones listas para ferias.', 'Bundled kits ready for tradeshows.',
    'Leonix arma propuestas con bolígrafos, tote y papelería coordinada.',
    'Leonix bundles pens, totes, and matching desk items.',
    'quote_only', 'Paquete a medida', NULL, NULL,
    'representative_assisted', true, true, 5, 'Kit', true, true, true, true, true, NULL, '{}'::jsonb),
  ('Textiles básicos', 'Basic apparel program', 'cms-promo-apparel', 'promo-products',
    'Playeras y polos con marca (programa básico).', 'Tees and polos with logo (basic program).',
    'Tallas estándar; serigrafía o bordado. Sin probador virtual.', 'Standard sizes; screen or embroidery. No virtual fitting.',
    'display_only', 'Desde $250', 'Mínimos por color', 250,
    'representative_assisted', false, true, 70, NULL, true, true, true, true, true, NULL, '{}'::jsonb),
  ('Postcards — sube tu arte', 'Postcards — upload art', 'cms-upload-postcards', 'marketing-materials',
    'Mismo flujo self-serve cuando actives postcards.', 'Uses live upload flow when postcards are active.',
    'Vinculado al producto postcards estándar para configurador.', 'Linked to standard postcards configurator.',
    'calculated_ready', 'Ver configurador', NULL, NULL,
    'upload_ready', true, true, 100, 'Self-serve', true, true, true, true, true, 'postcards-standard',
    '{"pricingContractVersion":1,"source":"linked_product"}'::jsonb),
  ('Volantes estándar', 'Standard flyers', 'cms-flyers-linked', 'flyers',
    'Sube PDF o imagen con el configurador Leonix.', 'Upload PDF or image via Leonix configurator.',
    'Flujo de subida activo para flyers-standard.', 'Live print-upload path for flyers-standard.',
    'calculated_ready', 'Ver precios en configurador', 'Cantidad, tamaño y papel en línea', NULL,
    'upload_ready', true, true, 110, 'Upload', true, true, true, true, true, 'flyers-standard',
    '{}'::jsonb),
  ('Brochures estándar', 'Standard brochures', 'cms-brochures-linked', 'brochures',
    'Brochures plegados con un PDF maestro.', 'Fold brochures with a single print-ready PDF.',
    'Enlazado a brochures-standard.', 'Linked to brochures-standard.',
    'calculated_ready', 'Ver configurador', NULL, NULL,
    'upload_ready', true, true, 120, NULL, true, true, true, true, true, 'brochures-standard', '{}'::jsonb),
  ('Banners retráctiles', 'Retractable banners', 'cms-banners-linked', 'banners',
    'Banners con configurador de subida.', 'Banners with upload configurator.',
    'Enlazado a retractable-banners.', 'Linked to retractable-banners.',
    'calculated_ready', 'Ver configurador', NULL, NULL,
    'upload_ready', false, true, 130, NULL, true, true, true, true, true, 'retractable-banners', '{}'::jsonb)
) AS v(
  title_es, title_en, slug, category_slug, short_description_es, short_description_en,
  description_es, description_en, pricing_mode, price_label, price_note, base_price, cta_mode,
  is_featured, is_live, sort_order, badge_label, storefront_visible, category_visible,
  office_preferred, phone_preferred, email_allowed, linked_product_slug, meta
)
WHERE NOT EXISTS (SELECT 1 FROM public.tienda_catalog_items i WHERE i.slug = v.slug);

-- Images for seeded rows (insert only when item exists and has no images yet)
INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80',
  'Escritorio con bolígrafos', 'Desk with pens', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-promo-pens'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
  'Taza de cerámica', 'Ceramic mug', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-promo-mugs'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
  'Botella reutilizable', 'Reusable bottle', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-promo-tumblers'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1597484661647-d458611885df?w=800&q=80',
  'Bolsa tote', 'Tote bag', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-promo-totes'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1544816155-12df96455610?w=800&q=80',
  'Libreta abierta', 'Open notebook', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-promo-notebooks'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
  'Rollos de stickers', 'Sticker rolls', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-promo-stickers'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1549465220-405a0711c7db?w=800&q=80',
  'Regalos promocionales', 'Promotional gifts', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-promo-giveaway-kits'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  'Playera básica', 'Basic tee', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-promo-apparel'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80',
  'Tarjetas postales', 'Postcards', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-upload-postcards'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800&q=80',
  'Volantes impresos', 'Printed flyers', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-flyers-linked'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
  'Brochure plegado', 'Folded brochure', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-brochures-linked'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

INSERT INTO public.tienda_catalog_images (item_id, image_url, alt_es, alt_en, sort_order, is_primary)
SELECT i.id,
  'https://images.unsplash.com/photo-1560066984-138dadb4c041?w=800&q=80',
  'Banner de exhibición', 'Display banner', 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-banners-linked'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_images x WHERE x.item_id = i.id);

-- Example pricing rule row for calculated_ready item (optional demo)
INSERT INTO public.tienda_catalog_pricing_rules (item_id, rule_type, quantity_min, quantity_max, price, sort_order, active)
SELECT i.id, 'quantity_tier', 100, 499, 89.00, 0, true
FROM public.tienda_catalog_items i
WHERE i.slug = 'cms-flyers-linked'
  AND NOT EXISTS (SELECT 1 FROM public.tienda_catalog_pricing_rules r WHERE r.item_id = i.id);
