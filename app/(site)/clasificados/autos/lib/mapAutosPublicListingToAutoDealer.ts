import type { AutosPublicListing } from "../data/autosPublicSampleTypes";
import type { AutoDealerListing, RelatedDealerListing, VehicleBadge } from "../negocios/types/autoDealerListing";
import { autosLiveVehiclePath } from "../filters/autosBrowseFilterContract";

const BADGE_SET = new Set<string>([
  "certified",
  "new",
  "used",
  "clean_title",
  "one_owner",
  "low_miles",
  "dealer_maintained",
]);

function pickBadges(raw: string[] | undefined): VehicleBadge[] {
  if (!raw?.length) return [];
  return raw.filter((b): b is VehicleBadge => BADGE_SET.has(b));
}

/** Optional related inventory for Negocios live — excludes current id, dealer lane only. */
export function buildRelatedPublicListings(
  current: AutosPublicListing,
  pool: AutosPublicListing[],
  lang: "es" | "en",
): RelatedDealerListing[] {
  const q = lang === "en" ? "lang=en" : "lang=es";
  return pool
    .filter((row) => row.id !== current.id && row.sellerType === "dealer")
    .slice(0, 3)
    .map((row) => ({
      id: row.id,
      imageUrl: row.primaryImageUrl,
      year: row.year,
      make: row.make,
      model: row.model,
      price: row.price,
      mileage: row.mileage,
      href: `${autosLiveVehiclePath(row.id)}?${q}`,
    }));
}

/**
 * Map public browse row → `AutoDealerListing` for Negocios/Privado preview shells.
 * Publish-ready path will swap the source row for API payload without changing this shape.
 */
export function mapAutosPublicListingToAutoDealer(
  row: AutosPublicListing,
  opts?: { relatedPool?: AutosPublicListing[]; lang?: "es" | "en" },
): AutoDealerListing {
  const lang = opts?.lang ?? "es";
  const lane = row.sellerType === "dealer" ? "negocios" : "privado";
  const trim = row.trim?.trim();
  const description =
    row.sellerType === "dealer"
      ? `${row.vehicleTitle} — disponible con ${row.dealerName ?? "el concesionario"}. Consulta disponibilidad, historial y opciones de financiamiento.`
      : `${row.vehicleTitle} — venta directa por particular. Coordina inspección y prueba de manejo con el vendedor.`;

  const base: AutoDealerListing = {
    autosLane: lane,
    vehicleTitle: row.vehicleTitle,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: trim || undefined,
    condition: row.condition,
    price: row.price,
    monthlyEstimate: row.monthlyEstimate ?? null,
    mileage: row.mileage,
    city: row.city,
    state: row.state,
    zip: row.zip,
    stockNumber: `LX-${row.id}`,
    bodyStyle: row.bodyStyle,
    drivetrain: row.drivetrain,
    transmission: row.transmission,
    fuelType: row.fuelType,
    titleStatus: row.titleStatus,
    badges: pickBadges(row.badges),
    description,
    features: [row.bodyStyle, row.transmission, row.drivetrain, row.fuelType].filter(Boolean),
    heroImages: [row.primaryImageUrl],
    dealerName: row.sellerType === "dealer" ? row.dealerName : row.privateSellerLabel,
    dealerLogo: row.sellerType === "dealer" ? row.dealerLogoUrl ?? null : null,
  };

  if (row.sellerType === "dealer" && opts?.relatedPool?.length) {
    base.relatedDealerListings = buildRelatedPublicListings(row, opts.relatedPool, lang);
  }

  return base;
}
