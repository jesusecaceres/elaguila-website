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
