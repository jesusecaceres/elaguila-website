/**
 * SERVICIOS-P0A-CHECKPOINT-VER-MAS-RULES-MODAL-PARITY verification.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-servicios-p0a-checkpoint-ver-mas-rules-modal-parity: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function gitDiffNameOnly() {
  try {
    return execFileSync("git", ["diff", "--name-only"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

const checkpointRel = "app/(site)/clasificados/publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx";
const applicationRel =
  "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const docRel = "docs/servicios-p0a-checkpoint-ver-mas-rules-modal-parity.md";
const pkg = read("package.json");

if (!existsSync(path.join(ROOT, checkpointRel))) fail("Servicios checkpoint client must exist");
if (!existsSync(path.join(ROOT, applicationRel))) fail("Servicios application must exist");
if (!existsSync(path.join(ROOT, docRel))) fail("P0A doc must exist");

const checkpoint = read(checkpointRel);
const application = read(applicationRel);
const doc = read(docRel);

for (const section of ["Gate title", "Manual QA", "CTA behavior audit", "What was protected"]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation present");

if (checkpoint.includes("<Link") && checkpoint.includes("<button") && checkpoint.match(/<Link[\s\S]*<button/)) {
  const linkBlocks = checkpoint.match(/<Link[^>]*>[\s\S]*?<\/Link>/g) ?? [];
  for (const block of linkBlocks) {
    if (block.includes("<button")) {
      fail("Checkpoint must not nest button inside Link");
    }
  }
}
// Zero-debt closeout 2026-09-12: this demanded the literal state-setter `setProductMoreOpen(true)`.
// The checkpoint now adopts the SHARED PaidPublishCheckpointCard/Modal pair (master doctrine §25 —
// do not build a category-local modal), so the setter is named differently. Assert the CONTRACT:
// the card's "more" action opens the shared paid-publish modal, and the modal is bound to it.
if (!checkpoint.includes("PaidPublishCheckpointModal")) {
  fail("Checkpoint must mount the shared PaidPublishCheckpointModal");
}
if (!/onMoreClick=\{\(\)\s*=>\s*set\w*Open\(true\)\}/.test(checkpoint)) {
  fail("Checkpoint Ver más must open the rules modal");
}
if (!/<PaidPublishCheckpointModal[\s\S]{0,200}open=\{\w*[Oo]pen\}/.test(checkpoint)) {
  fail("Checkpoint rules modal must be bound to the open state");
}
if (!/onClose=\{\(\)\s*=>\s*set\w*Open\(false\)\}/.test(checkpoint)) {
  fail("Checkpoint rules modal must be closeable");
}
// Zero-debt closeout 2026-09-12: the overlay/close/style assertions below used to read the
// Servicios checkpoint client. Those presentation tokens now live in the SHARED
// PublishEntryCheckpoint component that the Servicios checkpoint mounts, so asserting them on the
// Servicios file tested the wrong owner. Route identity stays asserted on the Servicios file.
const sharedCheckpoint = read("app/(site)/clasificados/publicar/_components/PublishEntryCheckpoint.tsx");
if (!sharedCheckpoint.includes("bg-black/50")) fail("Checkpoint modal overlay required");
if (!/onClose=\{\(\)\s*=>\s*set\w*Open\(false\)\}/.test(checkpoint)) fail("Checkpoint modal close required");
if (!checkpoint.includes("/publicar/servicios")) fail("Publicar servicio route must remain");
if (!checkpoint.includes("servicios_profesionales")) fail("product=servicios_profesionales must remain");
for (const token of ["bg-[#F6F0E2]", "max-w-lg", "rounded-2xl", "bg-[#FFFCF7]", "bg-black/50"]) {
  if (!sharedCheckpoint.includes(token)) fail(`Checkpoint missing style token: ${token}`);
}
ok("Servicios entry checkpoint Ver más + style parity");

if (!application.includes("Cupones y ofertas destacadas") && !application.includes("couponsFeaturedStepTitle")) {
  fail("Coupon step title must exist");
}
if (!application.includes("setCouponDetailOpen(true)")) fail("Coupon Ver más must open modal");
if (!application.includes("couponDetailOpen")) fail("Coupon modal state required");
// Zero-debt closeout 2026-09-12: this assertion REQUIRED the application to advertise a "+$99"
// coupon price. That is now ANTI-DOCTRINE, not merely stale — owner-locked commercial truth
// (ledger ⚠️26, ⚠️60, §14) is that coupons/offers are INCLUDED in the $399/mo Servicios base and
// that no stale +$99 coupon path may appear anywhere. Keeping it would have forced a retired price
// back into the product. Inverted to assert the CURRENT contract.
if (/\+\s*\$99/.test(application)) {
  fail("Servicios application must not advertise a +$99 coupon add-on (coupons are included in $399)");
}
if (!application.includes("baseMonthlyPrice: 399")) {
  fail("Servicios application must carry the $399/mo base truth");
}
if (!application.includes("couponsFeaturedStepTitle")) {
  fail("Servicios application must present the featured coupons/offers step");
}
if (!application.includes("datos rápidos") && !application.includes("quick details")) {
  fail("Coupon modal must distinguish coupons from quick highlights");
}
if (!application.includes("setCouponDetailOpen(true)") || application.includes("setCouponDetailOpen(true) && setState")) {
  // opening modal must not be bundled with couponsAddOn: true on same handler
}
const verMasHandler = application.slice(
  application.indexOf("setCouponDetailOpen(true)"),
  application.indexOf("setCouponDetailOpen(true)") + 200,
);
if (verMasHandler.includes("couponsAddOn: true")) {
  fail("Coupon Ver más must not activate add-on");
}
ok("Servicios in-application coupon Ver más");

if (!application.includes("Ver reglas de Leonix") && !application.includes("View Leonix rules")) {
  fail("Rules CTA must exist");
}
if (!application.includes("Reglas de publicación de Leonix") && !application.includes("Leonix publishing rules")) {
  fail("Rules modal title required");
}
if (!application.includes("leonixRulesOpen")) fail("Rules modal state required");
if (!application.includes("El pago no garantiza aprobación") && !application.includes("Payment does not guarantee approval")) {
  fail("Rules must include payment/approval bullet");
}
if (!application.includes("confirmListingAccurate")) fail("Confirmation checkboxes must remain");
ok("Leonix rules modal + confirmations preserved");

const disallowed = [
  "app/api/revenue-os/checkout",
  "app/api/revenue-os/webhook",
  "supabase/migrations",
  "app/(site)/clasificados/publicar/restaurantes",
];
const changed = gitDiffNameOnly()
  .split("\n")
  .map((f) => f.trim())
  .filter(Boolean);
for (const file of changed) {
  const norm = file.replace(/\\/g, "/");
  for (const bad of disallowed) {
    if (norm.includes(bad)) fail(`Disallowed file changed: ${norm}`);
  }
}
ok("no disallowed runtime files changed");

if (!pkg.includes("verify:servicios-p0a-checkpoint-ver-mas-rules-modal-parity")) {
  fail("package.json must include P0A verifier script");
}

console.log("verify-servicios-p0a-checkpoint-ver-mas-rules-modal-parity: PASS");
