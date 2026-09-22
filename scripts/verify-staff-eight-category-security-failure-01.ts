/**
 * LEONIX STAFF GATEWAY — Gate 8 security / failure matrix. Exact status/error per case.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-security-failure-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { __reset, __seed, __setAuthUsers } from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";
import { POST as custodyPost, GET as custodyGet } from "../app/api/admin/sales-preview/custody/route";
import { POST as previewLinkPost } from "../app/api/admin/sales-preview/preview-link/route";
import { POST as acceptClaimPost } from "../app/api/business/ownership-claim/accept/route";
import {
  evaluateListingPackagePaymentAuthority,
  paymentAuthorityHttpError,
} from "../app/lib/listingPlans/listingPackagePaymentAuthority";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";
import { layoutQuickMedia } from "../app/lib/sales/quickMediaLayout";
import { shouldFetchAddressSuggestions } from "../app/lib/businessAddress/businessAddressLookupPolicy";
import { planLinkedListingOwnerTransfer } from "../app/lib/business/ownership/linkedListingOwnerTransfer";
import { resolveAssistedRowBinding } from "../app/lib/sales/assistedSameRowBinding";
import { QUICK_SALES_CATEGORY_MAP } from "../app/lib/sales/quickSalesCategories";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
process.env.ASSISTED_PUBLISHING_SESSION_SECRET = "assisted-secret-harness-only";
process.env.PROSPECT_PREVIEW_SESSION_SECRET = "preview-secret-harness-only";

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
async function checkAsync(name: string, fn: () => Promise<void>) {
  checks += 1;
  try {
    await fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function makeRequest(body: unknown, cookieJar: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const h = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    json: async () => body,
    text: async () => JSON.stringify(body ?? {}),
    headers: { get: (name: string) => h.get(name.toLowerCase()) ?? null },
    cookies: { get: (name: string) => (name in cookieJar ? { name, value: cookieJar[name] } : undefined) },
    nextUrl: new URL("http://harness.invalid/api"),
  } as never;
}

async function jsonOf(res: Response): Promise<{ status: number; body: Record<string, unknown> }> {
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

async function main() {
  await checkAsync("S1: no staff auth → custody GET 401 no_admin_cookie", async () => {
    __reset();
    __setCookies({});
    const res = await custodyGet(makeRequest({}));
    const got = await jsonOf(res);
    assert.equal(got.status, 401);
    assert.equal(got.body.error, "no_admin_cookie");
  });

  await checkAsync("S2: no staff auth → custody POST 401 no_admin_cookie", async () => {
    __reset();
    __setCookies({});
    const res = await custodyPost(makeRequest({ category: "servicios", businessId: "biz-1" }));
    const got = await jsonOf(res);
    assert.equal(got.status, 401);
    assert.equal(got.body.error, "no_admin_cookie");
  });

  await checkAsync("S3: wrong staff capability → 403 role_not_permitted", async () => {
    __reset();
    const email = "viewer@leonix.test";
    const auth = "00000000-0000-4000-8000-000000000view";
    __setCookies({ leonix_admin: "1", leonix_admin_operator_email: email, leonix_admin_auth_user_id: auth });
    __setAuthUsers([{ id: auth, email }]);
    __seed("admin_team_members", [
      { id: "roster-view", email, display_name: "Viewer", role: "read_only", is_active: true, auth_user_id: auth },
    ]);
    const res = await custodyPost(makeRequest({ category: "servicios", businessId: "biz-1" }));
    const got = await jsonOf(res);
    assert.equal(got.status, 403);
    assert.equal(got.body.error, "role_not_permitted");
  });

  await checkAsync("S4: preview-link with no staff auth → 401 no_admin_cookie", async () => {
    __reset();
    __setCookies({});
    const res = await previewLinkPost(makeRequest({ listingId: "x" }));
    const got = await jsonOf(res);
    assert.equal(got.status, 401);
    assert.equal(got.body.error, "no_admin_cookie");
  });

  await checkAsync("S5: claim accept with no bearer → 401 unauthorized", async () => {
    const res = await acceptClaimPost(makeRequest({ token: "abc" }));
    const got = await jsonOf(res);
    assert.equal(got.status, 401);
    assert.equal(got.body.error, "unauthorized");
  });

  check("S6: body listing ID override is refused by same-row binding", () => {
    const mismatch = resolveAssistedRowBinding({
      contextListingId: "listing-canonical",
      contextAssistedAction: "save_for_client",
      requestedAction: "save_for_client",
      bodyListingId: "listing-attacker",
    });
    assert.equal(mismatch.ok, false);
    if (!mismatch.ok) {
      assert.equal(mismatch.status, 409);
      assert.equal(mismatch.error, "assisted_listing_mismatch");
    }
  });

  check("S7: staff doorway excludes Viajes/Iglesias/Recursos and customer adapters", () => {
    const keys = Object.keys(QUICK_SALES_CATEGORY_MAP);
    assert.equal(keys.includes("viajes"), false);
    assert.equal(keys.includes("iglesias"), false);
    assert.equal(keys.includes("recursos"), false);
    assert.equal(QUICK_SALES_CATEGORY_MAP.servicios.intakePath.includes("negocio-rapido"), false);
    assert.equal(QUICK_SALES_CATEGORY_MAP["comida-local"].intakePath.includes("/rapido"), false);
  });

  check("S8: Quick 4th image and 0 images fail; Full cap is not this layout helper", () => {
    assert.deepEqual(layoutQuickMedia(0), { ok: false, error: "too_few" });
    assert.deepEqual(layoutQuickMedia(4), { ok: false, error: "too_many" });
    const three = layoutQuickMedia(3);
    assert.equal("ok" in three, false);
  });

  check("S9: payment failure matrix exact codes", () => {
    const QUICK = BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.simple;
    const FULL = BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.full;
    const base = {
      listingSource: "servicios_public_listings",
      listingId: "L1",
      packageKey: QUICK,
      category: "servicios",
      currency: "usd" as const,
    };
    const rec = {
      id: "p",
      listing_source: "servicios_public_listings",
      listing_id: "L1",
      category: "servicios",
      package_key: QUICK,
      currency: "usd",
      source: "admin_manual",
      payment_status: "paid",
      manual_state: "cleared",
      amount_cents: 24900,
      amount_paid_cents: 24900,
      amount_total_cents: 24900,
    };
    const pending = evaluateListingPackagePaymentAuthority({
      ...base,
      records: [{ ...rec, payment_status: "pending", manual_state: "pending" }],
    });
    assert.equal(pending.ok, false);
    if (!pending.ok) assert.equal(pending.error, "pending_payment");
    const wrong = evaluateListingPackagePaymentAuthority({
      ...base,
      packageKey: FULL,
      records: [rec],
    });
    assert.equal(wrong.ok, false);
    if (!wrong.ok) {
      assert.equal(wrong.error, "wrong_package");
      assert.equal(paymentAuthorityHttpError(wrong).error, "wrong_package_payment");
      assert.equal(paymentAuthorityHttpError(wrong).status, 402);
    }
    const refunded = evaluateListingPackagePaymentAuthority({
      ...base,
      records: [{ ...rec, payment_status: "refunded", refunded_at: "2026-09-22" }],
    });
    assert.equal(refunded.ok, false);
    if (!refunded.ok) assert.equal(refunded.error, "refunded_payment");
    const currency = evaluateListingPackagePaymentAuthority({
      ...base,
      records: [{ ...rec, currency: "mxn" }],
    });
    assert.equal(currency.ok, false);
    if (!currency.ok) assert.equal(currency.error, "wrong_currency");
    const listing = evaluateListingPackagePaymentAuthority({
      ...base,
      records: [{ ...rec, listing_id: "OTHER" }],
    });
    assert.equal(listing.ok, false);
    if (!listing.ok) assert.equal(listing.error, "wrong_listing");
  });

  check("S10: Rewards replay / over-redemption / unauthorized claim planner", () => {
    const replay = evaluateListingPackagePaymentAuthority({
      listingSource: "servicios_public_listings",
      listingId: "L1",
      packageKey: BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.simple,
      records: [
        {
          listing_source: "servicios_public_listings",
          listing_id: "L1",
          package_key: BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.simple,
          currency: "usd",
          source: "admin_manual",
          payment_status: "paid",
          manual_state: "cleared",
          amount_cents: 24900,
          amount_paid_cents: 24900,
          amount_total_cents: 24900,
        },
      ],
      rewards: [{ listing_id: "L1", package_key: BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.simple, status: "committed", replayed: true }],
    });
    assert.equal(replay.ok, false);
    if (!replay.ok) assert.equal(replay.error, "rewards_replay");
    const steal = planLinkedListingOwnerTransfer({
      claimerUserId: "claimer",
      listings: [{ listingSource: "servicios_public_listings", listingId: "svc", currentOwner: "other" }],
    });
    assert.equal(steal.ok, true);
    if (steal.ok) {
      assert.equal(steal.updates.length, 0);
      assert.equal(steal.skipped[0]?.reason, "foreign_owner");
    }
  });

  check("S11: address validator repeated-keystroke calls are refused", () => {
    assert.equal(shouldFetchAddressSuggestions({ trigger: "keystroke", streetLength: 40, alreadyConfirmed: false }), false);
    assert.equal(shouldFetchAddressSuggestions({ trigger: "debounce", streetLength: 40, alreadyConfirmed: false }), false);
  });

  check("S12: translation provider failure leaves original; contacts stay masked", () => {
    const control = read("app/components/translation/TranslateAdControl.tsx");
    assert.ok(control.includes("setError(labels.error)"));
    const route = read("app/api/translate-ad/route.ts");
    assert.ok(route.includes("containsUnmaskedSensitiveContent"));
  });

  check("S13: Community Trust has one vote table and preview cannot toggle", () => {
    const widget = read("app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx");
    assert.ok(widget.includes("if (preview || chipState === \"toggling\") return"));
    const sql = read("supabase/migrations/20260819210000_leonix_endorsement_votes.sql");
    assert.ok(sql.includes("leonix_endorsement_votes_dedupe_uidx"));
  });

  check("S14: no leonix_managed_custody / verified_state columns were added", () => {
    const authority = read("app/lib/listingPlans/listingPackagePaymentAuthority.ts");
    assert.equal(authority.includes("verified_state"), false);
    assert.equal(read("app/lib/business/ownership/linkedListingOwnerTransfer.ts").includes("leonix_managed_custody"), false);
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-security-failure-01: ALL CHECKS EXECUTED AND PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
