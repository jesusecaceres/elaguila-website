import {
  type PublishCheckpointConfig,
  type PublishCheckpointConfirmation,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { BIENES_RAICES_FSBO_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { validateRevenuePromoForCheckout } from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";

export const BIENES_RAICES_FSBO_PACKAGE_KEY = "br_fsbo_45d" as const;

export const BIENES_RAICES_FSBO_CHECKPOINT_CONFIRMATIONS: PublishCheckpointConfirmation[] = [
  {
    id: "accurate_property_info",
    required: true,
    labelEn:
      "I confirm the property price, location, features, availability, and seller contact details are accurate and up to date.",
    labelEs:
      "Confirmo que precio, ubicacion, caracteristicas, disponibilidad y datos de contacto de la propiedad son correctos y estan actualizados.",
  },
  {
    id: "one_property_per_listing",
    required: true,
    labelEn:
      "I confirm this paid FSBO listing covers one property only. Another property requires a separate paid listing.",
    labelEs:
      "Confirmo que este anuncio FSBO pagado cubre una sola propiedad. Otra propiedad requiere otro anuncio pagado.",
  },
  {
    id: "fsbo_authorized",
    required: true,
    labelEn:
      "I confirm I am authorized to publish this property and any photos or details included.",
    labelEs:
      "Confirmo que estoy autorizado para publicar esta propiedad y cualquier foto o detalle incluido.",
  },
  {
    id: "payment_required",
    required: true,
    labelEn: "I understand payment is required before this property listing becomes active on Leonix.",
    labelEs: "Entiendo que el pago es requerido antes de que este anuncio de propiedad quede activo en Leonix.",
  },
];

export function bienesRaicesFsboPreviewCheckpointConfig(lang: "es" | "en"): PublishCheckpointConfig {
  const packageDef = getRevenuePackageDefinition(BIENES_RAICES_FSBO_PACKAGE_KEY);
  const durationDays = packageDef?.durationDays ?? 45;
  return {
    category: BIENES_RAICES_FSBO_CHECKOUT.category,
    packageKey: BIENES_RAICES_FSBO_PACKAGE_KEY,
    lang,
    mode: "checkout",
    pipeline: "privado",
    baseLineItem: {
      labelEn: "Bienes Raices FSBO package",
      labelEs: "Paquete Bienes Raices FSBO",
      priceCents: packageDef?.priceCents ?? 0,
      detailEn: `${durationDays} days - one property per listing - no inventory`,
      detailEs: `${durationDays} dias - una propiedad por anuncio - sin inventario`,
    },
    confirmations: BIENES_RAICES_FSBO_CHECKPOINT_CONFIRMATIONS,
    newsletterEligible: true,
    promoEligible: packageDef?.promoEligible ?? true,
    returnPath: BIENES_RAICES_FSBO_CHECKOUT.returnPath,
  };
}

export function bienesRaicesFsboCheckoutSubtotalCents(): number {
  return getRevenuePackageDefinition(BIENES_RAICES_FSBO_PACKAGE_KEY)?.priceCents ?? 0;
}

export async function applyBienesRaicesFsboPreviewPromoCode(input: {
  code: string;
  lang: "es" | "en";
}): Promise<{ ok: true; discountCents: number; message: string } | { ok: false; message: string }> {
  const subtotalCents = bienesRaicesFsboCheckoutSubtotalCents();
  const result = await validateRevenuePromoForCheckout({
    code: input.code,
    category: BIENES_RAICES_FSBO_CHECKOUT.category,
    packageKey: BIENES_RAICES_FSBO_PACKAGE_KEY,
    subtotalCents,
    locale: input.lang,
  });
  if (!result.ok) return { ok: false, message: result.userMessage };
  return {
    ok: true,
    discountCents: result.discountCents,
    message:
      input.lang === "es"
        ? `${result.discountLabel} aplicado. Total: $${(result.totalCents / 100).toFixed(2)}`
        : `${result.discountLabel} applied. Total: $${(result.totalCents / 100).toFixed(2)}`,
  };
}

export const BIENES_RAICES_FSBO_PREVIEW_RULES_MODAL = {
  titleEn: "Leonix FSBO real estate rules",
  titleEs: "Reglas de Bienes Raices FSBO en Leonix",
  bulletsEn: [
    "One paid FSBO listing covers one property only.",
    "Another property requires another paid listing.",
    "No brokerage, office, or agent inventory is included in this package.",
    "Property details, photos, price, availability, and seller contact must be accurate.",
    "Payment is required before the property becomes active on Leonix.",
  ],
  bulletsEs: [
    "Un anuncio FSBO pagado cubre una sola propiedad.",
    "Otra propiedad requiere otro anuncio pagado.",
    "Este paquete no incluye inventario de broker, oficina o agente.",
    "Detalles, fotos, precio, disponibilidad y contacto del vendedor deben ser correctos.",
    "El pago es requerido antes de que la propiedad quede activa en Leonix.",
  ],
};

export const BIENES_RAICES_FSBO_NEWSLETTER_INTERESTS = ["package:br_fsbo_45d", "category:bienes_raices", "seller:fsbo"];
