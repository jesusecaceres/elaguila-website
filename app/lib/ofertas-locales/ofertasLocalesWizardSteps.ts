import type { OfertaLocalDraft } from "./ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "./useOfertasLocalesAppLang";
import {
  isOfertaLocalCouponPromotionFlow,
  isOfertaLocalWeeklyFlyerFlow,
} from "./ofertasLocalesApplicationHelpers";
import { normalizeOfertaLocalPhoneInput, normalizeOfertaLocalZipInput } from "./ofertasLocalesFormatting";

export type OfertasLocalesWizardStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type OfertasLocalesWizardStepMeta = {
  id: OfertasLocalesWizardStepId;
  labelEs: string;
  labelEn: string;
  titleEs: string;
  titleEn: string;
};

/** Volante interactivo lane — 8 real steps, unchanged since Gate I/J. */
export const OFERTAS_LOCALES_FLYER_WIZARD_STEPS: ReadonlyArray<OfertasLocalesWizardStepMeta> = [
  {
    id: 1,
    labelEs: "Oferta",
    labelEn: "Offer",
    titleEs: "¿Qué quieres promocionar?",
    titleEn: "What do you want to promote?",
  },
  {
    id: 2,
    labelEs: "Negocio",
    labelEn: "Business",
    titleEs: "Cuéntanos del negocio",
    titleEn: "Tell us about the business",
  },
  {
    id: 3,
    labelEs: "Detalles",
    labelEn: "Details",
    titleEs: "Detalles de la oferta",
    titleEn: "Offer details",
  },
  {
    id: 4,
    labelEs: "Ubicación",
    labelEn: "Location",
    titleEs: "Ubicación y contacto",
    titleEn: "Location and contact",
  },
  {
    id: 5,
    labelEs: "Archivos",
    labelEn: "Files",
    titleEs: "Archivos del volante o cupón",
    titleEn: "Flyer or coupon files",
  },
  {
    id: 6,
    labelEs: "Revisar productos",
    labelEn: "Review products",
    titleEs: "Revisar productos encontrados",
    titleEn: "Review the products found",
  },
  {
    id: 7,
    labelEs: "Extras",
    labelEn: "Extras",
    titleEs: "Extras para mejorar tu presencia",
    titleEn: "Extras to improve your presence",
  },
  {
    id: 8,
    labelEs: "Revisar",
    labelEn: "Review",
    titleEs: "Revisar antes de enviar",
    titleEn: "Review before submitting",
  },
];

/**
 * Cupones y promociones (free) lane — 7 truthful steps, no AI/scan/review step.
 * Step 5 owns individual coupon authoring instead of flyer files.
 */
export const OFERTAS_LOCALES_COUPON_WIZARD_STEPS: ReadonlyArray<OfertasLocalesWizardStepMeta> = [
  OFERTAS_LOCALES_FLYER_WIZARD_STEPS[0],
  OFERTAS_LOCALES_FLYER_WIZARD_STEPS[1],
  OFERTAS_LOCALES_FLYER_WIZARD_STEPS[2],
  OFERTAS_LOCALES_FLYER_WIZARD_STEPS[3],
  {
    id: 5,
    labelEs: "Cupones y ofertas",
    labelEn: "Coupons & offers",
    titleEs: "Cupones y promociones",
    titleEn: "Coupons and promotions",
  },
  {
    id: 6,
    labelEs: "Extras",
    labelEn: "Extras",
    titleEs: "Extras para mejorar tu presencia",
    titleEn: "Extras to improve your presence",
  },
  {
    id: 7,
    labelEs: "Revisar",
    labelEn: "Review",
    titleEs: "Revisar antes de enviar",
    titleEn: "Review before submitting",
  },
];

/** @deprecated Use getOfertasLocalesWizardSteps(isCouponsLane) — kept for any stray legacy import. */
export const OFERTAS_LOCALES_WIZARD_STEPS = OFERTAS_LOCALES_FLYER_WIZARD_STEPS;
/** @deprecated Use getOfertasLocalesWizardStepCount(isCouponsLane) — kept for any stray legacy import. */
export const OFERTAS_LOCALES_WIZARD_STEP_COUNT = 8 as const;

export function getOfertasLocalesWizardSteps(
  isCouponsLane: boolean
): ReadonlyArray<OfertasLocalesWizardStepMeta> {
  return isCouponsLane ? OFERTAS_LOCALES_COUPON_WIZARD_STEPS : OFERTAS_LOCALES_FLYER_WIZARD_STEPS;
}

export function getOfertasLocalesWizardStepCount(isCouponsLane: boolean): number {
  return isCouponsLane ? OFERTAS_LOCALES_COUPON_WIZARD_STEPS.length : OFERTAS_LOCALES_FLYER_WIZARD_STEPS.length;
}

export function clampWizardStep(n: number, isCouponsLane = false): OfertasLocalesWizardStepId {
  const max = getOfertasLocalesWizardStepCount(isCouponsLane);
  if (n <= 1) return 1;
  if (n >= max) return max as OfertasLocalesWizardStepId;
  return n as OfertasLocalesWizardStepId;
}

/** Soft recommendations for the current step — does not block navigation. */
export function getOfertasLocalesWizardStepHints(
  step: OfertasLocalesWizardStepId,
  draft: OfertaLocalDraft,
  lang: OfertasLocalesAppLang,
  isCouponsLane = false
): string[] {
  const es = lang === "es";
  const hints: string[] = [];
  const lastStep = getOfertasLocalesWizardStepCount(isCouponsLane);

  switch (step) {
    case 1:
      if (!draft.primaryAdFormat && !draft.offerType) {
        hints.push(
          es
            ? "Elige qué quieres publicar principalmente."
            : "Choose what you mainly want to publish."
        );
      }
      break;
    case 2:
      if (!draft.businessCategory) {
        hints.push(es ? "Selecciona la categoría del negocio." : "Select a business category.");
      }
      if (!draft.businessName.trim()) {
        hints.push(es ? "Agrega el nombre del negocio." : "Add your business name.");
      }
      if (!draft.title.trim()) {
        hints.push(es ? "Agrega un título para la oferta." : "Add an offer title.");
      }
      if (draft.businessCategory === "other_business" && !draft.customMarketType.trim()) {
        hints.push(es ? "Agrega el tipo de negocio." : "Add the business type.");
      }
      if (
        draft.marketType === "other" &&
        draft.businessCategory !== "other_business" &&
        !draft.customMarketType.trim()
      ) {
        hints.push(es ? "Agrega el tipo de negocio." : "Add the business type.");
      }
      break;
    case 3: {
      const isCouponPromo = isOfertaLocalCouponPromotionFlow(draft.offerType);
      if (isCouponPromo && !draft.couponText.trim()) {
        hints.push(es ? "Describe el cupón o promoción." : "Describe the coupon or promotion.");
      }
      if (!draft.validFrom.trim() || !draft.validUntil.trim()) {
        hints.push(es ? "Indica las fechas de validez." : "Add valid-from and valid-until dates.");
      }
      break;
    }
    case 4:
      if (!draft.city.trim()) {
        hints.push(es ? "Agrega una ciudad." : "Add a city.");
      }
      if (normalizeOfertaLocalZipInput(draft.zipCode).length < 2) {
        hints.push(es ? "Agrega un código postal." : "Add a postal code.");
      }
      const phoneDigits = normalizeOfertaLocalPhoneInput(draft.phone);
      const whatsappDigits = normalizeOfertaLocalPhoneInput(draft.whatsapp);
      if (phoneDigits.length < 10 && whatsappDigits.length < 10) {
        hints.push(es ? "Agrega un teléfono o WhatsApp." : "Add a phone or WhatsApp.");
      }
      break;
    case 5:
      if (isCouponsLane) {
        if (draft.couponEntries.length === 0) {
          hints.push(
            es
              ? "Agrega al menos un cupón para que los compradores puedan encontrarlo."
              : "Add at least one coupon so shoppers can find it."
          );
        }
      } else if (isOfertaLocalWeeklyFlyerFlow(draft.offerType) && draft.flyerAssets.length === 0) {
        hints.push(
          es
            ? "Sube o enlaza tu volante cuando estés listo."
            : "Upload or link your flyer when ready."
        );
      } else if (isOfertaLocalCouponPromotionFlow(draft.offerType) && draft.couponAssets.length === 0) {
        hints.push(
          es ? "Sube o enlaza tu cupón cuando estés listo." : "Upload or link your coupon when ready."
        );
      }
      break;
    case 6:
      break;
    case 7:
      break;
    case 8:
      break;
    default:
      break;
  }

  if (hints.length > 0 && step < lastStep) {
    hints.unshift(es ? "Falta poco." : "Almost there.");
  }

  return hints;
}

export function wizardStepLabel(
  step: (typeof OFERTAS_LOCALES_WIZARD_STEPS)[number],
  lang: OfertasLocalesAppLang
): string {
  return lang === "en" ? step.labelEn : step.labelEs;
}

export function wizardStepTitle(
  step: (typeof OFERTAS_LOCALES_WIZARD_STEPS)[number],
  lang: OfertasLocalesAppLang
): string {
  return lang === "en" ? step.titleEn : step.titleEs;
}

export function isOfertaLocalGeneralFlow(draft: OfertaLocalDraft): boolean {
  return isOfertaLocalCouponPromotionFlow(draft.offerType);
}
