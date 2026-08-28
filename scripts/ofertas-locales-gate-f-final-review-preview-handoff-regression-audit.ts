/**
 * QA UX Batch — Gate F regression audit (⚠️39–41, ⚠️42–45, ⚠️47–50).
 *
 * Gate F simplifies Step 7 (Final Review) down to: readiness summary, 3
 * confirmations, an exact itemized blocker list, a single Preview CTA, a
 * price/package summary, and a demoted destructive start-over action. The
 * direct Step 7 payment link is removed; Preview becomes the final visual
 * inspection point and now owns the handoff into the EXISTING owner-dashboard
 * checkout (startRevenueCategoryCheckout) via a plain route Link — no new
 * Stripe/session logic anywhere in this gate.
 *
 * Run: npm run ofertas-locales:gate-f-final-review-preview-handoff-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";

function run() {
  const clientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "utf8"
  );
  const panelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "utf8"
  );
  const validationPanelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesValidationPanel.tsx",
    "utf8"
  );
  const previewClientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx",
    "utf8"
  );
  const previewCardSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx",
    "utf8"
  );
  const dashboardSrc = fs.readFileSync("app/(site)/dashboard/ofertas-locales/[id]/page.tsx", "utf8");
  const publishMapperSrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts", "utf8");
  const workspaceSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx",
    "utf8"
  );
  const taxonomySrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts", "utf8");
  const useDraftSrc = fs.readFileSync("app/lib/ofertas-locales/useOfertasLocalesDraft.ts", "utf8");

  // --- Case A: Step 7 shows only 3 confirmation controls ---
  const step7ConfirmCheckboxes = [...clientSrc.matchAll(/checked=\{step7Confirmations\.(\w+)\}/g)].map(
    (m) => m[1]
  );
  assert.deepEqual(
    step7ConfirmCheckboxes,
    ["businessFiles", "aiItems", "leonixRules"],
    "CASE A FAILED: Step 7 must render exactly 3 confirmation checkboxes (businessFiles, aiItems, leonixRules)"
  );
  console.log("Case A (Step 7 shows exactly 3 confirmation controls) passed.");

  // --- Case B: AI confirmation remains conditional for AI packages ---
  assert.match(
    clientSrc,
    /\{aiIncludedInPackage \? \(\s*<label[\s\S]{0,200}checked=\{step7Confirmations\.aiItems\}/,
    "CASE B FAILED: the AI confirmation checkbox must remain conditionally rendered only for AI-included packages"
  );
  console.log("Case B (AI confirmation remains conditional for AI packages) passed.");

  // --- Case C/D: preview CTA gated by, and visibly reflects, step7ConfirmationsComplete ---
  assert.match(
    clientSrc,
    /step7ConfirmationsComplete \?\s*\(\s*<Link href=\{previewHref\} className=\{`\$\{BTN_PRIMARY\} min-h-11`\}>/,
    "CASE C/D FAILED: the Preview CTA must render as an active BTN_PRIMARY Link exactly when step7ConfirmationsComplete is true"
  );
  assert.match(
    clientSrc,
    /className=\{cx\(BTN_PRIMARY, "min-h-11 cursor-not-allowed opacity-45"\)\}/,
    "CASE C/D FAILED: the disabled-look state must still use the same BTN_PRIMARY styling, just muted — not a different visual system"
  );
  console.log("Case C/D (Preview CTA gated by and visibly reflects readiness) passed.");

  // --- Case E: blocked preview exposes specific, state-driven reasons ---
  assert.match(
    clientSrc,
    /\{emailMalformed \? <li>· \{c\.step7BlockerEmail\}<\/li> : null\}/,
    "CASE E FAILED: email blocker must be driven by the existing emailMalformed state"
  );
  assert.match(
    clientSrc,
    /\{!step7Confirmations\.businessFiles \? <li>· \{c\.step7BlockerBusinessFiles\}<\/li> : null\}/,
    "CASE E FAILED: business/files blocker must be driven by the existing confirmation state"
  );
  assert.match(
    clientSrc,
    /\{aiIncludedInPackage && \(aiReviewGate\.needsReviewCount > 0 \|\| !step7Confirmations\.aiItems\) \? \(/,
    "CASE E FAILED: AI review blocker must be driven by existing aiReviewGate/confirmation state"
  );
  assert.match(
    clientSrc,
    /\{!step7Confirmations\.leonixRules \? <li>· \{c\.step7BlockerLeonixRules\}<\/li> : null\}/,
    "CASE E FAILED: Leonix rules blocker must be driven by the existing confirmation state"
  );
  // Only renders when something is actually missing.
  assert.match(
    clientSrc,
    /\{!step7ConfirmationsComplete \? \(\s*<ul className="space-y-1 text-xs font-medium text-amber-900">/,
    "CASE E FAILED: the blocker list must be hidden entirely once everything is ready"
  );
  console.log("Case E (blocked preview exposes exact, state-driven reasons) passed.");

  // --- Case F: validateOfertaLocalDraftForServerPublish receives ownerId ---
  assert.match(
    clientSrc,
    /validateOfertaLocalDraftForServerPublish\(draft, ownerId\)/,
    "CASE F FAILED: the server-publish validator must be called with the real ownerId"
  );
  assert.match(
    publishMapperSrc,
    /export function validateOfertaLocalDraftForServerPublish\(\s*draft: OfertaLocalDraft,\s*ownerId\?: string \| null\s*\)/,
    "sanity: validator signature must still accept ownerId as documented"
  );
  console.log("Case F (validateOfertaLocalDraftForServerPublish receives ownerId) passed.");

  // --- Case G: "Envío para revisión" no longer renders an empty meaningless card ---
  // The panel now shows the SAME array (serverPublishIssues) both to decide
  // publishFieldsReady and to render publishErrors — so publishFieldsReady=false
  // structurally guarantees at least one visible issue (never a blank card).
  assert.match(
    clientSrc,
    /<OfertasLocalesValidationPanel\s*\n\s*previewIssues=\{previewIssues\}\s*\n\s*publishIssues=\{serverPublishIssues\}/,
    "CASE G FAILED: the panel must receive the SAME ownerId-aware serverPublishIssues it uses for publishFieldsReady"
  );
  assert.match(
    validationPanelSrc,
    /\{publishFieldsReady \? \(\s*<p className="text-xs font-medium text-emerald-900">\{c\.publishReadyToContinue\}<\/p>/,
    "CASE G FAILED: the ready state must show a concise positive message, not the old long disclosure text"
  );
  assert.doesNotMatch(
    clientSrc,
    /checkoutParentRequired|continueSecureCheckout/,
    "CASE G FAILED: dead Step 7 checkout-gap copy must not remain referenced"
  );
  console.log('Case G ("Envío para revisión" no longer renders an empty meaningless card) passed.');

  // --- Case H: manual "Guardar borrador localmente" CTA is gone ---
  assert.doesNotMatch(
    clientSrc,
    /handleSaveDraft|c\.saveDraft\}/,
    "CASE H FAILED: the manual save-draft button/handler must be removed from Step 7"
  );
  console.log('Case H (manual "Guardar borrador localmente" CTA is gone) passed.');

  // --- Case I: autosave/persistence code is untouched ---
  assert.match(
    useDraftSrc,
    /saveOfertaLocalDraftToStorage\(draft\)/,
    "CASE I FAILED: the draft hook's autosave call must remain intact"
  );
  console.log("Case I (autosave/persistence code is untouched) passed.");

  // --- Case J: Step 7 direct payment CTA is removed ---
  assert.doesNotMatch(
    clientSrc,
    /\/dashboard\/ofertas-locales\//,
    "CASE J FAILED: Step 7 itself must no longer link directly to the owner dashboard/checkout"
  );
  console.log("Case J (Step 7 direct payment CTA is removed) passed.");

  // --- Case K: price/package summary remains on Step 7 ---
  assert.match(
    clientSrc,
    /<OfertasLocalesCommercialSummary draft=\{draft\} lang=\{lang\} \/>\s*\n\s*<p className="text-xs text-\[#1E1814\]\/55">\{c\.publishNotBuilt\}<\/p>/,
    "CASE K FAILED: the commercial summary + billing/term disclosure must remain on Step 7"
  );
  console.log("Case K (price/package summary remains) passed.");

  // --- Case L: Preview contains a continuation path to the existing dashboard workflow ---
  assert.match(
    previewCardSrc,
    /const dashboardHref = dashboardId\s*\n\s*\? `\/dashboard\/ofertas-locales\/\$\{encodeURIComponent\(dashboardId\)\}\?lang=\$\{resolvedRouteLang\}`\s*\n\s*: null;/,
    "CASE L FAILED: Preview must compute a route to the existing owner-dashboard listing page"
  );
  assert.match(
    previewCardSrc,
    /<Link href=\{dashboardHref\}[^>]*>\s*\{lang === "en" \? c\.continueToDashboardEn : c\.continueToDashboardEs\}/,
    "CASE L FAILED: Preview must render a Link using the dashboard continuation copy"
  );
  assert.match(
    previewClientSrc,
    /ofertaLocalId=\{aiSession\.ofertaLocalId\}/,
    "CASE L FAILED: the canonical id must be threaded from the preview client into the preview card"
  );
  console.log("Case L (Preview contains a continuation path to the existing dashboard workflow) passed.");

  // --- Case M: Preview does not create a new checkout session directly ---
  // Matches only an actual invocation (name immediately followed by "(") so
  // explanatory comments referencing the existing dashboard call by name
  // (proving it's NOT duplicated here) don't trip this check.
  assert.doesNotMatch(
    previewCardSrc,
    /startRevenueCategoryCheckout\(|redirectToRevenueCategoryCheckout\(/,
    "CASE M FAILED: Preview must never call checkout-session creation directly — it only routes to the dashboard"
  );
  assert.doesNotMatch(
    previewClientSrc,
    /startRevenueCategoryCheckout\(|redirectToRevenueCategoryCheckout\(/,
    "CASE M FAILED: the preview client must never call checkout-session creation directly"
  );
  console.log("Case M (Preview does not create a new checkout session directly) passed.");

  // --- Case N: startRevenueCategoryCheckout remains in the existing dashboard flow ---
  assert.match(
    dashboardSrc,
    /const result = await startRevenueCategoryCheckout\(\{/,
    "CASE N FAILED: the real checkout call must remain on the owner dashboard, unmoved"
  );
  console.log("Case N (startRevenueCategoryCheckout remains in the existing dashboard flow) passed.");

  // --- Case O: Stripe business logic is unchanged (dashboard handler untouched shape) ---
  assert.match(
    dashboardSrc,
    /async function handleCheckout\(\) \{\s*if \(!offer\?\.commercialProductKey \|\| !offer\.checkoutEligible\) return;/,
    "CASE O FAILED: handleCheckout's eligibility guard must remain exactly as before — no Stripe business-logic change"
  );
  console.log("Case O (Stripe business logic is unchanged) passed.");

  // --- Case P: start-over/reset behavior remains wired to the existing handler ---
  assert.match(
    clientSrc,
    /onClick=\{handleStartFresh\}/,
    "CASE P FAILED: the start-over button must remain wired to the existing handleStartFresh handler"
  );
  assert.match(
    clientSrc,
    /if \(!window\.confirm\(msg\)\) return;/,
    "CASE P FAILED: the existing confirm-before-destroy behavior must remain intact"
  );
  console.log("Case P (start-over/reset behavior remains wired to the existing handler) passed.");

  // --- Case Q: no scanner-protected path touched by this gate ---
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
    "app/(site)/publicar/ofertas-locales/OfertasLocalesValidationPanel.tsx",
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx",
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx",
    "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `CASE Q FAILED: Gate F touched a scanner-protected path: ${file}`);
  }
  console.log("Case Q (scanner protected paths untouched) passed.");

  // --- Case R: Gate A behavior remains (clear scan-refresh + review-nav copy) ---
  assert.match(panelSrc, /aiReviewPreviousItem/, "CASE R FAILED: Gate A product-nav labels must remain");
  console.log("Case R (Gate A behavior remains) passed.");

  // --- Case S: Gate B behavior remains (counters read the canonical scan collection) ---
  assert.match(
    panelSrc,
    /const scoped = isWorkspace \? summarizeScopedItemReviewCounts\(allCurrentScanItems\) : summary;/,
    "CASE S FAILED: Gate B's canonical-collection counter fix must remain"
  );
  console.log("Case S (Gate B behavior remains) passed.");

  // --- Case T: Gate C behavior remains (green page-complete CTA) ---
  assert.match(
    panelSrc,
    /const BTN_SUCCESS_LG =/,
    "CASE T FAILED: Gate C's green progression button style must remain"
  );
  console.log("Case T (Gate C behavior remains) passed.");

  // --- Case U: Gate D dedicated review workspace remains ---
  assert.match(
    clientSrc,
    /const \[step5ReviewView, setStep5ReviewView\] = useState<"files" \| "products">\("files"\);/,
    "CASE U FAILED: Gate D's Files/Products view-state toggle must remain"
  );
  assert.match(
    workspaceSrc,
    /xl:grid-cols-\[minmax\(0,54fr\)_minmax\(0,46fr\)\]/,
    "CASE U FAILED: Gate D's two-column workspace grid must remain"
  );
  console.log("Case U (Gate D dedicated review workspace remains) passed.");

  // --- Case V: Gate E bilingual taxonomy remains ---
  assert.match(
    taxonomySrc,
    /export function getOfertaProductBilingualCategoryDisplay\(/,
    "CASE V FAILED: Gate E's bilingual category display helper must remain"
  );
  console.log("Case V (Gate E bilingual taxonomy remains) passed.");

  // --- Case W: hard-refresh/review persistence contracts remain untouched ---
  assert.match(
    panelSrc,
    /fetchOfertaLocalReviewItems\(\s*ofertaLocalId,/,
    "CASE W FAILED: review items must still be recovered from the server-backed fetch path"
  );
  assert.doesNotMatch(
    clientSrc,
    /localStorage[\s\S]{0,80}step7Confirmations|step7Confirmations[\s\S]{0,80}localStorage/,
    "CASE W FAILED: step7 confirmations must remain ephemeral client state, not persisted — persistence lives only in the real draft/review data"
  );
  console.log("Case W (hard-refresh/review persistence contracts remain untouched) passed.");

  console.log("Ofertas Locales Gate F final review / preview handoff regression audit passed.");
}

run();
