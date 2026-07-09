/**
 * Verifier — Ofertas Preview Header Acceptance Patch.
 * Run: npm run verify:ofertas-preview-header-acceptance
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "app/lib/ofertas-locales/OFERTAS_PREVIEW_HEADER_ACCEPTANCE_AUDIT.md");
const previewCardPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx"
);
const applicationClientPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx"
);
const applicationCopyPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts"
);
const previewCopyPath = path.join(
  root,
  "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts"
);

const GATE_ALLOWED_PREFIXES = [
  "app/(site)/publicar/ofertas-locales/",
  "app/lib/ofertas-locales/ofertasLocalesTypes.ts",
  "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts",
  "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts",
  "app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts",
  "app/lib/ofertas-locales/ofertasLocalesClientUploadValidation.ts",
  "app/lib/ofertas-locales/ofertasLocalesStoragePaths.ts",
  "app/lib/ofertas-locales/OFERTAS_PREVIEW_HEADER_ACCEPTANCE_AUDIT.md",
  "app/api/ofertas-locales/assets/",
  "scripts/verify-ofertas-preview-header-acceptance.mjs",
  "package.json",
];

const FORBIDDEN_TOUCH = [
  "app/lib/ofertas-locales/ofertasLocalesScanCropGenerator.ts",
  "app/lib/ofertas-locales/ofertasLocalesGeminiScanPipeline.ts",
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesFlyerViewerModal.tsx",
];

const FAKE_STRINGS = ["wallet", "add to cart", "checkout", "claimed", "redeemed", "scan to redeem", "save coupon"];

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

if (!existsSync(auditPath)) {
  fail("audit file exists");
} else {
  pass("audit file exists");
  const audit = readFileSync(auditPath, "utf8");
  requireText("task classification", audit, "SCOPED GATED BUILD");
  requireText("logo upload", audit, "assetKind: logo");
}

const previewCard = readFileSync(previewCardPath, "utf8");
requireText("larger logo sizing", previewCard, "LOGO_SIZE");
requireText("logo lg 132px marker", previewCard, "lg:h-[132px]");
requireText("valid date badge", previewCard, "VALID_BADGE");
requireText("valid badge copy key", previewCard, "validBadgeEs");
requireText("store identity label", previewCard, "headerStoreLabelEs");
requireText("compact membership in CTA row", previewCard, "membershipSignUpShortEs");

if (previewCard.includes("membershipCopyEs") || previewCard.includes("membershipCopyEn")) {
  fail("preview card still contains old full-width membership copy strip");
} else {
  pass("long membership strip copy removed from preview card");
}

if (
  previewCard.includes("sm:flex sm:items-center sm:gap-3") &&
  previewCard.includes("membershipTitleEs")
) {
  fail("preview card still contains old full-width membership strip layout");
} else {
  pass("old membership strip layout removed");
}

const applicationClient = readFileSync(applicationClientPath, "utf8");
requireText("logo file upload handler", applicationClient, 'assetKind: "logo"');
requireText("logo upload input", applicationClient, 'type="file"');

const applicationCopy = readFileSync(applicationCopyPath, "utf8");
requireText("ES logo upload helper", applicationCopy, "Puedes pegar un enlace o subir el logo del negocio");
requireText("EN logo upload helper", applicationCopy, "You can paste a link or upload the business logo");

const previewCopy = readFileSync(previewCopyPath, "utf8");
requireText("valid badge ES", previewCopy, "VÁLIDO");
requireText("valid badge EN", previewCopy, "VALID");

for (const fake of FAKE_STRINGS) {
  if (previewCard.toLowerCase().includes(fake.toLowerCase())) {
    fail(`fake commerce string in preview card: ${fake}`);
  } else {
    pass(`no fake string in preview card: ${fake}`);
  }
}

let changed = [];
try {
  changed = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean);
} catch {
  changed = [];
}

let untracked = [];
try {
  untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean);
} catch {
  untracked = [];
}

const allChanged = [...new Set([...changed, ...untracked])].filter((f) => !f.startsWith(".next/"));

const gateTouched = allChanged.filter((file) =>
  GATE_ALLOWED_PREFIXES.some((prefix) => file === prefix || file.startsWith(prefix))
);

const forbiddenTouched = allChanged.filter((file) =>
  FORBIDDEN_TOUCH.some((prefix) => file === prefix || file.startsWith(prefix))
);

if (forbiddenTouched.length) {
  fail(`forbidden files touched: ${forbiddenTouched.join(", ")}`);
} else {
  pass("no scan/crop engine or flyer overlay files changed");
}

const unrelated = allChanged.filter(
  (file) => !gateTouched.includes(file) && !forbiddenTouched.includes(file)
);
if (unrelated.length) {
  console.log(`NOTE: unrelated dirty files present (not failing): ${unrelated.length} files`);
} else {
  pass("no unrelated dirty files");
}

if (gateTouched.length === 0) {
  fail("expected gate files to be modified or added");
} else {
  pass(`gate files touched: ${gateTouched.length}`);
}

if (process.exitCode) {
  console.error("\nverify:ofertas-preview-header-acceptance FAILED");
} else {
  console.log("\nverify:ofertas-preview-header-acceptance PASSED");
}
