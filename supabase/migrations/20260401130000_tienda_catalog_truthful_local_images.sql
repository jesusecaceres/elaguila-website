-- Replace seeded Unsplash catalog URLs with Leonix-hosted SVGs under /public/tienda/visuals/
-- so storefront + catalog pages stay product-literal without depending on external stock IDs.

UPDATE public.tienda_catalog_images AS img
SET
  image_url = d.url,
  alt_es = d.alt_es,
  alt_en = d.alt_en
FROM public.tienda_catalog_items AS i
INNER JOIN (
  VALUES
    ('cms-promo-pens', '/tienda/visuals/category-promo-products.svg', 'Bolígrafos promocionales', 'Promotional pens'),
    ('cms-promo-mugs', '/tienda/visuals/category-promo-products.svg', 'Drinkware promocional', 'Promotional drinkware'),
    ('cms-promo-tumblers', '/tienda/visuals/category-promo-products.svg', 'Termos y vasos promocionales', 'Promotional tumblers'),
    ('cms-promo-totes', '/tienda/visuals/category-promo-products.svg', 'Bolsas promocionales', 'Promotional tote bags'),
    ('cms-promo-notebooks', '/tienda/visuals/category-promo-products.svg', 'Libretas y escritorio promocional', 'Promotional notebooks'),
    ('cms-promo-stickers', '/tienda/visuals/category-stickers-labels.svg', 'Hoja de stickers y etiquetas', 'Sticker and label sheet'),
    ('cms-promo-giveaway-kits', '/tienda/visuals/category-promo-products.svg', 'Kits de regalos promocionales', 'Promotional giveaway kits'),
    ('cms-promo-apparel', '/tienda/visuals/category-promo-products.svg', 'Textiles promocionales', 'Promotional apparel'),
    ('cms-upload-postcards', '/tienda/visuals/category-marketing-materials.svg', 'Postales y piezas de correo', 'Postcards and mail pieces'),
    ('cms-flyers-linked', '/tienda/visuals/category-flyers.svg', 'Volantes impresos', 'Printed flyers'),
    ('cms-brochures-linked', '/tienda/visuals/category-brochures.svg', 'Brochure plegado', 'Folded brochure'),
    ('cms-banners-linked', '/tienda/visuals/hero-banners.svg', 'Banner retráctil / display', 'Retractable display banner')
) AS d(slug, url, alt_es, alt_en) ON i.slug = d.slug
WHERE img.item_id = i.id;
