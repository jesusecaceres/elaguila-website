/**
 * Shared Empleos paid preview → draft save → Revenue OS checkout helpers.
 * Gate EMPLEOS-REVENUE-OS-PAID-PUBLISH-CHECKPOINT-01
 *
 * Feria (empleos_job_fair_free) must never use this path.
 */

import {
  EMPLEOS_CHECKPOINT_CONFIRMATIONS,
  EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { EMPLEOS_PAID_JOB_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { validateRevenuePromoForCheckout } from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";

export type EmpleosPaidPublishLane = "quick" | "premium";

export function empleosPreviewCheckpointConfig(
  lang: "es" | "en",
  lane: EmpleosPaidPublishLane,
): PublishCheckpointConfig {
  const priceCents = getRevenuePackageDefinition(EMPLEOS_JOB_POST_PAID_PACKAGE_KEY)?.priceCents ?? 2499;
  const isPremium = lane === "premium";
  return {
    category: EMPLEOS_PAID_JOB_CHECKOUT.category,
    packageKey: EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
    lang,
    mode: "checkout",
    pipeline: isPremium ? "premium" : "quick",
    baseLineItem: {
      labelEn: isPremium ? "Premium job post (30 days)" : "Job post (30 days)",
      labelEs: isPremium ? "Empleo premium (30 días)" : "Publicar empleo (30 días)",
      priceCents,
      detailEn: "One job listing for 30 days — no upgrades. Another job needs a new listing.",
      detailEs: "Un anuncio de empleo por 30 días — sin upgrades. Otro empleo requiere un nuevo anuncio.",
    },
    confirmations: EMPLEOS_CHECKPOINT_CONFIRMATIONS,
    newsletterEligible: true,
    promoEligible: true,
    returnPath: EMPLEOS_PAID_JOB_CHECKOUT.returnPath,
  };
}

export function empleosCheckoutSubtotalCents(): number {
  return getRevenuePackageDefinition(EMPLEOS_JOB_POST_PAID_PACKAGE_KEY)?.priceCents ?? 2499;
}

export async function applyEmpleosPreviewPromoCode(input: {
  code: string;
  lang: "es" | "en";
}): Promise<{ ok: true; discountCents: number; message: string } | { ok: false; message: string }> {
  const subtotalCents = empleosCheckoutSubtotalCents();
  const result = await validateRevenuePromoForCheckout({
    code: input.code,
    category: EMPLEOS_PAID_JOB_CHECKOUT.category,
    packageKey: EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
    subtotalCents,
    locale: input.lang,
  });
  if (!result.ok) {
    return { ok: false, message: result.userMessage };
  }
  return {
    ok: true,
    discountCents: result.discountCents,
    message:
      input.lang === "es"
        ? `${result.discountLabel} aplicado. Total: $${(result.totalCents / 100).toFixed(2)}`
        : `${result.discountLabel} applied. Total: $${(result.totalCents / 100).toFixed(2)}`,
  };
}

export const EMPLEOS_PREVIEW_RULES_MODAL = {
  titleEn: "Leonix job listing rules",
  titleEs: "Reglas de anuncios de empleo en Leonix",
  bulletsEn: [
    "Job title, pay, location, schedule, and contact details must be accurate and current.",
    "You must be authorized to publish this job and all photos or employer details included.",
    "Each job requires its own paid listing — no upgrades or bulk packages.",
    "Payment is required before your job listing becomes active on Leonix.",
    "You are responsible for the published information and for following Leonix Empleos rules.",
  ],
  bulletsEs: [
    "El título del empleo, pago, ubicación, horario y datos de contacto deben ser correctos y estar actualizados.",
    "Debes estar autorizado para publicar este empleo y todas las fotos o datos del empleador incluidos.",
    "Cada empleo requiere su propio anuncio pagado — sin upgrades ni paquetes masivos.",
    "El pago es requerido antes de que tu anuncio de empleo quede activo en Leonix.",
    "Eres responsable por la información publicada y por seguir las reglas de Empleos de Leonix.",
  ],
};

export const EMPLEOS_NEWSLETTER_INTERESTS: Record<EmpleosPaidPublishLane, string[]> = {
  quick: ["package:empleos_quick", "launch_25"],
  premium: ["package:empleos_premium", "launch_25"],
};
