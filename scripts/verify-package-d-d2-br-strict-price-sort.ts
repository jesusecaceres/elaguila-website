/**
 * Package D Build D2, Gate 3 — focused regression proof for the Bienes Raíces strict-price-sort
 * fix. Imports the REAL `filterBrListings` from `brResultsFilters.ts` (not a reimplementation) with
 * minimal fixture rows, and proves the exact scenario the product rule requires:
 *   - precio_asc: a cheaper UNSPONSORED listing must rank before a more expensive SPONSORED one.
 *   - precio_desc: a more expensive UNSPONSORED listing must rank before a cheaper SPONSORED one.
 * Run: npx tsx scripts/verify-package-d-d2-br-strict-price-sort.mts
 */
import { filterBrListings } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters";

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

function baseListing(overrides: Record<string, unknown>): any {
  return {
    id: "id",
    title: "Listing",
    addressLine: "123 Main St",
    beds: "3",
    baths: "2",
    sqft: "1500",
    price: "$0",
    operationLabel: "Venta",
    badges: [],
    advertiser: { name: "Advertiser" },
    sellerKind: "negocio",
    categoriaPropiedad: "residencial",
    resultsPropertyKind: "casa",
    demoPublishedAtMs: 1000,
    facetPool: false,
    facetPets: false,
    facetFurnished: false,
    isSponsored: false,
    packageEntitlementTier: undefined,
    digitalPlacementPriority: undefined,
    ...overrides,
  };
}

function emptyState(sort: string): any {
  return {
    primary: "",
    secondary: "",
    operationType: "",
    propertyType: "",
    sellerType: "",
    pool: "",
    pets: "",
    furnished: "",
    q: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    priceMin: "",
    priceMax: "",
    beds: "",
    baths: "",
    precio: "",
    sort,
  };
}

// precio_asc: cheaper unsponsored must beat pricier sponsored.
{
  const cheaperUnsponsored = baseListing({ id: "cheap-unsponsored", price: "$100,000", isSponsored: false });
  const pricierSponsored = baseListing({
    id: "pricier-sponsored",
    price: "$500,000",
    isSponsored: true,
    badges: ["destacada"],
    packageEntitlementTier: "premium",
  });
  const result = filterBrListings([pricierSponsored, cheaperUnsponsored], emptyState("precio_asc"), null);
  check(result[0]?.id === "cheap-unsponsored", "precio_asc: cheaper unsponsored ranks first despite pricier sponsored competitor");
}

// precio_desc: pricier unsponsored must beat cheaper sponsored.
{
  const pricierUnsponsored = baseListing({ id: "pricier-unsponsored", price: "$500,000", isSponsored: false });
  const cheaperSponsored = baseListing({
    id: "cheaper-sponsored",
    price: "$100,000",
    isSponsored: true,
    badges: ["destacada"],
    packageEntitlementTier: "premium",
  });
  const result = filterBrListings([cheaperSponsored, pricierUnsponsored], emptyState("precio_desc"), null);
  check(result[0]?.id === "pricier-unsponsored", "precio_desc: pricier unsponsored ranks first despite cheaper sponsored competitor");
}

// Equal price: sponsored may still win as a tie-breaker (never removed, only demoted to secondary key).
{
  const unsponsored = baseListing({ id: "tie-unsponsored", price: "$250,000", isSponsored: false });
  const sponsored = baseListing({
    id: "tie-sponsored",
    price: "$250,000",
    isSponsored: true,
    badges: ["destacada"],
    packageEntitlementTier: "premium",
  });
  const result = filterBrListings([unsponsored, sponsored], emptyState("precio_asc"), null);
  check(result[0]?.id === "tie-sponsored", "precio_asc: sponsorship still breaks a genuine price tie");
}

// Default/"reciente" discovery is unaffected — sponsored-first remains the primary key there.
{
  const older = baseListing({ id: "older-sponsored", demoPublishedAtMs: 1, isSponsored: true, badges: ["destacada"], packageEntitlementTier: "premium" });
  const newer = baseListing({ id: "newer-unsponsored", demoPublishedAtMs: 999, isSponsored: false });
  const result = filterBrListings([newer, older], emptyState("reciente"), null);
  check(result[0]?.id === "older-sponsored", "default/reciente discovery still lets sponsored placement outrank recency (unchanged, intentional)");
}

console.log(
  failures === 0
    ? "verify-package-d-d2-br-strict-price-sort: all checks passed."
    : `verify-package-d-d2-br-strict-price-sort: ${failures} FAILURE(S).`,
);
process.exit(failures === 0 ? 0 : 1);
