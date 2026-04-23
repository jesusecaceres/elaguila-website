/**
 * Smoke-test Viajes browse URL round-trip + svcLang filter (no DB).
 * Run: npx tsx scripts/viajes-browse-filter-selftest.ts
 */

import { strict as assert } from "node:assert";

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

console.log("[viajes-browse-filter-selftest] OK");
