/**
 * RECOVERY (2026-09-25) — semantic port of two deferred source hunks onto golden-survivor.
 *   ITEM 1 (d3ed73abf, final a4a1749b4): Autos Privado dashboard edit saves the SAME row.
 *     - service: an ACTIVE privado row is content-editable in place (listing_payload / lang / updated_at only);
 *     - saveAutosPrivadoDashboardEdit: PATCH-only on the declared id with the owner bearer, fail-closed on
 *       wrong lane / missing id / auth, never POST, never checkout;
 *     - AutosPrivadoApplication wires onSaveEdit only in dashboard-edit mode; AutosApplicationFinalActions
 *       hides "continue to publish" while onSaveEdit is set.
 *   ITEM 2 (1e80c0240): Rentas draft-util clear hooks release the lane's real-estate draft key.
 *
 * Pure checks + source pins only (no network, no DB, no build).
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-recovery-autos-privado-edit-rentas-key-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  clearRealEstateDraftLifecycleForLane,
  getOrCreateRealEstateDraftKey,
  realEstateDraftKeyStorageKey,
} from "../app/(site)/clasificados/lib/realEstateDraftKey";
import { saveAutosPrivadoDashboardEdit } from "../app/(site)/clasificados/autos/privado/lib/saveAutosPrivadoDashboardEdit";
import type { AutoDealerListing } from "../app/(site)/clasificados/autos/negocios/types/autoDealerListing";

const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const failures: string[] = [];
let passed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(name);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}

class FakeStorage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return Array.from(this.m.keys())[i] ?? null;
  }
  getItem(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

type Call = { url: string; method: string; headers: Record<string, string>; body: string | null };
function fakeFetch(responses: Array<{ status: number; json: unknown }>) {
  const calls: Call[] = [];
  const fn = async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      method: (init?.method ?? "GET").toUpperCase(),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: typeof init?.body === "string" ? init.body : null,
    });
    const r = responses.shift() ?? { status: 500, json: {} };
    return new Response(JSON.stringify(r.json), { status: r.status, headers: { "Content-Type": "application/json" } });
  };
  return { calls, fn };
}

const LISTING = {
  autosLane: "privado",
  year: 2020,
  make: "Honda",
  model: "Civic",
  vin: "1HGCM82633A004352",
  mediaImages: [{ id: "a", url: "https://cdn.example.com/a.jpg" }],
} as unknown as AutoDealerListing;
const ID = "11111111-2222-4333-8444-555555555555";

async function main() {
  // ── ITEM 1: service gate ────────────────────────────────────────────────────────────────────
  await check("service: ACTIVE privado and negocios rows are content-editable; other statuses unchanged", () => {
    const s = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    const fnStart = s.indexOf("export async function updateAutosClassifiedsListingDraft(");
    const fnEnd = s.indexOf("\nexport ", fnStart + 10);
    const fn = s.slice(fnStart, fnEnd);
    assert.ok(fn.includes('const negociosActiveEditable = (row.lane === "negocios" || row.lane === "privado") && row.status === "active";'));
    assert.ok(
      fn.includes('const recoverableStatus = row.status === "draft" || row.status === "payment_failed" || row.status === "pending_payment";'),
      "recoverable statuses unchanged",
    );
    assert.ok(fn.includes('errorCode: "AUTOS_LISTING_STATUS_NOT_EDITABLE"'), "non-editable statuses still refused");
    // owner scoping + identity guard kept, and the guard runs before the write
    assert.ok(fn.includes("assertAutosListingOwner(listingId, ownerUserId)"));
    assert.ok(fn.includes('.eq("owner_user_id", ownerUserId)'));
    const guard = fn.indexOf("isAutosChildIdentitySubstitution(");
    const upd = fn.indexOf(".update(write)");
    assert.ok(guard > 0 && upd > guard, "identity-substitution guard precedes the UPDATE");
    // the write is content-only: no status / term / payment / identity columns
    const w0 = fn.indexOf("const write = {");
    const write = fn.slice(w0, fn.indexOf("};", w0));
    assert.ok(write.includes("listing_payload: payload") && write.includes("lang,") && write.includes("updated_at:"));
    assert.ok(
      !/status\s*:|expires_at|published_at|stripe|payment|inventory_role|dealer_inventory|lane\s*:|owner_user_id\s*:|leonix_ad_id/i.test(write),
      "update payload must never re-activate, extend term or touch payment/identity",
    );
    assert.ok(fn.includes("autosLane: row.lane"), "lane comes from the stored row, never the client");
  });

  // ── ITEM 1: helper — source pins ────────────────────────────────────────────────────────────
  await check("helper: PATCH-only on the declared id; never POST/create, never checkout", () => {
    const h = read("app/(site)/clasificados/autos/privado/lib/saveAutosPrivadoDashboardEdit.ts");
    assert.ok(h.includes("/api/clasificados/autos/listings/${encodeURIComponent(listingId)}"));
    assert.ok(h.includes('method: "PATCH"'));
    assert.ok(!/method:\s*"POST"/.test(h), "no POST");
    assert.ok(!/checkout/i.test(h.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")), "no checkout call in code");
    assert.ok(!/status\s*:|expires_at/.test(h.replace(/\/\*[\s\S]*?\*\//g, "")), "never sends status / term fields");
    assert.ok(h.includes('autosLane: "privado"'));
    assert.ok(h.includes("prepareAutosListingForApiTransport(listing)"));
  });

  // ── ITEM 1: helper — behavior with a fake fetch ─────────────────────────────────────────────
  await check("helper: GET lane check then one PATCH of the same UUID with the owner bearer", async () => {
    const f = fakeFetch([
      { status: 200, json: { ok: true, lane: "privado", status: "active" } },
      { status: 200, json: { ok: true, id: ID, status: "active" } },
    ]);
    const r = await saveAutosPrivadoDashboardEdit({ listing: LISTING, lang: "es", accessToken: "tok", listingId: ` ${ID} `, fetchFn: f.fn });
    assert.deepEqual(r, { ok: true });
    assert.equal(f.calls.length, 2);
    assert.equal(f.calls[0].method, "GET");
    assert.equal(f.calls[1].method, "PATCH");
    for (const c of f.calls) {
      assert.equal(c.url, `/api/clasificados/autos/listings/${ID}`);
      assert.equal(c.headers.Authorization, "Bearer tok");
    }
    const body = JSON.parse(f.calls[1].body ?? "{}") as Record<string, unknown>;
    assert.deepEqual(Object.keys(body).sort(), ["lang", "listing"], "PATCH body carries only listing + lang");
    assert.equal((body.listing as { autosLane?: string }).autosLane, "privado");
  });

  await check("helper: wrong lane / not found / auth / empty id fail closed with NO PATCH and NO POST", async () => {
    const wrong = fakeFetch([{ status: 200, json: { ok: true, lane: "negocios" } }]);
    const r1 = await saveAutosPrivadoDashboardEdit({ listing: LISTING, lang: "en", accessToken: "tok", listingId: ID, fetchFn: wrong.fn });
    assert.equal(r1.ok, false);
    assert.equal(wrong.calls.length, 1);

    const nf = fakeFetch([{ status: 404, json: {} }]);
    const r2 = await saveAutosPrivadoDashboardEdit({ listing: LISTING, lang: "en", accessToken: "tok", listingId: ID, fetchFn: nf.fn });
    assert.equal(r2.ok, false);
    assert.equal(nf.calls.length, 1);

    const none = fakeFetch([]);
    const r3 = await saveAutosPrivadoDashboardEdit({ listing: LISTING, lang: "es", accessToken: "tok", listingId: "  ", fetchFn: none.fn });
    assert.equal(r3.ok, false);
    const r4 = await saveAutosPrivadoDashboardEdit({ listing: LISTING, lang: "es", accessToken: " ", listingId: ID, fetchFn: none.fn });
    assert.equal(r4.ok, false);
    assert.equal(none.calls.length, 0);
  });

  await check("helper: server 409 status_not_editable surfaces an honest message (no retry, no POST)", async () => {
    const f = fakeFetch([
      { status: 200, json: { ok: true, lane: "privado", status: "expired" } },
      { status: 409, json: { ok: false, errorCode: "UPDATE_FAILED", error: "status_not_editable", message: "x" } },
    ]);
    const r = await saveAutosPrivadoDashboardEdit({ listing: LISTING, lang: "en", accessToken: "tok", listingId: ID, fetchFn: f.fn });
    assert.equal(r.ok, false);
    assert.ok(!r.ok && /cannot be edited in its current status/.test(r.userMessage));
    assert.equal(f.calls.length, 2);
    assert.ok(f.calls.every((c) => c.method !== "POST"));
  });

  // ── ITEM 1: UI wiring ───────────────────────────────────────────────────────────────────────
  await check("application: onSaveEdit wired ONLY in dashboard-edit mode, with the declared listing id", () => {
    const a = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
    assert.ok(a.includes('import { saveAutosPrivadoDashboardEdit } from "@/app/clasificados/autos/privado/lib/saveAutosPrivadoDashboardEdit";'));
    assert.ok(a.includes('const isDashboardListingEditMode = dashboardSource && searchParams?.get("edit") === "1" && Boolean(editListingId);'));
    const i = a.indexOf("onSaveEdit={");
    assert.ok(i > 0);
    const block = a.slice(i, a.indexOf("onPreview={", i));
    assert.ok(/onSaveEdit=\{\s*isDashboardListingEditMode\s*\?/.test(block));
    assert.ok(block.includes(": undefined"), "new applications get no Save (publish path unchanged)");
    assert.ok(block.includes("listingId: editListingId"));
    assert.ok(block.includes("accessToken: token"));
  });

  await check("final actions: onSaveEdit tree hides 'continue to publish' and never pushes to confirm/checkout", () => {
    const f = read("app/(site)/publicar/autos/shared/components/AutosApplicationFinalActions.tsx");
    const i = f.indexOf("if (onSaveEdit) {");
    assert.ok(i > 0);
    const j = f.indexOf("\n  }\n", i);
    const tree = f.slice(i, j);
    assert.ok(tree.includes("await onSaveEdit()"));
    assert.ok(!tree.includes("continueLabel") && !tree.includes("publishConfirmHref") && !tree.includes("router.push"));
    assert.ok(!tree.includes("flushDraft"), "the edit tree does not route into the publish/confirm flow");
  });

  await check("scope guard: privado pricing/checkout, lifecycle and dealer capacity files not touched by this port", () => {
    // Pure pins that the edit path does not reference checkout/renewal/capacity primitives.
    const h = read("app/(site)/clasificados/autos/privado/lib/saveAutosPrivadoDashboardEdit.ts");
    for (const bad of ["startRevenueCategoryCheckout", "saveAutosPrivadoPendingBeforeCheckout", "autosPrivadoPreviewPaidCheckout", "renew", "capacity"]) {
      assert.ok(!h.includes(bad), `helper must not reference ${bad}`);
    }
  });

  // ── ITEM 2: Rentas draft-key hooks ──────────────────────────────────────────────────────────
  await check("rentas draft utils: clear hook releases the lane key (application_draft_cleared)", () => {
    const pairs: Array<[string, string, string]> = [
      ["app/(site)/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft.ts", "clearRentasPrivadoDraft", "personal"],
      ["app/(site)/clasificados/publicar/rentas/negocio/application/utils/rentasNegocioDraft.ts", "clearRentasNegocioDraft", "business"],
    ];
    for (const [p, fnName, st] of pairs) {
      const s = read(p);
      assert.ok(s.includes('import { clearRealEstateDraftLifecycleForLaneInBrowser } from "@/app/(site)/clasificados/lib/realEstateDraftKey";'));
      const i = s.indexOf(`export async function ${fnName}(): Promise<void> {`);
      assert.ok(i > 0, fnName);
      const body = s.slice(i, s.indexOf("\n}\n", i));
      assert.ok(
        body.includes(`clearRealEstateDraftLifecycleForLaneInBrowser({ category: "rentas", sellerType: "${st}" }, "application_draft_cleared");`),
        `${fnName} must clear the rentas/${st} key`,
      );
      // only inside the clear function (not load/save)
      assert.equal(s.split("clearRealEstateDraftLifecycleForLaneInBrowser(").length - 1, 1);
    }
  });

  await check("rentas key lifecycle (pure): lane clear removes only that lane's keys for every user id in the tab", () => {
    const st = new FakeStorage();
    const kPriv = getOrCreateRealEstateDraftKey(st, { userId: "u1", category: "rentas", sellerType: "personal" });
    const kNeg = getOrCreateRealEstateDraftKey(st, { userId: "u1", category: "rentas", sellerType: "business" });
    const kBr = getOrCreateRealEstateDraftKey(st, { userId: "u1", category: "bienes-raices", sellerType: "personal" });
    assert.ok(kPriv && kNeg && kBr && kPriv !== kNeg);
    assert.equal(getOrCreateRealEstateDraftKey(st, { userId: "u1", category: "rentas", sellerType: "personal" }), kPriv, "stable per application");
    assert.equal(clearRealEstateDraftLifecycleForLane(st, { category: "rentas", sellerType: "personal" }, "application_draft_cleared"), 1);
    assert.equal(st.getItem(realEstateDraftKeyStorageKey({ userId: "u1", category: "rentas", sellerType: "personal" })), null);
    assert.ok(st.getItem(realEstateDraftKeyStorageKey({ userId: "u1", category: "rentas", sellerType: "business" })));
    assert.ok(st.getItem(realEstateDraftKeyStorageKey({ userId: "u1", category: "bienes-raices", sellerType: "personal" })));
    const fresh = getOrCreateRealEstateDraftKey(st, { userId: "u1", category: "rentas", sellerType: "personal" });
    assert.ok(fresh && fresh !== kPriv, "a NEW application gets a new key after the clear");
    // never-clear triggers are strict no-ops
    for (const bad of ["back", "edit", "retry", "cancel"]) {
      assert.equal(clearRealEstateDraftLifecycleForLane(st, { category: "rentas", sellerType: "business" }, bad as never), 0);
    }
  });

  await check("rentas publish: pending_payment lane generates/uses a key; wrappers thread existingListingId/draftKey", () => {
    const c = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
    assert.ok(/params\.activationMode === "pending_payment"[\s\S]{0,120}callerDraftKey \?\? getOrCreateRealEstateDraftKey\(keyStorage, keyScope\)/.test(c));
    assert.ok(c.includes('if (draftKey && (category === "rentas" || category === "bienes-raices"))'), "spent-key rotation covers rentas");
    assert.ok(c.includes("paramsForRow.draftKey = draftKey;"));
    const w = read("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts");
    assert.equal((w.match(/existingListingId: opts\?\.existingListingId \?\? null,/g) ?? []).length, 5);
    assert.equal((w.match(/draftKey: opts\?\.draftKey \?\? null,/g) ?? []).length, 5);
    for (const p of [
      "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
      "app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx",
    ]) {
      const s = read(p);
      assert.ok(/publishLeonixListingFromRentas(Privado|Negocio)Draft\(toPublish, lang, null, \{\s*activationMode: "pending_payment",/.test(s), `${p} publishes pending_payment (key lane)`);
    }
  });

  if (failures.length) {
    console.error(`\nverify-recovery-autos-privado-edit-rentas-key-01: ${failures.length} failure(s), ${passed} passed`);
    process.exit(1);
  }
  console.log(`\nverify-recovery-autos-privado-edit-rentas-key-01: PASS (${passed} checks)`);
}

void main();
