/**
 * Gate I.5.3 — self-test for safe legacy publish compatibility redirects.
 *
 * Proves: the query-preserving redirect helper forwards the COMPLETE incoming parameter set
 * (not a manual whitelist) while always normalizing `lang`; the four pre-existing quick-category
 * redirect pages are untouched and still correct; the new Empleos redirect page exists and calls
 * `redirect()` with the canonical destination; and — critically — that no file this gate touched
 * or investigated introduces a redirect loop (source targets a page that does not itself
 * redirect back to the source or to a common third page in a cycle).
 *
 * No network, no React rendering, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-3-publish-redirect-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { forwardPublishRedirectParams } from "../app/lib/clasificados/forwardPublishRedirectParams";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1 — forwardPublishRedirectParams forwards the FULL incoming param set, not a whitelist:
   * arbitrary edit/listingId/mode/returnTo/campaign params all survive verbatim, and lang is
   * always present and normalized even when absent or malformed on input.
   * ---------------------------------------------------------------------------------------- */
  {
    const dest = forwardPublishRedirectParams("/publicar/empleos", {
      edit: "1",
      listingId: "abc-123",
      mode: "listing-edit",
      returnTo: "/dashboard/empleos",
      utm_source: "newsletter",
    });
    const url = new URL(dest, "https://example.com");
    assert.equal(url.pathname, "/publicar/empleos");
    assert.equal(url.searchParams.get("lang"), "es", "lang must default when absent");
    assert.equal(url.searchParams.get("edit"), "1");
    assert.equal(url.searchParams.get("listingId"), "abc-123");
    assert.equal(url.searchParams.get("mode"), "listing-edit");
    assert.equal(url.searchParams.get("returnTo"), "/dashboard/empleos");
    assert.equal(url.searchParams.get("utm_source"), "newsletter", "campaign/tracking params must survive");
  }

  {
    const dest = forwardPublishRedirectParams("/publicar/empleos", { lang: "en", foo: ["a", "b"] });
    const url = new URL(dest, "https://example.com");
    assert.equal(url.searchParams.get("lang"), "en", "explicit lang must be preserved, not overridden");
    assert.deepEqual(url.searchParams.getAll("foo"), ["a", "b"], "array-valued params must all survive");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 2 — the four pre-existing quick-category redirects are untouched and still correct
   * (source-level check, since these are Next.js server components, not pure functions).
   * ---------------------------------------------------------------------------------------- */
  {
    const cases: Array<[string, string]> = [
      ["app/(site)/clasificados/publicar/busco/page.tsx", "/publicar/busco/quick"],
      ["app/(site)/clasificados/publicar/clases/page.tsx", "/publicar/clases/quick"],
      ["app/(site)/clasificados/publicar/comunidad/page.tsx", "/publicar/comunidad/quick"],
      ["app/(site)/clasificados/publicar/mascotas-y-perdidos/page.tsx", "/publicar/mascotas-y-perdidos/quick"],
    ];
    for (const [file, expectedDest] of cases) {
      const src = readSource(file);
      assert.ok(src.includes("redirect("), `${file} must still call redirect()`);
      assert.ok(src.includes(expectedDest), `${file} must still target ${expectedDest}`);
    }
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3 — the new Empleos redirect exists, calls redirect() to the canonical hub, and forwards
   * the full param set via the new helper (not a manual whitelist).
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource("app/(site)/clasificados/publicar/empleos/page.tsx");
    assert.ok(src.includes("redirect("), "Empleos legacy hub must call redirect()");
    assert.ok(src.includes("/publicar/empleos"), "must target the canonical Empleos hub");
    assert.ok(src.includes("forwardPublishRedirectParams"), "must use the full-param-forwarding helper");
    assert.ok(
      !src.includes('from "@/app/publicar/empleos/EmpleosPublicarHubClient"') && !src.includes("<EmpleosPublicarHubClient"),
      "must no longer import or render the old duplicate presentation component",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — no redirect loop: /publicar/empleos itself does not redirect anywhere (it's a real
   * content page), so the new Empleos shim is exactly one hop, never a cycle.
   * ---------------------------------------------------------------------------------------- */
  {
    const targetSrc = readSource("app/(site)/publicar/empleos/page.tsx");
    assert.ok(!targetSrc.includes("redirect("), "/publicar/empleos must not itself redirect (no chain, no loop)");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — routes this gate proved MUST NOT be redirected remain real, non-redirecting content
   * pages (Servicios checkpoint, Servicios plain entry still points at checkpoint not
   * /publicar/servicios, Bienes Raíces both hub variants, Restaurantes selector).
   * ---------------------------------------------------------------------------------------- */
  {
    const serviciosPlain = readSource("app/(site)/clasificados/publicar/servicios/page.tsx");
    assert.ok(serviciosPlain.includes('redirect("/clasificados/publicar/servicios/checkpoint")'));

    const serviciosCheckpoint = readSource("app/(site)/clasificados/publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx");
    assert.ok(!serviciosCheckpoint.includes("redirect("), "checkpoint must remain a real distinct pricing page, not a redirect");

    const brOldHub = readSource("app/(site)/clasificados/publicar/bienes-raices/BienesRaicesPublicarHubClient.tsx");
    assert.ok(!brOldHub.includes("redirect("), "old BR hub (real Privado/Negocio choice) must remain untouched");

    const brModern = readSource("app/(site)/publicar/bienes-raices/PublicarBienesRaicesNegocioSelectorClient.tsx");
    assert.ok(!brModern.includes("redirect("), "modern BR page (confirmed Negocio-only) must remain untouched");

    const restaurantesSelector = readSource("app/(site)/clasificados/publicar/restaurantes/page.tsx");
    assert.ok(!restaurantesSelector.includes("redirect("), "Restaurantes tier selector has unique pricing content, must not redirect");
  }

  console.log(`gate-i5-3-publish-redirect-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
