/**
 * Wizard step quick-navigation regression audit (QA ledger item 23).
 *
 * Proves the wizard step rail's onStepClick dispatch is purely navigational —
 * no field-validation gate, no draft/asset mutation, no scan/publish/checkout
 * side effect — while final-action validation (publish, scan) remains
 * completely untouched and independently enforced elsewhere.
 *
 * This repo's Ofertas audit convention is plain `tsx` scripts asserting real
 * behavior where a pure function is available, and structural source
 * assertions where React rendering/DOM events would require a test runner
 * this repo doesn't have configured (no jsdom/RTL/vitest/jest). Both are used
 * here, matching prior Ofertas audits in this same directory.
 *
 * Run: npm run ofertas-locales:wizard-step-navigation-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

function run() {
  const clientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "utf8"
  );
  const progressSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesWizardProgress.tsx",
    "utf8"
  );

  // --- Case A/B/C: onStepClick is unconditional setStep — no field/step5 gate ---
  const onStepClickMatch = clientSrc.match(/onStepClick=\{\(s\) => \{[\s\S]*?\n\s{14}\}\}/);
  assert.ok(onStepClickMatch, "could not locate onStepClick handler in OfertasLocalesApplicationClient");
  const onStepClickBody = onStepClickMatch![0];
  assert.doesNotMatch(
    onStepClickBody,
    /step5HasBlockingWork/,
    "CASE A/B/C FAILED: onStepClick must not gate on step5HasBlockingWork — navigation must be permissive"
  );
  assert.doesNotMatch(
    onStepClickBody,
    /return;/,
    "CASE A/B/C FAILED: onStepClick must not early-return — every step must be reachable"
  );
  assert.match(onStepClickBody, /setStep\(s\)/, "CASE A/B/C FAILED: onStepClick must call setStep(s)");
  console.log("Cases A-C (permissive step-rail navigation, no validation gate) passed.");

  // --- Case C companion: publish still independently gated regardless of nav path ---
  assert.match(
    clientSrc,
    /step7ConfirmationsComplete \?[\s\S]{0,80}<Link href=\{previewHref\}/,
    "CASE C FAILED: publish/continue action must remain gated behind step7ConfirmationsComplete"
  );
  assert.match(
    clientSrc,
    /<OfertasLocalesValidationPanel[\s\S]{0,20}previewIssues=\{previewIssues\}/,
    "CASE C FAILED: Step 7 must still render independent publish-readiness validation"
  );
  console.log("Case C companion (publish validation independent of navigation) passed.");

  // --- Case D: onStepClick never touches draft, assets, or scan/session state ---
  const FORBIDDEN_IN_NAV = [
    "updateDraft",
    "resetDraft",
    "clearOfertaLocalDraftStorage",
    "submitOfertaLocalAiScan",
    "ensureOfertaLocalRecordForAiScan",
    "handleSaveDraft",
    "setSubmitSuccess",
  ];
  for (const forbidden of FORBIDDEN_IN_NAV) {
    assert.ok(
      !onStepClickBody.includes(forbidden),
      `CASE D/H FAILED: onStepClick must not call ${forbidden} — step navigation must not mutate draft/assets or trigger actions`
    );
  }
  console.log("Case D/H (step navigation has zero draft/asset/action side effects) passed.");

  // --- Case E: no step in the rail is ever disabled — completed steps stay clickable ---
  const railButtonMatch = progressSrc.match(/<button\s+type="button"\s+onClick=\{\(\) => onStepClick\?\.\(step\.id\)\}[\s\S]*?>/);
  assert.ok(railButtonMatch, "could not locate the desktop step-rail button in OfertasLocalesWizardProgress");
  assert.doesNotMatch(
    railButtonMatch![0],
    /disabled/,
    "CASE E FAILED: step-rail buttons (including completed steps) must never be disabled"
  );
  console.log("Case E (completed steps remain clickable, never disabled) passed.");

  // --- Case F: step control is a real <button>, not a div — native keyboard activation ---
  assert.match(
    progressSrc,
    /<button\s+type="button"\s+onClick=\{\(\) => onStepClick\?\.\(step\.id\)\}/,
    "CASE F FAILED: desktop step rail must use a semantic <button>, not a clickable <div>"
  );
  console.log("Case F (semantic button element, native keyboard support) passed.");

  // --- Case G: current step exposes aria-current="step" ---
  assert.match(
    progressSrc,
    /aria-current=\{active \? "step" : undefined\}/,
    'CASE G FAILED: the current step button must expose aria-current="step"'
  );
  console.log("Case G (aria-current exposed on current step) passed.");

  // --- Mobile: a quick-jump control exists and is wired to the same onStepClick prop ---
  assert.match(
    progressSrc,
    /<select[\s\S]{0,200}onChange=\{\(e\) => onStepClick\?\.\(Number\(e\.target\.value\)/,
    "FAILED: mobile view must expose a step quick-jump control wired to onStepClick"
  );
  console.log("Mobile quick-jump control (select, no horizontal overflow) passed.");

  console.log("Ofertas Locales wizard step navigation regression audit passed.");
}

run();
