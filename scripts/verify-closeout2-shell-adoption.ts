/**
 * CLOSEOUT 2 / ROUND 2 — SHELL ADOPTION on Travel (Viajes), Servicios, Restaurantes and the global
 * Clasificados overview page.
 *
 * Executable checks against the real pure glue module (`adminCategoryShellAdoption`) and the rendered
 * Viajes commercial cell, plus narrow source guards where behaviour lives in a server page / data
 * function that cannot be mounted under raw tsx (server-only imports, Supabase).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-closeout2-shell-adoption.ts
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
const lf = (s: string) => s.replace(/\r\n/g, "\n");
const src = (rel: string) => lf(raw(rel));
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const CLAS = "app/admin/(dashboard)/workspace/clasificados";
const P = {
  travel: `${CLAS}/travel/page.tsx`,
  travelCell: `${CLAS}/travel/_components/ViajesCommercialTruthCell.tsx`,
  servicios: `${CLAS}/servicios/page.tsx`,
  serviciosCard: `${CLAS}/servicios/_components/ServiciosAdminOpsListingCard.tsx`,
  restaurantes: `${CLAS}/restaurantes/page.tsx`,
  global: `${CLAS}/page.tsx`,
  glue: "app/admin/_lib/adminCategoryShellAdoption.ts",
  suspended: "app/admin/_lib/adminLaneSuspendedReason.ts",
  serviciosData: "app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts",
  restaurantesData: "app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer.ts",
  viajesData: "app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts",
};

const WRITE_VERBS = /\.(insert|update|upsert|delete)\(/;

type Truth = import("../app/admin/_lib/adminListingCommercialTruth").AdminListingCommercialTruth;
function truthOf(over: Partial<Truth>): Truth {
  return {
    listingId: "00000000-0000-4000-8000-000000000001",
    state: "no_payment_record",
    paymentRecordId: null,
    paymentStatus: null,
    paymentSource: null,
    packageKey: null,
    packageTier: null,
    billingMode: null,
    amountPaidCents: null,
    paidAt: null,
    entitlementId: null,
    entitlementStatus: null,
    entitlementEndsAt: null,
    subscriptionStatus: null,
    circuit: null,
    unreadable: [],
    note: null,
    ...over,
  };
}

async function main() {
  const glue = await import("../app/admin/_lib/adminCategoryShellAdoption");
  const shell = await import("../app/admin/(dashboard)/workspace/clasificados/_lib/adminNormalizedShell");
  const React = await import("react");
  // tsx compiles this repo's TSX with the classic runtime (tsconfig jsx = "preserve"): give it React.
  (globalThis as unknown as { React: unknown }).React = React;
  const server = await import("react-dom/server");
  const h = (t: unknown, p: unknown, ...c: unknown[]) => React.createElement(t as never, p as never, ...(c as never[]));
  const html = (el: unknown) => server.renderToStaticMarkup(el as never);

  // ── 1. filter state ─────────────────────────────────────────────────────────────────────────────
  await check("readAdminQueueFilters: owner alias, status lower-cased, limit normalized, UUID detection", () => {
    const uuid = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const f = glue.readAdminQueueFilters({ owner_user_id: uuid, status: "Suspended", limit: "9999", leonix_ad_id: " REST-2026-000002 ", q: " taco " });
    assert.equal(f.owner, uuid);
    assert.equal(f.ownerIsUuid, true);
    assert.equal(f.status, "suspended");
    assert.equal(f.limit, 500);
    assert.equal(f.leonixAdId, "REST-2026-000002");
    assert.equal(f.q, "taco");
    const g = glue.readAdminQueueFilters({ owner: "abc123", limit: "nope" });
    assert.equal(g.ownerIsUuid, false);
    assert.equal(g.limit, 50, "default limit");
    assert.equal(glue.readAdminQueueFilters({}).owner, "");
  });

  await check("withOwnerAlias: a legacy owner_user_id deep link is SHOWN in the shared bar's owner field", () => {
    const sp = glue.withOwnerAlias({ owner_user_id: "abc", status: "published" });
    assert.equal(sp.owner, "abc");
    assert.equal(sp.status, "published");
    const untouched = glue.withOwnerAlias({ status: "x" });
    assert.equal("owner" in untouched, false);
  });

  // ── 2. filters before limit ─────────────────────────────────────────────────────────────────────
  await check("planAdminQueueScan: no in-memory filter → the plain limit; any → widened to the ceiling, limit applied last", () => {
    assert.deepEqual(glue.planAdminQueueScan({ limit: 50, memoryFiltered: false, cap: 500 }), { fetchLimit: 50, widened: false });
    assert.deepEqual(glue.planAdminQueueScan({ limit: 50, memoryFiltered: true, cap: 500 }), { fetchLimit: 500, widened: true });
    assert.deepEqual(glue.planAdminQueueScan({ limit: 800, memoryFiltered: true, cap: 500 }), { fetchLimit: 800, widened: true }, "never narrower than the request");
  });

  await check("filters-before-limit PROOF: an older match beyond the plain limit is found through the widened window; the limit is applied last", () => {
    // 700 rows newest→oldest; only row #420 (older than any 50-row window) has status "suspended".
    const table = Array.from({ length: 700 }, (_, i) => ({ id: `r${i}`, status: i === 420 ? "suspended" : "published" }));
    const limit = 50;
    // BEFORE (limit first, filter after): the match is hidden.
    const cappedThenFiltered = table.slice(0, limit).filter((r) => r.status === "suspended");
    assert.equal(cappedThenFiltered.length, 0, "old behavior hides the older match");
    // AFTER: widened window, filter, then slice(0, limit).
    const plan = glue.planAdminQueueScan({ limit, memoryFiltered: true, cap: 500 });
    const window = table.slice(0, plan.fetchLimit);
    const shown = window.filter((r) => r.status === "suspended").slice(0, limit);
    assert.deepEqual(shown.map((r) => r.id), ["r420"]);
    // A match beyond the ceiling is NOT silently claimed absent — the page prints the window note.
    const beyond = table.slice(0, plan.fetchLimit).filter((r) => r.id === "r650");
    assert.equal(beyond.length, 0);
    assert.ok(glue.adminScanWindowNote("en", { widened: true, fetched: plan.fetchLimit, fetchLimit: plan.fetchLimit }), "window exhausted → note");
  });

  await check("adminScanWindowNote: only when widened AND the window was exhausted; localized", () => {
    assert.equal(glue.adminScanWindowNote("en", { widened: false, fetched: 500, fetchLimit: 500 }), null);
    assert.equal(glue.adminScanWindowNote("en", { widened: true, fetched: 120, fetchLimit: 500 }), null);
    const en = glue.adminScanWindowNote("en", { widened: true, fetched: 500, fetchLimit: 500 });
    const es = glue.adminScanWindowNote("es", { widened: true, fetched: 500, fetchLimit: 500 });
    assert.match(en ?? "", /newest 500 rows/);
    assert.match(es ?? "", /500 filas/);
  });

  await check("adminUnavailableCategorySummary: every count null ('—'), never a fake 0", () => {
    const s = glue.adminUnavailableCategorySummary("travel", "public.viajes_staged_listings", "boom");
    for (const k of ["total", "live", "needsAttention", "paymentIssue", "expired"] as const) assert.equal(s[k], null);
    assert.equal(s.sourceHealth.ok, false);
    assert.equal(s.queryError, "boom");
  });

  // ── 3. status vocabularies the filter selects offer ─────────────────────────────────────────────
  await check("status <select> vocabularies: travel lifecycle; restaurantes/servicios published/suspended/archived/pending_payment", () => {
    const travel = shell.adminStatusOptionsForCategory("travel").map((o) => o.value);
    for (const v of ["approved", "submitted", "in_review", "rejected", "unpublished", "expired"]) assert.ok(travel.includes(v), `travel ${v}`);
    for (const slug of ["restaurantes", "servicios"]) {
      const vals = shell.adminStatusOptionsForCategory(slug).map((o) => o.value);
      for (const v of ["published", "suspended", "archived", "pending_payment"]) assert.ok(vals.includes(v), `${slug} ${v}`);
    }
  });

  // ── 4. Viajes: NO payment product ───────────────────────────────────────────────────────────────
  await check("adminViajesCommercialView: nothing found → 'no_payment_product'; a record / entitlement / unreadable is NEVER hidden", () => {
    assert.equal(glue.adminViajesCommercialView(undefined), "not_loaded");
    assert.equal(glue.adminViajesCommercialView(truthOf({ state: "no_payment_record" })), "no_payment_product");
    assert.equal(glue.adminViajesCommercialView(truthOf({ state: "no_payment_record", entitlementStatus: "active" })), "record");
    assert.equal(glue.adminViajesCommercialView(truthOf({ state: "no_payment_record", subscriptionStatus: "active" })), "record");
    assert.equal(glue.adminViajesCommercialView(truthOf({ state: "known", paymentStatus: "paid" })), "record");
    assert.equal(glue.adminViajesCommercialView(truthOf({ state: "unknown" })), "unknown");
  });

  await check("ViajesCommercialTruthCell renders 'No payment product' (en + es) and never a payment / unpaid state", async () => {
    const cellMod = await import("../app/admin/(dashboard)/workspace/clasificados/travel/_components/ViajesCommercialTruthCell");
    const en = html(h(cellMod.ViajesCommercialTruthCell, { lang: "en", truth: truthOf({ state: "no_payment_record" }) }));
    assert.match(en, /data-state="no_payment_product"/);
    assert.match(en, /No payment product/);
    assert.ok(!/admin-commercial-payment/.test(en), "no payment line");
    assert.ok(!/admin-commercial-circuit/.test(en), "no circuit");
    assert.ok(!/>\s*Unpaid/i.test(en) && !/pending payment/i.test(en), "no fabricated unpaid / pending-payment label");
    const es = html(h(cellMod.ViajesCommercialTruthCell, { lang: "es", truth: truthOf({ state: "no_payment_record" }) }));
    assert.match(es, /Sin producto de pago/);
    // The loader was never run → the honest "not loaded" line, not "no payment product".
    const notLoaded = html(h(cellMod.ViajesCommercialTruthCell, { lang: "en", truth: undefined }));
    assert.match(notLoaded, /data-state="not_loaded"/);
    // Unreadable sources → the shared "unknown" wording.
    const unknown = html(h(cellMod.ViajesCommercialTruthCell, { lang: "en", truth: truthOf({ state: "unknown", note: "x" }) }));
    assert.match(unknown, /data-state="unknown"/);
    // A record that exists is shown by the shared section, not hidden behind "no payment product".
    const known = html(h(cellMod.ViajesCommercialTruthCell, { lang: "en", truth: truthOf({ state: "known", paymentStatus: "paid", amountPaidCents: 1000 }) }));
    assert.match(known, /data-state="known"/);
    assert.match(known, /admin-commercial-payment/);
    assert.ok(!/No payment product/.test(known));
  });

  // ── 5. Servicios / Restaurantes listing truth ───────────────────────────────────────────────────
  await check("adminLaneListingTruth: published is PUBLIC; suspended with an UNREAD reason never claims staff/payment", () => {
    const pub = glue.adminLaneListingTruth("restaurantes_public_listings", { status: "published" });
    assert.equal(pub.semantic, "PUBLIC");
    const pendingPay = glue.adminLaneListingTruth("servicios_public_listings", { listing_status: "pending_payment" });
    assert.equal(pendingPay.semantic, "NOT_PUBLIC_PAYMENT");
    const unread = glue.adminLaneListingTruth("servicios_public_listings", { listing_status: "suspended" });
    assert.match(unread.reason, /not loaded/i);
    assert.ok(!/by staff/i.test(unread.reason), "must not claim a staff suspension it did not read");
    const paymentSusp = glue.adminLaneListingTruth("restaurantes_public_listings", { status: "suspended", suspended_reason: "payment" });
    assert.equal(paymentSusp.semantic, "PAUSED");
    assert.match(paymentSusp.reason, /payment problem/);
    const staffNoReason = glue.adminLaneListingTruth("restaurantes_public_listings", { status: "suspended", suspended_reason: null });
    assert.match(staffNoReason.reason, /no reason is stored/i, "column READ and empty → canonical wording");
  });

  // ── 6. Global overview: commercial-truth load plan ──────────────────────────────────────────────
  await check("planAdminGlobalCommercialLoad: per category present; publication rows only for the `listings` lifecycle table", () => {
    const groups = glue.planAdminGlobalCommercialLoad([
      { id: "a", category: "rentas" },
      { id: "b", category: "Rentas" },
      { id: "c", category: "Bienes_Raices" },
      { id: "d", category: "viajes" },
      { id: "e", category: "busco" },
      { id: "a", category: "rentas" },
      { id: "f", category: null },
    ]);
    const by = Object.fromEntries(groups.map((g) => [g.category, g]));
    assert.deepEqual(by.rentas.listingIds, ["a", "b"], "de-duplicated, normalized");
    assert.equal(by.rentas.includeRows, true);
    assert.equal(by["bienes-raices"].includeRows, true);
    assert.equal(by.travel.includeRows, false, "a stray travel row in `listings` is never classified against viajes_staged_listings");
    assert.equal(by.busco.includeRows, false, "no safe lookup → never guess a table");
    assert.equal(by.unknown.listingIds[0], "f");
    assert.equal(glue.adminCommercialCategorySlug("Viajes"), "travel");
  });

  // ── 7. source guards: TRAVEL ────────────────────────────────────────────────────────────────────
  await check("Travel: shared header + summary + filter bar (status select, owner, Leonix Ad ID, limit)", () => {
    const s = src(P.travel);
    assert.match(s, /<ClasificadosQueueHeader[\s\S]*categoryName="Viajes"[\s\S]*scope=\{scope === "live" \? "live" : "queue"\}/);
    assert.match(s, /queueHref=\{queueHref\}\s*liveHref=\{liveHref\}/);
    assert.match(s, /<AdminCategorySummaryPanel summary=\{summary\}/);
    assert.match(s, /fetchAdminCategorySummary\("travel"\)/);
    assert.match(s, /<AdminCategoryFilterBar[\s\S]*adminStatusOptionsForCategory\("travel"\)/);
    assert.ok(!/ClasificadosScopeNav/.test(s), "no bespoke scope-nav right slot");
    assert.ok(!/title=\{headerTitle\}/.test(s), "no bespoke title");
  });

  await check("Travel: q is passed INTO fetchViajesStagedAdminQueue (runs before the cap); limit applied last", () => {
    const s = strip(src(P.travel));
    assert.match(s, /fetchViajesStagedAdminQueue\(\{[\s\S]*limit: scan\.fetchLimit[\s\S]*q: sqlSearch/);
    assert.ok(!/const n = qRaw\.toLowerCase\(\)/.test(s), "the post-limit in-memory q search is gone");
    assert.ok(!/rows\.filter\(\(r\) => \{\s*const n/.test(s));
    const idxFilter = s.indexOf("adminRowMatchesLeonixAdIdFilter(r, filters.leonixAdId)");
    const idxSlice = s.indexOf(".slice(0, queueLimit)");
    assert.ok(idxFilter > 0 && idxSlice > idxFilter, "every filter runs before the final slice(0, limit)");
    const data = src(P.viajesData);
    assert.match(data, /viajesStagedRowMatchesAdminSearch/);
    assert.match(data, /accept: search \? \(rows\) => rows\.filter\(\(r\) => viajesStagedRowMatchesAdminSearch\(r, search\)\)/);
  });

  await check("Travel: listing truth + commercial truth per row; lifecycle state machine and actions untouched", () => {
    const s = src(P.travel);
    assert.match(s, /classifyPublication\("viajes_staged_listings"/);
    assert.match(s, /<ViajesCommercialTruthCell lang=\{lang\} truth=\{commercialTruthByListingId\[r\.id\]\}/);
    assert.match(s, /loadAdminListingCommercialTruth\(\{\s*category: "travel"/);
    assert.match(s, /const publicLive = lifecycle === "approved" && isPublic;/, "Live = approved AND is_public");
    assert.match(s, /variant="viajes"/);
    assert.match(s, /canArchive=\{lifecycle !== "unpublished" && lifecycle !== "rejected"\}/);
    assert.match(s, /republishCategory="viajes"/);
    assert.match(s, /source="viajes_staged_listings"/);
    assert.ok(!WRITE_VERBS.test(strip(s)) && !WRITE_VERBS.test(strip(src(P.travelCell))), "read-only page + cell");
  });

  // ── 8. source guards: SERVICIOS ─────────────────────────────────────────────────────────────────
  await check("Servicios: bespoke header replaced by the shared header (scope-aware); summary + filter bar adopted", () => {
    const s = src(P.servicios);
    assert.ok(!/<header\b/.test(s), "no bespoke <header>");
    assert.match(s, /<ClasificadosQueueHeader[\s\S]*categoryName="Servicios"[\s\S]*scope=\{scope === "live" \? "live" : "queue"\}/);
    assert.match(s, /data-testid="servicios-admin-command-header"/);
    assert.match(s, /<AdminCategorySummaryPanel summary=\{summary\}/);
    assert.match(s, /fetchAdminCategorySummary\("servicios"\)/);
    assert.match(s, /<AdminCategoryFilterBar[\s\S]*adminStatusOptionsForCategory\("servicios"\)/);
    assert.match(s, /extraFieldNames=\{SERVICIOS_EXTRA_FILTER_FIELDS\}/);
    assert.match(s, /name="slug"/);
    assert.match(s, /name="id"/);
    assert.ok(!/ServiciosAdminFilterPanel/.test(s), "old bespoke filter panel not rendered");
  });

  await check("Servicios: filters BEFORE the limit — status/leonix_ad_id/owner UUID in SQL; only a partial owner widens", () => {
    const page = strip(src(P.servicios));
    assert.match(page, /status: filters\.status \|\| undefined/);
    assert.match(page, /leonix_ad_id: filters\.leonixAdId \|\| undefined/);
    assert.match(page, /owner_user_id: filters\.owner && filters\.ownerIsUuid \? filters\.owner : undefined/);
    assert.match(page, /planAdminQueueScan\(\{ limit: queueLimit, memoryFiltered: ownerNeedsMemory, cap: SERVICIOS_ADMIN_SCAN_CAP \}\)/);
    assert.match(page, /\.filter\(\(r\) => adminRowMatchesOwnerFilter\([\s\S]*\)\.slice\(0, queueLimit\)/);
    const data = strip(src(P.serviciosData));
    assert.match(data, /if \(statusFilter\) q = q\.eq\("listing_status", statusFilter\);/, "status is applied inside the shared query builder (before .limit)");
    assert.match(data, /ilike\("leonix_ad_id"/);
    assert.match(data, /if \(statusFilter\) return \{ rows: \[\], fullSchema: false, unavailable: false \}/, "reduced schema never returns unfiltered rows for a status filter");
    // .limit(limit) stays the LAST op of every row query
    assert.ok(!/\.limit\(limit\)\.eq\(/.test(data));
  });

  await check("Servicios: category intelligence PRESERVED (card body, commercial ops, analytics, reviews, leads, entitlement)", () => {
    const s = src(P.servicios);
    for (const needle of [
      "ServiciosAdminOpsListingCard",
      "loadServiciosCommercialOps(rows.map((r) => r.id))",
      "fetchServiciosAdminCanonicalAnalyticsByRows",
      "listPendingServiciosReviews(80)",
      "fetchServiciosLeadsForAdmin()",
      "setServiciosReviewModerationStatusAction",
      "commercial={commercialOps.get(r.id)}",
      "canonicalViews=",
      "servicios-advanced-table",
      "servicios-admin-listing-cards",
      "servicios-admin-empty-state",
      'title="Servicios admin ops"',
    ]) {
      assert.ok(s.includes(needle), `servicios page keeps ${needle}`);
    }
    const c = src(P.serviciosCard);
    for (const needle of [
      "Commercial truth (read-only)",
      "ServiciosOpsTruthRow",
      "Stripe payment",
      "Entitlement",
      "Subscription",
      "ServiciosAdminMonetizationPanel",
      'variant="servicios"',
      "updateServiciosPublicListingStatusAction",
      "setServiciosListingLeonixVerifiedAction",
      "Canonical analytics",
      "isPubliclyVisible",
    ]) {
      assert.ok(c.includes(needle), `servicios card keeps ${needle}`);
    }
    assert.match(c, /listingTruth\?: PublicationTruth \| null/);
    assert.match(c, /<AdminListingTruthSection lang=\{lang\} status=\{row\.listing_status\} truth=\{listingTruth\} compact \/>/);
  });

  // ── 9. source guards: RESTAURANTES ──────────────────────────────────────────────────────────────
  await check("Restaurantes: shared summary + filter bar (status select, owner, Leonix Ad ID, limit)", () => {
    const s = src(P.restaurantes);
    assert.match(s, /<ClasificadosQueueHeader[\s\S]*categoryName="Restaurantes"[\s\S]*scope=\{scope === "live" \? "live" : "queue"\}/);
    assert.match(s, /<AdminCategorySummaryPanel summary=\{summary\}/);
    assert.match(s, /fetchAdminCategorySummary\("restaurantes"\)/);
    assert.match(s, /<AdminCategoryFilterBar[\s\S]*adminStatusOptionsForCategory\("restaurantes"\)/);
    assert.match(s, /extraFieldNames=\{RESTAURANTES_EXTRA_FILTER_FIELDS\}/);
    assert.ok(!/ClasificadosScopeNav/.test(s));
  });

  await check("Restaurantes: filters BEFORE the limit (status/Leonix Ad ID/owner UUID in SQL) and limit applied last", () => {
    const page = strip(src(P.restaurantes));
    assert.match(page, /status: filters\.status \|\| undefined/);
    assert.match(page, /leonix_ad_id: filters\.leonixAdId \|\| undefined/);
    assert.match(page, /const rows = rowsOwnerNarrowed\.slice\(0, queueLimit\);/);
    const data = strip(src(P.restaurantesData));
    assert.match(data, /if \(statusFilter\) q = q\.eq\("status", statusFilter\);/);
    assert.match(data, /ilike\("leonix_ad_id"/);
  });

  await check("Restaurantes: COMMERCIAL truth (payment/entitlement/subscription loader) + LISTING truth per row; six-action system kept", () => {
    const s = src(P.restaurantes);
    assert.match(s, /loadAdminListingCommercialTruth\(\{\s*category: "restaurantes"/);
    assert.match(s, /<AdminCommercialTruthSection lang=\{lang\} truth=\{commercialTruthByListingId\[r\.id\]\} compact \/>/);
    assert.match(s, /<AdminListingTruthSection lang=\{lang\} status=\{r\.status\} truth=\{listingTruthByRowId\.get\(r\.id\)\} compact \/>/);
    assert.match(s, /adminLaneListingTruth\("restaurantes_public_listings"/);
    assert.match(s, /variant="restaurante"/);
    assert.match(s, /canArchive=\{r\.status !== "archived"\}/);
    assert.match(s, /republishCategory="restaurantes"/);
    assert.match(s, /source="restaurantes_public_listings"/);
    assert.match(s, /title="Restaurantes admin ops"/);
  });

  // ── 10. source guards: GLOBAL overview ──────────────────────────────────────────────────────────
  await check("Global Clasificados overview: commercial truth loaded per category present and passed to the shared table", () => {
    const s = src(P.global);
    assert.match(s, /planAdminGlobalCommercialLoad\(rows\)/);
    assert.match(s, /loadAdminListingCommercialTruth\(\{\s*category: group\.category/);
    assert.match(s, /commercialTruthByListingId=\{commercialTruthByListingId\}/);
    assert.match(s, /\.\.\.\(group\.includeRows/);
  });

  // ── 11. guardrails ──────────────────────────────────────────────────────────────────────────────
  await check("read-only + no fabricated payment truth: no write verbs in any new module; suspended-reason read is a bounded select", () => {
    for (const rel of [P.glue, P.suspended, P.travelCell]) {
      assert.ok(!WRITE_VERBS.test(strip(src(rel))), `${rel} has no write verb`);
    }
    const sus = src(P.suspended);
    assert.match(sus, /\.select\("id, suspended_reason"\)/);
    assert.match(sus, /IDS_PER_QUERY = 100/);
    const glueCode = strip(src(P.glue));
    assert.ok(!/payment_status\s*:\s*["'](unpaid|pending|failed)/.test(glueCode), "glue never synthesizes a payment status");
  });

  await check("d3ed73ab republish/lifecycle wiring intact on all three category pages + the data functions stay additive", () => {
    assert.match(src(P.travel), /republishRow=\{\{\s*lifecycle_status: r\.lifecycle_status,\s*is_public: r\.is_public,/);
    assert.match(src(P.restaurantes), /republishRow=\{\{\s*status: r\.status,\s*republish_override: r\.republish_override,/);
    assert.match(src(P.serviciosCard), /republishCategory="servicios"/);
    // additive: the exact-field paths and legacy fallbacks of the data functions are still there
    assert.match(src(P.serviciosData), /Reduced-schema mode|reduced-schema mode|leg\.error/);
    assert.match(src(P.serviciosData), /rowQuery\.eq\("slug", slug\)/);
    assert.match(src(P.restaurantesData), /rowQuery\.eq\("slug", slug\)/);
  });

  await check("line endings preserved: every edited CRLF file is still pure CRLF (no mixed / lone LF)", () => {
    for (const rel of [P.travel, P.servicios, P.serviciosCard, P.restaurantes, P.global, P.serviciosData, P.restaurantesData]) {
      const b = raw(rel);
      const lfCount = (b.match(/\n/g) ?? []).length;
      const crlfCount = (b.match(/\r\n/g) ?? []).length;
      assert.equal(lfCount, crlfCount, `${rel}: ${lfCount - crlfCount} bare LF`);
      assert.ok(!/\r\r/.test(b), `${rel}: doubled CR`);
    }
  });

  if (failures.length) {
    console.error(`\nverify-closeout2-shell-adoption FAILED (${failures.length})`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("\nverify-closeout2-shell-adoption PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
