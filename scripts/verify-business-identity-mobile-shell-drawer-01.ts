/**
 * Focused regression tests for Gate BCO-3R-B.6 (compact mobile onboarding shell, real mobile
 * account drawer, dev-indicator isolation). Same repo convention as the other
 * verify-business-*.ts scripts — no jest/vitest in this repo, hand-rolled node:assert + check().
 * Run from repo root: npx tsx scripts/verify-business-identity-mobile-shell-drawer-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { dashboardShellCopy } from "../app/(site)/dashboard/lib/dashboardI18n";
import { businessIdentityCopy } from "../app/(site)/dashboard/business-tools/_components/businessIdentityCopy";

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

console.log("Business Identity mobile shell drawer (Gate BCO-3R-B.6) — focused tests\n");

const shellPath = path.resolve(__dirname, "../app/(site)/dashboard/components/LeonixDashboardShell.tsx");
const shellText = readFileSync(shellPath, "utf8");

// --- Phase 2: real drawer, not an in-flow panel --------------------------------------------
check("LeonixDashboardShell: the mobile panel is `fixed` (a real drawer) when open, not in-flow", () => {
  assert.ok(shellText.includes("fixed inset-y-0 right-0 z-[200]"), "expected the open-state panel to be fixed-positioned as a right-side overlay");
  assert.ok(shellText.includes("w-[min(88vw,360px)]"), "drawer width must be bounded to min(88vw, 360px) per spec");
});
check("LeonixDashboardShell: a dedicated backdrop dims and closes the page behind the drawer", () => {
  assert.ok(shellText.includes("bg-black/50"), "expected a dimmed backdrop layer");
  assert.ok(shellText.includes("onClick={closeMobileNav}"), "clicking the backdrop must close the drawer");
});
check("LeonixDashboardShell: drawer carries dialog semantics only while open", () => {
  assert.ok(shellText.includes('role={mobileNavOpen ? "dialog" : undefined}'));
  assert.ok(shellText.includes("aria-modal={mobileNavOpen ? true : undefined}"));
  assert.ok(shellText.includes('aria-labelledby={mobileNavOpen ? "dashboard-account-drawer-title" : undefined}'));
  assert.ok(shellText.includes('id="dashboard-account-drawer-title"'), "expected a visible heading the dialog is labelled by");
});
check("LeonixDashboardShell: close button meets the 44x44px touch target and has an explicit label", () => {
  assert.ok(shellText.includes("h-11 w-11") && shellText.includes("aria-label={L.closeAccountMenu}"), "expected an 11x11 (44x44px) close button labelled via closeAccountMenu");
});
check("LeonixDashboardShell: Escape closes the drawer, body scroll is locked while open, focus returns to the trigger on close", () => {
  assert.ok(shellText.includes('e.key === "Escape"'), "Escape must close the drawer");
  assert.ok(shellText.includes('document.body.style.overflow = "hidden"'), "body scroll must be locked while the drawer is open");
  assert.ok(shellText.includes("mobileNavTriggerRef.current?.focus()"), "focus must return to the trigger button on close");
  assert.ok(shellText.includes("mobileNavCloseButtonRef.current?.focus()"), "opening must move focus into the drawer (its close button)");
});
check("LeonixDashboardShell: Tab is trapped within the drawer while open (focus-trap keydown handler)", () => {
  assert.ok(shellText.includes('e.key !== "Tab"') || shellText.includes('if (e.key !== "Tab")'), "expected a Tab-key focus-trap branch");
  assert.ok(shellText.includes("querySelectorAll<HTMLElement>"), "expected the trap to compute the drawer's own focusable elements");
});
check("LeonixDashboardShell: background content is aria-hidden while the drawer is open", () => {
  assert.ok(shellText.includes("aria-hidden={mobileNavOpen || undefined}"), "the main content sibling must be aria-hidden while the drawer is open");
});
check("LeonixDashboardShell: exactly one drawer DOM copy — the account/nav content is written once, not duplicated for mobile vs desktop", () => {
  const panelIdCount = (shellText.match(/id="dashboard-sidebar-panel"/g) ?? []).length;
  assert.equal(panelIdCount, 1, `expected exactly one #dashboard-sidebar-panel element, found ${panelIdCount}`);
  const signOutCount = (shellText.match(/void signOut\(\)/g) ?? []).length;
  assert.equal(signOutCount, 1, `expected exactly one sign-out control, found ${signOutCount}`);
  const publishLinkCount = (shellText.match(/L\.publish/g) ?? []).length;
  assert.equal(publishLinkCount, 1, `expected exactly one Publish Listing control, found ${publishLinkCount}`);
});
check("LeonixDashboardShell: trigger button carries aria-expanded/aria-controls/aria-label", () => {
  assert.ok(shellText.includes("aria-expanded={mobileNavOpen}"));
  assert.ok(shellText.includes('aria-controls="dashboard-sidebar-panel"'));
  assert.ok(shellText.includes("aria-label={mobileNavOpen ? L.closeAccountMenu : L.openAccountMenu}"));
});
check("LeonixDashboardShell: desktop/tablet sidebar behavior is unchanged — sm: overrides restore the in-flow layout, lg: grid switch untouched", () => {
  assert.ok(shellText.includes("sm:static sm:z-auto sm:block"), "sm+ must override the mobile fixed/drawer styling back to a normal in-flow block");
  assert.ok(shellText.includes("lg:grid-cols-"), "the lg: two-column grid switch must still be present, unmodified");
});
check("dashboardShellCopy: openAccountMenu/closeAccountMenu labels are present, non-empty, and distinct in both languages", () => {
  for (const lang of ["es", "en"] as const) {
    const L = dashboardShellCopy(lang);
    assert.ok(L.openAccountMenu.trim().length > 0);
    assert.ok(L.closeAccountMenu.trim().length > 0);
    assert.notEqual(L.openAccountMenu, L.closeAccountMenu);
  }
  assert.equal(dashboardShellCopy("es").openAccountMenu, "Abrir menú de cuenta");
  assert.equal(dashboardShellCopy("en").openAccountMenu, "Open account menu");
});

// --- Phase 1: compact mobile onboarding shell -------------------------------------------------
check("LeonixDashboardShell: the big logo/PANEL hero block is hidden on mobile only when compact is requested", () => {
  assert.ok(shellText.includes('compact ? "hidden" : "flex"'), "expected the hero block's mobile visibility to be gated on the compact prop");
  assert.ok(shellText.includes("sm:flex"), "the hero must still show at sm+ regardless of compact (desktop/tablet unaffected)");
});
const onboardingPagePath = path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/page.tsx");
const onboardingPageText = readFileSync(onboardingPagePath, "utf8");
check("Onboarding page: both the loading and hydrated LeonixDashboardShell calls pass compact", () => {
  const compactCount = (onboardingPageText.match(/<LeonixDashboardShell[^>]*\bcompact\b/g) ?? []).length;
  assert.equal(compactCount, 2, `expected both shell render branches (loading + hydrated) to pass compact, found ${compactCount}`);
});
const businessDetailPagePath = path.resolve(__dirname, "../app/(site)/dashboard/business-tools/business/[businessId]/page.tsx");
const businessDetailPageText = readFileSync(businessDetailPagePath, "utf8");
check("Completed-profile page: does NOT pass compact — only onboarding gets the compact mobile shell", () => {
  assert.ok(!/<LeonixDashboardShell[^>]*\bcompact\b/.test(businessDetailPageText), "the completed-profile page must keep the standard dashboard branding, unaffected by this gate");
});

// --- Phase 4: duplicate language controls ------------------------------------------------------
const wizardShellPath = path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/WizardShell.tsx");
const wizardShellText = readFileSync(wizardShellPath, "utf8");
check("WizardShell: the wizard-local language switch carries a short distinguishing caption", () => {
  assert.ok(wizardShellText.includes("t.formLanguageLabel"), "expected the formLanguageLabel caption next to the wizard-local ES/EN switch");
});
check("businessIdentityCopy: formLanguageLabel is short (no lengthy copy) and present in both languages", () => {
  for (const lang of ["es", "en"] as const) {
    const label = businessIdentityCopy(lang).wizard.formLanguageLabel;
    assert.ok(label.trim().length > 0);
    assert.ok(label.length <= 20, `formLanguageLabel must stay short, got "${label}" (${label.length} chars)`);
  }
});

// --- Phase 5: dev indicator ----------------------------------------------------------------
const nextConfigText = readFileSync(path.resolve(__dirname, "../next.config.ts"), "utf8");
check("next.config.ts: dev-tools indicator is fully disabled (preferred remedy) — never overlaps any control again, regardless of position", () => {
  assert.ok(/devIndicators:\s*false/.test(nextConfigText), "expected devIndicators: false");
  assert.ok(nextConfigText.includes("development-only") || nextConfigText.toLowerCase().includes("dev mode only") || nextConfigText.toLowerCase().includes("development"), "must document that this is a development-only setting with no production effect");
});

// --- Phase 8: Step 8 / Step 9 corrections from prior gates remain untouched -------------------
const step8Text3 = readFileSync(
  path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/_steps/Step8OwnedListings.tsx"),
  "utf8",
);
check("Step8OwnedListings: mobile vertical listing-card layout (Gate B.4) is untouched by this gate", () => {
  assert.ok(step8Text3.includes("flex-col gap-3 sm:flex-row"));
  assert.ok(step8Text3.includes("onChange={() => toggleCandidate(c)}"));
});
const step9Text4 = readFileSync(path.resolve(__dirname, "../app/(site)/dashboard/business-tools/onboarding/_steps/Step9Review.tsx"), "utf8");
check("Step9Review: location-consistency (Gate B.5) and phone-formatting corrections are untouched by this gate", () => {
  assert.ok(step9Text4.includes("t.sectionBusinessCountry"));
  assert.ok(step9Text4.includes("formatUsPhoneForDisplay"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
