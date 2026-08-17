/**
 * Package QA Cleanup 01 — Ofertas client journey contracts.
 * Run: node scripts/ofertas-qa-cleanup-01-audit.mjs
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel.replace(/\//g, path.sep)), "utf8");

const identity = read("app/lib/ofertas-locales/ofertasLocalesDraftIdentity.ts");
const persistence = read("app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts");
const hook = read("app/lib/ofertas-locales/useOfertasLocalesDraft.ts");
const empty = read("app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts");
const app = read("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const copy = read("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const scanPanel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx");
const workspace = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx");
const review = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");
const clip = read("app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx");
const commercial = read("app/(site)/publicar/ofertas-locales/OfertasLocalesCommercialSummary.tsx");
const previewCard = read("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx");
const previewClient = read("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx");
const previewCopy = read("app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts");
const shopping = read("app/lib/ofertas-locales/ofertasLocalesShoppingList.ts");
const publicSearch = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");

function resolveOfertaLocalDraftLoadDecision(input) {
  const intent = String(input.signals.intent ?? "").trim().toLowerCase();
  const fresh = String(input.signals.fresh ?? "").trim().toLowerCase();
  const step = String(input.signals.step ?? "").trim();
  const listingId = String(input.signals.listingId ?? "").trim();
  const reviewFlag = String(input.signals.review ?? "").trim();
  if (intent === "new" || fresh === "1" || fresh === "true") return "new";
  if (intent === "continue" || intent === "edit" || step || listingId || reviewFlag === "1" || reviewFlag === "true") {
    return "continue";
  }
  const active = String(input.activeSessionId ?? "").trim();
  const stored = String(input.storedSessionId ?? "").trim();
  const navigation = input.signals.navigation ?? "unknown";
  if (active && stored && active === stored && navigation !== "navigate") return "active";
  return "new";
}

assert.equal(
  resolveOfertaLocalDraftLoadDecision({
    signals: { intent: "new" },
    activeSessionId: "old",
    storedSessionId: "old",
  }),
  "new",
  "QA-001 fresh new application starts empty"
);
assert.equal(
  resolveOfertaLocalDraftLoadDecision({
    signals: { navigation: "reload" },
    activeSessionId: "s1",
    storedSessionId: "s1",
  }),
  "active",
  "QA-001 same active application survives refresh"
);
assert.equal(
  resolveOfertaLocalDraftLoadDecision({
    signals: { intent: "continue", step: "7" },
    activeSessionId: null,
    storedSessionId: "s1",
  }),
  "continue",
  "QA-001 continue/edit restores intended application"
);
assert.equal(
  resolveOfertaLocalDraftLoadDecision({
    signals: { navigation: "navigate" },
    activeSessionId: "s1",
    storedSessionId: "s1",
  }),
  "new",
  "QA-001 previous advertiser data cannot leak into new application"
);
assert.match(identity, /ofertaLocalDraftResetDoesNotTouchDatabase/);
assert.match(empty, /applicationSessionId/);
assert.match(hook, /resolveOfertaLocalDraftLoadDecision/);
assert.match(hook, /clearOfertaLocalDraftStorage/);
assert.doesNotMatch(hook, /from\(|supabase|delete\(/i);
assert.match(persistence, /clearOfertaLocalDraftStorage/);
assert.doesNotMatch(persistence, /\.from\(|delete from/i);

assert.match(scanPanel, /formatOfertaLocalPersistedScanProgress/);
assert.match(scanPanel, /aiScanSlowWait/);
assert.doesNotMatch(scanPanel, /fake ETA|estimated time remaining|%\s*complete|fake percent/i);
assert.match(copy, /Este volante tiene varias páginas/);
assert.match(copy, /This flyer has several pages/);

assert.match(workspace, /xl:grid-cols-\[minmax\(0,54fr\)_minmax\(0,46fr\)\]/);
assert.match(clip, /Source proof and clip inspector|Prueba de origen/);
assert.match(review, /aiReviewContinueToPage/);
assert.match(review, /aiReviewPageInstruction/);
assert.match(review, /onContinueToNextStep/);
assert.match(review, /pageIsLocked/);
assert.doesNotMatch(review, /xl:max-h-\[calc\(100vh-5.5rem\)\]/);

assert.match(copy, /¡Revisión completa!/);
assert.match(copy, /Review complete!/);
assert.match(copy, /Continuar al siguiente paso/);
assert.match(copy, /Continue to the next step/);
assert.match(app, /goToStep6/);
assert.match(app, /step5ContinueToNextStep/);
assert.match(app, /startOverDeleteCta/);

assert.match(commercial, /validateRevenuePromoForCheckout/);
assert.match(commercial, /ofertas-locales/);
assert.match(commercial, /ofertas_locales_flyer_30d|getOfertaLocalCommercialProductForDraft/);
assert.match(commercial, /39900|amountCents/);
assert.doesNotMatch(commercial, /0\.15 \*|percent \* |code\.includes/);
assert.match(app, /OfertasLocalesCommercialSummary/);
assert.match(copy, /IA incluida/);
assert.match(copy, /AI included/);
assert.match(read("app/lib/ofertas-locales/ofertasLocalesConstants.ts"), /OFERTAS_LOCALES_FLYER_PRICE_CENTS = 39900/);
assert.match(read("app/lib/ofertas-locales/ofertasLocalesConstants.ts"), /OFERTAS_LOCALES_COUPONS_PRICE_CENTS = 19900/);
assert.match(read("app/lib/ofertas-locales/ofertasLocalesCommercial.ts"), /OFERTAS_LOCALES_FLYER_PRICE_CENTS/);
assert.match(read("app/lib/ofertas-locales/ofertasLocalesCommercial.ts"), /OFERTAS_LOCALES_COUPONS_PRICE_CENTS/);
assert.match(commercial, /formatMoney\(baseCents\)/);

assert.match(previewCard, /intent: "continue"/);
assert.match(previewCard, /step: 7/);
assert.match(previewCard, /step: 5/);
assert.match(previewCard, /review: 1/);
assert.match(previewClient, /forceContinue: true/);
assert.match(previewCopy, /Enviar a Leonix para aprobación/);
assert.match(previewCopy, /Send to Leonix for approval/);
assert.match(previewCopy, /En revisión por Leonix/);
assert.match(previewCopy, /Under Leonix review/);
assert.match(previewCard, /publishSuccess \?/);
assert.doesNotMatch(previewCard, /Publish now|Publicar ahora/);
assert.doesNotMatch(app, /Publish now|Publicar ahora/);

assert.doesNotMatch(previewCard, /id="proximamente"/);
assert.doesNotMatch(previewCard, /futureModulesEs/);
assert.doesNotMatch(
  read("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesProductDetailDrawer.tsx"),
  /comingSoonListsRoutes/,
);
assert.match(shopping, /OFERTAS_LOCALES_SHOPPING_LIST_STORAGE_KEY/);
assert.match(publicSearch, /item.offerType === "weekly_flyer"/);
assert.match(publicSearch, /!isCupones && listOpen/);

assert.match(copy, /Código promocional/);
assert.match(copy, /Promo code/);
assert.match(copy, /Aplicar/);
assert.match(copy, /Quitar/);
assert.match(copy, /Remove/);

const changed = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .map((x) => x.trim().replace(/\\/g, "/"))
  .filter(Boolean);
const untracked = execSync("git ls-files --others --exclude-standard", { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .map((x) => x.trim().replace(/\\/g, "/"))
  .filter(Boolean);
const dirty = [...new Set([...changed, ...untracked])];
const allowed = [
  "app/(site)/publicar/ofertas-locales/",
  "app/lib/ofertas-locales/",
  "scripts/ofertas-",
  "scripts/verify-ofertas-",
  "docs/OFERTAS_",
  "e2e/ofertas-locales/",
];
const forbidden = dirty.filter((file) => !allowed.some((prefix) => file.startsWith(prefix)));
assert.deepEqual(forbidden, [], `Globalization-owned files unchanged, unexpected dirty: ${forbidden.join(", ")}`);

console.log("Ofertas QA cleanup 01 audit passed.");
