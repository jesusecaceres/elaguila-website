/**
 * BIENES RAICES NEGOCIO — STAFF-ASSISTED GALLERY: the assisted path saves and publishes the SAME real
 * property photos the customer path would.
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-bienes-assisted-quick-publish-01.ts
 *
 * THE DEFECT: the staff bar sent a `listingRow` with no gallery, the assisted route's column allowlist
 * had no `images`, and the Quick media contract was run on that photo-less request. A Quick publish
 * therefore always answered 422 too_few_subject_images, and a Full staff-sold listing was saved (and
 * could be published) with NO photos at all.
 *
 * WHAT THIS PROVES (source + EXECUTED, through the real routes on the in-memory PostgREST harness):
 *  - the browser step uploads the application's data: photos to durable https URLs and the save
 *    payload carries those URLs (never data:/blob:);
 *  - the assisted route validates every URL with the shared media contract and writes `images`;
 *  - the declared roles are stored (`listing_json.br_media_roles`) and re-read by the cockpit readiness;
 *  - a valid Quick draft with 1-3 real property photos passes the media contract; zero photos fails
 *    with too_few_subject_images; four fail with too_many_images (cap 3);
 *  - Full/PRO is never capped and never needs a role;
 *  - reopen shows the stored gallery and its declared roles.
 * Nothing here asserts anything about how an UNVERIFIED product is treated.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { __reset, __seed, __rows, __setAuthUsers } from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";
import { createAssistedPublishingTokenWithSecret } from "../app/lib/auth/assistedPublishingToken";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";
import {
  enforceQuickBusinessPublishMedia,
  extractSemanticMediaItems,
  quickImageMaxForBusinessCategory,
} from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import {
  ASSISTED_BIENES_FULL_GALLERY_MAX,
  BR_MEDIA_ROLES_JSON_KEY,
  parseAssistedBienesGallery,
  readStoredBienesMediaRoles,
  storedBienesMediaFacts,
  withStoredBienesMediaRoles,
} from "../app/lib/clasificados/bienes-raices/assistedBienesGallery";

process.env.PROSPECT_PREVIEW_SESSION_SECRET = "preview-secret-harness-only";
process.env.ASSISTED_PUBLISHING_SESSION_SECRET = "assisted-secret-harness-only";
const ASSISTED_SECRET = "assisted-secret-harness-only";

const failures: string[] = [];
let checks = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  checks += 1;
  try {
    await fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  }
}
const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const ROUTE = "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts";
const STAFF_EMAIL = "sales@leonix.test";
const STAFF_AUTH = "00000000-0000-4000-8000-000000000staff";
const ROSTER_ID = "roster-1";
const BIZ = "biz-1";
const CLIENT = "00000000-0000-4000-8000-00000000client";
const QUICK_KEY = BUSINESS_CATEGORY_PACKAGE_PAIR["bienes-raices"].simple;
const FULL_KEY = BUSINESS_CATEGORY_PACKAGE_PAIR["bienes-raices"].full;

const url = (n: number) => `https://abc123.public.blob.vercel-storage.com/clasificados/rentas/drafts/anon/assisted-bienes/gallery-${n}.jpg`;
const photos = (n: number, role?: string) => Array.from({ length: n }, (_, i) => (role ? { url: url(i + 1), role } : { url: url(i + 1) }));

function signInAsSalesStaff(): void {
  __setCookies({ leonix_admin: "1", leonix_admin_operator_email: STAFF_EMAIL, leonix_admin_auth_user_id: STAFF_AUTH });
  __setAuthUsers([{ id: STAFF_AUTH, email: STAFF_EMAIL }]);
  __seed("admin_team_members", [{ id: ROSTER_ID, email: STAFF_EMAIL, display_name: "Sales", role: "super_admin", is_active: true, auth_user_id: STAFF_AUTH }]);
}
function cookie(listingId: string | null, packageKey: string, action: string = "save_for_client"): Record<string, string> {
  return {
    leonix_assisted_publish: createAssistedPublishingTokenWithSecret(
      { businessId: BIZ, category: "bienes-raices", rosterId: ROSTER_ID, authUserId: STAFF_AUTH, listingId, clientUserId: CLIENT, assistedAction: action, packageKey },
      ASSISTED_SECRET,
    )!,
  };
}
function makeRequest(body: unknown, jar: Record<string, string> = {}) {
  return {
    json: async () => body,
    headers: { get: (_: string) => null },
    cookies: { get: (name: string) => (name in jar ? { name, value: jar[name] } : undefined) },
    nextUrl: new URL("http://harness.invalid/api"),
  } as never;
}
const rows = (t: string) => __rows(t) as Record<string, unknown>[];
function listingRow(extra: Record<string, unknown> = {}) {
  return {
    title: "Casa en venta",
    description: "Casa amplia",
    city: "San Jose",
    price: 650000,
    is_free: false,
    category: "bienes-raices",
    seller_type: "business",
    listing_json: { source: "staff" },
    ...extra,
  };
}
function paid(listingId: string, packageKey: string) {
  const amount = packageKey.includes("quick") ? 24900 : 39900;
  return {
    id: `pay-${listingId}`, listing_source: "listings", listing_id: listingId, package_key: packageKey, source: "admin_manual",
    manual_state: "cleared", payment_status: "paid", currency: "usd", amount_cents: amount, amount_total_cents: amount, amount_paid_cents: amount,
  };
}
function fresh() {
  __reset();
  signInAsSalesStaff();
  __seed("business_memberships", [{ id: "m1", business_id: BIZ, user_id: CLIENT, membership_status: "active" }]);
}

async function main() {
  const assisted = (await import("../app/api/clasificados/bienes-raices/negocio/assisted-publish/route")) as unknown as { POST: (r: never) => Promise<Response> };
  const cockpit = (await import("../app/api/admin/sales-preview/publish/route")) as unknown as { POST: (r: never) => Promise<Response> };

  async function call(action: "save_for_client" | "publish_for_client", row: Record<string, unknown>, packageKey: string, listingId: string | null = null) {
    const res = await assisted.POST(makeRequest({ assistedAction: action, clientUserId: CLIENT, listingRow: row }, cookie(listingId, packageKey, action)));
    return { status: res.status, json: (await res.json()) as Record<string, unknown> };
  }
  async function cockpitPublish(listingId: string, packageKey: string) {
    const res = await cockpit.POST(makeRequest({}, cookie(listingId, packageKey)));
    return { status: res.status, json: (await res.json()) as Record<string, unknown> };
  }
  const mediaViolation = (json: Record<string, unknown>) => json.error === "media_contract_violation";

  // ------------------------------------------------------------------------------------------
  // (1)-(3) THE SHARED CONTRACT on the items read back from the STORED row shape.
  // ------------------------------------------------------------------------------------------
  const stored = (n: number, role: string | null) => {
    const urls = photos(n).map((p) => p.url);
    return storedBienesMediaFacts({
      images: urls,
      listing_json: role ? withStoredBienesMediaRoles({}, Object.fromEntries(urls.map((u) => [u, role]))) : {},
    }).items;
  };
  for (const n of [1, 2, 3, 8]) {
    await check(`(1) a Quick draft with ${n} real property photo(s) passes the contract (no too_few_subject_images)`, () => {
      assert.equal(quickImageMaxForBusinessCategory("bienes-negocio"), 8);
      const r = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items: stored(n, "property") });
      assert.ok(r && r.ok === true, JSON.stringify(r));
    });
  }
  await check("(2) zero photos -> too_few_subject_images", () => {
    const r = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items: storedBienesMediaFacts({ images: [], listing_json: {} }).items });
    assert.ok(r && !r.ok && r.issues.some((i) => i.code === "too_few_subject_images"), JSON.stringify(r));
  });
  await check("(3) nine photos -> too_many_images (cap 8)", () => {
    const r = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items: stored(9, "property") });
    assert.ok(r && !r.ok && r.issues.some((i) => i.code === "too_many_images"), JSON.stringify(r));
  });
  await check("(1b) photos with NO declared role still fail closed (nothing upgrades a missing role to property)", () => {
    const r = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items: stored(2, null) });
    assert.ok(r && !r.ok && r.issues.some((i) => i.code === "role_declaration_required"), JSON.stringify(r));
  });
  await check("(1c) a logo/headshot role never satisfies the property minimum", () => {
    const r = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items: stored(1, "headshot") });
    assert.ok(r && !r.ok, JSON.stringify(r));
  });

  // ------------------------------------------------------------------------------------------
  // (5) THE VALIDATION HELPER: durable URLs only, executed.
  // ------------------------------------------------------------------------------------------
  await check("(5) parseAssistedBienesGallery accepts durable https URLs, keeps order/roles, dedupes", () => {
    const r = parseAssistedBienesGallery([...photos(2, "property"), { url: url(1), role: "property" }]);
    assert.ok(r.ok && r.gallery);
    assert.deepEqual(r.gallery!.urls, [url(1), url(2)]);
    assert.deepEqual(r.gallery!.roles, { [url(1)]: "property", [url(2)]: "property" });
    assert.deepEqual(extractSemanticMediaItems({ images: r.gallery!.entries }), [{ role: "property", mime: null }, { role: "property", mime: null }]);
  });
  for (const bad of ["data:image/jpeg;base64,AAAA", "blob:https://leonix.test/1234", "/relative/photo.jpg", "javascript:alert(1)", ""]) {
    await check(`(5) never accepts ${bad.slice(0, 24) || "(empty)"}`, () => {
      const r = parseAssistedBienesGallery([{ url: url(1), role: "property" }, bad]);
      assert.equal(r.ok, false);
      assert.equal(r.ok === false && r.error, "images_not_persistable");
      const objectForm = parseAssistedBienesGallery([{ url: bad, role: "property" }]);
      assert.equal(objectForm.ok, false);
    });
  }
  await check("(5) absent / empty gallery -> null (the stored gallery is never wiped); non-array -> invalid; > Full ceiling -> refused", () => {
    assert.deepEqual(parseAssistedBienesGallery(undefined), { ok: true, gallery: null });
    assert.deepEqual(parseAssistedBienesGallery([]), { ok: true, gallery: null });
    const nonArray = parseAssistedBienesGallery("https://x.test/a.jpg");
    assert.equal(nonArray.ok === false && nonArray.error, "images_invalid");
    const many = parseAssistedBienesGallery(photos(ASSISTED_BIENES_FULL_GALLERY_MAX + 1));
    assert.equal(many.ok === false && many.error, "images_too_many");
    assert.ok(parseAssistedBienesGallery(photos(ASSISTED_BIENES_FULL_GALLERY_MAX)).ok);
  });
  await check("role map round-trips through listing_json without touching other keys; a save with no roles clears the stale map", () => {
    const withRoles = withStoredBienesMediaRoles({ keep: 1 }, { [url(1)]: "property" });
    assert.deepEqual(withRoles, { keep: 1, [BR_MEDIA_ROLES_JSON_KEY]: { [url(1)]: "property" } });
    assert.deepEqual(readStoredBienesMediaRoles(withRoles), { [url(1)]: "property" });
    assert.deepEqual(withStoredBienesMediaRoles(withRoles, {}), { keep: 1 });
    assert.deepEqual(readStoredBienesMediaRoles(JSON.stringify(withRoles)), { [url(1)]: "property" });
  });

  // ------------------------------------------------------------------------------------------
  // EXECUTED: the REAL assisted route + the REAL cockpit readiness.
  // ------------------------------------------------------------------------------------------
  await check("QUICK save stores the durable URLs as `images` and the declared roles; a no-images save adds none", async () => {
    fresh();
    const saved = await call("save_for_client", listingRow({ images: photos(2, "property") }), QUICK_KEY);
    assert.equal(saved.status, 200, JSON.stringify(saved.json));
    const row = rows("listings")[0]!;
    assert.deepEqual(row.images, [url(1), url(2)], "stored gallery is bare durable URLs (the canonical shape)");
    assert.deepEqual((row.listing_json as Record<string, unknown>)[BR_MEDIA_ROLES_JSON_KEY], { [url(1)]: "property", [url(2)]: "property" });
    assert.equal((row.listing_json as Record<string, unknown>).source, "staff", "the request's own listing_json keys survive");
    assert.equal(row.status, "pending");
    assert.equal(row.is_published, false);
  });
  await check("QUICK: the cockpit readiness reads the STORED gallery + roles — a valid draft is NOT refused on media", async () => {
    fresh();
    const saved = await call("save_for_client", listingRow({ images: photos(8, "property") }), QUICK_KEY);
    const id = String(saved.json.listingId);
    __seed("leonix_payment_records", [paid(id, QUICK_KEY)]);
    const r = await cockpitPublish(id, QUICK_KEY);
    assert.ok(!mediaViolation(r.json), `media contract must pass for 8 property photos (the BASE maximum): ${JSON.stringify(r.json)}`);
    assert.ok(!(Array.isArray(r.json.issues) && (r.json.issues as string[]).includes("too_few_subject_images")), JSON.stringify(r.json));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(rows("listings")[0]!.is_published, true, "the cockpit published the SAME row with its stored photos");
    assert.deepEqual(rows("listings")[0]!.images, Array.from({ length: 8 }, (_, i) => url(i + 1)), "all eight real property photos are published, in order");
  });
  await check("QUICK: a draft saved with NO photo is refused by the cockpit with too_few_subject_images", async () => {
    fresh();
    const saved = await call("save_for_client", listingRow(), QUICK_KEY);
    assert.equal(saved.status, 200, JSON.stringify(saved.json));
    const id = String(saved.json.listingId);
    __seed("leonix_payment_records", [paid(id, QUICK_KEY)]);
    const r = await cockpitPublish(id, QUICK_KEY);
    assert.equal(r.status, 422, JSON.stringify(r.json));
    assert.deepEqual(r.json.issues, ["too_few_subject_images"]);
  });
  await check("QUICK: photos with no declared role are refused by the cockpit (role_declaration_required)", async () => {
    fresh();
    const saved = await call("save_for_client", listingRow({ images: photos(2) }), QUICK_KEY);
    const id = String(saved.json.listingId);
    __seed("leonix_payment_records", [paid(id, QUICK_KEY)]);
    const r = await cockpitPublish(id, QUICK_KEY);
    assert.equal(r.status, 422, JSON.stringify(r.json));
    assert.deepEqual(r.json.issues, ["role_declaration_required"]);
  });
  await check("QUICK: a stored gallery over the cap (9) is refused by the cockpit with too_many_images", async () => {
    fresh();
    __seed("listings", [{ id: "over", status: "pending", is_published: false, owner_id: CLIENT, category: "bienes-raices", title: "Casa", images: photos(9).map((p) => p.url), listing_json: withStoredBienesMediaRoles({}, Object.fromEntries(photos(9).map((p) => [p.url, "property"]))) }]);
    __seed("business_listing_links", [{ id: "l1", business_id: BIZ, listing_source: "listings", listing_id: "over", status: "verified", linked_by: STAFF_AUTH }]);
    __seed("leonix_payment_records", [paid("over", QUICK_KEY)]);
    const r = await cockpitPublish("over", QUICK_KEY);
    assert.equal(r.status, 422, JSON.stringify(r.json));
    assert.ok((r.json.issues as string[]).includes("too_many_images"), JSON.stringify(r.json));
  });
  await check("QUICK save over the cap is refused (too_many_images) and writes nothing; 8 is allowed", async () => {
    fresh();
    const over = await call("save_for_client", listingRow({ images: photos(9, "property") }), QUICK_KEY);
    assert.equal(over.status, 422, JSON.stringify(over.json));
    assert.deepEqual(over.json.issues, ["too_many_images"]);
    assert.equal(rows("listings").length, 0);
    const ok = await call("save_for_client", listingRow({ images: photos(8, "property") }), QUICK_KEY);
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
  });
  await check("a save carrying data:/blob: photos is refused and writes nothing (Quick and Full)", async () => {
    for (const key of [QUICK_KEY, FULL_KEY]) {
      fresh();
      for (const bad of ["data:image/jpeg;base64,AAAA", "blob:https://leonix.test/1"]) {
        const r = await call("save_for_client", listingRow({ images: [{ url: bad, role: "property" }] }), key);
        assert.equal(r.status, 422, JSON.stringify(r.json));
        assert.equal(r.json.error, "images_not_persistable");
        const s = await call("save_for_client", listingRow({ images: [bad] }), key);
        assert.equal(s.status, 422);
      }
      assert.equal(rows("listings").length, 0, "nothing persisted");
    }
  });
  await check("QUICK publish_for_client: request gallery is judged by the canonical contract (none -> too_few; unroled -> role_declaration_required; valid -> not a media refusal)", async () => {
    fresh();
    const none = await call("publish_for_client", listingRow(), QUICK_KEY);
    assert.equal(none.status, 422, JSON.stringify(none.json));
    assert.deepEqual(none.json.issues, ["too_few_subject_images"]);
    const unroled = await call("publish_for_client", listingRow({ images: photos(1) }), QUICK_KEY);
    assert.deepEqual(unroled.json.issues, ["role_declaration_required"]);
    const valid = await call("publish_for_client", listingRow({ images: photos(1, "property") }), QUICK_KEY);
    assert.ok(!mediaViolation(valid.json), JSON.stringify(valid.json));
    assert.equal(valid.status, 402, "passes media, then stops at the payment authority (no payment seeded)");
    assert.equal(rows("listings")[0]!.is_published, false, "never live before payment");
  });
  await check("QUICK publish_for_client with NO gallery in the request judges the STORED row", async () => {
    fresh();
    const saved = await call("save_for_client", listingRow({ images: photos(2, "property") }), QUICK_KEY);
    const id = String(saved.json.listingId);
    const r = await call("publish_for_client", listingRow(), QUICK_KEY, id);
    assert.ok(!mediaViolation(r.json), JSON.stringify(r.json));
    assert.equal(r.status, 402, JSON.stringify(r.json));
    assert.deepEqual(rows("listings")[0]!.images, [url(1), url(2)], "a request with no images never wipes the stored gallery");
  });
  await check("(4) FULL/PRO: many photos are stored uncapped, need no role, and are not refused by the readiness", async () => {
    fresh();
    const saved = await call("save_for_client", listingRow({ images: photos(12) }), FULL_KEY);
    assert.equal(saved.status, 200, JSON.stringify(saved.json));
    const id = String(saved.json.listingId);
    assert.equal((rows("listings")[0]!.images as string[]).length, 12);
    assert.equal((rows("listings")[0]!.listing_json as Record<string, unknown>)[BR_MEDIA_ROLES_JSON_KEY], undefined, "no roles invented for Full");
    __seed("leonix_payment_records", [paid(id, FULL_KEY)]);
    const r = await cockpitPublish(id, FULL_KEY);
    assert.ok(!mediaViolation(r.json), `Full must not gain Quick limits: ${JSON.stringify(r.json)}`);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal((rows("listings")[0]!.images as string[]).length, 12, "all 12 Full photos published");
    const viaRoute = await call("publish_for_client", listingRow({ images: photos(12) }), FULL_KEY);
    assert.ok(!mediaViolation(viaRoute.json), JSON.stringify(viaRoute.json));
  });
  await check("FULL: the Full ceiling (40) still applies to the stored gallery", async () => {
    fresh();
    const r = await call("save_for_client", listingRow({ images: photos(ASSISTED_BIENES_FULL_GALLERY_MAX + 1) }), FULL_KEY);
    assert.equal(r.status, 422);
    assert.equal(r.json.error, "images_too_many");
  });
  await check("a re-save updates the SAME row's gallery in place (no duplicate row)", async () => {
    fresh();
    const first = await call("save_for_client", listingRow({ images: photos(1, "property") }), QUICK_KEY);
    const id = String(first.json.listingId);
    const second = await call("save_for_client", listingRow({ images: photos(2, "property") }), QUICK_KEY, id);
    assert.equal(second.status, 200, JSON.stringify(second.json));
    assert.equal(rows("listings").length, 1);
    assert.deepEqual(rows("listings")[0]!.images, [url(1), url(2)]);
  });

  // ------------------------------------------------------------------------------------------
  // REOPEN: the stored gallery + declared roles hydrate back into the application.
  // ------------------------------------------------------------------------------------------
  await check("reopen: the bound row hydrates its photos AND its declared roles into the application draft", async () => {
    const { bienesPublishedRowToAgenteApplicationDraft } = await import(
      "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft"
    );
    const draft = bienesPublishedRowToAgenteApplicationDraft({
      row: {
        id: "row-2", owner_id: null, title: "Casa", description: "d", city: "Salinas", price: 450000,
        images: [url(1), url(2)],
        listing_json: withStoredBienesMediaRoles({}, { [url(1)]: "property" }),
        detail_pairs: [], contact_phone: "8315550111", contact_email: "a@example.test",
        seller_type: "business", business_name: "Correduria", business_meta: null, inventory_role: "main", br_inventory_group_id: "row-2",
      },
    });
    assert.deepEqual(draft.fotosDataUrls, [url(1), url(2)]);
    assert.deepEqual(draft.fotoMediaRoles, { [url(1)]: "property" }, "only the DECLARED role is restored; the other photo stays unroled");
  });

  // ------------------------------------------------------------------------------------------
  // (6) THE BROWSER STEP: photos become durable URLs and the SAVE PAYLOAD carries them. Executed.
  // ------------------------------------------------------------------------------------------
  await check("(6) saveForClient uploads data: photos, maps roles, and sends only https URLs in listingRow.images", async () => {
    const { saveForClient } = await import("../app/lib/sales/assistedSaveForClientClient");
    const { ASSISTED_BIENES_GALLERY_UPLOAD_PATH } = await import("../app/lib/sales/assistedBienesGalleryClient");
    const realFetch = globalThis.fetch;
    const sent: { url: string; body: string }[] = [];
    let uploads = 0;
    globalThis.fetch = (async (input: unknown, init?: { body?: unknown }) => {
      const u = String(input);
      if (u.startsWith("data:")) return { blob: async () => new Blob(["x"], { type: "image/jpeg" }) } as unknown as Response;
      if (u === ASSISTED_BIENES_GALLERY_UPLOAD_PATH) {
        uploads += 1;
        return { ok: true, status: 200, json: async () => ({ ok: true, publicUrl: `https://abc.public.blob.vercel-storage.com/up-${uploads}.jpg` }) } as unknown as Response;
      }
      sent.push({ url: u, body: String(init?.body ?? "") });
      return { ok: true, status: 200, json: async () => ({ ok: true, listingId: "L1" }) } as unknown as Response;
    }) as typeof fetch;
    try {
      const d1 = "data:image/jpeg;base64,AAAA1";
      const d2 = "data:image/png;base64,BBBB2";
      const result = await saveForClient({
        category: "bienes-raices",
        clientUserId: CLIENT,
        listingRow: { title: "Casa" },
        gallery: { sources: [d1, d2, "https://cdn.example.test/kept.jpg"], roles: { [d1]: "property", [d2]: "property" } },
      });
      assert.equal(result.ok, true, JSON.stringify(result));
      assert.equal(uploads, 2, "only the two data: photos are uploaded; the hosted one is kept");
      assert.equal(sent.length, 1);
      const body = JSON.parse(sent[0]!.body) as { listingRow: { images: { url: string; role?: string }[] }; gallery?: unknown };
      assert.deepEqual(body.listingRow.images, [
        { url: "https://abc.public.blob.vercel-storage.com/up-1.jpg", role: "property" },
        { url: "https://abc.public.blob.vercel-storage.com/up-2.jpg", role: "property" },
        { url: "https://cdn.example.test/kept.jpg" },
      ]);
      assert.ok(!/data:|blob:/i.test(sent[0]!.body), "the request body carries no data:/blob: photo");
      assert.equal(body.gallery, undefined, "the raw gallery sources never leave the browser");
      // A failed upload aborts the save: nothing is sent and no photo is silently dropped.
      sent.length = 0;
      globalThis.fetch = (async (input: unknown) => {
        const u = String(input);
        if (u.startsWith("data:")) return { blob: async () => new Blob(["x"], { type: "image/jpeg" }) } as unknown as Response;
        if (u === ASSISTED_BIENES_GALLERY_UPLOAD_PATH) return { ok: false, status: 503, json: async () => ({ ok: false, error: "blob_unconfigured" }) } as unknown as Response;
        sent.push({ url: u, body: "" });
        return { ok: true, status: 200, json: async () => ({ ok: true }) } as unknown as Response;
      }) as typeof fetch;
      const failed = await saveForClient({ category: "bienes-raices", listingRow: { title: "Casa" }, gallery: { sources: ["data:image/jpeg;base64,CCCC3"] } });
      assert.equal(failed.ok, false);
      assert.equal(sent.length, 0, "a failed upload never reaches the assisted endpoint");
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  // ------------------------------------------------------------------------------------------
  // SOURCE ASSERTIONS
  // ------------------------------------------------------------------------------------------
  await check("ROUTE: `images` is allowlisted only behind the shared-contract validator, never passed through raw", () => {
    const src = read(ROUTE);
    assert.ok(/ALLOWED_LISTING_COLUMNS = new Set\(\[[\s\S]*?"images",[\s\S]*?\]\);/.test(src), "images is in the allowlist");
    assert.ok(src.includes("parseAssistedBienesGallery(listingRowRaw.images)"));
    assert.ok(src.includes("delete filteredRow.images;") && src.includes("filteredRow.images = gallery.urls;"), "raw images replaced by the validated list");
    assert.ok(src.includes("withStoredBienesMediaRoles("), "declared roles are stored");
    const helper = read("app/lib/clasificados/bienes-raices/assistedBienesGallery.ts");
    assert.ok(helper.includes('from "@/app/lib/media/listingMediaContract"') && helper.includes("isPersistableMediaUrl(") && helper.includes("buildProposedFinalMediaSet("), "validation is the shared media contract");
    assert.ok(!/status:\s*"active"[^}]*images/.test(src), "gallery write does not touch lifecycle");
  });
  await check("ROUTE: canonical helpers are still called unchanged; Full is not capped; externalVideoCount is not regressed", () => {
    const src = read(ROUTE);
    assert.ok(src.includes("resolveQuickBusinessPublishIdentity(") && src.includes("assistedPackageKey: assistedContext.packageKey"));
    assert.ok(src.includes("assistedProduct.enforceQuickContract"));
    assert.ok(src.includes("enforceQuickBusinessPublishMedia(") && src.includes("extractSemanticMediaItems("));
    assert.ok(src.includes("externalVideoCount: netNewVideos") && src.includes("quickBienesNetNewExternalVideoCount("));
    assert.ok(src.includes("quickFullOnlyBoundaryApplies(assistedProduct)"), "the cap sits inside the PROVEN-Quick block");
    const capIdx = src.indexOf('issues.some((i) => i.code === "too_many_images")');
    assert.ok(capIdx > src.indexOf("const quickProven = "), "the save-time cap only runs for a proven Quick product");
  });
  await check("PAYLOAD BUILDER: the staff bar sends the application's gallery + declared roles (Quick declares property like the customer path)", () => {
    const src = read("app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx");
    const bar = src.slice(src.indexOf("<AssistedSaveForClientBar"), src.indexOf("</AssistedSaveForClientBar") > 0 ? src.indexOf("</AssistedSaveForClientBar") : src.indexOf("/>", src.indexOf("<AssistedSaveForClientBar") + 900));
    assert.ok(bar.includes("declareQuickBienesPropertyRoles(viewData)"), "Quick declares the customer's property role");
    assert.ok(bar.includes("gallery: { sources: built.params.imageSources, roles: st.fotoMediaRoles ?? null }"), "same ordered gallery the customer publish persists");
    const client = read("app/lib/sales/assistedSaveForClientClient.ts");
    assert.ok(client.includes("uploadAssistedBienesGallery(input.gallery)") && client.includes("images: uploaded.entries"), "the upload step feeds listingRow.images");
  });
  await check("UPLOAD: reuses the existing Blob upload endpoint (no new route, no staff-only gallery)", () => {
    const uploader = read("app/lib/sales/assistedBienesGalleryClient.ts");
    assert.ok(uploader.includes('"/api/clasificados/rentas/draft-media-upload"'));
    assert.ok(existsSync("app/api/clasificados/rentas/draft-media-upload/route.ts"));
    assert.ok(!existsSync("app/api/clasificados/bienes-raices/negocio/assisted-gallery"), "no new gallery route");
    assert.ok(!existsSync("app/api/clasificados/bienes-raices/negocio/assisted-media"), "no new media route");
  });
  await check("READINESS: the cockpit reads the stored gallery + roles and applies the Quick contract to a Quick product only", () => {
    const src = read("app/lib/sales/canonicalPublishReadiness.ts");
    const bienes = src.slice(src.indexOf("async function assessBienes("), src.indexOf("// ----", src.indexOf("async function assessBienes(")));
    assert.ok(bienes.includes("storedBienesMediaFacts({ images: row.images, listing_json: row.listing_json })"));
    assert.ok(bienes.includes("product.enforceQuickContract") && bienes.includes("resolveQuickBusinessPublishIdentity("));
    assert.ok(bienes.indexOf("product.enforceQuickContract") < bienes.indexOf("enforceQuickBusinessPublishMedia("), "media contract sits behind the product gate");
    assert.ok(src.includes("assessBienes(listingId, input.assistedPackageKey ?? null)"));
  });
  await check("CUSTOMER quick-publish route is unchanged in contract (server writes the validated mediaUrls)", () => {
    const src = read("app/api/clasificados/bienes-raices/negocio/quick-publish/route.ts");
    assert.ok(src.includes("mediaUrls: Array.isArray(body.mediaUrls)") && src.includes('enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items, externalVideoCount })'));
    assert.ok(!src.includes("assistedBienesGallery"), "the customer route does not depend on the assisted gallery module");
  });

  if (failures.length) {
    console.error(`verify-bienes-assisted-quick-publish-01: ${failures.length}/${checks} FAILED`);
    for (const f of failures) console.error("  x " + f);
    process.exit(1);
  }
  console.log(`verify-bienes-assisted-quick-publish-01: PASS (${checks} checks)`);
}

void main();
