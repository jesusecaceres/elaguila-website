/**
 * CLOSEOUT 2 - EDIT / REPUBLISH SAFETY (golden-survivor semantic port).
 *
 * Ported from integration/category-circuit-closeout-2026-09 (a4a1749b4) scripts/verify-closeout2-edit-safety.ts,
 * trimmed to the parts this port carries: (1) Autos canonical listing identity and (3) the Bienes Raices /
 * Rentas per-application draft key. The FSBO Admin restore, Comida Local resume, Admin delete and
 * Restaurantes first-save sections belong to other port lanes and are NOT asserted here.
 *
 * Adaptations for golden: the core's reuse gate also excludes a Quick Bienes publish (server custody), the
 * Negocios preview declares `basePackageKey` on both PATCH and POST (helper `patchExtras`).
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-closeout2-edit-safety.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

// ── fakes ────────────────────────────────────────────────────────────────────────────────────
class FakeStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  get size() {
    return this.m.size;
  }
}

type Row = { id: string; status: string; lane: string; leonix_ad_id: string };
function makeAutosApi(opts: {
  rows?: Record<string, Row>;
  getStatus?: number; // force GET status
  patchStatus?: number; // force PATCH status
  get404Times?: number;
}) {
  const calls: Array<{ method: string; url: string }> = [];
  let get404 = opts.get404Times ?? 0;
  const rows = opts.rows ?? {};
  let nextId = 1;
  const fetchFn = async (input: string, init?: RequestInit): Promise<Response> => {
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ method, url: input });
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
    if (method === "POST") {
      const id = `new-${nextId++}`;
      rows[id] = { id, status: "draft", lane: "privado", leonix_ad_id: `AUTO-${id}` };
      return json(200, { ok: true, id, leonixAdId: `AUTO-${id}`, status: "draft" });
    }
    const id = decodeURIComponent(input.split("/").pop() as string);
    if (method === "GET") {
      if (opts.getStatus) return json(opts.getStatus, { ok: false });
      if (get404 > 0) {
        get404 -= 1;
        return json(404, { ok: false, error: "not_found" });
      }
      const r = rows[id];
      if (!r) return json(404, { ok: false, error: "not_found" });
      return json(200, { ok: true, id: r.id, status: r.status, lane: r.lane, leonix_ad_id: r.leonix_ad_id });
    }
    if (method === "PATCH") {
      if (opts.patchStatus) return json(opts.patchStatus, { ok: false });
      const r = rows[id];
      if (!r) return json(404, { ok: false });
      return json(200, { ok: true, id: r.id, leonixAdId: r.leonix_ad_id, status: r.status });
    }
    return json(500, {});
  };
  return { fetchFn, calls, rows };
}
async function main() {
  const ident = await import("../app/lib/clasificados/autos/autosCanonicalListingIdentity");
  const dk = await import("../app/(site)/clasificados/lib/realEstateDraftKey");

  const mkStorages = () => ({ session: new FakeStorage(), local: new FakeStorage() });
  const base = { lane: "privado" as const, lang: "es" as const, token: "t", listingPayload: { a: 1 } };

  // ── 1. Autos: one application = one canonical row ────────────────────────────────────────────
  await check("autos: a brand-new application POSTs once and binds the id to the draft (session + local + legacy key)", async () => {
    const st = mkStorages();
    const api = makeAutosApi({});
    const r = await ident.saveAutosListingToCanonicalRow({ ...base, namespace: "u:1", fetchFn: api.fetchFn, storages: st });
    assert.equal(r.ok, true);
    assert.deepEqual(api.calls.map((c) => c.method), ["POST"]);
    assert.ok(st.session.getItem("lx-autos-publish-listing-privado"), "legacy key still written for Inventory Boost / Application");
    assert.ok(st.local.getItem(ident.AUTOS_DRAFT_LISTING_IDENTITY_KEY_PREFIX + "privado"), "survives a new tab");
  });
  await check("autos: a NEW TAB (session storage empty) restores the id from the draft-bound identity and PATCHes - no second row", async () => {
    const st = mkStorages();
    const api = makeAutosApi({});
    const first = await ident.saveAutosListingToCanonicalRow({ ...base, namespace: "u:1", fetchFn: api.fetchFn, storages: st });
    assert.equal(first.ok && first.created, true);
    const newTab = { session: new FakeStorage(), local: st.local };
    const second = await ident.saveAutosListingToCanonicalRow({ ...base, namespace: "u:1", fetchFn: api.fetchFn, storages: newTab });
    assert.equal(second.ok, true);
    assert.equal(second.ok && second.created, false);
    assert.equal(second.ok && first.ok && second.listingId, first.ok && first.listingId, "same UUID");
    assert.equal(second.ok && first.ok && second.leonixAdId, first.ok && first.leonixAdId, "same Leonix Ad ID");
    assert.equal(api.calls.filter((c) => c.method === "POST").length, 1, "exactly one POST ever");
  });
  await check("autos: a failed GET (5xx / network) fails CLOSED - never falls through to POST", async () => {
    const st = mkStorages();
    ident.rememberAutosDraftListingIdentity(st, "privado", "privado", { listingId: "row-1", namespace: "u:1" });
    const api = makeAutosApi({ getStatus: 503 });
    const r = await ident.saveAutosListingToCanonicalRow({ ...base, namespace: "u:1", fetchFn: api.fetchFn, storages: st });
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.code, "unverifiable");
    assert.equal(api.calls.some((c) => c.method === "POST"), false);
    assert.ok(ident.readAutosDraftListingIdentity(st, "privado", "privado", "u:1"), "identity NOT erased by a transient failure");
    const thrown = await ident.saveAutosListingToCanonicalRow({
      ...base,
      namespace: "u:1",
      fetchFn: async () => {
        throw new Error("network");
      },
      storages: st,
    });
    assert.equal(!thrown.ok && thrown.code, "unverifiable");
  });
  await check("autos: a declared id whose row is active / removed / cancelled FAILS CLOSED with a clear message (no duplicate POST)", async () => {
    for (const status of ["active", "removed", "cancelled", "paused"]) {
      const st = mkStorages();
      ident.rememberAutosDraftListingIdentity(st, "privado", "privado", { listingId: "row-1", namespace: "u:1" });
      const api = makeAutosApi({ rows: { "row-1": { id: "row-1", status, lane: "privado", leonix_ad_id: "A-1" } } });
      const r = await ident.saveAutosListingToCanonicalRow({ ...base, namespace: "u:1", fetchFn: api.fetchFn, storages: st });
      assert.equal(!r.ok && r.code, "not_editable", status);
      assert.ok(!r.ok && r.message.length > 20);
      assert.equal(api.calls.some((c) => c.method === "POST"), false, status);
    }
  });
  await check("autos: a failed PATCH (409 / 5xx) fails closed, never POSTs; editable statuses PATCH the same row", async () => {
    for (const [patchStatus, code] of [[409, "not_editable"], [500, "save_failed"]] as const) {
      const st = mkStorages();
      ident.rememberAutosDraftListingIdentity(st, "privado", "privado", { listingId: "row-1", namespace: "u:1" });
      const api = makeAutosApi({ rows: { "row-1": { id: "row-1", status: "pending_payment", lane: "privado", leonix_ad_id: "A-1" } }, patchStatus });
      const r = await ident.saveAutosListingToCanonicalRow({ ...base, namespace: "u:1", fetchFn: api.fetchFn, storages: st });
      assert.equal(!r.ok && r.code, code);
      assert.equal(api.calls.some((c) => c.method === "POST"), false);
    }
    for (const status of ["draft", "pending_payment", "payment_failed"]) {
      const st = mkStorages();
      ident.rememberAutosDraftListingIdentity(st, "privado", "privado", { listingId: "row-1", namespace: "u:1" });
      const api = makeAutosApi({ rows: { "row-1": { id: "row-1", status, lane: "privado", leonix_ad_id: "A-1" } } });
      const r = await ident.saveAutosListingToCanonicalRow({ ...base, namespace: "u:1", fetchFn: api.fetchFn, storages: st });
      assert.equal(r.ok && r.listingId, "row-1", status);
      assert.deepEqual(api.calls.map((c) => c.method), ["GET", "PATCH"]);
    }
  });
  await check("autos: a dashboard-edit `listingId` in the URL is honoured (PATCH-only); missing / wrong-lane rows fail closed", async () => {
    assert.equal(ident.readAutosExplicitListingIdFromSearch("?listingId= abc-123 &lang=es"), "abc-123");
    assert.equal(ident.readAutosExplicitListingIdFromSearch("?lang=es"), null);
    const st = mkStorages();
    const ok = makeAutosApi({ rows: { "row-9": { id: "row-9", status: "pending_payment", lane: "privado", leonix_ad_id: "A-9" } } });
    const r1 = await ident.saveAutosListingToCanonicalRow({ ...base, explicitListingId: "row-9", namespace: "u:1", fetchFn: ok.fetchFn, storages: st });
    assert.equal(r1.ok && r1.listingId, "row-9");
    assert.ok(ident.readAutosDraftListingIdentity(st, "privado", "privado", "u:1"), "explicit id is promoted into the draft-bound identity");
    const missing = makeAutosApi({});
    const r2 = await ident.saveAutosListingToCanonicalRow({ ...base, explicitListingId: "ghost", namespace: "u:1", fetchFn: missing.fetchFn, storages: mkStorages() });
    assert.equal(!r2.ok && r2.code, "not_found");
    assert.equal(missing.calls.some((c) => c.method === "POST"), false);
    const wrong = makeAutosApi({ rows: { "row-9": { id: "row-9", status: "draft", lane: "negocios", leonix_ad_id: "A-9" } } });
    const r3 = await ident.saveAutosListingToCanonicalRow({ ...base, explicitListingId: "row-9", namespace: "u:1", fetchFn: wrong.fetchFn, storages: mkStorages() });
    assert.equal(!r3.ok && r3.code, "wrong_lane");
  });
  await check("autos: a draft-bound id whose row is CONFIRMED absent (404 twice) is treated as no identity; one transient 404 is not", async () => {
    const gone = mkStorages();
    ident.rememberAutosDraftListingIdentity(gone, "privado", "privado", { listingId: "deleted", namespace: "u:1" });
    const a = makeAutosApi({});
    const r = await ident.saveAutosListingToCanonicalRow({ ...base, namespace: "u:1", fetchFn: a.fetchFn, storages: gone });
    assert.equal(r.ok && r.created, true);
    assert.deepEqual(a.calls.map((c) => c.method), ["GET", "GET", "POST"], "double-read before any POST");
    const transient = mkStorages();
    ident.rememberAutosDraftListingIdentity(transient, "privado", "privado", { listingId: "row-1", namespace: "u:1" });
    const b = makeAutosApi({ rows: { "row-1": { id: "row-1", status: "draft", lane: "privado", leonix_ad_id: "A" } }, get404Times: 1 });
    const r2 = await ident.saveAutosListingToCanonicalRow({ ...base, namespace: "u:1", fetchFn: b.fetchFn, storages: transient });
    assert.equal(r2.ok && r2.listingId, "row-1");
    assert.equal(b.calls.some((c) => c.method === "POST"), false, "a single transient 404 never mints a row");
  });
  await check("autos: another account's identity is ignored; inventory-add is its own scope and never adopts the parent id", async () => {
    const st = mkStorages();
    ident.rememberAutosDraftListingIdentity(st, "negocios", "negocios", { listingId: "parent-1", namespace: "u:1" });
    assert.equal(ident.readAutosDraftListingIdentity(st, "negocios", "negocios", "u:2"), null);
    const scope = ident.autosIdentityScope("negocios", "parent-1");
    assert.equal(scope, "negocios:inv:parent-1");
    assert.equal(ident.readAutosDraftListingIdentity(st, scope, "negocios", "u:1"), null, "child scope is independent of the parent's identity");
    const api = makeAutosApi({});
    const r = await ident.saveAutosListingToCanonicalRow({
      lane: "negocios",
      lang: "es",
      token: "t",
      listingPayload: {},
      inventoryParentListingId: "parent-1",
      createExtras: { parentListingId: "parent-1" },
      namespace: "u:1",
      fetchFn: api.fetchFn,
      storages: st,
    });
    assert.equal(r.ok && r.created, true);
    assert.ok(ident.readAutosDraftListingIdentity(st, "negocios", "negocios", "u:1")?.listingId === "parent-1", "parent identity untouched");
  });
  await check("autos (golden adaptation): patchExtras ride on the PATCH body, createExtras on the POST body; neither can redirect the row", async () => {
    const bodies: Array<{ method: string; url: string; body: Record<string, unknown> }> = [];
    const api = makeAutosApi({ rows: { "row-1": { id: "row-1", status: "pending_payment", lane: "negocios", leonix_ad_id: "A-1" } } });
    const spy = async (input: string, init?: RequestInit) => {
      bodies.push({ method: (init?.method ?? "GET").toUpperCase(), url: input, body: init?.body ? JSON.parse(String(init.body)) : {} });
      return api.fetchFn(input, init);
    };
    const st = mkStorages();
    ident.rememberAutosDraftListingIdentity(st, "negocios", "negocios", { listingId: "row-1", namespace: "u:1" });
    const r = await ident.saveAutosListingToCanonicalRow({
      lane: "negocios",
      lang: "es",
      token: "t",
      listingPayload: { x: 1 },
      createExtras: { basePackageKey: "autos_dealer_quick_monthly" },
      patchExtras: { basePackageKey: "autos_dealer_quick_monthly", listing: "HIJACK" },
      namespace: "u:1",
      fetchFn: spy,
      storages: st,
    });
    assert.equal(r.ok && r.listingId, "row-1");
    const patch = bodies.find((b) => b.method === "PATCH");
    assert.equal(patch?.body.basePackageKey, "autos_dealer_quick_monthly");
    assert.deepEqual(patch?.body.listing, { x: 1 }, "an extra can never replace the listing payload");
    assert.match(String(patch?.url), /\/row-1$/, "PATCH targets the declared row");
    const fresh = await ident.saveAutosListingToCanonicalRow({
      lane: "negocios",
      lang: "es",
      token: "t",
      listingPayload: { x: 2 },
      createExtras: { basePackageKey: "autos_dealer_monthly" },
      namespace: "u:1",
      fetchFn: spy,
      storages: mkStorages(),
    });
    assert.equal(fresh.ok && fresh.created, true);
    assert.equal(bodies.find((b) => b.method === "POST")?.body.basePackageKey, "autos_dealer_monthly");
  });
  await check("autos source guards: confirm / privado preview save / negocios preview save use the canonical helper and never fall back to POST-after-failure", () => {
    const core = raw("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
    assert.match(core, /saveAutosListingToCanonicalRow\(\{/);
    assert.ok(!/sessionStorage\.removeItem\(sk\)/.test(core) && !/sessionKey\(lane\)/.test(core), "old erase-and-POST cache removed");
    assert.match(core, /readAutosExplicitListingIdFromSearch\(window\.location\.search\)/);
    assert.match(core, /inventoryCtx\?\.parentListingId \? null : readAutosExplicitListingIdFromSearch/);
    const priv = raw("app/(site)/clasificados/autos/privado/lib/saveAutosPrivadoPendingBeforeCheckout.ts");
    assert.match(priv, /saveAutosListingToCanonicalRow\(\{/);
    assert.match(priv, /existingListingId\?: string \| null;/);
    assert.ok(!/window\.sessionStorage\.removeItem\(SESSION_LISTING_KEY\)/.test(priv));
    assert.ok(!/method: "POST"/.test(priv), "the POST lives only in the guarded helper");
    const neg = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
    assert.match(neg, /saveAutosListingToCanonicalRow\(\{\s*lane: "negocios"/);
    assert.ok(!/readCachedDealerListingId|writeCachedDealerListingId|AUTOS_DEALER_PENDING_CHECKOUT_KEY/.test(neg));
    assert.match(neg, /if \(canonicalListingId\) \{/, "dashboard-edit PATCH-only path preserved");
    // golden adaptation: the Quick/Full declaration still rides on BOTH the PATCH and the POST.
    assert.match(neg, /createExtras: \{ basePackageKey: baseCheckout\.packageKey \}/);
    assert.match(neg, /patchExtras: \{ basePackageKey: baseCheckout\.packageKey \}/);
    // golden: staff Save-for-Client keeps its own server-bound identity (signed custody ctx.listingId), untouched.
    assert.match(core, /<AssistedSaveForClientBar[\s\S]{0,900}listingId: ctx\.listingId,/);
    const hint = raw("app/(site)/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint.ts");
    assert.match(hint, /clearAutosLaneListingIdentity\(getBrowserAutosIdentityStorages\(\), lane\)/, "identity dies with the draft reset");
    const helper = raw("app/lib/clasificados/autos/autosCanonicalListingIdentity.ts");
    assert.equal((helper.match(/method: "POST"/g) ?? []).length, 1, "exactly one POST site");
  });

  // ── 3. BR / Rentas pending-row reuse by draft key ────────────────────────────────────────────
  await check("draft key: stable per (user, category, seller type); survives reads; generated once", () => {
    const st = new FakeStorage();
    const scope = { userId: "u1", category: "bienes-raices", sellerType: "personal" };
    const k1 = dk.getOrCreateRealEstateDraftKey(st, scope);
    const k2 = dk.getOrCreateRealEstateDraftKey(st, scope);
    assert.ok(k1 && k1 === k2);
    assert.notEqual(dk.getOrCreateRealEstateDraftKey(st, { ...scope, sellerType: "business" }), k1, "FSBO and Negocio never share a key");
    assert.notEqual(dk.getOrCreateRealEstateDraftKey(st, { ...scope, category: "rentas" }), k1);
    assert.equal(dk.sanitizeRealEstateDraftKey("../../etc"), null);
    assert.equal(dk.getOrCreateRealEstateDraftKey(null, scope), null);
    // Final identity closeout: clearing now REQUIRES an allowed terminal reason (a reasonless / back / retry clear is a no-op).
    assert.equal(dk.clearRealEstateDraftKey(st, scope, "retry" as never), false);
    assert.equal(dk.getOrCreateRealEstateDraftKey(st, scope), k1, "retry must not clear the key");
    dk.clearRealEstateDraftKey(st, scope, "application_draft_cleared");
    assert.notEqual(dk.getOrCreateRealEstateDraftKey(st, scope), k1, "cleared draft gets a new key");
  });
  await check("draft key: written top-level in listing_json (survives br_publish/rentas_publish rebuilds); lookup order key -> id -> title", () => {
    const j = dk.withRealEstateDraftKeyInListingJson({ br_publish: { payment_status: "pending" } }, "dk_0123456789abcdef0123");
    assert.equal(j && (j as Record<string, unknown>).leonix_draft_key, "dk_0123456789abcdef0123");
    assert.deepEqual((j as Record<string, unknown>).br_publish, { payment_status: "pending" });
    assert.equal(dk.readRealEstateDraftKeyFromListingJson(j), "dk_0123456789abcdef0123");
    assert.equal(dk.REAL_ESTATE_DRAFT_KEY_FILTER_COLUMN, "listing_json->>leonix_draft_key");
    assert.deepEqual(dk.realEstatePendingLookupOrder({ draftKey: "dk_0123456789abcdef0123", existingListingId: "x" }), ["draft_key", "existing_id", "title"]);
    assert.deepEqual(dk.realEstatePendingLookupOrder({}), ["title"], "title is only the last fallback");
    assert.deepEqual(dk.realEstatePendingLookupOrder({ draftKey: "dk_0123456789abcdef0123", isInventoryChild: true }), ["title"], "inventory children never use the application key");
  });
  await check("BR/Rentas core source guards: FSBO in the reuse set, draft key first, title last, marker on the pending row, hard-stop preserved", () => {
    const c = raw("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
    // golden adaptation: the reuse set also excludes a Quick Bienes publish (server custody collapses its retries).
    assert.match(
      c,
      /const reuseEligible =\s*!quickBienesPublish &&\s*params\.activationMode === "pending_payment" &&\s*\(category === "rentas" \|\| category === "bienes-raices"\)/,
    );
    assert.match(c, /let draftKey =\s*!quickBienesPublish &&/, "a Quick Bienes publish derives no draft key (custody payload unchanged)");
    assert.match(c, /if \(quickBienesPublish\) \{[\s\S]{0,2400}publishQuickBienesThroughServerCustody\(supabase, \{/, "Quick Bienes custody branch intact");
    assert.match(c, /realEstatePendingLookupOrder\(\{ draftKey, existingListingId: explicitId, isInventoryChild \}\)/);
    assert.match(c, /q\.eq\(REAL_ESTATE_DRAFT_KEY_FILTER_COLUMN, draftKey\)/);
    assert.match(c, /q\.eq\("title", titlePrep\.titleForDb\)/);
    assert.match(c, /withRealEstateDraftKeyInListingJson\(insertPayload\.listing_json, params\.draftKey\)/);
    assert.match(c, /reusableRealEstatePending\.error/, "a failed lookup still fails closed");
    assert.match(c, /\.eq\("status", "pending"\)[\s\S]{0,80}\.eq\("is_published", false\)/, "status pending + unpublished verified on every tier");
    assert.match(c, /\.eq\("owner_id", userId\)/);
    const w = raw("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts");
    assert.ok((w.match(/existingListingId: opts\?\.existingListingId \?\? null,/g) ?? []).length === 5, "all five publish wrappers thread the id");
    const f = raw("app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx");
    assert.match(f, /existingListingId: cached\?\.listingId \?\? null,/);
    assert.ok(!/if \(cached\) return \{ ok: true, \.\.\.cached \};/.test(f), "FSBO no longer short-circuits past the same-row update");
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
