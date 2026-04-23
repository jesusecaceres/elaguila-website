/**
 * Smoke-test Viajes browse URL round-trip + svcLang filter (no DB).
 * Run: npx tsx scripts/viajes-browse-filter-selftest.ts
 */

import { strict as assert } from "node:assert";

import type { ViajesBrowseState } from "../app/(site)/clasificados/viajes/lib/viajesBrowseContract";
import {
  defaultViajesBrowseState,
  parseViajesBrowseFromSearchParams,
  serializeViajesBrowseToSearchParams,
} from "../app/(site)/clasificados/viajes/lib/viajesBrowseContract";
import { viajesRowMatchesBrowse } from "../app/(site)/clasificados/viajes/lib/viajesResultsMatch";
import type { ViajesBusinessResult } from "../app/(site)/clasificados/viajes/data/viajesResultsSampleData";

const base = defaultViajesBrowseState("es");
const withSvc = { ...base, svcLang: "bilingual", dest: "mexico", from: "san-jose" };
const qs = serializeViajesBrowseToSearchParams(withSvc).toString();
const round = parseViajesBrowseFromSearchParams(new URLSearchParams(qs), "es");
assert.equal(round.svcLang, "bilingual");
assert.equal(round.dest, "mexico");

const row: ViajesBusinessResult = {
  kind: "business",
  id: "t1",
  imageSrc: "x",
  imageAlt: "x",
  businessName: "Agency",
  offerTitle: "Tour",
  destination: "Mexico",
  destSlugs: ["mexico"],
  departureCity: "San Jose",
  duration: "3 dias",
  price: "500 USD",
  includedSummary: "x",
  href: "/x",
  tripTypeKeys: ["tours"],
  publishedAt: "2025-01-01",
  audienceKeys: ["familias"],
  budgetBand: "economico",
  durationKey: "short",
  seasonKeys: ["winter"],
  serviceLanguageKeys: ["es", "en"],
};

assert.equal(viajesRowMatchesBrowse(row, { ...base, svcLang: "es" }), true);
assert.equal(viajesRowMatchesBrowse(row, { ...base, svcLang: "bilingual" }), true);
assert.equal(viajesRowMatchesBrowse(row, { ...base, svcLang: "other" }), false);

const rowExtras: ViajesBusinessResult = {
  ...row,
  listingSearchExtras: "Caribe Belice",
};
const qOnly = { ...base, q: "belice", dest: "", from: "", t: "", budget: "", audience: "", season: "", duration: "", svcLang: "" };
assert.equal(viajesRowMatchesBrowse(rowExtras, qOnly), true);

function assertBrowseStateEqual(a: ViajesBrowseState, b: ViajesBrowseState, label: string) {
  const keys: (keyof ViajesBrowseState)[] = [
    "lang",
    "dest",
    "q",
    "from",
    "t",
    "budget",
    "audience",
    "season",
    "duration",
    "svcLang",
    "sort",
    "page",
    "originByGeo",
    "zip",
    "radiusMiles",
    "nearMe",
  ];
  for (const k of keys) {
    assert.strictEqual(a[k], b[k], `${label}: ${String(k)}`);
  }
}

const fullBrowse: ViajesBrowseState = {
  ...defaultViajesBrowseState("en"),
  dest: "mexico",
  q: "playa",
  from: "san-jose",
  t: "tours",
  budget: "economico",
  audience: "familias",
  season: "winter",
  duration: "short",
  svcLang: "es",
  sort: "priceAsc",
  page: 3,
  originByGeo: "1",
  zip: "95110",
  radiusMiles: "25",
  nearMe: "1",
};
const fullQs = serializeViajesBrowseToSearchParams(fullBrowse).toString();
const fullRound = parseViajesBrowseFromSearchParams(new URLSearchParams(fullQs), "es");
assertBrowseStateEqual(fullRound, fullBrowse, "full URL round-trip");

/** `zip`, `radiusMiles`, `nearMe` are parsed/serialized but not used in `viajesRowMatchesBrowse` until geo exists — see `viajesResultsMatch.ts`. */
assert.equal(
  viajesRowMatchesBrowse(row, { ...base, zip: "99999", radiusMiles: "500", nearMe: "1" }),
  true,
  "reserved geo keys must not exclude rows",
);

const rowTours: ViajesBusinessResult = { ...row, tripTypeKeys: ["tours", "tour"] };
assert.equal(viajesRowMatchesBrowse(rowTours, { ...base, t: "tours" }), true);
assert.equal(viajesRowMatchesBrowse(rowTours, { ...base, t: "cruceros" }), false);

const rowBudget: ViajesBusinessResult = { ...row, budgetBand: "premium" };
assert.equal(viajesRowMatchesBrowse(rowBudget, { ...base, budget: "premium" }), true);
assert.equal(viajesRowMatchesBrowse(rowBudget, { ...base, budget: "economico" }), false);

const rowAudience: ViajesBusinessResult = { ...row, audienceKeys: ["parejas", "familias"] };
assert.equal(viajesRowMatchesBrowse(rowAudience, { ...base, audience: "parejas" }), true);
assert.equal(viajesRowMatchesBrowse(rowAudience, { ...base, audience: "grupos" }), false);

const rowSeason: ViajesBusinessResult = { ...row, seasonKeys: ["winter", "spring"] };
assert.equal(viajesRowMatchesBrowse(rowSeason, { ...base, season: "winter" }), true);
assert.equal(viajesRowMatchesBrowse(rowSeason, { ...base, season: "summer" }), false);

const rowDuration: ViajesBusinessResult = { ...row, durationKey: "week" };
assert.equal(viajesRowMatchesBrowse(rowDuration, { ...base, duration: "week" }), true);
assert.equal(viajesRowMatchesBrowse(rowDuration, { ...base, duration: "long" }), false);

console.log("[viajes-browse-filter-selftest] OK");
