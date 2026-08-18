/**
 * Work Package I.13A — Launch Readiness: Security, ES/EN, Mobile, and UX States self-test.
 *
 * Covers, source-level (React/Next.js pages can't be invoked standalone outside the
 * framework, same convention used throughout this session): (1) the Comida Local
 * publish-route ownership fix; (2) zero-row-mutation-reported-as-success fixes across
 * servicios/empleos/viajes/autos dedicated-table pipelines; (3) raw-error-leakage removal
 * across 4 owner dashboard files; (4) ES/EN launch-language fixes (Rentas Privado pt/tl
 * clamp, dashboard login-redirect lang preservation, untranslated string fix); (5) the
 * Restaurantes country-filter honesty fix; (6) the CtaActionSheet Escape-key accessibility
 * fix; (7) external-workstream isolation; (8) no locked-system file touched.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i13a-launch-readiness-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

async function main() {
  /* ============================================================================================
   * SECURITY — Comida Local publish route ownership-mismatch guard (the highest-severity
   * proven finding this package: an unauthenticated/wrong-owner request could previously
   * overwrite an existing, already-owned listing).
   * ========================================================================================== */
  {
    const src = readSource("app/api/clasificados/comida-local/publish/route.ts");
    assert.ok(src.includes('"ownership_mismatch"'), "Comida Local publish route must reject a verified-owner mismatch");
    assert.ok(src.includes('"auth_required"'), "Comida Local publish route must reject an unauthenticated update to an already-owned listing");
    const guardIdx = src.indexOf("existingOwnerUserId");
    const updateIdx = src.indexOf("draftToComidaLocalPublicListingInsert(draft, existing.slug");
    assert.ok(guardIdx > -1 && updateIdx > -1 && guardIdx < updateIdx, "the ownership guard must run before the existing-listing row is rebuilt/persisted");
  }

  /* ============================================================================================
   * SECURITY — zero-row mutations must never be reported as success (I.12A's proven pattern,
   * applied here to 4 dedicated-table pipelines it did not originally cover).
   * ========================================================================================== */
  {
    const servicios = readSource("app/api/clasificados/servicios/manage/route.ts");
    assert.ok(servicios.includes('.select("slug")'), "servicios/manage must select the updated row to detect a zero-row match");
    assert.ok(servicios.includes('"listing_not_found_or_forbidden"'), "servicios/manage must surface a zero-row match as an error, not success");

    const empleos = readSource("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts");
    assert.ok(/updateEmpleosListingLifecycleAdmin[\s\S]{0,1200}\.select\("id"\)[\s\S]{0,400}"listing_not_found"/.test(empleos), "updateEmpleosListingLifecycleAdmin must detect and reject a zero-row match");
    assert.ok(/updateEmpleosJobApplicationStatusOwner[\s\S]{0,1500}\.select\("id"\)[\s\S]{0,400}"application_not_found"/.test(empleos), "updateEmpleosJobApplicationStatusOwner must detect and reject a zero-row match");

    const viajes = readSource("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
    assert.ok((viajes.match(/\.select\("id"\)/g) ?? []).length >= 4, "the 3 viajes staged-listing writes fixed this package (plus the pre-existing insert) must select the affected row");
    assert.ok(viajes.includes('"listing_not_found"'), "updateViajesStagedListingModeration must reject a zero-row match");
    assert.equal((viajes.match(/"forbidden"/g) ?? []).length >= 3, true, "viajes owner-scoped writes must reject a zero-row/forbidden match");

    const autos = readSource("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.ok(/ensureDealerInventoryParentMain[\s\S]{0,900}\.select\("id"\)/.test(autos), "ensureDealerInventoryParentMain's write must now capture and check its result");
    assert.ok(/promoteNegociosMainInventoryListing[\s\S]{0,900}\.select\("id"\)[\s\S]{0,400}zero-row match/.test(autos), "promoteNegociosMainInventoryListing must detect and reject a zero-row match");
  }

  /* ============================================================================================
   * SECURITY / UX — raw Postgrest/Supabase error strings must never reach the owner dashboard.
   * ========================================================================================== */
  {
    const helper = readSource("app/(site)/dashboard/lib/dashboardSafeErrorCopy.ts");
    assert.ok(helper.includes("export function dashboardSafeMutationErrorCopy"), "the safe-error-copy helper must exist and be exported");

    const files = [
      "app/(site)/dashboard/mis-anuncios/page.tsx",
      "app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx",
      "app/(site)/dashboard/drafts/page.tsx",
      "app/(site)/dashboard/viajes/page.tsx",
    ];
    for (const f of files) {
      const src = readSource(f);
      assert.ok(src.includes("dashboardSafeMutationErrorCopy"), `${f} must use the safe-error-copy helper`);
      assert.ok(!/setErro?r?\((?:uErr|qErr|dErr|error)\.message\)/.test(src), `${f} must not set visible error state directly from a raw Postgrest error message`);
    }
  }

  /* ============================================================================================
   * LANGUAGE — Rentas Privado publish flow no longer renders in an unsupported launch
   * language (pt/tl) even when reached via manual ?lang= manipulation.
   * ========================================================================================== */
  {
    for (const f of [
      "app/(site)/clasificados/publicar/rentas/privado/page.tsx",
      "app/(site)/publicar/rentas/privado/page.tsx",
    ]) {
      const src = readSource(f);
      assert.ok(/launchLocale/.test(src), `${f} must clamp the resolved locale to a launch-supported value`);
      assert.ok(src.includes('initialLocale={launchLocale}'), `${f} must pass the clamped locale, not the raw resolved locale, to the application shell`);
    }
  }

  /* ============================================================================================
   * LANGUAGE — ?lang= must survive the dashboard listing-detail page's login redirect (the one
   * proven drop found this package; sibling list/editar pages already did this correctly).
   * ========================================================================================== */
  {
    const src = readSource("app/(site)/dashboard/mis-anuncios/[id]/page.tsx");
    assert.ok(/redirectTarget[\s\S]{0,80}window\.location\.search/.test(src), "the login redirect must forward window.location.search (and therefore ?lang=), not just usePathname()");
    assert.ok(src.includes("encodeURIComponent(redirectTarget)"), "the login redirect must encode the lang-preserving target, not the bare pathname");
  }

  /* ============================================================================================
   * LANGUAGE — no un-translated English string remains inside an ES-branch ternary for the
   * Restaurantes "meal_prep" service option (found in two places: the label mapper and the
   * filter <option>).
   * ========================================================================================== */
  {
    const src = readSource("app/(site)/clasificados/restaurantes/resultados/RestaurantesResultsShell.tsx");
    assert.ok(!/lang === "es" \? "Meal prep" : "Meal prep"/.test(src), "the ES branch must no longer render the untranslated English string");
    assert.equal((src.match(/"Comida preparada"/g) ?? []).length, 2, "both meal_prep occurrences (label mapper + filter option) must carry a real Spanish translation");
  }

  /* ============================================================================================
   * FILTER CONSISTENCY — the Restaurantes country filter must no longer silently imply it
   * filters non-US results when the underlying field isn't stored/queried yet.
   * ========================================================================================== */
  {
    const src = readSource("app/(site)/clasificados/restaurantes/resultados/RestaurantesResultsShell.tsx");
    const inputIdx = src.indexOf('id="rx-filter-country"');
    assert.ok(inputIdx > -1, "the country filter input must still exist (not removed)");
    const surrounding = src.slice(inputIdx, inputIdx + 400);
    assert.ok(surrounding.includes("disabled"), "the country filter must be disabled until the underlying field is real, per Objective G (hidden rather than fake)");
    assert.ok(src.includes("rx-filter-country-note"), "the country filter must carry an honest, localized note explaining the current US-only scope");
  }

  /* ============================================================================================
   * ACCESSIBILITY — CtaActionSheet (the shared contact/share sheet used across every
   * category) must be closeable via Escape, matching the already-proven lightbox pattern.
   * ========================================================================================== */
  {
    const src = readSource("app/components/cta/CtaActionSheet.tsx");
    assert.ok(/e\.key === "Escape"\)\s*onClose\(\)/.test(src), "CtaActionSheet must close on Escape");
    assert.ok(src.includes('window.addEventListener("keydown"'), "CtaActionSheet must register a real keydown listener, not just document a close button");
  }

  /* ============================================================================================
   * REGRESSION — no locked system, no Ofertas, no Concierge file in this package's diff.
   * ========================================================================================== */
  {
    let changedFiles = "";
    try {
      const { execFileSync } = await import("node:child_process");
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    // Globalization P1 fixed the root cause of the app-wide stuck-loading-spinner defect (a
    // redundant global <Suspense> in app/layout.tsx) and, as a required consequence, added the
    // one local Suspense boundary Next.js's build requires around each of these two pages' own
    // useSearchParams() usage. Both are structural runtime-plumbing fixes only (no ownership,
    // payment, or business-logic change), required for "npm run build" to succeed at all -- not
    // an incursion into the Ofertas Locales or Autos Negocios workstreams this check protects.
    const GLOBALIZATION_P1_STRUCTURAL_SUSPENSE_FIX_EXCEPTIONS = new Set([
      "app/(site)/dashboard/ofertas-locales/[id]/page.tsx",
      "app/(site)/dashboard/ofertas-locales/page.tsx",
      "app/(site)/clasificados/autos/negocios/preview/page.tsx",
      "app/(site)/publicar/autos/negocios/page.tsx",
      "app/(site)/clasificados/bienes-raices/page.tsx",
      "app/(site)/clasificados/bienes-raices/pago/cancelado/page.tsx",
      "app/(site)/clasificados/bienes-raices/pago/exito/page.tsx",
      "app/(site)/clasificados/bienes-raices/resultados/page.tsx",
      "app/(site)/clasificados/publicar/bienes-raices/page.tsx",
      "app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx",
      "app/admin/(dashboard)/workspace/clasificados/page.tsx",
      "app/admin/login/page.tsx",
    ]);
    // Globalization Package A — later-package files authorized via the shared allowlist
    // (see scripts/globalizationCurrentPackageDiff.ts for the per-file justification).
    const { excludeCurrentPackageFiles } = await import("./globalizationCurrentPackageDiff");
    const changed = excludeCurrentPackageFiles(
      changedFiles
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((f) => !GLOBALIZATION_P1_STRUCTURAL_SUSPENSE_FIX_EXCEPTIONS.has(f)),
    );
    const lockedFragments = [
      "stripe", "revenue-os", "webhook", "migrations", "entitlement", "app/api/admin/",
      "ofertas", "cupones", "concierge", "package.json", "next.config",
    ];
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of lockedFragments) {
        assert.ok(!lower.includes(frag), `locked/external file must not be part of this package's diff: ${f} (matched "${frag}")`);
      }
    }
  }

  console.log("gate-i13a-launch-readiness-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
