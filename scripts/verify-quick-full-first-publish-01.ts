/**
 * FULL FIRST-PUBLISH MUST NEVER RECEIVE QUICK LIMITS (owner rule 2026-09-24: UNVERIFIED MUST NOT MEAN QUICK).
 *
 * A customer's FIRST save/publish always precedes their payment, so the entitlement and the settled ledger
 * are silent by construction; a legitimate FULL customer looks exactly like that. Quick restrictions (image
 * cap, no video, role requirement, URL/social gate) may apply ONLY on affirmative server evidence that the
 * listing is Quick/Simple. This verifier executes the real resolver + the real media contract for all four
 * business families and pins every seam to that single rule.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-full-first-publish-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  quickContractAppliesTo,
  resolveQuickBusinessProduct,
  shouldEnforceQuickBusinessContract,
  type QuickBusinessProductFacts,
} from "../app/lib/listingPlans/quickBusinessProductIdentity";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";
import {
  QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY,
  enforceQuickBusinessPublishMedia,
  type SemanticMediaItem,
} from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import { quickFullOnlyBoundaryApplies } from "../app/lib/quickBusiness/quickFullOnlyBoundary";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

/** resolver category -> the media-contract category the seam passes to enforceQuickBusinessPublishMedia */
const FAMILIES = [
  { resolver: "servicios", media: "servicios", role: null as string | null },
  { resolver: "restaurantes", media: "restaurantes", role: null as string | null },
  { resolver: "autos", media: "autos-dealer", role: "vehicle" },
  { resolver: "bienes-raices", media: "bienes-negocio", role: "property" },
] as const;

/** What a seam does: resolve, and run the Quick media contract ONLY when the decision says so. */
function seam(facts: QuickBusinessProductFacts, family: (typeof FAMILIES)[number], photos: number, videos: number) {
  const { enforce, decision } = shouldEnforceQuickBusinessContract(facts);
  const items: SemanticMediaItem[] = Array.from({ length: photos }, () => ({ role: family.role, mime: "image/jpeg" }));
  const result = enforce
    ? enforceQuickBusinessPublishMedia({ category: family.media, items, externalVideoCount: videos })
    : null;
  return { enforce, decision, result };
}

for (const family of FAMILIES) {
  const pair = BUSINESS_CATEGORY_PACKAGE_PAIR[family.resolver]!;
  const cap = QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY[family.media];

  check(`${family.resolver}: a FULL first save (no entitlement, no ledger, no signal) with Full media is NOT refused`, () => {
    // 8 photos (over any Quick cap), external video, no declared roles — all valid for Full.
    const r = seam({ category: family.resolver }, family, 8, 2);
    assert.equal(r.decision.product, "unverified");
    assert.equal(r.enforce, false, "unverified never activates the Quick contract");
    assert.equal(r.result, null, "no Quick media refusal ran");
  });

  check(`${family.resolver}: a FULL first save whose client DECLARES the Full key is still not Quick (declaration is not authority)`, () => {
    const r = seam({ category: family.resolver, declaredPackageKey: pair.full }, family, 8, 2);
    assert.equal(r.decision.product, "unverified", "a declared Full key is never trusted as `full`");
    assert.equal(r.enforce, false);
  });

  check(`${family.resolver}: a proven FULL (entitlement / ledger / staff Full) is never restricted`, () => {
    for (const facts of [
      { category: family.resolver, liveEntitlementRows: [{ packageKey: pair.full, packageTier: "digital_only" }] },
      { category: family.resolver, checkoutLedgerPackageKey: pair.full },
      { category: family.resolver, assistedPackageKey: pair.full },
    ] satisfies QuickBusinessProductFacts[]) {
      const r = seam(facts, family, 8, 2);
      assert.equal(r.decision.product, "full");
      assert.equal(r.enforce, false);
      assert.equal(quickFullOnlyBoundaryApplies(r.decision), false);
    }
  });

  check(`${family.resolver}: a QUICK first save still respects the Quick contract on every affirmative signal`, () => {
    for (const facts of [
      { category: family.resolver, declaredPackageKey: pair.simple },
      { category: family.resolver, assistedPackageKey: pair.simple },
      { category: family.resolver, serverCustodyQuick: true },
      { category: family.resolver, liveEntitlementRows: [{ packageKey: pair.simple, packageTier: "digital_only" }] },
      { category: family.resolver, checkoutLedgerPackageKey: pair.simple },
    ] satisfies QuickBusinessProductFacts[]) {
      const over = seam(facts, family, cap + 1, 0);
      assert.equal(over.decision.product, "quick");
      assert.equal(over.enforce, true);
      assert.equal(over.result?.ok, false, `${family.resolver}: ${cap + 1} photos exceed the Quick cap (${cap})`);
      assert.ok(over.result && !over.result.ok && over.result.issues.some((i) => i.code === "too_many_images"));
      const video = seam(facts, family, 1, 1);
      assert.ok(video.result && !video.result.ok && video.result.issues.some((i) => i.code === "video_not_allowed"), "Quick allows no video");
      const ok = seam(facts, family, cap, 0);
      assert.equal(ok.result?.ok, true, `${family.resolver}: exactly ${cap} real photos pass`);
    }
  });

  check(`${family.resolver}: server evidence beats the browser — a Quick cookie cannot be argued into Full, a Full cookie cannot be downgraded`, () => {
    const quickCookieFullDeclared = resolveQuickBusinessProduct({ category: family.resolver, assistedPackageKey: pair.simple, declaredPackageKey: pair.full });
    assert.equal(quickCookieFullDeclared.product, "quick");
    const fullCookieQuickDeclared = resolveQuickBusinessProduct({ category: family.resolver, assistedPackageKey: pair.full, declaredPackageKey: pair.simple });
    assert.equal(fullCookieQuickDeclared.product, "full", "an assisted Full context is not downgraded by a body declaration");
  });
}

check("unverified alone never activates Quick: the predicate itself", () => {
  assert.equal(quickContractAppliesTo({ product: "unverified", source: "none", packageKey: null }), false);
  assert.equal(quickContractAppliesTo({ product: "full", source: "live_entitlement", packageKey: "x" }), false);
  assert.equal(quickContractAppliesTo({ product: "unverified", source: "no_quick_product", packageKey: null }), false);
  assert.equal(quickContractAppliesTo({ product: "quick", source: "assisted_context", packageKey: "x" }), true);
  assert.equal(quickFullOnlyBoundaryApplies({ product: "unverified", source: "none" }), false, "Full-only fields are never stripped on absence of evidence");
});
check("flat lanes (no Quick product) are never touched", () => {
  for (const category of ["rentas", "empleos", "autos-privado", "comida-local", "bienes-fsbo"]) {
    const d = resolveQuickBusinessProduct({ category, declaredPackageKey: "servicios_quick_monthly" });
    assert.equal(d.source, "no_quick_product");
    assert.equal(quickContractAppliesTo(d), false);
  }
});

check("every seam gates the Quick media contract on `enforceQuickContract` only — no seam re-derives Quick from `!== full`", () => {
  const seams = [
    "app/api/clasificados/servicios/publish/route.ts",
    "app/api/clasificados/restaurantes/publish/route.ts",
    "app/api/clasificados/autos/listings/route.ts",
    "app/api/clasificados/autos/assisted-publish/route.ts",
    "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts",
    "app/api/clasificados/bienes-raices/negocio/publish-media-gate/route.ts",
    "app/lib/sales/canonicalPublishReadiness.ts",
  ];
  for (const rel of seams) {
    const src = raw(rel);
    assert.ok(src.includes("enforceQuickContract"), `${rel}: uses the shared flag`);
    assert.ok(!/product\s*!==\s*["']full["']/.test(src), `${rel}: never treats "not full" as Quick`);
    assert.ok(!/product\s*===\s*["']unverified["']/.test(src), `${rel}: never special-cases unverified as Quick`);
  }
  const id = raw("app/lib/listingPlans/quickBusinessProductIdentity.ts");
  assert.ok(id.includes('return decision.product === "quick";'), "the single rule: affirmative Quick only");
  assert.ok(!id.includes('decision.product !== "full"'), "the old fail-safe-to-Quick rule is gone");
});
check("the Quick client declaration is what proves a customer Quick session (Servicios + Restaurantes send the SIMPLE key only when Quick)", () => {
  const restPreview = raw("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
  const servPreview = raw("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
  assert.ok(
    servPreview.includes("const declaredQuickPackageKey = previewQuickSession ? SERVICIOS_QUICK_CHECKOUT.packageKey : undefined;"),
    "Servicios declares the SIMPLE key only for a Quick session; a Full session sends nothing",
  );
  assert.ok(
    restPreview.includes("basePackageKey: isQuickPreview ? RESTAURANTES_QUICK_CHECKOUT.packageKey : null,"),
    "Restaurantes declares the SIMPLE key only for a Quick session; a Full session sends nothing",
  );
  // The server reads the declaration only when it names the SIMPLE key (one-direction rule), so a
  // declared FULL key can never be trusted — covered by the executed per-family checks above.
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-quick-full-first-publish-01: all checks passed");
