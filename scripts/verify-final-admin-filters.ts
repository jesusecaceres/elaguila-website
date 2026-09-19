/**
 * FINAL ADMIN FUNCTIONAL NORMALIZATION (2026-09) — GATE 3 (filter / search / limit truth) + GATE 4 (functional contract).
 *
 * Executable checks (no database, no network, no writes):
 *   - pure helpers (`adminFilterTruth`, `adminAutosDealerGroups`, `adminAutosDealerCapacity`) run for real;
 *   - the Admin data layers run for real against a stubbed `fetch` (the PostgREST query string of every request is
 *     asserted — that is the proof a filter runs in SQL BEFORE the row limit, and that q + an exact filter is an
 *     INTERSECTION);
 *   - the operating summary runs through an injected fake client;
 *   - narrow source guards where behaviour lives in a React server page.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-admin-filters.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import Module from "node:module";

// ── test harness ──────────────────────────────────────────────────────────────────────────────────
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
/** Strip comments so a source guard cannot be satisfied (or violated) by a comment. */
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// `server-only` throws outside a React Server build; the data functions under test import it. Stub it for this process only.
{
  const M = Module as unknown as { _load: (request: string, ...rest: unknown[]) => unknown };
  const orig = M._load;
  M._load = function (this: unknown, request: string, ...rest: unknown[]) {
    if (request === "server-only") return {};
    return orig.call(this, request, ...rest);
  };
}

// Fake Supabase endpoint: every PostgREST request goes through the stubbed fetch and is recorded.
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:9";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-not-real";
type Req = { table: string; url: URL; params: URLSearchParams; method: string };
const reqs: Req[] = [];
type Reply = { status?: number; body: unknown };
let responder: (r: Req) => Reply = () => ({ body: [] });
globalThis.fetch = (async (input: unknown, init?: { method?: string }) => {
  const href = typeof input === "string" ? input : input instanceof URL ? input.href : String((input as { url?: string }).url ?? input);
  const url = new URL(href);
  const r: Req = { table: url.pathname.split("/").pop() ?? "", url, params: url.searchParams, method: init?.method ?? "GET" };
  reqs.push(r);
  const out = responder(r);
  const body = out.body;
  return new Response(JSON.stringify(body), {
    status: out.status ?? 200,
    headers: { "content-type": "application/json", "content-range": `0-${Array.isArray(body) ? Math.max(body.length - 1, 0) : 0}/*` },
  });
}) as typeof fetch;
const resetReqs = () => {
  reqs.length = 0;
};
const forTable = (t: string) => reqs.filter((r) => r.table === t);
const ERR: Reply = { status: 400, body: { message: "boom: relation does not exist", code: "42P01" } };

const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const PAST = "2020-01-01T00:00:00Z";
const FUTURE = "2099-01-01T00:00:00Z";
const pair = (label: string, value: string) => ({ label, value });

// ── injected fake client (summary layer) — same idea as verify-closeout2-admin-live.ts ─────────────
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
const rangeOf = (calls: Call[]): [number, number] | null => {
  const c = calls.find(([m]) => m === "range");
  return c ? [Number(c[1][0]), Number(c[1][1])] : null;
};

async function main() {
  const T = await import("../app/admin/_lib/adminFilterTruth");
  const shell = await import("../app/admin/(dashboard)/workspace/clasificados/_lib/adminNormalizedShell");
  const S = await import("../app/admin/_lib/adminCategorySummary");
  const sel = await import("../app/admin/_lib/listingsAdminSelect");
  const { getAdminSupabase } = await import("../app/lib/supabase/server");

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // 1. PURE: list truncation + summary labelling + PostgREST quoting
  // ════════════════════════════════════════════════════════════════════════════════════════════
  await check("filter truth: a list exactly as long as the limit discloses it; a shorter list does not", () => {
    const at = T.describeAdminListTruncation("en", { shown: 50, limit: 50 });
    assert.equal(at.length, 1);
    assert.equal(at[0].kind, "limit_reached");
    assert.match(at[0].text, /first 50 matching rows \(limit 50\)/);
    assert.deepEqual(T.describeAdminListTruncation("en", { shown: 12, limit: 50 }), []);
    assert.match(T.describeAdminListTruncation("es", { shown: 50, limit: 50 })[0].text, /Mostrando las primeras 50 filas/);
  });
  await check("filter truth: a CAPPED scan is disclosed as capped (and says an empty / short list is not proof of absence)", () => {
    const n = T.describeAdminListTruncation("en", { shown: 0, limit: 50, scanCapped: true, scanned: 3000 });
    assert.equal(n.length, 1);
    assert.equal(n[0].kind, "scan_capped");
    assert.match(n[0].text, /3,000 rows were scanned without finding 50 matches/);
    assert.match(n[0].text, /NOT shown/);
    // capped wins over the softer limit notice (never both)
    assert.equal(T.describeAdminListTruncation("en", { shown: 50, limit: 50, scanCapped: true, scanned: 3000 }).filter((x) => x.kind === "limit_reached").length, 0);
    const p = T.describeAdminListTruncation("en", { shown: 3, limit: 50, partialSources: ["owner profile"] });
    assert.equal(p[0].kind, "partial_sources");
    assert.match(p[0].text, /owner profile/);
  });
  await check("filter truth: summary caption says WHOLE category; stronger wording when filters are active; ≥ legend", () => {
    assert.match(T.adminSummaryScopeText("en", false), /whole category/);
    assert.match(T.adminSummaryScopeText("en", true), /NOT the filtered list/);
    assert.match(T.adminSummaryScopeText("es", true), /NO la lista filtrada/);
    assert.match(T.adminSummaryLowerBoundText("en"), /lower bound/);
    assert.equal(T.adminAnyFilterActive({ q: "x" }), true);
    assert.equal(T.adminAnyFilterActive({ owner_user_id: " " }), false);
    assert.equal(T.adminAnyFilterActive({ limit: "100", scope: "live" }), false, "limit / scope are not filters");
  });
  await check("filter truth: pgrstQuote makes free text safe inside or(...) (comma, parenthesis, quote, backslash)", () => {
    assert.equal(T.pgrstQuote("%casa, 2 rec%"), '"%casa, 2 rec%"');
    assert.equal(T.pgrstQuote('a"b'), '"a\\"b"');
    assert.equal(T.pgrstQuote("a\\b"), '"a\\\\b"');
    assert.equal(T.detailPairContainsLiteral("Leonix:operation", "rent"), '[{"label":"Leonix:operation","value":"rent"}]');
  });
  await check("summary cells: a scan-capped metric prints '≥ n' with the lower-bound tooltip; exact metrics print plainly", () => {
    const base = { slug: "rentas", total: 1200, live: 1000, needsAttention: 3, paymentIssue: 1, expired: null, sourceHealth: { ok: true, source: "listings", note: null }, queryError: null };
    const plain = shell.buildAdminCategorySummaryCells(base as never, "en");
    assert.equal(plain.find((c) => c.key === "live")!.value, "1,000");
    const capped = shell.buildAdminCategorySummaryCells({ ...base, lowerBound: ["live"] } as never, "en");
    const live = capped.find((c) => c.key === "live")!;
    assert.equal(live.value, "≥ 1,000");
    assert.match(String(live.title), /Lower bound/);
    assert.equal(capped.find((c) => c.key === "total")!.value, "1,200", "only the capped metric is a lower bound");
    const unavailable = shell.buildAdminCategorySummaryCells({ ...base, live: null, lowerBound: ["live"] } as never, "en");
    assert.equal(unavailable.find((c) => c.key === "live")!.value, "—", "unavailable stays '—', never '≥ 0'");
  });

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // 2. SUMMARY DATA LAYER: Empleos payment issue from evidence; capped scans flagged as lower bounds
  // ════════════════════════════════════════════════════════════════════════════════════════════
  await check("empleos payment issue: paid-lane never-live draft with a failed / absent payment record counts; nothing else is inferred", () => {
    const rows = [
      { id: "quick-none", lane: "quick", lifecycle_status: "draft", published_at: null }, // absent record -> counts
      { id: "premium-failed", lane: "premium", lifecycle_status: "draft", published_at: null }, // failed record -> counts
      { id: "quick-paid", lane: "quick", lifecycle_status: "draft", published_at: null }, // paid record -> NOT a payment issue
      { id: "feria", lane: "feria", lifecycle_status: "draft", published_at: null }, // free lane -> never
      { id: "legacy-nolane", lane: null, lifecycle_status: "draft", published_at: null }, // legacy, no evidence -> never inferred
      { id: "was-live", lane: "quick", lifecycle_status: "draft", published_at: "2026-01-01T00:00:00Z" }, // ever live -> never
      { id: "pub", lane: "quick", lifecycle_status: "published", published_at: "2026-01-01T00:00:00Z" },
      { id: "review", lane: "premium", lifecycle_status: "pending_review", published_at: null },
    ];
    const payments = [
      { listing_id: "premium-failed", payment_status: "failed" },
      { listing_id: "premium-failed", payment_status: "canceled" },
      { listing_id: "quick-paid", payment_status: "paid" },
    ];
    assert.equal(S.countEmpleosPaymentIssues(rows, payments), 2);
    assert.equal(S.countEmpleosPaymentIssues([], []), 0);
    for (const cleared of ["paid", "succeeded", "cleared", "payment_cleared"]) {
      assert.equal(S.countEmpleosPaymentIssues([rows[0]], [{ listing_id: "quick-none", payment_status: cleared }]), 0, cleared);
    }
  });
  await check("empleos summary (fake client): paymentIssue is a NUMBER from evidence; unreadable payment records => null (never a guess)", async () => {
    const drafts = [
      { id: "d1", lane: "quick", lifecycle_status: "draft", published_at: null },
      { id: "d2", lane: "premium", lifecycle_status: "draft", published_at: null },
      { id: "d3", lane: "quick", lifecycle_status: "draft", published_at: null },
    ];
    const ok = fakeClient((table, calls) => {
      if (isHead(calls)) return { count: 7 };
      if (table === "leonix_payment_records") return { data: [{ listing_id: "d3", payment_status: "paid" }] };
      return { data: drafts };
    });
    const r = await S.fetchAdminCategorySummaryWithClient(ok.client, "empleos");
    assert.equal(r.paymentIssue, 2, "d1 + d2 (d3 is paid)");
    assert.equal(r.live, 7);
    assert.equal(r.queryError, null);
    assert.match(String(r.sourceHealth.note), /Feria \(free\)/);
    const drafted = ok.seen.find((s) => s.table === "empleos_public_listings" && s.calls.some(([m, a]) => m === "in" && a[0] === "lane"))!;
    assert.ok(drafted.calls.some(([m, a]) => m === "eq" && a[0] === "lifecycle_status" && a[1] === "draft"));
    assert.ok(drafted.calls.some(([m, a]) => m === "is" && a[0] === "published_at" && a[1] === null), "never-live is a SQL predicate");

    const bad = fakeClient((table, calls) => {
      if (isHead(calls)) return { count: 7 };
      if (table === "leonix_payment_records") return { error: { message: "payments unreadable" } };
      return { data: drafts };
    });
    const b = await S.fetchAdminCategorySummaryWithClient(bad.client, "empleos");
    assert.equal(b.paymentIssue, null);
    assert.match(String(b.queryError), /payment records unreadable/);
    assert.equal(b.live, 7, "the other counts survive");
  });
  await check("summary: a scan that hits its cap flags the metric as a LOWER BOUND (never presented as the whole dataset)", async () => {
    // Rentas live = predicate over a bounded projection. Serve full pages of never-live rows: the scan cannot finish.
    const f = fakeClient((_t, calls) => {
      if (isHead(calls)) return { count: 5 };
      const r = rangeOf(calls);
      if (!r) return { data: [] };
      const rows = Array.from({ length: r[1] - r[0] + 1 }, (_, i) => ({ id: `r${r[0] + i}`, category: "rentas", status: "active", is_published: true, expires_at: PAST }));
      return { data: rows };
    });
    const s = await S.fetchAdminCategorySummaryWithClient(f.client, "rentas");
    assert.deepEqual(s.lowerBound, ["live"]);
    assert.match(String(s.sourceHealth.note), /lower bound/);
    const exact = await S.fetchAdminCategorySummaryWithClient(fakeClient((_t, calls) => (isHead(calls) ? { count: 4 } : { data: [] })).client, "rentas");
    assert.equal(exact.lowerBound, undefined, "an exhausted scan is exact");
  });

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // 3. GENERIC LISTINGS: filters BEFORE the limit, q + Leonix Ad ID intersection, capped scans, errors
  // ════════════════════════════════════════════════════════════════════════════════════════════
  const listRow = (i: number, over: Record<string, unknown> = {}) => ({
    id: UUID(1000 + i), leonix_ad_id: `RENT-2026-${String(i).padStart(6, "0")}`, title: `T${i}`, city: "X", category: "rentas", status: "active",
    owner_id: UUID(1), created_at: "2026-09-01T00:00:00Z", is_published: true, expires_at: FUTURE, ...over,
  });
  await check("generic: Leonix Ad ID is its OWN SQL predicate (case-insensitive exact for a full id, contains for a fragment) — before the limit", async () => {
    responder = () => ({ body: [] });
    resetReqs();
    await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "rentas", leonixAdId: "rent-2026-000012", limit: 50 });
    const main = forTable("listings")[0];
    assert.equal(main.params.get("leonix_ad_id"), "ilike.RENT-2026-000012", "full id -> exact (no wildcards), normalized to upper case");
    assert.equal(main.params.get("category"), "ilike.rentas");
    resetReqs();
    await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "rentas", leonixAdId: "RENT-2026", limit: 50 });
    assert.equal(forTable("listings")[0].params.get("leonix_ad_id"), "ilike.%RENT-2026%", "fragment -> contains");
  });
  await check("generic: q + Leonix Ad ID + status + owner UUID are AND-ed in ONE query (intersection); a comma in q cannot break or()", async () => {
    responder = () => ({ body: [] });
    resetReqs();
    await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), {
      category: "rentas", q: "casa, 2 recamaras", leonixAdId: "REN", status: "pending", ownerFrag: UUID(7), limit: 50,
    });
    const text = forTable("listings").find((r) => (r.params.get("or") ?? "").includes("title.ilike"))!;
    assert.ok(text, "the text search ran");
    const or = text.params.get("or")!;
    assert.match(or, /title\.ilike\."%casa, 2 recamaras%"/, "value double-quoted, comma preserved inside it");
    assert.match(or, /description\.ilike\."%casa, 2 recamaras%"/);
    assert.equal(text.params.get("leonix_ad_id"), "ilike.%REN%", "Ad ID filter on the SAME query as q (intersection)");
    assert.equal(text.params.get("status"), "ilike.pending");
    assert.equal(text.params.get("owner_id"), `eq.${UUID(7)}`);
  });
  await check("generic: a partial owner fragment is filtered INSIDE the windowed scan (older match is not hidden behind 100 newer non-matches); limit counts matches", async () => {
    responder = (r) => {
      const off = Number(r.params.get("offset") ?? 0);
      if (off === 0) return { body: Array.from({ length: 100 }, (_, i) => listRow(i, { owner_id: "zzzzzzzz-0000-4000-8000-000000000000" })) };
      if (off === 100) return { body: [listRow(500, { owner_id: "aaaa1234-0000-4000-8000-000000000000" })] };
      return { body: [] };
    };
    resetReqs();
    const res = await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "rentas", ownerFrag: "1234", limit: 1 });
    assert.equal(res.error, null);
    assert.equal(res.data!.length, 1);
    assert.equal((res.data![0] as { id: string }).id, UUID(1500));
    assert.equal(res.scanCapped, false);
    assert.ok(!forTable("listings").some((r) => r.params.has("owner_id")), "a fragment is not a SQL owner_id equality");
  });
  await check("generic: a bounded scan that never finds a match reports scanCapped + scanned (the UI then discloses it)", async () => {
    responder = () => ({ body: Array.from({ length: 100 }, (_, i) => listRow(i, { owner_id: "zzzzzzzz-0000-4000-8000-000000000000" })) });
    resetReqs();
    // (a non-Rentas category: the Rentas-only Bienes Raices merge would add its own scan to the total)
    const res = await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "comunidad", ownerFrag: "nomatch", limit: 25 });
    assert.equal(res.error, null);
    assert.equal(res.data!.length, 0);
    assert.equal(res.scanCapped, true);
    assert.equal(res.scanned, sel.LISTINGS_ADMIN_SCAN_CAP);
    assert.equal(sel.LISTINGS_ADMIN_SCAN_CAP, 3000);
  });
  await check("generic: Bienes Raices / Rentas machine filters are a SQL jsonb-containment prefilter on detail_pairs (before the limit)", async () => {
    responder = () => ({ body: [] });
    resetReqs();
    await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "bienes-raices", leonix: { branch: "bienes_raices_negocio", operation: "sale", propiedad: "residencial" }, limit: 50 });
    const cs = forTable("listings")[0].params.getAll("detail_pairs");
    assert.ok(cs.includes('cs.[{"label":"Leonix:branch","value":"bienes_raices_negocio"}]'), cs.join(" | "));
    assert.ok(cs.includes('cs.[{"label":"Leonix:operation","value":"sale"}]'));
    assert.ok(cs.includes('cs.[{"label":"Leonix:categoria_propiedad","value":"residencial"}]'));
  });
  await check("rentas queue: the Bienes Raices rent-operation merge is a SELECTIVE SQL query (jsonb containment), not a walk over every BR row", async () => {
    responder = () => ({ body: [] });
    resetReqs();
    await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "rentas", limit: 50 });
    const br = forTable("listings").find((r) => r.params.get("category") === "ilike.bienes-raices")!;
    assert.ok(br, "BR rent merge query present");
    assert.deepEqual(br.params.getAll("detail_pairs"), ['cs.[{"label":"Leonix:operation","value":"rent"}]']);
  });
  await check("rentas queue: if the containment operator is refused the merge falls back to a SMALLER bounded scan (no crash, no silent 3000-row read)", async () => {
    responder = (r) => {
      if (r.params.get("category") === "ilike.bienes-raices" && r.params.has("detail_pairs")) return ERR;
      return { body: [] };
    };
    resetReqs();
    const res = await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "rentas", limit: 50 });
    assert.equal(res.error, null);
    assert.equal(res.partialSources, undefined);
    const brReqs = forTable("listings").filter((r) => r.params.get("category") === "ilike.bienes-raices");
    assert.ok(brReqs.some((r) => !r.params.has("detail_pairs")), "fallback query without the containment operator ran");
    const src = raw("app/admin/_lib/listingsAdminSelect.ts");
    assert.match(src, /RENTAS_BR_MERGE_FALLBACK_SCAN = 1000/);
    assert.match(src, /cat\.toLowerCase\(\) === "rentas" && !qLower && detailPairsAvailable && !isLive/, "legacy pin: no BR merge in Live");
  });
  await check("bienes-raices lane (Gate 4): Negocio / Privado(FSBO) is a SQL predicate (list + summary), applied to bienes-raices ONLY; a bad URL value never hides rows", async () => {
    responder = () => ({ body: [] });
    resetReqs();
    await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "bienes-raices", brLane: "privado", limit: 50 });
    assert.equal(forTable("listings")[0].params.get("seller_type"), "eq.personal", "Privado = FSBO discriminator");
    resetReqs();
    await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "bienes-raices", brLane: "negocio", limit: 50 });
    assert.ok(forTable("listings")[0].params.getAll("or").includes("(seller_type.is.null,seller_type.neq.personal)"), "Negocio = not a personal seller");
    resetReqs();
    await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "rentas", brLane: "privado", limit: 50 });
    assert.ok(!forTable("listings").some((r) => r.params.has("seller_type")), "the BR lane never leaks into another category");
    assert.equal(shell.parseAdminBrLane({ lane: "privado" }), "privado");
    assert.equal(shell.parseAdminBrLane({ lane: "NEGOCIO" }), "negocio");
    assert.equal(shell.parseAdminBrLane({ lane: "nope" }), "all");
    assert.equal(shell.parseAdminBrLane(undefined), "all");
    // summary: every count is lane-scoped
    const f = fakeClient((_t, calls) => (isHead(calls) ? { count: 3 } : { data: [] }));
    const s = await S.fetchAdminCategorySummaryWithClient(f.client, "bienes-raices", { lane: "privado" });
    assert.equal(s.total, 3);
    const totals = f.seen.filter((x) => isHead(x.calls));
    assert.ok(totals.length >= 3 && totals.every((x) => x.calls.some(([m, a]) => m === "eq" && a[0] === "seller_type" && a[1] === "personal")), "every head count carries the lane predicate");
    assert.match(String(s.sourceHealth.note), /lane=privado/);
    const all = fakeClient((_t, calls) => (isHead(calls) ? { count: 3 } : { data: [] }));
    await S.fetchAdminCategorySummaryWithClient(all.client, "bienes-raices");
    const withSeller = all.seen.filter((x) => x.calls.some(([, a]) => a[0] === "seller_type" && a[1] === "personal")).length;
    assert.equal(withSeller, 1, "no lane => whole category (only the FSBO 'expired' count is inherently seller_type = personal)");
    assert.ok(!all.seen.some((x) => x.calls.some(([m, a]) => m === "or" && String(a[0]).includes("seller_type.is.null"))));
  });
  await check("summary panel: a lane-scoped summary says so (not 'whole category')", () => {
    assert.match(T.adminSummaryScopeText("en", false, "Negocio"), /selected lane \(Negocio\) — not the whole category/);
    assert.match(T.adminSummaryScopeText("en", true, "Negocio"), /NOT the filtered list/);
    assert.match(T.adminSummaryScopeText("es", false, "Negocio"), /carril seleccionado \(Negocio\)/);
  });
  await check("generic: a failed PRIMARY text search is an ERROR (never an empty / partial list)", async () => {
    responder = (r) => (r.params.has("or") ? ERR : { body: [listRow(1)] });
    resetReqs();
    const res = await sel.fetchListingsForAdminWorkspaceFiltered(getAdminSupabase(), { category: "rentas", q: "casa", limit: 50 });
    assert.equal(res.data, null);
    assert.ok(res.error && /boom/.test(res.error.message));
  });

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // 4. SERVICIOS / RESTAURANTES: q + exact filter = INTERSECTION; per-source limit; read errors are errors
  // ════════════════════════════════════════════════════════════════════════════════════════════
  const SV = await import("../app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer");
  const RV = await import("../app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer");

  await check("servicios: q + owner + slug is an INTERSECTION — every query carries the exact filters AND q is applied (it used to be dropped)", async () => {
    responder = () => ({ body: [] });
    resetReqs();
    await SV.listServiciosPublicListingsAdminQueueFromDb({ q: "taqueria", owner_user_id: UUID(9), slug: "taqueria-el-sol", status: "published", limit: 50 });
    const qs = forTable("servicios_public_listings");
    assert.ok(qs.length >= 3, "identity shortcuts + text sources ran");
    for (const r of qs) {
      assert.equal(r.params.get("owner_user_id")?.includes(UUID(9)) || (r.params.get("or") ?? "").includes(UUID(9)), true, "owner filter on every query");
      assert.equal(r.params.get("listing_status"), "eq.published", "status filter on every query");
    }
    assert.ok(qs.some((r) => r.params.get("business_name") === "ilike.%taqueria%"), "q searched business_name");
    assert.ok(qs.some((r) => r.params.get("slug") === "eq.taqueria-el-sol" && r.params.get("business_name")?.startsWith("ilike.")), "exact slug AND q text on the same query");
  });
  await check("servicios: exact filters alone (no q) are one query with every filter + the limit; an invalid uuid is reported without a query", async () => {
    responder = () => ({ body: [] });
    resetReqs();
    await SV.listServiciosPublicListingsAdminQueueFromDb({ owner_user_id: UUID(9), leonix_ad_id: "SERV-2026-000003", limit: 25 });
    const q = forTable("servicios_public_listings")[0];
    assert.equal(q.params.get("owner_user_id"), `eq.${UUID(9)}`);
    assert.equal(q.params.get("leonix_ad_id"), "eq.SERV-2026-000003");
    assert.equal(q.params.get("limit"), "25");
    resetReqs();
    const bad = await SV.listServiciosPublicListingsAdminQueueFromDb({ id: "not-a-uuid" });
    assert.equal(bad.unavailable, true);
    assert.match(String(bad.readError), /UUID/);
    assert.equal(forTable("servicios_public_listings").length, 0);
  });
  await check("servicios: each q search source reads up to the requested limit (was a fixed 80 that hid matches)", async () => {
    responder = () => ({ body: [] });
    resetReqs();
    await SV.listServiciosPublicListingsAdminQueueFromDb({ q: "taqueria", limit: 200 });
    const text = forTable("servicios_public_listings").filter((r) => r.params.get("business_name")?.startsWith("ilike.") || r.params.get("slug")?.startsWith("ilike.") || r.params.get("leonix_ad_id")?.startsWith("ilike."));
    assert.equal(text.length, 3);
    for (const r of text) assert.equal(r.params.get("limit"), "200");
  });
  await check("servicios: a failed read is an ERROR (unavailable + readError), never an empty list; a partial source failure is a WARNING", async () => {
    responder = () => ERR;
    resetReqs();
    const bad = await SV.listServiciosPublicListingsAdminQueueFromDb({ q: "taqueria", limit: 50 });
    assert.equal(bad.unavailable, true);
    assert.ok(bad.readError);
    assert.equal(bad.rows.length, 0);
    const row = { id: UUID(2), slug: "s", business_name: "S", city: "c", published_at: PAST, updated_at: PAST, leonix_verified: false, listing_status: "published", internal_group: null, owner_user_id: UUID(1), moderation_notes: null, profile_json: null };
    responder = (r) => (r.params.get("slug")?.startsWith("ilike.") ? ERR : r.params.get("business_name")?.startsWith("ilike.") ? { body: [row] } : { body: [] });
    resetReqs();
    const part = await SV.listServiciosPublicListingsAdminQueueFromDb({ q: "taqueria", limit: 50 });
    assert.equal(part.unavailable, false);
    assert.equal(part.rows.length, 1);
    assert.match(String(part.readWarning), /1 of 3 sources/);
  });
  await check("restaurantes: q + owner + slug is an INTERSECTION; per-source limit = limit; read failure => ok:false with the error", async () => {
    responder = () => ({ body: [] });
    resetReqs();
    await RV.tryListRestaurantesPublicListingsAdminFromDb({ q: "tacos", owner_user_id: UUID(9), slug: "tacos-el-chuy", status: "published", limit: 200 });
    const qs = forTable("restaurantes_public_listings");
    for (const r of qs) {
      assert.equal(r.params.get("owner_user_id")?.includes(UUID(9)) || (r.params.get("or") ?? "").includes(UUID(9)), true);
      assert.equal(r.params.get("status"), "eq.published");
    }
    const text = qs.filter((r) => r.params.get("business_name")?.startsWith("ilike."));
    assert.equal(text.length, 1, "q searched business_name");
    assert.equal(text[0].params.get("slug"), "eq.tacos-el-chuy", "exact slug AND q on the same query");
    assert.equal(text[0].params.get("limit"), "200");
    responder = () => ERR;
    const bad = await RV.tryListRestaurantesPublicListingsAdminFromDb({ q: "tacos", limit: 50 });
    assert.equal(bad.ok, false);
    assert.match((bad as { error: string }).error, /boom/);
    assert.deepEqual(await RV.listRestaurantesPublicListingsAdminFromDb({ q: "tacos" }), [], "the legacy array form still swallows to []");
    const badId = await RV.tryListRestaurantesPublicListingsAdminFromDb({ id: "nope" });
    assert.equal(badId.ok, false);
  });

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // 5. COMIDA / OFERTAS / VIAJES / EMPLEOS / AUTOS data layers
  // ════════════════════════════════════════════════════════════════════════════════════════════
  await check("comida: a 500-row request is honoured (no silent clamp to 200); q with a comma cannot break or()", async () => {
    const Q = await import("../app/lib/clasificados/comida-local/comidaLocalAdminQueries");
    assert.equal(Q.COMIDA_LOCAL_ADMIN_LIST_MAX, 500);
    responder = () => ({ body: [] });
    resetReqs();
    await Q.listAdminComidaLocalListingsDetailed(getAdminSupabase(), { limit: 500, q: "tacos, el chuy", status: "published", owner_user_id: UUID(4), leonix_ad_id: "COMIDA-2026" });
    const r = forTable("comida_local_public_listings")[0];
    assert.equal(r.params.get("limit"), "500");
    assert.match(r.params.get("or")!, /business_name\.ilike\."%tacos, el chuy%"/);
    assert.equal(r.params.get("status"), "eq.published");
    assert.equal(r.params.get("owner_user_id"), `eq.${UUID(4)}`);
    assert.equal(r.params.get("leonix_ad_id"), "ilike.%COMIDA-2026%");
  });
  await check("ofertas: raw status + Leonix Ad ID are SQL predicates AND-ed with q / scope (before the limit); ceiling raised to 500", async () => {
    const H = await import("../app/lib/ofertas-locales/ofertasLocalesAdminHelpers");
    assert.equal(H.OFERTAS_ADMIN_LIST_MAX, 500);
    responder = () => ({ body: [] });
    resetReqs();
    const res = await H.listOfertasLocalesAdminRowsDetailed(getAdminSupabase(), { scope: "history", limit: 500, q: "pizza, grande", status: "rejected", leonix_ad_id: "OFER-2026-000001", owner_id: UUID(3) });
    assert.equal(res.error, null);
    const r = forTable("ofertas_locales")[0];
    assert.ok(r.params.getAll("status").includes("eq.rejected"), r.params.getAll("status").join(" | "));
    assert.ok(r.params.getAll("status").some((v) => v.startsWith("in.(")), "the scope's status set is still applied");
    assert.equal(r.params.get("leonix_ad_id"), "ilike.OFER-2026-000001");
    assert.equal(r.params.get("owner_id"), `eq.${UUID(3)}`);
    assert.match(r.params.get("or")!, /business_name\.ilike\."%pizza, grande%"/);
    assert.equal(r.params.get("limit"), "500");
  });
  await check("viajes: status / owner UUID / Leonix Ad ID are SQL predicates; a read error is an ERROR; expires_at is deliberately NOT selected", async () => {
    const V = await import("../app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer");
    responder = () => ({ body: [] });
    resetReqs();
    const ok = await V.fetchViajesStagedAdminQueueDetailed({ status: "submitted", owner_user_id: UUID(5), leonix_ad_id: "TRAV-2026-000001", limit: 50 });
    assert.equal(ok.error, null);
    const r = forTable("viajes_staged_listings")[0];
    assert.equal(r.params.get("lifecycle_status"), "eq.submitted");
    assert.equal(r.params.get("owner_user_id"), `eq.${UUID(5)}`);
    assert.equal(r.params.get("leonix_ad_id"), "ilike.TRAV-2026-000001");
    assert.ok(!(r.params.get("select") ?? "").includes("expires_at"));
    responder = () => ERR;
    const bad = await V.fetchViajesStagedAdminQueueDetailed({ limit: 50 });
    assert.ok(bad.error && /boom/.test(bad.error));
    assert.deepEqual(bad.rows, []);
    assert.deepEqual(await V.fetchViajesStagedAdminQueue({ limit: 50 }), [], "the legacy array form still swallows to []");
    const badOwner = await V.fetchViajesStagedAdminQueueDetailed({ owner_user_id: "x" });
    assert.match(String(badOwner.error), /UUID/);
  });
  await check("viajes: expires_at is NOT selected because NO public reader enforces it (an approved+public row past expires_at is still live)", () => {
    const d = raw("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
    const selectConst = d.slice(d.indexOf("const VIAJES_ADMIN_QUEUE_SELECT"), d.indexOf("export type ViajesAdminQueueFilters"));
    assert.ok(!selectConst.includes("expires_at"));
    for (const fn of ["fetchApprovedViajesStagedRows", "fetchViajesStagedRowBySlugPublic"]) {
      const at = d.indexOf(`export async function ${fn}`);
      const body = d.slice(at, d.indexOf("export async function", at + 20));
      assert.ok(!/expires_at/.test(body), `${fn} does not filter on expires_at`);
      assert.match(body, /\.eq\("lifecycle_status", "approved"\)\s*\.eq\("is_public", true\)/);
    }
    // If a public reader ever starts enforcing expires_at this pin must be revisited (select it + show EXPIRED).
    assert.ok(!/expires_at/.test(raw("app/admin/(dashboard)/workspace/clasificados/travel/page.tsx")));
  });
  await check("empleos: status / lane / owner UUID / Leonix Ad ID are SQL predicates (Detailed form); errors are reported; the array form is unchanged", async () => {
    const E = await import("../app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer");
    responder = () => ({ body: [] });
    resetReqs();
    const ok = await E.fetchAllEmpleosListingsForAdminDetailed({ status: "draft", lane: "quick", owner_user_id: UUID(6), leonix_ad_id: "JOB-2026", limit: 50 });
    assert.equal(ok.error, null);
    const r = forTable("empleos_public_listings")[0];
    assert.equal(r.params.get("lifecycle_status"), "eq.draft");
    assert.equal(r.params.get("lane"), "eq.quick");
    assert.equal(r.params.get("owner_user_id"), `eq.${UUID(6)}`);
    assert.equal(r.params.get("leonix_ad_id"), "ilike.%JOB-2026%");
    responder = () => ERR;
    const bad = await E.fetchAllEmpleosListingsForAdminDetailed({ limit: 50 });
    assert.ok(bad.error);
    assert.deepEqual(await E.fetchAllEmpleosListingsForAdmin({ limit: 50 }), []);
  });
  await check("autos: status / owner UUID / Leonix Ad ID / lane are SQL predicates before the cap; a read error is reported through onMeta", async () => {
    const A = await import("../app/lib/clasificados/autos/autosClassifiedsListingService");
    responder = () => ({ body: [] });
    resetReqs();
    let meta: { error: string | null; scanCapped: boolean; scanned: number } | null = null;
    await A.listAllAutosClassifiedsRowsForAdmin(50, { lane: "negocios", status: "active", ownerUserId: UUID(8), leonixAdId: "AUTO-2026-000001", onMeta: (m) => (meta = m) });
    const r = forTable("autos_classifieds_listings")[0];
    assert.equal(r.params.get("lane"), "eq.negocios");
    assert.equal(r.params.get("status"), "eq.active");
    assert.equal(r.params.get("owner_user_id"), `eq.${UUID(8)}`);
    assert.equal(r.params.get("leonix_ad_id"), "ilike.AUTO-2026-000001");
    assert.equal((meta as unknown as { error: string | null }).error, null);
    responder = () => ERR;
    let meta2: { error: string | null } | null = null;
    const rows = await A.listAllAutosClassifiedsRowsForAdmin(50, { onMeta: (m) => (meta2 = m) });
    assert.deepEqual(rows, []);
    assert.ok((meta2 as unknown as { error: string | null }).error, "the caller can render an error instead of 'no rows'");
  });

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // 6. GATE 4 — AUTOS: dealer groups, parent gate, inventory-pack ENTITLEMENT proof (never a fabricated 20)
  // ════════════════════════════════════════════════════════════════════════════════════════════
  const cap = await import("../app/admin/_lib/adminAutosDealerCapacity");
  const grp = await import("../app/admin/_lib/adminAutosDealerGroups");
  const PACK = "autos_dealer_inventory_pack_monthly";
  const activePack = (listing: string, over: Record<string, unknown> = {}) => ({ id: `ent-${listing}`, listing_id: listing, package_key: PACK, status: "active", ends_at: FUTURE, ...over });

  await check("entitlement proof: only an ACTIVE, unexpired, non-revoked inventory-pack row proves the pack (same rule enforcement uses)", () => {
    const proven = cap.foldInventoryPackProof([
      activePack("m-ok"),
      activePack("m-expired", { ends_at: PAST }),
      activePack("m-revoked", { status: "revoked" }),
      activePack("m-scheduled", { status: "scheduled" }),
      activePack("m-otherkey", { package_key: "autos_dealer_monthly" }),
      activePack("m-revokedat", { revoked_at: PAST }),
    ]);
    assert.deepEqual(Object.keys(proven), ["m-ok"]);
    assert.equal(proven["m-ok"], "ent-m-ok");
  });
  await check("entitlement proof: read through the SAME entitlement table + package key enforcement reads; an unreadable source is UNKNOWN, never 'no pack'", async () => {
    responder = () => ({ body: [activePack("m1")] });
    resetReqs();
    const ok = await cap.fetchAutosDealerInventoryPackProof(["m1", "m2"]);
    assert.equal(ok.available, true);
    assert.deepEqual(Object.keys(ok.provenByMainId), ["m1"]);
    const r = forTable("listing_package_entitlements")[0];
    assert.equal(r.params.get("package_key"), `eq.${PACK}`);
    assert.equal(r.params.get("listing_id"), "in.(m1,m2)");
    assert.equal(r.method, "GET", "read-only");
    responder = () => ERR;
    const bad = await cap.fetchAutosDealerInventoryPackProof(["m1"]);
    assert.equal(bad.available, false);
    assert.deepEqual(bad.provenByMainId, {});
    assert.deepEqual((await cap.fetchAutosDealerInventoryPackProof([])).provenByMainId, {}, "no ids -> no read");
  });
  await check("capacity: the entitled limit is claimed ONLY when the group's main holds a proving entitlement — every other state stays at the standard 10", () => {
    const proof = (ids: Record<string, string>, available = true) => ({ available, error: null, provenByMainId: ids });
    const entitled = cap.resolveDealerGroupCapacity({ active: 14, mainId: "m1", proof: proof({ m1: "ent-1" }) });
    assert.deepEqual(entitled, { kind: "entitled", active: 14, limit: 20, entitlementId: "ent-1", over: false });
    const none = cap.resolveDealerGroupCapacity({ active: 4, mainId: "m1", proof: proof({}) });
    assert.deepEqual(none, { kind: "standard", active: 4, limit: 10, pack: "none_on_main", over: false });
    const over = cap.resolveDealerGroupCapacity({ active: 12, mainId: "m1", proof: proof({}) });
    assert.equal(over.kind, "standard");
    assert.equal((over as { over: boolean }).over, true, "12 active with no proven pack is flagged");
    assert.match(cap.describeDealerGroupCapacity("en", over).warning ?? "", /no inventory pack is proven/);
    const unknown = cap.resolveDealerGroupCapacity({ active: 4, mainId: "m1", proof: proof({ m1: "ent-1" }, false) });
    assert.deepEqual(unknown, { kind: "standard", active: 4, limit: 10, pack: "unknown", over: false }, "unreadable entitlement source: never assume the pack");
    const noMain = cap.resolveDealerGroupCapacity({ active: 4, mainId: null, proof: proof({ m1: "ent-1" }) });
    assert.deepEqual(noMain, { kind: "standard", active: 4, limit: 10, pack: "no_main", over: false });
    assert.deepEqual(cap.resolveDealerGroupCapacity({ active: null, mainId: "m1", proof: proof({}) }), { kind: "count_unavailable" });
    // never a fabricated 20
    for (const st of [none, over, unknown, noMain]) assert.equal((st as { limit: number }).limit, 10);
    const enText = cap.describeDealerGroupCapacity("en", entitled);
    assert.match(enText.text, /entitled limit 20/);
    assert.match(enText.text, /proven by an active entitlement/);
    assert.ok(!/entitled limit/.test(cap.describeDealerGroupCapacity("en", none).text));
    assert.match(cap.describeDealerGroupCapacity("es", entitled).text, /límite con derecho 20/);
    const overEntitled = cap.resolveDealerGroupCapacity({ active: 22, mainId: "m1", proof: proof({ m1: "ent-1" }) });
    assert.equal((overEntitled as { over: boolean }).over, true);
  });
  await check("dealer groups: parent (main) first, children grouped after it, Privado independent and never grouped; header on the first row of each group", () => {
    const rows = [
      { id: "c1", lane: "negocios", status: "active", owner_user_id: "o1", inventory_role: "inventory_vehicle", dealer_inventory_group_id: "G1", dealer_inventory_parent_listing_id: "m1" },
      { id: "p1", lane: "privado", status: "active", owner_user_id: "o9", inventory_role: null },
      { id: "m1", lane: "negocios", status: "active", owner_user_id: "o1", inventory_role: "main", dealer_inventory_group_id: "G1", dealer_inventory_parent_listing_id: null },
      { id: "c2", lane: "negocios", status: "active", owner_user_id: "o1", inventory_role: "inventory_vehicle", dealer_inventory_group_id: "G1", dealer_inventory_parent_listing_id: "m1" },
      { id: "orphan", lane: "negocios", status: "active", owner_user_id: "o2", inventory_role: "inventory_vehicle", dealer_inventory_group_id: "G2", dealer_inventory_parent_listing_id: "mX" },
      { id: "p2", lane: "privado", status: "pending_payment", owner_user_id: "o8", inventory_role: null },
    ];
    const g = grp.groupAutosRowsForAdmin(rows);
    assert.deepEqual(g.ordered.map((r) => r.id), ["m1", "c1", "c2", "p1", "orphan", "p2"]);
    assert.deepEqual([...g.groupStartRowIds].sort(), ["m1", "orphan"]);
    assert.equal(g.groupKeyByRowId.has("p1"), false, "Privado is never grouped");
    assert.equal(g.groups.get("G1")!.mainId, "m1");
    assert.equal(g.groups.get("G1")!.mainOnPage, true);
    assert.equal(g.groups.get("G2")!.mainId, "mX", "main not on the page: taken from the child's parent pointer");
    assert.equal(g.groups.get("G2")!.mainOnPage, false);
    assert.deepEqual(grp.dealerGroupMainIds(g.groups).sort(), ["m1", "mX"]);
  });
  await check("dealer parent gate: satisfied only by an ACTIVE same-owner negocios main; a missing / paused / foreign parent hides the child (reason distinguished)", () => {
    const child = { id: "c", lane: "negocios", status: "active", owner_user_id: "o1", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "m1" };
    const parent = { id: "m1", lane: "negocios", inventory_role: "main", owner_user_id: "o1", status: "active" };
    assert.equal(grp.autosChildParentGateState(child, new Map([["m1", parent]])), "satisfied");
    assert.equal(grp.autosChildParentGateState(child, new Map([["m1", { ...parent, status: "suspended" }]])), "parent_not_live");
    assert.equal(grp.autosChildParentGateState(child, new Map([["m1", { ...parent, owner_user_id: "o2" }]])), "parent_not_live");
    assert.equal(grp.autosChildParentGateState(child, new Map()), "parent_not_found");
    assert.equal(grp.autosChildParentGateState({ ...child, inventory_role: "main" }, new Map()), "not_child");
    assert.equal(grp.autosChildParentGateState({ ...child, lane: "privado", inventory_role: null }, new Map()), "not_child");
  });

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // 7. SOURCE GUARDS (React server pages): every list discloses truncation; summary labelled; nothing regressed
  // ════════════════════════════════════════════════════════════════════════════════════════════
  const CLAS = "app/admin/(dashboard)/workspace/clasificados";
  await check("every category list renders the truncation notice and every summary is labelled as whole-category (filtersActive)", () => {
    const pages: Record<string, string> = {
      generic: `${CLAS}/_components/ListingsCategoryOpsQueuePage.tsx`,
      global: `${CLAS}/page.tsx`,
      servicios: `${CLAS}/servicios/page.tsx`,
      restaurantes: `${CLAS}/restaurantes/page.tsx`,
      autos: `${CLAS}/autos/page.tsx`,
      travel: `${CLAS}/travel/page.tsx`,
      ofertas: `${CLAS}/ofertas-locales/page.tsx`,
      comida: `${CLAS}/comida-local/page.tsx`,
      empleosClient: `${CLAS}/empleos/EmpleosAdminListClient.tsx`,
    };
    for (const [k, rel] of Object.entries(pages)) {
      const s = strip(raw(rel));
      assert.match(s, /<AdminListTruncationNotice/, `${k}: truncation notice`);
    }
    for (const k of ["generic", "servicios", "restaurantes", "autos", "travel", "ofertas", "comida"]) {
      assert.match(strip(raw(pages[k])), /filtersActive=\{/, `${k}: summary labelled`);
    }
    assert.match(strip(raw(`${CLAS}/empleos/page.tsx`)), /filtersActive=\{adminAnyFilterActive\(sp\)\}/);
    const panel = raw(`${CLAS}/_components/normalized/AdminCategorySummaryPanel.tsx`);
    assert.match(panel, /data-testid="admin-category-summary-scope"/);
    assert.match(panel, /admin-category-summary-lower-bound/);
  });
  await check("generic + global pages: NO post-fetch owner / Leonix filtering; scanCapped is surfaced; Live panel does not claim 'empty' when capped", () => {
    const g = strip(raw(`${CLAS}/_components/ListingsCategoryOpsQueuePage.tsx`));
    assert.match(g, /leonixAdId: leonixAdIdFilter \|\| undefined/);
    assert.match(g, /ownerFrag: ownerFrag \|\| undefined/);
    assert.match(g, /q: qInput \|\| undefined/, "the Ad ID no longer rides on q");
    assert.ok(!/rows = rows\.filter\(\(r\) => \(r\.owner_id/.test(g), "post-fetch owner filter removed");
    assert.match(g, /scanCapped=\{Boolean\(fetchRes\.scanCapped\)\}/);
    assert.match(g, /data-testid="bienes-lane-selector"/, "Bienes Raices Negocio / Privado lane selector");
    assert.match(g, /\.\.\.\(brLane !== "all" \? \{ brLane \} : \{\}\)/, "the lane reaches the SQL layer");
    assert.match(g, /fetchAdminCategorySummary\(categorySlug, brLane !== "all" \? \{ lane: brLane \} : undefined\)/, "lane-scoped summary");
    const live = raw(`${CLAS}/_components/ClasificadosLiveScopePanel.tsx`);
    assert.match(live, /rowCount === 0 && !scanCapped/);
    const gl = strip(raw(`${CLAS}/page.tsx`));
    assert.ok(!/parseLeonixListingContract/.test(gl), "the Leonix machine filters moved into the data layer");
    assert.match(gl, /ownerFrag: ownerFrag \|\| undefined/);
    assert.match(gl, /leonix:\s*lxBranch \|\| lxOp \|\| lxProp/);
    assert.match(gl, /error\.message/, "the read error message is shown, not an empty table");
  });
  await check("autos page: dealer group header (capacity + entitlement proof + parent gate), Privado term, read error rendered, no fabricated limit", () => {
    const s = raw(`${CLAS}/autos/page.tsx`);
    for (const needle of [
      "groupAutosRowsForAdmin(rows)",
      "fetchAutosDealerInventoryPackProof(mainIds)",
      "resolveDealerGroupCapacity(",
      "describeDealerGroupCapacity(lang, groupCapacityState)",
      'data-testid="autos-dealer-group-header"',
      'data-testid="autos-dealer-group-parent-gate"',
      'data-testid="autos-child-parent-gate"',
      'data-testid="autos-privado-term"',
      'data-testid="autos-admin-read-error"',
      "fetchAutosDealerCapacityForRows(rows)",
      "orderedRows.map((r) =>",
    ]) {
      assert.ok(s.includes(needle), `autos page keeps ${needle}`);
    }
    assert.ok(!/boostedLimit: 20|limit: 20\b|\/20\b/.test(strip(s)), "no hard-coded 20");
    assert.ok(!/BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT/.test(strip(s)), "the entitled limit comes only from the proof-gated resolver");
    assert.match(s, /listAllAutosClassifiedsRowsForAdmin\(queueLimit, \{/);
    assert.ok(s.includes('r.status === "active"\n                    ? `${autosLiveVehiclePath(r.id)}?lang=${r.lang === "en" ? "en" : "es"}`\n                    : null;') || s.includes('r.status === "active"\r\n                    ? `${autosLiveVehiclePath(r.id)}?lang=${r.lang === "en" ? "en" : "es"}`\r\n                    : null;'), "View-public firewall untouched");
  });
  await check("servicios: the 'Advanced registry' quick link is restored under Advanced / technical details; category intelligence untouched", () => {
    const s = raw(`${CLAS}/servicios/page.tsx`);
    assert.match(s, /ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF/);
    assert.match(s, /data-testid="servicios-admin-advanced-registry-link"/);
    const details = s.slice(s.indexOf('data-testid="servicios-admin-supabase-truth"'), s.indexOf('data-testid="servicios-admin-filter-panel"'));
    assert.match(details, /servicios-admin-advanced-registry-link/, "inside the Advanced details block");
    for (const needle of ["ServiciosAdminOpsListingCard", "loadServiciosCommercialOps(", "fetchServiciosAdminCanonicalAnalyticsByRows", "listPendingServiciosReviews(80)", "setServiciosReviewModerationStatusAction"]) {
      assert.ok(s.includes(needle), needle);
    }
    assert.match(s, /\{\(\s*<div data-testid="servicios-admin-filter-panel">/, "the filter bar stays visible when the read failed (a bad filter is fixable)");
  });
  await check("restaurantes / travel / autos / comida / ofertas / empleos pages render an explicit READ ERROR (not an empty list)", () => {
    assert.match(raw(`${CLAS}/restaurantes/page.tsx`), /restaurantes-admin-read-error/);
    assert.match(raw(`${CLAS}/travel/page.tsx`), /travel-admin-read-error/);
    assert.match(raw(`${CLAS}/autos/page.tsx`), /autos-admin-read-error/);
    assert.match(raw(`${CLAS}/comida-local/page.tsx`), /comida-query-error/);
    assert.match(raw(`${CLAS}/ofertas-locales/page.tsx`), /ofertas-query-error/);
    assert.match(raw(`${CLAS}/servicios/page.tsx`), /role="alert"/);
  });
  await check("no capability regressed: Empleos ONE lifecycle action system, Ofertas coupon pricing untouched, Comida payment-aware actions only, Viajes has no payment path", async () => {
    const client = strip(raw(`${CLAS}/empleos/EmpleosAdminListClient.tsx`));
    assert.equal((client.match(/<ClassifiedAdminRowActions/g) ?? []).length, 1, "exactly one lifecycle action system per row");
    assert.match(client, /variant="empleos"/);
    for (const kept of ["Applications:", "application_health", "view_count", "Advertiser panel"]) assert.ok(client.includes(kept), kept);
    const cv = await import("../app/admin/(dashboard)/workspace/clasificados/comida-local/comidaAdminView");
    const actions = cv.comidaRowLifecycleActions({ status: "draft", payment_status: "pending", published_at: null, suspended_reason: null } as never);
    assert.ok(actions.every((a) => a.action !== ("publish" as never)), "no raw publish action");
    assert.ok(actions.every((a) => a.disabled), "an unpaid draft has no enabled lifecycle action (payment-aware only)");
    // This gate never touches pricing: coupon $0 vs $199 stays an owner decision.
    assert.ok(!/commercial_amount_cents|couponPrice|COUPON_PRICE/.test(strip(raw("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts").split("export async function listOfertasLocalesAdminRowsDetailed")[1] ?? "")));
    const trav = strip(raw(`${CLAS}/travel/page.tsx`));
    assert.ok(!/checkout|Stripe|payment_status/i.test(trav.replace(/No payment product/gi, "")), "Viajes page invents no payment path");
  });
  await check("line endings: every file this gate edited is pure CRLF or pure LF (no mixed endings)", () => {
    const files = [
      "app/admin/_lib/adminFilterTruth.ts", "app/admin/_lib/adminCategorySummary.ts", "app/admin/_lib/listingsAdminSelect.ts",
      "app/admin/_lib/adminAutosDealerCapacity.ts", "app/admin/_lib/adminAutosDealerGroups.ts",
      "app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts", "app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer.ts",
      "app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts", "app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts",
      "app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts", "app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts",
      "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
      `${CLAS}/page.tsx`, `${CLAS}/_components/ListingsCategoryOpsQueuePage.tsx`, `${CLAS}/_components/ClasificadosLiveScopePanel.tsx`,
      `${CLAS}/_components/normalized/AdminCategorySummaryPanel.tsx`, `${CLAS}/_components/normalized/AdminListTruncationNotice.tsx`,
      `${CLAS}/_lib/adminNormalizedShell.ts`, `${CLAS}/servicios/page.tsx`, `${CLAS}/restaurantes/page.tsx`, `${CLAS}/autos/page.tsx`,
      `${CLAS}/travel/page.tsx`, `${CLAS}/ofertas-locales/page.tsx`, `${CLAS}/ofertas-locales/ofertasAdminView.ts`,
      `${CLAS}/comida-local/page.tsx`, `${CLAS}/empleos/page.tsx`, `${CLAS}/empleos/EmpleosAdminListClient.tsx`,
    ];
    for (const rel of files) {
      const b = raw(rel);
      const lf = (b.match(/\n/g) ?? []).length;
      const crlf = (b.match(/\r\n/g) ?? []).length;
      assert.ok(crlf === 0 || crlf === lf, `${rel}: mixed line endings (${lf - crlf} bare LF of ${lf})`);
    }
  });

  if (failures.length) {
    console.error(`\nverify-final-admin-filters FAILED (${failures.length})`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("\nverify-final-admin-filters: ALL CHECKS PASSED");
}

void main();
