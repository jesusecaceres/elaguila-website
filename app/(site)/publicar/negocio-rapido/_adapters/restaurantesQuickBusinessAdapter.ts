/**
 * Quick Business → RESTAURANTES. Feeds the EXISTING `RestauranteListingDraft` through the category's own empty
 * draft + readiness audit + draft store, then hands off to the EXISTING preview (`/clasificados/restaurantes/preview`),
 * which owns the pending row, the checkout confirmations and the existing monthly base checkout.
 * No menu, coupon, cuisine, hours or delivery option is ever invented: the customer selects or types each one.
 *
 * The handoff carries the Quick plan marker, so that shared preview charges the Quick package
 * (`restaurantes_quick_monthly`, SIMPLE) rather than the Full one.
 */

import { createEmptyRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { saveRestauranteDraftToStorageResolved } from "@/app/clasificados/restaurantes/application/restauranteDraftStorage";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import { auditRestaurantePublishReadiness, type RestauranteDaySchedule, type RestauranteServiceMode } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  RESTAURANTE_BUSINESS_TYPES,
  RESTAURANTE_CUISINES,
  RESTAURANTE_SERVICE_MODES,
  TAXONOMY_KEY_OTHER,
  labelForBusinessType,
  labelForCuisine,
  labelForServiceMode,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { withQuickPlanParam } from "@/app/lib/listingPlans/businessQuickPlanSignal";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickBusinessCategoryAdapter } from "@/app/lib/quickBusiness/quickBusinessTypes";
import type { QuickIntakeStep, QuickIntakeValues } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickList, quickStr } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, resolveCity } from "@/app/publicar/rapido/_adapters/quickAdapterShared";
import { BUSINESS_DAY_ORDER, businessContactStep, businessHoursFields, optionsFromKeyLabel, readBusinessHours, type BusinessDayKey } from "./quickBusinessAdapterShared";

const BUSINESS_TYPE_OPTIONS = optionsFromKeyLabel(RESTAURANTE_BUSINESS_TYPES, (k) => labelForBusinessType(k, "en"));
const CUISINE_OPTIONS = optionsFromKeyLabel(RESTAURANTE_CUISINES, (k) => labelForCuisine(k, "en"));
const SERVICE_MODE_OPTIONS = RESTAURANTE_SERVICE_MODES.map((o) => ({ value: o.key, label: { es: `${o.chipEmoji ?? ""} ${o.labelEs}`.trim(), en: `${o.chipEmoji ?? ""} ${labelForServiceMode(o.key, "en")}`.trim() } }));

const isOther = (key: string) => (v: QuickIntakeValues) => quickStr(v, key) === TAXONOMY_KEY_OTHER;

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "restaurant",
    title: { es: "Tu restaurante", en: "Your restaurant" },
    fields: [
      { key: "businessName", kind: "text", label: { es: "Nombre del restaurante o negocio", en: "Restaurant or business name" }, placeholder: { es: "Ej. Taquería La Estrella", en: "e.g. Taquería La Estrella" }, required: true, autoComplete: "organization", maxLength: 80 },
      { key: "businessType", kind: "select", label: { es: "Tipo de negocio", en: "Business type" }, required: true, options: BUSINESS_TYPE_OPTIONS },
      { key: "businessTypeCustom", kind: "text", label: { es: "Describe tu tipo de negocio", en: "Describe your business type" }, required: isOther("businessType"), showWhen: isOther("businessType"), maxLength: 60 },
      { key: "primaryCuisine", kind: "select", label: { es: "Cocina principal", en: "Main cuisine" }, required: true, options: CUISINE_OPTIONS },
      { key: "primaryCuisineCustom", kind: "text", label: { es: "Describe tu cocina", en: "Describe your cuisine" }, required: isOther("primaryCuisine"), showWhen: isOther("primaryCuisine"), maxLength: 60 },
      { key: "shortSummary", kind: "textarea", label: { es: "Descripción corta", en: "Short description" }, hint: { es: "Qué te hace especial: platillos, ambiente, especialidad.", en: "What makes you special: dishes, atmosphere, specialty." }, maxLength: 600 },
      { key: "serviceModes", kind: "chips", label: { es: "¿Cómo atiendes?", en: "How do you serve?" }, hint: { es: "Opcional. Elige los que apliquen.", en: "Optional. Pick the ones that apply." }, options: SERVICE_MODE_OPTIONS },
    ],
  },
  {
    id: "where",
    title: { es: "¿Dónde y cuándo?", en: "Where and when?" },
    fields: [cityField("free", { es: "Ciudad", en: "City" }), ...businessHoursFields()],
  },
  businessContactStep(),
];

const DAY_TO_DRAFT: Record<BusinessDayKey, "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"> = {
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
  sun: "sunday",
};

function weeklyHoursFrom(values: QuickIntakeValues): Partial<RestauranteListingDraft> {
  const h = readBusinessHours(values);
  const out: Partial<RestauranteListingDraft> = {};
  for (const day of BUSINESS_DAY_ORDER) {
    const sched: RestauranteDaySchedule = h.days.has(day) ? { closed: false, openTime: h.open, closeTime: h.close } : { closed: true };
    out[DAY_TO_DRAFT[day]] = sched;
  }
  return out;
}

export const restaurantesQuickBusinessAdapter: QuickBusinessCategoryAdapter = {
  category: "restaurantes",
  steps: STEPS,
  // The existing Restaurantes preview carries the checkout confirmations; the draft has no rule booleans.
  confirmations: { kind: "none" },
  async buildAndWriteCanonicalDraft({ values, media, ctx }) {
    const base = createEmptyRestauranteDraft();
    const [hero, ...rest] = media.map((m) => m.dataUrl);
    const serviceModes = quickList(values, "serviceModes").filter((m): m is RestauranteServiceMode => RESTAURANTE_SERVICE_MODES.some((o) => o.key === m));
    const draft: RestauranteListingDraft = {
      ...base,
      // Canonical default the existing application assigns when no `?product=` is present (single real base price).
      productType: "established_restaurant",
      businessName: quickStr(values, "businessName"),
      businessType: quickStr(values, "businessType"),
      businessTypeCustom: isOther("businessType")(values) ? quickStr(values, "businessTypeCustom") : undefined,
      primaryCuisine: quickStr(values, "primaryCuisine"),
      primaryCuisineCustom: isOther("primaryCuisine")(values) ? quickStr(values, "primaryCuisineCustom") : undefined,
      shortSummary: quickStr(values, "shortSummary") || undefined,
      serviceModes,
      cityCanonical: resolveCity(values),
      ...weeklyHoursFrom(values),
      phoneNumber: quickStr(values, "phone") || undefined,
      whatsAppNumber: quickStr(values, "whatsapp") || undefined,
      email: quickStr(values, "email") || undefined,
      websiteUrl: quickStr(values, "website") || undefined,
      heroImage: hero ?? "",
      galleryImages: rest,
    };
    const readiness = auditRestaurantePublishReadiness(draft, "draft");
    if (!readiness.readyToPublish) {
      return { ok: false, issues: readiness.missingFields.map((f) => (ctx.lang === "en" ? `Missing: ${f}` : `Falta: ${f}`)) };
    }
    const saved = await saveRestauranteDraftToStorageResolved(draft);
    if (!saved) return { ok: false, issues: [ctx.lang === "en" ? "Could not save your draft in this browser." : "No se pudo guardar tu borrador en este navegador."] };
    return {
      ok: true,
      handoff: {
        kind: "preview",
        href: withQuickPlanParam(
          withClasificadosPublishLang("/clasificados/restaurantes/preview", ctx.routeLang as SupportedLang),
        ),
      },
    };
  },
};
