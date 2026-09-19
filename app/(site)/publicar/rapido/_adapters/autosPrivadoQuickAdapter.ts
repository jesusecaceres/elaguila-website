/** Quick → AUTOS privado. Feeds `AutosPrivadoDraftV1` through the namespaced draft store + preview namespace hint. */

import { createEmptyListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import type { AutoDealerListing, MediaImageEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { withPrivadoLocationDefaults } from "@/app/clasificados/autos/privado/lib/autosPrivadoLocationReady";
import { resolveAutosPrivadoDraftNamespace } from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftNamespace";
import { saveAutosPrivadoDraftResolved } from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftStorage";
import { rememberAutosDraftNamespaceHint } from "@/app/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint";
import { getAutosPreviewCompletenessIssues, type AutosPreviewCompletenessKey } from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import { AUTOS_PUBLISH_FINAL_STEP_INDEX } from "@/app/lib/clasificados/autos/autosEditorDraftStep";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickClassifiedCategoryAdapter, QuickIntakeStep, QuickLang } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickStr, quickWholeDollars } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, contactStep, resolveCity } from "./quickAdapterShared";

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "vehicle",
    title: { es: "Tu vehículo", en: "Your vehicle" },
    fields: [
      { key: "year", kind: "number", label: { es: "Año", en: "Year" }, placeholder: { es: "2016", en: "2016" }, required: true, inputMode: "numeric", maxLength: 4 },
      { key: "make", kind: "text", label: { es: "Marca", en: "Make" }, placeholder: { es: "Toyota", en: "Toyota" }, required: true, maxLength: 40 },
      { key: "model", kind: "text", label: { es: "Modelo", en: "Model" }, placeholder: { es: "Camry", en: "Camry" }, required: true, maxLength: 40 },
      { key: "mileage", kind: "number", label: { es: "Millas", en: "Mileage" }, inputMode: "numeric" },
      { key: "price", kind: "currency", label: { es: "Precio (USD)", en: "Price (USD)" }, required: true, inputMode: "numeric" },
      { key: "description", kind: "textarea", label: { es: "Descripción", en: "Description" }, hint: { es: "Estado, mantenimiento, título limpio, etc.", en: "Condition, maintenance, clean title, etc." }, maxLength: 3000 },
      cityField("free"),
      { key: "zip", kind: "zip", label: { es: "Código postal", en: "ZIP code" }, required: true, inputMode: "numeric", autoComplete: "postal-code" },
    ],
  },
  contactStep({ nameKey: "dealerName", nameLabel: { es: "Tu nombre", en: "Your name" }, nameRequired: false }),
];

const ISSUE_LABELS: Record<AutosPreviewCompletenessKey, { es: string; en: string }> = {
  media: { es: "Sube al menos una foto.", en: "Add at least one photo." },
  title: { es: "Indica año, marca y modelo.", en: "Enter year, make and model." },
  price: { es: "Indica el precio en dólares.", en: "Enter the price in dollars." },
  location: { es: "Indica ciudad y código postal.", en: "Enter city and ZIP code." },
  dealerIdentity: { es: "Indica tu nombre o teléfono.", en: "Enter your name or phone." },
  sellerContact: { es: "Agrega al menos un medio de contacto.", en: "Add at least one contact method." },
};

function issueText(key: AutosPreviewCompletenessKey, lang: QuickLang): string {
  return lang === "en" ? ISSUE_LABELS[key].en : ISSUE_LABELS[key].es;
}

function numberOrUndefined(raw: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export const autosPrivadoQuickAdapter: QuickClassifiedCategoryAdapter = {
  category: "autos",
  steps: STEPS,
  confirmations: { kind: "none" },
  async buildAndWriteCanonicalDraft({ values, media, ctx }) {
    const mediaImages: MediaImageEntry[] = media.map((m, i) => ({ id: m.id, url: m.dataUrl, sourceType: "file", isPrimary: i === 0, sortOrder: i }));
    const listing: AutoDealerListing = withPrivadoLocationDefaults({
      ...createEmptyListing(),
      autosLane: "privado",
      year: numberOrUndefined(quickStr(values, "year")),
      make: quickStr(values, "make") || undefined,
      model: quickStr(values, "model") || undefined,
      mileage: numberOrUndefined(quickWholeDollars(values.mileage)),
      price: numberOrUndefined(quickWholeDollars(values.price)),
      description: quickStr(values, "description") || undefined,
      city: resolveCity(values) || undefined,
      zip: quickStr(values, "zip") || undefined,
      dealerName: quickStr(values, "dealerName") || undefined,
      dealerPhoneMobile: quickStr(values, "phone") || undefined,
      dealerWhatsapp: quickStr(values, "whatsapp") || undefined,
      dealerEmail: quickStr(values, "email") || undefined,
      mediaImages,
      heroImages: mediaImages.map((m) => m.url),
    });
    const issues = getAutosPreviewCompletenessIssues("privado", listing);
    if (issues.length) return { ok: false, issues: issues.map((k) => issueText(k, ctx.lang)) };
    const ns = await resolveAutosPrivadoDraftNamespace();
    rememberAutosDraftNamespaceHint("privado", ns);
    await saveAutosPrivadoDraftResolved(ns, {
      v: 1,
      vehicleTitleOverride: false,
      listing,
      editorStep: AUTOS_PUBLISH_FINAL_STEP_INDEX,
      editorMaxReached: AUTOS_PUBLISH_FINAL_STEP_INDEX,
    });
    return { ok: true, handoff: { kind: "preview", href: withLangParam("/clasificados/autos/privado/preview", ctx.routeLang as SupportedLang) } };
  },
};
