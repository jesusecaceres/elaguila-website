import type { OfertaLocalDraft } from "./ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "./useOfertasLocalesAppLang";
import {
  isOfertaLocalCouponPromotionFlow,
  isOfertaLocalWeeklyFlyerFlow,
} from "./ofertasLocalesApplicationHelpers";
import { normalizeOfertaLocalPhoneInput, normalizeOfertaLocalZipInput } from "./ofertasLocalesFormatting";

export const OFERTAS_LOCALES_WIZARD_STEP_COUNT = 7 as const;

export type OfertasLocalesWizardStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const OFERTAS_LOCALES_WIZARD_STEPS: ReadonlyArray<{
  id: OfertasLocalesWizardStepId;
  labelEs: string;
  labelEn: string;
  titleEs: string;
  titleEn: string;
}> = [
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

export function clampWizardStep(n: number): OfertasLocalesWizardStepId {
  if (n <= 1) return 1;
  if (n >= 7) return 7;
  return n as OfertasLocalesWizardStepId;
}

/** Soft recommendations for the current step — does not block navigation. */
export function getOfertasLocalesWizardStepHints(
  step: OfertasLocalesWizardStepId,
  draft: OfertaLocalDraft,
  lang: OfertasLocalesAppLang
): string[] {
  const es = lang === "es";
  const hints: string[] = [];

  switch (step) {
    case 1:
      if (!draft.offerType) {
        hints.push(es ? "Elige un tipo de oferta para continuar." : "Choose an offer type to continue.");
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
      const isFlyer = isOfertaLocalWeeklyFlyerFlow(draft.offerType);
      const isCouponPromo = isOfertaLocalCouponPromotionFlow(draft.offerType);
      if (isFlyer && !draft.flyerTitle.trim()) {
        hints.push(es ? "Agrega un título para el volante." : "Add a flyer title.");
      }
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
        hints.push(es ? "La ciudad ayuda en búsquedas locales." : "City helps local search.");
      }
      if (normalizeOfertaLocalZipInput(draft.zipCode).length !== 5) {
        hints.push(es ? "Agrega un ZIP de 5 dígitos." : "Add a 5-digit ZIP code.");
      }
      if (normalizeOfertaLocalPhoneInput(draft.phone).length < 10) {
        hints.push(es ? "Agrega un teléfono de contacto." : "Add a contact phone number.");
      }
      break;
    case 5:
      if (isOfertaLocalWeeklyFlyerFlow(draft.offerType) && draft.flyerAssets.length === 0) {
        hints.push(
          es
            ? "Sube o enlaza tu volante cuando estés listo."
            : "Upload or link your flyer when ready."
        );
      }
      if (isOfertaLocalCouponPromotionFlow(draft.offerType) && draft.couponAssets.length === 0) {
        hints.push(
          es ? "Sube o enlaza tu cupón cuando estés listo." : "Upload or link your coupon when ready."
        );
      }
      break;
    case 6:
      break;
    case 7:
      break;
    default:
      break;
  }

  if (hints.length > 0 && step < 7) {
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
