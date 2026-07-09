#!/usr/bin/env node
/**
 * ACTIVE-CATEGORIES-REVENUE-OS-CHECKPOINT-ACTIVATION-MATRIX-01 smoke.
 * Lightweight source-level checks — no Stripe, no live Supabase mutation.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

function fail(msg) {
  console.error(`smoke-active-categories-revenue-os-checkpoint-activation-matrix-01: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
const checkpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const serviciosPreview = read(
  "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
);
const bienesPreview = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
);
const autosConfirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
const empleosCheckout = read("app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts");
const rentasPreview = read(
  "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
);
const entryCheckpoints = read("app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts");
const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");

const priceChecks = [
  ["servicios_base_monthly", "39900"],
  ["servicios_offers_addon", "9900"],
  ["br_agent_monthly", "39900"],
  ["br_inventory_pack_monthly", "9900"],
  ["autos_dealer_monthly", "39900"],
  ["autos_dealer_inventory_pack_monthly", "12900"],
  ["autos_privado_30d", "2499"],
  ["empleos_job_post_paid", "2499"],
  ["rentas_30d", "2499"],
];

for (const [key, cents] of priceChecks) {
  if (!matrix.includes(key)) fail(`Matrix missing package: ${key}`);
  let slice = "";
  const literalAnchor = matrix.indexOf(`packageKey: "${key}"`);
  if (literalAnchor >= 0) {
    slice = matrix.slice(literalAnchor, literalAnchor + 400);
  } else {
    const constUse = matrix.indexOf(`packageKey: EMPLEOS_JOB_POST_PAID_PACKAGE_KEY`);
    const constUseFair = matrix.indexOf(`packageKey: EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY`);
    if (key === "empleos_job_post_paid" && constUse >= 0) {
      slice = matrix.slice(constUse, constUse + 400);
    } else if (key === "empleos_job_fair_free" && constUseFair >= 0) {
      slice = matrix.slice(constUseFair, constUseFair + 400);
    } else {
      const anchor = matrix.lastIndexOf(key);
      slice = matrix.slice(anchor, anchor + 600);
    }
  }
  if (!slice.includes(`priceCents: ${cents}`)) {
    fail(`Expected ${key} priceCents ${cents}`);
  }
}
ok("revenuePricingMatrix price cents for active packages");

if (!serviciosPreview.includes("PublishCheckoutCheckpoint")) {
  fail("Servicios preview must use PublishCheckoutCheckpoint");
}
if (!serviciosPreview.includes("saveServiciosPendingBeforeCheckout")) {
  fail("Servicios preview must hidden-save before checkout");
}
if (!serviciosPreview.includes("startRevenueCategoryCheckout")) {
  fail("Servicios preview must start Revenue OS checkout");
}
if (!serviciosPreview.includes("SERVICIOS_OFFERS_ADDON_PACKAGE_KEY") && !serviciosPreview.includes("servicios_offers_addon")) {
  fail("Servicios preview must reference offers add-on");
}
ok("Servicios preview checkpoint + pending + checkout wiring");

if (!bienesPreview.includes("PublishCheckoutCheckpoint")) fail("Bienes preview must render PublishCheckoutCheckpoint");
if (!bienesPreview.includes('activationMode: needsPayment ? "pending_payment"')) {
  fail("Bienes preview must support pending_payment activation mode");
}
if (!bienesPreview.includes("startRevenueCategoryCheckout")) fail("Bienes preview must start Revenue OS checkout");
if (bienesPreview.includes("onPromoApply")) {
  fail("Smoke expects Bienes promo Apply not yet wired on preview (documented gap)");
}
ok("Bienes preview checkpoint present; promo gap confirmed");

if (!autosConfirm.includes("AUTOS_PRIVADO_CHECKOUT")) fail("Autos confirm must reference privado checkout payload");
if (!autosConfirm.includes("startRevenueCategoryCheckout")) fail("Autos confirm must support Revenue OS checkout");
if (!autosConfirm.includes("/api/clasificados/autos/checkout")) {
  fail("Autos confirm must retain legacy dealer checkout path");
}
ok("Autos confirm dual-path (Revenue OS privado + legacy dealer) present");

if (!empleosCheckout.includes("EMPLEOS_PAID_JOB_CHECKOUT")) fail("Empleos paid checkout payload missing");
if (!empleosCheckout.includes('mode: "draft"')) fail("Empleos must save draft before paid checkout");
if (!empleosCheckout.includes("startRevenueCategoryCheckout")) fail("Empleos must use Revenue OS checkout");
ok("Empleos paid draft + Revenue OS checkout handoff");

if (!rentasPreview.includes("RENTAS_CATEGORY_CHECKOUT")) fail("Rentas privado must use rentas checkout payload");
if (!rentasPreview.includes('activationMode: "pending_payment"')) fail("Rentas privado must pending-save");
if (!rentasPreview.includes("startRevenueCategoryCheckout")) fail("Rentas privado must Revenue OS checkout");
if (rentasPreview.includes("PublishCheckoutCheckpoint")) {
  fail("Smoke expects Rentas privado not yet on shared PublishCheckoutCheckpoint");
}
ok("Rentas privado Revenue OS path present; shared checkpoint gap confirmed");

if (!entryCheckpoints.includes("getServiciosCheckpointCard")) fail("Entry checkpoints must include Servicios");
if (!entryCheckpoints.includes("getBienesRaicesCheckpointCards")) fail("Entry checkpoints must include Bienes");
if (!entryCheckpoints.includes("getAutosCheckpointCards")) fail("Entry checkpoints must include Autos");
if (!entryCheckpoints.includes("getEmpleosPaidCheckpointCard")) fail("Entry checkpoints must include Empleos paid");
if (!entryCheckpoints.includes("getEmpleosFreeCheckpointCard")) fail("Entry checkpoints must include Empleos feria");
if (!entryCheckpoints.includes("getRentasPrivadoCheckpointCard")) fail("Entry checkpoints must include Rentas privado");
if (!entryCheckpoints.includes("getRentasNegocioCheckpointCard")) fail("Entry checkpoints must include Rentas negocio");
ok("categoryPublishCheckpoints covers all six categories");

if (!fulfillment.includes("activatePaidServiciosListingFromRevenueOs")) {
  fail("Fulfillment must call Servicios listing activation");
}
ok("Revenue OS webhook Servicios activation hook present");

console.log("smoke-active-categories-revenue-os-checkpoint-activation-matrix-01: PASS");
