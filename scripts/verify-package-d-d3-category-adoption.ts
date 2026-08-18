/**
 * Package D Build D3 — narrow verifier proving live category adoption of the D2 global core, not
 * just config/existence. Every check either imports and exercises a real exported function with
 * synthetic-but-realistic inputs, or greps the actual source for the real import/call site (never
 * a config string alone).
 *
 * Run: npx tsx scripts/verify-package-d-d3-category-adoption.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}
function importPath(rel: string): string {
  return pathToFileURL(path.join(ROOT, rel)).href;
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

async function main() {
  // ============================= REAL IMPORT/CALL PROOF (not config-only) =============================
  {
    const helper = src("app/lib/listingPlans/placementResultsOverlay.ts");
    check(helper.includes("resolveCanonicalPlacementSignalsForListings"), "shared overlay helper calls the canonical D2 reader");

    const servPage = src("app/(site)/clasificados/servicios/resultados/page.tsx");
    check(
      servPage.includes("resolveCanonicalVisibilityBucketWeights") && servPage.includes("sortServiciosResultsForDisplay(overlaid, lang, filterQuery.sort, canonicalRankWeightByListingId)"),
      "Servicios results page resolves canonical placement and threads it into the real sort call",
    );

    const restServer = src("app/(site)/clasificados/restaurantes/lib/restaurantesResultsInventoryServer.ts");
    check(
      restServer.includes("resolveCanonicalVisibilityBucketWeights") && restServer.includes("canonicalPlacementRankWeight: w"),
      "Restaurantes inventory loader resolves canonical placement and attaches it to real rows",
    );

    const autosRoute = src("app/api/clasificados/autos/public/listings/route.ts");
    check(
      autosRoute.includes("resolveCanonicalPlacementRankWeights") && autosRoute.includes('l.sellerType === "dealer"'),
      "Autos public listings route resolves canonical placement, scoped to dealer lane only",
    );
    const autosRank = src("app/lib/clasificados/autos/autosPublicRanking.ts");
    check(autosRank.includes("canonicalPlacementRankWeight"), "Autos default comparator reads the canonical weight");

    const brRoute = src("app/api/clasificados/bienes-raices/public/entitlement-overlay/route.ts");
    check(brRoute.includes("resolveCanonicalPlacementRankWeights"), "Bienes entitlement-overlay route resolves canonical placement");
    const brFilters = src("app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts");
    check(
      brFilters.includes('getSellerKind(a) === "negocio" ? (a.canonicalPlacementRankWeight ?? 0) : 0'),
      "Bienes default sort reads canonical weight, gated to negocio lane only",
    );

    const rentasFetch = src("app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse.ts");
    check(rentasFetch.includes("resolveCanonicalPlacementRankWeights"), "Rentas fetch loader resolves canonical placement");
    const rentasSort = src("app/(site)/clasificados/rentas/shared/rentasBrowseFilters.ts");
    check(rentasSort.includes("canonicalPlacementRankWeight"), "Rentas default sort reads canonical weight");

    const empleosRoute = src("app/api/clasificados/empleos/listings/route.ts");
    check(empleosRoute.includes("resolveCanonicalPlacementRankWeights"), "Empleos listings route resolves canonical placement");
    const empleosSort = src("app/(site)/clasificados/empleos/lib/empleosResultsQuery.ts");
    check(empleosSort.includes("canonicalPlacementRankWeight"), "Empleos relevance sort reads canonical weight");
  }

  // ============================= STRICT SORT PROTECTION (source-level proof) =============================
  {
    const autosFilters = src("app/(site)/clasificados/autos/components/public/autosPublicFilters.ts");
    check(
      !/priceAsc[\s\S]{0,200}canonicalPlacementRankWeight/.test(autosFilters) &&
        !/priceDesc[\s\S]{0,200}canonicalPlacementRankWeight/.test(autosFilters),
      "Autos priceAsc/priceDesc branches never reference canonicalPlacementRankWeight",
    );

    const empleosQuery = src("app/(site)/clasificados/empleos/lib/empleosResultsQuery.ts");
    const dateDescBlock = empleosQuery.slice(empleosQuery.indexOf('"date_desc"'), empleosQuery.indexOf('"salary_desc"'));
    const salaryDescBlock = empleosQuery.slice(empleosQuery.indexOf('"salary_desc"'), empleosQuery.indexOf("tierRank"));
    check(
      !dateDescBlock.includes("canonicalPlacementRankWeight") && !salaryDescBlock.includes("canonicalPlacementRankWeight"),
      "Empleos date_desc/salary_desc branches never reference canonicalPlacementRankWeight",
    );

    const rentasSort = src("app/(site)/clasificados/rentas/shared/rentasBrowseFilters.ts");
    const precioAscLine = rentasSort.split("\n").find((l) => l.includes("precio_asc"))!;
    const precioDescLine = rentasSort.split("\n").find((l) => l.includes("precio_desc"))!;
    check(
      !precioAscLine.includes("canonicalPlacementRankWeight") && !precioDescLine.includes("canonicalPlacementRankWeight"),
      "Rentas precio_asc/precio_desc lines never reference canonicalPlacementRankWeight",
    );
  }

  // ============================= RUNTIME COMPARATOR PROOF (pure functions, synthetic data) =============================
  {
    const { compareNewestAutosPublic } = await import(importPath("app/lib/clasificados/autos/autosPublicRanking.ts"));
    const base = {
      id: "x", featured: false, year: 2020, price: 10000, mileage: 1000, city: "", state: "",
      bodyStyle: "", transmission: "", drivetrain: "", vehicleTitle: "", make: "", model: "",
      sellerType: "dealer" as const, publicSortTimestamp: "2026-01-01T00:00:00.000Z",
    };
    const noPlacement = { ...base, id: "a" };
    const withPlacement = { ...base, id: "b", canonicalPlacementRankWeight: 800, publicSortTimestamp: "2020-01-01T00:00:00.000Z" };
    check(
      compareNewestAutosPublic(noPlacement, withPlacement) > 0,
      "Autos default comparator: canonical placement outranks a much-older listing with no placement",
    );
    const privado = { ...base, id: "c", sellerType: "private" as const, canonicalPlacementRankWeight: 800 };
    const dealerNoPlacement = { ...base, id: "d", sellerType: "dealer" as const };
    // Privado never has canonicalPlacementRankWeight attached by the route in real life (dealer-only
    // filter at fetch time); this proves the comparator itself doesn't special-case seller type — the
    // real isolation guarantee lives at the route's dealer-only resolution, verified above via source.
    check(typeof compareNewestAutosPublic(privado, dealerNoPlacement) === "number", "Autos comparator runs without throwing for a privado row carrying a stray weight");
  }

  {
    const { sortRentasPublicListings } = await import(importPath("app/(site)/clasificados/rentas/shared/rentasBrowseFilters.ts"));
    const cheap = { id: "a", rentMonthly: 1000, recencyRank: 1 } as any;
    const expensivePlaced = { id: "b", rentMonthly: 5000, recencyRank: 0, canonicalPlacementRankWeight: 300 } as any;
    const defaultSorted = sortRentasPublicListings([cheap, expensivePlaced], "reciente");
    check(defaultSorted[0].id === "b", "Rentas default sort: canonical placement wins over plain recency");
    const ascSorted = sortRentasPublicListings([expensivePlaced, cheap], "precio_asc");
    check(ascSorted[0].id === "a", "Rentas precio_asc stays strict: cheaper wins despite the pricier row's placement");
  }

  {
    const { sortEmpleosJobs } = await import(importPath("app/(site)/clasificados/empleos/lib/empleosResultsQuery.ts"));
    const standard = { id: "a", listingTier: "standard", publishedAt: "2026-01-01", salaryMax: 200000 } as any;
    const placedStandard = { id: "b", listingTier: "standard", publishedAt: "2020-01-01", salaryMax: 30000, canonicalPlacementRankWeight: 400 } as any;
    const relevance = sortEmpleosJobs([standard, placedStandard], "relevance");
    check(relevance[0].id === "b", "Empleos relevance sort: canonical placement outranks a newer, higher-salary row with no placement");
    const bySalary = sortEmpleosJobs([placedStandard, standard], "salary_desc");
    check(bySalary[0].id === "a", "Empleos salary_desc stays strict: higher salary wins despite the other row's placement");
    const byDate = sortEmpleosJobs([placedStandard, standard], "date_desc");
    check(byDate[0].id === "a", "Empleos date_desc stays strict: newer date wins despite the other row's placement");
  }

  {
    const { resolveServiciosListingRank } = await import(
      importPath("app/(site)/clasificados/servicios/lib/serviciosVisibilityRanking.ts")
    );
    const row = { id: "s1", slug: "s1" } as any;
    const map = new Map<string, number>([["s1", 600]]);
    const rank = resolveServiciosListingRank(row, map);
    check(rank.rankWeight === 600 && rank.source === "leonix_placement_entitlements", "Servicios: canonical weight wins and is attributed to the canonical source");
    const rankNoMap = resolveServiciosListingRank(row);
    check(rankNoMap.source !== "leonix_placement_entitlements", "Servicios: without a canonical map, falls back to legacy resolution (no fabricated canonical source)");
  }

  {
    const { resolveRestaurantesListingRank } = await import(
      importPath("app/(site)/clasificados/restaurantes/lib/restaurantesVisibilityRanking.ts")
    );
    const row = { id: "r1", slug: "r1", canonicalPlacementRankWeight: 500 } as any;
    const rank = resolveRestaurantesListingRank(row);
    check(rank.rankWeight === 500 && rank.source === "leonix_placement_entitlements", "Restaurantes: canonical weight wins when present on the row");
    const rowNoCanonical = { id: "r2", slug: "r2" } as any;
    const rankNoCanonical = resolveRestaurantesListingRank(rowNoCanonical);
    check(rankNoCanonical.source !== "leonix_placement_entitlements", "Restaurantes: without a canonical field, falls back to legacy resolution");
  }

  // ============================= BIENES PRIVADO ISOLATION (runtime proof via filterBrListings) =============================
  {
    const { filterBrListings } = await import(importPath("app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts"));
    const baseListing = {
      imageUrl: "", price: "$100,000", title: "", addressLine: "", beds: "3", baths: "2", sqft: "1000",
      categoriaPropiedad: "residencial", badges: [] as string[], advertiser: { kind: "agente", name: "" },
      demoPublishedAtMs: 1000,
    };
    const negocioPlaced = { ...baseListing, id: "n1", sellerKind: "negocio", canonicalPlacementRankWeight: 800, demoPublishedAtMs: 1 };
    const negocioNoPlacement = { ...baseListing, id: "n2", sellerKind: "negocio", demoPublishedAtMs: 5000 };
    const privadoWithStrayWeight = { ...baseListing, id: "p1", sellerKind: "privado", canonicalPlacementRankWeight: 800, demoPublishedAtMs: 1 };
    const state = {
      sort: "reciente", primary: "", secondary: "", operationType: "", propertyType: "", sellerType: "",
      pool: "", pets: "", furnished: "", q: "", city: "", state: "", country: "", zip: "", priceMin: "", priceMax: "", precio: "", beds: "", baths: "", page: "1",
    } as any;
    const resultNegocio = filterBrListings([negocioNoPlacement, negocioPlaced], state, null);
    check(resultNegocio[0].id === "n1", "Bienes default sort: negocio canonical placement outranks a much-newer negocio listing with none");
    const resultMixed = filterBrListings([privadoWithStrayWeight, negocioNoPlacement], state, null);
    check(
      resultMixed[0].id === "n2",
      "Bienes default sort: a privado row's canonical weight (even if stray data existed) is never applied — negocio recency wins",
    );

    const cheapUnsponsored = { ...baseListing, id: "c1", sellerKind: "negocio", price: "$100,000" };
    const pricierSponsored = { ...baseListing, id: "c2", sellerKind: "negocio", price: "$500,000", isSponsored: true };
    const ascState = { ...state, sort: "precio_asc" };
    const ascResult = filterBrListings([pricierSponsored, cheapUnsponsored], ascState, null);
    check(ascResult[0].id === "c1", "Bienes precio_asc remains strict: cheaper wins despite sponsorship (D2 fix preserved)");
  }

  console.log(
    failures === 0
      ? "verify-package-d-d3-category-adoption: all checks passed."
      : `verify-package-d-d3-category-adoption: ${failures} FAILURE(S).`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
