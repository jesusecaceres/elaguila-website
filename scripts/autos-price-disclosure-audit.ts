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

const auditPath = "app/lib/clasificados/autos/AUTOS_PRICE_DISCLOSURE_AUDIT.md";
assert(exists(auditPath), "AUTOS price disclosure audit file exists");

const audit = read(auditPath);
for (const term of [
  "$24.99 / 30",
  "$399",
  "Privado",
  "Negocios",
  "before app start",
  "no Stripe wiring",
  "no promo code wiring",
  "no fake paid status",
  "no fake placement",
  "account plan not used",
  "mobile/PWA",
  "Mobile / PWA",
]) {
  assert(audit.toLowerCase().includes(term.toLowerCase()), `audit mentions ${term}`);
}

const pricingCopy = read("app/lib/clasificados/autos/autosPricingCopy.ts");
assert(pricingCopy.includes("24.99"), "autosPricingCopy includes Privado price");
assert(pricingCopy.includes("399"), "autosPricingCopy includes Negocios price");
assert(!pricingCopy.includes("membership_tier"), "autosPricingCopy does not use account plan keys");

const branchClient = read("app/(site)/publicar/autos/PublicarAutosBranchClient.tsx");
assert(branchClient.includes("AutosPricingBadge"), "branch selection shows pricing badge");

const crossNav = read("app/(site)/clasificados/autos/components/public/AutosLaneCrossNav.tsx");
assert(crossNav.includes("getAutosLandingPublishCardCopy"), "landing cross-nav uses pricing copy");

const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
const negociosApp = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
assert(privadoApp.includes("AutosPricingPlanBanner"), "Privado application shows plan reminder");
assert(negociosApp.includes("AutosPricingPlanBanner"), "Negocios application shows plan reminder");

const confirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
assert(confirm.includes("getAutosConfirmPlanSummaryCopy"), "confirm page shows plan summary");

const changedFiles = git("git status --short")
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, "/").replace(/^(?:A|M|D|R|C|U|\?\?)\s+/, ""))
  .filter(Boolean);

const preExistingUnrelatedParallelWork = new Set([
  "docs/stripe-revenue-os-live-supabase-proof-01.md",
  "scripts/verify-stripe-revenue-os-live-supabase-proof-01.mjs",
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
  "scripts/verify-ofertas-step5-global-address-review-workspace.mjs",
  "scripts/autos-final-pre-qa-smoke-proof-audit.ts",
  "scripts/autos-landing-results-cross-nav-audit.ts",
  "scripts/autos-application-war-room-audit.ts",
  "scripts/autos-final-war-room-closeout-audit.ts",
]);

const lockedCtaFiles = new Set([
  "app/components/cta/CtaActionSheet.tsx",
  "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
]);

const protectedCategoryPrefixes = [
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/clasificados/clases/",
  "app/(site)/clasificados/comunidad/",
  "app/(site)/clasificados/mascotas",
  "app/(site)/clasificados/busco/",
  "app/(site)/clasificados/viajes/",
  "supabase/",
];

const stripeGlobalPatterns = [
  "app/lib/stripe/",
  "app/api/stripe/",
  "app/admin/",
  "scripts/stripe",
];

const allowedExact = new Set([
  "package.json",
  auditPath,
  "scripts/autos-price-disclosure-audit.ts",
  "app/lib/clasificados/autos/autosPricingCopy.ts",
  "app/(site)/publicar/autos/autosBranchCopy.ts",
  "app/(site)/publicar/autos/PublicarAutosBranchClient.tsx",
  "app/(site)/publicar/autos/shared/components/AutosPricingBadge.tsx",
  "app/(site)/publicar/autos/shared/components/AutosPricingPlanBanner.tsx",
  "app/(site)/publicar/autos/shared/components/AutosPublishApplicationHeader.tsx",
  "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx",
  "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx",
  "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx",
  "app/(site)/clasificados/autos/components/public/AutosLaneCrossNav.tsx",
  "app/(site)/clasificados/autos/landing/AutosLandingPage.tsx",
  "app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx",
]);

const allowedPrefixes = [
  "app/(site)/publicar/autos/",
  "app/(site)/clasificados/autos/",
  "app/lib/clasificados/autos/",
];

const gateChangedFiles = changedFiles.filter((f) => !preExistingUnrelatedParallelWork.has(f));

for (const file of gateChangedFiles) {
  const allowed = allowedExact.has(file) || allowedPrefixes.some((prefix) => file.startsWith(prefix));
  assert(allowed, `modified file outside Autos price disclosure scope: ${file}`);
  assert(!lockedCtaFiles.has(file), `locked CTA file modified: ${file}`);
  assert(!protectedCategoryPrefixes.some((prefix) => file.startsWith(prefix)), `protected category file modified: ${file}`);
  assert(!stripeGlobalPatterns.some((prefix) => file.startsWith(prefix)), `Stripe/global config file modified: ${file}`);
  assert(!/migrations/i.test(file), `migration file modified: ${file}`);
}

const pkg = read("package.json");
assert(pkg.includes('"autos:price-disclosure-audit"'), "package.json registers autos:price-disclosure-audit");

const diff = git("git diff -U0");
const addedLines = diff
  .split(/\r?\n/)
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .filter((line) => !line.includes("autos-price-disclosure-audit.ts"))
  .filter((line) => !line.includes("AUTOS_PRICE_DISCLOSURE_AUDIT.md"));

for (const term of ["Cifras de ejemplo", "Sample figures", "fake analytics", "demo metrics"]) {
  assert(!addedLines.some((line) => line.includes(term)), `prohibited fake metric string added: ${term}`);
}

const staged = git("git diff --cached --name-only").trim();
assert(!staged, "no staged files");

if (failures.length) {
  console.error("AUTOS PRICE DISCLOSURE audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AUTOS PRICE DISCLOSURE audit passed");
