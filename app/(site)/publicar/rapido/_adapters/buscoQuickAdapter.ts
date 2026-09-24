/** Quick → BUSCO / SE BUSCA. Feeds `BuscoQuickDraft` under `BUSCO_QUICK_DRAFT_KEY` and hands off to the existing preview. */

import { emptyBuscoQuickDraft, normalizeBuscoQuickDraft } from "@/app/publicar/busco/shared/buscoQuickDraft";
import { BUSCO_QUICK_DRAFT_KEY } from "@/app/publicar/busco/shared/buscoSessionKeys";
import { buscoHandoffPreviewUrl } from "@/app/publicar/busco/shared/buscoPublishRoutes";
import { gateBuscoQuickPreview } from "@/app/publicar/busco/shared/buscoRequiredForPreview";
import { BUSCO_TYPE_OPTIONS } from "@/app/publicar/busco/shared/buscoTaxonomy";
import type { BuscoQuickDraft, BuscoTypeSlug } from "@/app/publicar/busco/shared/buscoQuickTypes";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickClassifiedCategoryAdapter, QuickIntakeStep } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickStr } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, contactStep, optionsFromEsEn, resolveCity } from "./quickAdapterShared";

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "request",
    title: { es: "¿Qué buscas?", en: "What are you looking for?" },
    fields: [
      { key: "buscoType", kind: "select", label: { es: "Tipo de búsqueda", en: "Request type" }, required: true, options: optionsFromEsEn(BUSCO_TYPE_OPTIONS) },
      { key: "buscoTypeCustom", kind: "text", label: { es: "Describe qué buscas", en: "Describe what you are looking for" }, required: (v) => quickStr(v, "buscoType") === "otro", showWhen: (v) => quickStr(v, "buscoType") === "otro", maxLength: 60 },
      { key: "title", kind: "text", label: { es: "Título", en: "Title" }, placeholder: { es: "Ej. Busco cuna usada en buen estado", en: "e.g. Looking for a used crib in good condition" }, required: true, maxLength: 120 },
      { key: "description", kind: "textarea", label: { es: "Descripción breve", en: "Short description" }, required: true, maxLength: 2000 },
      cityField("canonical"),
      { key: "zone", kind: "text", label: { es: "Zona o vecindario", en: "Area or neighborhood" }, maxLength: 80 },
    ],
  },
  contactStep({ nameKey: null, includeSms: true }),
];

export const buscoQuickAdapter: QuickClassifiedCategoryAdapter = {
  category: "busco",
  steps: STEPS,
  confirmations: { kind: "community", variant: "busco" },
  async buildAndWriteCanonicalDraft({ values, media, confirmations, ctx }) {
    const first = media[0];
    const draft: BuscoQuickDraft = normalizeBuscoQuickDraft({
      ...emptyBuscoQuickDraft(),
      buscoType: quickStr(values, "buscoType") as BuscoTypeSlug,
      buscoTypeCustom: quickStr(values, "buscoTypeCustom"),
      title: quickStr(values, "title"),
      description: quickStr(values, "description"),
      city: resolveCity(values),
      zone: quickStr(values, "zone"),
      phone: quickStr(values, "phone"),
      whatsapp: quickStr(values, "whatsapp"),
      smsPhone: quickStr(values, "smsPhone"),
      email: quickStr(values, "email"),
      imageDataUrl: first?.dataUrl ?? "",
      imageFileName: first?.fileName ?? "",
      publishConfirmations: { ...confirmations },
    });
    const gate = gateBuscoQuickPreview(draft, ctx.lang);
    if (!gate.ok) return { ok: false, issues: gate.issues };
    try {
      sessionStorage.setItem(BUSCO_QUICK_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      return { ok: false, issues: [ctx.lang === "en" ? "Could not save your draft in this browser." : "No se pudo guardar tu borrador en este navegador."] };
    }
    return { ok: true, handoff: { kind: "preview", href: buscoHandoffPreviewUrl(ctx.routeLang as SupportedLang) } };
  },
};
