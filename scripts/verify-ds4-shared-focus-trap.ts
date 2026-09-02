/**
 * Globalization Build D-S, Gate DS4 — shared accessibility focus-trap primitive, adopted at the
 * two canonical shared overlay surfaces (never per-category).
 * Run: npx tsx scripts/verify-ds4-shared-focus-trap.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");
let failures = 0;
let checks = 0;
function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

function main(): void {
  console.log("verify-ds4-shared-focus-trap: starting");

  const hookSrc = read("app/lib/accessibility/useLeonixFocusTrap.ts");
  check("Hook traps Tab and Shift+Tab within the container", () => {
    assert.match(hookSrc, /e\.key !== "Tab"/);
    assert.match(hookSrc, /e\.shiftKey/);
  });
  check("Hook restores focus to the pre-activation element on close/unmount", () => {
    assert.match(hookSrc, /previouslyFocused\.current = document\.activeElement/);
    assert.match(hookSrc, /toRestore\.focus\(\)/);
  });

  const sheetSrc = read("app/(site)/components/mobile/LeonixMobileBottomSheet.tsx");
  check("LeonixMobileBottomSheet (Google/Yelp drawer + Community Trust surfaces) adopts the shared hook", () => {
    assert.match(sheetSrc, /import \{ useLeonixFocusTrap \} from "@\/app\/lib\/accessibility\/useLeonixFocusTrap"/);
    assert.match(sheetSrc, /useLeonixFocusTrap\(open, panelRef\)/);
  });

  const ctaSrc = read("app/components/cta/CtaActionSheet.tsx");
  check("CtaActionSheet (nearly every category's contact/CTA flow) adopts the same shared hook", () => {
    assert.match(ctaSrc, /import \{ useLeonixFocusTrap \} from "@\/app\/lib\/accessibility\/useLeonixFocusTrap"/);
    assert.match(ctaSrc, /useLeonixFocusTrap\(open, panelRef\)/);
  });
  check("CtaActionSheet's panel is a real focusable container (not just decorative)", () => {
    assert.match(ctaSrc, /ref=\{panelRef\}/);
    assert.match(ctaSrc, /tabIndex=\{-1\}/);
  });

  console.log(`\nverify-ds4-shared-focus-trap: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
