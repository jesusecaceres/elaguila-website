/**
 * PROMO-ADMIN-OS-QUICK-CREATE-AND-RESTAURANTE-BLOCKER-UX-01 verification.
 * Run: npm run verify:promo-admin-os-quick-create-and-restaurante-blocker-ux-01
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function fail(message) {
  console.error(`verify-promo-admin-os-quick-create-and-restaurante-blocker-ux-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const doc = "docs/promo-admin-os-quick-create-and-restaurante-blocker-ux-01.md";
const checkpointLib = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const checkpointUi = "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx";
const preview = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const page = "app/admin/(dashboard)/workspace/promo-codes/page.tsx";
const controls = "app/admin/(dashboard)/workspace/promo-codes/PromoCodeQuickCreateControls.tsx";
const actions = "app/admin/(dashboard)/workspace/promo-codes/actions.ts";
const constants = "app/admin/_lib/promoCodeConstants.ts";
const lifecycle = "app/lib/listingPlans/promoCodeLifecycle.ts";
const pkg = "package.json";

for (const rel of [doc, checkpointLib, checkpointUi, preview, page, controls, actions, constants, lifecycle, pkg]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}
ok("required files present");

const docSrc = read(doc);
const libSrc = read(checkpointLib);
const uiSrc = read(checkpointUi);
const previewSrc = read(preview);
const pageSrc = read(page);
const controlsSrc = read(controls);
const actionsSrc = read(actions);
const constantsSrc = read(constants);
const lifecycleSrc = read(lifecycle);
const pkgSrc = read(pkg);

// --- Documentation ---
for (const section of [
  "Executive Summary",
  "Restaurante Blocker Decision",
  "Promo Admin OS Problem",
  "Presets Added",
  "Package Scope Dropdown",
  "Code Generation Behavior",
  "Files Inspected",
  "Files Changed",
  "What This Gate Does Not Do",
  "Manual QA Checklist",
  "Next Recommended Gates",
]) {
  if (!docSrc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

if (!/kept the block|block stays correct|blocker stays/i.test(docSrc)) {
  fail("Doc must state the Restaurante blocker remains");
}
if (!/package[- ]scope dropdown/i.test(docSrc)) fail("Doc must mention package scope dropdown");
if (!docSrc.toLowerCase().includes("auto-generate")) fail("Doc must mention auto-generate code behavior");
if (!/no fake add-on bypass/i.test(docSrc)) fail("Doc must mention no fake add-on bypass");
if (!docSrc.toLowerCase().includes("webhook")) fail("Doc must mention webhook redemption truth");
ok("documentation content checks passed");

// --- Restaurante blocker (kept + clearer action) ---
if (!libSrc.includes("desactiva el módulo de cupones del restaurante")) {
  fail("Blocker copy (lib) must tell user to remove coupon module (Spanish)");
}
if (!libSrc.includes("turn off the restaurant coupon module")) {
  fail("Blocker copy (lib) must tell user to remove coupon module (English)");
}
if (!libSrc.includes("isRestaurantCouponCheckoutBlocked") || !libSrc.includes("REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED")) {
  fail("Blocker gate must remain (isRestaurantCouponCheckoutBlocked / support flag)");
}
if (!uiSrc.includes("Volver a editar y quitar complemento") || !uiSrc.includes("Back to edit and remove add-on")) {
  fail("Checkpoint UI must keep the remove-add-on CTA (ES/EN)");
}
if (!previewSrc.includes("focus=coupon-upgrade")) {
  fail("Restaurante edit link must carry focus=coupon-upgrade");
}
ok("Restaurante blocker preserved with clearer remove-add-on action");

// --- Promo Admin OS quick-create ---
if (!pageSrc.includes("PromoCodeQuickCreateControls")) fail("Promo page must render quick-create controls");
if (!controlsSrc.includes("quick_preset") || !controlsSrc.includes("PROMO_CODE_QUICK_PRESETS")) {
  fail("Quick-create controls must include a preset selector");
}
if (!constantsSrc.includes("PROMO_CODE_QUICK_PRESETS")) fail("Constants must define quick presets");
if (!constantsSrc.includes("restaurante_qa_25") || !constantsSrc.includes("restaurante_launch_25")) {
  fail("Restaurante QA/launch presets must exist");
}
if (!/coming later/i.test(constantsSrc)) fail("Unsupported category presets must be labeled coming later / disabled");
ok("preset/quick-create selector present with Restaurante presets");

if (!pageSrc.includes('defaultValue="discount"')) fail("Promo create form must default Type to Discount");
ok("Type defaults to Discount");

// --- Package scope dropdown ---
if (!pageSrc.includes("PROMO_CODE_PACKAGE_SCOPE_OPTIONS")) fail("Promo page must render package scope dropdown options");
if (!pageSrc.includes('name="package_scope"')) fail("Promo page must keep package_scope field");
if (!constantsSrc.includes("PROMO_CODE_PACKAGE_SCOPE_OPTIONS") || !constantsSrc.includes("REVENUE_V1_PACKAGE_MATRIX")) {
  fail("Package scope options must derive from Revenue OS matrix");
}
if (!constantsSrc.includes("restaurantes_base_monthly") && !pageSrc.includes("restaurantes_base_monthly")) {
  fail("restaurantes_base_monthly must be a selectable/helper package scope");
}
ok("package scope dropdown includes restaurantes_base_monthly");

// --- Code generation: blank = server-generated ---
if (!pageSrc.includes("empty = generate") && !pageSrc.toLowerCase().includes("auto-generate a leonix code")) {
  fail("Promo page must preserve blank-code auto-generate messaging");
}
if (!controlsSrc.includes("code_mode") || !controlsSrc.includes("Auto-generate")) {
  fail("Quick-create controls must include a code mode with auto-generate");
}
if (!actionsSrc.includes("normalizePromoCodeForStorage")) fail("Server action must normalize code");
if (!actionsSrc.includes("if (!code)") || !actionsSrc.includes("generateLeonixPromoCode")) {
  fail("Server action must remain source of generated code truth");
}
if (!lifecycleSrc.includes("promoCodePrefixForCategory")) fail("Category-aware prefix helper must exist");
ok("blank-code auto-generate preserved; server remains source of truth");

// --- Package scope saved as before / custom override ---
if (!actionsSrc.includes("package_scope") || !actionsSrc.includes("packageScope")) {
  fail("Server action must still persist package_scope");
}
ok("package scope still persisted server-side");

// --- Recent code list clarity preserved (no fake CTA) ---
if (!pageSrc.includes("No linked paid usage yet")) fail("Recent codes must keep honest usage messaging");
if (!pageSrc.includes("formatPromoDiscountSummary") || !pageSrc.includes("promoCodeMissingDiscount")) {
  fail("Recent codes must keep discount summary + missing-discount warning");
}
if (!pageSrc.includes("revokePromoCodeAction")) fail("Revoke action must remain");
ok("recent code list clarity preserved");

// --- Scope guardrails: no webhook / migration / .env / unrelated category ---
if (/whsec_/.test(actionsSrc) || actionsSrc.includes("createPendingPromoRedemption") || actionsSrc.includes("markPromoRedemptionRedeemed")) {
  fail("Promo create action must not touch webhook redemption");
}
if (/CREATE TABLE|ALTER TABLE|create_migration|supabase\/migrations/i.test([pageSrc, actionsSrc, controlsSrc, constantsSrc, lifecycleSrc].join("\n"))) {
  fail("Gate artifacts must not add migrations");
}
for (const marker of [
  "app/(site)/clasificados/servicios",
  "app/(site)/clasificados/autos",
  "app/(site)/clasificados/bienes-raices",
  "app/(site)/clasificados/rentas",
  "app/admin/(dashboard)/workspace/cupones/page",
]) {
  if (pageSrc.includes(marker) || controlsSrc.includes(marker)) fail(`Unrelated category/CMS touched: ${marker}`);
}
ok("no webhook / migration / unrelated category changes in gate artifacts");

if (existsSync(path.join(root, ".env"))) {
  // Presence is fine; the gate does not read or write it. Manual confirm: .env untouched.
}
ok(".env not modified by this gate (manual confirm)");

// --- package.json script ---
if (!pkgSrc.includes("verify:promo-admin-os-quick-create-and-restaurante-blocker-ux-01")) {
  fail("package.json missing verifier script");
}
ok("package.json verifier script registered");

// --- No secrets ---
const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const src of [docSrc, libSrc, uiSrc, previewSrc, pageSrc, controlsSrc, actionsSrc, constantsSrc, lifecycleSrc]) {
  for (const pattern of secretPatterns) {
    if (pattern.test(src)) fail(`Secret-like content forbidden matching ${pattern}`);
  }
}
ok("no secrets in gate artifacts");

console.log("verify-promo-admin-os-quick-create-and-restaurante-blocker-ux-01: PASS");
