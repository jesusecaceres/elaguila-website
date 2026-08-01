/**
 * Focused tests for the Gate BCO-3R-B.3 service-coverage UX (region/state data integrity,
 * validateServiceCoverage rules, summarizeServiceCoverage output, ES/EN copy completeness). Same
 * repo convention as the other verify-business-*.ts scripts — no jest/vitest in this repo,
 * hand-rolled node:assert + check(). Run from repo root:
 * npx tsx scripts/verify-business-identity-service-coverage-01.ts
 */
import { strict as assert } from "node:assert";

import { COUNTRY_CODES } from "../app/lib/business/countries";
import { REGIONS, countryCodesForRegion, regionLabel } from "../app/lib/business/regions";
import { STATE_PROVINCE_DATA, hasStateProvinceData, stateProvinceOptions, allStateProvinceLabels } from "../app/lib/business/statesProvinces";
import { COVERAGE_LEVELS, DELIVERY_MODELS } from "../app/lib/business/constants";
import { validateServiceCoverage } from "../app/lib/business/validation";
import { businessIdentityCopy } from "../app/(site)/dashboard/business-tools/_components/businessIdentityCopy";
import { summarizeServiceCoverage } from "../app/(site)/dashboard/business-tools/onboarding/wizardTypes";
import type { StructuredLocationDetailsV1 } from "../app/lib/business/types";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Business Identity service coverage (Gate BCO-3R-B.3) — focused tests\n");

// --- region data integrity ------------------------------------------------------------------
check("REGIONS: exactly 9 shortcuts, matching the gate's spec", () => {
  assert.equal(REGIONS.length, 9);
  const expected = ["north_america", "central_america", "caribbean", "south_america", "europe", "africa", "middle_east", "asia", "oceania"];
  assert.deepEqual(REGIONS.map((r) => r.code).sort(), expected.sort());
});
check("REGIONS: every real ISO country code is assigned to exactly one region, no duplicates", () => {
  const all = COUNTRY_CODES.filter((c) => c !== "OTHER");
  const seen = new Map<string, string>();
  for (const r of REGIONS) {
    for (const code of r.countryCodes) {
      assert.ok(all.includes(code), `region ${r.code} references unknown code ${code}`);
      assert.ok(!seen.has(code), `${code} duplicated in ${seen.get(code)} and ${r.code}`);
      seen.set(code, r.code);
    }
  }
  const missing = all.filter((c) => !seen.has(c));
  assert.deepEqual(missing, [], `countries missing from every region: ${missing.join(", ")}`);
});
check("REGIONS: every region has a non-empty ES and EN label", () => {
  for (const r of REGIONS) {
    assert.ok(r.es.trim().length > 0);
    assert.ok(r.en.trim().length > 0);
  }
});
check("countryCodesForRegion / regionLabel: resolve known regions, fall back safely for unknown", () => {
  assert.ok(countryCodesForRegion("caribbean").includes("DO"));
  assert.equal(regionLabel("not_a_region", "en"), "not_a_region");
});

// --- state/province datasets --------------------------------------------------------------------
check("STATE_PROVINCE_DATA: US/MX/CA datasets have unique codes and non-empty ES/EN labels", () => {
  for (const country of Object.keys(STATE_PROVINCE_DATA)) {
    const list = STATE_PROVINCE_DATA[country];
    const codes = new Set(list.map((s) => s.code));
    assert.equal(codes.size, list.length, `${country} has duplicate subdivision codes`);
    for (const s of list) {
      assert.ok(s.es.trim().length > 0);
      assert.ok(s.en.trim().length > 0);
    }
  }
});
check("hasStateProvinceData: true only for countries with a real dataset — manual fallback everywhere else", () => {
  assert.equal(hasStateProvinceData("US"), true);
  assert.equal(hasStateProvinceData("MX"), true);
  assert.equal(hasStateProvinceData("CA"), true);
  assert.equal(hasStateProvinceData("FR"), false);
  assert.equal(hasStateProvinceData(null), false);
});
check("stateProvinceOptions / allStateProvinceLabels: sorted, same length as the source dataset", () => {
  const opts = stateProvinceOptions("US", "en");
  assert.equal(opts.length, STATE_PROVINCE_DATA.US.length);
  assert.equal(allStateProvinceLabels("US", "es").length, STATE_PROVINCE_DATA.US.length);
});

// --- controlled lists ------------------------------------------------------------------------
check("COVERAGE_LEVELS: exactly the 7 levels from the spec, in both languages", () => {
  assert.equal(COVERAGE_LEVELS.length, 7);
  for (const o of COVERAGE_LEVELS) {
    assert.ok(o.es.trim().length > 0);
    assert.ok(o.en.trim().length > 0);
  }
});
check("DELIVERY_MODELS: covers fully_remote/digital_delivery/shipping/consultation/other", () => {
  const values = DELIVERY_MODELS.map((o) => o.value).sort();
  assert.deepEqual(values, ["consultation", "digital_delivery", "fully_remote", "other", "shipping"].sort());
});

// --- validateServiceCoverage -------------------------------------------------------------------
check("validateServiceCoverage: local requires a base city", () => {
  const result = validateServiceCoverage({ country: "US", coverage: { level: "local" } });
  assert.equal(result.ok, false);
});
check("validateServiceCoverage: local with base city and no radius is valid", () => {
  const result = validateServiceCoverage({ country: "US", coverage: { level: "local" }, baseCity: "San Jose" });
  assert.equal(result.ok, true);
});
check("validateServiceCoverage: local radius must be positive and have a unit", () => {
  const result = validateServiceCoverage({ country: "US", coverage: { level: "local", radiusValue: -5 }, baseCity: "San Jose" });
  assert.equal(result.ok, false);
});
check("validateServiceCoverage: multi_city requires at least 2 cities, rejects duplicates", () => {
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "multi_city", citiesServed: ["San Jose"] } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "multi_city", citiesServed: ["San Jose", "San Jose"] } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "multi_city", citiesServed: ["San Jose", "Santa Clara"] } }).ok, true);
});
check("validateServiceCoverage: one_state requires a state/province value", () => {
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "one_state" } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "one_state", stateProvince: "California" } }).ok, true);
});
check("validateServiceCoverage: multi_state requires >=2 regions and rejects included/excluded overlap", () => {
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "multi_state", statesProvincesServed: ["California"] } }).ok, false);
  const overlap = validateServiceCoverage({
    country: "US",
    coverage: { level: "multi_state", statesProvincesServed: ["California", "Nevada"], excludedStatesProvinces: ["Nevada"] },
  });
  assert.equal(overlap.ok, false);
});
check("validateServiceCoverage: nationwide requires a valid country and explicit confirmation", () => {
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "nationwide" } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "", coverage: { level: "nationwide", nationwideConfirmed: true } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "nationwide", nationwideConfirmed: true } }).ok, true);
});
check("validateServiceCoverage: multi_country requires >=2 valid ISO countries, rejects duplicates/invalid codes", () => {
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "multi_country", countriesServedCodes: ["MX"] } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "multi_country", countriesServedCodes: ["MX", "MX"] } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "multi_country", countriesServedCodes: ["MX", "ZZ"] } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "multi_country", countriesServedCodes: ["MX", "CA"] } }).ok, true);
});
check("validateServiceCoverage: region select-all requires a resolved, non-empty country list", () => {
  const result = validateServiceCoverage({
    country: "US",
    coverage: {
      level: "multi_country",
      countriesServedCodes: ["MX", "CA"],
      regionSelections: [{ regionCode: "north_america", wholeRegion: true, countryCodes: [] }],
    },
  });
  assert.equal(result.ok, false);
});
check("validateServiceCoverage: worldwide requires explicit confirmation", () => {
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "worldwide" } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "worldwide", worldwideConfirmed: true } }).ok, true);
});
check("validateServiceCoverage: no level selected fails", () => {
  assert.equal(validateServiceCoverage({ country: "US", coverage: { level: "" } }).ok, false);
});

// --- summarizeServiceCoverage --------------------------------------------------------------------
const es = businessIdentityCopy("es").wizard.step5.coverage.summary;
const en = businessIdentityCopy("en").wizard.step5.coverage.summary;

function detailsFor(coverage: NonNullable<StructuredLocationDetailsV1["coverage"]>, extra: Partial<StructuredLocationDetailsV1> = {}): StructuredLocationDetailsV1 {
  return { schemaVersion: 1, coverage, ...extra };
}

check("summarizeServiceCoverage: renders a local summary with radius, never raw JSON", () => {
  const details = detailsFor({ schemaVersion: 1, level: "local", radiusValue: 25, radiusUnit: "miles" }, { baseCity: "San Jose", baseStateProvince: "California" });
  const text = summarizeServiceCoverage("US", details, "en", en);
  assert.ok(text.includes("25"));
  assert.ok(text.includes("San Jose"));
  assert.ok(!text.includes("{"));
});
check("summarizeServiceCoverage: multi_city mentions the city count", () => {
  const details = detailsFor({ schemaVersion: 1, level: "multi_city", citiesServed: ["San Jose", "Santa Clara", "Morgan Hill", "Mexico City"], citiesStateProvince: "California" });
  const text = summarizeServiceCoverage("US", details, "es", es);
  assert.ok(text.includes("4"));
  assert.ok(text.includes("California"));
});
check("summarizeServiceCoverage: nationwide with exclusions lists the excluded regions", () => {
  const details = detailsFor({ schemaVersion: 1, level: "nationwide", nationwideConfirmed: true, excludedStatesProvinces: ["Alaska", "Hawaii"] });
  const text = summarizeServiceCoverage("US", details, "en", en);
  assert.ok(text.includes("Alaska"));
  assert.ok(text.includes("Hawaii"));
  assert.ok(text.includes("and"));
});
check("summarizeServiceCoverage: multi_country recognizes a confirmed whole-region selection", () => {
  const caribbean = countryCodesForRegion("caribbean");
  const details = detailsFor({
    schemaVersion: 1,
    level: "multi_country",
    countriesServedCodes: [...caribbean],
    regionSelections: [{ regionCode: "caribbean", wholeRegion: true, countryCodes: [...caribbean] }],
  });
  const text = summarizeServiceCoverage("US", details, "es", es);
  assert.ok(text.includes(String(caribbean.length)));
  assert.ok(text.includes("Caribe"));
});
check("summarizeServiceCoverage: multi_country falls back to a bare count when selection isn't a full region", () => {
  const details = detailsFor({ schemaVersion: 1, level: "multi_country", countriesServedCodes: ["MX", "CA", "US"] });
  const text = summarizeServiceCoverage("US", details, "en", en);
  assert.ok(text.includes("3"));
});
check("summarizeServiceCoverage: worldwide with languages, matches the spec's example shape", () => {
  const details = detailsFor({ schemaVersion: 1, level: "worldwide", worldwideConfirmed: true }, { languagesServed: ["English", "Spanish"] });
  const text = summarizeServiceCoverage("US", details, "en", en);
  assert.ok(text.toLowerCase().includes("worldwide"));
  assert.ok(text.includes("English"));
  assert.ok(text.includes("Spanish"));
});
check("summarizeServiceCoverage: no coverage recorded yet renders the neutral placeholder, not a crash", () => {
  const text = summarizeServiceCoverage("US", { schemaVersion: 1 }, "en", en);
  assert.equal(text, en.none);
});

// --- ES/EN copy completeness for the new coverage block -----------------------------------------
check("businessIdentityCopy: step5.coverage has matching non-empty keys in both languages", () => {
  const esKeys = Object.keys(businessIdentityCopy("es").wizard.step5.coverage).sort();
  const enKeys = Object.keys(businessIdentityCopy("en").wizard.step5.coverage).sort();
  assert.deepEqual(esKeys, enKeys);
  assert.ok(esKeys.length > 20, "expected a substantial coverage copy block");
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
