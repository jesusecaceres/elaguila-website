-- Rentas negocio: seller type, tier, business name, and business meta for detail page
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS seller_type text NULL,
  ADD COLUMN IF NOT EXISTS rentas_tier text NULL,
  ADD COLUMN IF NOT EXISTS business_name text NULL,
  ADD COLUMN IF NOT EXISTS business_meta text NULL;

COMMENT ON COLUMN listings.seller_type IS 'personal | business (Rentas and other categories)';
COMMENT ON COLUMN listings.rentas_tier IS 'standard | plus (Rentas negocio only)';
COMMENT ON COLUMN listings.business_name IS 'Display name for business listings';
COMMENT ON COLUMN listings.business_meta IS 'JSON string of negocio identity (agent, role, website, socials, etc.)';
