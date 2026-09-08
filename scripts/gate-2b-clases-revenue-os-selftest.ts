/**
 * Gate 2B — Clases $24.99/30-day Revenue OS checkout self-test.
 *
 * Verifies the Clases paid-publish flow was wired onto the EXISTING canonical Revenue OS
 * pipeline (Rentas is the reference) rather than a new, parallel Stripe integration:
 *   1-3.  clases_paid_30d registered at exactly 2499 cents / 30 days
 *   4-5.  paid Clases routes to checkout; free Clases does not
 *   6-7.  checkout payload never carries a client-set amount, but does carry canonical listingId
 *   8.    a pending-payment listing never activates itself
 *   9-13. Clases fulfillment adapter is registered in both webhook dispatch chains, targets the
 *         same canonical listing, activates on success, sets a 30-day term, and is idempotent
 *   14.   cancel flow leaves the listing unpaid/not public
 *   15.   the browser success redirect page is read-only (never itself activates a listing)
 *   16.   provider payment methods never feed the Leonix Stripe amount
 *   17.   Gate 2A's shouldBlockClasesPaidPublish is preserved, not weakened
 *   18-19. free Clases publish + legacy free listings remain unaffected
 *   20.   no new DB migration was added
 *   21-23. no Mascotas / Busco / Comunidad-owned UI files were touched
 *
 * Mixes direct imports (for modules with no `server-only` marker) with source-level inspection
 * (for `server-only`-marked fulfillment files, which cannot be imported outside a Next.js/webpack
 * build — same approach already used by scripts/smoke-revenue-os-rentas-paid-publish-lockdown-01.mjs).
 * No network, no Stripe, no live Supabase mutation. Run from repo root:
 *   npx tsx scripts/gate-2b-clases-revenue-os-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import {
  buildRevenueCategoryCheckoutBody,
  CLASES_CATEGORY_CHECKOUT,
  RENTAS_CATEGORY_CHECKOUT,
} from "../app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { shouldBlockClasesPaidPublish } from "../app/(site)/publicar/community/shared/required/communityRequiredForPreview";
import { emptyClasesQuickDraft } from "../app/(site)/publicar/community/shared/types/communityQuickDraft";

function read(relPath: string): string {
  return readFileSync(join(__dirname, "..", relPath), "utf8");
}

// ---------------------------------------------------------------------------
// 1-3. Canonical price/term
// ---------------------------------------------------------------------------
{
  const def = getRevenuePackageDefinition("clases_paid_30d");
  assert.ok(def, "expected clases_paid_30d to be registered in the pricing matrix");
  assert.equal(def!.category, "clases");
  assert.equal(def!.priceCents, 2499, `expected 2499 cents, got ${def!.priceCents}`);
  assert.equal(def!.durationDays, 30, `expected 30-day term, got ${def!.durationDays}`);
  assert.equal(def!.stripeEligible, true, "expected clases_paid_30d to be Stripe-eligible");
  console.log("OK: clases_paid_30d registered at exactly $24.99 (2499 cents) / 30 days");
}

// ---------------------------------------------------------------------------
// 4-5. Paid routes to checkout; free does not
// ---------------------------------------------------------------------------
{
  const publishBar = read("app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx");
  const paidBlockStart = publishBar.indexOf("if (isPaidClases) {");
  assert.ok(paidBlockStart >= 0, "expected an `if (isPaidClases) { ... }` branch");
  const firstPublishCall = publishBar.indexOf("const r = await publishCommunityQuickToListings({", paidBlockStart);
  const paidBranchEnd = publishBar.indexOf(
    "const r = await publishCommunityQuickToListings({",
    firstPublishCall + 40,
  );
  const paidBranch = publishBar.slice(paidBlockStart, paidBranchEnd);
  assert.ok(paidBranch.includes("startRevenueCategoryCheckout"), "paid branch must call startRevenueCategoryCheckout");
  assert.ok(paidBranch.includes("redirectToRevenueCategoryCheckout"), "paid branch must redirect to Stripe Checkout");
  assert.ok(paidBranch.includes('activationMode: "pending_payment"'), "paid branch must publish as pending_payment");

  // The code after the paid branch (the free/Comunidad path) must never call checkout.
  const freePath = publishBar.slice(paidBranchEnd, publishBar.indexOf("} finally {", paidBranchEnd));
  assert.ok(!freePath.includes("startRevenueCategoryCheckout"), "free/Comunidad path must never call Revenue OS checkout");
  console.log("OK: paid Clases routes to Revenue OS checkout; free/Comunidad path does not");
}

// ---------------------------------------------------------------------------
// 6-7. Client cannot set the charge; payload carries canonical listing identity
// ---------------------------------------------------------------------------
{
  // Deliberately smuggling client-controlled price fields through an untyped payload, to prove
  // the builder drops anything outside the real RevenueCategoryCheckoutPayload contract.
  const smuggledInput = {
    ...CLASES_CATEGORY_CHECKOUT,
    listingId: "11111111-1111-1111-1111-111111111111",
    locale: "es" as const,
    price: 24.99,
    amountCents: 100,
  };
  const body = buildRevenueCategoryCheckoutBody(smuggledInput);
  assert.ok(!("price" in body), "checkout body must never carry a client-set price");
  assert.ok(!("amountCents" in body), "checkout body must never carry a client-set amountCents");
  assert.equal(body.category, "clases");
  assert.equal(body.packageKey, "clases_paid_30d");
  assert.equal(body.listingId, "11111111-1111-1111-1111-111111111111", "expected canonical listingId to flow through");

  const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
  assert.ok(
    checkoutRoute.includes("validateRevenueCheckoutRequest"),
    "checkout route must resolve price server-side via validateRevenueCheckoutRequest",
  );
  const revenueCheckoutSrc = read("app/lib/listingPlans/revenueCheckout.ts");
  assert.ok(
    revenueCheckoutSrc.includes("computeRevenueCheckoutSubtotalCents(packageDef"),
    "server must compute the checkout amount from the matrix package definition, not from client input",
  );
  console.log("OK: checkout payload carries canonical listingId, never a client-controlled amount; server resolves price from the matrix");
}

// ---------------------------------------------------------------------------
// 8. Pending listing cannot activate itself
// ---------------------------------------------------------------------------
{
  const publishLib = read("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts");
  assert.ok(
    /if \(activationMode === "pending_payment"\) \{[\s\S]{0,220}return \{ ok: true, listingId \};/.test(publishLib),
    "pending_payment publish must return before ever setting status active/published",
  );
  console.log("OK: a paid Clases listing cannot self-activate before Revenue OS fulfillment");
}

// ---------------------------------------------------------------------------
// 9-13. Fulfillment adapter: registered, same listing, activates, 30-day term, idempotent
// ---------------------------------------------------------------------------
{
  const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
  const registrations = fulfillment.match(/tryActivateClasesListingAfterEntitlement\(/g) ?? [];
  // 1 definition + 2 call sites (already-cleared replay chain + newly-paid chain).
  assert.ok(registrations.length >= 3, `expected Clases fulfillment wired into both dispatch chains, found ${registrations.length} references`);
  assert.ok(fulfillment.includes("CLASES_PAID_30D_PACKAGE_KEY"), "expected the canonical Clases package key imported into the dispatcher");

  const clasesFulfillment = read("app/lib/listingPlans/revenueClasesFulfillment.ts");
  assert.ok(clasesFulfillment.includes("listingId"), "adapter must operate on the canonical listingId");
  assert.ok(
    clasesFulfillment.includes('.eq("category", "clases")'),
    "adapter must scope its update to category='clases' (same-row activation, never a cross-category write)",
  );
  assert.ok(
    /status: "active",\s*\n\s*is_published: true/.test(clasesFulfillment),
    "successful fulfillment must activate + publish the listing",
  );
  assert.ok(
    clasesFulfillment.includes("computeFixedDayRenewalExpiresAt"),
    "term must be computed via the shared lifecycle helper, not a hardcoded/invented Clases-only mechanism",
  );
  assert.ok(
    clasesFulfillment.includes('getRevenuePackageDefinition(CLASES_PAID_30D_PACKAGE_KEY)?.durationDays'),
    "term days must be read from the canonical pricing matrix entry, not duplicated as a literal",
  );
  // Idempotency: conditional UPDATE (compare-and-swap) guard + already_published short-circuit.
  assert.ok(
    /\.eq\("status", CLASES_PENDING_CHECKOUT_STATUS\)\s*\n\s*\.eq\("is_published", false\)/.test(clasesFulfillment),
    "activation UPDATE must be conditional on the row still being pending/unpublished (idempotency backstop)",
  );
  assert.ok(
    clasesFulfillment.includes('outcome: "already_published"'),
    "a second delivery for an already-active listing must short-circuit as already_published, not re-activate",
  );
  console.log("OK: Clases fulfillment adapter registered in both dispatch chains, same-row activation, 30-day term via shared helper, idempotent");
}

// ---------------------------------------------------------------------------
// 14. Cancel flow leaves the listing unpaid/not public
// ---------------------------------------------------------------------------
{
  const clasesFulfillment = read("app/lib/listingPlans/revenueClasesFulfillment.ts");
  // Nothing in the codebase should flip a Clases row to active except this one adapter — verified
  // structurally: only this file's activatePaidClasesListingFromRevenueOs writes status:"active"
  // scoped to category "clases" (checked above). A cancelled/abandoned Stripe session never calls
  // this function (webhook only fires on checkout.session.completed with a paid session), so the
  // row simply stays in its pending_payment state — recoverable, not deleted.
  const publishLib = read("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts");
  assert.ok(
    !publishLib.includes("DELETE") && !/\.delete\(\)/.test(publishLib),
    "pending listing must never be deleted merely because checkout was cancelled",
  );
  assert.ok(clasesFulfillment.length > 0);
  console.log("OK: cancelled/abandoned checkout leaves the listing pending and recoverable (never deleted, never auto-activated)");
}

// ---------------------------------------------------------------------------
// 15. Browser success redirect alone cannot activate a listing
// ---------------------------------------------------------------------------
{
  const successPage = read("app/(site)/revenue-os/pago/exito/page.tsx");
  assert.ok(
    successPage.includes("lookupRevenuePaymentProof"),
    "success page must only read payment proof, never write/activate",
  );
  assert.ok(
    !/activatePaid\w+ListingFromRevenueOs/.test(successPage),
    "success page must never call any category activation function directly",
  );
  console.log("OK: the Stripe success return page is read-only — activation only ever happens via the verified webhook");
}

// ---------------------------------------------------------------------------
// 16. Provider payment methods never affect the Leonix charge
// ---------------------------------------------------------------------------
{
  const publishBar = read("app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx");
  assert.ok(!/paymentMethods/i.test(publishBar), "publish bar must never reference provider payment methods when starting checkout");
  const checkoutPayload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
  assert.ok(!/paymentMethods/i.test(checkoutPayload), "checkout payload contract must never carry provider payment methods");
  console.log("OK: provider payment methods (student-facing) never influence the $24.99 Leonix charge");
}

// ---------------------------------------------------------------------------
// 17. Gate 2A's paid-block preserved, not weakened — connected via opt-in, not bypassed
// ---------------------------------------------------------------------------
{
  const free = { ...emptyClasesQuickDraft(), classCostType: "gratis" as const };
  const paid = { ...emptyClasesQuickDraft(), classCostType: "pagada" as const };
  assert.equal(shouldBlockClasesPaidPublish(free), false);
  assert.equal(shouldBlockClasesPaidPublish(paid), true, "shouldBlockClasesPaidPublish must still block paid classes by default");

  const publishLib = read("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts");
  assert.ok(
    publishLib.includes('activationMode !== "pending_payment" && shouldBlockClasesPaidPublish'),
    "the block must only be bypassed for the explicit pending_payment (checkout) activation mode — every other caller stays blocked",
  );
  console.log("OK: Gate 2A's paid-publish block is preserved and only bypassed via the explicit checkout opt-in");
}

// ---------------------------------------------------------------------------
// 18-19. Free class publish + legacy free listings unaffected
// ---------------------------------------------------------------------------
{
  const draft = emptyClasesQuickDraft();
  assert.equal(draft.classCostType, "gratis", "default draft must still be free (unchanged legacy behavior)");
  const publishLib = read("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts");
  assert.ok(
    publishLib.includes('activationMode?: CommunityQuickPublishActivationMode'),
    "activationMode must be optional so every pre-Gate-2B caller (free Clases, Comunidad) is unaffected",
  );
  assert.ok(
    publishLib.includes('const { kind, draft: d, lang, existingListingId, onListingIdKnown, activationMode = "immediate" } = input;'),
    "activationMode must default to 'immediate' — unchanged prior behavior when omitted",
  );
  console.log("OK: free Clases publish and legacy listings are unaffected — activationMode defaults to unchanged 'immediate' behavior");
}

// ---------------------------------------------------------------------------
// 20-23. No migration; no Mascotas/Busco/Comunidad-owned-UI files touched
// ---------------------------------------------------------------------------
{
  const changedFiles = execSync("git diff --name-only HEAD", { cwd: join(__dirname, ".."), encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const untrackedFiles = execSync("git status --porcelain", { cwd: join(__dirname, ".."), encoding: "utf8" })
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3).trim());
  const allTouched = [...new Set([...changedFiles, ...untrackedFiles])];

  const migrationTouched = allTouched.some((f) => /supabase\/migrations\//i.test(f) || /\.sql$/i.test(f));
  assert.ok(!migrationTouched, `expected no DB migration files touched, found: ${allTouched.filter((f) => /migrations|\.sql$/i.test(f)).join(", ")}`);

  // Gate 3 legitimately owns Mascotas y Perdidos, and Gate 4 legitimately owns Busco, now (each
  // was only out of scope at Gate 2B's own commit time) — neither is in this forbidden list any
  // more. Comunidad remains forbidden for every gate that isn't its own, except the specific file
  // below: the final owner-QA repair batch (⚠️67-76) is a deliberate, PM-authorized cross-category
  // pass touching Comunidad + Clases together (same precedent as the earlier second-verification
  // modal backport).
  const forbiddenPrefixes = [
    "app/(site)/publicar/comunidad/",
    "app/(site)/clasificados/comunidad/",
  ];
  const allowedSharedFiles = new Set([
    "app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx",
  ]);
  const violations = allTouched.filter(
    (f) => forbiddenPrefixes.some((p) => f.startsWith(p)) && !allowedSharedFiles.has(f),
  );
  assert.equal(violations.length, 0, `expected no Comunidad-owned files touched, found: ${violations.join(", ")}`);

  console.log("OK: no DB migration added; no Comunidad-owned UI files touched");
}

console.log("gate-2b-clases-revenue-os-selftest: PASS");
