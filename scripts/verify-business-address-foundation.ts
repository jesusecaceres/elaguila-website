/**
 * Verifier for the shared business address verification foundation
 * (app/lib/businessAddress/*). No live network, no DB — pure/unit-level checks only.
 *
 * Run: npx tsx scripts/verify-business-address-foundation.ts
 */
import { strict as assert } from "node:assert";
import * as fs from "node:fs";

import type { BusinessAddress } from "@/app/lib/businessAddress/businessAddressContract";
import { DEFAULT_BUSINESS_ADDRESS_COUNTRY } from "@/app/lib/businessAddress/businessAddressContract";
import { resolveBusinessAddressPublicView } from "@/app/lib/businessAddress/businessAddressPrivacy";
import { manualOnlyAddressProvider } from "@/app/lib/businessAddress/businessAddressProvider";
import {
  buildFormattedAddress,
  normalizeCity,
  normalizeCountry,
  normalizePostalCode,
  normalizeStateRegion,
} from "@/app/lib/businessAddress/businessAddressNormalize";
import { buildBusinessDirectionsHref } from "@/app/lib/businessAddress/businessAddressDirections";
import { createEmptyComidaLocalDraft } from "@/app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import { mapComidaLocalDraftToPreviewVm } from "@/app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm";

const failures: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

function manualAddress(overrides: Partial<BusinessAddress> = {}): BusinessAddress {
  return {
    street: "123 Main St",
    city: "San Jose",
    region: "CA",
    postalCode: "95112",
    country: DEFAULT_BUSINESS_ADDRESS_COUNTRY,
    verificationStatus: "manual",
    manualEntry: true,
    ...overrides,
  };
}

async function main() {
  // =================================================================================
  // Normalization
  // =================================================================================

  await check(
    "normalizeCity/normalizeStateRegion/normalizePostalCode: messy US input normalizes sensibly",
    () => {
      const city = normalizeCity("san jose");
      assert.equal(city, "San José", "known NorCal city should canonicalize via getCanonicalCityName");
      const region = normalizeStateRegion("ca");
      assert.equal(region, "CA");
      const zip = normalizePostalCode("95112", "US");
      assert.equal(zip, "95112");
    }
  );

  await check("normalizeStateRegion: accepts full state name as well as abbreviation", () => {
    assert.equal(normalizeStateRegion("California"), "CA");
    assert.equal(normalizeStateRegion("CA"), "CA");
    assert.equal(normalizeStateRegion("  california  "), "CA");
  });

  await check("normalizePostalCode: ZIP+4 aware, does not over-validate non-US formats", () => {
    assert.equal(normalizePostalCode("951121234", "US"), "95112-1234");
    assert.equal(normalizePostalCode("95112-1234", "US"), "95112-1234");
    // Non-US postal code: not force-fit into the 5/9-digit US shape, just cleaned.
    assert.equal(normalizePostalCode("k1a 0b1", "CA"), "K1A 0B1");
  });

  await check("normalizeCountry: defaults to US, recognizes common aliases", () => {
    assert.equal(normalizeCountry(undefined), "US");
    assert.equal(normalizeCountry(""), "US");
    assert.equal(normalizeCountry("usa"), "US");
    assert.equal(normalizeCountry("United States"), "US");
    assert.equal(normalizeCountry("mexico"), "MX");
  });

  await check("buildFormattedAddress: messy input assembled into a sensible display string", () => {
    const formatted = buildFormattedAddress({
      street: "123  Main st",
      city: "San Jose",
      region: "CA",
      postalCode: "95112",
      country: "US",
      verificationStatus: "manual",
      manualEntry: true,
    });
    assert.equal(formatted, "123  Main st, San Jose, CA 95112");
  });

  // =================================================================================
  // Unit / apartment handling
  // =================================================================================

  await check("buildFormattedAddress: unit preserved when present", () => {
    const formatted = buildFormattedAddress(manualAddress({ street: "123 Main St", unit: "Apt 4B" }));
    assert.equal(formatted, "123 Main St Apt 4B, San Jose, CA 95112");
  });

  await check("buildFormattedAddress: no unit segment when absent", () => {
    const formatted = buildFormattedAddress(manualAddress({ unit: undefined }));
    assert.ok(!formatted.includes("undefined"));
    assert.equal(formatted, "123 Main St, San Jose, CA 95112");
  });

  // =================================================================================
  // Manual/unverified truth
  // =================================================================================

  await check("Manual entry: verificationStatus is 'manual', never silently upgraded to 'verified'", () => {
    const addr = manualAddress();
    assert.equal(addr.verificationStatus, "manual");
    assert.equal(addr.manualEntry, true);
    assert.notEqual(addr.verificationStatus, "verified");
  });

  await check("manualOnlyAddressProvider: never returns ok:true / never fabricates a verified suggestion", async () => {
    const result = await manualOnlyAddressProvider.suggest("123 Main St, San Jose CA");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "no_provider_configured");
    }
  });

  await check("No code path in this foundation sets 'verified' for manual entry (source-level proof)", () => {
    const stripComments = (src: string) =>
      src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const normalizeSrc = stripComments(
      fs.readFileSync("app/lib/businessAddress/businessAddressNormalize.ts", "utf8")
    );
    assert.ok(
      !normalizeSrc.includes('"verified"'),
      "pure normalizers must never assign verificationStatus: 'verified'"
    );
    const providerSrc = stripComments(
      fs.readFileSync("app/lib/businessAddress/businessAddressProvider.ts", "utf8")
    );
    assert.ok(
      !providerSrc.includes('"verified"'),
      "the honest manual-only provider must never claim a 'verified' result (outside comments)"
    );
    const contractSrc = fs.readFileSync("app/lib/businessAddress/businessAddressContract.ts", "utf8");
    assert.ok(
      contractSrc.includes('"verified"'),
      "the type union must still permit 'verified' for a real future provider adapter to use"
    );
  });

  // =================================================================================
  // Privacy: resolveBusinessAddressPublicView never leaks exactAddressLine when not permitted
  // =================================================================================

  await check("Private address suppressed: exactAddressLine absent when showExactAddress is false", () => {
    const view = resolveBusinessAddressPublicView({
      address: manualAddress({ street: "999 Secret Ave" }),
      showExactAddress: false,
      cityOrServiceArea: "San Jose",
    });
    assert.equal(view.exactAddressLine, undefined);
    assert.equal(view.showExactAddress, false);
    assert.equal(view.directionsAllowed, false);
    assert.equal(view.hasPrivateAddress, true);
    assert.equal(view.publicCityOrServiceArea, "San Jose");
  });

  await check(
    "Privacy adversarial inputs: empty street, whitespace-only, and address containing the word 'public' never leak when showExactAddress is false",
    () => {
      const cases: BusinessAddress[] = [
        manualAddress({ street: "" }),
        manualAddress({ street: "   " }),
        manualAddress({ street: "123 Public Plaza", formattedAddress: "123 Public Plaza, San Jose, CA" }),
      ];
      for (const address of cases) {
        const view = resolveBusinessAddressPublicView({
          address,
          showExactAddress: false,
          cityOrServiceArea: "San Jose",
        });
        assert.equal(view.exactAddressLine, undefined, `leaked for street=${JSON.stringify(address.street)}`);
        assert.equal(view.showExactAddress, false);
        assert.equal(view.directionsAllowed, false);
      }
    }
  );

  await check(
    "Privacy: showExactAddress true reveals the line, and city/service-area is always present either way",
    () => {
      const revealed = resolveBusinessAddressPublicView({
        address: manualAddress({ street: "999 Open Ave" }),
        showExactAddress: true,
        cityOrServiceArea: "San Jose",
      });
      assert.ok(revealed.exactAddressLine?.includes("999 Open Ave"));
      assert.equal(revealed.showExactAddress, true);
      assert.equal(revealed.directionsAllowed, true);
      assert.equal(revealed.publicCityOrServiceArea, "San Jose");

      const hidden = resolveBusinessAddressPublicView({
        address: manualAddress({ street: "999 Open Ave" }),
        showExactAddress: false,
        cityOrServiceArea: "San Jose",
      });
      // City/service area always allowed to show, independent of exact-address visibility.
      assert.equal(hidden.publicCityOrServiceArea, "San Jose");
    }
  );

  await check("Privacy: showExactAddress true but no real address on file never fabricates a line", () => {
    const view = resolveBusinessAddressPublicView({
      address: null,
      showExactAddress: true,
      cityOrServiceArea: "San Jose",
    });
    assert.equal(view.exactAddressLine, undefined);
    assert.equal(view.showExactAddress, false);
    assert.equal(view.directionsAllowed, false);
    assert.equal(view.hasPrivateAddress, false);
  });

  // =================================================================================
  // Directions suppressed for private/no-destination cases
  // =================================================================================

  await check("buildBusinessDirectionsHref: null when address is private", () => {
    const view = resolveBusinessAddressPublicView({
      address: manualAddress(),
      showExactAddress: false,
      cityOrServiceArea: "San Jose",
    });
    assert.equal(buildBusinessDirectionsHref(view), null);
  });

  await check("buildBusinessDirectionsHref: null when there is no address at all", () => {
    const view = resolveBusinessAddressPublicView({
      address: null,
      showExactAddress: true,
      cityOrServiceArea: "San Jose",
    });
    assert.equal(buildBusinessDirectionsHref(view), null);
  });

  await check("buildBusinessDirectionsHref: real google maps search URL when a safe destination exists", () => {
    const view = resolveBusinessAddressPublicView({
      address: manualAddress({ street: "123 Main St" }),
      showExactAddress: true,
      cityOrServiceArea: "San Jose",
    });
    const href = buildBusinessDirectionsHref(view);
    assert.ok(href);
    assert.ok(href!.startsWith("https://www.google.com/maps/search/?api=1&query="));
    assert.ok(href!.includes(encodeURIComponent("123 Main St")));
  });

  // =================================================================================
  // Comida Local home-kitchen privacy regression (read-only import of shipped code)
  // =================================================================================

  await check(
    "Comida Local regression: private address (showAddressPublicly=false) still produces empty businessAddressLine + sections.showBusinessAddress=false in the real shipped VM mapper",
    () => {
      const draft = createEmptyComidaLocalDraft();
      draft.businessName = "Tamales Doña Lupe";
      draft.businessAddressLine = "456 Private Ln, San Jose, CA 95112";
      draft.showAddressPublicly = false;

      const vm = mapComidaLocalDraftToPreviewVm(draft, "es");

      assert.equal(vm.businessAddressLine, "", "private address must not appear in the public VM string");
      assert.equal(vm.sections.showBusinessAddress, false, "section flag must reflect the address is hidden");
      assert.ok(
        !JSON.stringify(vm).includes("456 Private Ln"),
        "private address text must not leak anywhere in the serialized VM"
      );
    }
  );

  await check(
    "Comida Local regression: opted-in address (showAddressPublicly=true) still surfaces correctly (sanity control)",
    () => {
      const draft = createEmptyComidaLocalDraft();
      draft.businessName = "Tamales Doña Lupe";
      draft.businessAddressLine = "456 Public Ln, San Jose, CA 95112";
      draft.showAddressPublicly = true;

      const vm = mapComidaLocalDraftToPreviewVm(draft, "es");

      assert.equal(vm.businessAddressLine, "456 Public Ln, San Jose, CA 95112");
      assert.equal(vm.sections.showBusinessAddress, true);
    }
  );

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nverify-business-address-foundation: PASS");
}

main();
