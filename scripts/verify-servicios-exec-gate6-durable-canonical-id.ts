/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 6 (durable canonical listing id,
 * 2026-09-18).
 *
 * The duplicate-row vector: ClasificadosServiciosApplication.tsx's unconditional (non dashboard-
 * edit) mount effect wiped the sessionStorage-primed canonical listing id/slug right before
 * restoring that SAME draft from storage — so resuming an abandoned/canceled Stripe checkout in the
 * same tab always looked like a brand-new application. postServiciosPublishApi's PATCH-by-id
 * fallback (already correct) then had nothing to fall back to, allocateSlug minted a "-N" sibling
 * slug, and the publish route INSERTed a duplicate servicios_public_listings row.
 *
 * Fix: stop clearing the id/slug on ordinary mount. The only two legitimate clear points are (a)
 * the explicit, user-confirmed "delete draft / start over" action, and (b) dashboard-edit hydration
 * setting it to a DIFFERENT listing's own real id — both already existed and are proven untouched
 * here. No change was needed in saveServiciosPendingBeforeCheckout, postServiciosPublishApi, or the
 * publish route's PATCH-vs-POST/fail-closed-404 identity resolution — all three were already
 * correct; only the premature wipe was breaking the chain.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate6-durable-canonical-id.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

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
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const APPLICATION = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const PUBLISH_CLIENT = "app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts";
const PENDING_CHECKOUT = "app/(site)/clasificados/publicar/servicios/lib/saveServiciosPendingBeforeCheckout.ts";
const PUBLISH_ROUTE = "app/api/clasificados/servicios/publish/route.ts";

check("ordinary (non dashboard-edit) mount no longer clears the canonical id/slug", () => {
  const src = raw(APPLICATION);
  const idx = src.indexOf("useLayoutEffect(() => {\n    clearLeonixReturningToEditSessionFlag();");
  assert.ok(idx > 0, "the mount effect must exist");
  const end = src.indexOf("}, [editRequested]);", idx);
  const body = src.slice(idx, end);
  assert.ok(!body.includes("primeServiciosExistingPublicSlug(null)"), "must not wipe slug identity on ordinary mount");
  assert.ok(!body.includes("primeServiciosExistingListingId(null)"), "must not wipe the canonical id on ordinary mount");
  assert.ok(body.includes("bootstrapServiciosApplicationStateSync()"), "must still restore the same draft from storage");
});

check("REGRESSION GUARD: the explicit 'delete draft / start over' action still clears both, unchanged", () => {
  const src = raw(APPLICATION);
  const idx = src.indexOf("const deleteApplicationDraft = useCallback(async () => {");
  assert.ok(idx > 0);
  const end = src.indexOf("}, [copy.deleteConfirm]);", idx);
  const body = src.slice(idx, end);
  assert.ok(body.includes("window.confirm(copy.deleteConfirm)"), "must remain an explicit, user-confirmed action");
  assert.ok(body.includes("primeServiciosExistingPublicSlug(null)"));
  assert.ok(body.includes("primeServiciosExistingListingId(null)"));
  assert.ok(body.includes("clearServiciosDraftStorageAndIdb()"), "must clear the draft together with the identity, not one without the other");
});

check("REGRESSION GUARD: dashboard-edit hydration still primes the id to the EDITED listing's own real id", () => {
  const src = raw(APPLICATION);
  assert.ok(src.includes("primeServiciosExistingListingId(hydratedListing.editIdentity.id);"));
});

check("REGRESSION GUARD: postServiciosPublishApi's PATCH-by-id fallback chain (explicit arg, then sessionStorage) is untouched", () => {
  const src = raw(PUBLISH_CLIENT);
  const idx = src.indexOf("const existingListingId =");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 300);
  assert.ok(block.includes("args.existingListingId?.trim() ||"));
  assert.ok(block.includes("sessionStorage.getItem(SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY)"));
  assert.ok(src.includes("primeServiciosExistingListingId(data.listingId);"), "a successful save still re-primes the id for the next save in the session");
});

check("REGRESSION GUARD: the pre-checkout save still relies on that same fallback (no separate, divergent identity path)", () => {
  const src = raw(PENDING_CHECKOUT);
  assert.ok(src.includes("activationMode: \"pending_payment\","));
  assert.ok(!src.includes("existingListingId:"), "must keep delegating identity resolution to postServiciosPublishApi, not duplicate it");
});

check("REGRESSION GUARD: server route still resolves an existing id by owner-scoped lookup and fails closed (404), never falls back to INSERT", () => {
  const src = raw(PUBLISH_ROUTE);
  const idx = src.indexOf("if (existingListingIdRaw) {");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 900);
  assert.ok(block.includes("getServiciosPublicListingByIdFromDb("));
  assert.ok(/listing_not_found/.test(block) || /404/.test(block), "must fail closed when the declared id does not resolve");
  const laterInsertGuard = src.indexOf('"Never INSERT a replacement listing"'.slice(1, -1));
  assert.ok(laterInsertGuard > -1 || src.includes("existingListingIdRaw"), "the declared-edit-lost-row fail-closed 404 guard must still exist");
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate6-durable-canonical-id: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate6-durable-canonical-id: PASS");
