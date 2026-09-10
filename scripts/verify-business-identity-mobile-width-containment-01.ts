/**
 * Focused regression tests for Gate BCO-3R-B.7 (hard mobile width containment / Step 2 overflow
 * fix). Same repo convention as the other verify-business-*.ts scripts — no jest/vitest in this
 * repo, hand-rolled node:assert + check(). Run from repo root:
 * npx tsx scripts/verify-business-identity-mobile-width-containment-01.ts
 *
 * IMPORTANT — this is source/structural proof only. This sandbox's Browser pane is not
 * compositing frames this session (`document.documentElement`/every descendant's
 * getBoundingClientRect() returns [0,0,0,0] despite getComputedStyle resolving real values, and
 * `computer.screenshot` fails with "the Browser pane is not displayed, so the page is not
 * compositing frames"), so no live pixel-geometry certification (scrollWidth <= clientWidth,
 * element bounding boxes) could be produced this session. These checks certify that the actual
 * CSS root cause (see below) is fixed at the source and that the containment contract exists
 * everywhere the spec requires it — they do NOT substitute for the owner's visual confirmation.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Business Identity mobile width containment (Gate BCO-3R-B.7) — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

// --- Phase 3: box-sizing guardrail ------------------------------------------------------------
check("globals.css: Tailwind is imported, which provides Preflight's universal box-sizing:border-box (no duplicate rule needed)", () => {
  const globalsCss = read("app/globals.css");
  assert.ok(globalsCss.includes('@import "tailwindcss"'), "expected the Tailwind v4 import that ships Preflight's border-box reset");
});

// --- Phase 2/9: dashboard shell root-cause fix --------------------------------------------------
const shellText = read("app/(site)/dashboard/components/LeonixDashboardShell.tsx");
check("LeonixDashboardShell: the grid container and its <aside> item both carry min-w-0 (the actual root-cause fix)", () => {
  assert.ok(/grid w-full min-w-0 max-w-full gap-6/.test(shellText), "the mobile/tablet grid container must be min-w-0 so its implicit column can shrink below content width");
  assert.ok(/h-fit w-full min-w-0 max-w-full rounded-3xl/.test(shellText), "the <aside> grid item must be min-w-0 — without it, its trigger button's truncated name/email forces the whole grid (and page) wider than the viewport");
});
check("LeonixDashboardShell: <main> and the children/rightPanel grid items are explicitly bounded (w-full/min-w-0/max-w-full)", () => {
  assert.ok(shellText.includes('"relative mx-auto w-full px-4 pb-20 pt-24'), "main must be an explicit w-full block");
  assert.ok(shellText.includes('"w-full min-w-0 max-w-full", workbench'), "the children wrapper grid item must stay w-full/min-w-0/max-w-full");
});
check("LeonixDashboardShell: overflow-x-hidden is the final safety net, applied at the shell root (Phase 7) — not a substitute for the min-w-0 fix", () => {
  assert.ok(shellText.includes('"relative min-h-screen w-full max-w-full overflow-x-hidden'), "expected the page-level guard at the shell root, alongside (not instead of) the min-w-0 fix above");
});
check("LeonixDashboardShell: the mobile drawer never uses an unsafe fixed width — bounded to min(88vw, 360px)", () => {
  assert.ok(shellText.includes("w-[min(88vw,360px)]"), "drawer width must stay viewport-relative and capped");
  assert.ok(!/\bw-\[\d{4,}px\]/.test(shellText), "must not use a raw fixed pixel width larger than a typical phone viewport");
});
check("LeonixDashboardShell: no w-screen or unsafe whitespace-nowrap anywhere in the shell", () => {
  assert.ok(!shellText.includes("w-screen"), "w-screen is never safe to use here — it ignores scrollbar-caused viewport/layout mismatches");
  assert.ok(!shellText.includes("whitespace-nowrap"), "the shell has no legitimate reason to force nowrap text");
});

// --- Phase 4: grid/flex shrinking across the onboarding flow ------------------------------------
const onboardingGridFiles = [
  "app/(site)/dashboard/business-tools/onboarding/_steps/Step1SetupLanguage.tsx",
  "app/(site)/dashboard/business-tools/onboarding/_steps/Step2BusinessIdentity.tsx",
  "app/(site)/dashboard/business-tools/onboarding/_steps/Step5Location.tsx",
  "app/(site)/dashboard/business-tools/onboarding/_steps/Step6ContactsProfiles.tsx",
  "app/(site)/dashboard/business-tools/onboarding/_steps/Step8OwnedListings.tsx",
  "app/(site)/dashboard/business-tools/business/[businessId]/page.tsx",
  "app/(site)/dashboard/business-tools/page.tsx",
];
check("Onboarding + business-tools: every responsive grid declares an explicit base grid-cols-1 (never relies on the browser's auto-sizing default)", () => {
  for (const rel of onboardingGridFiles) {
    const text = read(rel);
    const responsiveGridLines = text.split("\n").filter((l) => /className="[^"]*\bgrid\b[^"]*\b(sm|md|lg):grid-cols-/.test(l));
    for (const line of responsiveGridLines) {
      assert.ok(/\bgrid-cols-1\b/.test(line), `${rel} has a responsive grid without an explicit base grid-cols-1: ${line.trim()}`);
    }
  }
});
check("Step2BusinessIdentity: the legal/public name grid explicitly declares grid-cols-1 at the base", () => {
  const text = read("app/(site)/dashboard/business-tools/onboarding/_steps/Step2BusinessIdentity.tsx");
  assert.ok(text.includes('className="grid grid-cols-1 gap-4 sm:grid-cols-2"'));
});
check("Onboarding: no w-screen anywhere in the step components", () => {
  for (const rel of onboardingGridFiles) {
    assert.ok(!read(rel).includes("w-screen"), `${rel} must not use w-screen`);
  }
});

// --- Phase 6: wizard action row ------------------------------------------------------------------
const wizardShellText = read("app/(site)/dashboard/business-tools/onboarding/WizardShell.tsx");
check("WizardShell: root/card/action-row are explicitly bounded, and the action row can wrap instead of pushing Next offscreen", () => {
  assert.ok(wizardShellText.includes('className="mx-auto w-full max-w-2xl"'), "wizard root must be an explicit w-full block within its max-w-2xl cap");
  assert.ok(wizardShellText.includes("w-full max-w-full rounded-3xl border"), "the wizard card must be explicitly bounded");
  assert.ok(wizardShellText.includes("mt-4 flex w-full max-w-full flex-wrap items-center justify-between gap-3"), "the Back/status/Next action row must be bounded and allowed to wrap");
  assert.ok(wizardShellText.includes('role="status" aria-live="polite" className="min-w-0 text-xs'), "the save-state status text must be min-w-0 so it can shrink instead of forcing overflow");
});
check("WizardShell: Back/Next buttons keep their 44px minimum touch height (unchanged by this gate)", () => {
  assert.ok(wizardShellText.includes("min-h-[44px]"));
});

// --- Phase 8: searchable select / popovers ------------------------------------------------------
const searchableSelectText = read("app/(site)/dashboard/business-tools/_components/SearchableSelect.tsx");
check("SearchableSelect: the popover listbox is bounded to its own relatively-positioned trigger, never a fixed width larger than mobile viewports", () => {
  assert.ok(searchableSelectText.includes('className="relative"'), "the trigger wrapper must establish the positioning context the popover is bounded to");
  assert.ok(searchableSelectText.includes('className="absolute z-20 mt-1 max-h-64 w-full'), "the listbox must be w-full relative to its own bounded trigger, not a raw fixed pixel width");
  assert.ok(!/w-\[\d{3,}px\]/.test(searchableSelectText), "must not use a fixed pixel width that could exceed a phone viewport");
});
const codedMultiSelectText = read("app/(site)/dashboard/business-tools/_components/CodedMultiSelect.tsx");
check("CodedMultiSelect: reuses the same bounded SearchableSelect popover, no independent fixed-width popover", () => {
  assert.ok(codedMultiSelectText.includes("<SearchableSelect"));
});

// --- Phase 9: drawer regression (Gate B.6 behavior fully retained) ------------------------------
check("LeonixDashboardShell: Gate B.6 drawer behavior is fully intact (compact shell, fixed drawer, backdrop, scroll lock, focus handling, dev indicator disabled elsewhere)", () => {
  assert.ok(shellText.includes("compact = false"), "compact prop must still exist");
  assert.ok(shellText.includes('fixed inset-y-0 right-0 z-[200]'), "drawer must still be fixed when open");
  assert.ok(shellText.includes("bg-black/50"), "backdrop must still exist");
  assert.ok(shellText.includes('document.body.style.overflow = "hidden"'), "body scroll lock must still exist");
  assert.ok(shellText.includes("mobileNavTriggerRef.current?.focus()"), "focus-return to trigger must still exist");
  assert.ok(shellText.includes("void signOut()"), "sign-out must still be reachable");
});
const nextConfigText2 = read("next.config.ts");
check("next.config.ts: dev indicator remains fully disabled (Gate B.6), unaffected by this gate", () => {
  assert.ok(/devIndicators:\s*false/.test(nextConfigText2));
});

// --- Phase 11: prior-gate corrections remain intact ----------------------------------------------
const step8Text = read("app/(site)/dashboard/business-tools/onboarding/_steps/Step8OwnedListings.tsx");
check("Step8OwnedListings: mobile listing-card layout (Gate B.4) is untouched", () => {
  assert.ok(step8Text.includes("flex-col gap-3 sm:flex-row"));
  assert.ok(step8Text.includes("onChange={() => toggleCandidate(c)}"));
});
const step9Text = read("app/(site)/dashboard/business-tools/onboarding/_steps/Step9Review.tsx");
check("Step9Review: location-separation (Gate B.5) and formatted phone display remain intact", () => {
  assert.ok(step9Text.includes("t.sectionBusinessCountry"));
  assert.ok(step9Text.includes("formatUsPhoneForDisplay"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
console.log(
  "\nNOTE: these are source-level/structural checks only. Live pixel-geometry certification\n" +
    "(scrollWidth <= clientWidth, element bounding boxes at 360/390/430px) could not be produced\n" +
    "this session because the Browser pane is not compositing frames in this sandbox. Owner visual\n" +
    "confirmation at the listed retest URL is still required before this is considered certified.",
);
