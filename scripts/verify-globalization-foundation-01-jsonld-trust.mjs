#!/usr/bin/env node
/**
 * Leonix Globalization Closeout Foundation 01, Zone A — JSON-LD trust fix.
 *
 * Statically proves that Restaurantes and Servicios AggregateRating structured data can never be
 * fed by owner-entered/self-reported rating values (there is no provider-verified Google/Yelp
 * rating source in Leonix). The builder contracts have no rating/reviewCount input at all, so
 * AggregateRating is structurally impossible to emit — not just empty/zeroed.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const restauranteJsonLd = read("app/(site)/clasificados/restaurantes/seo/restauranteJsonLd.ts");
const serviciosJsonLd = read("app/(site)/servicios/seo/serviciosJsonLd.ts");
const restaurantePage = read("app/(site)/clasificados/restaurantes/[slug]/page.tsx");
const serviciosPage = read("app/(site)/clasificados/servicios/[slug]/page.tsx");

/** True only for actual code that would construct/assign AggregateRating — ignores prose in comments. */
function constructsAggregateRating(src) {
  return /json\s*\.\s*aggregateRating\s*=/.test(src) || /["']?aggregateRating["']?\s*:/.test(src);
}

// --- restauranteJsonLd.ts -----------------------------------------------------------------
assert(
  !constructsAggregateRating(restauranteJsonLd),
  "restauranteJsonLd.ts must not construct AggregateRating at all (no provider-verified source exists)",
);
assert(
  !restauranteJsonLd.includes("externalRatingValue") && !restauranteJsonLd.includes("externalReviewCount"),
  "restauranteJsonLd.ts must not reference externalRatingValue/externalReviewCount",
);
assert(
  !restauranteJsonLd.includes("ratingAverage") && !restauranteJsonLd.includes("ratingCount"),
  "restauranteJsonLd.ts builder contract must not accept a rating/reviewCount input",
);
assert(
  restauranteJsonLd.includes('"@type": "Restaurant"'),
  "restauranteJsonLd.ts must still emit @type: Restaurant",
);

// --- serviciosJsonLd.ts --------------------------------------------------------------------
assert(
  !constructsAggregateRating(serviciosJsonLd),
  "serviciosJsonLd.ts must not construct AggregateRating at all (no provider-verified source exists)",
);
assert(
  !serviciosJsonLd.includes("hero.rating") && !serviciosJsonLd.includes("hero.reviewCount"),
  "serviciosJsonLd.ts must not reference hero.rating/hero.reviewCount",
);
assert(
  !serviciosJsonLd.includes("ratingAverage") && !serviciosJsonLd.includes("ratingCount"),
  "serviciosJsonLd.ts builder contract must not accept a rating/reviewCount input",
);
assert(
  serviciosJsonLd.includes('"@type": "LocalBusiness"'),
  "serviciosJsonLd.ts must still emit @type: LocalBusiness",
);

// --- No fake/fallback/hardcoded/zero-valued rating in either builder -----------------------
for (const [name, src] of [
  ["restauranteJsonLd.ts", restauranteJsonLd],
  ["serviciosJsonLd.ts", serviciosJsonLd],
]) {
  assert(!/ratingValue:\s*[\d.]/.test(src), `${name} must not hardcode a ratingValue`);
  assert(!/reviewCount:\s*[\d.]/.test(src), `${name} must not hardcode a reviewCount`);
}

// --- Legitimate structured data untouched ---------------------------------------------------
for (const field of ["name", "description", "image", "telephone", "address", "sameAs", "url"]) {
  assert(restauranteJsonLd.includes(field), `restauranteJsonLd.ts must still populate ${field}`);
  assert(serviciosJsonLd.includes(field), `serviciosJsonLd.ts must still populate ${field}`);
}

// --- Direct callers no longer pass owner-entered rating into the JSON-LD builders ----------
assert(
  !restaurantePage.includes("ratingAverage:") && !restaurantePage.includes("ratingCount:"),
  "restaurantes [slug] page must not pass rating fields into restauranteJsonLd()",
);
assert(
  !serviciosPage.includes("ratingAverage:") && !serviciosPage.includes("ratingCount:"),
  "servicios [slug] page must not pass rating fields into serviciosJsonLd()",
);

console.log("OK: restauranteJsonLd.ts has no AggregateRating / owner-entered rating input");
console.log("OK: serviciosJsonLd.ts has no AggregateRating / owner-entered rating input");
console.log("OK: no fake/fallback/hardcoded/zero-valued rating introduced");
console.log("OK: Restaurant / LocalBusiness core schema type preserved");
console.log("OK: other legitimate structured data fields preserved");
console.log("OK: direct callers no longer feed rating input into either builder");
console.log("verify-globalization-foundation-01-jsonld-trust: PASS");
