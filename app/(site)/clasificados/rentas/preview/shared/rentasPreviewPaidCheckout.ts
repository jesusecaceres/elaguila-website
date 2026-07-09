/**
 * Shared Rentas preview → pending save → Revenue OS checkout helpers.
 * Gate REVENUE-OS-RENTAS-PAID-PUBLISH-LOCKDOWN-01
 */

import {
  RENTAS_CHECKPOINT_CONFIRMATIONS,
  RENTAS_30D_PACKAGE_KEY,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { RENTAS_CATEGORY_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { validateRevenuePromoForCheckout } from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";

export type RentasPublishLane = "privado" | "negocio";

export function rentasPreviewCheckpointConfig(
  lang: "es" | "en",
  lane: RentasPublishLane,
): PublishCheckpointConfig {
  const priceCents = getRevenuePackageDefinition(RENTAS_30D_PACKAGE_KEY)?.priceCents ?? 2499;
  const isNegocio = lane === "negocio";
  return {
    category: RENTAS_CATEGORY_CHECKOUT.category,
    packageKey: RENTAS_30D_PACKAGE_KEY,
    lang,
    mode: "checkout",
    pipeline: lane,
    baseLineItem: {
      labelEn: isNegocio ? "Business rental listing (30 days)" : "Rental listing (30 days)",
      labelEs: isNegocio ? "Anuncio de renta negocio (30 días)" : "Anuncio de renta (30 días)",
      priceCents,
      detailEn: "One rental property — no inventory add-on. Each rental needs its own listing.",
      detailEs: "Una propiedad en renta — sin inventario adicional. Cada renta requiere su propio anuncio.",
    },
    confirmations: RENTAS_CHECKPOINT_CONFIRMATIONS,
    newsletterEligible: true,
    promoEligible: true,
    returnPath: RENTAS_CATEGORY_CHECKOUT.returnPath,
  };
}

export function rentasCheckoutSubtotalCents(): number {
  return getRevenuePackageDefinition(RENTAS_30D_PACKAGE_KEY)?.priceCents ?? 2499;
}

export async function applyRentasPreviewPromoCode(input: {
  code: string;
  lang: "es" | "en";
}): Promise<{ ok: true; discountCents: number; message: string } | { ok: false; message: string }> {
  const subtotalCents = rentasCheckoutSubtotalCents();
  const result = await validateRevenuePromoForCheckout({
    code: input.code,
    category: RENTAS_CATEGORY_CHECKOUT.category,
    packageKey: RENTAS_30D_PACKAGE_KEY,
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

export const RENTAS_PREVIEW_RULES_MODAL = {
  titleEn: "Leonix rental listing rules",
  titleEs: "Reglas de anuncios de renta en Leonix",
  bulletsEn: [
    "Rental price, availability, address/area, and contact details must be accurate and current.",
    "You must be authorized to publish this rental and all photos or details included.",
    "Each rental property requires its own paid listing — no inventory add-on or bulk upgrade.",
    "Payment is required before your rental listing becomes active on Leonix.",
    "You are responsible for the published information and for following Leonix rental rules.",
  ],
  bulletsEs: [
    "El precio, disponibilidad, dirección/área y datos de contacto deben ser correctos y estar actualizados.",
    "Debes estar autorizado para publicar esta renta y todas las fotos o detalles incluidos.",
    "Cada propiedad en renta requiere su propio anuncio pagado — sin paquete de inventario ni upgrade masivo.",
    "El pago es requerido antes de que tu anuncio de renta quede activo en Leonix.",
    "Eres responsable por la información publicada y por seguir las reglas de Rentas de Leonix.",
  ],
};

export const RENTAS_NEWSLETTER_INTERESTS: Record<RentasPublishLane, string[]> = {
  privado: ["package:rentas_privado", "launch_25"],
  negocio: ["package:rentas_negocio", "launch_25"],
};
