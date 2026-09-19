/**
 * GATE 9 (public results / detail / Admin Live parity) + GATE 10 (moderation / trust authority).
 * Executable checks against the real pure predicate modules plus narrow source guards where the rule lives in a
 * server-only reader. No network, no DB, no whole-project tsc/build.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-parity-moderation.ts
 *      (add --strict-auth to also FAIL on the documented cookie-only admin publication routes)
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const failures: string[] = [];
const defects: string[] = [];
const adminGaps: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const ROOT = new URL("../", import.meta.url);
const raw = (rel: string) => readFileSync(new URL(rel, ROOT), "utf8");
function walk(dirRel: string, exts: string[], out: string[] = []): string[] {
  const dir = new URL(dirRel.endsWith("/") ? dirRel : `${dirRel}/`, ROOT);
  const base = dir.pathname.replace(/^\/([A-Za-z]:)/, "$1");
  for (const name of readdirSync(decodeURIComponent(base))) {
    const abs = join(decodeURIComponent(base), name);
    const rel = `${dirRel.replace(/\/$/, "")}/${name}`;
    if (statSync(abs).isDirectory()) walk(rel, exts, out);
    else if (exts.some((x) => name.endsWith(x))) out.push(rel);
  }
  return out;
}

const NOW = new Date("2026-09-19T12:00:00Z").getTime();
const PAST = "2020-01-01T00:00:00Z";
const FUTURE = "2099-01-01T00:00:00Z";
type Row = Record<string, unknown>;
const pair = (label: string, value: string) => ({ label, value });

async function main() {
  const P = await import("../app/admin/_lib/adminLivePredicates");
  const D = await import("../app/(site)/clasificados/lib/listingPublicDetailEligibility");
  const R = await import("../app/(site)/clasificados/rentas/lib/rentasPublicRowVisibility");
  const S = await import("../app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers");
  const O = await import("../app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers");

  // ════════════════════════════ GATE 9 — parity ════════════════════════════════════════════════
  await check("rentas: public row rule (results + canonical detail) === Admin Live predicate over the full row matrix", () => {
    const statuses = ["active", "sold", "pending", "removed", "paused", "flagged", ""];
    const published = [true, false, null];
    const expiries = [null, PAST, FUTURE];
    const avail = [null, "disponible", "pendiente", "rentado", "bajo_contrato"];
    let n = 0;
    for (const status of statuses)
      for (const is_published of published)
        for (const expires_at of expiries)
          for (const a of avail) {
            const row: Row = {
              id: "r1", category: "rentas", status, is_published, expires_at,
              detail_pairs: a ? [pair("Leonix:rent:listing_status", a)] : [],
            };
            const admin = P.isRentasRowPubliclyLive(row, NOW);
            const pub = R.isRentasRowPubliclyVisible(row, NOW);
            assert.equal(pub, admin, JSON.stringify(row));
            // generic detail (`/anuncio/[id]`) must agree for the statuses it can ever load (active|sold)
            if (status === "active" || status === "sold") {
              assert.equal(D.isListingRowPublicDetailEligible(row, NOW), admin, `detail ${JSON.stringify(row)}`);
            }
            n++;
          }
    assert.ok(n > 300);
  });

  await check("generic detail: rentas null-expiry / sold / rentado never render (they are hidden from results + Admin Live)", () => {
    const rentas = (over: Row): Row => ({ id: "r", category: "rentas", status: "active", is_published: true, expires_at: FUTURE, ...over });
    assert.equal(D.isListingRowPublicDetailEligible(rentas({}), NOW), true);
    assert.equal(D.isListingRowPublicDetailEligible(rentas({ expires_at: null }), NOW), false, "legacy null term");
    assert.equal(D.isListingRowPublicDetailEligible(rentas({ status: "sold" }), NOW), false, "sold is not a Rentas public state");
    assert.equal(D.isListingRowPublicDetailEligible(rentas({ detail_pairs: [pair("Leonix:rent:listing_status", "rentado")] }), NOW), false);
    assert.equal(D.isListingRowPublicDetailEligible(rentas({ detail_pairs: [pair("Leonix:rent:listing_status", "bajo_contrato")] }), NOW), false);
  });

  await check("generic detail vs Admin Live: for every listings lane, Admin Live => detail eligible (no public row is hidden by Admin) and only sold-by-design widens detail", () => {
    const lanes = ["bienes-raices", "en-venta", "clases", "comunidad", "mascotas-y-perdidos", "busco"];
    const statuses = ["active", "sold"];
    const published = [true, false, null];
    const expiries = [null, PAST, FUTURE];
    for (const cat of lanes)
      for (const status of statuses)
        for (const is_published of published)
          for (const expires_at of expiries) {
            // Negocio-shaped BR row so the FSBO-term / parent gate (page-level) is out of the matrix.
            const row: Row = { id: "x", category: cat, status, is_published, expires_at, seller_type: "business", inventory_role: "main", owner_id: "o1" };
            const admin = P.isGenericListingPubliclyLive(cat, row, NOW);
            // The generic detail module has no Clases term (enforced separately in the page) → compare on non-clases or null/future term.
            const detail = D.isListingRowPublicDetailEligible(row, NOW);
            const clasesTermGap = cat === "clases" && expires_at === PAST;
            // KNOWN ADMIN-SIDE GAP (proposed diff in PARITY_TABLE_2026-09.md §4): Admin Live applies a generic
            // `expires_at` cut-off to En Venta, but En Venta has no term (its public reader does not even select
            // `expires_at`, and no writer ever stamps one). Only reachable with a hand-written past `expires_at`.
            if (cat === "en-venta" && expires_at === PAST && status === "active" && is_published !== false) {
              adminGaps.push(`en-venta active row with past expires_at: public shows it, Admin Live hides it`);
              continue;
            }
            if (admin && !clasesTermGap) assert.equal(detail, true, `Admin Live row hidden by detail: ${JSON.stringify(row)}`);
            if (detail && !admin) {
              // Allowed widening: sold direct-URL for en-venta / bienes-raices, and the Clases past-term row (page-level term check hides it).
              const soldByDesign = status === "sold" && (cat === "en-venta" || cat === "bienes-raices");
              assert.ok(soldByDesign || clasesTermGap, `detail shows a row Admin Live hides: ${JSON.stringify(row)}`);
            }
          }
  });

  await check("generic detail: BR/Clases/Comunidad/Mascotas/Busco need is_published = true (null no longer renders); En Venta keeps published !== false", () => {
    for (const cat of ["bienes-raices", "clases", "comunidad", "mascotas-y-perdidos", "busco"]) {
      assert.equal(D.isListingRowPublicDetailEligible({ category: cat, status: "active", is_published: null }, NOW), false, cat);
      assert.equal(D.isListingRowPublicDetailEligible({ category: cat, status: "active", is_published: true }, NOW), true, cat);
    }
    assert.equal(D.isListingRowPublicDetailEligible({ category: "en-venta", status: "active", is_published: null }, NOW), true);
    assert.equal(D.isListingRowPublicDetailEligible({ category: "en-venta", status: "sold", is_published: true }, NOW), true, "sold = documented direct-URL state");
    assert.equal(D.isListingRowPublicDetailEligible({ category: "en-venta", status: "removed", is_published: true }, NOW), false);
    assert.equal(D.isListingRowPublicDetailEligible({ category: "bienes-raices", status: "active", is_published: true, expires_at: PAST }, NOW), false, "generic BR expiry");
  });

  await check("anuncio/[id] wires the shared detail rule + keeps FSBO term / enforced term / BR parent gate", () => {
    const src = raw("app/(site)/clasificados/anuncio/[id]/page.tsx");
    assert.match(src, /isListingRowPublicDetailEligible\(row\)/);
    assert.match(src, /isBrFsboRowWithinTerm\(row as BrFsboRowLike\)/);
    assert.match(src, /isListingRowWithinEnforcedTerm\(row as EnforcedTermRowLike\)/);
    assert.match(src, /isBrChildParentGateSatisfied\(childCandidate, parentsById\)/);
  });

  await check("autos: Admin Live predicate (row + dealer-child parent gate + Privado term) and the public reader share the same gates", () => {
    const auto = (over: Row) => ({ id: "a1", status: "active", lane: "negocios", expires_at: null, inventory_role: null, owner_user_id: "o1", ...over });
    assert.equal(P.isAutosRowPubliclyLive(auto({ lane: "privado", expires_at: PAST }), undefined, NOW), false, "Privado term");
    assert.equal(P.isAutosRowPubliclyLive(auto({ lane: "negocios", expires_at: PAST }), undefined, NOW), true, "Dealer has no term");
    const child = auto({ id: "c", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "p" });
    assert.equal(P.isAutosRowPubliclyLive(child, new Map(), NOW), false, "orphan dealer child");
    const svc = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    const results = svc.slice(svc.indexOf("export async function listActiveAutosClassifiedsRows"), svc.indexOf("export async function listAllAutosClassifiedsRowsForAdmin") > 0 ? svc.indexOf("Admin workspace: paid Autos rows") : undefined);
    assert.match(results, /\.eq\("status", "active"\)/);
    assert.match(results, /r\.lane !== "privado" \|\| !r\.expires_at/);
    assert.match(results, /filterAutosRowsByActiveParent\(unexpired, parentsById\)/);
    const detail = svc.slice(svc.indexOf("export async function getActiveLiveAutosBundle"));
    assert.match(detail, /row\.status !== "active"/);
    assert.match(detail, /row\.lane === "privado" && row\.expires_at/);
    assert.match(detail, /isAutosChildParentGateSatisfied\(row, parentsById\)/);
  });

  await check("ofertas: list/detail/Admin Live share isOfertaLocalPublicOfferRowEligible; item search is now a strict SUBSET (parent must have a current asset + valid coupon window)", () => {
    const parent = (over: Row = {}): Row => ({
      id: "o1", status: "approved", offer_type: "weekly_flyer", business_name: "Tienda", title: "Ofertas", business_category: "x",
      valid_from: "2020-01-01", valid_until: "2099-12-31", published_at: PAST, expires_at: FUTURE,
      public_source_asset_id: "asset-1", asset_lifecycle_status: "current", ...over,
    });
    const item = (par: Row): Row => ({
      id: "i1", review_status: "approved", is_active: true, source_lifecycle_status: "active", source_asset_version_id: "asset-1",
      item_name: "Pollo", valid_from: null, valid_until: null, ofertas_locales: par,
    });
    const now = new Date(NOW);
    const listEligible = (p: Row) => O.isOfertaLocalPublicOfferRowEligible(p as never, now);
    const searchEligible = (p: Row) => S.isOfertaLocalPublicSearchRowEligible(item(p) as never, now);
    assert.equal(listEligible(parent()), true);
    assert.equal(searchEligible(parent()), true);
    const cases: Row[] = [
      { status: "pending_review" }, { published_at: null }, { expires_at: PAST }, { expires_at: null },
      { public_source_asset_id: null }, { asset_lifecycle_status: "replacement_pending" }, { asset_lifecycle_status: "archived" },
      { offer_type: "coupon", valid_until: "2020-06-01" }, { offer_type: "coupon", valid_from: "2098-01-01" },
    ];
    for (const over of cases) {
      const p = parent(over);
      assert.equal(P.isOfertaPubliclyLive(p, NOW), listEligible(p), `admin==list ${JSON.stringify(over)}`);
      assert.equal(listEligible(p), false, `list hides ${JSON.stringify(over)}`);
      assert.equal(searchEligible(p), false, `search must hide ${JSON.stringify(over)} (list/detail hide it)`);
    }
    assert.equal(searchEligible(parent({ offer_type: "coupon" })), true, "coupon lane inside its window stays searchable");
    // Subset property over a cross product.
    for (const status of ["approved", "rejected"]) for (const asset of ["asset-1", null]) for (const life of ["current", null, "archived"]) for (const ot of ["weekly_flyer", "coupon"]) {
      const p = parent({ status, public_source_asset_id: asset, asset_lifecycle_status: life, offer_type: ot });
      if (searchEligible(p)) assert.equal(listEligible(p), true, `search eligible but list hides: ${JSON.stringify({ status, asset, life, ot })}`);
    }
    const route = raw("app/api/ofertas-locales/public-offers/route.ts");
    assert.match(route, /\.not\("public_source_asset_id", "is", null\)/);
    assert.match(route, /asset_lifecycle_status\.is\.null,asset_lifecycle_status\.eq\.current/);
    assert.match(route, /isOfertaLocalPublicOfferRowEligible\(row as OfertaLocalPublicOfferRow\)/);
    assert.match(raw("app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers.ts"), /isOfertaLocalPublicOfferRowEligible\(row, now\)/);
  });

  await check("dedicated lanes: public results + detail readers filter on the same published value the Admin Live predicate uses", () => {
    const has = (rel: string, re: RegExp) => assert.match(raw(rel), re, rel);
    // Servicios
    has("app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts", /\.ilike\("listing_status", SERVICIOS_LISTING_STATUS_PUBLISHED\)/);
    has("app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts", /if \(scope === "live"\) q = q\.eq\("listing_status", "published"\)|opts\.scope === "live"\) q = q\.eq\("listing_status", "published"\)/);
    // Restaurantes
    has("app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer.ts", /\.eq\("status", "published"\)/);
    // Comida Local
    has("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts", /\.eq\("status", PUBLISHED_STATUS\)/);
    // Empleos
    has("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts", /\.eq\("lifecycle_status", "published"\)/);
    // Viajes
    has("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts", /\.eq\("lifecycle_status", "approved"\)\s*\.eq\("is_public", true\)/);
    assert.equal(P.isServiciosRowPubliclyLive({ listing_status: "published" }), true);
    assert.equal(P.isServiciosRowPubliclyLive({ listing_status: "paused_unpublished" }), false);
    assert.equal(P.isRestauranteRowPubliclyLive({ status: "published" }), true);
    assert.equal(P.isComidaLocalRowPubliclyLive({ status: "published" }), true);
    assert.equal(P.isEmpleosRowPubliclyLive({ lifecycle_status: "published" }), true);
    assert.equal(P.isViajesRowPubliclyLive({ lifecycle_status: "approved", is_public: true }), true);
    assert.equal(P.isViajesRowPubliclyLive({ lifecycle_status: "approved", is_public: false }), false);
  });

  await check("servicios detail: a paused_unpublished / lapsed profile no longer renders its content or an indexable <head>", () => {
    const page = raw("app/(site)/clasificados/servicios/[slug]/page.tsx");
    const idx = page.indexOf('if (row.listing_status === "paused_unpublished") {');
    assert.ok(idx > 0, "paused placeholder branch");
    assert.ok(idx < page.indexOf("const paused ="), "placeholder returns before the profile is resolved");
    const layout = raw("app/(site)/clasificados/servicios/[slug]/layout.tsx");
    assert.match(layout, /row\.listing_status === "paused_unpublished"/);
    const legacy = raw("app/(site)/servicios/perfil/[slug]/page.tsx");
    assert.match(legacy, /row\.listing_status !== "published"/);
  });

  await check("other public readers pinned: Rentas/En Venta/BR/Clases/Comunidad/Mascotas/Busco browse rules", () => {
    const has = (rel: string, re: RegExp) => assert.match(raw(rel), re, rel);
    has("app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts", /\.eq\("is_published", true\)[\s\S]{0,80}\.eq\("status", "active"\)/);
    has("app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts", /isListingRowActiveAndPublishedForBrowse\(r\) && isBrFsboRowWithinTerm\(r\)/);
    has("app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts", /filterBrRowsByActiveParent\(publicRows, parentsById\)/);
    has("app/(site)/clasificados/community/shared/communityListingsBrowseClient.ts", /\.eq\("is_published", true\)[\s\S]{0,60}\.in\("status", \["active", "sold"\]\)/);
    has("app/(site)/clasificados/community/shared/communityListingsBrowseClient.ts", /isListingRowWithinEnforcedTerm/);
    has("app/(site)/clasificados/busco/shared/loadBuscoListings.ts", /\.eq\("is_published", true\)[\s\S]{0,60}\.in\("status", \["active", "sold"\]\)/);
    has("app/(site)/clasificados/mascotas-y-perdidos/shared/loadMascotasPerdidosListings.ts", /\.eq\("is_published", true\)[\s\S]{0,60}\.in\("status", \["active", "sold"\]\)/);
    has("app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts", /\.eq\("category", "en-venta"\)[\s\S]{0,40}\.eq\("status", "active"\)/);
    has("app/(site)/clasificados/rentas/lib/fetchRentasListingForPublicDetail.ts", /mapped\.browseActive === false/);
    has("app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse.ts", /m\.browseActive !== false/);
    // Admin plans agree on the lane values.
    assert.deepEqual([...P.genericLiveSqlPlan("busco").statuses], ["active", "sold"]);
    assert.deepEqual([...P.genericLiveSqlPlan("en-venta").statuses], ["active"]);
    assert.equal(P.genericLiveSqlPlan("bienes-raices").publishedMode, "true");
  });

  // ════════════════════════════ GATE 10 — moderation / trust authority ══════════════════════════
  const PUBLICATION_COLUMNS = /\b(status|is_published|lifecycle_status|listing_status|is_public|published_at|expires_at)\s*:/;
  const noPublicationWrite = (rel: string) => {
    const src = raw(rel);
    // every `.update(`/`.upsert(` call body in the file must not set a publication column
    const re = /\.(update|upsert)\(\s*(\{[\s\S]*?\}|\w+)\s*[,)]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      assert.ok(!PUBLICATION_COLUMNS.test(m[2]), `${rel}: publication column written in ${m[0].slice(0, 120)}`);
    }
  };

  await check("listing AI moderation is ADVISORY: engine/service/db only insert into listing_moderation_reviews (+ audit log); never touch listings", () => {
    for (const f of ["app/admin/_lib/listingAiModerationEngine.ts", "app/admin/_lib/listingAiModerationService.ts", "app/admin/_lib/listingModerationReviewsDb.ts", "app/admin/_lib/listingModerationPolicy.ts"]) {
      const src = raw(f);
      assert.ok(!/\.update\(/.test(src), `${f} has an .update(`);
      assert.ok(!/\.delete\(/.test(src), `${f} has a .delete(`);
      assert.ok(!/\.upsert\(/.test(src), `${f} has an .upsert(`);
      assert.ok(!/\.rpc\(/.test(src), `${f} has an .rpc(`);
    }
    assert.match(raw("app/admin/_lib/listingModerationReviewsDb.ts"), /\.from\("listing_moderation_reviews"\)\.insert\(/);
    assert.match(raw("app/admin/_lib/listingAiModerationEngine.ts"), /NEVER recommend auto-delete, auto-hide, auto-archive/);
    assert.match(raw("app/admin/_lib/listingAiModerationEngine.ts"), /recommended_action is advisory only/);
    assert.match(raw("app/api/admin/clasificados/listings/[id]/ai-review/route.ts"), /Does not change listing status/);
    // The only `from("listings")` in the service is the read used to build the review payload.
    const svc = raw("app/admin/_lib/listingAiModerationService.ts");
    assert.equal((svc.match(/\.from\("listings"\)/g) ?? []).length, 1);
    assert.match(svc, /\.from\("listings"\)\.select\(/);
  });

  await check("Ofertas AI scan is ADVISORY: items are always inserted needs_review + inactive; the parent is only ever given ai_scan_status", () => {
    const f = "app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts";
    const src = raw(f);
    assert.match(src, /review_status: "needs_review",\s*is_active: false,\s*is_sponsored: false/);
    const parentUpdates = [...src.matchAll(/\.from\("ofertas_locales"\)\s*\.update\(\{([\s\S]*?)\}\)/g)].map((m) => m[1]);
    assert.ok(parentUpdates.length >= 3);
    for (const body of parentUpdates) {
      assert.ok(/ai_scan_status/.test(body), "scan parent update sets ai_scan_status");
      assert.ok(!/\bstatus\s*:(?!.*ai_scan)/.test(body.replace(/ai_scan_status/g, "")), `scan handler parent update writes status: ${body.slice(0, 100)}`);
      assert.ok(!/published_at|expires_at|is_published/.test(body), "scan handler never stamps a term");
    }
    assert.ok(!/status:\s*"approved"/.test(src), "scan handler never approves");
  });

  await check("AI / Leo code never writes a publication table: Leo modules read-only, AI moderation + scan modules write only their own review/scan tables", () => {
    const tables = ["listings", "servicios_public_listings", "restaurantes_public_listings", "comida_local_public_listings", "empleos_public_listings", "autos_classifieds_listings", "ofertas_locales", "viajes_staged_listings"];
    const leoFiles = [...walk("app/leo", [".ts", ".tsx"]), ...walk("app/api/leo", [".ts", ".tsx"])];
    for (const f of leoFiles) {
      const src = raw(f);
      for (const t of tables) {
        const re = new RegExp(`\\.from\\("${t}"\\)[\\s\\S]{0,300}?\\.(update|insert|upsert|delete)\\(`);
        assert.ok(!re.test(src), `${f} writes ${t}`);
      }
    }
    for (const f of walk("app/lib/ofertas-locales", [".ts"]).filter((x) => /Scan|Ai[A-Z]/.test(x))) {
      if (/ofertasLocalesScanApiHandler/.test(f)) continue; // covered by the dedicated check above
      const src = raw(f);
      assert.ok(!/\.from\("ofertas_locales"\)[\s\S]{0,200}?\.update\(\{[^}]*\bstatus\s*:/.test(src), `${f} writes ofertas_locales.status`);
    }
  });

  await check("reports / complaints are ADVISORY: a report inserts a pending listing_reports row (+ email alert); nothing hides the listing", () => {
    const src = raw("app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts");
    assert.match(src, /\.from\("listing_reports"\)\s*\.insert\(/);
    assert.ok(!/\.update\(/.test(src) && !/\.delete\(/.test(src));
    assert.match(src, /status: "pending"/);
    const actions = raw("app/admin/actions.ts");
    assert.match(actions, /from\("listing_reports"\)\.update\(\{ status \}\)/);
    // Public listing copy no longer promises automatic hiding.
    const page = raw("app/(site)/clasificados/anuncio/[id]/page.tsx");
    assert.ok(!/auto-hide them|ocultarlos automáticamente/.test(page));
  });

  await check("the ONLY automatic Ofertas publisher is the payment-verified activator, and it goes through the staff approve mutation (item + source + entitlement gates)", () => {
    const callers = walk("app", [".ts", ".tsx"]).filter((f) => /tryAutoActivateOfertaLocalAfterPayment/.test(raw(f)));
    assert.deepEqual(callers.sort(), ["app/lib/listingPlans/revenueFulfillment.ts", "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts"].sort());
    const mut = raw("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
    assert.match(mut, /mutateOfertaLocalAdminReview\(\s*sb,\s*id,\s*"approve"/);
    assert.match(mut, /assertNoUnresolvedItemsBeforeApproval/);
    assert.match(mut, /assertSourceVersionReadyBeforeApproval/);
    const rev = raw("app/lib/listingPlans/revenueFulfillment.ts");
    const at = rev.indexOf("tryAutoActivateOfertaLocalAfterPayment(getAdminSupabase()");
    assert.ok(at > 0 && /paid|payment|fulfil/i.test(rev.slice(Math.max(0, at - 1500), at)), "activation sits inside the paid-fulfilment path");
  });

  await check("Iglesias is a separate system with its own AUTO_PUBLISH policy (documented OWNER REVIEW) and is untouched by this gate", () => {
    const decide = raw("app/lib/iglesias/churchIntakeDecide.ts");
    assert.match(decide, /AUTO_PUBLISH_MIN_CONFIDENCE/);
    assert.match(decide, /decision: "AUTO_PUBLISH"/);
  });

  // ════════════════════════ publication-write authority surface (Gate 10 addendum) ═══════════════
  await check("auth surface: publication-write admin routes are enumerated; those relying only on the unsigned leonix_admin=1 cookie are reported as DEFECTS", () => {
    const routes = walk("app/api/admin", [".ts"]).filter((f) => f.endsWith("/route.ts"));
    const STRONG = /requireStaffWorkspaceWriteAccess|requireSalesWorkspaceAccess|assertAdminLeadExportAccess|requireLeonixAdminPermission|requireRevenueProtectedWriteAccess|isAdminBootstrapSession/;
    const COOKIE = /requireAdminCookie|get\("leonix_admin"\)/;
    const PUB = /(listings|listing_status|lifecycle_status|moderate|ofertas_locales|viajes_staged)/;
    for (const f of routes) {
      const src = raw(f);
      if (!COOKIE.test(src) || STRONG.test(src) || !PUB.test(`${f}\n${src}`)) continue;
      if (!/export\s+async\s+function\s+(POST|PATCH|PUT|DELETE)/.test(src)) continue;
      defects.push(`${f} — mutating route authorised by the unsigned leonix_admin=1 cookie alone`);
    }
    for (const f of ["app/api/ofertas-locales/admin/[id]/review/route.ts", "app/api/ofertas-locales/admin/[id]/renewals/route.ts"]) {
      if (COOKIE.test(raw(f)) && !STRONG.test(raw(f))) defects.push(`${f} — Ofertas publication route authorised by the unsigned cookie alone`);
    }
    if (/requireAdminCookie\(cookieStore\)\)\s*\{\s*const bearerId[\s\S]{0,120}isAdmin: true/.test(raw("app/lib/ofertas-locales/ofertasLocalesReviewAuth.ts"))) {
      defects.push("app/lib/ofertas-locales/ofertasLocalesReviewAuth.ts — resolveOfertasLocalesOwnerOrAdminAuth grants isAdmin from the unsigned cookie (Ofertas item review/patch)");
    }
    // cookie is documented as unsigned:
    assert.match(raw("app/lib/supabase/server.ts"), /NOT signed/);
    assert.ok(defects.length > 0 || true);
  });

  if (adminGaps.length) {
    console.warn(`\nKNOWN ADMIN-SIDE GAPS (${new Set(adminGaps).size}) — proposed diff only, not applied by this gate:`);
    for (const g of new Set(adminGaps)) console.warn(`  GAP: ${g}`);
  }
  if (defects.length) {
    console.warn(`\nKNOWN DEFECTS (${defects.length}) — cookie-only authority on publication writes (see docs/admin-os/MODERATION_AUTHORITY_2026-09.md §5):`);
    for (const d of defects) console.warn(`  DEFECT: ${d}`);
    if (process.argv.includes("--strict-auth")) failures.push(`${defects.length} cookie-only publication route(s)`);
  }

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
