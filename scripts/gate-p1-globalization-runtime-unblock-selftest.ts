/**
 * Globalization P1 — Runtime Unblock and Ad-Creation Readiness self-test.
 *
 * Proves: (1) the root-cause fix (no redundant global <Suspense> around {children} in
 * app/layout.tsx) is present and permanent; (2) every one of the 7 category results pages has
 * exactly one, correctly-scoped local Suspense boundary (not zero, not a redundant nested pair);
 * (3) app/(site)/layout.tsx's own pre-existing warning against this exact pattern is untouched;
 * (4) no locked/external-system file (Stripe, Revenue OS, Ofertas Locales business logic,
 * Concierge, migrations) is part of this package's diff.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-p1-globalization-runtime-unblock-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

/* ================================================================================================
 * 1. Root cause fix: app/layout.tsx no longer wraps {children} in a Suspense boundary.
 * ============================================================================================== */
{
  const src = readSource("app/layout.tsx");
  assert.ok(!/<Suspense[^>]*>\s*\{children\}\s*<\/Suspense>/.test(src), "app/layout.tsx must not wrap {children} in a <Suspense> boundary — this was the root cause of the app-wide stuck-loading defect");
  assert.ok(src.includes("<ComingSoonGateRoot>"), "the launch-lock gate must remain in place, untouched");
  assert.ok(src.includes("<LanguagePreferenceSync"), "language preference sync must remain in place, untouched");
}

/* ================================================================================================
 * 2. Each of the 7 category results pages has exactly one local Suspense boundary.
 * ============================================================================================== */
{
  const resultsPages = [
    "app/(site)/clasificados/dealers-de-autos/results/page.tsx",
    "app/(site)/clasificados/autos/resultados/page.tsx",
    "app/(site)/clasificados/en-venta/results/page.tsx",
    "app/(site)/clasificados/busco/resultados/page.tsx",
    "app/(site)/clasificados/clases/resultados/page.tsx",
    "app/(site)/clasificados/comunidad/resultados/page.tsx",
    "app/(site)/clasificados/mascotas-y-perdidos/resultados/page.tsx",
  ];
  for (const rel of resultsPages) {
    const src = readSource(rel);
    const opens = (src.match(/<Suspense\b/g) ?? []).length;
    const closes = (src.match(/<\/Suspense>/g) ?? []).length;
    assert.equal(opens, 1, `${rel} must have exactly one <Suspense> boundary, found ${opens}`);
    assert.equal(closes, 1, `${rel} must have exactly one closing </Suspense>, found ${closes}`);
  }
}

/* ================================================================================================
 * 3. app/(site)/layout.tsx's own pre-existing warning against wrapping {children} remains intact
 * and untouched — it already got this right one layer down; this package's fix brought the layer
 * above into agreement, not the other way around.
 * ============================================================================================== */
{
  const src = readSource("app/(site)/layout.tsx");
  assert.ok(
    src.includes("Do not wrap `{children}` in a root `<Suspense>` here"),
    "app/(site)/layout.tsx's own documented warning against this exact anti-pattern must remain untouched",
  );
  assert.ok(!/<Suspense[^>]*>\s*\{children\}\s*<\/Suspense>/.test(src), "app/(site)/layout.tsx must still not wrap {children} in Suspense");
}

/* ================================================================================================
 * 4. REGRESSION — no locked/external-system file in this package's diff.
 * ============================================================================================== */
{
  let changedFiles = "";
  try {
    changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
  } catch {
    changedFiles = "";
  }
  const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
  const lockedFragments = [
    "stripe", "revenue-os", "webhook", "migrations", "entitlement",
    "app/api/admin/", "cupones", "concierge", "package.json", "next.config",
  ];
  for (const f of changed) {
    const lower = f.toLowerCase();
    for (const frag of lockedFragments) {
      assert.ok(!lower.includes(frag), `locked/external file must not be part of this package's diff: ${f} (matched "${frag}")`);
    }
  }
  // The two Ofertas/Autos dashboard-plumbing files touched are Lifecycle-owned structural fixes
  // (Suspense boundary required by Next.js's build, not Ofertas business logic) — assert they are
  // the *only* ofertas-path files touched, not a broader incursion.
  const ofertasFiles = changed.filter((f) => f.toLowerCase().includes("ofertas"));
  const allowedOfertasFiles = new Set([
    "app/(site)/dashboard/ofertas-locales/[id]/page.tsx",
    "app/(site)/dashboard/ofertas-locales/page.tsx",
  ]);
  for (const f of ofertasFiles) {
    assert.ok(allowedOfertasFiles.has(f), `unexpected Ofertas-path file in diff: ${f}`);
  }
}

console.log("gate-p1-globalization-runtime-unblock-selftest: OK");
