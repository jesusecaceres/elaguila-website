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

const auditPath = "app/lib/clasificados/autos/AUTOS_APPLICATION_WAR_ROOM_AUDIT.md";
assert(exists(auditPath), "final audit file exists");

const audit = exists(auditPath) ? read(auditPath) : "";
assert(audit.includes("| Requirement | TRUE/FALSE/UNKNOWN | Evidence |"), "TRUE/FALSE/UNKNOWN table exists");

for (const term of [
  "Privado",
  "Negocios",
  "price",
  "mileage",
  "phone",
  "location",
  "images",
  "video URLs",
  "preview",
  "public detail",
  "results",
  "dashboard",
  "admin",
  "analytics",
  "Like",
  "Share",
  "CTA",
  "Leonix",
  "READY TO COMMIT AND PUSH",
]) {
  assert(audit.toLowerCase().includes(term.toLowerCase()), `audit mentions ${term}`);
}

const diffFiles = git("git status --short")
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, "/").replace(/^(?:A|M|D|R|C|U|\?\?)\s+/, ""))
  .filter(Boolean);

const preExistingUnrelatedParallelWork = new Set([
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
  "app/lib/clasificados/EMPLEOS_TWO_PATH_REROUTE_PREVIEW_AUDIT.md",
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
  "scripts/autos-final-pre-qa-smoke-proof-audit.ts",
  "scripts/autos-landing-results-cross-nav-audit.ts",
  "scripts/autos-working-category-publish-pattern-rescue-audit.ts",
  "app/lib/clasificados/autos/AUTOS_WORKING_CATEGORY_PUBLISH_PATTERN_RESCUE_AUDIT.md",
  "app/lib/clasificados/autos/autosPublishApiContract.ts",
]);

const lockedCtaFiles = new Set([
  "app/components/cta/CtaActionSheet.tsx",
  "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
]);

const allowedExact = new Set([
  "package.json",
  auditPath,
  "app/lib/clasificados/autos/AUTOS_PRIVADO_FINAL_SURGICAL_LAUNCH_AUDIT.md",
  "app/lib/clasificados/autos/AUTOS_LANDING_RESULTS_CROSS_NAV_SPLIT_AUDIT.md",
  "scripts/autos-application-war-room-audit.ts",
  "scripts/autos-final-war-room-closeout-audit.ts",
  "scripts/autos-landing-results-cross-nav-audit.ts",
  "scripts/autos-final-pre-qa-smoke-proof-audit.ts",
  "playwright.autos-runtime.config.mjs",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx",
]);

const allowedPrefixes = [
  "app/(site)/publicar/autos/",
  "app/(site)/clasificados/autos/",
  "app/lib/clasificados/autos/",
  "app/api/clasificados/autos/",
  "e2e/autos/",
];

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
  "app/(site)/clasificados/coupons/",
  "app/(site)/noticias/",
  "app/(site)/magazine/",
];

for (const file of diffFiles) {
  if (preExistingUnrelatedParallelWork.has(file)) continue;
  const allowed = allowedExact.has(file) || allowedPrefixes.some((prefix) => file.startsWith(prefix));
  assert(allowed, `modified file outside Autos scope: ${file}`);
  assert(!lockedCtaFiles.has(file), `locked CTA file modified: ${file}`);
  assert(!protectedCategoryPrefixes.some((prefix) => file.startsWith(prefix)), `protected category file modified: ${file}`);
  assert(!file.startsWith("supabase/"), `Supabase schema/migration file modified: ${file}`);
  assert(!/stripe|payment-global|payment\/|migrations/i.test(file), `Stripe/payment/schema-looking file modified: ${file}`);
}

const diff = git("git diff -U0");
const addedProductLines = diff
  .split(/\r?\n/)
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .filter((line) => !line.includes("autos-application-war-room-audit.ts"))
  .filter((line) => !line.includes("AUTOS_APPLICATION_WAR_ROOM_AUDIT.md"));

for (const term of ["Cifras de ejemplo", "Sample figures", "fake analytics", "demo metrics"]) {
  assert(!addedProductLines.some((line) => line.includes(term)), `prohibited fake metric string added: ${term}`);
}

if (failures.length) {
  console.error("AUTOS APPLICATION WAR ROOM audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AUTOS APPLICATION WAR ROOM audit passed");
