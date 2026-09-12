/**
 * Gate SERVICIOS-P7-BLOCKER-REPAIR-01 — Repair C (SERVICIOS-ADDRESS-PRIVACY-1) regression proof.
 *
 * B5: "hide my exact address" was honoured only while rendering; the street stayed in the public
 * `profile_json`, and the table's only read policy was USING (true) for every role — so non-published
 * rows, internal moderation fields, owner ids and hidden streets were all readable with the public
 * anon key.
 *
 * Execution-first: the split/merge the routes call and the REAL render-time privacy gate
 * (`resolveBusinessAddressPublicView`) are executed. Source assertions then prove the publish route
 * persists only the public split, the owner API restores the private part, and the migration's
 * row/column contract covers exactly what the real browser readers query.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-address-privacy.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  mergeServiciosPrivateAddressForOwner,
  SERVICIOS_PRIVATE_EXACT_ADDRESS_KEYS,
  serviciosExactAddressIsHidden,
  splitServiciosAddressForPersistence,
} from "../app/(site)/clasificados/servicios/lib/serviciosAddressPrivacy";
import { resolveBusinessAddressPublicView } from "../app/lib/businessAddress/businessAddressPrivacy";
import type { ServiciosBusinessProfile } from "../app/(site)/servicios/types/serviciosBusinessProfile";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const src = (rel: string) => stripComments(raw(rel));
/** SQL: strip `--` comments so prose can never satisfy an assertion. */
const sql = (rel: string) => raw(rel).replace(/--[^\n]*/g, "");

const STREET = "1234 Calle Privada Ave";
const SUITE = "Suite 9";
const PLACE_ID = "ChIJFAKE-private-place-id";

function profile(showExactAddress: boolean | undefined): ServiciosBusinessProfile {
  return {
    identity: { businessName: "Plomería QA", slug: "plomeria-qa" },
    contact: {
      phone: "+14085550100",
      physicalStreet: STREET,
      physicalSuite: SUITE,
      physicalCity: "San José",
      physicalRegion: "CA",
      physicalCountry: "US",
      physicalPostalCode: "95112",
      physicalVerificationStatus: "provider_verified",
      physicalProvider: "google",
      physicalProviderPlaceId: PLACE_ID,
      ...(showExactAddress === undefined ? {} : { showExactAddress }),
    },
  } as unknown as ServiciosBusinessProfile;
}
const contactOf = (p: ServiciosBusinessProfile | null) => (p?.contact ?? {}) as Record<string, unknown>;

// =====================================================================================
// 1. The public / private split (executed)
// =====================================================================================

check("SHOWN: showExactAddress=true keeps the exact address public, nothing private", () => {
  const { publicProfile, privateContact } = splitServiciosAddressForPersistence(profile(true));
  assert.equal(contactOf(publicProfile).physicalStreet, STREET);
  assert.equal(privateContact, null);
});
check("SHOWN BY DEFAULT: an absent choice means shown (the resolver's own `?? true`)", () => {
  assert.equal(serviciosExactAddressIsHidden(profile(undefined)), false);
  assert.equal(splitServiciosAddressForPersistence(profile(undefined)).privateContact, null);
});
check("HIDDEN: street, suite and Google place id leave the public profile", () => {
  const c = contactOf(splitServiciosAddressForPersistence(profile(false)).publicProfile);
  for (const key of SERVICIOS_PRIVATE_EXACT_ADDRESS_KEYS) assert.ok(!(key in c), `${key} must not be public`);
});
check("HIDDEN: not one exact-location value survives ANYWHERE in the serialized public profile", () => {
  const json = JSON.stringify(splitServiciosAddressForPersistence(profile(false)).publicProfile);
  for (const secret of [STREET, SUITE, PLACE_ID]) assert.ok(!json.includes(secret), `"${secret}" leaked into public JSON`);
});
check("HIDDEN: the area presentation stays public (city / region / country / postal code / choice)", () => {
  const c = contactOf(splitServiciosAddressForPersistence(profile(false)).publicProfile);
  assert.equal(c.physicalCity, "San José");
  assert.equal(c.physicalRegion, "CA");
  assert.equal(c.physicalCountry, "US");
  assert.equal(c.physicalPostalCode, "95112");
  assert.equal(c.showExactAddress, false);
  assert.equal(c.phone, "+14085550100", "unrelated contact fields are untouched");
});
check("HIDDEN: the private record holds exactly the exact-location fields", () => {
  assert.deepEqual(splitServiciosAddressForPersistence(profile(false)).privateContact, {
    physicalStreet: STREET,
    physicalSuite: SUITE,
    physicalProviderPlaceId: PLACE_ID,
  });
});
check("HIDDEN with no street at all → no private record", () => {
  const p = profile(false);
  const c = contactOf(p);
  delete c.physicalStreet;
  delete c.physicalSuite;
  delete c.physicalProviderPlaceId;
  assert.equal(splitServiciosAddressForPersistence(p).privateContact, null);
});
check("the split never mutates the caller's profile", () => {
  const p = profile(false);
  splitServiciosAddressForPersistence(p);
  assert.equal(contactOf(p).physicalStreet, STREET);
});

// =====================================================================================
// 2. Owner edit hydration round trip (executed)
// =====================================================================================

check("ROUND TRIP: split → owner merge restores the exact address the owner entered", () => {
  const { publicProfile, privateContact } = splitServiciosAddressForPersistence(profile(false));
  const restored = contactOf(mergeServiciosPrivateAddressForOwner(publicProfile, privateContact));
  assert.equal(restored.physicalStreet, STREET);
  assert.equal(restored.physicalSuite, SUITE);
  assert.equal(restored.physicalProviderPlaceId, PLACE_ID);
  assert.equal(restored.physicalCity, "San José");
});
check("ROUND TRIP: a re-save of the restored profile is split identically (stable across republish)", () => {
  const first = splitServiciosAddressForPersistence(profile(false));
  const hydrated = mergeServiciosPrivateAddressForOwner(first.publicProfile, first.privateContact)!;
  const second = splitServiciosAddressForPersistence(hydrated);
  assert.deepEqual(second.privateContact, first.privateContact);
  assert.deepEqual(second.publicProfile, first.publicProfile);
});
check("STALE PRIVATE COPY IS INERT once the owner shows the address again", () => {
  const shown = profile(true);
  const merged = mergeServiciosPrivateAddressForOwner(shown, { physicalStreet: "OLD STREET" });
  assert.equal(contactOf(merged).physicalStreet, STREET, "the public truth wins; an older private copy is ignored");
});
check("owner merge ignores missing / malformed private data", () => {
  const hidden = splitServiciosAddressForPersistence(profile(false)).publicProfile;
  for (const junk of [null, undefined, "x", 42, { physicalStreet: "" }, { unrelated: "y" }]) {
    assert.deepEqual(mergeServiciosPrivateAddressForOwner(hidden, junk), hidden);
  }
});

// =====================================================================================
// 3. The public detail looks exactly the same — only the exposure changed (REAL privacy gate)
// =====================================================================================

check("PUBLIC VIEW: a hidden address shows no exact line and allows no directions — before AND after stripping", () => {
  const before = resolveBusinessAddressPublicView({
    address: { street: STREET, city: "San José", region: "CA", country: "US", postalCode: "95112" } as never,
    showExactAddress: false,
    cityOrServiceArea: "",
  });
  const after = resolveBusinessAddressPublicView({ address: null, showExactAddress: false, cityOrServiceArea: "" });
  for (const view of [before, after]) {
    assert.equal(view.exactAddressLine, undefined);
    assert.equal(view.directionsAllowed, false);
    assert.equal(view.showExactAddress, false);
  }
});
check("PUBLIC VIEW: a shown address still renders the exact line with directions", () => {
  const view = resolveBusinessAddressPublicView({
    address: { street: STREET, city: "San José", region: "CA", country: "US", postalCode: "95112" } as never,
    showExactAddress: true,
    cityOrServiceArea: "",
  });
  assert.equal(view.directionsAllowed, true);
  assert.ok(view.exactAddressLine?.includes(STREET));
});
check("no Servicios render reads `hasPrivateAddress` (the only field stripping changes)", () => {
  for (const rel of [
    "app/(site)/servicios/lib/resolveServiciosProfile.ts",
    "app/(site)/servicios/components/ServiciosProfileView.tsx",
    "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx",
    "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx",
  ]) {
    assert.ok(!/hasPrivateAddress/.test(src(rel)), `${rel} must not depend on hasPrivateAddress`);
  }
});

// =====================================================================================
// 4. Routes persist / restore through the split
// =====================================================================================

const PUBLISH = src("app/api/clasificados/servicios/publish/route.ts");
const MY_LISTING = src("app/api/clasificados/servicios/my-listing/route.ts");

check("PUBLISH: both insert and update persist only the public split", () => {
  assert.ok(!/profile_json:\s*wire\b/.test(PUBLISH), "the raw wire (with a hidden street) must never be persisted");
  assert.equal((PUBLISH.match(/profile_json:\s*publicWireForPersistence/g) ?? []).length, 2);
});
check("PUBLISH: private_contact is written only for a hidden-address save", () => {
  assert.match(PUBLISH, /const privateContactPatch = serviciosExactAddressIsHidden\(wire\) \? \{ private_contact: privateContactForPersistence \} : \{\};/);
  assert.equal((PUBLISH.match(/\.\.\.privateContactPatch/g) ?? []).length, 2);
});
check("OWNER API: restores the private address only for the verified owner, only when hidden", () => {
  assert.match(MY_LISTING, /if \(serviciosExactAddressIsHidden\(ownerProfile\) && typeof rec\.id === "string"\)/);
  assert.match(MY_LISTING, /\.select\("private_contact"\)[\s\S]*?\.eq\("owner_user_id", data\.user\.id\)/);
  assert.match(MY_LISTING, /profile_json: ownerProfile,/);
});
check("PUBLIC READERS never select private_contact", () => {
  const selectConst = src("app/(site)/clasificados/servicios/lib/serviciosPublicListingSort.ts");
  assert.ok(!/private_contact/.test(selectConst));
  assert.ok(!/private_contact/.test(src("app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts")));
  assert.ok(!/private_contact/.test(src("app/lib/savedListingsDashboardResolve.ts")));
});

// =====================================================================================
// 5. Migration contract — rows and columns
// =====================================================================================

const MIG = sql("supabase/migrations/20260910210000_servicios_public_listings_read_privacy.sql");
function grantedColumns(role: "anon" | "authenticated"): string[] {
  const m = MIG.match(new RegExp(`GRANT SELECT \\(([^)]*)\\) ON public\\.servicios_public_listings TO ${role};`));
  assert.ok(m, `GRANT for ${role} must exist`);
  return m![1].split(",").map((c) => c.trim()).filter(Boolean);
}

check("MIGRATION: the USING (true) all-roles policy is dropped", () => {
  assert.match(MIG, /DROP POLICY IF EXISTS servicios_public_listings_select_public ON public\.servicios_public_listings;/);
  assert.ok(!/USING \(true\)/i.test(MIG));
});
check("MIGRATION: anon/authenticated see only published rows", () => {
  assert.match(MIG, /CREATE POLICY servicios_public_listings_select_published[\s\S]*?FOR SELECT TO anon, authenticated\s*USING \(listing_status = 'published'\);/);
});
check("MIGRATION: an owner also sees their own rows (dashboard reads pending/paused directly)", () => {
  assert.match(MIG, /CREATE POLICY servicios_public_listings_select_own[\s\S]*?FOR SELECT TO authenticated\s*USING \(owner_user_id = auth\.uid\(\)\);/);
});
check("MIGRATION: table-level SELECT is revoked before column grants", () => {
  const idxRevoke = MIG.indexOf("REVOKE SELECT ON public.servicios_public_listings FROM anon, authenticated;");
  const idxGrant = MIG.indexOf("GRANT SELECT (");
  assert.ok(idxRevoke > 0 && idxGrant > idxRevoke);
});
check("MIGRATION: neither role may read private, moderation or audit columns", () => {
  const forbidden = ["private_contact", "moderation_notes", "suspended_reason", "last_republished_by", "last_republished_source", "republish_count", "republish_override", "republish_override_reason"];
  for (const role of ["anon", "authenticated"] as const) {
    const cols = grantedColumns(role);
    for (const f of forbidden) assert.ok(!cols.includes(f), `${role} must not be granted ${f}`);
  }
});
check("MIGRATION: owner identifiers are NOT in the anon (public) contract", () => {
  assert.ok(!grantedColumns("anon").includes("owner_user_id"));
});
check("MIGRATION: the real browser readers stay inside the authenticated grant", () => {
  const cols = new Set(grantedColumns("authenticated"));
  // Guardados (savedListingsDashboardResolve) — selects + filters
  for (const c of ["slug", "leonix_ad_id", "business_name", "city", "profile_json", "id"]) assert.ok(cols.has(c), `Guardados needs ${c}`);
  // ownerEngagementListingKeys — selects + filters
  for (const c of ["id", "slug", "leonix_ad_id", "owner_user_id", "listing_status"]) assert.ok(cols.has(c), `owner dashboard needs ${c}`);
});
check("MIGRATION: those readers really do select only these columns (so no `select=*` will break)", () => {
  const guardados = src("app/lib/savedListingsDashboardResolve.ts");
  const guardadosSelects = [...guardados.matchAll(/from\("servicios_public_listings"\)\s*\.select\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(guardadosSelects.length >= 3);
  const cols = new Set(grantedColumns("authenticated"));
  for (const list of guardadosSelects) for (const c of list.split(",").map((x) => x.trim())) assert.ok(cols.has(c), `Guardados selects ${c}`);
  const ownerKeys = src("app/lib/ownerEngagementListingKeys.ts");
  assert.match(ownerKeys, /from\("servicios_public_listings"\)\.select\("id, slug, leonix_ad_id"\)/);
});
check("MIGRATION: forward-only and re-runnable (no DROP TABLE / DROP COLUMN / DELETE)", () => {
  assert.ok(!/DROP\s+TABLE|DROP\s+COLUMN|DELETE\s+FROM|TRUNCATE/i.test(MIG));
  assert.match(MIG, /ADD COLUMN IF NOT EXISTS private_contact jsonb;/);
});
check("MIGRATION: the backfill moves hidden exact-address data out of profile_json idempotently", () => {
  assert.match(MIG, /WHERE \(profile_json -> 'contact' ->> 'showExactAddress'\) = 'false'/);
  assert.match(MIG, /\?\| ARRAY\['physicalStreet', 'physicalSuite', 'physicalProviderPlaceId'\]/);
  assert.match(MIG, /- 'physicalStreet' - 'physicalSuite' - 'physicalProviderPlaceId'/);
});
check("MIGRATION: the private key set matches the application's", () => {
  for (const key of SERVICIOS_PRIVATE_EXACT_ADDRESS_KEYS) assert.ok(MIG.includes(`'${key}'`), `migration must handle ${key}`);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-servicios-address-privacy: PASS");
