/** Quick → EN VENTA (pro lane). Feeds `EnVentaFreeApplicationState` through the existing preview draft store. */

import { createEmptyEnVentaFreeState, type EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { persistEnVentaPreviewHandoffAsync } from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import { collectEnVentaCoreBlockers } from "@/app/clasificados/en-venta/publish/enVentaPublishValidation";
import {
  EN_VENTA_DEPARTMENTS,
  EN_VENTA_PUBLISH_CONDITION_OPTIONS,
  getItemTypesForSelection,
} from "@/app/clasificados/en-venta/shared/fields/enVentaTaxonomy";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickClassifiedCategoryAdapter, QuickIntakeStep } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickBool, quickStr, quickWholeDollars } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, contactStep, optionsFromEsEn, optionsFromLabelObj, resolveCity } from "./quickAdapterShared";

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "item",
    title: { es: "¿Qué vendes?", en: "What are you selling?" },
    fields: [
      { key: "rama", kind: "select", label: { es: "Departamento", en: "Department" }, required: true, options: EN_VENTA_DEPARTMENTS.map((d) => ({ value: d.key, label: d.label })) },
      {
        key: "itemType",
        kind: "select",
        label: { es: "Tipo de artículo", en: "Item type" },
        required: true,
        showWhen: (v) => Boolean(quickStr(v, "rama")),
        options: (v) => optionsFromLabelObj(getItemTypesForSelection(quickStr(v, "rama"))),
      },
      { key: "condition", kind: "chips", maxSelections: 1, label: { es: "Condición", en: "Condition" }, required: true, options: optionsFromEsEn(EN_VENTA_PUBLISH_CONDITION_OPTIONS) },
      { key: "title", kind: "text", label: { es: "Título del anuncio", en: "Ad title" }, placeholder: { es: "Ej. Refrigerador Samsung 2 puertas", en: "e.g. Samsung 2-door refrigerator" }, required: true, maxLength: 120 },
      { key: "priceIsFree", kind: "toggle", label: { es: "Lo regalo (gratis)", en: "Giving it away (free)" } },
      { key: "price", kind: "currency", label: { es: "Precio (USD)", en: "Price (USD)" }, required: (v) => !quickBool(v, "priceIsFree"), showWhen: (v) => !quickBool(v, "priceIsFree"), inputMode: "decimal" },
      { key: "description", kind: "textarea", label: { es: "Descripción", en: "Description" }, hint: { es: "Qué es, cómo está y por qué lo vendes.", en: "What it is, its condition and why you are selling." }, required: true, maxLength: 2000 },
      cityField("free"),
      { key: "zip", kind: "zip", label: { es: "Código postal", en: "ZIP code" }, hint: { es: "Opcional — ayuda a que te encuentren cerca.", en: "Optional — helps nearby buyers find you." }, inputMode: "numeric", autoComplete: "postal-code" },
    ],
  },
  contactStep({ nameKey: "displayName", nameLabel: { es: "Tu nombre (como aparecerá)", en: "Your name (as shown)" } }),
];

function contactMethodFor(state: Pick<EnVentaFreeApplicationState, "phone" | "email" | "whatsapp">): EnVentaFreeApplicationState["contactMethod"] {
  const p = Boolean(state.phone), e = Boolean(state.email), w = Boolean(state.whatsapp);
  if (p && e) return "both";
  if (p) return "phone";
  if (e) return "email";
  if (w) return "whatsapp";
  return "both";
}

export const enVentaQuickAdapter: QuickClassifiedCategoryAdapter = {
  category: "en-venta",
  steps: STEPS,
  confirmations: { kind: "listing_rules", subject: "item" },
  async buildAndWriteCanonicalDraft({ values, media, confirmations, ctx }) {
    const base = createEmptyEnVentaFreeState();
    const priceIsFree = quickBool(values, "priceIsFree");
    const contact = { phone: quickStr(values, "phone"), email: quickStr(values, "email"), whatsapp: quickStr(values, "whatsapp") };
    const state: EnVentaFreeApplicationState = {
      ...base,
      rama: quickStr(values, "rama"),
      itemType: quickStr(values, "itemType"),
      condition: quickStr(values, "condition"),
      title: quickStr(values, "title"),
      priceIsFree,
      price: priceIsFree ? "" : quickWholeDollars(values.price),
      description: quickStr(values, "description"),
      images: media.map((m) => m.dataUrl),
      primaryImageIndex: 0,
      city: resolveCity(values),
      zip: quickStr(values, "zip"),
      seller_kind: "individual",
      displayName: quickStr(values, "displayName"),
      ...contact,
      contactMethod: contactMethodFor(contact),
      confirmListingAccurate: confirmations.infoTruthful,
      confirmPhotosRepresentItem: confirmations.mediaAccurate,
      confirmCommunityRules: confirmations.rulesAccepted,
    };
    const blockers = collectEnVentaCoreBlockers(ctx.lang, state);
    if (blockers.length) return { ok: false, issues: blockers };
    const saved = await persistEnVentaPreviewHandoffAsync("pro", state);
    if (!saved) return { ok: false, issues: [ctx.lang === "en" ? "Could not save your draft in this browser." : "No se pudo guardar tu borrador en este navegador."] };
    return {
      ok: true,
      handoff: { kind: "preview", href: withClasificadosPublishLang("/clasificados/en-venta/preview", ctx.routeLang as SupportedLang, { plan: "pro" }) },
    };
  },
};
