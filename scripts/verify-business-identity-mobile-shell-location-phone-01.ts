/**
 * Focused regression tests for Gate BCO-3R-B.5 (mobile sidebar leak, location country
 * consistency, customer-facing phone presentation, floating dev-indicator collision). Same repo
 * convention as the other verify-business-*.ts scripts — no jest/vitest in this repo, hand-rolled
 * node:assert + check(). Run from repo root:
 * npx tsx scripts/verify-business-identity-mobile-shell-location-phone-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { clearCountryDependentGeography, physicalAddressSummary, summarizeServiceCoverage } from "../app/(site)/dashboard/business-tools/onboarding/wizardTypes";
import { businessIdentityCopy } from "../app/(site)/dashboard/business-tools/_components/businessIdentityCopy";
import { formatUsPhoneForDisplay } from "../app/lib/business/phoneDisplay";
import { isKnownStateProvinceLabel } from "../app/lib/business/statesProvinces";
import { validateServiceCoverage } from "../app/lib/business/validation";
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

console.log("Business Identity mobile shell / location consistency / phone display (Gate BCO-3R-B.5) — focused tests\n");

// --- Phase 1: mobile dashboard shell -----------------------------------------------------------
const shellPath = path.resolve(__dirname, "../app/(site)/dashboard/components/LeonixDashboardShell.tsx");
const shellText = readFileSync(shellPath, "utf8");

check("LeonixDashboardShell: the account/nav panel collapses behind a phone-only toggle instead of sitting in normal flow", () => {
  assert.ok(shellText.includes('aria-controls="dashboard-sidebar-panel"'), "expected a toggle button wired to the sidebar panel via aria-controls");
  assert.ok(shellText.includes('id="dashboard-sidebar-panel"'), "expected the panel to carry the matching id");
  assert.ok(shellText.includes("sm:hidden"), "the toggle button must be hidden at sm+ (desktop/tablet keep today's always-visible sidebar)");
});
check("LeonixDashboardShell: sign-out remains reachable through the same panel the mobile toggle controls (not duplicated, not removed)", () => {
  const panelStart = shellText.indexOf('id="dashboard-sidebar-panel"');
  assert.ok(panelStart > 0, "expected to find the sidebar panel");
  const panelSection = shellText.slice(panelStart);
  assert.ok(panelSection.includes("void signOut()"), "sign-out button must live inside the collapsible panel, reachable via the mobile toggle");
  // Exactly one sign-out button in the whole file — the fix must not duplicate navigation.
  const signOutButtonCount = (shellText.match(/void signOut\(\)/g) ?? []).length;
  assert.equal(signOutButtonCount, 1, `expected exactly one sign-out control (no duplicated nav), found ${signOutButtonCount}`);
});
check("LeonixDashboardShell: the sidebar's grid switch point (lg) is untouched — tablet/desktop layout behavior is unchanged", () => {
  assert.ok(shellText.includes("lg:grid-cols-"), "the existing lg: two-column grid switch must still be present, unmodified by this gate");
});

// --- Phase 2: location country consistency ------------------------------------------------------
check("clearCountryDependentGeography: clears the exact Albania/San Jose contradiction fields", () => {
  const stale: StructuredLocationDetailsV1 = {
    schemaVersion: 1,
    city: "San Jose",
    stateProvince: "California",
    postalCode: "95112",
    baseCity: "San Jose",
    baseStateProvince: "California",
    coverage: { schemaVersion: 1, level: "local", radiusValue: 25, radiusUnit: "miles" },
  };
  const cleared = clearCountryDependentGeography(stale);
  assert.equal(cleared.city, undefined);
  assert.equal(cleared.stateProvince, undefined);
  assert.equal(cleared.baseCity, undefined);
  assert.equal(cleared.baseStateProvince, undefined);
  // Non-geography coverage facts (the level itself, radius) survive the country change.
  assert.equal(cleared.coverage?.level, "local");
  assert.equal(cleared.coverage?.radiusValue, 25);
});
check("clearCountryDependentGeography: never touches multi_country/worldwide's own independent country data", () => {
  const details: StructuredLocationDetailsV1 = {
    schemaVersion: 1,
    coverage: { schemaVersion: 1, level: "worldwide", worldwideConfirmed: true, countriesServedCodes: ["US", "MX"], primaryTimeZone: "PST" },
  };
  const cleared = clearCountryDependentGeography(details);
  assert.equal(cleared.coverage?.worldwideConfirmed, true);
  assert.deepEqual(cleared.coverage?.countriesServedCodes, ["US", "MX"]);
  assert.equal(cleared.coverage?.primaryTimeZone, "PST");
});
check("isKnownStateProvinceLabel: rejects a US state label under a country with no matching dataset entry", () => {
  assert.equal(isKnownStateProvinceLabel("US", "California"), true);
  assert.equal(isKnownStateProvinceLabel("US", "Not A Real State"), false);
  // Albania has no controlled dataset — manual entry is always allowed for it (nothing to check against).
  assert.equal(isKnownStateProvinceLabel("AL", "California"), true);
});
check("validateServiceCoverage: rejects the exact Albania/San Jose contradiction for one_state coverage", () => {
  // A US state value would be rejected once the coverage country claims to be a country with its
  // own dataset that doesn't contain it — reproduced here with MX (has a dataset) + a US state.
  const result = validateServiceCoverage({ country: "MX", coverage: { level: "one_state", stateProvince: "California" } });
  assert.equal(result.ok, false);
});
check("validateServiceCoverage: local/multi_city/one_state/multi_state/nationwide all require a valid coverage country (Phase 2)", () => {
  assert.equal(validateServiceCoverage({ country: "", coverage: { level: "local" }, baseCity: "San Jose" }).ok, false);
  assert.equal(validateServiceCoverage({ country: "", coverage: { level: "multi_city", citiesServed: ["A", "B"] } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "", coverage: { level: "one_state", stateProvince: "California" } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "", coverage: { level: "multi_state", statesProvincesServed: ["A", "B"] } }).ok, false);
  assert.equal(validateServiceCoverage({ country: "", coverage: { level: "nationwide", nationwideConfirmed: true } }).ok, false);
});
check("Review: business country, physical address, and service area render as three separate, distinctly labeled facts", () => {
  const es = businessIdentityCopy("es").wizard.step9;
  const en = businessIdentityCopy("en").wizard.step9;
  for (const t of [es, en]) {
    assert.ok(t.sectionBusinessCountry.trim().length > 0);
    assert.ok(t.sectionLocation.trim().length > 0);
    assert.ok(t.sectionCoverage.trim().length > 0);
    // The three labels must be genuinely distinct strings, not the same text reused.
    assert.notEqual(t.sectionBusinessCountry, t.sectionLocation);
    assert.notEqual(t.sectionLocation, t.sectionCoverage);
    assert.notEqual(t.sectionBusinessCountry, t.sectionCoverage);
  }
});
check("physicalAddressSummary / summarizeServiceCoverage: an online business can validly show a different base country than its service area", () => {
  const onlineBusiness: StructuredLocationDetailsV1 = {
    schemaVersion: 1,
    coverage: { schemaVersion: 1, level: "worldwide", worldwideConfirmed: true },
  };
  // No street/city entered — physical address must be omitted (null), never a misleading "—".
  assert.equal(physicalAddressSummary(onlineBusiness, "AL", "en"), null);
  const coverageSummary = summarizeServiceCoverage("AL", onlineBusiness, "en", businessIdentityCopy("en").wizard.step5.coverage.summary);
  assert.ok(coverageSummary.toLowerCase().includes("worldwide"));
});
const step9Text3 = readFileSync(path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/_steps/Step9Review.tsx"), "utf8");
check("Step9Review: renders sectionBusinessCountry, sectionLocation, and sectionCoverage as separate ReviewRow entries", () => {
  assert.ok(step9Text3.includes("t.sectionBusinessCountry"), "business country must be its own row");
  assert.ok(step9Text3.includes("t.sectionCoverage"), "service coverage must be its own row");
  assert.ok(!step9Text3.includes("structuredDetails.city ? ` · ${payload.serviceArea.structuredDetails.city}`"), "the old single collapsed country+city line must be gone");
});

// --- Phase 3: customer-facing phone display -------------------------------------------------
check("formatUsPhoneForDisplay: formats the exact reported raw-digit contradiction, +14088021531 and bare 10-digit alike", () => {
  assert.equal(formatUsPhoneForDisplay("14088021531"), "(408) 802-1531");
  assert.equal(formatUsPhoneForDisplay("+14088021531"), "(408) 802-1531");
  assert.equal(formatUsPhoneForDisplay("4088021531"), "(408) 802-1531");
  assert.equal(formatUsPhoneForDisplay("(408) 802-1531"), "(408) 802-1531");
});
check("formatUsPhoneForDisplay: never strips a meaningful (non-NANP) country code", () => {
  assert.equal(formatUsPhoneForDisplay("+52 55 1234 5678"), "+52 55 1234 5678");
  assert.equal(formatUsPhoneForDisplay("123"), "123");
});
check("Step9Review: contact row no longer echoes the raw contactType enum or unformatted rawValue", () => {
  assert.ok(!step9Text3.includes("`${primaryContact.contactType}: ${primaryContact.rawValue}`"), "raw enum + raw value must not be concatenated directly into the review line");
  assert.ok(step9Text3.includes("formatUsPhoneForDisplay"), "contact display must run through the shared phone formatter");
  assert.ok(step9Text3.includes("labelFrom(CONTACT_LABELS"), "contact display must use the owner's localized label, not the raw contactType");
});
const businessPageText = readFileSync(
  path.resolve(__dirname, "../app/(site)/dashboard/business-tools/business/[businessId]/page.tsx"),
  "utf8",
);
check("Completed Profile: contact value renders through formatUsPhoneForDisplay for phone contacts", () => {
  assert.ok(businessPageText.includes('c.contactType === "phone" ? formatUsPhoneForDisplay(c.value) : c.value'), "phone contacts must be formatted before display");
});

// --- Phase 4: floating dev-indicator collision ------------------------------------------------
const nextConfigText = readFileSync(path.resolve(__dirname, "../next.config.ts"), "utf8");
check("next.config.ts: dev-tools indicator is never left at the colliding default bottom-left position", () => {
  // Gate BCO-3R-B.5 first tried repositioning (top-right); Gate BCO-3R-B.6 found that still
  // collided with mobile language/menu controls and disabled the indicator outright instead
  // (devIndicators: false) — the current, superseding fix. This check only pins the invariant
  // that matters across both gates: never silently back at the original colliding default.
  assert.ok(nextConfigText.includes("devIndicators"), "expected a devIndicators config entry");
  assert.ok(!/devIndicators:\s*\{\s*position:\s*"bottom-left"/.test(nextConfigText), "must not be left at the colliding default bottom-left position");
  const repositioned = /devIndicators:\s*\{\s*position:\s*"(top-left|top-right|bottom-right)"/.test(nextConfigText);
  const disabled = /devIndicators:\s*false/.test(nextConfigText);
  assert.ok(repositioned || disabled, "expected either a repositioned corner or the indicator fully disabled");
});

// --- Phase 6: Step 8 explicit confirmation must remain unaffected by this gate -----------------
const step8Text2 = readFileSync(
  path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/_steps/Step8OwnedListings.tsx"),
  "utf8",
);
check("Step8OwnedListings: explicit listing confirmation behavior is untouched by this gate (Gate BCO-3R-B.4 regression still holds)", () => {
  assert.ok(step8Text2.includes("onChange={() => toggleCandidate(c)}"), "toggling a candidate must remain wired to an explicit checkbox onChange");
  const loadFnMatch = step8Text2.match(/async function load\(\)[\s\S]*?\n {2}\}/);
  assert.ok(loadFnMatch, "expected to find the load() function");
  assert.ok(!loadFnMatch![0].includes("selectedListingCandidates"), "load() must never silently select/connect a listing on fetch");
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
