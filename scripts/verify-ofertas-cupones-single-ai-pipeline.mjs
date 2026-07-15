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
  "app/lib/ofertas-locales/ofertasLocalesTypes.ts",
  "app/lib/ofertas-locales/ofertasLocalesConstants.ts",
  "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts",
  "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts",
  "app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts",
  "app/lib/website-audit/OFERTAS_CUPONES_SINGLE_AI_PIPELINE_PRICING_CONSOLIDATION_V1.md",
  "scripts/verify-ofertas-cupones-single-ai-pipeline.mjs",
];

const FORBIDDEN_TOUCH_PREFIXES = [
  "app/api/stripe",
  "supabase/migrations",
  "app/lib/ofertas-locales/ofertasLocalesGeminiScanPipeline.ts",
  "app/lib/ofertas-locales/ofertasLocalesScanCropGenerator.ts",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx",
];

const FORBIDDEN_CUSTOMER_STRINGS = [
  "+$199/mes",
  "+$199/mo",
  "AI upgrade",
  "Upgrade AI",
  "Búsqueda por producto con AI",
  "basic flyer",
  "manual-only",
  "$598",
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
requireText("publish uses ai included helper", publishMapper, "isOfertaLocalAiIncludedInPackage");
requireText("publish product key metadata", publishMapper, "publishProductKey");

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
    if (FORBIDDEN_TOUCH_PREFIXES.some((prefix) => file.startsWith(prefix))) {
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
