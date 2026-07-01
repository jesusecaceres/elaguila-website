import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function exists(path: string): boolean {
  return existsSync(join(root, path));
}

function git(command: string): string {
  return execSync(command, { cwd: root, encoding: "utf8" });
}

const auditPath = "app/lib/clasificados/autos/AUTOS_FINAL_PRE_QA_SMOKE_PROOF_AUDIT.md";
assert(exists(auditPath), "final pre-QA smoke proof audit file exists");

const audit = exists(auditPath) ? read(auditPath) : "";
for (const term of [
  "What We Have vs What Is Left",
  "Privado",
  "Negocios",
  "AutosPublishConfirmCore",
  "Required tables/columns audited",
  "SQL REQUIRED",
  "RLS/auth",
  "Storage/media",
  "Stripe intentionally not wired",
  "Promo codes intentionally not wired",
  "stuck confirm root cause",
  "Missing draft",
  "API failure",
  "Auth/session",
  "persistWarnings",
  "URL-video-only",
  "No Mux/local video",
  "Success page",
  "Leonix ID",
  "Internal UUID",
  "Public / Results / Dashboard / Admin",
  "Analytics Truth",
  "Visible CTAs work or are hidden",
  "Fake dashboard metrics absent",
  "Payment deferred/no-Stripe",
  "READY TO COMMIT AND PUSH",
]) {
  assert(audit.toLowerCase().includes(term.toLowerCase()), `audit mentions ${term}`);
}

const changedFiles = git("git status --short")
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, "/").replace(/^(?:A|M|D|R|C|U|\?\?)\s+/, ""))
  .filter(Boolean);

const preExistingUnrelatedParallelWork = new Set([
  "app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx",
  "app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx",
  "app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsChrome.tsx",
  "app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsHeader.tsx",
  "app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta.tsx",
  "app/(site)/clasificados/empleos/components/EmpleosResultsView.tsx",
  "app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx",
  "app/(site)/clasificados/page.tsx",
  "app/(site)/clasificados/rentas/results/RentasResultsClient.tsx",
  "app/(site)/clasificados/restaurantes/resultados/RestaurantesResultsShell.tsx",
  "app/(site)/clasificados/servicios/ServiciosResultsPageShell.tsx",
  "app/(site)/clasificados/viajes/components/ViajesResultsShell.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx",
  "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx",
  "app/components/leonix/coming-soon-v2/ComingSoonLaunchSignupForm.tsx",
  "app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx",
  "app/lib/ofertas-locales/OFERTAS_STEP5_GLOBAL_ADDRESS_REVIEW_WORKSPACE_AUDIT.md",
  "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts",
  "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts",
  "app/lib/ofertas-locales/ofertasLocalesFormatting.ts",
  "app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts",
  "app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter.ts",
  "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts",
  "app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts",
  "app/lib/ofertas-locales/ofertasLocalesTypes.ts",
  "app/lib/ofertas-locales/ofertasLocalesValidation.ts",
  "app/lib/ofertas-locales/ofertasLocalesWizardSteps.ts",
  "docs/site-translation-word-by-word-smoke.md",
  "docs/translation-finish-backlog.md",
  "docs/stripe-revenue-os-live-supabase-proof-01.md",
  "scripts/verify-ofertas-step5-global-address-review-workspace.mjs",
  "scripts/verify-stripe-revenue-os-live-supabase-proof-01.mjs",
  "scripts/autos-price-disclosure-audit.ts",
  "app/lib/clasificados/autos/AUTOS_PRICE_DISCLOSURE_AUDIT.md",
  "app/lib/clasificados/autos/autosPricingCopy.ts",
  "app/(site)/clasificados/autos/components/public/AutosLaneCrossNav.tsx",
  "app/(site)/clasificados/autos/landing/AutosLandingPage.tsx",
  "app/(site)/publicar/autos/PublicarAutosBranchClient.tsx",
  "app/(site)/publicar/autos/autosBranchCopy.ts",
  "app/(site)/publicar/autos/shared/components/AutosPublishApplicationHeader.tsx",
  "app/(site)/publicar/autos/shared/components/AutosPricingBadge.tsx",
  "app/(site)/publicar/autos/shared/components/AutosPricingPlanBanner.tsx",
  "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx",
  "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx",
  "scripts/autos-working-category-publish-pattern-rescue-audit.ts",
  "app/lib/clasificados/autos/AUTOS_WORKING_CATEGORY_PUBLISH_PATTERN_RESCUE_AUDIT.md",
  "app/lib/clasificados/autos/autosPublishApiContract.ts",
  "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
  "app/lib/clasificados/autos/autosListingPayloadPersistence.ts",
  "app/api/clasificados/autos/listings/route.ts",
  "app/api/clasificados/autos/listings/[id]/route.ts",
  "app/api/clasificados/autos/checkout/route.ts",
  "app/api/clasificados/autos/publish-options/route.ts",
  "app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare.ts",
]);

const allowedExact = new Set([
  "package.json",
  auditPath,
  "scripts/autos-final-pre-qa-smoke-proof-audit.ts",
  "scripts/autos-application-war-room-audit.ts",
  "scripts/autos-final-war-room-closeout-audit.ts",
  "scripts/autos-landing-results-cross-nav-audit.ts",
  "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx",
  "app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts",
  "app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts",
  "app/(site)/clasificados/autos/pago/exito/AutosPagoExitoClient.tsx",
  "app/api/clasificados/autos/listings/[id]/route.ts",
]);

const allowedPrefixes = [
  "app/(site)/publicar/autos/negocios/confirm/",
  "app/(site)/publicar/autos/negocios/components/",
  "app/(site)/publicar/autos/negocios/hooks/",
  "app/(site)/publicar/autos/privado/confirm/",
  "app/(site)/publicar/autos/privado/components/",
  "app/(site)/publicar/autos/privado/hooks/",
  "app/(site)/clasificados/autos/pago/exito/",
  "app/api/clasificados/autos/listings/",
  "app/api/clasificados/autos/public/",
  "app/lib/clasificados/autos/",
];

const lockedFiles = new Set([
  "app/components/cta/CtaActionSheet.tsx",
  "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
]);

const protectedPrefixes = [
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/clases/",
  "app/(site)/clasificados/comunidad/",
  "app/(site)/clasificados/mascotas",
  "app/(site)/clasificados/busco/",
  "app/(site)/clasificados/viajes/",
  "supabase/",
];

const stripeOrPromoPattern = /(^|\/)(stripe|promo|coupon|coupons|webhook|payment-plan|revenue)(\/|\.|$)/i;

for (const file of changedFiles) {
  if (preExistingUnrelatedParallelWork.has(file)) continue;
  const allowed = allowedExact.has(file) || allowedPrefixes.some((prefix) => file.startsWith(prefix));
  assert(allowed, `modified file outside Autos pre-QA smoke scope: ${file}`);
  assert(!lockedFiles.has(file), `locked CTA file modified: ${file}`);
  assert(!protectedPrefixes.some((prefix) => file.startsWith(prefix)), `protected category/schema file modified: ${file}`);
  assert(!/migration/i.test(file), `schema/migration file modified: ${file}`);
  assert(!stripeOrPromoPattern.test(file), `Stripe/promo/global payment file modified: ${file}`);
}

const confirmCore = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
const privadoHook = read("app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts");
const negociosHook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
const successClient = read("app/(site)/clasificados/autos/pago/exito/AutosPagoExitoClient.tsx");
const ownerApi = read("app/api/clasificados/autos/listings/[id]/route.ts");

assert(confirmCore.includes("AUTOS_CONFIRM_PREPARE_TIMEOUT_MS"), "confirm core has no-hang timeout");
assert(confirmCore.includes("hasConfirmableAutosDraft"), "confirm core detects missing draft");
assert(confirmCore.includes("fetchAutosConfirm"), "confirm core wraps fetches with timeout");
assert(confirmCore.includes("No pudimos preparar tu anuncio"), "confirm core has Spanish actionable error");
assert(privadoHook.includes("bootstrap().catch"), "Privado hook catches hydration failures");
assert(negociosHook.includes("bootstrap().catch"), "Negocios hook catches hydration failures");
assert(successClient.includes("AUTOS_SUCCESS_VERIFY_TIMEOUT_MS"), "success page has verify timeout");
assert(successClient.includes("leonixAdId"), "success page tracks Leonix ID");
assert(ownerApi.includes("leonix_ad_id"), "owner API returns Leonix ID");

const diff = git("git diff -U0");
const addedLines = diff
  .split(/\r?\n/)
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .filter((line) => !line.includes("AUTOS_FINAL_PRE_QA_SMOKE_PROOF_AUDIT.md"))
  .filter((line) => !line.includes("autos-final-pre-qa-smoke-proof-audit.ts"));

for (const term of ["Cifras de ejemplo", "Sample figures", "fake analytics", "demo metrics"]) {
  assert(!addedLines.some((line) => line.includes(term)), `fake metric string added: ${term}`);
}

for (const term of ["uploaded to Mux", "hosted by Leonix", "processed by Leonix", "upload video", "promo code"]) {
  assert(!addedLines.some((line) => line.toLowerCase().includes(term.toLowerCase())), `forbidden Stripe/promo/video launch copy added: ${term}`);
}

if (failures.length) {
  console.error("AUTOS FINAL PRE-QA SMOKE PROOF audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AUTOS FINAL PRE-QA SMOKE PROOF audit passed");
