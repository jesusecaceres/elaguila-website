/**
 * CATEGORY CIRCUIT CLOSEOUT (2026-09) — regression suite for the non-interactive repairs made after the
 * Admin/Revenue OS repair merge. Executable checks against the real pure modules, plus narrow source
 * guards where the behaviour lives in a route / client component that cannot be imported under raw tsx.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-category-circuit-closeout.ts
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

async function main() {
  const term = await import("../app/lib/listingLifecycle/enforcedTermReadPredicate");
  const react = await import("../app/admin/_lib/adminReactivationPolicy");
  const adid = await import("../app/(site)/clasificados/community/shared/communityLeonixAdId");
  const NOW = new Date("2026-09-19T00:00:00Z").getTime();

  // ── paid-term enforcement on read ───────────────────────────────────────────────────────────
  await check("term: expired paid Rentas/Clases rows are hidden; live/future/null are not", () => {
    const past = "2026-09-01T00:00:00Z";
    const future = "2026-10-01T00:00:00Z";
    assert.equal(term.isListingRowWithinEnforcedTerm({ category: "rentas", expires_at: past }, NOW), false);
    assert.equal(term.isListingRowWithinEnforcedTerm({ category: "Clases", expires_at: past }, NOW), false);
    assert.equal(term.isListingRowWithinEnforcedTerm({ category: "rentas", expires_at: future }, NOW), true);
    assert.equal(term.isListingRowWithinEnforcedTerm({ category: "rentas", expires_at: null }, NOW), true, "legacy rows without expiry stay visible");
    assert.equal(term.isListingRowWithinEnforcedTerm({ category: "clases", expires_at: "not-a-date" }, NOW), true, "unparsable never hides");
  });
  await check("term: free / other categories are never affected by an expires_at", () => {
    for (const c of ["en-venta", "busco", "comunidad", "mascotas-y-perdidos", "bienes-raices", "autos", null, undefined]) {
      assert.equal(term.isListingRowWithinEnforcedTerm({ category: c as string, expires_at: "2020-01-01T00:00:00Z" }, NOW), true, String(c));
    }
  });
  await check("term: predicate is wired into the generic detail route and the Clases/Comunidad browse query", () => {
    assert.match(raw("app/(site)/clasificados/anuncio/[id]/page.tsx"), /isListingRowWithinEnforcedTerm\(row as EnforcedTermRowLike\)/);
    const b = raw("app/(site)/clasificados/community/shared/communityListingsBrowseClient.ts");
    assert.match(b, /isListingRowWithinEnforcedTerm/);
    assert.match(b, /owner_id,expires_at"/);
  });

  // ── admin reactivation cannot publish an unpaid paid-lane row ───────────────────────────────
  await check("admin: Restore/Republish is refused for a never-paid (pending) Rentas/BR/Clases row only", () => {
    for (const c of ["rentas", "bienes-raices", "clases"]) {
      const d = react.decideAdminReactivation({ category: c, status: "pending" });
      assert.equal(d.blocked, true, c);
    }
    for (const st of ["flagged", "paused", "removed", "sold", "active"]) {
      assert.equal(react.decideAdminReactivation({ category: "rentas", status: st }).blocked, false, st);
    }
    for (const c of ["en-venta", "busco", "comunidad", "mascotas-y-perdidos"]) {
      assert.equal(react.decideAdminReactivation({ category: c, status: "pending" }).blocked, false, c);
    }
    const route = raw("app/api/admin/clasificados/listings/[id]/route.ts");
    assert.match(route, /decideAdminReactivation\(\{ category, status: String\(rowRec\.status/);
    assert.ok((route.match(/decideAdminReactivation\(/g) ?? []).length >= 2, "wired into unsuspend AND republish");
  });

  // ── Leonix Ad ID: stored id wins ────────────────────────────────────────────────────────────
  await check("ad id: stored leonix_ad_id wins; derived LNX- only as a fallback", () => {
    const uuid = "abcdef12-3456-7890-abcd-ef1234567890";
    assert.equal(adid.formatLeonixAdId(uuid, "CLASS-2026-000010"), "CLASS-2026-000010");
    assert.equal(adid.formatLeonixAdId(uuid, "  BUSCO-2026-000001 "), "BUSCO-2026-000001");
    assert.equal(adid.formatLeonixAdId(uuid, null), "LNX-ABCDEF12");
    assert.equal(adid.formatLeonixAdId(uuid, ""), "LNX-ABCDEF12");
    assert.equal(adid.formatLeonixAdId(null, null), null);
  });
  await check("ad id: public detail, dashboard and Admin table prefer the stored id", () => {
    assert.match(raw("app/(site)/clasificados/busco/BuscoPublishedDetailPage.tsx"), /formatLeonixAdId\(listing\.id, listing\.leonix_ad_id\)/);
    assert.match(raw("app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx"), /formatLeonixAdId\(listing\.id, listing\.leonix_ad_id\)/);
    assert.match(raw("app/(site)/publicar/busco/shared/buscoQuickAdViewModel.ts"), /formatLeonixAdId\(listing\.id, listing\.leonix_ad_id\)/);
    assert.match(raw("app/(site)/dashboard/mis-anuncios/page.tsx"), /formatLeonixAdId\(x\.id, x\.leonix_ad_id\)/);
    const table = raw("app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx");
    assert.ok(table.indexOf("const stored = row.leonix_ad_id?.trim();") < table.indexOf('cat === "clases" || cat === "comunidad" || cat === "busco") return formatLeonixAdId'));
    const anuncio = raw("app/(site)/clasificados/anuncio/[id]/page.tsx");
    assert.ok((anuncio.match(/leonix_ad_id: listing\.leonix_ad_id \?\? null,/g) ?? []).length >= 3, "Busco, Mascotas, Clases/Comunidad props");
  });

  // ── checkout pre-flights (double-charge / takedown / unfulfillable) ─────────────────────────
  await check("checkout: rentas/FSBO/Clases base payment requires an owned, unpublished `pending` row of the right category", () => {
    const r = raw("app/api/revenue-os/checkout/route.ts");
    assert.match(r, /rentas_30d: "rentas"/);
    assert.match(r, /br_fsbo_45d: "bienes-raices"/);
    assert.match(r, /clases_paid_30d: "clases"/);
    assert.match(r, /String\(lr\.status \?\? ""\)\.toLowerCase\(\) !== "pending" \|\| lr\.is_published === true/);
    assert.match(r, /operationEarly !== "renew_listing"/, "renewals keep their own validators");
    assert.ok(r.indexOf("LISTINGS_PAID_BASE_CATEGORY") < r.indexOf("createPendingPaymentRecord({"), "before payment record / Stripe");
  });
  await check("checkout: Empleos paid post only from an owned draft; Viajes business refused (no fulfilment)", () => {
    const r = raw("app/api/revenue-os/checkout/route.ts");
    assert.match(r, /empleos_listing_owner_mismatch/);
    assert.match(r, /lifecycle_status \?\? ""\)\.toLowerCase\(\) !== "draft"/);
    assert.match(r, /viajes_checkout_not_available/);
    assert.ok(r.indexOf("viajes_checkout_not_available") < r.indexOf("createPendingPaymentRecord({"));
  });
  await check("client: no-recharge codes surface as an honest saved-changes message, not a generic error", () => {
    const c = raw("app/lib/listingPlans/revenueCategoryCheckoutClient.ts");
    assert.match(c, /active_entitlement_no_recharge/);
    assert.match(c, /already_published_no_recharge/);
    assert.match(c, /Tus cambios se guardaron/);
  });

  // ── no client write may activate a non-live paid/moderated row ──────────────────────────────
  await check("dashboard: Rentas/FSBO republish never flips a non-live row; markStatus active only from paused/sold; En Venta sold stays viewable", () => {
    const p = raw("app/(site)/dashboard/mis-anuncios/page.tsx");
    const fn = p.slice(p.indexOf("async function renewListingsTableRepublish"));
    const rentasBlock = fn.slice(0, fn.indexOf("async function startRentasRenewal") > 0 ? fn.indexOf("async function startRentasRenewal") : 6000);
    assert.match(rentasBlock, /if \(!live\) \{\s*\/\/ 2026-09 category closeout — Republish only bumps/);
    assert.ok(!/if \(!live\) \{\s*patch\.is_published = true;\s*patch\.status = "active";/.test(rentasBlock), "Rentas/BR block must not set active client-side");
    assert.match(p, /cur !== "paused" && cur !== "sold" && cur !== "active"/);
    assert.match(p, /if \(soldEnVenta\) delete patch\.is_published;/);
    assert.match(p, /rowStatusForRepublish !== "paused" && rowStatusForRepublish !== "sold"/);
    assert.ok(p.includes('if (status === "sold") patch.is_published = false;'), "literal pinned by verify-bienes-final-launch-golden-stack-01");
  });

  // ── Autos Privado dashboard edit persists to the same row ───────────────────────────────────
  await check("autos privado: active rows are editable in place; the dashboard edit has a Save and no 'continue to publish' duplicate path", () => {
    const svc = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.match(svc, /\(row\.lane === "negocios" \|\| row\.lane === "privado"\) && row\.status === "active"/);
    const fa = raw("app/(site)/publicar/autos/shared/components/AutosApplicationFinalActions.tsx");
    assert.match(fa, /if \(onSaveEdit\) \{\s*return \(/, "dashboard edit renders its own tree (Preview + Save only)");
    assert.ok(fa.includes('const showSecondaryContinueButton = publishLane !== "negocios" || inventoryAddMode;'), "publish-flow gating literal untouched");
    const editTree = fa.slice(fa.indexOf("if (onSaveEdit) {"), fa.indexOf("showSecondaryContinueButton ? ("));
    assert.ok(!editTree.includes("router.push(publishConfirmHref)"), "the edit tree never navigates to the publish/confirm flow");
    assert.match(fa, /data-testid="autos-dashboard-edit-save"/);
    const app = raw("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
    assert.match(app, /isDashboardListingEditMode\s*\?\s*async \(\) =>/);
    const save = raw("app/(site)/clasificados/autos/privado/lib/saveAutosPrivadoDashboardEdit.ts");
    assert.match(save, /method: "PATCH"/);
    assert.ok(!/method: "POST"/.test(save), "the edit save never creates a row");
    assert.ok(!/revenue-os\/checkout/.test(save), "the edit save never starts a checkout");
  });

  // ── Empleos edit keeps the same row ─────────────────────────────────────────────────────────
  await check("empleos: editing an existing row hands its id to the preview checkout helper (no new draft, no second charge)", () => {
    for (const [lane, f] of [["premium", "premium/EmpleoPremiumApplicationClient.tsx"], ["quick", "quick/EmpleoQuickApplicationClient.tsx"]] as const) {
      const s = raw(`app/(site)/publicar/empleos/${f}`);
      assert.match(s, /rememberEmpleosPendingCheckoutListingId\(window\.sessionStorage/, lane);
      assert.match(s, /, serverListingId\]\);/, `${lane}: goPreview depends on serverListingId`);
    }
  });
  await check("empleos admin: staff suspend leaves a moderation marker; legacy moderate route whitelists statuses", () => {
    // Closeout 2 consolidated both routes onto one shared function (adminEmpleosStaffActions.ts).
    const shared = raw("app/admin/_lib/adminEmpleosStaffActions.ts");
    assert.match(shared, /EMPLEOS_STAFF_SUSPENDED_MARKER = "staff_suspended"/);
    assert.match(shared, /patch\.moderation_reason = reason \?\? EMPLEOS_STAFF_SUSPENDED_MARKER/);
    const m = raw("app/api/admin/empleos/listings/moderate/route.ts");
    assert.match(m, /legacyEmpleosStatusToAction\(/, "legacy route maps only known statuses onto the canonical action");
  });

  // ── BR activate_pending ─────────────────────────────────────────────────────────────────────
  await check("BR: activate_pending needs an ACTIVE br_agent_monthly entitlement for main rows (children stay parent/capacity-gated)", () => {
    const s = raw("app/lib/clasificados/bienes-raices/brListingLifecycleService.ts");
    const fn = s.slice(s.indexOf("async function applyBrActivatePending"));
    assert.match(fn.slice(0, 1800), /row\.inventory_role !== "inventory_property" && brPublishPaymentRequired\("negocio"\)/);
    assert.match(fn.slice(0, 1800), /packageKey: "br_agent_monthly"/);
    assert.match(fn.slice(0, 1800), /ent\.get\(row\.id\)\?\.status !== "active"/);
  });

  // ── Mascotas idempotency ────────────────────────────────────────────────────────────────────
  await check("mascotas: publisher reuses an in-flight row, fails closed on a bad id, recovers by attempt key (Busco pattern)", () => {
    const pub = raw("app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts");
    assert.match(pub, /verifyQuickListingReusable\(supabase/);
    assert.match(pub, /\} else if \(existingListingId\) \{/);
    assert.match(pub, /getOrCreateSessionPublishAttemptKey\("mascotas-y-perdidos"\)/);
    assert.match(pub, /fetchOwnListingIdByPublishAttemptKey/);
    assert.match(pub, /onListingIdKnown\?\.\(listingId\)/);
    const bar = raw("app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx");
    assert.match(bar, /existingListingId: inFlightId/);
  });

  // ── Restaurantes ────────────────────────────────────────────────────────────────────────────
  await check("restaurantes: duplicate-tolerant lookup + update by primary key; pending_payment shown truthfully", () => {
    const r = raw("app/api/clasificados/restaurantes/publish/route.ts");
    assert.match(r, /\.limit\(1\);\s*\n\s*const existingByDraft = \(existingRowsByDraft/);
    assert.match(r, /\.eq\("id", existingListingId as string\)/);
    assert.match(raw("app/(site)/dashboard/lib/dashboardOwnerStatusDisplay.ts"), /pending_payment: "pending_payment",/);
  });

  // ── Admin search / hub ──────────────────────────────────────────────────────────────────────
  await check("admin: Comida Local / Ofertas search no longer errors on a non-uuid Leonix Ad ID", () => {
    assert.match(raw("app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts"), /isUuidSearch \? \[`id\.eq/);
    assert.match(raw("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts"), /ADMIN_SEARCH_UUID_RE\.test\(search\) \? \[`id\.eq/);
  });
  await check("autos admin: staff reactivation lifts the moderation marker", () => {
    assert.match(raw("app/api/admin/autos/listings/[id]/route.ts"), /if \(republishReactivates\) patch\.suspended_reason = null;/);
  });

  // ── AI moderation stays advisory ────────────────────────────────────────────────────────────
  await check("AI moderation is advisory: the listings AI review writes only a review record + audit log, never a publication status", () => {
    const svc = raw("app/admin/_lib/listingAiModerationService.ts");
    assert.match(svc, /listing_moderation_reviews|insertListingModerationReview|listingModerationReviewsDb/);
    assert.ok(!/\.from\("listings"\)\s*\.update\(/.test(svc), "no direct listings update");
    assert.ok(!/(status|is_published|lifecycle_status|listing_status)\s*:\s*["'](active|published|flagged|removed)/.test(svc), "no publication status literal written");
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
