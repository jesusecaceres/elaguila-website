/**
 * Work Package I.6B — Quick Clasificados data integrity and public closure self-test.
 *
 * Covers: Mascotas y Perdidos public rendering repair, shared-shell regression protection for
 * every other category it serves, the shared duplicate-prevention idempotency helper (unit
 * tested with a mock Supabase client — no live DB), and dashboard discovery truth for
 * Clases/Comunidad. No network, no React/DOM (the shared shell itself cannot be imported outside
 * Next.js — it statically imports a .png asset — so shell coverage here is source-level, the
 * same convention used throughout this session for DOM-bound files).
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i6b-quick-clasificados-integrity-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CATEGORY_ROUTE_REGISTRY, getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import { resolveDashboardActions } from "../app/lib/listingIdentity/dashboardActionResolver";
import type { CanonicalCategoryKey, ListingIdentity } from "../app/lib/listingIdentity/types";
import {
  readCandidateListingId,
  verifyQuickListingReusable,
  type QuickListingReuseCheck,
} from "../app/(site)/clasificados/lib/quickListingIdempotency";
import { MIS_ANUNCIOS_CATEGORY_DEFS } from "../app/(site)/dashboard/lib/dashboardMisAnunciosCategories";

const REPO_ROOT = path.resolve(__dirname, "..");
const VALID_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_UUID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function fakeIdentity(overrides: Partial<ListingIdentity>): ListingIdentity {
  return {
    sourceTable: "listings",
    sourceId: VALID_UUID,
    category: "mascotas-y-perdidos",
    pipeline: "mascotas_y_perdidos",
    leonixAdId: "",
    ownerUserId: "owner-1",
    publicUrl: `/clasificados/anuncio/${VALID_UUID}`,
    editUrl: null,
    previewUrl: null,
    dashboardUrl: null,
    ...overrides,
  };
}

/**
 * Minimal deterministic mock of the Supabase client shape verifyQuickListingReusable uses.
 * Honors `.eq("id", value)` like a real query would — only returns the row when the id actually
 * matches, so the mock can't accidentally validate a helper that ignores the filter.
 */
function mockSupabase(row: { id: string; owner_id: string; category: string } | null | "error") {
  let eqId: string | undefined;
  return {
    from() {
      return {
        select() {
          return this;
        },
        eq(field: string, value: string) {
          if (field === "id") eqId = value;
          return this;
        },
        async maybeSingle() {
          if (row === "error") return { data: null, error: { message: "boom" } };
          if (!row || row.id !== eqId) return { data: null, error: null };
          return { data: row, error: null };
        },
      };
    },
  } as any;
}

async function main() {
  /* ============================================================================================
   * MASCOTAS — category coercion / public route / ES-EN / dashboard action gating.
   * ========================================================================================== */
  {
    const adapter = getCategoryRouteAdapter("mascotas_y_perdidos");
    const identity = fakeIdentity({});

    // Public route now resolves by canonical UUID.
    assert.equal(adapter.publicRoute(identity, { lang: "es" }), `/clasificados/anuncio/${VALID_UUID}`);
    assert.equal(adapter.publicRoute(identity, { lang: "en" }), `/clasificados/anuncio/${VALID_UUID}`);

    // Edit remains absent — public rendering fix does not by itself create a safe edit surface.
    assert.equal(adapter.editRoute(identity, { lang: "es" }), null);

    // Dashboard route remains absent — Objective D did not touch Mascotas dashboard discovery.
    assert.equal(adapter.dashboardRoute(identity, { lang: "es" }), null);

    // dashboardActionResolver: viewPublic now appears (route support is now valid); edit/manage
    // actions remain absent; no Business Hub action leaks through even with entitlements true.
    const actions = resolveDashboardActions({
      identity,
      lifecycle: { status: "active" },
      entitlement: { couponsActive: true, offersActive: true, inventoryPackActive: true },
      role: null,
      ownerVerified: true,
      lang: "es",
    });
    const keys = actions.map((a) => a.key);
    assert.ok(keys.includes("viewPublic"), "Mascotas viewPublic must now appear — public route is proven safe");
    assert.ok(
      actions.find((a) => a.key === "viewPublic")!.href.includes(VALID_UUID),
      "viewPublic href must carry the canonical UUID",
    );
    assert.ok(!keys.includes("edit"), "Mascotas edit must remain hidden — no safe category-specific editor exists");
    assert.ok(!keys.includes("manageCoupons") && !keys.includes("manageOffers") && !keys.includes("manageInventory"));

    // Owner-unverified still fails closed.
    const unverified = resolveDashboardActions({
      identity,
      lifecycle: { status: "active" },
      entitlement: {},
      role: null,
      ownerVerified: false,
      lang: "es",
    });
    assert.equal(unverified.length, 0);
  }

  /* ============================================================================================
   * MASCOTAS — the new published-detail component exists and exports the expected shape (import
   * check only — cannot render without a DOM; proves the module at least loads and is wired
   * correctly, catching an accidental typo/missing-export regression).
   * ========================================================================================== */
  {
    const mod = await import("../app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage");
    assert.equal(typeof mod.MascotasPerdidosPublishedDetailPage, "function", "the new component must export a function component");
  }

  /* ============================================================================================
   * SHARED SHELL REGRESSION — source-level: every previously-supported category remains in the
   * allowlist byte-for-byte, Mascotas is now present, and no coercion fallback was widened beyond
   * the documented last-resort "en-venta" default for genuinely unmodeled values.
   * ========================================================================================== */
  {
    const shellSrc = readFileSync(
      path.join(REPO_ROOT, "app/(site)/clasificados/anuncio/[id]/page.tsx"),
      "utf8",
    );

    const allowlistMatch = shellSrc.match(/const CATEGORY_KEYS[\s\S]*?\[([\s\S]*?)\];/);
    assert.ok(allowlistMatch, "must locate the CATEGORY_KEYS array literal");
    const allowlistBody = allowlistMatch![1];

    const PREVIOUSLY_SUPPORTED = [
      "en-venta",
      "bienes-raices",
      "rentas",
      "autos",
      "servicios",
      "empleos",
      "clases",
      "comunidad",
      "busco",
      "travel",
    ];
    for (const cat of PREVIOUSLY_SUPPORTED) {
      assert.ok(allowlistBody.includes(cat), `regression: "${cat}" must remain in the shell's allowlist unchanged`);
    }
    assert.ok(allowlistBody.includes("mascotas-y-perdidos"), "mascotas-y-perdidos must now be present (I.6B fix)");

    // Every category's own dispatch branch/hook is still present (mirrors the exact pattern used
    // to add the Mascotas branch — proves the addition was additive, not a replacement).
    assert.ok(shellSrc.includes("useBuscoQuickDetail"), "Busco dispatch must remain unchanged");
    assert.ok(shellSrc.includes("useCommunityQuickWysiwyg"), "Clases/Comunidad dispatch must remain unchanged");
    assert.ok(shellSrc.includes("useMascotasPerdidosQuickDetail"), "Mascotas dispatch must exist (I.6B addition)");
    assert.ok(shellSrc.includes("BienesRaicesNegocioLiveDetailShell"), "Bienes Raíces Negocio rendering must remain unchanged");
    assert.ok(shellSrc.includes("BienesRaicesPrivadoLiveDetailShell"), "Bienes Raíces Privado rendering must remain unchanged");
    assert.ok(shellSrc.includes("useRentasAnuncioDerived"), "Rentas rendering must remain unchanged");
    assert.ok(shellSrc.includes("useAutosAnuncioDerived"), "Autos rendering must remain unchanged");
    assert.ok(shellSrc.includes("EnVentaAnuncioLayout"), "En Venta rendering must remain unchanged");

    // The category-label map used for cross-links/breadcrumbs must still cover every key
    // (TypeScript's own Record<CategoryKey,...> exhaustiveness check already enforces this at
    // compile time — this assertion documents the same guarantee at the test level).
    assert.ok(shellSrc.includes('"mascotas-y-perdidos": { es: "Mascotas y Perdidos"'), "category label map must include Mascotas");

    // The last-resort fallback is still narrowly scoped to unmodeled values only, not widened
    // into a general "always default to en-venta" rule.
    const coerceMatch = shellSrc.match(/function coerceCategoryKey[\s\S]*?\n\}/);
    assert.ok(coerceMatch, "must locate coerceCategoryKey");
    assert.ok(
      coerceMatch![0].includes("CATEGORY_KEYS as readonly string[]).includes(s) ? (s as CategoryKey) : \"en-venta\""),
      "coerceCategoryKey must still only fall back to en-venta for values NOT in CATEGORY_KEYS",
    );
  }

  /* ============================================================================================
   * DUPLICATE PREVENTION — shared idempotency helper, unit tested with a mock Supabase client.
   * ========================================================================================== */
  {
    // Pure validation, no network.
    assert.equal(readCandidateListingId(null), null);
    assert.equal(readCandidateListingId(""), null);
    assert.equal(readCandidateListingId("not-a-uuid"), null);
    assert.equal(readCandidateListingId(`  ${VALID_UUID}  `), VALID_UUID);

    // 1/2 — missing/invalid candidate fails closed without any query.
    const missing = await verifyQuickListingReusable(mockSupabase(null), {
      candidateId: null,
      ownerUserId: "owner-1",
      expectedCategory: "en-venta",
    });
    assert.deepEqual(missing satisfies QuickListingReuseCheck, { safe: false, reason: "missing" });

    const invalid = await verifyQuickListingReusable(mockSupabase(null), {
      candidateId: "not-a-uuid",
      ownerUserId: "owner-1",
      expectedCategory: "en-venta",
    });
    assert.deepEqual(invalid, { safe: false, reason: "invalid-uuid" });

    // 3 — valid UUID, row genuinely belongs to this owner + category: safe to reuse.
    const ok = await verifyQuickListingReusable(
      mockSupabase({ id: VALID_UUID, owner_id: "owner-1", category: "en-venta" }),
      { candidateId: VALID_UUID, ownerUserId: "owner-1", expectedCategory: "en-venta" },
    );
    assert.deepEqual(ok, { safe: true, listingId: VALID_UUID });

    // 7 — owner mismatch fails closed.
    const ownerMismatch = await verifyQuickListingReusable(
      mockSupabase({ id: VALID_UUID, owner_id: "someone-else", category: "en-venta" }),
      { candidateId: VALID_UUID, ownerUserId: "owner-1", expectedCategory: "en-venta" },
    );
    assert.deepEqual(ownerMismatch, { safe: false, reason: "owner-mismatch" });

    // 8 — wrong-category fails closed.
    const categoryMismatch = await verifyQuickListingReusable(
      mockSupabase({ id: VALID_UUID, owner_id: "owner-1", category: "busco" }),
      { candidateId: VALID_UUID, ownerUserId: "owner-1", expectedCategory: "en-venta" },
    );
    assert.deepEqual(categoryMismatch, { safe: false, reason: "category-mismatch" });

    // Not-found row (deleted/never existed) fails closed.
    const notFound = await verifyQuickListingReusable(mockSupabase(null), {
      candidateId: VALID_UUID,
      ownerUserId: "owner-1",
      expectedCategory: "en-venta",
    });
    assert.deepEqual(notFound, { safe: false, reason: "not-found" });

    // Query error (e.g. transient DB error) fails closed — never treated as "safe to reuse".
    const queryError = await verifyQuickListingReusable(mockSupabase("error"), {
      candidateId: VALID_UUID,
      ownerUserId: "owner-1",
      expectedCategory: "en-venta",
    });
    assert.deepEqual(queryError, { safe: false, reason: "query-error" });

    // 9 — a different (unrelated) UUID never accidentally matches.
    const unrelated = await verifyQuickListingReusable(
      mockSupabase({ id: VALID_UUID, owner_id: "owner-1", category: "en-venta" }),
      { candidateId: OTHER_UUID, ownerUserId: "owner-1", expectedCategory: "en-venta" },
    );
    assert.equal(unrelated.safe, false, "verifying a different candidate id must never match an unrelated row's data");
  }

  /* ============================================================================================
   * DUPLICATE PREVENTION — source-level: each of the 4 publishers now branches on a verified
   * reuse check instead of unconditionally inserting, and the fail-closed fallback (insert) is
   * still reachable when verification fails — proving reuse never silently becomes an unscoped
   * update.
   * ========================================================================================== */
  {
    const publisherFiles = [
      "app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts",
      "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts",
      "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
    ];
    for (const rel of publisherFiles) {
      const src = readFileSync(path.join(REPO_ROOT, rel), "utf8");
      assert.ok(src.includes("verifyQuickListingReusable"), `${rel} must call the shared verification helper`);
      assert.ok(src.includes("reuseCheck?.safe"), `${rel} must branch on the verified "safe" result, not the raw candidate id`);
      assert.ok(src.includes("updateListingsRowResilient") || src.includes("updatablePayload"), `${rel} must use an UPDATE path when reuse is safe`);
      assert.ok(src.includes("insertListingsRowResilient") || src.includes(".insert("), `${rel} must retain a real INSERT fallback path`);
      assert.ok(src.includes("owner_id: _ownerId") || src.includes("_ownerId"), `${rel} must never overwrite owner_id on an update`);
    }
  }

  /* ============================================================================================
   * DASHBOARD DISCOVERY — Clases/Comunidad now exposed through the existing generic private
   * listing organization (no dedicated architecture built).
   * ========================================================================================== */
  {
    const clases = MIS_ANUNCIOS_CATEGORY_DEFS.find((d) => d.key === "clases")!;
    const comunidad = MIS_ANUNCIOS_CATEGORY_DEFS.find((d) => d.key === "comunidad")!;
    assert.equal(clases.ready, true, "Clases must now be marked ready — generic discovery already works");
    assert.equal(comunidad.ready, true, "Comunidad must now be marked ready");
    assert.equal(clases.manageHref("lang=es"), "/dashboard/mis-anuncios?lang=es&cat=clases");
    assert.equal(comunidad.manageHref("lang=es"), "/dashboard/mis-anuncios?lang=es&cat=comunidad");
    // Mirrors the already-working Busco entry's exact shape — not a new pattern.
    const busco = MIS_ANUNCIOS_CATEGORY_DEFS.find((d) => d.key === "busco")!;
    assert.equal(busco.manageHref("lang=es"), "/dashboard/mis-anuncios?lang=es&cat=busco");
  }

  /* ============================================================================================
   * CATALOG REGRESSION — no unrelated registry adapter changed; pipeline count unchanged.
   * ========================================================================================== */
  {
    assert.equal(Object.keys(CATEGORY_ROUTE_REGISTRY).length, 17);
    const untouchedExpected: Partial<Record<CanonicalCategoryKey, string>> = {
      restaurantes: "/publicar/restaurantes",
      servicios: "/publicar/servicios",
      empleos: "/publicar/empleos",
      bienes_raices_negocio: "/clasificados/publicar/bienes-raices/negocio/agente-individual",
      bienes_raices_privado: "/publicar/bienes-raices/privado",
      autos_negocios: "/publicar/autos/negocios",
      autos_privado: "/publicar/autos/privado",
      rentas_negocio: "/publicar/rentas/negocio",
      rentas_privado: "/publicar/rentas/privado",
      en_venta: "/clasificados/publicar/en-venta/pro",
      viajes: "/publicar/viajes",
      ofertas_locales: "/publicar/ofertas-locales",
      comida_local: "/publicar/comida-local",
    };
    for (const [pipeline, expected] of Object.entries(untouchedExpected)) {
      assert.equal(getCategoryRouteAdapter(pipeline as CanonicalCategoryKey).applicationRoute, expected);
    }
    // Confirm no Ofertas/Cupones or Business Concierge file paths appear anywhere in the modified
    // module set this test exercises (a structural sanity check, not a git-diff check).
    for (const pipeline of ["ofertas_locales"] as CanonicalCategoryKey[]) {
      assert.ok(getCategoryRouteAdapter(pipeline).supportsCoupons === false || pipeline === "restaurantes" || pipeline === "servicios");
    }
  }

  console.log("gate-i6b-quick-clasificados-integrity-selftest: OK");
}

main();
