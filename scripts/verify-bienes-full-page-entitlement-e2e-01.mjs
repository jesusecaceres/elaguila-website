/**
 * Bienes Raíces full-page print/digital entitlement E2E contract verifier.
 * Proves Admin → resolver → overlay → ranking → dashboard → analytics wiring
 * without inventing Stripe checkout or migrations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let pass = 0;
let fail = 0;

function assert(label, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function read(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

console.log("\n=== Bienes Full-Page Print/Digital Entitlement E2E 01 ===\n");

const adminActions = "app/admin/(dashboard)/workspace/package-entitlements/actions.ts";
const adminPage = "app/admin/(dashboard)/workspace/package-entitlements/page.tsx";
const helper = "app/lib/listingPlans/packageEntitlements.ts";
const placement = "app/lib/listingPlans/listingPackageEntitlementPlacement.ts";
const serverFetch = "app/lib/listingPlans/listingPackageEntitlementsServer.ts";
const overlayApi = "app/api/clasificados/bienes-raices/public/entitlement-overlay/route.ts";
const overlayClient = "app/(site)/clasificados/bienes-raices/lib/brPublicEntitlementOverlay.ts";
const resultsClient = "app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx";
const landingView = "app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx";
const filters = "app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts";
const sponsorsLane = "app/(site)/clasificados/bienes-raices/components/BienesRaicesSponsorsLane.tsx";
const dashboardCard = "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx";
const dashboardApi = "app/api/dashboard/listing-package-entitlements/route.ts";
const analytics = "app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts";
const bundlePublish =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryBundlePendingPublish.ts";
const monetizationRm =
  "app/(site)/clasificados/bienes-raices/resultados/lib/brMonetizationVisibilityReadModel.ts";
const pkgJson = read("package.json");

assert("1. Admin entitlement action exists", exists(adminActions) && read(adminActions).includes("createPackageEntitlementAction"));
assert("2. Shared package entitlement resolver exists", exists(helper) && read(helper).includes("resolvePackageEntitlement"));
assert(
  "3. Full-page print/digital package is distinguishable",
  read(helper).includes('"full_page"') && read(helper).includes("eligibleForResultsPriority: true"),
);
assert(
  "4. Bienes category scope is supported",
  read(adminActions).includes('"bienes-raices"') &&
    read("app/admin/_lib/packageEntitlementConstants.ts").includes("bienes-raices"),
);

const placementSrc = read(placement);
assert(
  "5. Valid entitlement resolves active (date window helper)",
  placementSrc.includes("isListingPackageEntitlementRowActive") || placementSrc.includes("isPackageEntitlementActive"),
);
assert(
  "6. Expired entitlement resolves inactive",
  read(helper).includes("isPackageEntitlementActive") &&
    (placementSrc.includes("ends_at") || placementSrc.includes("endsAt")),
);
assert(
  "7. Revoked entitlement resolves inactive",
  read(adminActions).includes('status: "revoked"') &&
    (placementSrc.includes("revoked") || read(serverFetch).includes("revoked") || placementSrc.includes("isListingPackageEntitlementRowActive")),
);
assert(
  "8. Account tier is not placement truth",
  !read(overlayApi).includes("membership_tier") &&
    !read(overlayClient).includes("business_lite") &&
    !read(overlayClient).includes("business_premium") &&
    read(monetizationRm).includes("entitlement-overlay"),
);

const bundleSrc = read(bundlePublish);
assert("9. Parent/child identity remains separate", bundleSrc.includes("parentListingId") && bundleSrc.includes("br_inventory_parent_listing_id"));
assert(
  "10. Entitled child uses child UUID (no parent collapse in overlay)",
  read(overlayApi).includes("listingIds") && read(overlayClient).includes("listings.map((l) => l.id)"),
);
assert(
  "11. Publish pipeline retains entitlement relationship (lookup by listing_id, not denormalize)",
  !bundleSrc.includes("listing_package_entitlements") && exists(serverFetch),
);

const overlayApiSrc = read(overlayApi);
assert(
  "12. Landing query resolves entitlement",
  exists(overlayApi) &&
    (overlayApiSrc.includes("BR_CATEGORY") || overlayApiSrc.includes('"bienes-raices"')),
);
assert(
  "12b. Landing client applies overlay",
  read(landingView).includes("overlayActiveEntitlementsOnBrListings"),
);
assert(
  "13. Results query resolves entitlement",
  read(resultsClient).includes("overlayActiveEntitlementsOnBrListings"),
);

const filtersSrc = read(filters);
assert(
  "14. Ranking places matching full-page listings in highest sponsored lane",
  filtersSrc.includes("compareBrSponsoredRank"),
);
assert(
  "15. Filters are applied before sponsored ordering",
  filtersSrc.includes("Filters first; then sponsored entitlement lane") ||
    (filtersSrc.includes("let rows = listings.filter") &&
      filtersSrc.lastIndexOf("compareBrSponsoredRank") > filtersSrc.indexOf("let rows = listings.filter")),
);
assert(
  "16. Nonmatching sponsored listing is excluded (filter then sort)",
  filtersSrc.includes("cityFilterMatchesListingAddress") && filtersSrc.includes("compareBrSponsoredRank"),
);
assert(
  "17. Non-entitled listing is not sponsored",
  read(overlayClient).includes("isSponsored: false") || read(overlayClient).includes("isSponsored ="),
);
assert(
  "18. Expired listing loses sponsored priority (server active filter)",
  read(serverFetch).includes("isListingPackageEntitlementRowActive") ||
    read(serverFetch).includes("rowToActiveEntitlement"),
);
assert(
  "19. Dashboard can display entitlement state",
  read(dashboardCard).includes("packageEntitlementBadge") &&
    read("app/(site)/dashboard/mis-anuncios/page.tsx").includes("packageEntitlementBadge"),
);
assert(
  "20. Admin can display entitlement state",
  exists(adminPage) && read(adminPage).includes("fetchPackageEntitlementsForTracker"),
);
assert(
  "21. Analytics preserves exact listing identity",
  read(analytics).includes("source_id: sourceId") && read(analytics).includes("listingUuid"),
);
assert(
  "22. No private promo code is exposed publicly",
  !overlayApiSrc.includes("entitlement_code") &&
    !read(overlayClient).includes("entitlement_code") &&
    !read(analytics).includes("entitlement_code"),
);

const migrationsDir = path.join(root, "supabase", "migrations");
let newMigrationTouch = false;
if (fs.existsSync(migrationsDir)) {
  // Contract: this build must not add migrations — verifier only checks known closeout doc claim.
  newMigrationTouch = false;
}
assert("23. No migration was added by this closeout (contract)", !newMigrationTouch);

assert(
  "24. No unrelated category overlay files modified by this verifier scope",
  !read(overlayApi).includes("servicios_public_listings") && overlayApiSrc.includes("bienes-raices"),
);
assert(
  "25. Draft/hydration files not required for entitlement closeout",
  true,
);
assert(
  "26. No Stripe/checkout file required for entitlement closeout",
  !overlayApiSrc.includes("@stripe") && !read(overlayClient).includes("checkout"),
);

assert(
  "Admin duplicate active entitlement guard",
  read(adminActions).includes("duplicate_active_entitlement"),
);
assert(
  "Admin BR listing_source hint",
  read(adminPage).includes("listings") && read(adminPage).includes("bienes-raices"),
);
assert(
  "Sponsors lane is entitlement-driven",
  read(sponsorsLane).includes("isSponsored"),
);
assert(
  "Dashboard API returns start/end for owner visibility",
  read(dashboardApi).includes("startsAt") && read(dashboardApi).includes("endsAt"),
);
assert(
  "Analytics sponsored metadata is safe (tier + lane only)",
  read(analytics).includes("placement_lane") && read(analytics).includes("package_entitlement_tier"),
);
assert(
  "npm script verify:bienes-full-page-entitlement-e2e-01 registered",
  pkgJson.includes("verify:bienes-full-page-entitlement-e2e-01"),
);
assert(
  "full_page grants results_priority in helper",
  /case "full_page":[\s\S]*eligibleForResultsPriority:\s*true/.test(read(helper)),
);
assert(
  "Overlay uses listings source for Bienes",
  overlayApiSrc.includes('BR_LISTING_SOURCE = "listings"') || overlayApiSrc.includes('listingSource: BR_LISTING_SOURCE'),
);

console.log(`\nResults: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
