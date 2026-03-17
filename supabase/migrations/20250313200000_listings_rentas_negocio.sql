-- Business listing contract: seller type, tier, business name, and business meta.
-- Used by: Rentas = business posting RENTALS only. En Venta = future business real-estate SALES (same columns).
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS seller_type text NULL,
  ADD COLUMN IF NOT EXISTS rentas_tier text NULL,
  ADD COLUMN IF NOT EXISTS business_name text NULL,
  ADD COLUMN IF NOT EXISTS business_meta text NULL;

COMMENT ON COLUMN listings.seller_type IS 'personal | business (Rentas = rentals by business; En Venta = future sales by business)';
COMMENT ON COLUMN listings.rentas_tier IS 'standard | plus (Rentas business rentals; same tier concept reusable for En Venta sales)';
COMMENT ON COLUMN listings.business_name IS 'Display name for business listings (rentas or en-venta)';
COMMENT ON COLUMN listings.business_meta IS 'JSON string: agent, role, office phone, website, socials, logo, etc. (see businessListingContract)';
