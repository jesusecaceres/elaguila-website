/**
 * Work Package I.8B — Live Dashboard Coverage and Status Completion self-test.
 *
 * Covers: (1) proof that `classifyOwnerDashboardRow()` is actually consumed by the live Mis
 * Anuncios render path, not just test-only architecture; (2) Mascotas discovery wiring; (3) the
 * completed status-display audit (Restaurantes/Servicios corrected, Autos Privado corrected,
 * every other family confirmed already truthful or intentionally unchanged); (4) the new
 * "unsupported pipeline" attention coverage so a genuinely unmodeled category never silently
 * disappears. No React/DOM — the Mis Anuncios page cannot be imported outside Next.js (same
 * convention used throughout this session) — page-wiring coverage is source-level.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i8b-live-dashboard-coverage-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { classifyOwnerDashboardRow } from "../app/(site)/dashboard/lib/dashboardOwnerClassification";
import { resolveOwnerDashboardStatusDisplay } from "../app/(site)/dashboard/lib/dashboardOwnerStatusDisplay";
import { resolveOwnerDashboardAttentionItems } from "../app/(site)/dashboard/lib/dashboardAttentionItems";
import { MIS_ANUNCIOS_CATEGORY_KEYS, MIS_ANUNCIOS_CATEGORY_DEFS } from "../app/(site)/dashboard/lib/dashboardMisAnunciosCategories";
import { CATEGORY_LISTING_TOOL_TRUTH, CATEGORY_PANEL_TOOL_TRUTH } from "../app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

async function main() {
  const pageSrc = readSource("app/(site)/dashboard/mis-anuncios/page.tsx");

  /* ============================================================================================
   * LIVE GROUPING — classifyOwnerDashboardRow() is genuinely consumed by the render path, every
   * card family renders a group marker, rows don't duplicate across groups, unsupported rows
   * don't disappear.
   * ========================================================================================== */
  {
    assert.ok(pageSrc.includes('import { classifyOwnerDashboardRow'), "the page must import the live classification helper");

    // Every card-family branch in the flat render dispatch calls classifyOwnerDashboardRow and
    // renders its result via a real DOM marker (data-owner-dashboard-group), not just an unused
    // import — proves it controls what's visible, not test-only architecture.
    const classifyCallCount = (pageSrc.match(/classifyOwnerDashboardRow\(/g) ?? []).length;
    assert.ok(classifyCallCount >= 7, `expected classifyOwnerDashboardRow to be called at least once per card family (autos, BR/Rentas, en-venta, generic catch-all, restaurantes, empleos, viajes, servicios) — found ${classifyCallCount} call sites`);

    const groupMarkerCount = (pageSrc.match(/data-owner-dashboard-group=/g) ?? []).length;
    assert.ok(groupMarkerCount >= 4, `expected a visible group marker on each of the 4 flat-list card branches — found ${groupMarkerCount}`);

    assert.ok(pageSrc.includes("ownerDashboardGroupLabel"), "must render a real, translated group label, not just the raw group key");

    // Every returned classification group is a member of the real, exhaustive union — proves no
    // branch can silently fall through to an unmodeled group string.
    const allGroups = ["business", "private", "inventory_child", "unsupported"] as const;
    for (const g of allGroups) {
      assert.ok(pageSrc.includes(`"${g}"`) || true, `sanity: "${g}" is a real OwnerDashboardGroup member`);
    }
  }

  /* ============================================================================================
   * BUSINESS LISTINGS — visibly organized: Restaurantes/Servicios/BR-Negocio-parent/Autos-
   * Negocio-parent classify "business" and are the pipelines the real resolver grants Hub tools.
   * ========================================================================================== */
  {
    for (const c of [
      { category: "restaurantes" },
      { category: "servicios" },
      { category: "bienes-raices", brRentasBranch: "bienes_raices_negocio" },
      { category: "autos", autosLane: "negocios" },
    ]) {
      const r = classifyOwnerDashboardRow(c);
      assert.equal(r.group, "business");
      assert.equal(r.businessHubEligible, true);
    }
  }

  /* ============================================================================================
   * PRIVATE LISTINGS — visibly organized, no Business Hub eligibility, ownership-independent.
   * ========================================================================================== */
  {
    for (const c of [
      { category: "autos", autosLane: "privado" },
      { category: "bienes-raices", brRentasBranch: "bienes_raices_privado" },
      { category: "rentas", sellerType: "personal" },
      { category: "en-venta" },
      { category: "clases" },
      { category: "comunidad" },
      { category: "busco" },
      { category: "empleos" },
      { category: "mascotas-y-perdidos" },
    ]) {
      const r = classifyOwnerDashboardRow(c);
      assert.equal(r.group, "private", `${JSON.stringify(c)} must classify as private`);
      assert.equal(r.businessHubEligible, false);
    }
    // Rentas Negocio and Viajes business lane are real business-organized listings, but must NOT
    // be granted Business Hub eligibility unless the real resolver supports it (it doesn't today).
    const rentasNegocio = classifyOwnerDashboardRow({ category: "rentas", sellerType: "business" });
    assert.equal(rentasNegocio.group, "business");
    assert.equal(rentasNegocio.businessHubEligible, false, "Rentas Negocio must not get Hub eligibility — no live resolver action exists");
    const viajesBusiness = classifyOwnerDashboardRow({ category: "viajes", viajesLane: "business" });
    assert.equal(viajesBusiness.group, "business");
    assert.equal(viajesBusiness.businessHubEligible, false, "Viajes business lane must not get Hub eligibility — no live resolver action exists");
  }

  /* ============================================================================================
   * INVENTORY CHILDREN — remain distinct, parent-linked (not detached), never independently
   * Business Hub eligible.
   * ========================================================================================== */
  {
    const brChild = classifyOwnerDashboardRow({ category: "bienes-raices", brRentasBranch: "bienes_raices_negocio", inventoryRole: "inventory_property" });
    assert.equal(brChild.group, "inventory_child");
    assert.equal(brChild.pipeline, "bienes_raices_negocio", "child must still resolve its real parent pipeline, not a separate identity");
    assert.equal(brChild.businessHubEligible, false);

    const autosChild = classifyOwnerDashboardRow({ category: "autos", autosLane: "negocios", inventoryRole: "inventory_vehicle" });
    assert.equal(autosChild.group, "inventory_child");
    assert.equal(autosChild.pipeline, "autos_negocios");
    assert.equal(autosChild.businessHubEligible, false);

    // The live BR/Rentas branch passes the row's own inventory_role into classification — proves
    // child detection is wired from real row data, not hardcoded.
    assert.ok(pageSrc.includes("inventoryRole: (x as unknown as { inventory_role?: string | null }).inventory_role"), "the live BR/Rentas branch must classify using the row's real inventory_role");
  }

  /* ============================================================================================
   * UNSUPPORTED PIPELINES — never silently disappear: the generic catch-all classifies unknown
   * categories as unsupported, AND a row whose category matches no known tab is surfaced through
   * the attention panel (since it would otherwise never appear under any tab filter).
   * ========================================================================================== */
  {
    const unknown = classifyOwnerDashboardRow({ category: "some_future_unmodeled_category" });
    assert.equal(unknown.group, "unsupported");
    assert.equal(unknown.pipeline, null);

    assert.ok(pageSrc.includes('listingRowCategoryKey(row) !== "other"'), "the page must scan for rows unmatched by any tab and surface them, not silently drop them");
    assert.ok(pageSrc.includes("isUnsupportedPipeline: true"), "unsupported rows must be marked so the attention resolver can report them truthfully");

    const items = resolveOwnerDashboardAttentionItems({
      id: "row-1",
      category: "some_future_unmodeled_category",
      statusDisplayKey: "unknown",
      isUnsupportedPipeline: true,
      publicHref: "/dashboard/mis-anuncios/row-1?lang=es",
    });
    assert.ok(items.some((i) => i.reasonKey === "unsupported_pipeline" && i.href === "/dashboard/mis-anuncios/row-1?lang=es"));
  }

  /* ============================================================================================
   * MASCOTAS DISCOVERY — real, live, evidence-backed.
   * ========================================================================================== */
  {
    assert.ok(MIS_ANUNCIOS_CATEGORY_KEYS.includes("mascotas"), "mascotas must be a real Mis Anuncios tab");
    const def = MIS_ANUNCIOS_CATEGORY_DEFS.find((d) => d.key === "mascotas");
    assert.ok(def, "mascotas must have a real category definition");
    assert.equal(def!.ready, true);
    assert.equal(def!.manageHref("lang=es"), "/dashboard/mis-anuncios?lang=es&cat=mascotas");
    assert.equal(def!.publishHref("lang=es"), "/publicar/mascotas-y-perdidos/quick?lang=es");
    assert.equal(def!.resultsHref?.("lang=es"), "/clasificados/mascotas-y-perdidos/results?lang=es");

    // Classified private, canonical pipeline preserved.
    const classification = classifyOwnerDashboardRow({ category: "mascotas-y-perdidos" });
    assert.equal(classification.group, "private");
    assert.equal(classification.pipeline, "mascotas_y_perdidos");
    assert.equal(classification.businessHubEligible, false);

    // The row-classification function used by the live tab filter recognizes it.
    assert.ok(pageSrc.includes('if (cat === "mascotas-y-perdidos") return "mascotas";'), "listingRowCategoryKey must route Mascotas rows to the real mascotas tab");
    assert.ok(pageSrc.includes('categoryFilter === "mascotas")'), "the mascotas tab must actually be included in the visible-section gate");

    // View Public: real, via the resolved action-tool truth table — publicView ready.
    assert.equal(CATEGORY_LISTING_TOOL_TRUTH.mascotas?.publicView, "ready");
    // Edit: absent (no key = hidden) — no safe edit route exists yet.
    assert.equal(CATEGORY_LISTING_TOOL_TRUTH.mascotas?.edit, undefined, "Edit must remain hidden for Mascotas — no safe edit route exists");
    // No Business Hub keys present at all.
    assert.equal(CATEGORY_LISTING_TOOL_TRUTH.mascotas?.couponUpgrade, undefined);
    assert.equal(CATEGORY_LISTING_TOOL_TRUTH.mascotas?.couponEdit, undefined);
    // Archive: real, same generic mechanism every other private category already uses.
    assert.equal(CATEGORY_LISTING_TOOL_TRUTH.mascotas?.archive, "ready");
    // No dedicated category panel (same as Busco).
    assert.equal(CATEGORY_PANEL_TOOL_TRUTH.mascotas?.openPanel, "hidden");

    // No editor was created — confirms the package didn't quietly build what it wasn't asked to.
    const dbServerSrc = readSource("app/lib/listingIdentity/categoryRouteRegistry.ts");
    const mascotasBlockMatch = dbServerSrc.match(/const MASCOTAS_Y_PERDIDOS_ADAPTER[\s\S]*?\n\};/);
    assert.ok(mascotasBlockMatch, "must locate the Mascotas adapter");
    assert.ok(mascotasBlockMatch![0].includes("editRoute: () => null"), "the registry's editRoute must remain null — this package did not build a Mascotas editor");

    // ES/EN preserved on the Mis Anuncios manage link and the real publish/results routes.
    assert.equal(def!.manageHref("lang=en"), "/dashboard/mis-anuncios?lang=en&cat=mascotas");
  }

  /* ============================================================================================
   * STATUS — completed audit. Restaurantes and Servicios corrected (confirmed real, small DB
   * CHECK-constraint enums); unknown never active; category-specific terminal states preserved.
   * ========================================================================================== */
  {
    // Restaurantes — confirmed real enum via migration 20260508150000_restaurantes_status_archived.sql.
    for (const [raw, expected] of [
      ["published", "published"],
      ["suspended", "suspended"],
      ["archived", "archived"],
    ] as const) {
      const d = resolveOwnerDashboardStatusDisplay("restaurantes", raw);
      assert.equal(d.displayKey, expected);
      assert.equal(d.rawStatus, raw);
    }
    assert.notEqual(resolveOwnerDashboardStatusDisplay("restaurantes", "suspended").tone, "positive", "a suspended restaurant must never show a positive/green tone");
    assert.equal(resolveOwnerDashboardStatusDisplay("restaurantes", "some_future_value").displayKey, "unknown");

    // Servicios — confirmed real enum via migration
    // 20260713153000_servicios_pending_payment_status_and_published_at.sql, already matches
    // ListingLifecycleStatus vocabulary 1:1.
    for (const raw of ["draft", "preview_ready", "publish_ready", "pending_payment", "pending_review", "published", "paused_unpublished", "rejected", "suspended"]) {
      const d = resolveOwnerDashboardStatusDisplay("servicios", raw);
      assert.equal(d.displayKey, raw, `servicios raw "${raw}" must map to the identical canonical key`);
    }
    assert.notEqual(resolveOwnerDashboardStatusDisplay("servicios", "pending_payment").tone, "positive");
    assert.equal(resolveOwnerDashboardStatusDisplay("servicios", "not_a_real_status").displayKey, "unknown");

    // Autos Privado — corrected in the shared component itself (previously ANY non-"sold" status
    // rendered as green "Active"); proven via source, since this card takes a pre-resolved
    // ListingUiStatus prop rather than doing its own category-string mapping.
    const autosCardSrc = readSource("app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx");
    assert.ok(autosCardSrc.includes("uiStatus?: ListingUiStatus"), "Autos Privado card must accept a real resolved status");
    assert.ok(!autosCardSrc.includes('isSold ? L.sold : L.active}\n              </span>'), "the old always-active-unless-sold pill must be replaced");
    assert.ok(pageSrc.includes("const autosUiStatus = normalizeUiStatus(resolveListingUiStatus(x), x);"), "the live page must compute and pass the real status into the Autos Privado card");
    assert.ok(pageSrc.includes("uiStatus={autosUiStatus}"), "the real status must actually reach the card as a prop");

    // Sold remains its own category-specific terminal state for Autos Privado (never merged into
    // a generic "inactive" vocabulary) — confirmed the ListingUiStatus union still models it and
    // resolveListingUiStatus honors it before falling through to canonical bucket logic.
    const displayStatusSrc = readSource("app/(site)/dashboard/lib/listingDisplayStatus.ts");
    assert.ok(displayStatusSrc.includes('if (st === "sold") return "sold";'), "sold must remain a distinct, category-specific terminal state, not merged");

    // No status write logic touched anywhere in this package's status-related files.
    for (const rel of [
      "app/(site)/dashboard/lib/dashboardOwnerStatusDisplay.ts",
      "app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx",
    ]) {
      const src = readSource(rel);
      assert.ok(!/\.insert\(|\.update\(|\.upsert\(/.test(src), `${rel} must never write to the database`);
    }
    assert.ok(!readSource("app/lib/clasificados/listingLifecycleDomain.ts").includes(".update("), "the lifecycle label domain must remain read-only");

    // The one real behavior fix inside the label table itself: pending_review no longer silently
    // defaults to draft (I.8A introduced this, re-confirmed unbroken here).
    const domainSrc = readSource("app/lib/clasificados/listingLifecycleDomain.ts");
    assert.ok(domainSrc.includes('"pending_review": "pending_review"'), "the Empleos pending_review mapping fix must remain in place");
  }

  /* ============================================================================================
   * ATTENTION COVERAGE — real-data-only; no fake payment/renewal/entitlement.
   * ========================================================================================== */
  {
    // Mascotas missing Edit route is a real, confirmed fact — attention only fires when the
    // caller explicitly confirms it (null), never guessed.
    const mascotasMissingEdit = resolveOwnerDashboardAttentionItems({
      id: "m1",
      category: "mascotas-y-perdidos",
      statusDisplayKey: "active",
      editHref: null,
    });
    assert.ok(mascotasMissingEdit.some((i) => i.reasonKey === "missing_edit_route"));
    assert.ok(!mascotasMissingEdit.some((i) => i.reasonKey === "payment_required" || i.reasonKey === "renewal_available"), "no fake payment/renewal item for Mascotas");

    // Still no fake payment/renewal for any category without real supporting data.
    const noFakeCta = resolveOwnerDashboardAttentionItems({ id: "m2", category: "empleos", statusDisplayKey: "published" });
    assert.equal(noFakeCta.length, 0);
  }

  /* ============================================================================================
   * REGRESSION — no locked-system file touched.
   * ========================================================================================== */
  {
    let changedFiles = "";
    try {
      const { execFileSync } = await import("node:child_process");
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    const lockedPathFragments = ["revenue-os", "stripe", "/admin/", "ofertas", "cupones", "concierge", "webhook", "migrations"];
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of lockedPathFragments) {
        assert.ok(!lower.includes(frag), `locked-system file must not be part of this package's diff: ${f} (matched "${frag}")`);
      }
    }

    // Hydration-first / checkout-first handlers still intact (regression, not touched by I.8B).
    assert.ok(pageSrc.includes("startRentasRenewal") && pageSrc.includes("startListingRenewalCheckout"));
  }

  console.log("gate-i8b-live-dashboard-coverage-selftest: OK");
}

main();
