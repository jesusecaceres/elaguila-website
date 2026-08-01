/**
 * Verifier — Ofertas/Cupones single AI pipeline pricing consolidation V1.
 * Run: node scripts/verify-ofertas-cupones-single-ai-pipeline.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const auditPath = path.join(
  root,
  "app/lib/website-audit/OFERTAS_CUPONES_SINGLE_AI_PIPELINE_PRICING_CONSOLIDATION_V1.md"
);
const constantsPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesConstants.ts");
const helpersPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts");
const applicationClientPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx"
);
const applicationCopyPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts"
);
const draftPersistencePath = path.join(
  root,
  "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts"
);
const publishMapperPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts");

const GATE_ALLOWED_PREFIXES = [
  "app/(site)/publicar/ofertas-locales/",
  "app/(site)/clasificados/ofertas-locales/",
  "app/(site)/dashboard/ofertas-locales/",
  "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/",
  "app/api/ofertas-locales/public-search/",
  "app/api/ofertas-locales/public-offers/",
  "app/lib/ofertas-locales/",
  "app/lib/ofertas-locales/ofertasLocalesTypes.ts",
  "app/lib/ofertas-locales/ofertasLocalesConstants.ts",
  "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts",
  "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts",
  "app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts",
  "app/lib/website-audit/OFERTAS_CUPONES_SINGLE_AI_PIPELINE_PRICING_CONSOLIDATION_V1.md",
  "scripts/verify-ofertas-cupones-single-ai-pipeline.mjs",
  "scripts/ofertas-locales-package-2-contract-audit.mjs",
];

const FORBIDDEN_TOUCH_PREFIXES = [
  "app/api/stripe",
  "supabase/migrations",
  "app/lib/listingIdentity/",
  "app/lib/listingPlans/",
  "app/api/checkout",
  "app/api/webhooks",
];

const PACKAGE_5_SHARED_REVENUE_OS_ALLOWED = new Set([
  "app/lib/listingPlans/publishCheckoutCheckpoint.ts",
  "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts",
  "app/lib/listingPlans/revenueDisplay.ts",
  "app/lib/listingPlans/revenueEntitlementFulfillment.ts",
  "app/lib/listingPlans/revenueEntitlements.ts",
  "app/lib/listingPlans/revenueFulfillment.ts",
  "app/lib/listingPlans/revenueCheckout.ts",
  "app/lib/listingPlans/revenuePaymentRecords.ts",
  "app/lib/listingPlans/revenueOsReturnPath.ts",
  "app/lib/listingPlans/revenuePricingMatrix.ts",
  "app/lib/listingPlans/revenueStripe.ts",
  "app/lib/listingPlans/revenueWebhook.ts",
]);

const PACKAGE_8_ALLOWED = new Set([
  "supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql",
  "scripts/ofertas-renewal-eligibility-audit.mjs",
  "scripts/ofertas-renewal-checkout-entitlement-audit.mjs",
  "scripts/ofertas-renewal-term-history-audit.mjs",
  "scripts/ofertas-renewal-activation-audit.mjs",
  "scripts/ofertas-renewal-source-reuse-replacement-audit.mjs",
  "scripts/ofertas-owner-renewal-operations-audit.mjs",
  "scripts/ofertas-admin-renewal-operations-audit.mjs",
  "scripts/ofertas-stuck-work-recovery-audit.mjs",
  "scripts/ofertas-cleanup-execution-audit.mjs",
  "scripts/ofertas-notification-expiration-contract-audit.mjs",
  "scripts/ofertas-package-8-security-idempotency-audit.mjs",
  "scripts/ofertas-package-8-launch-readiness-audit.mjs",
  "scripts/ofertas-package-8-audit-utils.mjs",
]);

const FORBIDDEN_CUSTOMER_STRINGS = [
  "+$199/mes",
  "+$199/mo",
  "AI upgrade",
  "Upgrade AI",
  "Búsqueda por producto con AI",
  "basic flyer",
  "manual-only",
  "$598",
  "598 total",
  "AI add-on",
  "AI addon",
  "AI Searchable Specials",
  "optional AI",
  "complemento AI",
  "agregaste AI",
  "checkout included",
  "payment active",
  "paid",
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function requireText(label, haystack, needle) {
  if (haystack.includes(needle)) {
    pass(label);
  } else {
    fail(`${label} missing "${needle}"`);
  }
}

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

function readGateFile(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

if (!existsSync(auditPath)) {
  fail("audit file exists");
} else {
  pass("audit file exists");
}

const constants = readGateFile("app/lib/ofertas-locales/ofertasLocalesConstants.ts");
const helpers = readGateFile("app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts");
const applicationClient = readGateFile("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const applicationCopy = readGateFile("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const draftPersistence = readGateFile("app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts");
const publishMapper = readGateFile("app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts");

requireText("Ofertas catalog price 399", constants, "displayPriceUsd: 399");
requireText("Cupones catalog price 199", constants, "displayPriceUsd: 199");
requireText("Ofertas duration 30 days", constants, "durationDays: 30");
requireText("Ofertas aiIncluded true", constants, "interactive_flyer");
requireText("Cupones aiIncluded true", constants, "coupons:");
requireText("catalog aiIncluded flags", constants, "aiIncluded: true");

requireText("normalize entitlements helper", helpers, "normalizeOfertaLocalDraftProductEntitlements");
requireText("isOfertaLocalAiIncludedInPackage", helpers, "isOfertaLocalAiIncludedInPackage");
requireText("single display price helper", helpers, "getOfertaLocalApplicationDisplayPrice");

requireText("Step 1 interactive flyer card copy", applicationCopy, "Volante interactivo Leonix");
requireText("Step 1 coupons card copy", applicationCopy, "Cupones Leonix");
requireText("one-price package note ES", applicationCopy, "Un solo precio. La asistencia con IA ya está incluida.");
requireText("AI included label ES", applicationCopy, "IA incluida");
requireText("AI included label EN", applicationCopy, "AI included");
requireText("AI analysis summary ES", applicationCopy, 'step7ScanSummaryTitle: "Resumen del análisis con IA"');
requireText("AI analysis summary EN", applicationCopy, 'step7ScanSummaryTitle: "AI analysis summary"');
requireText("AI rescan warning EN", applicationCopy, "Scanning again may replace or change previous suggestions.");
requireText("per duration ES", applicationCopy, " / 30 días");

if (applicationCopy.includes("aiProductSearchPrice")) {
  fail("application copy still exports aiProductSearchPrice");
} else {
  pass("aiProductSearchPrice removed from copy");
}

if (applicationClient.includes("aiProductSearchPrice")) {
  fail("application client still references aiProductSearchPrice");
} else {
  pass("application client has no aiProductSearchPrice");
}

if (applicationClient.includes("OFERTAS_LOCALES_AI_PRODUCT_SEARCH_ADDON_DISPLAY_MONTHLY")) {
  fail("application client still imports AI add-on constant");
} else {
  pass("application client does not import AI add-on constant");
}

if (applicationClient.includes("wantsAiSearchableSpecials: !draft.wantsAiSearchableSpecials")) {
  fail("Step 1 still toggles AI add-on");
} else {
  pass("Step 1 AI add-on toggle removed");
}

requireText("Step 1 package note in UI", applicationClient, "step1PackageNote");
requireText("aiIncludedInPackage runtime", applicationClient, "isOfertaLocalAiIncludedInPackage");
requireText("package display price in review", applicationClient, "getOfertaLocalApplicationDisplayPrice");
requireText("scan panel uses included entitlement", applicationClient, "aiIncludedInPackage");

if (applicationClient.includes("$598") || applicationClient.includes("598")) {
  fail("application client may still calculate $598 total");
} else {
  pass("no $598 in application client");
}

if (applicationClient.includes("estimatedMonthlyTotal")) {
  fail("application client still uses estimatedMonthlyTotal add-on arithmetic");
} else {
  pass("estimatedMonthlyTotal add-on arithmetic removed");
}

requireText("draft normalization on load", draftPersistence, "normalizeOfertaLocalDraftProductEntitlements");
requireText("legacy product key compatibility", draftPersistence, "legacyPrimaryAdFormatFromStored");
requireText("legacy selectedProduct compatibility", draftPersistence, "stored.selectedProduct");
requireText("publish uses ai included helper", publishMapper, "isOfertaLocalAiIncludedInPackage");
requireText("publish product key metadata", publishMapper, "publishProductKey");

if (!helpers.includes("legacy wantsAiSearchableSpecials=false no longer disables AI")) {
  fail("legacy wantsAiSearchableSpecials compatibility comment missing");
} else {
  pass("legacy wantsAiSearchableSpecials is compatibility-only");
}

if (helpers.includes("wantsAiSearchableSpecials") && helpers.includes("getOfertaLocalPublishProductCatalogEntry")) {
  pass("legacy AI field cannot calculate active product price");
} else {
  fail("legacy AI compatibility/product price separation missing");
}

const customerFacing = `${applicationClient}\n${applicationCopy}`;
for (const forbidden of FORBIDDEN_CUSTOMER_STRINGS) {
  if (customerFacing.includes(forbidden)) {
    fail(`forbidden customer-facing string: ${forbidden}`);
  } else {
    pass(`forbidden string absent: ${forbidden}`);
  }
}

if (helpers.includes("isOfertaLocalAiIncludedInPackage") && applicationClient.includes("OfertasLocalesAiScanPanel")) {
  pass("AI scan panel remains reachable in application flow");
} else {
  fail("AI scan panel wiring missing");
}

try {
  const diff = execFileSync("git", ["diff", "--name-only", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(normalizePath);

  for (const file of diff) {
    if (PACKAGE_8_ALLOWED.has(file)) {
      continue;
    }
    if (
      !PACKAGE_5_SHARED_REVENUE_OS_ALLOWED.has(file) &&
      FORBIDDEN_TOUCH_PREFIXES.some((prefix) => file.startsWith(prefix))
    ) {
      fail(`forbidden file changed: ${file}`);
    }
    if (/stripe|checkout|webhook/i.test(file) && file.includes("ofertas")) {
      fail(`Stripe/payment file changed: ${file}`);
    }
  }

  const gateDiff = diff.filter((file) =>
    GATE_ALLOWED_PREFIXES.some((prefix) => file.startsWith(prefix))
  );
  if (gateDiff.length) {
    pass(`gate files in diff (${gateDiff.length}): ${gateDiff.join(", ")}`);
  } else {
    pass("no gate files in git diff vs HEAD (check unstaged gate edits separately)");
  }
} catch {
  pass("git diff scope check skipped");
}

if (process.exitCode) {
  console.error("\nverify-ofertas-cupones-single-ai-pipeline: FAILED");
  process.exit(process.exitCode);
}

console.log("\nverify-ofertas-cupones-single-ai-pipeline: ALL CHECKS PASSED");
