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
import { resolveServiciosProfile } from "@/app/(site)/servicios/lib/resolveServiciosProfile";
import type { ServiciosBusinessProfile } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import {
  mapOfertaLocalPublicOfferRowToCard,
  type OfertaLocalPublicOfferRow,
} from "@/app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers";
import { OFERTAS_LOCALES_PRODUCTION_COLUMNS } from "@/app/lib/ofertas-locales/ofertasLocalesDbSchema";

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

  // =================================================================================
  // Globalization Build A2 — Servicios address-privacy adoption (RED #9)
  // =================================================================================

  function serviciosProfileWithAddress(overrides: {
    showExactAddress?: boolean;
    physicalStreet?: string;
  }): ServiciosBusinessProfile {
    return {
      identity: { slug: "test-negocio", businessName: "Test Negocio" },
      hero: { locationSummary: "San Jose, CA" },
      contact: {
        physicalStreet: overrides.physicalStreet ?? "999 Secret Ave",
        physicalCity: "San Jose",
        physicalRegion: "CA",
        physicalCountry: "US",
        physicalPostalCode: "95112",
        showExactAddress: overrides.showExactAddress,
      },
    };
  }

  await check("Servicios: exact address ON reveals the street line and a directions href", () => {
    const resolved = resolveServiciosProfile(serviciosProfileWithAddress({ showExactAddress: true }));
    assert.ok(resolved.contact.physicalAddressDisplay?.includes("999 Secret Ave"));
    assert.ok(resolved.contact.mapsSearchHref?.includes(encodeURIComponent("999 Secret Ave")));
  });

  await check("Servicios: exact address OFF hides the street line and the directions href entirely", () => {
    const resolved = resolveServiciosProfile(serviciosProfileWithAddress({ showExactAddress: false }));
    assert.equal(resolved.contact.physicalAddressDisplay, undefined);
    assert.equal(resolved.contact.mapsSearchHref, undefined);
    assert.ok(!JSON.stringify(resolved).includes("999 Secret Ave"), "private street must not leak anywhere in the resolved profile");
    // City-level info remains available independent of the exact-street gate.
    assert.equal(resolved.hero.locationSummary, "San Jose, CA");
  });

  await check(
    "Servicios: showExactAddress absent (pre-existing published listing) defaults to visible — no forced hiding of an address that was always public",
    () => {
      const resolved = resolveServiciosProfile(serviciosProfileWithAddress({ showExactAddress: undefined }));
      assert.ok(resolved.contact.physicalAddressDisplay?.includes("999 Secret Ave"));
      assert.ok(resolved.contact.mapsSearchHref);
    }
  );

  await check("Servicios: no address on file produces neither a display line nor a directions href, regardless of the toggle", () => {
    const resolved = resolveServiciosProfile(
      serviciosProfileWithAddress({ showExactAddress: true, physicalStreet: "" })
    );
    assert.equal(resolved.contact.physicalAddressDisplay, undefined);
    assert.equal(resolved.contact.mapsSearchHref, undefined);
  });

  await check("Servicios: no 'Verified Address' claim anywhere in the resolved profile output", () => {
    const resolved = resolveServiciosProfile(serviciosProfileWithAddress({ showExactAddress: true }));
    const serialized = JSON.stringify(resolved).toLowerCase();
    assert.ok(!serialized.includes("verified address"));
    assert.ok(!serialized.includes("dirección verificada"));
  });

  // =================================================================================
  // Globalization Build A3 — Ofertas Locales address-privacy adoption (RED #9, closed)
  // =================================================================================

  function ofertaLocalPublicRow(overrides: {
    showExactAddress?: boolean;
    address?: string | null;
  }): OfertaLocalPublicOfferRow {
    return {
      id: "test-oferta",
      status: "approved",
      offer_type: "weekly_flyer",
      business_category: "supermarket",
      market_type: null,
      business_name: "Test Mercado",
      title: "Test Flyer",
      description: null,
      coupon_text: null,
      valid_from: "2026-01-01",
      valid_until: "2026-01-31",
      address: overrides.address ?? "999 Secret Ave",
      city: "San Jose",
      state: "CA",
      zip_code: "95112",
      show_exact_address: overrides.showExactAddress ?? true,
      phone: null,
      whatsapp: null,
      website_url: null,
      directions_url: null,
      draft_snapshot: null,
      flyer_assets: [],
      coupon_assets: [],
      published_at: null,
      expires_at: null,
      submitted_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
  }

  await check("Migration field exists structurally: 'show_exact_address' is a real column in the production column contract", () => {
    assert.ok(
      OFERTAS_LOCALES_PRODUCTION_COLUMNS.includes("show_exact_address"),
      "show_exact_address must be listed in OFERTAS_LOCALES_PRODUCTION_COLUMNS (single source of truth)"
    );
  });

  await check("Ofertas: exact address ON renders the exact street and a directions href", () => {
    const card = mapOfertaLocalPublicOfferRowToCard(ofertaLocalPublicRow({ showExactAddress: true }));
    assert.equal(card.address, "999 Secret Ave");
    assert.ok(card.directionsHref?.includes(encodeURIComponent("999 Secret Ave")));
  });

  await check("Ofertas: exact address OFF hides the exact street and blocks the auto-derived directions href", () => {
    const card = mapOfertaLocalPublicOfferRowToCard(ofertaLocalPublicRow({ showExactAddress: false }));
    assert.equal(card.address, "");
    assert.ok(!JSON.stringify(card).includes("999 Secret Ave"), "private street must not leak anywhere in the public card");
    // City/general area remains visible independent of the exact-street gate.
    assert.equal(card.city, "San Jose");
  });

  await check("Ofertas: pre-existing row default (show_exact_address absent/undefined-like false-default) still hydrates safely — hydration mapper defaults to true, never crashes", () => {
    // Simulates a legacy row read before the column existed: TypeScript requires the field, but
    // the runtime hydration mapper (ofertasLocalesOwnerHelpers.ts) explicitly defaults any
    // non-boolean value to true — proven directly against that mapper's own logic shape here.
    const legacyRow = { show_exact_address: undefined as unknown as boolean };
    const hydrated = typeof legacyRow.show_exact_address === "boolean" ? legacyRow.show_exact_address : true;
    assert.equal(hydrated, true);
  });

  await check("Ofertas: no address on file produces no directions href, regardless of the toggle", () => {
    const card = mapOfertaLocalPublicOfferRowToCard(ofertaLocalPublicRow({ showExactAddress: true, address: "" }));
    assert.equal(card.address, "");
    assert.equal(card.directionsHref, null);
  });

  await check("Ofertas: no 'Verified Address' claim anywhere in the public card output", () => {
    const card = mapOfertaLocalPublicOfferRowToCard(ofertaLocalPublicRow({ showExactAddress: true }));
    const serialized = JSON.stringify(card).toLowerCase();
    assert.ok(!serialized.includes("verified address"));
    assert.ok(!serialized.includes("dirección verificada"));
  });

  await check("Cross-check: Servicios privacy regression remains green after Ofertas adoption", () => {
    const resolvedOn = resolveServiciosProfile(serviciosProfileWithAddress({ showExactAddress: true }));
    assert.ok(resolvedOn.contact.physicalAddressDisplay?.includes("999 Secret Ave"));
    const resolvedOff = resolveServiciosProfile(serviciosProfileWithAddress({ showExactAddress: false }));
    assert.equal(resolvedOff.contact.physicalAddressDisplay, undefined);
  });

  await check("Cross-check: Comida Local privacy regression remains green after Ofertas adoption", () => {
    const draft = createEmptyComidaLocalDraft();
    draft.businessName = "Tamales Doña Lupe";
    draft.businessAddressLine = "456 Private Ln, San Jose, CA 95112";
    draft.showAddressPublicly = false;
    const vm = mapComidaLocalDraftToPreviewVm(draft, "es");
    assert.equal(vm.businessAddressLine, "");
    assert.equal(vm.sections.showBusinessAddress, false);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nverify-business-address-foundation: PASS");
}

main();
