#!/usr/bin/env node
/**
 * EMPLEOS-REVENUE-OS-PAID-PUBLISH-CHECKPOINT-01 smoke — source-level, no Stripe/Supabase mutation.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

function fail(msg) {
  console.error(`smoke-revenue-os-empleos-paid-publish-checkpoint-01: FAIL — ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`OK: ${msg}`);
}

const quick = read("app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx");
const premium = read("app/(site)/clasificados/empleos/premium-preview/EmpleoPremiumPreviewClient.tsx");
const feria = read("app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx");
const helper = read("app/(site)/clasificados/empleos/preview/shared/empleosPreviewPaidCheckout.ts");
const fulfillment = read("app/lib/listingPlans/revenueEmpleosFulfillment.ts");

for (const [lane, src] of [
  ["quick", quick],
  ["premium", premium],
]) {
  if (!src.includes("PublishCheckoutCheckpoint")) fail(`${lane}: checkpoint not mounted`);
  if (!src.includes('fromPublicar && draft')) fail(`${lane}: must gate publish-flow draft`);
  if (!src.includes("empleosPreviewCheckpointConfig")) fail(`${lane}: missing checkpoint config`);
}
ok("paid preview checkpoints mounted for hard-refresh draft path");

if (feria.includes("PublishCheckoutCheckpoint")) fail("feria must not mount paid checkpoint");
ok("feria preview free of paid checkpoint");

if (!helper.includes("EMPLEOS_CHECKPOINT_CONFIRMATIONS")) fail("helper missing confirmations");
if (!helper.includes("empleos_job_post_paid") && !helper.includes("EMPLEOS_JOB_POST_PAID_PACKAGE_KEY")) {
  fail("helper must use paid package key");
}
if (helper.includes("addOn") && helper.match(/addOns?\s*:/)) fail("helper must not wire addOns");
ok("shared paid checkout helper");

if (!fulfillment.includes('EMPLEOS_PENDING_CHECKOUT_STATUS = "draft"')) {
  fail("fulfillment must activate from draft");
}
if (!fulfillment.includes('lifecycle_status: nextLifecycle') && !fulfillment.includes("lifecycle_status:")) {
  fail("fulfillment must update lifecycle_status");
}
ok("webhook fulfillment activates draft → published");

console.log("smoke-revenue-os-empleos-paid-publish-checkpoint-01: PASS");
