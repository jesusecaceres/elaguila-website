/**
 * Autos Privado preview → pending save → Revenue OS checkout helpers.
 * Gate AUTOS-PRIVADO-REVENUE-OS-PREVIEW-CHECKOUT-01
 */

import {
  AUTOS_PRIVADO_30D_PACKAGE_KEY,
  AUTOS_PRIVADO_CHECKPOINT_CONFIRMATIONS,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { AUTOS_PRIVADO_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { validateRevenuePromoForCheckout } from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";

export function autosPrivadoPreviewCheckpointConfig(lang: "es" | "en"): PublishCheckpointConfig {
  const priceCents = getRevenuePackageDefinition(AUTOS_PRIVADO_30D_PACKAGE_KEY)?.priceCents ?? 2499;
  return {
    category: AUTOS_PRIVADO_CHECKOUT.category,
    packageKey: AUTOS_PRIVADO_30D_PACKAGE_KEY,
    lang,
    mode: "checkout",
    pipeline: "privado",
    baseLineItem: {
      labelEn: "Autos Privado package",
      labelEs: "Paquete Autos Privado",
      priceCents,
      detailEn: "$24.99 · 30 days · one vehicle per listing",
      detailEs: "$24.99 · 30 días · un vehículo por anuncio",
    },
    confirmations: AUTOS_PRIVADO_CHECKPOINT_CONFIRMATIONS,
    newsletterEligible: true,
    promoEligible: true,
    returnPath: AUTOS_PRIVADO_CHECKOUT.returnPath,
  };
}

export function autosPrivadoCheckoutSubtotalCents(): number {
  return getRevenuePackageDefinition(AUTOS_PRIVADO_30D_PACKAGE_KEY)?.priceCents ?? 2499;
}

export async function applyAutosPrivadoPreviewPromoCode(input: {
  code: string;
  lang: "es" | "en";
}): Promise<{ ok: true; discountCents: number; message: string } | { ok: false; message: string }> {
  const subtotalCents = autosPrivadoCheckoutSubtotalCents();
  const result = await validateRevenuePromoForCheckout({
    code: input.code,
    category: AUTOS_PRIVADO_CHECKOUT.category,
    packageKey: AUTOS_PRIVADO_30D_PACKAGE_KEY,
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

export const AUTOS_PRIVADO_PREVIEW_RULES_MODAL = {
  titleEn: "Leonix Autos private-seller rules",
  titleEs: "Reglas de Autos vendedor privado en Leonix",
  bulletsEn: [
    "Vehicle year, make, model, mileage, price, location, and seller contact must be accurate and current.",
    "You must be authorized to sell this vehicle and to publish all photos and details included.",
    "One paid listing covers one vehicle only — no upgrades, no dealer inventory, no multi-vehicle package.",
    "Payment is required before your vehicle listing becomes active on Leonix.",
    "You are responsible for the published information and for following Leonix Autos rules.",
  ],
  bulletsEs: [
    "Año, marca, modelo, millaje, precio, ubicación y contacto del vendedor deben ser correctos y estar actualizados.",
    "Debes estar autorizado para vender este vehículo y publicar todas las fotos y detalles incluidos.",
    "Un anuncio pagado cubre un solo vehículo — sin upgrades, sin inventario de dealer ni paquete multi-vehículo.",
    "El pago es requerido antes de que tu anuncio de vehículo quede activo en Leonix.",
    "Eres responsable por la información publicada y por seguir las reglas de Autos de Leonix.",
  ],
};

export const AUTOS_PRIVADO_NEWSLETTER_INTERESTS = ["package:autos_privado", "launch_25"];
