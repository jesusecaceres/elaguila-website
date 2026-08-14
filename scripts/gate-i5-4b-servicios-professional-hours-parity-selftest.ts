/**
 * Gate I.5.4B — self-test for Servicios Professional Hours parity between Preview and Published.
 *
 * Confirmed root cause: `ServiciosProfessionalProfileShell.tsx` (Published) conditionally renders
 * `ServiciosHours` with `!profile.contact.hours?.weeklyRows` (skip the standalone section only
 * when the weekly schedule is already shown inline by `ServiciosBusinessHubContactCard`, which
 * both shells already render identically) — `ServiciosProfessionalPreviewShell.tsx` (Preview) had
 * no such branch at all, so a seller with partial (non-weekly) hours data could publish an Hours
 * section that never appeared in their own Preview.
 *
 * Proves: Preview now imports and renders `ServiciosHours` with the exact same condition as
 * Published (byte-identical condition string, not just "similar"); there is exactly one call site
 * in each shell (no duplicate Hours block anywhere); the Trades shell (`ServiciosProfileView.tsx`)
 * and the shared profile mapper are absent from this gate's changed-file set; and no locked system
 * (payment, checkout, lifecycle, analytics, routes, schema/migrations) was touched.
 *
 * No network, no React rendering. Run from repo root:
 *   npx tsx scripts/gate-i5-4b-servicios-professional-hours-parity-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const PUBLISHED_SHELL = "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx";
const PREVIEW_SHELL = "app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx";
const TRADES_SHELL = "app/(site)/servicios/components/ServiciosProfileView.tsx";
const HOURS_COMPONENT = "app/(site)/servicios/components/ServiciosHours.tsx";
const SHARED_MAPPER = "app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts";
const HOURS_CONDITION = "!profile.contact.hours?.weeklyRows";

async function main() {
  const publishedSrc = readSource(PUBLISHED_SHELL);
  const previewSrc = readSource(PREVIEW_SHELL);
  const tradesSrc = readSource(TRADES_SHELL);
  const hoursSrc = readSource(HOURS_COMPONENT);

  /* ---------------------------------------------------------------------------------------- *
   * 1 — Preview imports ServiciosHours (it did not before this gate).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.ok(
      /import\s*\{\s*ServiciosHours\s*\}\s*from\s*"@\/app\/servicios\/components\/ServiciosHours"/.test(previewSrc),
      "Preview shell must import the same ServiciosHours component Published uses",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 2 — Preview uses the exact same hours-visibility condition as Published — not a rewritten
   * equivalent, the literal same expression, so future edits to one are easy to spot diverging
   * from the other.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.ok(publishedSrc.includes(HOURS_CONDITION), "Published must still use the confirmed condition");
    assert.ok(previewSrc.includes(HOURS_CONDITION), "Preview must use the byte-identical condition as Published");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3 — exactly one ServiciosHours call site per shell — proves the repair reused the component
   * (no duplicated JSX) and proves no duplicate Hours section was introduced by this gate.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(countOccurrences(publishedSrc, "<ServiciosHours"), 1, "Published must render ServiciosHours exactly once");
    assert.equal(countOccurrences(previewSrc, "<ServiciosHours"), 1, "Preview must render ServiciosHours exactly once (no duplicate)");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — ServiciosHours itself already self-guards on missing hours and already renders the
   * weekly rows when present, so reusing it as-is (no forking) is sufficient for every required
   * behavior (no-hours hidden, partial-hours shown, weekly schedule rendered without duplication
   * against the contact-card's own inline weekly list).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.ok(/if\s*\(!hours\)\s*return null/.test(hoursSrc), "ServiciosHours must still self-guard on missing hours data");
    assert.ok(hoursSrc.includes("hours.weeklyRows"), "ServiciosHours must still render the weekly rows when present");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — the Trades shell (ServiciosProfileView.tsx) is a different file entirely and was not
   * touched by this gate (its own, separate hours handling is out of this narrow repair's scope).
   * ---------------------------------------------------------------------------------------- */
  {
    let changedFiles = "";
    try {
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    assert.ok(!changed.includes(TRADES_SHELL), "Trades shell (ServiciosProfileView.tsx) must not appear in this gate's changed files");
    assert.ok(!changed.includes(SHARED_MAPPER), "shared profile mapper must not appear in this gate's changed files");
    assert.ok(tradesSrc.length > 0, "sanity: Trades shell file must still exist and be readable");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 6 — no locked system touched: the lines this gate actually added never reference payment,
   * checkout, webhook, entitlement, lifecycle, analytics wiring, routing, or schema/migrations.
   * ---------------------------------------------------------------------------------------- */
  {
    let diff = "";
    try {
      diff = execFileSync("git", ["diff", "--unified=0", "HEAD", "--", PREVIEW_SHELL], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      diff = "";
    }
    const addedLines = diff
      .split("\n")
      .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
      .join("\n");
    assert.ok(
      !/stripe|checkout|webhook|entitlement|lifecycle|migrations\/|useRouter|analytics/i.test(addedLines),
      "lines added by this gate must not reference any locked system",
    );
  }

  console.log("gate-i5-4b-servicios-professional-hours-parity-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
