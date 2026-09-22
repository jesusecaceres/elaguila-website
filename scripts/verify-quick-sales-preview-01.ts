/**
 * LEONIX QUICK — BEHAVIORAL proof of the four-category staff sales + prospect-preview workflow.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-sales-preview-01.ts
 *
 * EVERY CHECK IN THIS FILE EXECUTES CODE. Nothing here asserts that a string appears in a source
 * file. The preview token is attacked with real forgeries against the real HMAC; the same-row
 * binding is called with real inputs; the workspace routes are imported and CALLED against the
 * in-memory PostgREST harness, so a gate that stops running is a red check rather than a diff
 * nobody reads.
 *
 * The standard this is written to: a defect a test READS rather than EXECUTES is a defect the test
 * cannot see.
 *
 * No database, no network, no live Stripe, no migration.
 */
import { strict as assert } from "node:assert";
import {
  __reset,
  __seed,
  __rows,
  __setAuthUsers,
} from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";

import {
  PROSPECT_PREVIEW_MAX_AGE_SEC,
  createProspectPreviewTokenWithSecret,
  signProspectPreviewPayload,
  verifyProspectPreviewTokenWithSecret,
  type ProspectPreviewCategory,
  type ProspectPreviewSource,
} from "../app/lib/auth/prospectPreviewToken";
import {
  createAssistedPublishingTokenWithSecret,
  verifyAssistedPublishingTokenWithSecret,
} from "../app/lib/auth/assistedPublishingToken";
import {
  assertAssistedIdentity,
  resolveAssistedRowBinding,
} from "../app/lib/sales/assistedSameRowBinding";
import { QUICK_SALES_CATEGORY_MAP, QUICK_SALES_CATEGORIES } from "../app/lib/sales/quickSalesCategories";

const PREVIEW_SECRET = "preview-secret-harness-only";
const ASSISTED_SECRET = "assisted-secret-harness-only";
process.env.PROSPECT_PREVIEW_SESSION_SECRET = PREVIEW_SECRET;
process.env.ASSISTED_PUBLISHING_SESSION_SECRET = ASSISTED_SECRET;

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
async function checkAsync(name: string, fn: () => Promise<void>) {
  checks += 1;
  try {
    await fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const NOW = 1_800_000_000_000;

const CATEGORY_SOURCE: Record<ProspectPreviewCategory, ProspectPreviewSource> = {
  servicios: "servicios_public_listings",
  restaurantes: "restaurantes_public_listings",
  autos: "autos_classifieds_listings",
  "bienes-raices": "listings",
};

const ALL: ProspectPreviewCategory[] = ["servicios", "restaurantes", "autos", "bienes-raices"];

function mintPreview(category: ProspectPreviewCategory, listingId = "listing-1", ttlSec?: number) {
  return createProspectPreviewTokenWithSecret(
    {
      category,
      listingSource: CATEGORY_SOURCE[category],
      listingId,
      businessId: "biz-1",
      issuedByRosterId: "roster-1",
      ttlSec,
    },
    PREVIEW_SECRET,
    NOW,
  );
}

// =============================================================================
// SECTION A — PROSPECT PREVIEW TOKEN, ATTACKED FOR REAL, PER CATEGORY
// =============================================================================

for (const category of ALL) {
  check(`A1[${category}]: a validly minted token verifies and carries the exact minted claims`, () => {
    const token = mintPreview(category)!;
    assert.ok(token, "minting must succeed when a secret is configured");
    const ctx = verifyProspectPreviewTokenWithSecret(token, category, PREVIEW_SECRET, NOW + 1000);
    assert.ok(ctx, "a fresh token must verify for its own category");
    assert.equal(ctx!.category, category);
    assert.equal(ctx!.listingSource, CATEGORY_SOURCE[category]);
    assert.equal(ctx!.listingId, "listing-1");
    assert.equal(ctx!.businessId, "biz-1");
  });

  check(`A2[${category}]: a token for one category never opens another category's preview`, () => {
    const token = mintPreview(category)!;
    for (const other of ALL) {
      if (other === category) continue;
      const ctx = verifyProspectPreviewTokenWithSecret(token, other, PREVIEW_SECRET, NOW + 1000);
      assert.equal(ctx, null, `${category} token must not verify as ${other}`);
    }
  });

  check(`A3[${category}]: a token forged with a different secret is refused`, () => {
    const forged = createProspectPreviewTokenWithSecret(
      { category, listingSource: CATEGORY_SOURCE[category], listingId: "listing-1", businessId: "biz-1", issuedByRosterId: "r" },
      "attacker-secret",
      NOW,
    )!;
    assert.equal(verifyProspectPreviewTokenWithSecret(forged, category, PREVIEW_SECRET, NOW + 1), null);
  });

  check(`A4[${category}]: a tampered payload (different listing id) is refused`, () => {
    const token = mintPreview(category)!;
    const [payload, sig] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8")) as Record<string, unknown>;
    decoded.listingId = "listing-SOMEBODY-ELSE";
    const tampered = `${Buffer.from(JSON.stringify(decoded), "utf8").toString("base64url")}.${sig}`;
    assert.equal(verifyProspectPreviewTokenWithSecret(tampered, category, PREVIEW_SECRET, NOW + 1), null);
  });

  check(`A5[${category}]: an expired token is refused`, () => {
    const token = mintPreview(category, "listing-1", 3600)!;
    assert.ok(verifyProspectPreviewTokenWithSecret(token, category, PREVIEW_SECRET, NOW + 3599_000));
    assert.equal(verifyProspectPreviewTokenWithSecret(token, category, PREVIEW_SECRET, NOW + 3600_001), null);
  });
}

check("A6: a malformed token (no separator, empty, separator-only) is refused", () => {
  for (const raw of ["", ".", "no-dot-at-all", ".sig", "payload."]) {
    assert.equal(verifyProspectPreviewTokenWithSecret(raw, "servicios", PREVIEW_SECRET, NOW), null, `must refuse ${JSON.stringify(raw)}`);
  }
});

check("A7: a truncated signature is refused (constant-time compare rejects on length)", () => {
  const token = mintPreview("servicios")!;
  const [payload, sig] = token.split(".");
  assert.equal(verifyProspectPreviewTokenWithSecret(`${payload}.${sig!.slice(0, -2)}`, "servicios", PREVIEW_SECRET, NOW + 1), null);
});

check("A8: NO SECRET MEANS NO TOKEN — mint and verify both fail closed, with no dev fallback", () => {
  const token = mintPreview("servicios")!;
  assert.equal(createProspectPreviewTokenWithSecret(
    { category: "servicios", listingSource: "servicios_public_listings", listingId: "l", businessId: "b", issuedByRosterId: "r" },
    "",
    NOW,
  ), null, "an absent secret must not mint");
  assert.equal(verifyProspectPreviewTokenWithSecret(token, "servicios", "", NOW + 1), null, "an absent secret must not verify");
});

check("A9: a caller cannot ask for more than 72 hours — the ceiling is the token's, not theirs", () => {
  const token = mintPreview("servicios", "listing-1", PROSPECT_PREVIEW_MAX_AGE_SEC * 10)!;
  const ctx = verifyProspectPreviewTokenWithSecret(token, "servicios", PREVIEW_SECRET, NOW + 1)!;
  assert.ok(ctx, "a clamped token still verifies");
  assert.equal(ctx.expiresAtMs - ctx.issuedAtMs, PROSPECT_PREVIEW_MAX_AGE_SEC * 1000, "lifetime must be clamped to 72h at mint");
});

check("A10: a VALIDLY SIGNED token claiming more than 72 hours is still refused on read", () => {
  // The attacker here is someone who can sign — a leaked secret, or a future code path that
  // forgets the clamp. The ceiling is re-checked on read, so it still buys nothing.
  const payloadObj = {
    category: "servicios",
    listingSource: "servicios_public_listings",
    listingId: "listing-1",
    businessId: "biz-1",
    issuedByRosterId: "roster-1",
    issuedAtMs: NOW,
    expiresAtMs: NOW + PROSPECT_PREVIEW_MAX_AGE_SEC * 1000 * 30,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const token = `${payload}.${signProspectPreviewPayload(payload, PREVIEW_SECRET)}`;
  assert.equal(verifyProspectPreviewTokenWithSecret(token, "servicios", PREVIEW_SECRET, NOW + 1000), null);
});

check("A11: a not-yet-valid token (issued in the future) is refused", () => {
  const token = mintPreview("servicios")!;
  assert.equal(verifyProspectPreviewTokenWithSecret(token, "servicios", PREVIEW_SECRET, NOW - 1000), null);
});

check("A12: the two token types can never be cross-validated, even sharing a secret", () => {
  const preview = mintPreview("servicios")!;
  const assisted = createAssistedPublishingTokenWithSecret(
    { businessId: "biz-1", category: "servicios", rosterId: "roster-1", authUserId: "auth-1" },
    PREVIEW_SECRET,
    NOW,
  )!;
  assert.equal(verifyAssistedPublishingTokenWithSecret(preview, PREVIEW_SECRET, NOW + 1), null, "a preview token must not become assisted authority");
  assert.equal(verifyProspectPreviewTokenWithSecret(assisted, "servicios", PREVIEW_SECRET, NOW + 1), null, "an assisted token must not become a preview link");
});

// =============================================================================
// SECTION B — SAME-ROW SERVER AUTHORITY (executed, not described)
// =============================================================================

check("B1: a server-bound row id wins, and an agreeing body id changes nothing", () => {
  const r = resolveAssistedRowBinding({ contextListingId: "row-1", requestedAction: "save_for_client", bodyListingId: "row-1" });
  assert.equal(r.ok, true);
  assert.equal((r as { listingId: string }).listingId, "row-1");
  assert.equal((r as { serverBound: boolean }).serverBound, true);
});

check("B2: a body id that DISAGREES with the bound row fails closed — it never picks a side", () => {
  const r = resolveAssistedRowBinding({ contextListingId: "row-1", requestedAction: "save_for_client", bodyListingId: "row-2" });
  assert.equal(r.ok, false);
  assert.equal((r as { error: string }).error, "assisted_listing_mismatch");
  assert.equal((r as { status: number }).status, 409);
});

check("B3: before the row exists the body id is passed through UNBOUND (custody must still prove it)", () => {
  const r = resolveAssistedRowBinding({ contextListingId: null, requestedAction: "save_for_client", bodyListingId: "row-9" });
  assert.equal(r.ok, true);
  assert.equal((r as { serverBound: boolean }).serverBound, false, "an unproven claim must not be reported as server-bound");
});

check("B4: a context minted for one assisted action is not authority for another", () => {
  const r = resolveAssistedRowBinding({
    contextListingId: "row-1",
    contextAssistedAction: "save_for_client",
    requestedAction: "publish_for_client",
  });
  assert.equal(r.ok, false);
  assert.equal((r as { error: string }).error, "assisted_action_not_authorized");
  assert.equal((r as { status: number }).status, 403);
});

check("B5: a category mismatch is refused for every category pair", () => {
  for (const a of QUICK_SALES_CATEGORIES) {
    for (const b of QUICK_SALES_CATEGORIES) {
      const refusal = assertAssistedIdentity({ contextCategory: a, expectedCategory: b, contextBusinessId: "biz-1" });
      if (a === b) assert.equal(refusal, null, `${a} must serve itself`);
      else assert.equal(refusal?.error, "assisted_category_mismatch", `${a} must not serve ${b}`);
    }
  }
});

check("B6: a request naming a different business than the context is refused", () => {
  const refusal = assertAssistedIdentity({
    contextCategory: "autos",
    expectedCategory: "autos",
    contextBusinessId: "biz-1",
    requestBusinessId: "biz-2",
  });
  assert.equal(refusal?.error, "assisted_business_mismatch");
  assert.equal(refusal?.status, 409);
});

check("B7: every category maps to exactly one canonical table and one EXISTING intake", () => {
  const sources = new Set<string>();
  for (const key of QUICK_SALES_CATEGORIES) {
    const d = QUICK_SALES_CATEGORY_MAP[key];
    assert.equal(d.category, key);
    assert.ok(d.saveEndpoint.startsWith("/api/"), "the save endpoint must be a real API route");
    if (key === "servicios") {
      assert.equal(d.intakePath, "/publicar/negocio-rapido/servicios", "Servicios staff doorway is the existing Quick application, not the checkpoint redirect");
    } else {
      assert.ok(d.intakePath.startsWith("/clasificados/"), "the intake must be the category's existing one");
    }
    sources.add(d.listingSource);
  }
  assert.equal(sources.size, 4, "four categories, four distinct canonical tables");
});

// =============================================================================
// SECTION C — THE WORKSPACE ROUTES, IMPORTED AND CALLED
// =============================================================================

const STAFF_EMAIL = "sales@leonix.test";
const STAFF_AUTH = "00000000-0000-4000-8000-000000000staff";
const ROSTER_ID = "roster-1";
const BIZ = "biz-1";
const CLIENT = "00000000-0000-4000-8000-00000000client";

function signInAsSalesStaff(role = "super_admin"): void {
  __setCookies({
    leonix_admin: "1",
    leonix_admin_operator_email: STAFF_EMAIL,
    leonix_admin_auth_user_id: STAFF_AUTH,
  });
  __setAuthUsers([{ id: STAFF_AUTH, email: STAFF_EMAIL }]);
  __seed("admin_team_members", [
    { id: ROSTER_ID, email: STAFF_EMAIL, display_name: "Sales", role, is_active: true, auth_user_id: STAFF_AUTH },
  ]);
}

function signOut(): void {
  __setCookies({});
  __setAuthUsers([]);
  __seed("admin_team_members", []);
}

/** A request whose cookie jar the test controls, as the assisted routes read it. */
function makeRequest(body: unknown, cookieJar: Record<string, string> = {}) {
  return {
    json: async () => body,
    cookies: {
      get: (name: string) => (name in cookieJar ? { name, value: cookieJar[name] } : undefined),
    },
    nextUrl: new URL("http://harness.invalid/api"),
  } as never;
}

function assistedCookie(input: {
  category: string;
  listingId?: string | null;
  businessId?: string;
  rosterId?: string;
  authUserId?: string;
}): string {
  return createAssistedPublishingTokenWithSecret(
    {
      businessId: input.businessId ?? BIZ,
      category: input.category,
      rosterId: input.rosterId ?? ROSTER_ID,
      authUserId: input.authUserId ?? STAFF_AUTH,
      listingId: input.listingId ?? null,
      assistedAction: "save_for_client",
    },
    ASSISTED_SECRET,
  )!;
}

/** Custody ledger row shape as `isListingLinkedToBusiness` reads it. */
function linkRow(listingSource: string, listingId: string, businessId = BIZ) {
  return {
    id: `link-${listingId}`,
    business_id: businessId,
    listing_source: listingSource,
    listing_id: listingId,
    status: "verified",
    linked_by: STAFF_AUTH,
  };
}


/** A COMPLETE stored row per category, as the canonical publish contract reads it back. */
function readyRowsFor(category: ProspectPreviewCategory): Record<string, unknown>[] {
  const day = { closed: false, openTime: "09:00", closeTime: "17:00" };
  switch (category) {
    case "servicios":
      return [{
        id: "row-1", slug: "sol", business_name: "Taquería Sol", city: "San José", listing_status: "draft", owner_user_id: null, published_at: null,
        profile_json: {
          identity: { slug: "sol", businessName: "Taquería Sol" },
          hero: { coverImageUrl: "https://cdn.example.test/cover.jpg" },
          contact: { phone: "4085551234" },
          about: { text: "Servicio confiable en San José desde 2010." },
          services: [{ id: "s1", title: "Reparación de fugas" }],
          gallery: [],
          opsMeta: { businessTypeId: "plomeria" },
        },
      }];
    case "restaurantes":
      return [{
        id: "row-1", slug: "sol", draft_listing_id: "draft-1", status: "pending_payment", owner_user_id: null, published_at: null,
        listing_json: { draftListingId: "draft-1", businessName: "Taquería Sol", businessType: "restaurant", primaryCuisine: "mexican", cityCanonical: "San José", heroImage: "https://cdn.example.test/hero.jpg", phoneNumber: "9150000000", serviceModes: ["dine_in"], monday: day, tuesday: day, wednesday: day, thursday: day, friday: day, saturday: day, sunday: day },
      }];
    case "autos":
      return [
        { id: "row-1", status: "draft", inventory_role: "main", listing_payload: { businessName: "Dealer Uno" }, published_at: null, created_at: "2026-09-01T00:00:00Z" },
        { id: "row-1-v", status: "draft", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "row-1", listing_payload: { images: [{ url: "https://cdn.example.test/car.jpg", role: "vehicle" }] }, published_at: null, created_at: "2026-09-01T00:00:01Z" },
      ];
    case "bienes-raices":
    default:
      return [{ id: "row-1", status: "pending", is_published: false, published_at: null, title: "Oficina", images: ["https://cdn.example.test/house.jpg"] }];
  }
}

async function run() {
  const custody = (await import("../app/api/admin/sales-preview/custody/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
    GET: () => Promise<Response>;
  };
  const previewLink = (await import("../app/api/admin/sales-preview/preview-link/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };
  const workspacePublish = (await import("../app/api/admin/sales-preview/publish/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };
  const autos = (await import("../app/api/clasificados/autos/assisted-publish/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };

  for (const category of QUICK_SALES_CATEGORIES) {
    const descriptor = QUICK_SALES_CATEGORY_MAP[category];

    await checkAsync(`C1[${category}]: an UNAUTHENTICATED caller cannot establish assisted custody`, async () => {
      __reset();
      signOut();
      const res = await custody.POST(makeRequest({ category, businessId: BIZ, clientUserId: CLIENT }));
      assert.equal(res.status >= 400, true, "no staff session must be refused");
      const json = (await res.json()) as { ok?: boolean };
      assert.notEqual(json.ok, true);
    });

    await checkAsync(`C2[${category}]: AUTHORIZED staff establish custody, and the cookie binds the row`, async () => {
      __reset();
      signInAsSalesStaff();
      __seed("business_memberships", [
        { id: "m1", business_id: BIZ, user_id: CLIENT, membership_status: "active", is_primary_owner: true },
      ]);
      __seed("business_listing_links", [linkRow(descriptor.listingSource, "row-1")]);
      const res = await custody.POST(
        makeRequest({ category, businessId: BIZ, clientUserId: CLIENT, listingId: "row-1" }),
      );
      const json = (await res.json()) as { ok?: boolean; listingId?: string };
      assert.equal(res.status, 200, `expected 200, got ${res.status} (${JSON.stringify(json)})`);
      assert.equal(json.ok, true);
      assert.equal(json.listingId, "row-1");
      const setCookie = res.headers.get("set-cookie") ?? "";
      assert.ok(setCookie.includes("leonix_assisted_publish="), "custody must be issued as a server-set cookie");
      assert.ok(/httponly/i.test(setCookie), "the assisted cookie must be httpOnly");
    });

    await checkAsync(`C3[${category}]: a client who is NOT a member of the business is refused`, async () => {
      __reset();
      signInAsSalesStaff();
      __seed("business_memberships", [
        { id: "m1", business_id: "other-biz", user_id: CLIENT, membership_status: "active" },
      ]);
      const res = await custody.POST(makeRequest({ category, businessId: BIZ, clientUserId: CLIENT }));
      const json = (await res.json()) as { error?: string };
      assert.equal(res.status, 403, `expected 403, got ${res.status}`);
      assert.equal(json.error, "client_not_authorized_for_business");
    });

    await checkAsync(`C4[${category}]: a listing this business does not hold can never be bound`, async () => {
      __reset();
      signInAsSalesStaff();
      __seed("business_memberships", [
        { id: "m1", business_id: BIZ, user_id: CLIENT, membership_status: "active" },
      ]);
      __seed("business_listing_links", [linkRow(descriptor.listingSource, "row-1", "someone-else")]);
      const res = await custody.POST(
        makeRequest({ category, businessId: BIZ, clientUserId: CLIENT, listingId: "row-1" }),
      );
      const json = (await res.json()) as { error?: string };
      assert.equal(res.status, 403);
      assert.equal(json.error, "listing_not_linked_to_business");
    });

    await checkAsync(`C5[${category}]: a preview link is issued for the BOUND row, and never for another`, async () => {
      __reset();
      signInAsSalesStaff();
      __seed("business_listing_links", [linkRow(descriptor.listingSource, "row-1")]);
      const jar = { leonix_assisted_publish: assistedCookie({ category, listingId: "row-1" }) };

      const ok = await previewLink.POST(makeRequest({}, jar));
      const okJson = (await ok.json()) as { ok?: boolean; previewPath?: string; listingId?: string };
      assert.equal(ok.status, 200, `expected 200, got ${ok.status} (${JSON.stringify(okJson)})`);
      assert.equal(okJson.listingId, "row-1");
      assert.ok(okJson.previewPath?.includes(`/vista-previa/${category}`), "the link must be category-scoped");
      assert.equal(ok.headers.get("cache-control"), "no-store", "a live preview link is never cached");

      const mismatch = await previewLink.POST(makeRequest({ listingId: "row-2" }, jar));
      assert.equal(mismatch.status, 409, "a body id disagreeing with the bound row must be refused");
    });

    await checkAsync(`C6[${category}]: PUBLISH BEFORE PAYMENT is refused, truthfully, and writes nothing`, async () => {
      __reset();
      signInAsSalesStaff();
      __seed("business_listing_links", [linkRow(descriptor.listingSource, "row-1")]);
      __seed(descriptor.listingSource, [
        { id: "row-1", status: "draft", listing_status: "draft", is_published: false, published_at: null },
      ]);
      const jar = { leonix_assisted_publish: assistedCookie({ category, listingId: "row-1" }) };
      const res = await workspacePublish.POST(makeRequest({}, jar));
      const json = (await res.json()) as { error?: string };
      assert.equal(res.status, 402, `expected 402, got ${res.status} (${JSON.stringify(json)})`);
      assert.equal(json.error, "manual_payment_not_cleared");

      const row = __rows(descriptor.listingSource)[0] as Record<string, unknown>;
      assert.notEqual(row.status, "active", "an unpaid row must not be activated");
      assert.notEqual(row.listing_status, "published", "an unpaid row must not be published");
      assert.notEqual(row.is_published, true, "an unpaid row must never read as public");
      assert.equal(row.published_at, null, "an unpaid row must never be stamped published");

      const audit = __rows("admin_audit_log") as Record<string, unknown>[];
      assert.ok(
        audit.some((a) => a.action === "quick_sales_publish_attempted"),
        "a refused publish must still be audited",
      );
    });

    await checkAsync(`C7[${category}]: AUTHORITATIVE PAYMENT publishes the SAME canonical row — no second listing`, async () => {
      __reset();
      signInAsSalesStaff();
      __seed("business_listing_links", [linkRow(descriptor.listingSource, "row-1")]);
      // QUICK SALES canonical publish readiness (repair 2026-09-22): a cleared payment is no longer
      // enough by itself — the cockpit re-runs the category's own publish contract against the
      // STORED row. The rows seeded here are therefore COMPLETE per that contract; the incomplete
      // variants live in verify-quick-sales-canonical-publish-readiness-01.ts.
      __seed(descriptor.listingSource, readyRowsFor(category));
      __seed("leonix_payment_records", [
        { id: "pay-1", listing_source: descriptor.listingSource, listing_id: "row-1", manual_state: "cleared" },
      ]);
      const jar = { leonix_assisted_publish: assistedCookie({ category, listingId: "row-1" }) };
      const res = await workspacePublish.POST(makeRequest({}, jar));
      const json = (await res.json()) as { ok?: boolean; listingId?: string; error?: string; issues?: string[] };
      // Computed ONCE before the fail-closed branch: the early `return` below narrows `category`,
      // which made the later literal comparison a TS2367 even though the assertion is intended.
      const isBienes = category === "bienes-raices";
      if (isBienes) {
        // Bienes media ROLES are never persisted (only `listings.images` URLs are), so the canonical
        // declared-attribution contract fails CLOSED from stored truth — a known technical blocker,
        // asserted exactly rather than hidden. See verify-quick-sales-canonical-publish-readiness-01 B1.
        assert.equal(res.status, 422, `expected 422, got ${res.status} (${JSON.stringify(json)})`);
        assert.deepEqual(json.issues, ["role_declaration_required"]);
        const rowB = (__rows(descriptor.listingSource) as Record<string, unknown>[]).find((r) => r.id === "row-1")!;
        assert.equal(rowB.is_published, false); assert.equal(rowB.status, "pending");
        return;
      }
      assert.equal(res.status, 200, `expected 200, got ${res.status} (${JSON.stringify(json)})`);
      assert.equal(json.listingId, "row-1", "publication must return the SAME id the prospect reviewed");

      const rows = __rows(descriptor.listingSource) as Record<string, unknown>[];
      assert.equal(rows.length, readyRowsFor(category).length, "publishing must never create a second listing");
      const row = rows.find((r) => r.id === "row-1")!;
      // Each category's own public value — servicios uses a separate lifecycle column, and
      // restaurantes' public state is "published" where autos/bienes use "active".
      if (category === "servicios") assert.equal(row.listing_status, "published");
      else if (category === "restaurantes") assert.equal(row.status, "published");
      else assert.equal(row.status, "active");
      if (isBienes) assert.equal(row.is_published, true);

      const audit = __rows("admin_audit_log") as Record<string, unknown>[];
      const completed = audit.find((a) => a.action === "quick_sales_publish_completed");
      assert.ok(completed, "a completed publication must be audited");
      assert.equal((completed!.meta as Record<string, unknown>).listing_id, "row-1");
      assert.equal((completed!.meta as Record<string, unknown>).payment_state, "cleared");
    });

    await checkAsync(`C8[${category}]: an EXPIRED assisted context cannot publish or issue a preview`, async () => {
      __reset();
      signInAsSalesStaff();
      __seed("business_listing_links", [linkRow(descriptor.listingSource, "row-1")]);
      const stale = createAssistedPublishingTokenWithSecret(
        { businessId: BIZ, category, rosterId: ROSTER_ID, authUserId: STAFF_AUTH, listingId: "row-1", assistedAction: "save_for_client" },
        ASSISTED_SECRET,
        Date.now() - 1000 * 60 * 60 * 24,
      )!;
      const jar = { leonix_assisted_publish: stale };
      assert.equal((await previewLink.POST(makeRequest({}, jar))).status, 403);
      assert.equal((await workspacePublish.POST(makeRequest({}, jar))).status, 403);
    });

    await checkAsync(`C9[${category}]: an ALTERED assisted context (tampered row id) is refused`, async () => {
      __reset();
      signInAsSalesStaff();
      __seed("business_listing_links", [linkRow(descriptor.listingSource, "row-1")]);
      const token = assistedCookie({ category, listingId: "row-1" });
      const [payload, sig] = token.split(".");
      const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8")) as Record<string, unknown>;
      decoded.listingId = "row-STOLEN";
      const altered = `${Buffer.from(JSON.stringify(decoded), "utf8").toString("base64url")}.${sig}`;
      assert.equal((await previewLink.POST(makeRequest({}, { leonix_assisted_publish: altered }))).status, 403);
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION D — AUTOS: the same row, and exactly one vehicle child
  // ---------------------------------------------------------------------------

  const dealerListing = { businessName: "Auto Dealer Uno", city: "Dallas", state: "TX", autosLane: "negocios" };
  const vehicleListing = { businessName: "Auto Dealer Uno", vehicleMake: "Toyota", vehicleModel: "Hilux", autosLane: "negocios" };

  function seedAutosStaff(listingId: string | null) {
    __reset();
    signInAsSalesStaff();
    __seed("business_memberships", [
      { id: "m1", business_id: BIZ, user_id: CLIENT, membership_status: "active", is_primary_owner: true },
    ]);
    if (listingId) __seed("business_listing_links", [linkRow("autos_classifieds_listings", listingId)]);
    return { leonix_assisted_publish: assistedCookie({ category: "autos", listingId }) };
  }

  await checkAsync("D1: Autos — a client who is not a member of the business cannot be written as owner", async () => {
    __reset();
    signInAsSalesStaff();
    __seed("business_memberships", [{ id: "m1", business_id: "other", user_id: CLIENT, membership_status: "active" }]);
    const jar = { leonix_assisted_publish: assistedCookie({ category: "autos", listingId: null }) };
    const res = await autos.POST(
      makeRequest({ assistedAction: "save_for_client", clientUserId: CLIENT, dealerListing }, jar),
    );
    const json = (await res.json()) as { error?: string };
    assert.equal(res.status, 403, `expected 403, got ${res.status} (${JSON.stringify(json)})`);
    assert.equal(json.error, "client_not_authorized_for_business");
    assert.equal(__rows("autos_classifieds_listings").length, 0, "a refused save must write nothing");
  });

  await checkAsync("D2: Autos — a body id disagreeing with the SERVER-BOUND row is refused", async () => {
    const jar = seedAutosStaff("row-1");
    const res = await autos.POST(
      makeRequest(
        { assistedAction: "save_for_client", clientUserId: CLIENT, dealerListing, existingMainListingId: "row-OTHER" },
        jar,
      ),
    );
    const json = (await res.json()) as { error?: string };
    assert.equal(res.status, 409, `expected 409, got ${res.status} (${JSON.stringify(json)})`);
    assert.equal(json.error, "assisted_listing_mismatch");
  });

  await checkAsync("D3: Autos — the context authorizes save_for_client, not publish_for_client", async () => {
    const jar = seedAutosStaff("row-1");
    const res = await autos.POST(
      makeRequest({ assistedAction: "publish_for_client", clientUserId: CLIENT, dealerListing, vehicleListing }, jar),
    );
    const json = (await res.json()) as { error?: string };
    assert.equal(json.error, "assisted_action_not_authorized", `got ${JSON.stringify(json)}`);
    assert.equal(res.status, 403);
  });

  await checkAsync("D4: Autos — a repeated save UPDATES the same row and never adds a second vehicle child", async () => {
    const jar = seedAutosStaff(null);
    const first = await autos.POST(
      makeRequest({ assistedAction: "save_for_client", clientUserId: CLIENT, dealerListing, vehicleListing }, jar),
    );
    const firstJson = (await first.json()) as { ok?: boolean; mainListingId?: string; vehicleListingId?: string; error?: string };
    assert.equal(first.status, 200, `first save failed: ${JSON.stringify(firstJson)}`);
    const mainId = firstJson.mainListingId!;
    const vehicleId = firstJson.vehicleListingId!;
    assert.ok(mainId && vehicleId);

    const afterFirst = __rows("autos_classifieds_listings") as Record<string, unknown>[];
    assert.equal(afterFirst.length, 2, "first save: one dealer row + one vehicle child");
    assert.equal(afterFirst.find((r) => r.id === mainId)!.status, "draft", "a save must never be public");

    // The second save arrives with the SERVER-BOUND id, exactly as the custody endpoint re-mints it.
    const jar2 = {
      leonix_assisted_publish: assistedCookie({ category: "autos", listingId: mainId }),
    };
    __seed("business_listing_links", [
      linkRow("autos_classifieds_listings", mainId),
      linkRow("autos_classifieds_listings", vehicleId),
    ]);
    const second = await autos.POST(
      makeRequest(
        {
          assistedAction: "save_for_client",
          clientUserId: CLIENT,
          dealerListing: { ...dealerListing, businessName: "Auto Dealer Uno (corregido)" },
          vehicleListing: { ...vehicleListing, vehicleModel: "Tacoma" },
        },
        jar2,
      ),
    );
    const secondJson = (await second.json()) as { ok?: boolean; mainListingId?: string; vehicleListingId?: string; error?: string };
    assert.equal(second.status, 200, `second save failed: ${JSON.stringify(secondJson)}`);
    assert.equal(secondJson.mainListingId, mainId, "a repeated save must target the SAME canonical row");
    assert.equal(secondJson.vehicleListingId, vehicleId, "a repeated save must reuse the SAME vehicle child");

    const afterSecond = __rows("autos_classifieds_listings") as Record<string, unknown>[];
    assert.equal(afterSecond.length, 2, "a repeated save must not duplicate the listing or its vehicle children");
  });

  await checkAsync("D4b: Autos — a body clientUserId that disagrees with the BOUND customer is refused", async () => {
    __reset();
    signInAsSalesStaff();
    __seed("business_memberships", [
      { id: "m1", business_id: BIZ, user_id: CLIENT, membership_status: "active" },
      { id: "m2", business_id: BIZ, user_id: "00000000-0000-4000-8000-0000000other", membership_status: "active" },
    ]);
    // Both customers are real, active members of this business — membership alone cannot tell them
    // apart. The context was established for one of them, so only that one may be written.
    const jar = {
      leonix_assisted_publish: createAssistedPublishingTokenWithSecret(
        { businessId: BIZ, category: "autos", rosterId: ROSTER_ID, authUserId: STAFF_AUTH, clientUserId: CLIENT, assistedAction: "save_for_client" },
        ASSISTED_SECRET,
      )!,
    };
    const res = await autos.POST(
      makeRequest({ assistedAction: "save_for_client", clientUserId: "00000000-0000-4000-8000-0000000other", dealerListing }, jar),
    );
    const json = (await res.json()) as { error?: string };
    assert.equal(res.status, 409, `expected 409, got ${res.status} (${JSON.stringify(json)})`);
    assert.equal(json.error, "assisted_client_mismatch");
    assert.equal(__rows("autos_classifieds_listings").length, 0, "a refused save must write nothing");
  });

  await checkAsync("D5: Autos — every save and refusal names the staff actor in the audit log", async () => {
    const jar = seedAutosStaff(null);
    await autos.POST(makeRequest({ assistedAction: "save_for_client", clientUserId: CLIENT, dealerListing }, jar));
    const audit = __rows("admin_audit_log") as Record<string, unknown>[];
    const row = audit.find((a) => a.action === "quick_sales_save_for_client");
    assert.ok(row, "an assisted save must be audited");
    const meta = row!.meta as Record<string, unknown>;
    assert.equal(meta.category, "autos");
    assert.equal(meta.business_id, BIZ);
    assert.equal(meta.client_user_id, CLIENT);
    assert.equal(meta.outcome, "ok");
    assert.equal(meta.assisted_roster_id, ROSTER_ID, "the audit must name the staff actor the assisted context was minted for");
  });

  await checkAsync("D6: no audit row anywhere carries a token, a secret, or a raw credential", async () => {
    const audit = __rows("admin_audit_log") as Record<string, unknown>[];
    const serialized = JSON.stringify(audit);
    assert.equal(serialized.includes(PREVIEW_SECRET), false, "a signing secret must never reach an audit row");
    assert.equal(serialized.includes(ASSISTED_SECRET), false, "a signing secret must never reach an audit row");
    for (const key of ["previewToken", "preview_token", "\"token\"", "secret"]) {
      assert.equal(serialized.includes(key), false, `audit rows must not carry ${key}`);
    }
  });

  // ---------------------------------------------------------------------------
  // SECTION E — THE PROSPECT SIDE: reading with no staff authority, and no way to write
  // ---------------------------------------------------------------------------

  const reader = await import("../app/lib/sales/prospectPreviewReader");

  await checkAsync("E1: a prospect with NO staff session and NO cookies can open a valid preview", async () => {
    __reset();
    signOut(); // no admin cookie, no roster, no auth user — a stranger on their own phone
    __seed("business_listing_links", [linkRow("servicios_public_listings", "row-1")]);
    __seed("servicios_public_listings", [
      { id: "row-1", slug: "taller-uno", business_name: "Taller Uno", city: "Dallas", state: "TX", listing_status: "draft", profile_json: { businessName: "Taller Uno", tagline: "Servicio rápido" } },
    ]);
    const ctx = verifyProspectPreviewTokenWithSecret(mintPreview("servicios", "row-1")!, "servicios", PREVIEW_SECRET, NOW + 1000)!;
    const payload = await reader.readProspectPreviewPayload(ctx);
    assert.ok(payload, "a valid preview must render for a prospect with no permissions at all");
    assert.equal(payload!.title, "Taller Uno");
    assert.equal(payload!.isPublic, false, "a preview must report the draft as NOT public");
    assert.equal(payload!.lifecycleState, "draft");
  });

  await checkAsync("E2: VIEWING A PREVIEW NEVER PUBLISHES THE LISTING", async () => {
    const before = JSON.stringify(__rows("servicios_public_listings"));
    const ctx = verifyProspectPreviewTokenWithSecret(mintPreview("servicios", "row-1")!, "servicios", PREVIEW_SECRET, NOW + 1000)!;
    await reader.readProspectPreviewPayload(ctx);
    await reader.readProspectPreviewPayload(ctx);
    assert.equal(JSON.stringify(__rows("servicios_public_listings")), before, "reading a preview must not change one column");
  });

  await checkAsync("E3: a preview whose CUSTODY was revoked stops working, valid signature or not", async () => {
    __seed("business_listing_links", []);
    const ctx = verifyProspectPreviewTokenWithSecret(mintPreview("servicios", "row-1")!, "servicios", PREVIEW_SECRET, NOW + 1000)!;
    assert.equal(await reader.readProspectPreviewPayload(ctx), null);
  });

  await checkAsync("E4: the preview read exposes no owner, payment or internal column", async () => {
    __reset();
    signOut();
    __seed("business_listing_links", [linkRow("listings", "row-1")]);
    __seed("listings", [
      {
        id: "row-1",
        title: "Local comercial",
        description: "Excelente ubicación",
        city: "Dallas",
        state: "TX",
        price: 1200,
        status: "pending",
        is_published: false,
        owner_id: CLIENT,
        internal_notes: "DO-NOT-SHOW",
        moderation_state: "flagged",
      },
    ]);
    const ctx = verifyProspectPreviewTokenWithSecret(mintPreview("bienes-raices", "row-1")!, "bienes-raices", PREVIEW_SECRET, NOW + 1000)!;
    const payload = await reader.readProspectPreviewPayload(ctx);
    assert.ok(payload);
    const serialized = JSON.stringify(payload);
    assert.equal(serialized.includes("DO-NOT-SHOW"), false, "an internal column must never reach a prospect");
    assert.equal(serialized.includes(CLIENT), false, "an owner id must never reach a prospect");
    assert.equal(serialized.includes("flagged"), false, "a moderation column must never reach a prospect");
    assert.equal(payload!.isPublic, false);
  });

  await checkAsync("E5: the PREVIEW TOKEN buys nothing on a staff route — it is not assisted authority", async () => {
    __reset();
    signInAsSalesStaff();
    __seed("business_listing_links", [linkRow("servicios_public_listings", "row-1")]);
    // The prospect's own token, presented as though it were the assisted cookie.
    const jar = { leonix_assisted_publish: mintPreview("servicios", "row-1")! };
    assert.equal((await previewLink.POST(makeRequest({}, jar))).status, 403, "a preview token must not mint preview links");
    assert.equal((await workspacePublish.POST(makeRequest({}, jar))).status, 403, "a preview token must not publish");
    assert.equal(
      (await autos.POST(makeRequest({ assistedAction: "save_for_client", clientUserId: CLIENT, dealerListing }, jar))).status,
      403,
      "a preview token must not save on a customer's behalf",
    );
  });
}

run()
  .then(() => {
    if (failures.length) {
      for (const f of failures) console.error(`  FAIL ${f}`);
      console.error(`verify-quick-sales-preview-01: ${failures.length}/${checks} FAILED`);
      process.exit(1);
    }
    console.log(
      `verify-quick-sales-preview-01: OK (${checks} executed checks — 4 categories, real token attacks, real route calls, no DB, no network)`,
    );
  })
  .catch((e) => {
    console.error("verify-quick-sales-preview-01: harness crashed", e);
    process.exit(1);
  });
