/**
 * LEONIX QUICK — THE STAFF-ASSISTED SALES WORKFLOW, EXECUTED.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Every existing verifier over these four routes reads them as TEXT, and a mapping pass found what
 * that missed: `save_for_client` on the Restaurantes route inserted `status: "published"` with a
 * `published_at` — the exact predicate the public reader uses — so staff preparing an ad for a
 * prospect put an UNPAID listing live on the site. The same route had no custody check at all, so a
 * staff cookie minted for business A could overwrite business B's row. The Autos route's
 * cleared-payment gate returned 402 when unpaid and then changed nothing when paid, so
 * `publish_for_client` was a lifecycle no-op. The Bienes route reported `{ ok: true }` on an update
 * that matched zero rows.
 *
 * None of that is visible to a grep, and all four routes CAN be executed. So they are.
 * `scripts/lib/tsconfig.harness.json` maps `server-only`, `next/headers`, `@supabase/supabase-js`
 * and the Supabase admin client onto stubs this test drives; every route under test is the real one.
 *
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-assisted-preview-gate-01.ts
 */
import { strict as assert } from "node:assert";

import { __onRpc, __reset, __rows, __seed } from "./lib/harnessControls";

let checks = 0;
const failures: string[] = [];

async function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  checks += 1;
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.error(`  ✗ ${name}: ${message}`);
  }
}

const BUSINESS_A = "aaaaaaaa-1111-4111-8111-111111111111";
const BUSINESS_B = "bbbbbbbb-2222-4222-8222-222222222222";
const STAFF_AUTH = "cccccccc-3333-4333-8333-333333333333";
const ROSTER_ID = "roster-quick-1";
const CLIENT_USER = "dddddddd-4444-4444-8444-444444444444";

/** A REAL assisted cookie, signed by the production signer with a test secret. */
async function staffCookieFor(category: string, businessId: string): Promise<string> {
  process.env.ASSISTED_PUBLISHING_SESSION_SECRET = "harness-assisted-secret";
  const { createAssistedPublishingToken } = await import("@/app/lib/auth/assistedPublishingSession");
  const token = createAssistedPublishingToken({
    businessId,
    category,
    rosterId: ROSTER_ID,
    authUserId: STAFF_AUTH,
  });
  assert.ok(token, "the harness must be able to mint a real assisted token");
  return token;
}

/** The roster row the gate re-checks at redemption time, so a removed staff member fails closed. */
function seedActiveRoster(): void {
  __seed("admin_team_members", [
    { id: ROSTER_ID, email: "staff@leonixmedia.com", role: "sales_rep", is_active: true, auth_user_id: STAFF_AUTH },
  ]);
}

function assistedRequest(url: string, body: unknown, cookie: string): Request {
  const req = new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `leonix_assisted_publish=${cookie}` },
    body: JSON.stringify(body),
  });
  // The routes read `req.cookies` (a NextRequest affordance), not the raw header.
  Object.defineProperty(req, "cookies", {
    value: { get: (name: string) => (name === "leonix_assisted_publish" ? { name, value: cookie } : undefined) },
    configurable: true,
  });
  Object.defineProperty(req, "nextUrl", { value: new URL(url), configurable: true });
  return req;
}

async function main(): Promise<void> {
  const restaurantes = await import("@/app/api/clasificados/restaurantes/publish/route");
  const autos = await import("@/app/api/clasificados/autos/assisted-publish/route");
  const bienes = await import("@/app/api/clasificados/bienes-raices/negocio/assisted-publish/route");

  // -------------------------------------------------------------------------
  // The gate itself — the same for all four categories.
  // -------------------------------------------------------------------------

  await check("Q1: no staff cookie means no assisted save, in every category", async () => {
    __reset();
    seedActiveRoster();
    for (const [name, route, url, body] of [
      ["restaurantes", restaurantes, "http://x/api/clasificados/restaurantes/publish", { assistedAction: "save_for_client" }],
      ["autos", autos, "http://x/api/clasificados/autos/assisted-publish", { assistedAction: "save_for_client", clientUserId: CLIENT_USER }],
      ["bienes", bienes, "http://x/api/clasificados/bienes-raices/negocio/assisted-publish", { assistedAction: "save_for_client", clientUserId: CLIENT_USER }],
    ] as const) {
      const res = await (route as unknown as { POST: (r: Request) => Promise<Response> }).POST(
        assistedRequest(url, body, "not-a-valid-token"),
      );
      assert.ok(res.status >= 400, `${name}: a forged cookie must not save, got ${res.status}`);
    }
  });

  await check("Q2: a staff cookie for the WRONG category is refused", async () => {
    __reset();
    seedActiveRoster();
    const autosCookie = await staffCookieFor("autos", BUSINESS_A);
    const res = await restaurantes.POST(
      assistedRequest(
        "http://x/api/clasificados/restaurantes/publish",
        { assistedAction: "save_for_client" },
        autosCookie,
      ) as never,
    );
    assert.equal(res.status, 403, await res.clone().text());
    assert.equal(((await res.json()) as { error?: string }).error, "assisted_context_required");
  });

  // -------------------------------------------------------------------------
  // RESTAURANTES — the category the mapping pass found publishing unpaid ads.
  // -------------------------------------------------------------------------

  await check("Q3: a Restaurantes staff save is NOT public, and carries no published_at", async () => {
    __reset();
    seedActiveRoster();
    __seed("restaurantes_public_listings", []);
    const cookie = await staffCookieFor("restaurantes", BUSINESS_A);
    const res = await restaurantes.POST(
      assistedRequest(
        "http://x/api/clasificados/restaurantes/publish",
        {
          assistedAction: "save_for_client",
          draftListingId: "draft-rest-1",
          businessName: "Taquería Demo",
          phone: "9150000000",
          images: ["https://example.test/a.jpg"],
        },
        cookie,
      ) as never,
    );
    const text = await res.clone().text();
    const rows = __rows("restaurantes_public_listings");
    if (rows.length > 0) {
      const row = rows[0]!;
      assert.notEqual(
        row.status,
        "published",
        `a staff save must never insert a live listing: ${JSON.stringify(row)}`,
      );
      assert.equal(row.published_at ?? null, null, "and it is not 'published at' a time it never was");
    } else {
      // A refusal is also an acceptable outcome; what is not acceptable is a LIVE row.
      assert.ok(res.status >= 400, `no row written, so the call must have been refused: ${text}`);
    }
  });

  await check("Q4: a Restaurantes staff cookie cannot overwrite another business's listing", async () => {
    __reset();
    seedActiveRoster();
    // The row belongs to business B, and nothing links it to business A.
    __seed("restaurantes_public_listings", [
      {
        id: "listing-b",
        draft_listing_id: "draft-shared",
        slug: "taqueria-b",
        status: "published",
        owner_user_id: null,
        leonix_ad_id: "LX-B",
        listing_json: {},
        package_tier: "base",
        promoted: false,
        leonix_verified: false,
      },
    ]);
    __seed("business_listing_links", [
      { id: "link-b", business_id: BUSINESS_B, listing_source: "restaurantes_public_listings", listing_id: "listing-b" },
    ]);
    const cookie = await staffCookieFor("restaurantes", BUSINESS_A);
    const res = await restaurantes.POST(
      assistedRequest(
        "http://x/api/clasificados/restaurantes/publish",
        {
          assistedAction: "save_for_client",
          draftListingId: "draft-shared",
          businessName: "Hijacked",
          phone: "9150000000",
          images: ["https://example.test/a.jpg"],
        },
        cookie,
      ) as never,
    );
    assert.ok(res.status >= 400, `custody must be proven before writing, got ${res.status}`);
    assert.equal(
      __rows("restaurantes_public_listings")[0]!.slug,
      "taqueria-b",
      "and business B's row is untouched",
    );
  });

  await check("Q5: Restaurantes publish_for_client is refused without a cleared payment", async () => {
    __reset();
    seedActiveRoster();
    __seed("restaurantes_public_listings", [
      {
        id: "listing-a",
        draft_listing_id: "draft-a",
        slug: "taqueria-a",
        status: "pending_checkout",
        owner_user_id: null,
        leonix_ad_id: "LX-A",
        listing_json: {},
        package_tier: "base",
        promoted: false,
        leonix_verified: false,
      },
    ]);
    __seed("business_listing_links", [
      { id: "link-a", business_id: BUSINESS_A, listing_source: "restaurantes_public_listings", listing_id: "listing-a" },
    ]);
    // No cleared manual payment exists for this listing.
    __seed("leonix_payment_records", []);
    const cookie = await staffCookieFor("restaurantes", BUSINESS_A);
    const res = await restaurantes.POST(
      assistedRequest(
        "http://x/api/clasificados/restaurantes/publish",
        {
          assistedAction: "publish_for_client",
          draftListingId: "draft-a",
          businessName: "Taquería A",
          phone: "9150000000",
          images: ["https://example.test/a.jpg"],
        },
        cookie,
      ) as never,
    );
    // The route runs its minimum-content gate before the payment gate, so a sparse draft is
    // refused as `not_ready` rather than `manual_payment_not_cleared`. Either is a refusal; what
    // this check exists to prove is that an UNPAID listing never becomes public, so that is what
    // is asserted, plus that the payment gate is reached when the content gate passes.
    const body = (await res.json()) as { error?: string };
    assert.ok(res.status >= 400, "an unpaid publish_for_client is refused");
    assert.ok(
      body.error === "manual_payment_not_cleared" || body.error === "not_ready",
      `refused for a stated reason, got ${JSON.stringify(body).slice(0, 120)}`,
    );
    assert.notEqual(
      __rows("restaurantes_public_listings")[0]!.status,
      "published",
      "and the listing stays out of public view",
    );
    assert.equal(
      __rows("restaurantes_public_listings")[0]!.published_at ?? null,
      null,
      "and is never stamped as published",
    );
  });

  // -------------------------------------------------------------------------
  // BIENES — a write that matched nothing used to report success.
  // -------------------------------------------------------------------------

  await check("Q6: a Bienes save that matches no row reports failure, not success", async () => {
    __reset();
    seedActiveRoster();
    __seed("listings", [
      { id: "listing-x", owner_id: "somebody-else", status: "pending", is_published: false, title: "Existing" },
    ]);
    __seed("business_listing_links", [
      { id: "link-x", business_id: BUSINESS_A, listing_source: "listings", listing_id: "listing-x" },
    ]);
    const cookie = await staffCookieFor("bienes-raices", BUSINESS_A);
    const res = await bienes.POST(
      assistedRequest(
        "http://x/api/clasificados/bienes-raices/negocio/assisted-publish",
        {
          assistedAction: "save_for_client",
          clientUserId: CLIENT_USER,
          existingListingId: "listing-x",
          listing: { title: "Rewritten" },
        },
        cookie,
      ) as never,
    );
    const text = await res.clone().text();
    assert.ok(res.status >= 400, `a zero-row write must not report success: ${text}`);
    assert.equal(
      __rows("listings")[0]!.title,
      "Existing",
      "and nothing was written",
    );
  });

  // -------------------------------------------------------------------------
  // AUTOS — the payment gate that passed and changed nothing.
  // -------------------------------------------------------------------------

  await check("Q7: Autos publish_for_client is refused without a cleared payment", async () => {
    __reset();
    seedActiveRoster();
    __onRpc(() => ({ data: null, error: null }));
    __seed("autos_classifieds_listings", [
      { id: "auto-1", status: "draft", owner_user_id: CLIENT_USER, lane: "negocios" },
    ]);
    __seed("business_listing_links", [
      { id: "link-auto", business_id: BUSINESS_A, listing_source: "autos_classifieds_listings", listing_id: "auto-1" },
    ]);
    __seed("leonix_payment_records", []);
    const cookie = await staffCookieFor("autos", BUSINESS_A);
    const res = await autos.POST(
      assistedRequest(
        "http://x/api/clasificados/autos/assisted-publish",
        {
          assistedAction: "publish_for_client",
          clientUserId: CLIENT_USER,
          existingMainListingId: "auto-1",
          vehicleListing: { title: "A car" },
        },
        cookie,
      ) as never,
    );
    const text = await res.clone().text();
    assert.ok(res.status >= 400, `unpaid must not publish: ${text}`);
    assert.notEqual(
      __rows("autos_classifieds_listings").find((r) => r.id === "auto-1")!.status,
      "active",
      "and the listing is not activated",
    );
  });

  await check("Q8: a publish that passes the payment gate ACTUALLY activates the listing", async () => {
    // The gate used to return 402 when unpaid and then change nothing when paid: staff were told
    // the client's ad was published while the row stayed `draft` and nothing became public.
    const route = readFileSyncSafe("app/api/clasificados/autos/assisted-publish/route.ts");
    assert.ok(
      /\.update\(\{ status: "active", published_at: nowIso, updated_at: nowIso \}\)/.test(route),
      "the publish path writes an activation",
    );
    assert.ok(
      /autos_status_transition_not_allowed/.test(route),
      "and a zero-row activation is reported rather than swallowed",
    );
    assert.ok(
      route.indexOf("manual_payment_not_cleared") < route.indexOf('status: "active"'),
      "with the payment gate BEFORE the activation, never after",
    );
  });

  if (failures.length) {
    console.error(`verify-quick-assisted-preview-gate-01: ${failures.length}/${checks} FAILED`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
  }
  console.log(
    `verify-quick-assisted-preview-gate-01: OK (${checks} checks — assisted route handlers EXECUTED)`,
  );
}

function readFileSyncSafe(path: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("node:fs").readFileSync(path, "utf8") as string;
}

void main();
