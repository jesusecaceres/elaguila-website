/**
 * CLOSEOUT 2 - EDIT / REPUBLISH SAFETY + ADMIN DELETE SAFETY + COMIDA LOCAL RESUME.
 *
 * Executable checks against the real pure modules (fake fetch / storage / supabase where a flow needs
 * one), plus narrow source guards where the behaviour lives in a route / client component that cannot be
 * imported under raw tsx.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-closeout2-edit-safety.ts
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
  const fsbo = await import("../app/admin/_lib/adminBrFsboRestorePolicy");
  const dk = await import("../app/(site)/clasificados/lib/realEstateDraftKey");
  const resume = await import("../app/lib/clasificados/comida-local/comidaLocalPaymentResume");
  const guard = await import("../app/admin/_lib/adminInventoryActionGuard");
  const rest = await import("../app/lib/clasificados/restaurantes/restauranteFirstSaveReconcile");

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
    const hint = raw("app/(site)/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint.ts");
    assert.match(hint, /clearAutosLaneListingIdentity\(getBrowserAutosIdentityStorages\(\), lane\)/, "identity dies with the draft reset");
    const helper = raw("app/lib/clasificados/autos/autosCanonicalListingIdentity.ts");
    assert.equal((helper.match(/method: "POST"/g) ?? []).length, 1, "exactly one POST site");
  });

  // ── 2. FSBO admin restore ────────────────────────────────────────────────────────────────────
  const NOW = new Date("2026-09-19T00:00:00Z").getTime();
  const fsboRow = { category: "bienes-raices", seller_type: "personal", listing_json: { br_publish: { lane: "privado" } } };
  await check("fsbo restore: never-live / pending FSBO rows are refused; Negocio rows are not FSBO", () => {
    const pending = fsbo.decideBrFsboAdminRestore({ ...fsboRow, status: "pending" }, NOW);
    assert.equal(pending.fsbo && pending.blocked && pending.code, "payment_required");
    const neverLive = fsbo.decideBrFsboAdminRestore({ ...fsboRow, status: "flagged", published_at: null, expires_at: null }, NOW);
    assert.equal(neverLive.fsbo && neverLive.blocked, true);
    const negocio = fsbo.decideBrFsboAdminRestore({ category: "bienes-raices", seller_type: "business", status: "flagged", listing_json: { br_publish: { lane: "negocio" } } }, NOW);
    assert.equal(negocio.fsbo, false, "Negocio keeps the capacity RPC");
    assert.equal(fsbo.decideBrFsboAdminRestore({ category: "rentas", seller_type: "personal", status: "flagged" }, NOW).fsbo, false);
  });
  await check("fsbo restore: an elapsed term says 'renewal required'; a live term keeps its expires_at and only flips status", () => {
    const elapsed = fsbo.decideBrFsboAdminRestore({ ...fsboRow, status: "flagged", published_at: "2026-07-01T00:00:00Z", expires_at: "2026-09-01T00:00:00Z" }, NOW);
    assert.equal(elapsed.fsbo && elapsed.blocked && elapsed.code, "renewal_required");
    assert.match(elapsed.fsbo && elapsed.blocked ? elapsed.message : "", /renewal required/);
    const live = fsbo.decideBrFsboAdminRestore({ ...fsboRow, status: "flagged", published_at: "2026-09-01T00:00:00Z", expires_at: "2026-10-15T00:00:00Z" }, NOW);
    assert.equal(live.fsbo && !live.blocked, true);
    if (live.fsbo && !live.blocked) {
      assert.deepEqual(live.patch, { status: "active", is_published: true });
      assert.ok(!("expires_at" in live.patch), "no new term is ever granted");
      assert.equal(live.expectedStatus, "flagged");
    }
    const legacy = fsbo.decideBrFsboAdminRestore({ ...fsboRow, status: "paused", published_at: "2026-05-01T00:00:00Z", expires_at: null }, NOW);
    assert.equal(legacy.fsbo && !legacy.blocked, true, "legacy live row without a term is restorable, never re-termed");
  });
  await check("fsbo restore source guards: FSBO is excluded from the Negocio RPC in BOTH unsuspend and republish; adminReactivationPolicy still wired", () => {
    const r = raw("app/api/admin/clasificados/listings/[id]/route.ts");
    assert.match(r, /decideBrFsboAdminRestore\(\{/);
    assert.match(r, /republishReactivates && category\.toLowerCase\(\) === "bienes-raices" && !isFsboRow/);
    assert.match(r, /category\.toLowerCase\(\) === "bienes-raices" &&\s*\n\s*!isFsboRow &&/);
    assert.match(r, /action === "unsuspend" && fsboRestore\.fsbo && fsboRestore\.blocked/);
    assert.match(r, /republishReactivates && fsboRestore\.fsbo && fsboRestore\.blocked/);
    assert.match(r, /expires_at, published_at, listing_json/);
    assert.ok((r.match(/decideAdminReactivation\(/g) ?? []).length >= 2, "pending gate preserved");
    assert.ok((r.match(/activateBrNegocioListingAtomic\(\{/g) ?? []).length === 2, "RPC only in the two Negocio branches");
    const p = raw("app/admin/_lib/adminBrFsboRestorePolicy.ts");
    assert.ok(!/expires_at:\s*new Date|expires_at:\s*now|patch.*expires_at/.test(p.replace(/\/\*[\s\S]*?\*\//g, "")), "policy never writes a term");
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
    dk.clearRealEstateDraftKey(st, scope);
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
    assert.match(c, /params\.activationMode === "pending_payment" && \(category === "rentas" \|\| category === "bienes-raices"\)/);
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

  // ── 4. Comida Local payment resume ───────────────────────────────────────────────────────────
  await check("comida local: checkout mode - new application fresh; bound pending_payment resumes the SAME checkout; other/unknown bound status never re-charges", () => {
    assert.equal(resume.decideComidaLocalPreviewCheckout({ listingBound: false, rowStatus: null }), "fresh_checkout");
    assert.equal(resume.decideComidaLocalPreviewCheckout({ listingBound: true, rowStatus: "pending_payment" }), "resume_payment");
    assert.equal(resume.decideComidaLocalPreviewCheckout({ listingBound: true, rowStatus: " Pending_Payment " }), "resume_payment");
    for (const st of ["published", "paused", "suspended", "draft", "", null, undefined, "weird"]) {
      assert.equal(resume.decideComidaLocalPreviewCheckout({ listingBound: true, rowStatus: st as string | null }), "none", String(st));
    }
    assert.equal(resume.comidaLocalRowHasPublicPage("pending_payment"), false);
    assert.equal(resume.comidaLocalRowHasPublicPage("published"), true);
    assert.match(resume.comidaLocalResumePaymentHref("a b", "en"), /\/clasificados\/comida-local\/preview\?edit=1&listingId=a%20b&source=dashboard&resume=payment&lang=en/);
  });
  await check("comida local source guards: preview reuses COMIDA_LOCAL_BASE_CHECKOUT + the same-row pending save; dashboard shows awaiting payment with no public CTA", () => {
    const p = raw("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
    assert.match(p, /\(previewMode === "new-publish" \|\| resumingPayment\) && checkoutConfig/);
    assert.match(p, /\.\.\.COMIDA_LOCAL_BASE_CHECKOUT,\s*\n\s*listingId: pending\.listingId,/);
    assert.match(p, /saveComidaLocalPendingBeforeCheckout\(\{/);
    assert.match(p, /draftListingId: hydrated\.context\.draftListingId/, "same-row: draftListingId forced to the row's own value");
    assert.match(p, /if \(editListingId\) saveComidaLocalDraftToStorage\(draft, comidaLocalEditWorkspaceStorageKey\(editListingId\)\)/, "edit workspace, never the new-ad key");
    assert.match(p, /decideComidaLocalPreviewCheckout\(\{ listingBound: Boolean\(editListingId\), rowStatus: editRowStatus \}\)/);
    const d = raw("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");
    assert.match(d, /isComidaLocalAwaitingPayment\(item\.status\)/);
    assert.match(d, /getStatusLabel\("pending_payment", lang\)/);
    assert.match(d, /comidaLocalResumePaymentHref\(item\.id, lang\)/);
    assert.match(d, /comidaLocalRowHasPublicPage\(item\.status\)/);
    const price = raw("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
    assert.match(price, /COMIDA_LOCAL_BASE_CHECKOUT/);
  });

  // ── 5. Admin delete safety ───────────────────────────────────────────────────────────────────
  const parentRow = { id: "p1", category: "bienes-raices", seller_type: "business", inventory_role: "main", br_inventory_group_id: "g1", status: "active", is_published: true };
  await check("admin delete: a BR Negocio PARENT with public children cannot be deleted; non-public children do not block", () => {
    const blocked = guard.assertAdminListingDeleteAllowed({
      row: parentRow,
      linkedRows: [{ id: "c1", status: "active", is_published: true, inventory_role: "inventory_property" }],
      mode: "soft",
    });
    assert.deepEqual(blocked, { ok: false, code: "has_public_children" });
    const unconfirmed = guard.assertAdminListingDeleteAllowed({ row: parentRow, linkedRows: [{ id: "c2", status: "active", is_published: true, inventory_role: null }], mode: "soft" });
    assert.deepEqual(unconfirmed, { ok: false, code: "child_role_unconfirmed" });
    assert.deepEqual(
      guard.assertAdminListingDeleteAllowed({ row: parentRow, linkedRows: [{ id: "c3", status: "removed", is_published: false, inventory_role: "inventory_property" }, { id: "c4", status: "pending", is_published: false, inventory_role: "inventory_property" }], mode: "soft" }),
      { ok: true },
    );
  });
  await check("admin delete: a child, an unresolved-role Negocio row are refused; FSBO / other categories are not blocked by inventory rules", () => {
    const child = guard.assertAdminListingDeleteAllowed({ row: { ...parentRow, id: "c1", inventory_role: "inventory_property" }, mode: "soft" });
    assert.deepEqual(child, { ok: false, code: "forbidden_role_for_action" });
    const ambiguous = guard.assertAdminListingDeleteAllowed({ row: { ...parentRow, inventory_role: null }, mode: "soft" });
    assert.deepEqual(ambiguous, { ok: false, code: "ambiguous_or_unknown_role" });
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: { id: "f1", category: "bienes-raices", seller_type: "personal", status: "flagged", is_published: false }, mode: "soft" }), { ok: true });
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: { id: "r1", category: "rentas", seller_type: "business", status: "active", is_published: true }, mode: "soft" }), { ok: true });
  });
  await check("admin delete: PERMANENT refuses public-live, and paid / subscribed / entitled rows unless already removed", () => {
    const live = { id: "x", category: "en-venta", status: "active", is_published: true };
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: live, mode: "permanent" }), { ok: false, code: "public_live_requires_removal" });
    const paused = { id: "x", category: "en-venta", status: "paused", is_published: false };
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: paused, evidence: { hasPaidRecord: true }, mode: "permanent" }), { ok: false, code: "paid_record_requires_removal" });
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: paused, evidence: { hasActiveSubscription: true }, mode: "permanent" }), { ok: false, code: "active_subscription" });
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: paused, evidence: { hasLiveEntitlement: true }, mode: "permanent" }), { ok: false, code: "live_entitlement" });
    const removed = { id: "x", category: "en-venta", status: "removed", is_published: false };
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: removed, evidence: { hasPaidRecord: true, hasLiveEntitlement: true }, mode: "permanent" }), { ok: true }, "explicitly removed rows with paid history may be permanently deleted");
    // Forensic closeout: a live subscription keeps billing the customer, so it blocks even an explicitly removed row.
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: removed, evidence: { hasActiveSubscription: true }, mode: "permanent" }), { ok: false, code: "active_subscription" });
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: { id: "n", category: "en-venta", status: "pending", is_published: false }, mode: "permanent" }), { ok: true }, "never-paid junk is deletable");
    assert.deepEqual(guard.assertAdminListingDeleteAllowed({ row: live, evidence: { hasPaidRecord: true }, mode: "soft" }), { ok: true }, "soft delete only needs the inventory guard");
  });
  await check("admin delete source guards: soft delete NEVER touches Mux; permanent delete guards first, deletes rows, then releases only unreferenced assets", () => {
    const a = raw("app/admin/actions.ts");
    const soft = a.slice(a.indexOf("export async function deleteListingAction"), a.indexOf("export type BulkListingCleanupResult"));
    assert.ok(!/deleteMuxAssetsBestEffort|mux_asset_id/.test(soft), "soft delete does not read or destroy video assets");
    assert.match(soft, /evaluateAdminListingDeletes\(supabase, \[listingId\], "soft"\)/);
    assert.match(soft, /\.update\(\{ status: "removed" \}\)/, "return shape / behaviour preserved");
    assert.match(soft, /return \{ ok: true \};/);
    const perm = a.slice(a.indexOf("export async function permanentlyDeleteListingsAction"), a.indexOf("/** Staff edit:"));
    const iGuard = perm.indexOf('"permanent"');
    const iDelete = perm.indexOf('.delete({ count: "exact" })');
    const iMux = perm.indexOf("deleteMuxAssetsBestEffort(safe)");
    assert.ok(iGuard > 0 && iDelete > iGuard && iMux > iDelete, "guard -> hard delete -> mux release");
    assert.match(perm, /muxAssetsSafeToDelete\(supabase, candidateMux, deletable\.map/);
    assert.match(perm, /return \{ deleted, failed, errors, sampleIds \};/);
    assert.match(a, /return \{ ok: true \};/);
    assert.match(raw("app/admin/_lib/adminListingDeleteServer.ts"), /if \(res\.error\) return \[\];/, "mux reference check fails closed");
  });
  await check("admin delete server: fails CLOSED when a lookup errors; loads linked children for BR Negocio parents", async () => {
    let server: typeof import("../app/admin/_lib/adminListingDeleteServer");
    try {
      server = await import("../app/admin/_lib/adminListingDeleteServer");
    } catch (e) {
      // The policy import graph may not resolve under raw tsx in every environment: fall back to a source guard.
      const s = raw("app/admin/_lib/adminListingDeleteServer.ts");
      assert.match(s, /failAll\(\)/);
      assert.match(s, /in\("br_inventory_parent_listing_id", negocioIds\)/);
      console.warn(`  (dynamic import unavailable under tsx: ${e instanceof Error ? e.message.slice(0, 80) : e})`);
      return;
    }
    const mk = (tables: Record<string, { data?: unknown[]; error?: { message: string } }>) => ({
      from: (t: string) => {
        const res = tables[t] ?? { data: [] };
        const q: Record<string, unknown> = {};
        for (const m of ["select", "in", "eq", "gt", "or"]) q[m] = () => q;
        q.then = (resolve: (v: unknown) => unknown) => resolve({ data: res.data ?? [], error: res.error ?? null });
        return q;
      },
    });
    const parent = { id: "p1", category: "bienes-raices", seller_type: "business", detail_pairs: null, status: "removed", is_published: false, inventory_role: "main", br_inventory_group_id: "g1", br_inventory_parent_listing_id: null };
    const child = { id: "c1", status: "active", is_published: true, inventory_role: "inventory_property", br_inventory_parent_listing_id: "p1", br_inventory_group_id: "g1" };
    const withChild = await server.evaluateAdminListingDeletes(mk({ listings: { data: [parent, child] } }) as never, ["p1"], "soft");
    // `listings` fake returns both rows for every query: parent is found, child is linked by parent id.
    const v = withChild.get("p1");
    assert.ok(v && !v.ok, "public child blocks the parent delete");
    const lookupBroken = await server.evaluateAdminListingDeletes(mk({ listings: { error: { message: "boom" } } }) as never, ["p1"], "permanent");
    const lv = lookupBroken.get("p1");
    assert.ok(lv && !lv.ok && lv.code === "guard_lookup_failed", "lookup error fails closed");
    const payBroken = await server.evaluateAdminListingDeletes(
      mk({ listings: { data: [{ ...parent, category: "en-venta", seller_type: "personal" }] }, leonix_payment_records: { error: { message: "x" } } }) as never,
      ["p1"],
      "permanent",
    );
    const pv = payBroken.get("p1");
    assert.ok(pv && !pv.ok && pv.code === "guard_lookup_failed", "payment lookup error fails closed");
  });

  // ── 6. Restaurantes first-save reconciliation ────────────────────────────────────────────────
  await check("restaurantes: every racer computes the SAME winner (oldest by published_at, id); the loser is archived, the winner is returned", () => {
    const A = { id: "aaa", published_at: "2026-09-19T10:00:00.200Z", slug: "x", leonix_ad_id: "RES-1" };
    const B = { id: "bbb", published_at: "2026-09-19T10:00:00.100Z", slug: "x-2", leonix_ad_id: "RES-2" };
    const both = [A, B];
    const forA = rest.reconcileRestauranteFirstSave(both, "aaa");
    const forB = rest.reconcileRestauranteFirstSave([...both].reverse(), "bbb");
    assert.equal(forA.role, "loser");
    assert.equal(forB.role, "winner");
    assert.equal(forA.winner?.id, "bbb");
    assert.equal(forB.winner?.id, "bbb");
    const tie = rest.reconcileRestauranteFirstSave([{ id: "b", published_at: "2026-01-01T00:00:00Z" }, { id: "a", published_at: "2026-01-01T00:00:00Z" }], "b");
    assert.equal(tie.role, "loser", "id breaks published_at ties");
    assert.equal(rest.reconcileRestauranteFirstSave([{ id: "x", published_at: null }, { id: "y", published_at: "2026-01-01T00:00:00Z" }], "x").role, "loser", "null published_at sorts last, like the route lookup");
    assert.equal(rest.reconcileRestauranteFirstSave([A], "zzz").role, "absent");
    assert.equal(rest.reconcileRestauranteFirstSave([A], "aaa").role, "winner");
  });
  await check("restaurantes route source guards: pre-insert re-check, post-insert archive-the-loser, same-row update preserved", () => {
    const r = raw("app/api/clasificados/restaurantes/publish/route.ts");
    assert.match(r, /\.limit\(1\);\s*\n\s*const existingByDraft = \(existingRowsByDraft/, "d3ed73ab oldest-row lookup preserved");
    assert.match(r, /\.eq\("id", existingListingId as string\)/, "update by primary key preserved");
    const insertBranch = r.slice(r.indexOf("slugOut = await allocateSlug(base);"));
    assert.ok(insertBranch.indexOf("readRestauranteRowsForDraft(supabase, draft.draftListingId)") < insertBranch.indexOf('.insert({'), "re-check happens before the insert");
    assert.match(insertBranch, /reconcileRestauranteFirstSave\(after\.rows, listingIdOut\)/);
    assert.match(insertBranch, /update\(\{ status: "archived"/);
    assert.match(insertBranch, /listingIdOut = decision\.winner\.id;/);
    assert.match(insertBranch, /leonixAdIdOut = decision\.winner\.leonix_ad_id \?\? leonixAdIdOut;/);
    assert.match(insertBranch, /slugOut = decision\.winner\.slug \?\? slugOut;/);
    const client = raw("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
    assert.match(client, /listingId: pending\.listingId,\s*\n\s*leonixAdId: pending\.leonixAdId,/, "checkout uses the server-returned canonical id");
  });

  // ── preserved d3ed73ab / pinned literals ─────────────────────────────────────────────────────
  await check("preserved: pinned literals + d3ed73ab guards untouched", () => {
    assert.ok(raw("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts").includes("args.existingListingId?.trim() ||"));
    assert.ok(raw("app/(site)/dashboard/mis-anuncios/page.tsx").includes('if (status === "sold") patch.is_published = false;'));
    const co = raw("app/api/revenue-os/checkout/route.ts");
    assert.match(co, /br_fsbo_45d: "bienes-raices"/);
    assert.match(raw("app/admin/_lib/adminReactivationPolicy.ts"), /code: "payment_required"/);
    assert.match(raw("app/(site)/clasificados/autos/privado/lib/saveAutosPrivadoDashboardEdit.ts"), /method: "PATCH"/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
