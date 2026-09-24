/**
 * WAVE 2 — STAFF SAVE / REOPEN / EDIT: AUTOS (Dealer + Privado).
 *
 * Pins that a Leonix staff session reopening the listing it saved for a client loads the SERVER row
 * into the intake (through the family's OWN row -> draft normalization), only when the hook says to
 * hydrate, marks it hydrated so Preview -> Edit never overwrites edits, and that the server write
 * paths re-prove custody and scope by the stored row's owner.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-assisted-reopen-autos-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import {
  assistedBoundRowToDealerDraft,
  assistedBoundRowToPrivadoListing,
} from "../app/(site)/publicar/autos/shared/lib/autosAssistedBoundRowMappers";
import { resolveAssistedAutosWriteOwner } from "../app/lib/sales/assistedAutosRowOwner";

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
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const DEALER = "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx";
const PRIVADO = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";
const MAPPERS = "app/(site)/publicar/autos/shared/lib/autosAssistedBoundRowMappers.ts";
const CUSTODY = "app/lib/clasificados/autos/assistedAutosRowCustody.ts";
const LISTINGS = "app/api/clasificados/autos/listings/route.ts";
const LISTING_ID = "app/api/clasificados/autos/listings/[id]/route.ts";
const ASSISTED_PUBLISH = "app/api/clasificados/autos/assisted-publish/route.ts";

/* ---------------------------------------------------------------- intake wiring (both families) */
for (const [label, file, category, mapper] of [
  ["Dealer", DEALER, "autos", "assistedBoundRowToDealerDraft"],
  ["Privado", PRIVADO, "autos-privado", "assistedBoundRowToPrivadoListing"],
] as const) {
  const src = raw(file);
  check(`${label}: intake uses useAssistedBoundRow("${category}")`, () => {
    assert.ok(src.includes(`useAssistedBoundRow("${category}")`));
    assert.ok(src.includes('from "@/app/lib/sales/useAssistedBoundRow"'));
  });
  check(`${label}: intake runs the family's own mapper over the bound row`, () => {
    assert.ok(src.includes(`${mapper}(assistedRow.row`));
    assert.ok(src.includes("autosAssistedBoundRowMappers"));
  });
  check(`${label}: hydrates only when the hook says shouldHydrate and the draft store is ready`, () => {
    assert.ok(/assistedStatus === "ready" && assistedShouldHydrate/.test(src));
    assert.ok(/if \(!assistedHydrationPending \|\| !hydrated \|\| !assistedRow\) return;/.test(src));
    assert.ok(src.includes("assistedHydrateStartedRef"));
  });
  check(`${label}: marks hydrated (also when the write throws) so Preview -> Edit never re-overwrites`, () => {
    assert.ok(/finally \{\s*markAssistedHydrated\(\);/.test(src));
  });
  check(`${label}: writes the same draft store Preview reads (flushDraft) and skips the owner dashboard modes`, () => {
    const start = src.indexOf("ASSISTED REOPEN");
    assert.ok(start > 0);
    const block = src.slice(start, start + 2600);
    assert.ok(block.includes("await flushDraft({"));
    assert.ok(/listing: mapped/.test(block));
    assert.ok(/!isExisting(Dashboard)?ListingMode|!isDashboardListingEditMode/.test(block));
  });
  check(`${label}: no fetch / no second mapper in the intake (hook + shared mapper only)`, () => {
    const start = src.indexOf("ASSISTED REOPEN");
    const block = src.slice(start, start + 2600);
    assert.ok(!/fetch\(/.test(block));
    assert.ok(!/normalizeLoadedListing\(/.test(block));
  });
}
check("Dealer: also skipped in inventory-add mode; resets drawer/in-progress state; keeps parent+child invariant", () => {
  const src = raw(DEALER);
  assert.ok(/!inventoryAddMode && assistedStatus === "ready"/.test(src));
  assert.ok(src.includes("updateInProgressInventoryVehicleDraft(null)"));
  assert.ok(src.includes("setInventoryDrawerOpen(false, null)"));
  assert.ok(src.includes("additionalInventoryVehicles: mapped.additionalInventoryVehicles"));
});
check("Customers unchanged: loading gate only holds while a staff bound row is pending", () => {
  for (const file of [DEALER, PRIVADO]) {
    const src = raw(file);
    assert.ok(/assistedHydrationPending/.test(src));
    assert.ok(/!hydrated \|\|\s*assistedHydrationPending/.test(src.replace(/\n\s*/g, " ")) || /!hydrated \|\| assistedHydrationPending/.test(src));
  }
});

/* ---------------------------------------------------------------- mapper execution */
const dealerPayload = {
  dealerName: "Reopen Motors",
  make: "Honda",
  model: "Civic",
  year: 2021,
  vin: "1HGBH41JXMN109186",
  vehicleTitle: "2021 Honda Civic",
  price: 18500,
  city: "Phoenix",
  state: "AZ",
};
check("mapper: dealer parent row -> normalized dealer draft (same normalization as dashboard edit)", () => {
  const mapped = assistedBoundRowToDealerDraft({ lane: "negocios", inventory_role: "main", listing_payload: dealerPayload }, []);
  assert.ok(mapped);
  assert.equal(mapped!.listing.make, "Honda");
  assert.equal(mapped!.listing.model, "Civic");
  assert.equal(mapped!.vehicleTitleOverride, true);
  assert.ok(Array.isArray(mapped!.additionalInventoryVehicles));
});
check("mapper: vehicle child only backfills vehicle identity when the parent has none (never a duplicate additional vehicle)", () => {
  const parentOnly = { dealerName: "Reopen Motors", city: "Phoenix", state: "AZ" };
  const mapped = assistedBoundRowToDealerDraft(
    { lane: "negocios", inventory_role: "main", listing_payload: parentOnly },
    [{ listing_payload: dealerPayload }],
  );
  assert.ok(mapped);
  assert.equal(mapped!.listing.make, "Honda");
  assert.equal(mapped!.additionalInventoryVehicles.length, 0);
  const full = assistedBoundRowToDealerDraft(
    { lane: "negocios", inventory_role: "main", listing_payload: dealerPayload },
    [{ listing_payload: { ...dealerPayload, make: "Toyota" } }],
  );
  assert.equal(full!.listing.make, "Honda", "parent payload stays the base when it already carries the vehicle");
});
check("mapper: refuses wrong lane, inventory child as parent, missing payload", () => {
  assert.equal(assistedBoundRowToDealerDraft({ lane: "privado", listing_payload: dealerPayload }, []), null);
  assert.equal(
    assistedBoundRowToDealerDraft({ lane: "negocios", inventory_role: "inventory_vehicle", listing_payload: dealerPayload }, []),
    null,
  );
  assert.equal(assistedBoundRowToDealerDraft({ lane: "negocios" }, []), null);
  assert.equal(assistedBoundRowToDealerDraft(null, []), null);
  assert.equal(assistedBoundRowToPrivadoListing({ lane: "negocios", listing_payload: dealerPayload }), null);
  assert.equal(assistedBoundRowToPrivadoListing({ lane: "privado" }), null);
});
check("mapper: privado row -> privado listing (autosLane forced to privado, payload preserved)", () => {
  const listing = assistedBoundRowToPrivadoListing({ lane: "privado", listing_payload: { make: "Ford", model: "F-150", year: 2018 } });
  assert.ok(listing);
  assert.equal(listing!.autosLane, "privado");
  assert.equal(listing!.make, "Ford");
});
check("mapper source: no fetch, no storage, no server-only, no id invented", () => {
  const src = raw(MAPPERS).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/fetch\(|localStorage|sessionStorage|server-only/.test(src));
});

/* ---------------------------------------------------------------- owner scope (pure execution) */
check("owner scope: owner-null row stays on the owner-null path even when a client is named (attribution only)", () => {
  const r = resolveAssistedAutosWriteOwner({ rowOwnerUserId: null, requestClientUserId: "client-1" });
  assert.deepEqual(r, { ok: true, ownerUserId: null, source: "row_owner_null" });
});
check("owner scope: client-owned row is written as its own owner, with or without the client named", () => {
  assert.deepEqual(resolveAssistedAutosWriteOwner({ rowOwnerUserId: "client-1", requestClientUserId: null }), {
    ok: true,
    ownerUserId: "client-1",
    source: "row_owner",
  });
  assert.equal(resolveAssistedAutosWriteOwner({ rowOwnerUserId: "client-1", requestClientUserId: "client-1" }).ok, true);
});
check("owner scope: a different client than the stored owner is refused, never reassigned", () => {
  const r = resolveAssistedAutosWriteOwner({ rowOwnerUserId: "client-1", requestClientUserId: "client-2" });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.error, "assisted_client_mismatch");
    assert.equal(r.status, 409);
  }
});

/* ---------------------------------------------------------------- server custody re-proof */
check("custody helper re-proves the ledger, lane, dealer parent role, and stored-owner membership", () => {
  const src = raw(CUSTODY);
  assert.ok(src.includes("isListingLinkedToBusiness"));
  assert.ok(src.includes('listingSource: "autos_classifieds_listings"'));
  assert.ok(src.includes("listing_not_linked_to_business"));
  assert.ok(src.includes("assisted_listing_lane_mismatch"));
  assert.ok(src.includes('"inventory_vehicle"'));
  assert.ok(src.includes("isClientAuthorizedForBusiness"));
  assert.ok(src.includes("resolveAssistedAutosWriteOwner"));
  assert.ok(src.includes("dealer_inventory_parent_listing_id !== input.parentListingId"));
});
check("Privado POST update branch proves custody before updateAutosClassifiedsListingDraft", () => {
  const src = raw(LISTINGS);
  const proof = src.indexOf("proveAssistedAutosRowForWrite({");
  const update = src.indexOf("updateAutosClassifiedsListingDraft(assisted.listingId");
  assert.ok(proof > 0 && update > proof, "custody proof must precede the update");
  assert.ok(src.includes('expectedLane: "privado"'));
  assert.ok(src.includes("proof.ownerUserId"));
});
check("Privado PATCH [id] proves custody for the assisted branch and scopes by the stored owner", () => {
  const src = raw(LISTING_ID);
  const proof = src.indexOf("proveAssistedAutosRowForWrite({");
  const update = src.indexOf("await updateAutosClassifiedsListingDraft(id, ownerForUpdate");
  assert.ok(proof > 0 && update > proof);
  assert.ok(src.includes('expectedLane: "privado"'));
  assert.ok(src.includes("ownerForUpdate = proof.ownerUserId"));
  assert.ok(!/assisted\.assisted \? assisted\.clientUserId : userId/.test(src), "raw client id must no longer scope the write");
  assert.ok(src.includes("assisted_listing_mismatch"), "bound-id disagreement stays a refusal");
});
check("Dealer assisted-publish keeps its custody re-proof and adds stored-owner scoping + child proof", () => {
  const src = raw(ASSISTED_PUBLISH);
  assert.ok(src.includes("isListingLinkedToBusiness"));
  assert.ok(src.includes("proveAssistedAutosRowForWrite"));
  assert.ok(src.includes('expectedLane: "negocios"'));
  assert.ok(src.includes("resolveAssistedDealerChildWriteOwner"));
  assert.ok(src.includes("updateAutosClassifiedsListingDraft(mainListingId, writeOwnerUserId"));
  assert.ok(src.includes("updateAutosClassifiedsListingDraft(existingChildId, childProof.ownerUserId"));
  assert.ok(src.includes("createAutosClassifiedsListingWithInventoryParent({\n        ownerUserId: writeOwnerUserId"));
});
check("Dealer parent/child invariant: one child per parent, repeat saves update the same rows", () => {
  const src = raw(ASSISTED_PUBLISH);
  assert.ok(src.includes("findExistingAssistedVehicleChildId(mainListingId)"));
  assert.ok(src.includes('.eq("inventory_role", "inventory_vehicle")'));
  assert.ok(src.includes('.order("created_at", { ascending: true })'));
  assert.ok(src.includes("resolveAssistedRowBinding({"));
});
check("no migration added by this gate", () => {
  const names = readdirSync(new URL("../supabase/migrations", import.meta.url));
  assert.ok(!names.some((n) => /assisted[-_]?reopen[-_]?autos/i.test(n)));
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-assisted-reopen-autos-01: PASS");
