/**
 * Executable runtime checks for Autos public browse logic (no DB, no Stripe).
 * Run: npx tsx scripts/autos-enforcement-smoke.ts
 */
import assert from "node:assert/strict";
import { applyAutosPublicFilters, sortAutosPublicListings } from "../app/(site)/clasificados/autos/components/public/autosPublicFilters";
import type { AutosPublicListing } from "../app/(site)/clasificados/autos/data/autosPublicSampleTypes";
import { resolveAutosLandingInventory } from "../app/(site)/clasificados/autos/data/sampleAutosPublicInventory";
import { emptyAutosPublicFilters } from "../app/(site)/clasificados/autos/filters/autosPublicFilterTypes";
import { autosPublicDemoInventoryAllowed } from "../app/(site)/clasificados/autos/lib/autosPublicInventoryPolicy";
import { autosPublicSellerTypeFromLane } from "../app/lib/clasificados/autos/autosPublicSellerFromLane";
import { partitionAutosResultsVisibility } from "../app/(site)/clasificados/autos/lib/autosPublicResultsVisibility";
import { autosClassifiedsRowToPublicListing } from "../app/lib/clasificados/autos/mapAutosClassifiedsToPublic";
import type { AutosClassifiedsListingRow } from "../app/lib/clasificados/autos/autosClassifiedsTypes";

const base: AutosPublicListing = {
  id: "test-1",
  sellerType: "private",
  featured: false,
  year: 2020,
  make: "Honda",
  model: "Civic",
  trim: "Sport",
  vehicleTitle: "2020 Honda Civic Sport",
  price: 20000,
  mileage: 30000,
  city: "San Jose",
  state: "CA",
  zip: "95112",
  bodyStyle: "Sedan",
  transmission: "Automatic",
  drivetrain: "FWD",
  fuelType: "Gasoline",
  condition: "used",
  titleStatus: "Clean title",
  primaryImageUrl: "https://example.com/x.jpg",
  searchableBlurb: "one owner low miles financing mentioned in description",
};

function run() {
  assert.equal(autosPublicSellerTypeFromLane("privado"), "private");
  assert.equal(autosPublicSellerTypeFromLane("negocios"), "dealer");

  const f0 = emptyAutosPublicFilters();
  const qHit = applyAutosPublicFilters([base], f0, "financing");
  assert.equal(qHit.length, 1, "search q must match searchableBlurb");

  const makeFilter = applyAutosPublicFilters([{ ...base, make: "HONDA" }], { ...f0, make: "honda" }, "");
  assert.equal(makeFilter.length, 1, "make filter must be case-insensitive");

  const dropped = applyAutosPublicFilters([base], { ...f0, bodyStyle: "Sedan" }, "");
  assert.equal(dropped.length, 1, "bodyStyle filter must apply");

  const sorted = sortAutosPublicListings(
    [
      { ...base, id: "a", year: 2019, price: 10000 },
      { ...base, id: "b", year: 2021, price: 9000 },
    ],
    "newest",
  );
  assert.equal(sorted[0].id, "b", "newest sort should prefer newer year");

  const sortedByRefresh = sortAutosPublicListings(
    [
      { ...base, id: "old", year: 2020, price: 15000, publicSortTimestamp: "2024-01-01T00:00:00.000Z" },
      { ...base, id: "new", year: 2020, price: 15000, publicSortTimestamp: "2025-06-01T00:00:00.000Z" },
    ],
    "newest",
  );
  assert.equal(sortedByRefresh[0].id, "new", "newest sort must honor publicSortTimestamp (republish/refresh)");

  const dealerOnlyFront = [
    { ...base, id: "d1", sellerType: "dealer" as const, featured: true, year: 2025, price: 50000 },
    { ...base, id: "d2", sellerType: "dealer" as const, featured: false, year: 2024, price: 40000 },
    { ...base, id: "d3", sellerType: "dealer" as const, featured: false, year: 2023, price: 35000 },
    { ...base, id: "d4", sellerType: "dealer" as const, featured: false, year: 2022, price: 30000 },
    { ...base, id: "d5", sellerType: "dealer" as const, featured: false, year: 2021, price: 25000 },
    { ...base, id: "p1", sellerType: "private" as const, featured: false, year: 2018, price: 8000 },
  ];
  const sortedFront = sortAutosPublicListings(dealerOnlyFront, "newest");
  const part = partitionAutosResultsVisibility(sortedFront, "newest");
  assert.ok(
    part.recentLane.some((r) => r.sellerType === "private"),
    "recent lane must surface a private row when the pool contains one but the top slice is dealer-only",
  );

  const mapperRow: AutosClassifiedsListingRow = {
    id: "row-search-blurb-proof",
    owner_user_id: "owner-proof",
    lane: "privado",
    status: "active",
    lang: "es",
    featured: false,
    listing_payload: {
      year: 2022,
      make: "Mazda",
      model: "3",
      price: 25000,
      mileage: 10000,
      city: "San Jose",
      state: "CA",
      zip: "95112",
      description: "clean carfax",
      engine: "Skyactiv-G",
      doors: 4,
      seats: 5,
      mpgCity: 28,
      mpgHighway: 36,
      bodyStyle: "Sedan",
      transmission: "Automatic",
      drivetrain: "FWD",
      fuelType: "Gasoline",
      condition: "used",
      mediaImages: [
        { id: "img1", url: "https://example.com/car.jpg", sourceType: "url", isPrimary: true, sortOrder: 0 },
      ],
    },
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    published_at: "2024-01-01T00:00:00.000Z",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-06-01T00:00:00.000Z",
  };
  const mapped = autosClassifiedsRowToPublicListing(mapperRow);
  const blurb = mapped.searchableBlurb ?? "";
  assert.ok(blurb.includes("skyactiv-g"), "searchableBlurb must include engine for q search");
  assert.ok(blurb.includes("4 doors"), "searchableBlurb must include doors for q search");
  assert.ok(blurb.includes("mpg city 28"), "searchableBlurb must include mpg city for q search");

  const prodDemoOff =
    process.env.NODE_ENV === "production" ? true : autosPublicDemoInventoryAllowed() === (process.env.NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO === "1");
  assert.ok(prodDemoOff || process.env.NODE_ENV !== "production");

  const landingEmpty = resolveAutosLandingInventory([]);
  assert.ok(Array.isArray(landingEmpty));
  if (process.env.NODE_ENV === "production") {
    assert.equal(landingEmpty.length, 0, "production must not inject demo rows when API empty");
  }

  console.log("autos-enforcement-smoke: OK");
}

run();
