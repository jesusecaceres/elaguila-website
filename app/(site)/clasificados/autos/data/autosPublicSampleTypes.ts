/**
 * Blueprint sample inventory — aligned with future Autos listing + Negocios field vocabulary.
 * Not persisted; swap for API rows later without redesigning card shells.
 */

export type AutosPublicSellerType = "dealer" | "private";

export type AutosPublicCondition = "new" | "used" | "certified";

/**
 * Single public-facing inventory row (dealer lane + private lane).
 * Maps cleanly to structured publish fields (year/make/model/trim, specs, location contract).
 */
export type AutosPublicListing = {
  id: string;
  sellerType: AutosPublicSellerType;
  /** Promoted dealership placement (Tier 1 band). Private listings should remain false. */
  featured: boolean;
  year: number;
  make: string;
  model: string;
  trim?: string;
  /** Display line — mirrors `vehicleTitle` / buildVehicleTitle output. */
  vehicleTitle: string;
  price: number;
  monthlyEstimate?: string;
  mileage: number;
  city: string;
  state: string;
  zip?: string;
  bodyStyle: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  condition: AutosPublicCondition;
  titleStatus?: string;
  badges?: string[];
  primaryImageUrl: string;
  dealerName?: string;
  dealerLogoUrl?: string;
  dealerRating?: number;
  /** Private lane: short display name (e.g. first name + initial). */
  privateSellerLabel?: string;
};
