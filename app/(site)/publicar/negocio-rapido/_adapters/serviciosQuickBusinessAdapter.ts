/**
 * Quick Business → SERVICIOS. Feeds the EXISTING `ClasificadosServiciosApplicationState` through the category's
 * own default state + normalizer + readiness validator + draft store, then hands off to the EXISTING preview
 * (`/clasificados/publicar/servicios/preview`), which owns the pending row, the monthly base checkout and the
 * assisted save/publish-for-client actions.
 *
 * The handoff carries the Quick plan marker, so that shared preview charges the Quick package
 * (`servicios_quick_monthly`, SIMPLE) instead of the Full one. Without it a Quick customer would
 * reach the Full checkout, which is the product this intake exists to be cheaper than.
 */

import { BUSINESS_TYPE_PRESETS, getBusinessTypePreset } from "@/app/clasificados/publicar/servicios/lib/businessTypePresets";
import { persistServiciosDraftForPreviewNavigation } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosPreviewHandoff";
import type { ClasificadosServiciosApplicationState, DayHoursRow, GalleryItem } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { createDefaultClasificadosServiciosState } from "@/app/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import { serviciosBusinessTypeUsesCustomCategoryLabel } from "@/app/clasificados/publicar/servicios/lib/resolveServiciosPublicCategoryLabel";
import { syncServiciosContactEnables } from "@/app/clasificados/publicar/servicios/lib/serviciosContactVisibility";
import { evaluateServiciosPublishReadiness } from "@/app/clasificados/publicar/servicios/lib/serviciosPublishReadiness";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { withQuickPlanParam } from "@/app/lib/listingPlans/businessQuickPlanSignal";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickBusinessCategoryAdapter } from "@/app/lib/quickBusiness/quickBusinessTypes";
import type { QuickFieldOption, QuickIntakeStep, QuickIntakeValues, QuickMediaItem } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickList, quickStr } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, resolveCity } from "@/app/publicar/rapido/_adapters/quickAdapterShared";
import { BUSINESS_DAY_ORDER, businessContactStep, businessHoursFields, readBusinessHours, splitFreeTextList } from "./quickBusinessAdapterShared";

/** The 77 existing business-type presets (one universal Servicios application, many presets). */
const BUSINESS_TYPE_OPTIONS: QuickFieldOption[] = BUSINESS_TYPE_PRESETS.map((p) => ({ value: p.id, label: { es: p.labelEs, en: p.labelEn } }));

const needsCustomLabel = (v: QuickIntakeValues) => serviciosBusinessTypeUsesCustomCategoryLabel(quickStr(v, "businessTypeId"));

function serviceOptionsFor(values: QuickIntakeValues): QuickFieldOption[] {
  const preset = getBusinessTypePreset(quickStr(values, "businessTypeId"));
  if (!preset) return [];
  return preset.suggestedServices.map((c) => ({ value: c.id, label: { es: c.es, en: c.en } }));
}

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "business",
    title: { es: "Tu negocio", en: "Your business" },
    fields: [
      { key: "businessTypeId", kind: "select", label: { es: "Tipo de servicio", en: "Service type" }, required: true, options: BUSINESS_TYPE_OPTIONS },
      { key: "customServiceDescription", kind: "text", label: { es: "Describe tu servicio", en: "Describe your service" }, required: needsCustomLabel, showWhen: needsCustomLabel, maxLength: 80 },
      { key: "businessName", kind: "text", label: { es: "Nombre del negocio o profesional", en: "Business or professional name" }, placeholder: { es: "Ej. Joe's Landscaping", en: "e.g. Joe's Landscaping" }, required: true, autoComplete: "organization", maxLength: 80 },
      { key: "serviceIds", kind: "chips", label: { es: "Servicios que ofreces", en: "Services you offer" }, hint: { es: "Elige los que apliquen.", en: "Pick the ones that apply." }, showWhen: (v) => serviceOptionsFor(v).length > 0, options: serviceOptionsFor },
      { key: "customServices", kind: "text", label: { es: "Otros servicios (separados por coma)", en: "Other services (comma-separated)" }, placeholder: { es: "Ej. Poda de árboles, riego automático", en: "e.g. Tree trimming, sprinkler systems" }, maxLength: 240 },
      { key: "aboutText", kind: "textarea", label: { es: "Sobre tu negocio", en: "About your business" }, hint: { es: "Qué haces, para quién y qué te distingue (mínimo una oración).", en: "What you do, for whom and what sets you apart (at least one sentence)." }, required: true, maxLength: 1500 },
    ],
    atLeastOne: { keys: ["serviceIds", "customServices"], message: { es: "Elige al menos un servicio o escribe uno.", en: "Pick at least one service or type one." } },
  },
  {
    id: "where",
    title: { es: "¿Dónde y cuándo?", en: "Where and when?" },
    fields: [cityField("free", { es: "Ciudad o área que atiendes", en: "City or area you serve" }), ...businessHoursFields()],
  },
  businessContactStep(),
];

function hoursFrom(values: QuickIntakeValues, base: DayHoursRow[]): DayHoursRow[] {
  const h = readBusinessHours(values);
  return BUSINESS_DAY_ORDER.map((day) => {
    const existing = base.find((r) => r.day === day);
    return h.days.has(day)
      ? { day, closed: false, open: h.open, close: h.close }
      : { day, closed: true, open: existing?.open ?? "", close: existing?.close ?? "" };
  });
}

function galleryFrom(media: readonly QuickMediaItem[]): GalleryItem[] {
  return media.map((m) => ({ id: m.id, url: m.dataUrl, source: "file" as const }));
}

export const serviciosQuickBusinessAdapter: QuickBusinessCategoryAdapter = {
  category: "servicios",
  steps: STEPS,
  confirmations: { kind: "servicios" },
  async buildAndWriteCanonicalDraft({ values, media, confirmations, ctx }) {
    const base = createDefaultClasificadosServiciosState();
    const businessTypeId = quickStr(values, "businessTypeId");
    const gallery = galleryFrom(media);
    const contact = {
      phone: quickStr(values, "phone"),
      // Bible §10.1: SMS explicit — maps to the canonical quoteMessagePhone CTA field.
      quoteMessagePhone: quickStr(values, "sms"),
      whatsapp: quickStr(values, "whatsapp"),
      email: quickStr(values, "email"),
      website: quickStr(values, "website"),
    };
    const draft: ClasificadosServiciosApplicationState = {
      ...base,
      // Land the customer on the existing application's final (confirmation) step if they choose "edit" from the preview.
      applicationStepIndex: 7,
      businessTypeId,
      customServiceDescription: needsCustomLabel(values) ? quickStr(values, "customServiceDescription") : base.customServiceDescription,
      businessName: quickStr(values, "businessName"),
      selectedServiceIds: quickList(values, "serviceIds"),
      customServicesOffered: splitFreeTextList(quickStr(values, "customServices")),
      aboutText: quickStr(values, "aboutText"),
      city: resolveCity(values),
      hours: hoursFrom(values, base.hours),
      ...contact,
      coverUrl: gallery[0]?.url ?? "",
      gallery,
      featuredGalleryIds: gallery.slice(0, 4).map((g) => g.id),
      confirmListingAccurate: confirmations.infoTruthful,
      confirmPhotosRepresentBusiness: confirmations.mediaAccurate,
      confirmCommunityRules: confirmations.rulesAccepted,
    };
    // Contact Hub enables are derived from the typed data exactly as the existing application derives them.
    const state: ClasificadosServiciosApplicationState = { ...draft, ...syncServiciosContactEnables(draft) };
    const readiness = evaluateServiciosPublishReadiness(state, ctx.lang);
    if (!readiness.ok) return { ok: false, issues: readiness.missing.map((m) => m.label) };
    const saved = await persistServiciosDraftForPreviewNavigation(state);
    if (!saved) return { ok: false, issues: [ctx.lang === "en" ? "Could not save your draft in this browser." : "No se pudo guardar tu borrador en este navegador."] };
    return {
      ok: true,
      handoff: {
        kind: "preview",
        href: withQuickPlanParam(
          withClasificadosPublishLang("/clasificados/publicar/servicios/preview", ctx.routeLang as SupportedLang),
        ),
      },
    };
  },
};
