/**
 * Package D Build D3, Gates 2-3 — narrow verifier proving the two remaining named CTA-analytics
 * gaps identified in D1/D2 (Bienes social icons, Busco ContactActions) are actually closed, and
 * that neither fix regressed into fabricating a message_sent event.
 *
 * Run: npx tsx scripts/verify-package-d-d3-hub-analytics-gaps.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

async function main() {
  const brSidebar = src(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx",
  );
  check(brSidebar.includes("dispatchConnectionHubCta"), "Bienes contact sidebar imports the shared CTA dispatcher");
  check(brSidebar.includes('trackSocial("instagram")'), "Bienes main-agent Instagram icon dispatches truthfully");
  check(brSidebar.includes('trackSocial("facebook")'), "Bienes main-agent Facebook icon dispatches truthfully");
  check(
    (brSidebar.match(/onClick=\{\(\) => trackSocial\(/g) ?? []).length >= 13,
    "Bienes: every social icon across both the main-agent and second-agent rails has an onClick dispatch (13 rendered social buttons total)",
  );
  check(!brSidebar.includes("message_sent"), "Bienes contact sidebar never fabricates message_sent for any CTA");

  const buscoCanvas = src("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  check(buscoCanvas.includes("onContact={"), "Busco ContactActions call-site now supplies onContact (was previously unset)");
  check(buscoCanvas.includes("dispatchConnectionHubCta"), "Busco onContact dispatches through the shared contract");
  check(!buscoCanvas.includes("message_sent"), "Busco contact wiring never fabricates message_sent");

  // Mascotas y Perdidos — confirmed genuine named blocker (not silently left broken): the file's
  // own code comment explicitly locks this out of scope. Verify that comment still exists, so a
  // future removal of the lock is caught rather than this gate silently going stale.
  const mascotas = src("app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx");
  check(
    mascotas.includes("locked: global analytics") || mascotas.includes("out of scope"),
    "Mascotas y Perdidos: the named governance lock explaining why CTA analytics is out of scope still exists in source (named blocker, not silent gap)",
  );

  console.log(
    failures === 0
      ? "verify-package-d-d3-hub-analytics-gaps: all checks passed."
      : `verify-package-d-d3-hub-analytics-gaps: ${failures} FAILURE(S).`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
