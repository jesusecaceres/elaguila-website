/**
 * CLOSEOUT 2 — "ADMIN LIVE MUST MATCH PUBLIC TRUTH" + summary data layer + filters BEFORE the row limit.
 * Executable checks against the real pure modules (predicates, pager, summary via an injected fake client),
 * plus narrow source guards where behaviour lives in a server-only data function.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-closeout2-admin-live.ts
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
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

const NOW = new Date("2026-09-19T12:00:00Z").getTime();
const PAST = "2020-01-01T00:00:00Z"; // before NOW and before any real clock
const FUTURE = "2099-01-01T00:00:00Z"; // after NOW and after any real clock (summary/list paths use Date.now())

type Row = Record<string, unknown>;
const base = (over: Row): Row => ({ id: "r1", category: "x", status: "active", is_published: true, expires_at: null, ...over });
const pair = (label: string, value: string) => ({ label, value });

/** Chainable PostgREST stand-in: records every call, resolves (when awaited) through `handler`. */
type Call = [string, unknown[]];
function fakeClient(handler: (table: string, calls: Call[]) => { count?: number | null; data?: unknown; error?: { message: string } | null }) {
  const seen: { table: string; calls: Call[] }[] = [];
  const client = {
    from(table: string) {
      const calls: Call[] = [];
      seen.push({ table, calls });
      const b: unknown = new Proxy(
        {},
        {
          get(_t, prop) {
            if (prop === "then") {
              return (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
                try {
                  const r = handler(table, calls);
                  return Promise.resolve({ count: r.count ?? null, data: r.data ?? null, error: r.error ?? null }).then(resolve, reject);
                } catch (e) {
                  return reject ? Promise.resolve(reject(e)) : Promise.reject(e);
                }
              };
            }
            return (...args: unknown[]) => {
              calls.push([String(prop), args]);
              return b;
            };
          },
        },
      );
      return b;
    },
  };
  return { client: client as never, seen };
}
const isHead = (calls: Call[]) => calls.some(([m, a]) => m === "select" && (a[1] as { head?: boolean } | undefined)?.head === true);
const has = (calls: Call[], method: string, ...args: unknown[]) =>
  calls.some(([m, a]) => m === method && args.every((x, i) => JSON.stringify(a[i]) === JSON.stringify(x)));

async function main() {
  const P = await import("../app/admin/_lib/adminLivePredicates");
  const scan = await import("../app/admin/_lib/adminPagedScan");

  // ── Rentas ────────────────────────────────────────────────────────────────────────────────────
  await check("rentas: null expires_at is NOT public; future is; past is not (lifecycle expirationRequired)", () => {
    assert.equal(P.isGenericListingPubliclyLive("rentas", base({ category: "rentas", expires_at: null }), NOW), false);
    assert.equal(P.isGenericListingPubliclyLive("rentas", base({ category: "rentas", expires_at: FUTURE }), NOW), true);
    assert.equal(P.isGenericListingPubliclyLive("rentas", base({ category: "rentas", expires_at: PAST }), NOW), false);
  });
  await check("rentas: rentado / bajo_contrato machine status hidden; disponible/pendiente shown; unpublished/sold hidden", () => {
    const rentas = (over: Row) => base({ category: "rentas", expires_at: FUTURE, ...over });
    for (const v of ["rentado", "bajo_contrato"]) {
      assert.equal(P.isGenericListingPubliclyLive("rentas", rentas({ detail_pairs: [pair("Leonix:rent:listing_status", v)] }), NOW), false, v);
    }
    for (const v of ["disponible", "pendiente"]) {
      assert.equal(P.isGenericListingPubliclyLive("rentas", rentas({ detail_pairs: [pair("Leonix:rent:listing_status", v)] }), NOW), true, v);
    }
    assert.equal(P.isGenericListingPubliclyLive("rentas", rentas({ is_published: false }), NOW), false);
    assert.equal(P.isGenericListingPubliclyLive("rentas", rentas({ status: "sold" }), NOW), false);
    assert.equal(P.isGenericListingPubliclyLive("rentas", rentas({ is_published: null }), NOW), true, "public Rentas treats null published as published");
  });
  await check("rentas: a Bienes Raices rent-operation row is never a Rentas live row (category must match)", () => {
    assert.equal(P.isGenericListingPubliclyLive("rentas", base({ category: "bienes-raices", expires_at: FUTURE, detail_pairs: [pair("Leonix:operation", "rent")] }), NOW), false);
    const sel = raw("app/admin/_lib/listingsAdminSelect.ts");
    assert.match(sel, /cat\.toLowerCase\(\) === "rentas" && !qLower && detailPairsAvailable && !isLive/, "BR rent merge excluded from Live");
  });

  // ── En Venta ──────────────────────────────────────────────────────────────────────────────────
  await check("en-venta: sold is NOT live; active + null/true published is; unpublished is not", () => {
    assert.equal(P.isGenericListingPubliclyLive("en-venta", base({ category: "en-venta", status: "sold" }), NOW), false);
    assert.equal(P.isGenericListingPubliclyLive("en-venta", base({ category: "en-venta" }), NOW), true);
    assert.equal(P.isGenericListingPubliclyLive("en-venta", base({ category: "en-venta", is_published: null }), NOW), true);
    assert.equal(P.isGenericListingPubliclyLive("en-venta", base({ category: "en-venta", is_published: false }), NOW), false);
    assert.equal(P.isGenericListingPubliclyLive("en-venta", base({ category: "en-venta", status: "pending" }), NOW), false);
  });

  // ── Busco / Mascotas / Comunidad / Clases ─────────────────────────────────────────────────────
  await check("busco/mascotas/comunidad: sold IS live (public reader is status IN active,sold); needs is_published=true", () => {
    for (const c of ["busco", "mascotas-y-perdidos", "comunidad"]) {
      assert.equal(P.isGenericListingPubliclyLive(c, base({ category: c, status: "sold" }), NOW), true, `${c} sold`);
      assert.equal(P.isGenericListingPubliclyLive(c, base({ category: c, status: "active" }), NOW), true, `${c} active`);
      assert.equal(P.isGenericListingPubliclyLive(c, base({ category: c, is_published: null }), NOW), false, `${c} null published`);
      assert.equal(P.isGenericListingPubliclyLive(c, base({ category: c, status: "pending" }), NOW), false, `${c} pending`);
      assert.equal(P.isGenericListingPubliclyLive(c, base({ category: c, status: "removed" }), NOW), false, `${c} removed`);
    }
  });
  await check("clases: paid term enforced (expired hidden, null kept), sold visible like the public reader", () => {
    assert.equal(P.isGenericListingPubliclyLive("clases", base({ category: "clases", expires_at: PAST }), NOW), false);
    assert.equal(P.isGenericListingPubliclyLive("clases", base({ category: "clases", expires_at: FUTURE }), NOW), true);
    assert.equal(P.isGenericListingPubliclyLive("clases", base({ category: "clases", expires_at: null }), NOW), true);
    assert.equal(P.isGenericListingPubliclyLive("clases", base({ category: "clases", status: "sold" }), NOW), true);
  });

  // ── Bienes Raices ─────────────────────────────────────────────────────────────────────────────
  await check("bienes-raices: FSBO term, is_published=true, and the inventory-child parent gate", () => {
    const fsbo = (over: Row) => base({ category: "bienes-raices", seller_type: "personal", expires_at: FUTURE, ...over });
    assert.equal(P.isGenericListingPubliclyLive("bienes-raices", fsbo({}), NOW), true);
    assert.equal(P.isGenericListingPubliclyLive("bienes-raices", fsbo({ expires_at: PAST }), NOW), false, "expired FSBO");
    assert.equal(P.isGenericListingPubliclyLive("bienes-raices", fsbo({ is_published: null }), NOW), false, "public BR SQL is is_published = true");
    const negocio = base({ category: "bienes-raices", seller_type: "business", inventory_role: "main", owner_id: "o1", expires_at: null });
    assert.equal(P.isGenericListingPubliclyLive("bienes-raices", negocio, NOW), true, "Negocio subscription row has no term");
    const child = base({ id: "c1", category: "bienes-raices", seller_type: "business", inventory_role: "inventory_property", br_inventory_parent_listing_id: "p1", owner_id: "o1" });
    const parent = { id: "p1", category: "bienes-raices", seller_type: "business", inventory_role: "main", owner_id: "o1", status: "active", is_published: true };
    assert.equal(P.isGenericListingPubliclyLive("bienes-raices", child, NOW, new Map([["p1", parent]])), true);
    assert.equal(P.isGenericListingPubliclyLive("bienes-raices", child, NOW, new Map([["p1", { ...parent, status: "paused" }]])), false, "paused parent");
    assert.equal(P.isGenericListingPubliclyLive("bienes-raices", child, NOW, new Map([["p1", { ...parent, is_published: false }]])), false, "unpublished parent");
    assert.equal(P.isGenericListingPubliclyLive("bienes-raices", child, NOW, new Map([["p1", { ...parent, owner_id: "o2" }]])), false, "other owner's parent");
    assert.equal(P.isGenericListingPubliclyLive("bienes-raices", child, NOW, new Map()), false, "orphan child");
    assert.deepEqual(P.collectBrParentIdsForLive([child, negocio]), ["p1"]);
  });

  // ── row-action gating delegates to the same predicate ─────────────────────────────────────────
  await check("listingsRowIsPublicLive delegates: agrees with the new predicate for generic categories, keeps legacy fallback", async () => {
    const cap = await import("../app/admin/_lib/classifiedsRepublishCapability");
    const rows: Row[] = [
      base({ category: "rentas", expires_at: null }),
      base({ category: "rentas", expires_at: FUTURE }),
      base({ category: "busco", status: "sold" }),
      base({ category: "en-venta", status: "sold" }),
      base({ category: "en-venta", is_published: null }),
      base({ category: "clases", expires_at: PAST }),
      base({ category: "bienes-raices", seller_type: "personal", expires_at: PAST }),
    ];
    for (const r of rows) {
      assert.equal(cap.listingsRowIsPublicLive(r), P.isGenericListingPubliclyLive(String(r.category), r), JSON.stringify(r));
    }
    assert.equal(cap.listingsRowIsPublicLive(base({ category: "other", status: "removed" })), false);
    assert.equal(cap.listingsRowIsPublicLive({ status: "active", is_published: true }), true, "no category → legacy canonical rule");
    assert.equal(cap.autosRowIsPublicLive({ status: "active", lane: "privado", expires_at: PAST }), false, "row-level Autos expiry");
    assert.equal(cap.autosRowIsPublicLive({ status: "active", lane: "privado", expires_at: null }), true);
  });

  // ── SQL plan ──────────────────────────────────────────────────────────────────────────────────
  await check("live SQL plan: statuses / published / expiry per lane; superset flagged inexact", () => {
    assert.deepEqual(P.genericLiveSqlPlan("Rentas"), { category: "rentas", statuses: ["active"], publishedMode: "not_false", expiresMode: "required_future", exact: false });
    assert.deepEqual([...P.genericLiveSqlPlan("busco").statuses], ["active", "sold"]);
    assert.deepEqual([...P.genericLiveSqlPlan("en-venta").statuses], ["active"]);
    assert.equal(P.genericLiveSqlPlan("bienes-raices").publishedMode, "true");
    assert.equal(P.genericLiveSqlPlan("bienes-raices").exact, false);
    assert.equal(P.genericLiveSqlPlan("").exact, false, "no category → superset");
    const { client, seen } = fakeClient(() => ({ data: [] }));
    const q = (client as never as { from(t: string): unknown }).from("listings");
    P.applyGenericLiveSqlPlan(q, P.genericLiveSqlPlan("rentas"), "2026-09-19T12:00:00.000Z");
    const calls = seen[0].calls;
    assert.ok(has(calls, "eq", "status", "active"));
    assert.ok(has(calls, "or", "is_published.is.null,is_published.eq.true"));
    assert.ok(has(calls, "gt", "expires_at", "2026-09-19T12:00:00.000Z"));
  });

  // ── Autos ─────────────────────────────────────────────────────────────────────────────────────
  await check("autos: active required; Privado expiry hides; dealer child needs an active same-owner negocios main parent", () => {
    const auto = (over: Row) => ({ id: "a1", status: "active", lane: "negocios", expires_at: null, inventory_role: null, owner_user_id: "o1", ...over });
    assert.equal(P.isAutosRowPubliclyLive(auto({}), undefined, NOW), true);
    assert.equal(P.isAutosRowPubliclyLive(auto({ status: "pending_payment" }), undefined, NOW), false);
    assert.equal(P.isAutosRowPubliclyLive(auto({ lane: "privado", expires_at: PAST }), undefined, NOW), false);
    assert.equal(P.isAutosRowPubliclyLive(auto({ lane: "privado", expires_at: FUTURE }), undefined, NOW), true);
    assert.equal(P.isAutosRowPubliclyLive(auto({ lane: "privado", expires_at: null }), undefined, NOW), true, "Privado without expires_at is still public (public pool)");
    const child = auto({ id: "c1", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "p1" });
    const parent = { id: "p1", lane: "negocios", inventory_role: "main", owner_user_id: "o1", status: "active" };
    assert.equal(P.isAutosRowPubliclyLive(child, new Map([["p1", parent]]), NOW), true);
    assert.equal(P.isAutosRowPubliclyLive(child, new Map([["p1", { ...parent, status: "removed" }]]), NOW), false);
    assert.equal(P.isAutosRowPubliclyLive(child, (id) => (id === "p1" ? parent : null), NOW), true, "resolver form");
    assert.equal(P.isAutosRowPubliclyLive(child, () => null, NOW), false);
    assert.deepEqual(P.collectAutosChildParentIds([child, auto({})]), ["p1"]);
  });

  // ── Ofertas ───────────────────────────────────────────────────────────────────────────────────
  await check("ofertas: approved + published_at + future expires_at + current asset + valid window; each gap hides it", () => {
    const of = (over: Row): Row => ({
      id: "o1", status: "approved", offer_type: "weekly_flyer", business_name: "Tienda", title: "Ofertas",
      valid_from: "2026-09-01", valid_until: "2026-12-31", published_at: PAST, expires_at: FUTURE,
      public_source_asset_id: "asset-1", asset_lifecycle_status: "current", ...over,
    });
    assert.equal(P.isOfertaPubliclyLive(of({}), NOW), true);
    assert.equal(P.isOfertaPubliclyLive(of({ status: "pending_review" }), NOW), false);
    assert.equal(P.isOfertaPubliclyLive(of({ published_at: null }), NOW), false);
    assert.equal(P.isOfertaPubliclyLive(of({ expires_at: PAST }), NOW), false);
    assert.equal(P.isOfertaPubliclyLive(of({ expires_at: null }), NOW), false);
    assert.equal(P.isOfertaPubliclyLive(of({ public_source_asset_id: null }), NOW), false);
    assert.equal(P.isOfertaPubliclyLive(of({ asset_lifecycle_status: "replaced" }), NOW), false);
    assert.equal(P.isOfertaPubliclyLive(of({ asset_lifecycle_status: null }), NOW), true, "missing lifecycle defaults to current");
  });

  // ── dedicated lanes that already agree ────────────────────────────────────────────────────────
  await check("empleos/servicios/restaurantes/comida-local/viajes predicates", () => {
    assert.equal(P.isEmpleosRowPubliclyLive({ lifecycle_status: "published" }), true);
    assert.equal(P.isEmpleosRowPubliclyLive({ lifecycle_status: "paused" }), false);
    assert.equal(P.isServiciosRowPubliclyLive({ listing_status: "published" }), true);
    assert.equal(P.isServiciosRowPubliclyLive({ listing_status: "pending_payment" }), false);
    assert.equal(P.isRestauranteRowPubliclyLive({ status: "published" }), true);
    assert.equal(P.isComidaLocalRowPubliclyLive({ status: "paused" }), false);
    assert.equal(P.isViajesRowPubliclyLive({ lifecycle_status: "approved", is_public: true }), true);
    assert.equal(P.isViajesRowPubliclyLive({ lifecycle_status: "approved", is_public: false }), false);
  });

  // ── filters BEFORE the limit (pager) ──────────────────────────────────────────────────────────
  await check("scanPagedRows: an old match beyond the first window is found; the limit applies AFTER filtering", async () => {
    const all = Array.from({ length: 1000 }, (_, i) => ({ id: `r${i}`, ok: i % 100 === 99 })); // 10 matches, deep
    const res = await scan.scanPagedRows({
      limit: 5,
      pageSize: 100,
      fetchPage: async (from, to) => ({ data: all.slice(from, to + 1), error: null }),
      accept: (rows) => rows.filter((r) => r.ok),
      getId: (r) => r.id,
    });
    assert.equal(res.rows.length, 5);
    assert.equal(res.rows[0].id, "r99");
    assert.equal(res.error, null);
    // naive limit-then-filter would have returned nothing for the first 5-row window
    const naive = all.slice(0, 5).filter((r) => r.ok);
    assert.equal(naive.length, 0);
  });
  await check("scanPagedRows: cap flagged, exhaustion is not a cap, errors surface, no-filter path is one window", async () => {
    const all = Array.from({ length: 500 }, (_, i) => ({ id: `r${i}`, ok: false }));
    const capped = await scan.scanPagedRows({ limit: 3, pageSize: 100, maxScan: 200, fetchPage: async (f, t) => ({ data: all.slice(f, t + 1), error: null }), accept: (r) => r.filter((x) => x.ok) });
    assert.equal(capped.capped, true);
    assert.equal(capped.rows.length, 0);
    const done = await scan.scanPagedRows({ limit: 3, pageSize: 100, maxScan: 5000, fetchPage: async (f, t) => ({ data: all.slice(f, t + 1), error: null }), accept: (r) => r.filter((x) => x.ok) });
    assert.equal(done.capped, false);
    const err = await scan.scanPagedRows({ limit: 3, fetchPage: async () => ({ data: null, error: { message: "boom" } }) });
    assert.equal(err.error, "boom");
    let calls = 0;
    const one = await scan.scanPagedRows({ limit: 10, fetchPage: async (f, t) => { calls++; return { data: all.slice(f, t + 1), error: null }; } });
    assert.equal(calls, 1);
    assert.equal(one.rows.length, 10);
    const acceptThrows = await scan.scanPagedRows({ limit: 3, pageSize: 10, fetchPage: async (f, t) => ({ data: all.slice(f, t + 1), error: null }), accept: () => { throw new Error("parent read failed"); } });
    assert.equal(acceptThrows.error, "parent read failed");
  });

  // ── summary layer (fake client) ───────────────────────────────────────────────────────────────
  const S = await import("../app/admin/_lib/adminCategorySummary");
  await check("summary: every registry slug returns the exact contract shape and never throws (even on total failure)", async () => {
    const boom = fakeClient(() => ({ error: { message: "db down" }, data: null }));
    for (const slug of S.ADMIN_CATEGORY_SUMMARY_SLUGS) {
      const r = await S.fetchAdminCategorySummaryWithClient(boom.client, slug);
      assert.equal(r.slug, slug);
      for (const k of ["total", "live", "needsAttention", "paymentIssue", "expired"] as const) {
        assert.ok(r[k] === null, `${slug}.${k} must be null on error, got ${String(r[k])}`);
      }
      assert.equal(r.sourceHealth.ok, false);
      assert.ok(r.queryError && r.queryError.includes("db down"), slug);
    }
    const thrower = { from() { throw new Error("client exploded"); } } as never;
    const t = await S.fetchAdminCategorySummaryWithClient(thrower, "busco");
    assert.ok(t.queryError && t.queryError.includes("client exploded"));
    const unknown = await S.fetchAdminCategorySummaryWithClient(boom.client, "nope");
    assert.ok(unknown.queryError?.includes("unknown category slug"));
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const none = await S.fetchAdminCategorySummary("busco");
      assert.equal(none.slug, "busco"); // unconfigured in this process → error object, not a throw
      assert.equal(none.live, null);
      assert.ok(none.queryError);
    }
  });
  await check("summary: busco live = SQL count with is_published=true AND status IN (active,sold); needsAttention pending/flagged; no payment/expired concept", async () => {
    const f = fakeClient((_t, calls) => (isHead(calls) ? { count: has(calls, "in", "status", ["active", "sold"]) ? 3 : has(calls, "in", "status", ["pending", "flagged"]) ? 2 : 9 } : { data: [] }));
    const r = await S.fetchAdminCategorySummaryWithClient(f.client, "busco");
    assert.equal(r.total, 9);
    assert.equal(r.live, 3);
    assert.equal(r.needsAttention, 2);
    assert.equal(r.paymentIssue, null);
    assert.equal(r.expired, null);
    assert.equal(r.queryError, null);
    const liveCalls = f.seen.map((s) => s.calls).find((c) => has(c, "in", "status", ["active", "sold"]))!;
    assert.ok(has(liveCalls, "eq", "is_published", true));
    assert.ok(!liveCalls.some(([m, a]) => m === "or" && String(a[0]).includes("is_published")), "strict published, no null-or");
  });
  await check("summary: en-venta live excludes sold (status=active only) and treats null published as published", async () => {
    const f = fakeClient(() => ({ count: 1 }));
    await S.fetchAdminCategorySummaryWithClient(f.client, "en-venta");
    const liveCalls = f.seen.map((s) => s.calls).find((c) => has(c, "eq", "status", "active") && has(c, "or", "is_published.is.null,is_published.eq.true"))!;
    assert.ok(liveCalls, "live query present");
    assert.ok(!f.seen.some((s) => has(s.calls, "in", "status", ["active", "sold"])));
  });
  await check("summary: rentas live = predicate over projection (null expiry / rentado excluded); paymentIssue = pending/pending_payment; expired counted", async () => {
    const rows = [
      base({ id: "1", category: "rentas", expires_at: FUTURE }),
      base({ id: "2", category: "rentas", expires_at: null }),
      base({ id: "3", category: "rentas", expires_at: FUTURE, detail_pairs: [pair("Leonix:rent:listing_status", "rentado")] }),
    ];
    const f = fakeClient((_t, calls) => {
      if (isHead(calls)) return { count: has(calls, "in", "status", ["pending", "pending_payment"]) ? 4 : has(calls, "lte", "expires_at") ? 2 : 10 };
      return has(calls, "range", 0, 999) ? { data: rows } : { data: [] };
    });
    const r = await S.fetchAdminCategorySummaryWithClient(f.client, "rentas");
    assert.equal(r.live, 1, "only the future-dated, available row");
    assert.equal(r.paymentIssue, 4);
    assert.equal(r.expired, 2);
    assert.equal(r.total, 10);
    assert.match(r.sourceHealth.note ?? "", /future expires_at REQUIRED/);
  });
  await check("summary: bienes-raices live applies the parent gate over the projection", async () => {
    const parent = { id: "p1", category: "bienes-raices", seller_type: "business", inventory_role: "main", owner_id: "o1", status: "active", is_published: true };
    const rows = [
      base({ id: "p1", category: "bienes-raices", seller_type: "business", inventory_role: "main", owner_id: "o1" }),
      base({ id: "c1", category: "bienes-raices", seller_type: "business", inventory_role: "inventory_property", br_inventory_parent_listing_id: "p1", owner_id: "o1" }),
      base({ id: "c2", category: "bienes-raices", seller_type: "business", inventory_role: "inventory_property", br_inventory_parent_listing_id: "gone", owner_id: "o1" }),
    ];
    const f = fakeClient((_t, calls) => {
      if (isHead(calls)) return { count: 7 };
      if (has(calls, "in", "id")) return { data: [parent] };
      return has(calls, "range", 0, 999) ? { data: rows } : { data: [] };
    });
    const r = await S.fetchAdminCategorySummaryWithClient(f.client, "bienes-raices");
    assert.equal(r.live, 2, "orphan child c2 excluded");
    assert.equal(r.queryError, null);
  });
  await check("summary: autos lane filter reaches SQL; live applies Privado expiry SQL + child gate; paymentIssue/expired shapes", async () => {
    const rows = [
      { id: "m1", status: "active", lane: "negocios", expires_at: null, inventory_role: "main", owner_user_id: "o1" },
      { id: "c1", status: "active", lane: "negocios", expires_at: null, inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "m1", owner_user_id: "o1" },
      { id: "c2", status: "active", lane: "negocios", expires_at: null, inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "zz", owner_user_id: "o1" },
    ];
    const f = fakeClient((_t, calls) => {
      if (isHead(calls)) return { count: has(calls, "in", "status", ["pending_payment", "payment_failed"]) ? 5 : 8 };
      if (has(calls, "in", "id")) return { data: [rows[0]] };
      return has(calls, "range", 0, 999) ? { data: rows } : { data: [] };
    });
    const neg = await S.fetchAdminCategorySummaryWithClient(f.client, "autos", { lane: "negocios" });
    assert.equal(neg.live, 2);
    assert.equal(neg.paymentIssue, 5);
    assert.equal(neg.expired, null, "negocios has no term");
    assert.equal(neg.needsAttention, null);
    assert.ok(f.seen.some((s) => has(s.calls, "eq", "lane", "negocios")), "lane reaches SQL");
    assert.ok(f.seen.some((s) => s.calls.some(([m, a]) => m === "or" && String(a[0]).includes("lane.neq.privado"))), "Privado expiry in SQL");
    const priv = await S.fetchAdminCategorySummaryWithClient(f.client, "autos", { lane: "privado" });
    assert.equal(priv.expired, 8);
  });
  await check("summary: ofertas live = predicate over projection; expired uses status/expires_at union", async () => {
    const good: Row = { id: "o1", status: "approved", offer_type: "weekly_flyer", business_name: "T", title: "T", valid_from: "2026-09-01", valid_until: "2026-12-31", published_at: PAST, expires_at: FUTURE, public_source_asset_id: "a", asset_lifecycle_status: "current" };
    const bad: Row = { ...good, id: "o2", public_source_asset_id: null };
    const f = fakeClient((_t, calls) => (isHead(calls) ? { count: 6 } : has(calls, "range", 0, 999) ? { data: [good, bad] } : { data: [] }));
    const r = await S.fetchAdminCategorySummaryWithClient(f.client, "ofertas-locales");
    assert.equal(r.live, 1);
    assert.equal(r.total, 6);
    assert.ok(f.seen.some((s) => s.calls.some(([m, a]) => m === "or" && String(a[0]).startsWith("status.eq.expired,and(status.eq.approved,expires_at.lte."))));
  });
  await check("summary: simple lanes (servicios / restaurantes / empleos / comida-local / travel) query the right tables and predicates", async () => {
    const f = fakeClient(() => ({ count: 2 }));
    const want: Record<string, { table: string; live: [string, ...unknown[]] }> = {
      servicios: { table: "servicios_public_listings", live: ["eq", "listing_status", "published"] },
      restaurantes: { table: "restaurantes_public_listings", live: ["eq", "status", "published"] },
      empleos: { table: "empleos_public_listings", live: ["eq", "lifecycle_status", "published"] },
      "comida-local": { table: "comida_local_public_listings", live: ["eq", "status", "published"] },
      travel: { table: "viajes_staged_listings", live: ["eq", "lifecycle_status", "approved"] },
    };
    for (const [slug, w] of Object.entries(want)) {
      const r = await S.fetchAdminCategorySummaryWithClient(f.client, slug);
      assert.equal(r.live, 2, slug);
      assert.equal(r.sourceHealth.source, w.table);
      assert.ok(f.seen.some((s) => s.table === w.table && has(s.calls, w.live[0], ...w.live.slice(1))), slug);
    }
    const trav = f.seen.filter((s) => s.table === "viajes_staged_listings");
    assert.ok(trav.some((s) => has(s.calls, "eq", "is_public", true)), "travel live requires is_public");
  });
  await check("autos dealer capacity: counts ALL active dealer rows per group with the shared key; standard limit exported (no literal 10)", async () => {
    const rows = [
      { id: "m1", lane: "negocios", status: "active", owner_user_id: "o1", dealer_inventory_group_id: "g1", dealer_inventory_parent_listing_id: null },
      { id: "c1", lane: "negocios", status: "active", owner_user_id: "o1", dealer_inventory_group_id: "g1", dealer_inventory_parent_listing_id: "m1" },
      { id: "c2", lane: "negocios", status: "active", owner_user_id: "o1", dealer_inventory_group_id: null, dealer_inventory_parent_listing_id: "m2" },
      { id: "m2", lane: "negocios", status: "active", owner_user_id: "o1", dealer_inventory_group_id: null, dealer_inventory_parent_listing_id: null },
      { id: "x", lane: "privado", status: "active", owner_user_id: "o9", dealer_inventory_group_id: null, dealer_inventory_parent_listing_id: null },
    ];
    const g = S.countActiveDealerRowsByGroup(rows);
    assert.deepEqual(Object.fromEntries(g.map((x) => [x.groupKey, x.activeCount])), { g1: 2, m2: 2 }, "child without group id falls back to its parent id; privado excluded");
    const f = fakeClient((_t, calls) => (has(calls, "range", 0, 999) ? { data: rows.slice(0, 4) } : { data: [] }));
    const truth = await S.fetchAutosDealerCapacityTruthWithClient(f.client, ["o1"]);
    assert.equal(truth.ok, true);
    assert.equal(truth.activeByGroupKey.g1, 2);
    assert.equal(truth.totalActiveDealerRows, 4);
    assert.equal(truth.standardLimit, 10);
    assert.equal(S.AUTOS_DEALER_STANDARD_LIMIT, 10);
    assert.ok(f.seen.some((s) => has(s.calls, "in", "owner_user_id", ["o1"])));
    const bad = await S.fetchAutosDealerCapacityTruthWithClient(fakeClient(() => ({ error: { message: "nope" } })).client);
    assert.equal(bad.ok, false);
    assert.equal(bad.error, "nope");
  });

  // ── source guards: data layers wired (server-only / route code cannot be imported under raw tsx) ─
  await check("listingsAdminSelect: Live predicate runs before the limit (pager), post-limit filter removed, no BR merge in Live", () => {
    const s = raw("app/admin/_lib/listingsAdminSelect.ts");
    assert.match(s, /scanPagedRows<Record<string, unknown>>/);
    assert.match(s, /applyGenericLiveSqlPlan\(q, livePlan, nowIso\)/);
    assert.match(s, /isGenericListingPubliclyLive\(cat \|\| null, r, nowMs\)/);
    assert.match(s, /isBrRowPubliclyLive\(r, nowMs, parents\)/);
    assert.ok(!/merged\.filter\(\(r\) => listingsRowIsPublicLive/.test(s), "old post-limit in-memory live filter is gone");
    assert.ok(!/qb\.eq\("is_published", true\)\.eq\("status", "active"\)/.test(s), "old hard-coded live SQL is gone");
    assert.match(s, /partialOwner/);
    assert.match(s, /leonix\?: \{ branch\?: string/);
  });
  await check("autos admin list: expires_at selected, Privado expiry + child gate before the cap, lane still SQL, payable-status code untouched", () => {
    const s = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    const fn = s.slice(s.indexOf("export async function listAllAutosClassifiedsRowsForAdmin"), s.indexOf("export async function updateAutosListingStatus"));
    assert.match(fn, /published_at, expires_at, updated_at/);
    assert.match(fn, /lane\.is\.null,lane\.neq\.privado,expires_at\.is\.null,expires_at\.gt\./);
    assert.match(fn, /isAutosRowPubliclyLive\(r, parentsById, nowMs\)/);
    assert.match(fn, /q = q\.eq\("lane", opts\.lane\)/);
    assert.match(fn, /rowFilter\?: \(row: AutosClassifiedsListingRow\) => boolean/);
    assert.match(s, /AUTOS_PAYABLE_LISTING_STATUSES/);
    assert.match(s, /\(row\.lane === "negocios" \|\| row\.lane === "privado"\) && row\.status === "active"/);
  });
  await check("ofertas admin helper: scope queue|live|history + status_group/lane/commercial/scan_review/term applied before the limit", async () => {
    const s = raw("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts");
    assert.match(s, /export type OfertasLocalesAdminScope = "queue" \| "live" \| "history";/);
    for (const k of ["status_group", "lane", "commercial", "scan_review", "term"]) assert.match(s, new RegExp(`${k}\\?: string;`), k);
    assert.match(s, /export async function listOfertasLocalesAdminRowsDetailed/);
    assert.match(s, /applyOfertasLiveSqlSuperset\(query, nowIso\)/);
    assert.match(s, /OFERTAS_LOCALES_HISTORY_STATUSES, OFERTAS_LOCALES_LIVE_STATUS/);
    assert.match(s, /ADMIN_SEARCH_UUID_RE\.test\(search\) \? \[`id\.eq/, "closeout-1 search fix preserved");
    // pure derived-filter function is executable
    const H = await import("../app/lib/ofertas-locales/ofertasLocalesAdminHelpers");
    const vm = (adminKey: string, offerType: string, term = "active", ok = true) =>
      ({ offerType, publicTermStatus: term, operationalStatus: { adminKey, adminApprovalAllowed: ok } }) as never;
    assert.equal(H.ofertaListVmMatchesAdminDerivedFilters(vm("active", "weekly_flyer"), { lane: "coupon" }), false);
    assert.equal(H.ofertaListVmMatchesAdminDerivedFilters(vm("active", "coupon"), { lane: "coupon" }), true);
    assert.equal(H.ofertaListVmMatchesAdminDerivedFilters(vm("scan_unresolved", "coupon"), { scan_review: "blocked" }), true);
    assert.equal(H.ofertaListVmMatchesAdminDerivedFilters(vm("scan_unresolved", "coupon"), { scan_review: "ready" }), false);
    assert.equal(H.ofertaListVmMatchesAdminDerivedFilters(vm("expiring", "coupon"), { term: "expiring" }), true);
    assert.equal(H.ofertaListVmMatchesAdminDerivedFilters(vm("active", "coupon", "expired"), { term: "expired" }), true);
    assert.equal(H.ofertaListVmMatchesAdminDerivedFilters(vm("active", "coupon"), { status_group: "expiring" }), false);
    assert.equal(H.ofertaListVmMatchesAdminDerivedFilters(vm("commercially_ineligible", "coupon"), { commercial: "blocked" }), true);
    assert.equal(H.ofertaListVmMatchesAdminDerivedFilters(vm("active", "coupon"), {}), true);
  });
  await check("ofertas admin list (fake client): live scope applies SQL superset + exact predicate; history scope reaches rejected/archived/expired", async () => {
    const H = await import("../app/lib/ofertas-locales/ofertasLocalesAdminHelpers");
    const mk = (id: string, over: Row = {}): Row => ({
      id, owner_id: "u", status: "approved", offer_type: "weekly_flyer", business_name: "T", title: "T", valid_from: "2026-09-01", valid_until: "2099-12-31",
      published_at: PAST, expires_at: FUTURE, public_source_asset_id: "a", asset_lifecycle_status: "current", flyer_assets: [], coupon_assets: [], ...over,
    });
    const rows = [mk("live1"), mk("noasset", { public_source_asset_id: null }), mk("rej", { status: "rejected", expires_at: null }), mk("arch", { status: "archived" }), mk("exp", { status: "expired" })];
    const f = fakeClient(() => ({ data: rows }));
    const live = await H.listOfertasLocalesAdminRowsDetailed(f.client, { scope: "live", limit: 50 });
    assert.deepEqual(live.rows.map((r) => r.id), ["live1"]);
    assert.ok(has(f.seen[0].calls, "eq", "status", "approved"));
    const hist = await H.listOfertasLocalesAdminRowsDetailed(f.client, { scope: "history", limit: 50 });
    assert.deepEqual(hist.rows.map((r) => r.id).sort(), ["arch", "exp", "noasset", "rej"].sort(), "live1 excluded; approved-not-live + rejected/archived/expired included");
    const queue = await H.listOfertasLocalesAdminRowsDetailed(f.client, { limit: 50 });
    assert.ok(has(f.seen[f.seen.length - 1].calls, "in", "status", ["pending_review", "submitted", "draft"]));
    assert.equal(queue.rows.length, rows.length, "queue scope returns what SQL returns (operational rows)");
  });
  await check("empleos: search filter moves into the data layer and runs before the row cap; API route builds the filter before fetching", () => {
    const d = raw("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts");
    const fn = d.slice(d.indexOf("export async function fetchAllEmpleosListingsForAdmin"), d.indexOf("export async function updateEmpleosListingLifecycleAdmin"));
    assert.match(fn, /rowFilter\?: \(row: EmpleosPublicListingRow\) => boolean/);
    assert.match(fn, /scanPagedRows<EmpleosPublicListingRow>/);
    assert.match(fn, /republish_sort_at/, "schema-drift fallback preserved");
    assert.ok(!/\.limit\(cap\)/.test(fn), "no bare limit before filtering");
    const r = raw("app/api/admin/empleos/listings/route.ts");
    assert.ok(r.indexOf("rowFilter = (r) =>") < r.indexOf("fetchAllEmpleosListingsForAdmin({ limit, scope, rowFilter })"), "filter built before the fetch");
    assert.ok(!/rows = rows\.filter\(\(r\) => \{\s*const job = rowToJobRecord/.test(r), "old post-limit search filter is gone");
  });
  await check("travel: q applied in the data layer before the row cap (pure matcher + windowed scan), live stays SQL", () => {
    const d = raw("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
    assert.match(d, /q\?: string;/);
    assert.match(d, /export function viajesStagedRowMatchesAdminSearch/);
    assert.match(d, /scanPagedRows<ViajesStagedListingRow>/);
    assert.match(d, /q\.eq\("lifecycle_status", "approved"\)\.eq\("is_public", true\)/);
    assert.ok(!/\.limit\(cap\)/.test(d.slice(d.indexOf("export async function fetchViajesStagedAdminQueue"), d.indexOf("export async function updateViajesStagedListingModeration"))));
  });

  // ── preserved literals from earlier gates (must not be reverted) ──────────────────────────────
  await check("pinned literals + closeout-1 code still present", () => {
    assert.ok(raw("app/(site)/dashboard/mis-anuncios/page.tsx").includes('if (status === "sold") patch.is_published = false;'));
    assert.ok(raw("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts").includes("args.existingListingId?.trim() ||"));
    assert.ok(raw("app/admin/_lib/adminReactivationPolicy.ts").includes("decideAdminReactivation"));
    assert.ok(raw("app/lib/listingLifecycle/enforcedTermReadPredicate.ts").includes("isListingRowWithinEnforcedTerm"));
    assert.match(raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts"), /AUTOS_PAYABLE_LISTING_STATUSES/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
