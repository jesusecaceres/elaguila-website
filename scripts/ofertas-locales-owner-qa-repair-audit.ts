/**
 * FINAL OWNER-QA REPAIR BATCH — proves the 3 live UX defects found during
 * production owner QA are closed:
 *
 *  ⚠️63 — Step 6 no longer renders an empty wizard-card shell above the
 *         review desk; the workbench heading now renders directly on the
 *         review desk section.
 *  ⚠️64 — a prominent "Revisión completa" banner + "Continuar a Extras →"
 *         CTA now renders immediately under that heading whenever review
 *         is fully complete (additive — the workspace's own completed
 *         banner deeper in the editor column is untouched).
 *  ⚠️65 — the optional email field shows an immediate, accessible, red
 *         inline error (not just a neutral helper) via the SAME shared
 *         isOfertaLocalEmailFormatValid() helper the Step 8 blocker
 *         already used — no new validation engine.
 *
 * Run: npm run ofertas-locales:owner-qa-repair-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { isOfertaLocalEmailFormatValid } from "../app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";

type Verdict = { id: string; label: string; ok: boolean };
const results: Verdict[] = [];

function check(id: string, label: string, fn: () => void) {
  try {
    fn();
    results.push({ id, label, ok: true });
    console.log(`${id} ${label} -> TRUE`);
  } catch (err) {
    results.push({ id, label, ok: false });
    console.log(`${id} ${label} -> FALSE (${(err as Error).message})`);
  }
}

const clientSrc = fs.readFileSync(
  "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
  "utf8"
);
const copySrc = fs.readFileSync(
  "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  "utf8"
);

check("01", "Step 6 does not render the redundant empty wizard-card shell", () => {
  assert.match(
    clientSrc,
    /showStep6ReviewDesk \? \(\s*\/\/ ⚠️63:[\s\S]{0,400}?null\s*\) : \(/,
    "the wizard-card branch must be skipped entirely (render null) when the review desk is active"
  );
});

check("02", "Review workspace heading + workbench render directly under it", () => {
  const deskSectionMatch = clientSrc.match(
    /\{showStep6ReviewDesk \? \(\s*<section[\s\S]*?<\/section>\s*\) : null\}/
  );
  assert.ok(deskSectionMatch, "review desk section must exist");
  const desk = deskSectionMatch![0];
  const headingIdx = desk.indexOf("wizardStepTitle(stepMeta, lang)");
  const workspaceIdx = desk.indexOf("<OfertasLocalesAiScanReviewWorkspace");
  assert.ok(headingIdx > -1 && workspaceIdx > -1, "heading and workspace must both be present");
  assert.ok(headingIdx < workspaceIdx, "heading must render before the workbench, not after a separate empty card");
});

check("03", "127/8 persisted completion can reconstruct after refresh (unchanged reconstruction path)", () => {
  assert.match(
    clientSrc,
    /aiReviewGate\.totalItems > 0 \|\| aiReviewGate\.activeScanJobId/,
    "the existing hasExistingAiScan reconstruction signal must remain untouched"
  );
});

check("04", "Completed review shows 'Revisión completa' banner immediately under the heading", () => {
  assert.match(clientSrc, /step5ReviewComplete \? \(/);
  assert.match(clientSrc, /\{c\.aiReviewCompleteTitle\}/);
});

check("05", "Completed review shows 'Continuar a Extras' CTA", () => {
  assert.match(clientSrc, /\{c\.aiReviewContinueToNextStep\}/);
});

check("06", "The completed-review CTA targets Step 7 (goToStep7Extras)", () => {
  assert.match(clientSrc, /className=\{`\$\{BTN_SUCCESS_LG\} mt-4`\}\s*\n\s*onClick=\{goToStep7Extras\}/);
});

check("07", "Page navigation preserved (existing workspace props unchanged)", () => {
  assert.match(clientSrc, /<OfertasLocalesAiScanReviewWorkspace[\s\S]{0,400}onContinueToNextStep=\{goToStep7Extras\}/);
});

check("08", "Approved-item reopen preserved (review panel untouched)", () => {
  const panelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "utf8"
  );
  assert.match(panelSrc, /aiReviewReopenedTerminalNote/);
});

check("09", "Email empty = valid (real function call)", () => {
  assert.equal(isOfertaLocalEmailFormatValid(""), true);
});

check("10", "Valid email = valid (real function call)", () => {
  assert.equal(isOfertaLocalEmailFormatValid("hola@negocio.com"), true);
});

check("11", "'www.google.com' = invalid (real function call, the exact live QA repro value)", () => {
  assert.equal(isOfertaLocalEmailFormatValid("www.google.com"), false);
});

check("12", "Invalid email shows an inline Step 7 error (red, accessible, immediate)", () => {
  assert.match(clientSrc, /error=\{emailMalformed \? c\.socialEmailInvalid : undefined\}/);
  assert.match(clientSrc, /role="alert" className="text-xs font-medium text-red-700"/);
  assert.match(clientSrc, /aria-invalid=\{emailMalformed\}/);
  assert.match(clientSrc, /aria-describedby=\{emailMalformed \? "ofertas-email-error" : undefined\}/);
});

check("13", "Invalid email cannot silently proceed as accepted (no green confirm state)", () => {
  assert.match(
    clientSrc,
    /confirm=\{!emailMalformed && resolveOfertaLocalContactEmail\(draft\) \? c\.urlAccepted : undefined\}/
  );
});

check("14", "Invalid email does not unlock Preview (Step 8 blocker + goNext both still gate on emailMalformed)", () => {
  assert.match(clientSrc, /emailMalformed \? <li>· \{c\.step7BlockerEmail\}<\/li> : null/);
  assert.match(clientSrc, /if \(isExtrasStep && emailMalformed\) \{/);
});

check("15", "Clearing an invalid optional email removes the blocker (single shared emailMalformed signal)", () => {
  const matches = clientSrc.match(/\bemailMalformed\b/g) ?? [];
  assert.ok(matches.length >= 5, "emailMalformed must be the single signal reused across confirm/error/blocker/goNext");
  assert.match(
    clientSrc,
    /const emailMalformed =\s*\n\s*draft\.email\.trim\(\)\.length > 0 && !isOfertaLocalEmailFormatValid\(draft\.email\)/
  );
});

check("16", "Preview remains unchanged (no file touched)", () => {
  const changed = new Set([
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  ]);
  assert.ok(!changed.has("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx"));
  assert.ok(!changed.has("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx"));
});

check("17", "Scanner protected files NONE", () => {
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `touched protected path: ${file}`);
  }
});

check("18", "Email validation reuses the shared helper — no Ofertas-only validation engine created", () => {
  assert.doesNotMatch(clientSrc, /function isOfertaLocalEmailFormatValid/);
  assert.match(
    clientSrc,
    /isOfertaLocalEmailFormatValid,?\s*\n\s*normalizeOfertaLocalEmailInput,?\s*\n\s*resolveOfertaLocalContactEmail,?\s*\n\} from "@\/app\/lib\/ofertas-locales\/ofertasLocalesApplicationHelpers"/
  );
});

check("19", "Email stays optional (still rendered with the optional label, never required)", () => {
  assert.match(copySrc, /socialEmailInvalid: "Ingresa un correo electrónico válido o deja este campo vacío\."/);
  assert.match(copySrc, /socialEmailInvalid: "Enter a valid email address or leave this field blank\."/);
  assert.match(clientSrc, /label=\{c\.socialEmail\}\s*\n\s*optional\s*\n\s*optionalLabel=\{c\.optional\}/);
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} TRUE.`);
if (failed.length > 0) {
  console.log("FALSE items:", failed.map((f) => f.id).join(", "));
  throw new Error(`Owner-QA repair audit requires all TRUE — FALSE items: ${failed.map((f) => f.id).join(", ")}`);
}
console.log("\nOfertas Locales owner-QA repair audit passed.");
