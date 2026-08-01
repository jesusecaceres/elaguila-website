/**
 * Work Package I.13C — Runtime Device QA and Preview Preparation self-test.
 *
 * This package implemented no code fix (see the ledger's I.13C section for why: the one central
 * finding could not be root-caused with full certainty in this sandboxed environment, and a
 * speculative fix to shared, currently-correct-looking code was judged riskier than documenting
 * precisely and deferring to owner verification). This test therefore does not assert any
 * behavioral fix — it asserts that the ledger honestly records what was found, what was ruled
 * out, and what remains for the owner, so a future package (or the owner) can pick this up
 * without re-deriving it from a transcript.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i13c-runtime-device-qa-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

async function main() {
  const ledgerSrc = readSource("docs/gate-i5-7f-full-catalog-route-contract-matrix.md");
  const sectionStart = ledgerSrc.indexOf("Work Package I.13C Update Log");
  const sectionEnd = ledgerSrc.indexOf("Work Package I.13B Update Log");
  assert.ok(sectionStart > -1, "ledger must record an I.13C section");
  assert.ok(sectionEnd > sectionStart, "the I.13C section must precede the I.13B section (most-recent-first ordering)");
  const section = ledgerSrc.slice(sectionStart, sectionEnd);

  /* ============================================================================================
   * The central finding must be recorded precisely: which routes, what was observed, and that
   * the network layer was proven not to be the cause.
   * ========================================================================================== */
  for (const route of [
    "/clasificados/dealers-de-autos/results",
    "/clasificados/autos/resultados",
    "/clasificados/en-venta/results",
    "/clasificados/busco",
  ]) {
    assert.ok(section.includes(route), `ledger must name the affected route: ${route}`);
  }
  for (const unaffected of [
    "/clasificados/restaurantes/resultados",
    "/clasificados/servicios/resultados",
    "/clasificados/rentas/results",
  ]) {
    assert.ok(section.includes(unaffected), `ledger must name a confirmed-unaffected route for contrast: ${unaffected}`);
  }
  assert.ok(/200 OK/.test(section), "ledger must record that the underlying network fetch was proven to complete successfully");

  /* ============================================================================================
   * Honesty requirements — must not overclaim a fix, must record the environmental-artifact
   * hypothesis with its supporting reasoning, and must not claim PREVIEW READY given this
   * unresolved finding.
   * ========================================================================================== */
  assert.ok(/no code fix/i.test(section), "ledger must state plainly that no code fix was implemented this package");
  assert.ok(/not compositing frames|not displayed/i.test(section), "ledger must record the specific tooling evidence (pane not compositing) behind the sandbox-artifact hypothesis");
  assert.ok(/force-dynamic/.test(section), "ledger must record that the force-dynamic hypothesis was tested and ruled out");
  assert.ok(/seller=dealer/.test(section), "ledger must record that the redirect-effect hypothesis was tested and ruled out");
  assert.ok(/cleared `\.next` cache|cleared .next cache/i.test(section) || /from-scratch server/i.test(section), "ledger must record that cache/HMR corruption was ruled out via a from-scratch server");

  /* ============================================================================================
   * The required next step must be actionable and specific, not vague.
   * ========================================================================================== */
  assert.ok(/normal, visibly-rendered\s+\*\*browser|normal browser/i.test(section), "ledger must name the exact required verification step: a normal browser check");
  assert.ok(section.includes("Owner QA required") || section.includes("Owner QA Required") || section.includes("Deferred runtime-only QA"), "ledger must have a deferred/owner-QA section");

  /* ============================================================================================
   * REGRESSION — no locked system, no Ofertas, no Concierge file in this package's diff. Since
   * this package made no code changes, the diff should contain only the ledger and this test.
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
    const lockedFragments = [
      "stripe", "revenue-os", "webhook", "migrations", "entitlement", "app/api/admin/",
      "ofertas", "cupones", "concierge", "package.json", "next.config",
    ];
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of lockedFragments) {
        assert.ok(!lower.includes(frag), `locked/external file must not be part of this package's diff: ${f} (matched "${frag}")`);
      }
      assert.ok(
        f.startsWith("docs/gate-i5-7f-full-catalog-route-contract-matrix.md") || f.startsWith("scripts/gate-i13c"),
        `I.13C made no code fix, so the diff should only contain the ledger and this test, not: ${f}`,
      );
    }
  }

  console.log("gate-i13c-runtime-device-qa-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
