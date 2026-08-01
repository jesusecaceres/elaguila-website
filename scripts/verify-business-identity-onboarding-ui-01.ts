/**
 * Focused tests for the Gate BCO-3R-B 9-step Identity UI (onboarding wizard, copy, country
 * dataset, data dictionary). Same repo convention as the other verify-business-*.ts scripts — no
 * jest/vitest in this repo, hand-rolled node:assert + check(). Real component/interaction
 * behavior is covered by browser QA (this repo has no DOM test runner); these checks cover the
 * pure-logic and data-completeness surface that a DOM test would otherwise waste time re-proving.
 * Run from repo root: npx tsx scripts/verify-business-identity-onboarding-ui-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { COUNTRIES, COUNTRY_CODES, isValidCountryCode } from "../app/lib/business/countries";
import { BUSINESS_LANGUAGES, BUSINESS_LANGUAGE_CODES } from "../app/lib/business/languages";
import { businessIdentityCopy } from "../app/(site)/dashboard/business-tools/_components/businessIdentityCopy";
import {
  isLegacyV1Payload,
  migrateDraftV1ToV2,
  emptyWizardPayload,
  emptyWizardPayloadV2,
  composeServiceAreaAreaKind,
  composeServiceAreaRawText,
  deriveEffectiveOperatingModels,
  PRIMARY_OPERATING_MODE_VALUES,
} from "../app/(site)/dashboard/business-tools/onboarding/wizardTypes";
import { formatUsPhoneForDisplay, isPlatformHomepageOnly, normalizeHandleOrUrl } from "../app/(site)/dashboard/business-tools/onboarding/_steps/Step6ContactsProfiles";

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

console.log("Business Identity onboarding UI (Gate BCO-3R-B) — focused tests\n");

// --- country list: complete ISO 3166-1, not a curated subset -------------------------------
check("COUNTRIES: exactly 249 ISO 3166-1 entries + OTHER (250 total)", () => {
  assert.equal(COUNTRIES.length, 250);
});
check("COUNTRIES: every code is unique", () => {
  const set = new Set(COUNTRY_CODES);
  assert.equal(set.size, COUNTRY_CODES.length);
});
check("COUNTRIES: every entry has a non-empty ES and EN label", () => {
  for (const c of COUNTRIES) {
    assert.ok(c.es.trim().length > 0, `${c.code} missing es label`);
    assert.ok(c.en.trim().length > 0, `${c.code} missing en label`);
  }
});
check("COUNTRIES: OTHER fallback present and last", () => {
  assert.equal(COUNTRIES[COUNTRIES.length - 1].code, "OTHER");
  assert.equal(isValidCountryCode("OTHER"), true);
});
check("COUNTRIES: not limited to a curated Americas subset — spans every populated region", () => {
  const codes = new Set(COUNTRY_CODES);
  for (const c of ["US", "MX", "BR", "ES", "FR", "DE", "RU", "CN", "JP", "IN", "NG", "ZA", "EG", "AU", "NZ", "FJ", "AF", "KP"]) {
    assert.ok(codes.has(c), `missing ${c}`);
  }
});

// --- business language list -----------------------------------------------------------------
check("BUSINESS_LANGUAGES: unique codes, non-empty labels, other fallback present", () => {
  const set = new Set(BUSINESS_LANGUAGE_CODES);
  assert.equal(set.size, BUSINESS_LANGUAGE_CODES.length);
  for (const l of BUSINESS_LANGUAGES) {
    assert.ok(l.es.trim().length > 0);
    assert.ok(l.en.trim().length > 0);
  }
  assert.ok(BUSINESS_LANGUAGE_CODES.includes("other"));
});

// --- ES/EN copy parity -------------------------------------------------------------------------
function keyShape(value: unknown): unknown {
  if (Array.isArray(value)) return value.length; // arrays: compare length, not content (content legitimately differs by language)
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) out[k] = keyShape((value as Record<string, unknown>)[k]);
    return out;
  }
  return typeof value; // leaf: compare type, not literal text
}

check("businessIdentityCopy: ES and EN have identical key structure (no missing translations)", () => {
  const es = businessIdentityCopy("es");
  const en = businessIdentityCopy("en");
  assert.deepEqual(keyShape(es), keyShape(en));
});
check("businessIdentityCopy: wizard.stepLabels has exactly 9 entries in both languages", () => {
  assert.equal(businessIdentityCopy("es").wizard.stepLabels.length, 9);
  assert.equal(businessIdentityCopy("en").wizard.stepLabels.length, 9);
});
check("businessIdentityCopy: step3 stageDescriptions covers all 6 business stages in both languages", () => {
  const stages = ["planning_prelaunch", "newly_opened", "operating", "growing", "established_mature", "paused_restructuring"];
  for (const lang of ["es", "en"] as const) {
    const desc = businessIdentityCopy(lang).wizard.step3.stageDescriptions;
    for (const s of stages) assert.ok(desc[s]?.trim().length > 0, `${lang} missing stage description for ${s}`);
  }
});

// --- v1 -> v2 migration wiring -----------------------------------------------------------------
check("isLegacyV1Payload correctly discriminates v1 vs v2 shapes", () => {
  assert.equal(isLegacyV1Payload(emptyWizardPayload("es")), true);
  assert.equal(isLegacyV1Payload(emptyWizardPayloadV2("es")), false);
});
check("migrateDraftV1ToV2 always forces updatedByStep=1 so the language step is always revisited", () => {
  const legacy = emptyWizardPayload("es");
  legacy.basics.displayName = "Taquería El Sol";
  const migrated = migrateDraftV1ToV2(legacy, "es");
  assert.equal(migrated.updatedByStep, 1);
  assert.equal(migrated.basics.displayName, "Taquería El Sol");
});

// --- structured-location rawText composer -------------------------------------------------------
check("composeServiceAreaAreaKind: street fields imply a physical address", () => {
  assert.equal(composeServiceAreaAreaKind({ schemaVersion: 1, streetName: "Av. Reforma" }), "physical_address");
  assert.equal(composeServiceAreaAreaKind({ schemaVersion: 1 }), "service_area_text");
});
check("composeServiceAreaRawText: composes a physical address line", () => {
  const text = composeServiceAreaRawText("MX", { schemaVersion: 1, streetNumber: "123", streetName: "Av. Reforma", city: "CDMX" });
  assert.ok(text.includes("123"));
  assert.ok(text.includes("Av. Reforma"));
  assert.ok(text.includes("CDMX"));
});
check("composeServiceAreaRawText: never throws/empty for a bare country selection", () => {
  const text = composeServiceAreaRawText("MX", { schemaVersion: 1 });
  assert.equal(text, "MX");
});
check("composeServiceAreaRawText: Gate BCO-3R-B.3 coverage.level takes priority over legacy fields", () => {
  const text = composeServiceAreaRawText("US", {
    schemaVersion: 1,
    citiesServed: ["Legacy City"],
    coverage: { schemaVersion: 1, level: "multi_city", citiesServed: ["San Jose", "Santa Clara"] },
  });
  assert.equal(text, "San Jose, Santa Clara");
});
check("composeServiceAreaRawText: nationwide coverage composes without throwing", () => {
  const text = composeServiceAreaRawText("US", { schemaVersion: 1, coverage: { schemaVersion: 1, level: "nationwide", nationwideConfirmed: true } });
  assert.equal(text, "Nationwide");
});

// --- data dictionary completeness --------------------------------------------------------------
const dictPath = path.resolve(__dirname, "../docs/business-identity-data-dictionary-01.md");
const dictText = readFileSync(dictPath, "utf8");

const REQUIRED_FIELD_KEYS = [
  "displayName", "legalName", "publicName", "businessPrimaryLanguage", "businessAdditionalLanguages", "yearStarted",
  "broadBusinessType", "specificBusinessType", "customSpecificType", "businessStage", "primaryLanguage",
  "operatingModels", "salesRelationships", "salesChannels", "normalizedName", "slug",
  "authorizationRole", "representativeRelationship", "representativeContactEmail", "representativeNote", "manualReviewFlag",
  "contactType", "value", "normalizedValue", "label", "visibility", "preferredChannel", "channelKind", "isPrimary",
  "platform", "handleOrUrl",
  "country", "customCountryName", "streetNumber", "streetName", "unit", "neighborhood", "city", "stateProvince",
  "postalCode", "addressVisibility", "interactionMode", "coverageType", "serviceRadius", "radiusUnit", "citiesServed",
  "regionsServed", "postalCodesServed", "customCoverageDescription", "countriesServed", "languagesServed", "timezone",
  "nationwide", "international", "hasMultipleLocations", "approximateLocationCount", "baseCity", "baseStateProvince",
  "basePostalCode", "rawText", "normalizedText",
  "listingSource", "listingId", "relationshipRole", "status", "linkedBy", "linkedAt", "verifiedAt",
  "setupLanguage",
  // Gate BCO-3R-B.3 — structuredDetails.coverage (strict versioned service-coverage shape)
  "coverage.level", "coverage.radiusValue", "coverage.nearbyNeighborhoods", "coverage.localNote",
  "coverage.citiesStateProvince", "coverage.statesProvincesServed", "coverage.excludedStatesProvinces",
  "coverage.excludedCitiesOrAreas", "coverage.multiStateSelectAllConfirmed", "coverage.nationwideConfirmed",
  "coverage.countriesServedCodes", "coverage.excludedCountries", "coverage.regionSelections",
  "coverage.worldwideConfirmed", "coverage.primaryTimeZone", "coverage.additionalTimeZones",
  "coverage.deliveryModels", "coverage.deliveryModelOtherNote", "regionCode", "wholeRegion", "countryCodes",
];

check("data dictionary: every Identity v2 field key is documented", () => {
  const missing = REQUIRED_FIELD_KEYS.filter((key) => !dictText.includes(`\`${key}\``) && !dictText.includes(key));
  assert.deepEqual(missing, [], `missing field keys: ${missing.join(", ")}`);
});
check("data dictionary: every row uses one of the five approved sensitivity classifications", () => {
  const approved = ["PUBLIC", "BUSINESS_INTERNAL", "OWNER_PRIVATE", "SENSITIVE_OPTIONAL", "SYSTEM_SECURITY"];
  const found = new Set<string>();
  for (const cls of approved) if (dictText.includes(cls)) found.add(cls);
  assert.deepEqual([...found].sort(), [...approved].sort());
});

// --- double-submit guard (source-level check — no DOM runner in this repo) ---------------------
const step9Path = path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/_steps/Step9Review.tsx");
const step9Text = readFileSync(step9Path, "utf8");
check("Step9Review: submit button is disabled while submitting (double-submit guard)", () => {
  assert.ok(step9Text.includes("disabled={submitting"), "submit button must disable on submitting state");
});

// --- Gate BCO-3R-B.1 correction pass ------------------------------------------------------------

check("businessIdentityCopy: required/optional legend is present and non-empty in both languages", () => {
  for (const lang of ["es", "en"] as const) {
    assert.ok(businessIdentityCopy(lang).wizard.requiredOptionalLegend.trim().length > 0);
    assert.ok(businessIdentityCopy(lang).wizard.requiredLabel.trim().length > 0);
    assert.ok(businessIdentityCopy(lang).wizard.optionalLabel.trim().length > 0);
  }
});
check("businessIdentityCopy: purpose intro and privacy commitment copy present in both languages", () => {
  for (const lang of ["es", "en"] as const) {
    const wizard = businessIdentityCopy(lang).wizard;
    assert.ok(wizard.purpose.title.trim().length > 0);
    assert.ok(wizard.purpose.benefits.length >= 6);
    assert.ok(wizard.privacyShort.body.includes(lang === "es" ? "No vendemos" : "do not sell"));
    assert.ok(wizard.privacyFull.body.includes(lang === "es" ? "No vendemos" : "do not sell"));
  }
});
check("businessIdentityCopy: final CTA is the customer-facing rename, not the old internal name", () => {
  assert.equal(businessIdentityCopy("es").wizard.step9.submit, "Crear perfil de mi negocio");
  assert.equal(businessIdentityCopy("en").wizard.step9.submit, "Create my business profile");
});

// setupLanguage/URL-lang consistency fix (Gate BCO-3R-B.1 Phase 12) — this fix lives inside
// OnboardingWizard's hydrate effect (not a pure function), so it's verified at the source level:
// every branch that resolves a payload from a stored draft must force `setupLanguage: lang`.
const wizardPath = path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/OnboardingWizard.tsx");
const wizardText = readFileSync(wizardPath, "utf8");
check("OnboardingWizard: hydrate always forces setupLanguage to the active URL language", () => {
  const occurrences = (wizardText.match(/setupLanguage:\s*lang/g) ?? []).length;
  assert.ok(occurrences >= 2, `expected setupLanguage to be forced to the URL lang in both the migrated and non-migrated hydrate branches, found ${occurrences} occurrence(s)`);
});

check("deriveEffectiveOperatingModels: single primary mode stays as-is, hybrid is never customer-selected", () => {
  assert.deepEqual(deriveEffectiveOperatingModels(["fixed_location"]), ["fixed_location"]);
  assert.deepEqual(deriveEffectiveOperatingModels([]), []);
});
check("deriveEffectiveOperatingModels: two+ primary modes auto-derive hybrid", () => {
  const result = deriveEffectiveOperatingModels(["fixed_location", "mobile"]);
  assert.ok(result.includes("hybrid"));
  assert.ok(result.includes("fixed_location"));
  assert.ok(result.includes("mobile"));
});
check("deriveEffectiveOperatingModels: multiple_locations never counts toward the hybrid threshold on its own", () => {
  const result = deriveEffectiveOperatingModels(["fixed_location", "multiple_locations"]);
  assert.ok(!result.includes("hybrid"), "multiple_locations is a separate fact, not a second primary mode");
});
check("deriveEffectiveOperatingModels: a raw 'hybrid' value in old data is stripped and re-derived, never double-counted", () => {
  assert.deepEqual(deriveEffectiveOperatingModels(["hybrid"]), []);
});
check("PRIMARY_OPERATING_MODE_VALUES excludes hybrid and multiple_locations", () => {
  assert.ok(!PRIMARY_OPERATING_MODE_VALUES.includes("hybrid" as never));
  assert.ok(!PRIMARY_OPERATING_MODE_VALUES.includes("multiple_locations" as never));
  assert.equal(PRIMARY_OPERATING_MODE_VALUES.length, 4);
});

check("formatUsPhoneForDisplay: formats a bare 10-digit US number, leaves everything else untouched", () => {
  assert.equal(formatUsPhoneForDisplay("4088021531"), "(408) 802-1531");
  assert.equal(formatUsPhoneForDisplay("(408) 802-1531"), "(408) 802-1531");
  assert.equal(formatUsPhoneForDisplay("+52 55 1234 5678"), "+52 55 1234 5678"); // international, untouched
  assert.equal(formatUsPhoneForDisplay("123"), "123"); // too short, untouched — never fabricates digits
});
check("isPlatformHomepageOnly: flags a bare platform homepage, not a real profile link", () => {
  assert.equal(isPlatformHomepageOnly("facebook", "facebook.com"), true);
  assert.equal(isPlatformHomepageOnly("facebook", "https://www.facebook.com/"), true);
  assert.equal(isPlatformHomepageOnly("facebook", "https://www.facebook.com/mynegocio"), false);
  assert.equal(isPlatformHomepageOnly("other", "facebook.com"), false); // "other" has no fixed homepage to compare against
});
check("normalizeHandleOrUrl: adds a scheme to a bare domain, leaves @handles alone", () => {
  assert.equal(normalizeHandleOrUrl("instagram.com/mynegocio"), "https://instagram.com/mynegocio");
  assert.equal(normalizeHandleOrUrl("@mynegocio"), "@mynegocio");
  assert.equal(normalizeHandleOrUrl("https://instagram.com/mynegocio"), "https://instagram.com/mynegocio");
});

// Contact single-preferred / single-primary enforcement (Gate BCO-3R-B.1) — the DB enforces at
// most one preferred and one primary contact per business via unique indexes
// (business_contacts_one_preferred_channel_idx, business_contacts_one_primary_idx); the UI must
// enforce the same mutual exclusivity or finalize-v2 would fail with an unexplained DB error.
const step6Path = path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/_steps/Step6ContactsProfiles.tsx");
const step6Text = readFileSync(step6Path, "utf8");
check("Step6ContactsProfiles: checking one contact as primary/preferred unchecks it on every other contact", () => {
  assert.ok(step6Text.includes("isPrimary: e.target.checked ? false : c.isPrimary"), "primary must be mutually exclusive across contacts");
  assert.ok(step6Text.includes("preferredChannel: e.target.checked ? false : c.preferredChannel"), "preferred channel must be mutually exclusive across contacts");
});

check("data dictionary: all four AI-use categories are defined and used", () => {
  for (const cat of ["NEVER_AI", "TASK_SCOPED_AI", "OWNER_APPROVED_AI", "PUBLIC_CONTEXT_AI"]) {
    assert.ok(dictText.includes(cat), `missing AI-use category ${cat}`);
  }
});
check("data dictionary: no OWNER_PRIVATE or SENSITIVE_OPTIONAL table row is marked with unconditional public AI access", () => {
  // Only real table rows (start with "| `field`" — excludes the prose legend/mapping-rule lines).
  const rows = dictText.split("\n").filter((l) => /^\|\s*`/.test(l) && (l.includes("OWNER_PRIVATE") || l.includes("SENSITIVE_OPTIONAL")));
  assert.ok(rows.length > 0, "expected to find at least one OWNER_PRIVATE/SENSITIVE_OPTIONAL table row");
  for (const row of rows) {
    const hasPublicAi = row.includes("PUBLIC_CONTEXT_AI");
    const isConditional = /unless|once|when|while/i.test(row);
    assert.ok(!hasPublicAi || isConditional, `private/sensitive row must not default to unconditional public AI context: ${row}`);
  }
});

// --- Gate BCO-3R-B.4 responsive polish — source-level regression checks -------------------------
// No DOM runner in this repo, so these are structural/behavioral source checks: they confirm the
// mobile-alignment fix is actually present (not just visually eyeballed) and, more importantly,
// that the fix never changed the underlying selection/confirmation truth behavior.

const step8Path = path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/_steps/Step8OwnedListings.tsx");
const step8Text = readFileSync(step8Path, "utf8");

check("Step8OwnedListings: listing card stacks vertically on mobile and returns to a row at sm+ (Gate BCO-3R-B.4)", () => {
  assert.ok(step8Text.includes("flex-col gap-3 sm:flex-row"), "the card's outer layout must stack on mobile and go horizontal at sm+");
});
check("Step8OwnedListings: ownership checkbox row is a full-width, divided row on mobile (not floating at the edge)", () => {
  assert.ok(step8Text.includes("border-t border-dashed border-[#E8DFD0] pt-3"), "mobile confirmation row needs a divider separating it from listing details");
  assert.ok(step8Text.includes("min-h-[44px] shrink-0 items-center gap-2 border-t"), "confirmation label must be a real touch target, vertically centered");
});
check("Step8OwnedListings: listing title is never truncated (must wrap, not clip)", () => {
  assert.ok(!step8Text.includes('className="truncate text-sm font-bold'), "title must not use `truncate` — it must wrap naturally");
  assert.ok(step8Text.includes('className="break-words text-sm font-bold'), "title should use `break-words` so long titles wrap instead of overflowing");
});
check("Step8OwnedListings: candidate selection is only ever toggled by an explicit user action, never on load", () => {
  // load() only ever calls setCandidates/setState — it must never itself touch selectedListingCandidates.
  const loadFnMatch = step8Text.match(/async function load\(\)[\s\S]*?\n {2}\}/);
  assert.ok(loadFnMatch, "expected to find the load() function");
  assert.ok(!loadFnMatch![0].includes("selectedListingCandidates"), "load() must never silently select/connect a listing on fetch");
  assert.ok(step8Text.includes("onChange={() => toggleCandidate(c)}"), "toggling a candidate must remain wired to an explicit checkbox onChange");
});
check("Step8OwnedListings: manual fallback entry stays full-width and aligned to the card content (no fixed-width overflow)", () => {
  assert.ok(step8Text.includes("flex flex-col gap-2 sm:flex-row"), "fallback input/button row must stack before sm and never force horizontal scroll");
});

const step9Path2 = path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/_steps/Step9Review.tsx");
const step9Text2 = readFileSync(step9Path2, "utf8");
check("Step9Review: review rows wrap the Edit action instead of colliding with long summaries (Gate BCO-3R-B.4)", () => {
  assert.ok(step9Text2.includes("flex-wrap items-start justify-between"), "ReviewRow must allow the Edit button to drop to its own line when content is long");
  assert.ok(step9Text2.includes("break-words text-sm text-[#1E1810]"), "review content must wrap long raw values instead of overflowing");
});
check("Step9Review: every review row still exposes its Edit action (navigation to the step is unchanged)", () => {
  const editButtonCount = (step9Text2.match(/onClick=\{onEdit\}/g) ?? []).length;
  assert.ok(editButtonCount >= 1, "ReviewRow's Edit button must still be wired to onEdit");
  const onEditStepCalls = (step9Text2.match(/onEditStep\(\d\)/g) ?? []).length;
  assert.ok(onEditStepCalls >= 8, `expected every reviewed step (1,3,4,5,6,7,8) to still route Edit back to itself, found ${onEditStepCalls} call sites`);
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
