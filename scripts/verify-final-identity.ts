/**
 * FINAL IDENTITY CLOSEOUT (gate 1) - one application = one canonical UUID = one Leonix Ad ID, for the whole life
 * of the ad, across Rentas / Bienes Negocio / Bienes FSBO / Autos (dealer boost, inventory add) / Empleos.
 *
 * Executable checks against the real pure modules (fake storage / fake fetch / in-memory row table), plus narrow
 * source guards where the behaviour lives in a client component or route that cannot be imported under raw tsx.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-identity.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  has(k: string) {
    return this.m.has(k);
  }
}

function makeAutosApi(rows: Record<string, { id: string; status: string; lane: string; leonix_ad_id: string }> = {}, opts?: { patchStatus?: number }) {
  const calls: Array<{ method: string; url: string }> = [];
  let nextId = 1;
  const fetchFn = async (input: string, init?: RequestInit): Promise<Response> => {
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ method, url: input });
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
    if (method === "POST") {
      const id = `new-${nextId++}`;
      rows[id] = { id, status: "draft", lane: "negocios", leonix_ad_id: `AUTO-${id}` };
      return json(200, { ok: true, id, leonixAdId: `AUTO-${id}`, status: "draft" });
    }
    const id = decodeURIComponent(input.split("/").pop() as string);
    const r = rows[id];
    if (method === "GET") {
      if (!r) return json(404, { ok: false });
      return json(200, { ok: true, id: r.id, status: r.status, lane: r.lane, leonix_ad_id: r.leonix_ad_id });
    }
    if (method === "PATCH") {
      if (opts?.patchStatus) return json(opts.patchStatus, { ok: false });
      if (!r) return json(404, { ok: false });
      return json(200, { ok: true, id: r.id, leonixAdId: r.leonix_ad_id, status: r.status });
    }
    return json(500, {});
  };
  return { fetchFn, calls, rows };
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const KEY_A = "dk_aaaaaaaaaaaaaaaaaaaaaaaa";
const KEY_B = "dk_bbbbbbbbbbbbbbbbbbbbbbbb";
const scopeRentas = { userId: "u1", category: "rentas", sellerType: "personal" };

async function main() {
  const dk = await import("../app/(site)/clasificados/lib/realEstateDraftKey");
  const ident = await import("../app/lib/clasificados/autos/autosCanonicalListingIdentity");
  const emp = await import("../app/(site)/publicar/empleos/shared/publish/empleosPendingCheckoutIdentity");
  const policy = await import("../app/lib/listingIdentity/paidReturnIdentityPolicy");

  // ══ A. REAL ESTATE DRAFT IDENTITY (Rentas negocio/privado, Bienes Negocio, Bienes FSBO) ═══════════
  await check("A1 draft key: clear is gated by an allow-list of terminal reasons; back/forward/edit/retry/cancel (and junk) are strict no-ops", () => {
    for (const trigger of dk.REAL_ESTATE_DRAFT_KEY_NEVER_CLEAR_TRIGGERS) {
      const st = new FakeStorage();
      const k = dk.getOrCreateRealEstateDraftKey(st, scopeRentas);
      assert.ok(k);
      assert.equal(dk.clearRealEstateDraftKey(st, scopeRentas, trigger as never), false, trigger);
      assert.equal(dk.getOrCreateRealEstateDraftKey(st, scopeRentas), k, `${trigger} must keep the key`);
      assert.equal(dk.clearRealEstateDraftLifecycleForLane(st, { category: "rentas", sellerType: "personal" }, trigger as never), 0, `${trigger} (lane)`);
      assert.equal(dk.getOrCreateRealEstateDraftKey(st, scopeRentas), k, `${trigger} (lane) must keep the key`);
    }
    for (const reason of dk.REAL_ESTATE_DRAFT_KEY_CLEAR_REASONS) {
      const st = new FakeStorage();
      const k = dk.getOrCreateRealEstateDraftKey(st, scopeRentas);
      assert.equal(dk.clearRealEstateDraftKey(st, scopeRentas, reason), true, reason);
      assert.notEqual(dk.getOrCreateRealEstateDraftKey(st, scopeRentas), k, `${reason} gives a NEW application a new key`);
    }
    assert.deepEqual([...dk.REAL_ESTATE_DRAFT_KEY_CLEAR_REASONS].sort(), ["application_draft_cleared", "explicit_discard", "key_spent_by_server_truth", "payment_success_return"]);
  });

  await check("A2 lane lifecycle clear is scoped: only that category+seller type (any user in this tab); FSBO cache only for FSBO", () => {
    const st = new FakeStorage();
    const mk = (u: string, c: string, s: string) => dk.getOrCreateRealEstateDraftKey(st, { userId: u, category: c, sellerType: s });
    const rp = mk("u1", "rentas", "personal");
    const rn = mk("u1", "rentas", "business");
    const bp = mk("u1", "bienes-raices", "personal");
    const bn = mk("u1", "bienes-raices", "business");
    st.setItem(dk.BR_FSBO_PENDING_CHECKOUT_SESSION_KEY, "row-1");
    assert.equal(dk.clearRealEstateDraftLifecycleForLane(st, { category: "rentas", sellerType: "personal" }, "application_draft_cleared"), 1);
    assert.equal(st.has(dk.realEstateDraftKeyStorageKey({ userId: "u1", category: "rentas", sellerType: "personal" })), false);
    for (const [c, s, v] of [["rentas", "business", rn], ["bienes-raices", "personal", bp], ["bienes-raices", "business", bn]] as const) {
      assert.equal(dk.getOrCreateRealEstateDraftKey(st, { userId: "u1", category: c, sellerType: s }), v, `${c}/${s} untouched`);
    }
    assert.equal(st.has(dk.BR_FSBO_PENDING_CHECKOUT_SESSION_KEY), true, "a Rentas clear never drops the FSBO hint");
    assert.ok(rp);
    dk.clearRealEstateDraftLifecycleForLane(st, { category: "bienes-raices", sellerType: "personal" }, "application_draft_cleared");
    assert.equal(st.has(dk.BR_FSBO_PENDING_CHECKOUT_SESSION_KEY), false, "FSBO clear drops the cached pending-row hint with the key");
    assert.equal(dk.getOrCreateRealEstateDraftKey(st, { userId: "u1", category: "bienes-raices", sellerType: "business" }), bn, "Bienes Negocio untouched by an FSBO clear");
    // a brand-new tab has no storage: never throws
    assert.equal(dk.clearRealEstateDraftLifecycleForLane(null, { category: "rentas", sellerType: "personal" }, "explicit_discard"), 0);
  });

  await check("A3 browser wrappers: draft-consumed clear reaches window.sessionStorage; server (no window) is a no-op", () => {
    const g = globalThis as { window?: unknown };
    assert.equal(dk.clearRealEstateDraftLifecycleForLaneInBrowser({ category: "rentas", sellerType: "business" }, "application_draft_cleared"), 0);
    const ss = new FakeStorage();
    const k1 = dk.getOrCreateRealEstateDraftKey(ss, { userId: "u9", category: "rentas", sellerType: "business" });
    g.window = { sessionStorage: ss };
    try {
      assert.equal(dk.clearRealEstateDraftLifecycleForLaneInBrowser({ category: "rentas", sellerType: "business" }, "application_draft_cleared"), 1);
      const k2 = dk.getOrCreateRealEstateDraftKey(ss, { userId: "u9", category: "rentas", sellerType: "business" });
      assert.notEqual(k2, k1, "second application in the same tab gets its own key");
      dk.getOrCreateRealEstateDraftKey(ss, { userId: "u9", category: "bienes-raices", sellerType: "personal" });
      assert.ok(dk.clearAllRealEstateDraftLifecycleInBrowser("explicit_discard") >= 2, "start-over wipes every real-estate lane key");
    } finally {
      delete g.window;
    }
  });

  await check("A4 success return: key cleared ONLY when it equals the paid row's own key; unrelated application keeps its key", () => {
    const st = new FakeStorage();
    const kA = dk.getOrCreateRealEstateDraftKey(st, scopeRentas, () => KEY_A);
    assert.equal(kA, KEY_A);
    // paid row belongs to ANOTHER application (different key) -> untouched
    assert.equal(dk.clearRealEstateDraftKeyIfRowMatches(st, scopeRentas, { listingId: "L1", draftKey: KEY_B }), false);
    assert.equal(dk.getOrCreateRealEstateDraftKey(st, scopeRentas), KEY_A);
    // paid row with no key (legacy / lookup failed) -> untouched
    assert.equal(dk.clearRealEstateDraftKeyIfRowMatches(st, scopeRentas, { listingId: "L1", draftKey: null }), false);
    assert.equal(dk.getOrCreateRealEstateDraftKey(st, scopeRentas), KEY_A);
    // paid row IS this application -> cleared
    assert.equal(dk.clearRealEstateDraftKeyIfRowMatches(st, scopeRentas, { listingId: "L1", draftKey: KEY_A }), true);
    assert.notEqual(dk.getOrCreateRealEstateDraftKey(st, scopeRentas), KEY_A);
    // FSBO hint dropped only when it is the paid row
    const fs = { userId: "u1", category: "bienes-raices", sellerType: "personal" };
    st.setItem(dk.BR_FSBO_PENDING_CHECKOUT_SESSION_KEY, "row-9");
    dk.clearRealEstateDraftKeyIfRowMatches(st, fs, { listingId: "row-OTHER", draftKey: KEY_B });
    assert.equal(st.has(dk.BR_FSBO_PENDING_CHECKOUT_SESSION_KEY), true, "another row's payment keeps the hint");
    dk.clearRealEstateDraftKeyIfRowMatches(st, fs, { listingId: "row-9", draftKey: null });
    assert.equal(st.has(dk.BR_FSBO_PENDING_CHECKOUT_SESSION_KEY), false, "the paid row's payment drops the hint");
  });

  await check("A5 adoption: canonical server identity wins - a row bound to ANOTHER application is never adopted by a stale hint or the same title", () => {
    const j = (k: string | null) => (k ? { leonix_draft_key: k, br_publish: { payment_status: "pending" } } : { br_publish: { payment_status: "pending" } });
    const rowA = { id: "A", status: "pending", listing_json: j(KEY_A) }; // abandoned application A
    const legacy = { id: "L", status: "pending", listing_json: j(null) }; // pre-key row
    // application B (key KEY_B): stale FSBO hint -> A, same title -> A
    assert.equal(dk.realEstatePendingRowAdoptable("existing_id", rowA, KEY_B), false, "stale cached id of another application");
    assert.equal(dk.realEstatePendingRowAdoptable("title", rowA, KEY_B), false, "same title, other application's key");
    assert.equal(dk.realEstatePendingRowAdoptable("draft_key", rowA, KEY_B), false);
    assert.equal(dk.pickAdoptableRealEstatePendingRow("title", [rowA], KEY_B), null);
    // no key at all (storage blocked): still never adopts a keyed row
    assert.equal(dk.realEstatePendingRowAdoptable("title", rowA, null), false);
    // the SAME application: key tier adopts even when the title changed; explicit hint and title also fine
    assert.equal(dk.realEstatePendingRowAdoptable("draft_key", rowA, KEY_A), true);
    assert.equal(dk.realEstatePendingRowAdoptable("existing_id", rowA, KEY_A), true);
    assert.equal(dk.realEstatePendingRowAdoptable("title", rowA, KEY_A), true);
    // draft-key tier never adopts a keyless row (that is what the fallbacks are for)
    assert.equal(dk.realEstatePendingRowAdoptable("draft_key", legacy, KEY_A), false);
    // legacy keyless row: fallbacks adopt it (the patch stamps the key) - behaviour preserved
    assert.equal(dk.realEstatePendingRowAdoptable("existing_id", legacy, KEY_B), true);
    assert.equal(dk.realEstatePendingRowAdoptable("title", legacy, KEY_B), true);
    assert.equal(dk.realEstatePendingRowAdoptable("title", legacy, null), true);
    // newest-first candidate list: the foreign keyed row is skipped, the adoptable one is found
    assert.equal(dk.pickAdoptableRealEstatePendingRow("title", [rowA, legacy], KEY_B)?.id, "L");
    assert.equal(dk.realEstatePendingRowAdoptable("title", { id: "", listing_json: j(null) }, KEY_A), false);
    assert.equal(dk.realEstatePendingRowAdoptable("title", null, KEY_A), false);
  });

  await check("A6 whole-lane simulation: application A abandoned unpaid, application B in the same tab -> two rows, A untouched; retry of A -> same row", () => {
    // in-memory table + the core's tier walk (order + adoption), with the client lifecycle around it
    type Row = { id: string; title: string; status: string; is_published: boolean; listing_json: Record<string, unknown> };
    const table: Row[] = [];
    const tab = new FakeStorage(); // this tab's sessionStorage
    let n = 0;
    const publish = (title: string, hintId: string | null) => {
      let key = dk.getOrCreateRealEstateDraftKey(tab, scopeRentas, () => `dk_${String(++n).padStart(24, "0")}`);
      const own = table.filter((r) => r.listing_json.leonix_draft_key === key);
      const rot = dk.rotateRealEstateDraftKeyIfSpent({ storage: tab, scope: scopeRentas, currentKey: key!, callerSuppliedKey: false, rows: own, generate: () => `dk_${String(++n).padStart(24, "0")}` });
      key = rot.key;
      const pending = table.filter((r) => r.status === "pending" && !r.is_published);
      let hit: Row | null = null;
      for (const tier of dk.realEstatePendingLookupOrder({ draftKey: key, existingListingId: hintId })) {
        const cands =
          tier === "draft_key" ? pending.filter((r) => r.listing_json.leonix_draft_key === key)
          : tier === "existing_id" ? pending.filter((r) => r.id === hintId)
          : pending.filter((r) => r.title === title);
        hit = dk.pickAdoptableRealEstatePendingRow(tier, cands, key);
        if (hit) break;
      }
      const json = dk.withRealEstateDraftKeyInListingJson({ br_publish: { payment_status: "pending" } }, key)!;
      if (hit) {
        hit.title = title;
        hit.listing_json = json;
        return hit.id;
      }
      const id = `row-${table.length + 1}`;
      table.push({ id, title, status: "pending", is_published: false, listing_json: json });
      return id;
    };
    const idA = publish("Casa en Fresno", null);
    const idA2 = publish("Casa en Fresno - EDITADA", idA); // retry / edit of the same application (title changed)
    assert.equal(idA2, idA, "retry with an edited title reuses the SAME row (same UUID)");
    assert.equal(table.length, 1);
    // checkout hand-off: the lane's application draft is consumed -> key released. Then cancel at Stripe.
    dk.clearRealEstateDraftLifecycleForLane(tab, { category: "rentas", sellerType: "personal" }, "application_draft_cleared");
    // application B, SAME title as A and a stale hint to A: must NOT overwrite A
    const idB = publish("Casa en Fresno - EDITADA", idA);
    assert.notEqual(idB, idA, "second application never adopts the abandoned row");
    assert.equal(table.length, 2);
    assert.equal(table[0]!.title, "Casa en Fresno - EDITADA");
    assert.notEqual(table[0]!.listing_json.leonix_draft_key, table[1]!.listing_json.leonix_draft_key);
    // even WITHOUT the client clear (stale sessionStorage) a PAID application's key is spent by server truth
    table[1]!.status = "active";
    table[1]!.is_published = true;
    const idC = publish("Otra casa", null);
    assert.ok(idC !== idA && idC !== idB, "a paid application's key is rotated: the next application gets its own row");
    assert.equal(table.length, 3);
    assert.equal(table.filter((r) => r.status === "active").length, 1, "the paid row is never overwritten");
  });

  await check("A7 server-truth rotation: spent key rotates (storage-derived: cleared + re-created; caller-supplied: in memory only); reusable/unused keeps", () => {
    const st = new FakeStorage();
    const k = dk.getOrCreateRealEstateDraftKey(st, scopeRentas, () => KEY_A)!;
    const keep = (rows: Array<{ status: string; is_published: boolean }>) =>
      dk.rotateRealEstateDraftKeyIfSpent({ storage: st, scope: scopeRentas, currentKey: k, callerSuppliedKey: false, rows });
    assert.deepEqual(keep([]), { key: KEY_A, rotated: false });
    assert.deepEqual(keep([{ status: "pending", is_published: false }]), { key: KEY_A, rotated: false });
    assert.equal(dk.realEstateDraftKeyServerState([{ status: " Pending ", is_published: false }]), "reusable");
    assert.equal(dk.realEstateDraftKeyServerState([{ status: "active", is_published: true }]), "spent");
    assert.equal(dk.realEstateDraftKeyServerState([{ status: "removed", is_published: false }]), "spent");
    const spent = keep([{ status: "active", is_published: true }]);
    assert.equal(spent.rotated, true);
    assert.notEqual(spent.key, KEY_A);
    assert.equal(dk.getOrCreateRealEstateDraftKey(st, scopeRentas), spent.key, "storage now holds the fresh key");
    const st2 = new FakeStorage();
    const stored = dk.getOrCreateRealEstateDraftKey(st2, scopeRentas, () => KEY_B)!;
    const caller = dk.rotateRealEstateDraftKeyIfSpent({ storage: st2, scope: scopeRentas, currentKey: KEY_A, callerSuppliedKey: true, rows: [{ status: "active", is_published: true }] });
    assert.equal(caller.rotated, true);
    assert.equal(dk.getOrCreateRealEstateDraftKey(st2, scopeRentas), stored, "a caller-supplied spent key never wipes the unrelated stored key");
  });

  await check("A8 core + wrappers source guards: probe -> rotate, adoptable-row tiers, title returns candidates, hard-stop + pins preserved", () => {
    const c = raw("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
    assert.match(c, /rotateRealEstateDraftKeyIfSpent\(\{/);
    assert.match(c, /\.eq\(REAL_ESTATE_DRAFT_KEY_FILTER_COLUMN, draftKey\)\s*\.limit\(5\)/, "spent-key probe");
    assert.match(c, /pickAdoptableRealEstatePendingRow\(tier, res\.data, draftKey\)/);
    assert.match(c, /\.limit\(tier === "title" \? 10 : 1\)/, "title returns several candidates so a foreign-keyed row can be skipped");
    assert.match(c, /\.select\("id, leonix_ad_id, status, listing_json"\)/);
    assert.match(c, /reusableRealEstatePending = \{ data: null, error: res\.error \}/, "failed lookup still hard-stops");
    assert.ok(!/clearRealEstateDraftKey\(/.test(c.replace(/\/\/.*$/gm, "")), "the core clears keys only through the rotation helper");
    const w = raw("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts");
    assert.ok((w.match(/existingListingId: opts\?\.existingListingId \?\? null,/g) ?? []).length === 5);
    assert.ok((w.match(/draftKey: opts\?\.draftKey \?\? null,/g) ?? []).length === 5, "all five wrappers thread the draft key");
  });

  await check("A9 lifecycle wiring: draft primitives + start-over wipe release the key; NO preview/cancel/retry path does", () => {
    const g = (rel: string) => raw(rel);
    assert.match(g("app/(site)/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft.ts"), /clearRealEstateDraftLifecycleForLaneInBrowser\(\{ category: "rentas", sellerType: "personal" \}, "application_draft_cleared"\)/);
    assert.match(g("app/(site)/clasificados/publicar/rentas/negocio/application/utils/rentasNegocioDraft.ts"), /clearRealEstateDraftLifecycleForLaneInBrowser\(\{ category: "rentas", sellerType: "business" \}, "application_draft_cleared"\)/);
    assert.match(g("app/(site)/clasificados/publicar/bienes-raices/privado/application/utils/bienesRaicesPrivadoDraft.ts"), /clearRealEstateDraftLifecycleForLaneInBrowser\(\{ category: "bienes-raices", sellerType: "personal" \}, "application_draft_cleared"\)/);
    assert.match(g("app/(site)/clasificados/lib/classifiedsDraftStorage.ts"), /clearAllRealEstateDraftLifecycleInBrowser\("explicit_discard"\)/);
    // every call site of the key-clear API in the app tree uses an allowed reason, and lives in an allowed file
    const allowedFiles = new Set([
      "app/(site)/clasificados/lib/realEstateDraftKey.ts",
      "app/(site)/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft.ts",
      "app/(site)/clasificados/publicar/rentas/negocio/application/utils/rentasNegocioDraft.ts",
      "app/(site)/clasificados/publicar/bienes-raices/privado/application/utils/bienesRaicesPrivadoDraft.ts",
      "app/(site)/clasificados/lib/classifiedsDraftStorage.ts",
    ]);
    const root = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
    const appFiles = walk(join(root, "app"));
    assert.ok(appFiles.length > 500, `source walk must actually scan the app tree (found ${appFiles.length})`);
    for (const f of appFiles) {
      const rel = f.slice(root.length).replace(/\\/g, "/");
      const s = readFileSync(f, "utf8");
      if (/clearRealEstateDraft(Key|Lifecycle)/.test(s) && !allowedFiles.has(rel) && !/ListingIdentityPaidReturnCleanup\.tsx$/.test(rel) && !/leonixPublishRealEstateListingCore\.ts$/.test(rel)) {
        assert.fail(`unexpected draft-key clear outside the lifecycle files: ${rel}`);
      }
    }
    // preview clients never clear identity themselves (back / edit / retry / cancel paths stay clear-free)
    for (const rel of [
      "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
      "app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx",
      "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
      "app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx",
    ]) {
      assert.ok(!/clearRealEstateDraft/.test(g(rel)), `${rel} must not clear the draft key directly`);
    }
    // the FSBO/Rentas hand-off clears the draft (and thus the key) only AFTER checkout started ok, then redirects
    const rp = g("app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx");
    assert.match(rp, /if \(!checkout\.ok\) \{[\s\S]{0,120}return;\s*\}\s*clearRentasPrivadoDraft\(\);\s*redirectToRevenueCategoryCheckout/, "no clear on a failed checkout start (retry keeps the row)");
  });

  await check("A10 success return: cleanup component + policy wired to the Revenue OS success page ONLY (not cancel), verified paid returns only", () => {
    assert.equal(policy.isVerifiedPaidReturn({ found: true, paymentState: "confirmed", listingId: "L" }), true);
    assert.equal(policy.isVerifiedPaidReturn({ found: true, paymentState: "processing", listingId: "L" }), true);
    for (const bad of [
      { found: false, paymentState: "confirmed", listingId: "L" },
      { found: true, paymentState: "canceled", listingId: "L" },
      { found: true, paymentState: "expired", listingId: "L" },
      { found: true, paymentState: "missing", listingId: "L" },
      { found: true, paymentState: "confirmed", listingId: "" },
      { found: true, paymentState: "confirmed", listingId: null },
    ]) assert.equal(policy.isVerifiedPaidReturn(bad), false, JSON.stringify(bad));
    assert.equal(policy.isVerifiedPaidReturn(null), false);
    assert.equal(policy.paidReturnCleanupTarget("rentas"), "real_estate");
    assert.equal(policy.paidReturnCleanupTarget("bienes-raices"), "real_estate");
    assert.equal(policy.paidReturnCleanupTarget("empleos"), "empleos");
    assert.equal(policy.paidReturnCleanupTarget("servicios"), "none");
    const page = raw("app/(site)/revenue-os/pago/exito/page.tsx");
    assert.match(page, /<ListingIdentityPaidReturnCleanup[\s\S]{0,200}verified=\{isVerifiedPaidReturn\(proof\)\}/);
    assert.ok(!/Cleanup/.test(raw("app/(site)/revenue-os/pago/cancelado/page.tsx")), "cancel page never releases identity");
    const comp = raw("app/(site)/revenue-os/pago/_components/ListingIdentityPaidReturnCleanup.tsx");
    assert.match(comp, /if \(!verified \|\| !paid \|\| target === "none"\) return;/);
    assert.match(comp, /String\(rec\.owner_id \?\? ""\) !== userId\) return;/, "ownership check before touching storage");
    assert.match(comp, /clearRealEstateDraftKeyIfRowMatches\(/);
    assert.match(comp, /clearEmpleosPendingCheckoutListingIdIfPaid\(/);
  });

  // ══ B. FSBO identity is not sessionStorage-only ═══════════════════════════════════════════════
  await check("B1 FSBO: the sessionStorage hint is convenience only - ownership-verified, shared const, adopted by the core only when the row carries this application's key (or none)", () => {
    const f = raw("app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx");
    assert.match(f, /const BR_FSBO_PENDING_CHECKOUT_KEY = BR_FSBO_PENDING_CHECKOUT_SESSION_KEY;/);
    assert.match(f, /String\(rec\.owner_id \?\? ""\) === authUserId &&/);
    assert.match(f, /existingListingId: cached\?\.listingId \?\? null,/);
    assert.match(f, /activationMode: "pending_payment",/);
  });

  await check("B2 FSBO hops resolve the same canonical row from SERVER identity: checkout, resume, cancel, return, edit carry the row id; none read sessionStorage for it", () => {
    const f = raw("app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx");
    assert.match(f, /listingId: pending\.listingId,/, "checkout is bound to the row the pending save returned");
    const resumeSrc = raw("app/(site)/dashboard/lib/dashboardResumePaymentClient.ts");
    assert.ok(!/sessionStorage|localStorage/.test(resumeSrc), "payment-resume never reads browser storage");
    assert.match(resumeSrc, /listingId: string;/);
    const okPage = raw("app/(site)/revenue-os/pago/exito/page.tsx");
    assert.match(okPage, /paidListingId=\{proof\.listingId\}/, "return resolves the row from the payment record");
    const cancelPage = raw("app/(site)/revenue-os/pago/cancelado/page.tsx");
    assert.match(cancelPage, /params\.listing_id/, "cancel resolves the row from the URL, never creates one");
    assert.ok(!/publishLeonix|insertListingsRow|\.insert\(/.test(cancelPage));
    const edit = raw("app/api/clasificados/bienes-raices/listing-edit/route.ts");
    assert.ok(!/\.insert\(/.test(edit), "BR dashboard edit updates the row, never inserts");
    const rentasEdit = raw("app/api/clasificados/rentas/listing-edit/route.ts");
    assert.ok(!/\.insert\(/.test(rentasEdit), "Rentas dashboard edit updates the row, never inserts");
  });

  // ══ C. AUTOS dealer boost uses the canonical identity ═════════════════════════════════════════
  await check("C1 autos boost: legacy-key-only identity is honoured (PATCH the same parent), a failed PATCH fails CLOSED, never POSTs a second parent", async () => {
    const st = { session: new FakeStorage(), local: new FakeStorage() };
    st.session.setItem(ident.autosLegacyListingSessionKey("negocios"), "parent-1"); // written by an older tab / previous boost
    const api = makeAutosApi({ "parent-1": { id: "parent-1", status: "pending_payment", lane: "negocios", leonix_ad_id: "AUTO-P1" } });
    const ok = await ident.saveAutosListingToCanonicalRow({ lane: "negocios", lang: "es", token: "t", listingPayload: {}, namespace: "u:1", fetchFn: api.fetchFn, storages: st });
    assert.ok(ok.ok && ok.listingId === "parent-1" && ok.created === false);
    assert.deepEqual(api.calls.map((c) => c.method), ["GET", "PATCH"], "same row, no POST");
    // a transient PATCH failure: fail closed, identity kept, still no POST
    const st2 = { session: new FakeStorage(), local: new FakeStorage() };
    st2.session.setItem(ident.autosLegacyListingSessionKey("negocios"), "parent-1");
    const api2 = makeAutosApi({ "parent-1": { id: "parent-1", status: "draft", lane: "negocios", leonix_ad_id: "AUTO-P1" } }, { patchStatus: 500 });
    const bad = await ident.saveAutosListingToCanonicalRow({ lane: "negocios", lang: "es", token: "t", listingPayload: {}, namespace: "u:1", fetchFn: api2.fetchFn, storages: st2 });
    assert.equal(bad.ok, false);
    assert.ok(!api2.calls.some((c) => c.method === "POST"), "never POSTs a second dealer parent");
    assert.equal(st2.session.getItem(ident.autosLegacyListingSessionKey("negocios")), "parent-1", "identity survives the failure");
  });

  await check("C2 autos boost: explicit dealer parent id is PATCH-only (404 -> fail closed, no create); identity stays in the PLAIN lane scope (never a child scope)", async () => {
    const st = { session: new FakeStorage(), local: new FakeStorage() };
    const api = makeAutosApi({});
    const gone = await ident.saveAutosListingToCanonicalRow({ lane: "negocios", lang: "en", token: "t", listingPayload: {}, explicitListingId: "parent-x", namespace: "u:1", fetchFn: api.fetchFn, storages: st });
    assert.equal(gone.ok, false);
    assert.ok(!api.calls.some((c) => c.method === "POST"));
    const rows = { "parent-2": { id: "parent-2", status: "draft", lane: "negocios", leonix_ad_id: "AUTO-P2" } };
    const api2 = makeAutosApi(rows);
    const done = await ident.saveAutosListingToCanonicalRow({ lane: "negocios", lang: "en", token: "t", listingPayload: {}, explicitListingId: "parent-2", namespace: "u:1", fetchFn: api2.fetchFn, storages: st });
    assert.ok(done.ok && done.listingId === "parent-2");
    assert.equal(st.session.has(`${ident.AUTOS_DRAFT_LISTING_IDENTITY_KEY_PREFIX}negocios`), true);
    assert.equal(ident.autosIdentityScope("negocios", null), "negocios");
    // a brand-new application POSTs once, lane is negocios, no parent fields
    const api3 = makeAutosApi({});
    const st3 = { session: new FakeStorage(), local: new FakeStorage() };
    const created = await ident.saveAutosListingToCanonicalRow({ lane: "negocios", lang: "en", token: "t", listingPayload: {}, namespace: "u:1", fetchFn: api3.fetchFn, storages: st3 });
    assert.ok(created.ok && created.created === true);
    assert.deepEqual(api3.calls.map((c) => c.method), ["POST"]);
    const again = await ident.saveAutosListingToCanonicalRow({ lane: "negocios", lang: "en", token: "t", listingPayload: {}, namespace: "u:1", fetchFn: api3.fetchFn, storages: st3 });
    assert.ok(again.ok && again.created === false, "the second boost click reuses the same row");
  });

  await check("C3 autos boost source guard: helper delegates to the canonical identity (lane negocios, no POST of its own, no legacy-key-only logic, no inventory scope); panel passes the explicit parent", () => {
    const e = raw("app/(site)/publicar/autos/negocios/lib/ensureAutosNegociosDraftListingForBoost.ts");
    const code = e.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.match(code, /saveAutosListingToCanonicalRow\(\{/);
    assert.match(code, /lane: "negocios",/);
    assert.match(code, /explicitListingId: args\.parentListingId\?\.trim\(\) \|\| null,/);
    assert.ok(!/method: "POST"/.test(code) && !/fetch\("\/api\/clasificados\/autos\/listings"/.test(code), "no POST of its own");
    assert.ok(!/lx-autos-publish-listing-negocios/.test(code), "no legacy-key-only identity");
    assert.ok(!/inventoryParentListingId|autosIdentityScope|createExtras|parentListingId:\s*(?!args)/.test(code), "never touches an inventory/child scope or creates a parent");
    assert.match(raw("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx"), /parentListingId: parentListingId\?\.trim\(\) \|\| null,/);
  });

  await check("C4 inventory-add scope: cleared on the verified success of that add; plain parent identity + other parents' scopes untouched", () => {
    const st = { session: new FakeStorage(), local: new FakeStorage() };
    const scopeP1 = ident.autosIdentityScope("negocios", "parent-1");
    const scopeP2 = ident.autosIdentityScope("negocios", "parent-2");
    assert.equal(scopeP1, "negocios:inv:parent-1");
    ident.rememberAutosDraftListingIdentity(st, "negocios", "negocios", { listingId: "dealer-parent", namespace: "u:1" });
    ident.rememberAutosDraftListingIdentity(st, scopeP1, "negocios", { listingId: "child-1", namespace: "u:1" });
    ident.rememberAutosDraftListingIdentity(st, scopeP2, "negocios", { listingId: "child-9", namespace: "u:1" });
    ident.clearAutosDraftListingIdentity(st, scopeP1, "negocios");
    assert.equal(ident.readAutosDraftListingIdentity(st, scopeP1, "negocios", "u:1"), null, "spent add-scope gone");
    assert.equal(ident.readAutosDraftListingIdentity(st, "negocios", "negocios", "u:1")?.listingId, "dealer-parent", "dealer parent identity preserved");
    assert.equal(ident.readAutosDraftListingIdentity(st, scopeP2, "negocios", "u:1")?.listingId, "child-9", "another parent's add scope preserved");
    const core = raw("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
    assert.match(core, /if \(inventoryCtx\) \{\s*\/\/[^\n]*\n[^\n]*\n[^\n]*\n\s*clearAutosDraftListingIdentity\(\s*getBrowserAutosIdentityStorages\(\),\s*autosIdentityScope\(lane, inventoryCtx\.parentListingId\),\s*lane,\s*\);\s*clearInventoryAddContextFromSession\(\);/);
    // only inside the bypass-success branch (after the QA/bypass success response), never on error paths
    const idx = core.indexOf("autosIdentityScope(lane, inventoryCtx.parentListingId)");
    const before = core.slice(Math.max(0, idx - 1500), idx);
    assert.match(before, /j\.internalBypass \|\| j\.testPublishBypass \|\| j\.negociosQaAllowlistBypass/);
  });

  // ══ D. EMPLEOS checkout memo ══════════════════════════════════════════════════════════════════
  await check("D1 empleos: memo released ONLY when it remembers the PAID row; other application's memo, cancel and retry keep it", () => {
    const ID1 = "11111111-1111-4111-8111-111111111111";
    const ID2 = "22222222-2222-4222-8222-222222222222";
    const st = new FakeStorage();
    emp.rememberEmpleosPendingCheckoutListingId(st, { lane: "quick", title: "Cocinero", listingId: ID1 });
    // retry / cancel path: nothing clears - the SAME job keeps its row
    assert.equal(emp.readEmpleosPendingCheckoutListingId(st, { lane: "quick", title: "  cocinero " }), ID1);
    // a payment for a DIFFERENT row (or an unknown one) never releases it
    assert.equal(emp.clearEmpleosPendingCheckoutListingIdIfPaid(st, ID2), false);
    assert.equal(emp.clearEmpleosPendingCheckoutListingIdIfPaid(st, null), false);
    assert.equal(emp.clearEmpleosPendingCheckoutListingIdIfPaid(st, ""), false);
    assert.equal(emp.readEmpleosPendingCheckoutListingId(st, { lane: "quick", title: "Cocinero" }), ID1);
    // verified success of THIS row -> a NEW job (even with the same title, e.g. re-posting) starts fresh
    assert.equal(emp.clearEmpleosPendingCheckoutListingIdIfPaid(st, ID1.toUpperCase()), true);
    assert.equal(emp.readEmpleosPendingCheckoutListingId(st, { lane: "quick", title: "Cocinero" }), null, "new job does not inherit the paid job's identity");
    assert.equal(emp.clearEmpleosPendingCheckoutListingIdIfPaid(null, ID1), false);
    const boom = { getItem() { throw new Error("x"); }, setItem() {}, removeItem() { throw new Error("x"); } };
    assert.equal(emp.clearEmpleosPendingCheckoutListingIdIfPaid(boom as never, ID1), false, "storage errors never throw");
  });

  await check("D2 empleos wiring: checkout helper clears only on a server-rejected stale id; explicit discard clears memo + in-memory id; success return mounts the cleanup", () => {
    const co = raw("app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts");
    assert.equal((co.match(/clearEmpleosPendingCheckoutListingId\(/g) ?? []).length, 1, "exactly one clear in the checkout helper");
    assert.match(co, /rememberedId && !saved\.res\.ok && \[400, 403, 404\]\.includes\(saved\.res\.status\)\) \{\s*clearEmpleosPendingCheckoutListingId\(storage\);/, "only when the server rejected the remembered id");
    const afterStart = co.slice(co.indexOf("startRevenueCategoryCheckout({"));
    assert.ok(!/clearEmpleosPendingCheckoutListingId/.test(afterStart), "a failed / cancelled checkout start keeps the memo (retry reuses the row)");
    for (const rel of ["app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx", "app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx"]) {
      const s = raw(rel);
      assert.match(s, /const handleDeleteApplication = useCallback\(\(\) => \{[\s\S]*?setServerListingId\(null\);[\s\S]*?clearEmpleosPendingCheckoutListingId\(window\.sessionStorage\);[\s\S]*?\}, \[reset\]\);/, rel);
    }
    assert.match(raw("app/(site)/revenue-os/pago/exito/page.tsx"), /category=\{proof\.category \?\? \(category \|\| null\)\}/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
