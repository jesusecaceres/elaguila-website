/**
 * ASSISTED REOPEN (WAVE 2) — Servicios + Restaurantes.
 *
 * A staff "Save for Client" writes the canonical row; reopening must load THAT server row (through
 * the family's OWN row -> draft mapper), not a blank form or whatever this browser remembers, and
 * the server write path must stay custody-proven and must never take a live listing offline.
 *
 * Executes the pure pieces (bound-row mapper, assisted status rule, restaurantes row mapper) and
 * pins the wiring by source assertions.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-assisted-reopen-servicios-restaurantes-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { serviciosBoundRowToApplicationDraft } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft";
import { decideServiciosAssistedSaveStatus } from "../app/(site)/clasificados/servicios/lib/serviciosOwnerMutationPolicy";
import { restauranteRowToEditableDraft } from "../app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const failures: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const SERVICIOS_APP = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const SERVICIOS_PUBLISH = "app/api/clasificados/servicios/publish/route.ts";
const SERVICIOS_MY_LISTING = "app/api/clasificados/servicios/my-listing/route.ts";
const RESTAURANTES_APP = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const RESTAURANTES_PUBLISH = "app/api/clasificados/restaurantes/publish/route.ts";

// ---------------------------------------------------------------------------------------------
// SERVICIOS — pure execution
// ---------------------------------------------------------------------------------------------
const servicioRow: Record<string, unknown> = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "plomeria-ana",
  leonix_ad_id: "SERV-2026-000900",
  business_name: "Plomeria Ana",
  city: "Sacramento",
  listing_status: "published",
  leonix_verified: false,
  owner_user_id: "22222222-2222-4222-8222-222222222222",
  profile_json: {
    identity: { businessName: "Plomeria Ana", slug: "plomeria-ana" },
    contact: {
      showExactAddress: false,
      physicalCity: "Sacramento",
      phone: "9165550100",
    },
  },
  private_contact: { physicalStreet: "123 Private St", physicalSuite: "Suite 9" },
};

check("servicios bound row maps through the owner mapper with the canonical row id", () => {
  const out = serviciosBoundRowToApplicationDraft(servicioRow);
  assert.equal(out.editIdentity.id, servicioRow.id);
  assert.equal(out.editIdentity.slug, "plomeria-ana");
  assert.equal(out.editIdentity.status, "published");
  assert.equal(out.state.businessName, "Plomeria Ana");
  assert.equal(out.state.city, "Sacramento");
});

check("servicios bound row re-attaches the PRIVATE exact address like the owner route does", () => {
  const out = serviciosBoundRowToApplicationDraft(servicioRow);
  assert.equal(out.state.physicalStreet, "123 Private St");
  assert.equal(out.state.physicalSuite, "Suite 9");
  assert.equal(out.state.showExactAddress, false);
});

check("servicios bound row with no private_contact / no profile does not throw", () => {
  const out = serviciosBoundRowToApplicationDraft({ id: "x", slug: "s", business_name: "B", city: "C" });
  assert.equal(out.state.businessName, "B");
});

// ---------------------------------------------------------------------------------------------
// SERVICIOS — assisted status rule (a live listing must stay live on staff Save/Edit)
// ---------------------------------------------------------------------------------------------
check("assisted save of a NEW row starts as draft", () => {
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: false, existingStatus: null }), "draft");
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: false, existingStatus: "published" }), "draft");
});
check("assisted save of an EXISTING published row keeps it published", () => {
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: true, existingStatus: "published" }), "published");
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: true, existingStatus: " Published " }), "published");
});
check("assisted save keeps paused / pending_review / pending_payment / draft states as they are", () => {
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: true, existingStatus: "paused_unpublished" }), "paused_unpublished");
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: true, existingStatus: "pending_review" }), "pending_review");
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: true, existingStatus: "pending_payment" }), "pending_payment");
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: true, existingStatus: "draft" }), "draft");
});
check("assisted save of an unknown/blank existing status never becomes a public state", () => {
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: true, existingStatus: "" }), "draft");
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: true, existingStatus: "weird" }), "draft");
  assert.equal(decideServiciosAssistedSaveStatus({ hasExistingRow: true, existingStatus: null }), "draft");
});

// ---------------------------------------------------------------------------------------------
// SERVICIOS — wiring
// ---------------------------------------------------------------------------------------------
const servApp = read(SERVICIOS_APP);
check("servicios intake uses useAssistedBoundRow('servicios')", () => {
  assert.match(servApp, /useAssistedBoundRow\("servicios"\)/);
  assert.match(servApp, /from "@\/app\/lib\/sales\/useAssistedBoundRow"/);
});
check("servicios intake hydrates through its OWN mapper only when shouldHydrate, then marks hydrated", () => {
  const start = servApp.indexOf('assistedBound.status !== "ready"');
  assert.ok(start > 0, "assisted hydrate effect missing");
  const block = servApp.slice(start - 200, start + 1600);
  assert.match(block, /!assistedBound\.shouldHydrate/);
  assert.match(block, /serviciosBoundRowToApplicationDraft\(assistedBound\.bound\.row\)/);
  assert.match(block, /setState\(hydratedListing\.state\)/);
  assert.match(block, /primeServiciosExistingListingId\(boundListingId\)/);
  assert.match(block, /rememberServiciosDraftListingIdentity\(/);
  assert.match(block, /saveClasificadosServiciosApplicationResolved\(hydratedListing\.state\)/);
  assert.match(block, /assistedBound\.markHydrated\(\)/);
  assert.match(block, /editRequested \|\| !hydrated/);
});
check("servicios media rehydrate cannot overwrite a staff reopen that landed meanwhile", () => {
  assert.match(servApp, /assistedHydrationEpochRef\.current !== assistedEpoch/);
});
check("servicios owner/dashboard hydration still uses the customer bearer (unchanged)", () => {
  assert.match(servApp, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(servApp, /\/api\/clasificados\/servicios\/my-listing\?/);
});

const servPublish = read(SERVICIOS_PUBLISH);
check("servicios publish: existing-row assisted write re-proves custody and uses the shared status rule", () => {
  const marker = servPublish.indexOf("isolated from the customer owner-mutation");
  assert.ok(marker > 0, "assisted persistence branch not found");
  const branch = servPublish.slice(marker);
  assert.match(branch, /isListingLinkedToBusiness\(/);
  assert.match(branch, /decideServiciosAssistedSaveStatus\(\{ hasExistingRow: true, existingStatus \}\)/);
  assert.doesNotMatch(branch.slice(0, branch.indexOf("isAssistedPublishForClient")), /let nextStatus = "draft"/);
});
check("servicios publish: resolve-time custody re-proof + client-owned match + server-bound id wins", () => {
  assert.match(servPublish, /assistedOwnerMatches/);
  assert.match(servPublish, /assistedBoundListingId \|\|/);
  assert.match(servPublish, /resolveAssistedRowBinding\(/);
});
check("servicios publish: an already-live row keeps its original published_at on edit", () => {
  assert.match(servPublish, /existingStatus !== SERVICIOS_LISTING_STATUS_PUBLISHED/);
});
check("servicios publish: NEW assisted row still inserts as draft", () => {
  assert.match(servPublish, /const listingStatus = isAssistedSaveForClient\s*\?\s*"draft"/);
});

const servMy = read(SERVICIOS_MY_LISTING);
check("servicios my-listing assisted branch accepts owner-null OR the context's client, plus ledger link", () => {
  assert.match(servMy, /assistedContext!\.clientUserId/);
  assert.match(servMy, /ownerMatchesCustody/);
  assert.match(servMy, /isListingLinkedToBusiness\(/);
  assert.doesNotMatch(servMy, /rec\.owner_user_id == null &&\s*\r?\n\s*typeof rec\.id === "string"/);
});
check("servicios my-listing customer bearer path is unchanged (owner scoped)", () => {
  assert.match(servMy, /if \(ownerAuthUserId\) query = query\.eq\("owner_user_id", ownerAuthUserId\)/);
});

// ---------------------------------------------------------------------------------------------
// RESTAURANTES — pure execution
// ---------------------------------------------------------------------------------------------
check("restaurantes row -> draft uses listing_json and the row's draft_listing_id as the draft key", () => {
  const draft = restauranteRowToEditableDraft({
    draft_listing_id: "  draft-abc-123 ",
    listing_json: { businessName: "Taqueria Sol", cityCanonical: "Fresno", draftListingId: "stale-json-id" },
  });
  assert.ok(draft);
  assert.equal(draft!.businessName, "Taqueria Sol");
  assert.equal(draft!.cityCanonical, "Fresno");
  assert.equal(draft!.draftListingId, "draft-abc-123");
});
check("restaurantes row without a draft_listing_id column falls back to the JSON's own id", () => {
  const draft = restauranteRowToEditableDraft({
    draft_listing_id: null,
    listing_json: { businessName: "Taqueria Sol", draftListingId: "json-id-7" },
  });
  assert.equal(draft?.draftListingId, "json-id-7");
});
check("restaurantes row with no listing_json hydrates nothing (never a blank overwrite)", () => {
  assert.equal(restauranteRowToEditableDraft({ draft_listing_id: "x", listing_json: null }), null);
  assert.equal(restauranteRowToEditableDraft({ draft_listing_id: "x" }), null);
});

// ---------------------------------------------------------------------------------------------
// RESTAURANTES — wiring
// ---------------------------------------------------------------------------------------------
const restApp = read(RESTAURANTES_APP);
check("restaurantes intake uses useAssistedBoundRow('restaurantes') with its own row mapper", () => {
  assert.match(restApp, /useAssistedBoundRow\("restaurantes"\)/);
  assert.match(restApp, /restauranteRowToEditableDraft\(assistedBound\.bound\.row\)/);
});
check("restaurantes intake hydrates only when shouldHydrate, replaces the persisted draft, marks hydrated", () => {
  const start = restApp.indexOf('assistedBound.status !== "ready"');
  assert.ok(start > 0);
  const block = restApp.slice(start - 200, start + 700);
  assert.match(block, /!assistedBound\.shouldHydrate/);
  assert.match(block, /replaceDraft\(boundDraft\)/);
  assert.match(block, /assistedBound\.markHydrated\(\)/);
  assert.match(block, /!hydrated \|\| isExistingDashboardListingMode/);
});
check("restaurantes owner dashboard-edit modes are not touched by the assisted hydrate", () => {
  assert.match(restApp, /isExistingDashboardListingMode/);
  assert.match(restApp, /<AssistedSaveForClientBar/);
});

const restPublish = read(RESTAURANTES_PUBLISH);
check("restaurantes publish: existing-row assisted write proves custody + owner, and bound id must equal the resolved row", () => {
  assert.match(restPublish, /isAssistedRequest && existingByDraft\?\.id/);
  assert.match(restPublish, /isListingLinkedToBusiness\(/);
  assert.match(restPublish, /assistedExistingOwnerOk/);
  assert.match(restPublish, /resolvedByDraft !== assistedBoundListingId/);
  assert.match(restPublish, /assisted_listing_mismatch/);
});
check("restaurantes publish: existing row keeps its status (assisted save never publishes)", () => {
  assert.match(restPublish, /resolveRestauranteOwnerEditTargetStatus\(ex\.status\)/);
  assert.match(restPublish, /isAssistedSaveForClient \|\| pendingPayment/);
});

if (failures.length) {
  console.error(`FAIL — ${failures.length}/${checks} checks failed`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log(`PASS — ${checks}/${checks} checks`);
