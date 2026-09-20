/**
 * Quick Business → AUTOS DEALER. Dealer identity + the customer's FIRST REAL vehicle → the EXISTING
 * `AutosNegociosDraftV1` (namespaced session + IndexedDB store used by the Full dealer application) → the EXISTING
 * `/clasificados/autos/negocios/preview`, which owns the pending row (`POST /api/clasificados/autos/listings`,
 * lane `negocios`), the dealer checkout, photo upload and the activation RPC. Nothing is fabricated: year / make /
 * model / price and the vehicle photos are the customer's own answers; mileage, VIN, trim and condition stay
 * undefined unless typed.
 *
 * The handoff carries the Quick plan marker, so that shared preview charges the Quick package
 * (`autos_dealer_quick_monthly`, SIMPLE, ONE active vehicle) rather than the Full dealer package
 * with its ten-vehicle allowance.
 */

import { createEmptyListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { resolveAutosNegociosDraftNamespace } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftNamespace";
import { saveAutosNegociosDraftResolved } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftStorage";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { withQuickPlanParam } from "@/app/lib/listingPlans/businessQuickPlanSignal";
import type { AutoDealerListing, MediaImageEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { rememberAutosDraftNamespaceHint } from "@/app/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint";
import { getAutosPreviewCompletenessIssues, type AutosPreviewCompletenessKey } from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import { syncDealerAddressFromStructured } from "@/app/lib/clasificados/autos/autosDealerStructuredAddress";
import { AUTOS_PUBLISH_FINAL_STEP_INDEX } from "@/app/lib/clasificados/autos/autosEditorDraftStep";
import { AUTOS_DEFAULT_COUNTRY, AUTOS_DEFAULT_STATE } from "@/app/lib/clasificados/autos/autosLocationContract";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickBusinessCategoryAdapter } from "@/app/lib/quickBusiness/quickBusinessTypes";
import type { QuickIntakeStep, QuickLang } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickStr, quickWholeDollars } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { buildVehicleTitle } from "@/app/publicar/autos/negocios/lib/autoDealerTitle";
import { cityField, resolveCity } from "@/app/publicar/rapido/_adapters/quickAdapterShared";
import { BUSINESS_CONTACT_AT_LEAST_ONE } from "./quickBusinessAdapterShared";

/** Existing preview route (registry `AUTOS_NEGOCIOS_ADAPTER` preview / `AutosNegociosApplication.tsx` previewHref). */
const AUTOS_DEALER_PREVIEW_ROUTE = "/clasificados/autos/negocios/preview";

const CONDITION_OPTIONS = [
  { value: "new", label: { es: "Nuevo", en: "New" } },
  { value: "used", label: { es: "Usado", en: "Used" } },
  { value: "certified", label: { es: "Certificado", en: "Certified" } },
] as const;

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "dealer",
    title: { es: "Tu negocio", en: "Your dealership" },
    intro: { es: "Así aparece tu concesionario en cada vehículo que publiques.", en: "This is how your dealership appears on every vehicle you list." },
    fields: [
      { key: "dealerName", kind: "text", label: { es: "Nombre del negocio", en: "Business name" }, placeholder: { es: "Ej. Autos García", en: "e.g. García Motors" }, required: true, maxLength: 80 },
      cityField("free", { es: "Ciudad del negocio", en: "Business city" }),
      { key: "zip", kind: "zip", label: { es: "Código postal del negocio", en: "Business ZIP code" }, required: true, inputMode: "numeric", autoComplete: "postal-code" },
      { key: "phone", kind: "phone", label: { es: "Teléfono del negocio", en: "Business phone" }, placeholder: { es: "(408) 555-0123", en: "(408) 555-0123" }, autoComplete: "tel", inputMode: "tel" },
      { key: "whatsapp", kind: "phone", label: { es: "WhatsApp", en: "WhatsApp" }, hint: { es: "Si es el mismo número, escríbelo también aquí.", en: "If it is the same number, enter it here too." }, inputMode: "tel" },
      { key: "email", kind: "email", label: { es: "Correo electrónico", en: "Email" }, autoComplete: "email", inputMode: "email" },
      { key: "website", kind: "text", label: { es: "Sitio web (opcional)", en: "Website (optional)" }, placeholder: { es: "https://…", en: "https://…" }, autoComplete: "url", maxLength: 200 },
    ],
    atLeastOne: { keys: ["phone", "whatsapp", "email", "website"], message: BUSINESS_CONTACT_AT_LEAST_ONE },
  },
  {
    id: "vehicle",
    title: { es: "Tu primer vehículo", en: "Your first vehicle" },
    intro: { es: "Un vehículo real de tu inventario. Podrás agregar más desde tu panel.", en: "A real vehicle from your inventory. You can add more from your dashboard." },
    fields: [
      { key: "year", kind: "number", label: { es: "Año", en: "Year" }, placeholder: { es: "2019", en: "2019" }, required: true, inputMode: "numeric", maxLength: 4 },
      { key: "make", kind: "text", label: { es: "Marca", en: "Make" }, placeholder: { es: "Toyota", en: "Toyota" }, required: true, maxLength: 40 },
      { key: "model", kind: "text", label: { es: "Modelo", en: "Model" }, placeholder: { es: "Camry", en: "Camry" }, required: true, maxLength: 40 },
      { key: "trim", kind: "text", label: { es: "Versión (opcional)", en: "Trim (optional)" }, placeholder: { es: "LE, XLE, Sport…", en: "LE, XLE, Sport…" }, maxLength: 40 },
      { key: "condition", kind: "select", label: { es: "Condición (opcional)", en: "Condition (optional)" }, options: CONDITION_OPTIONS },
      { key: "mileage", kind: "number", label: { es: "Millas (opcional)", en: "Mileage (optional)" }, inputMode: "numeric" },
      { key: "price", kind: "currency", label: { es: "Precio (USD)", en: "Price (USD)" }, required: true, inputMode: "numeric" },
      { key: "vin", kind: "text", label: { es: "VIN (opcional)", en: "VIN (optional)" }, hint: { es: "17 caracteres. Puedes agregarlo después desde tu panel.", en: "17 characters. You can add it later from your dashboard." }, maxLength: 17 },
      { key: "description", kind: "textarea", label: { es: "Descripción (opcional)", en: "Description (optional)" }, hint: { es: "Título limpio, un dueño, mantenimiento, etc.", en: "Clean title, one owner, maintenance, etc." }, maxLength: 3000 },
    ],
  },
];

/** Same keys the canonical validator returns; wording adapted to the dealer + first-vehicle intake. */
const ISSUE_LABELS: Record<AutosPreviewCompletenessKey, { es: string; en: string }> = {
  media: { es: "Sube al menos una foto real del vehículo.", en: "Add at least one real photo of the vehicle." },
  title: { es: "Indica año, marca y modelo del vehículo.", en: "Enter the vehicle's year, make and model." },
  price: { es: "Indica el precio del vehículo en dólares.", en: "Enter the vehicle price in dollars." },
  location: { es: "Indica la ciudad y el código postal del negocio.", en: "Enter the business city and ZIP code." },
  dealerIdentity: { es: "Indica el nombre de tu negocio.", en: "Enter your business name." },
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

function conditionOrUndefined(raw: string): AutoDealerListing["condition"] {
  return raw === "new" || raw === "used" || raw === "certified" ? raw : undefined;
}

export const autosDealerQuickBusinessAdapter: QuickBusinessCategoryAdapter = {
  category: "autos-dealer",
  steps: STEPS,
  // The Full dealer application has no pre-preview confirmation checkboxes (AutosApplicationFinalActions gates on
  // completeness only; publish confirmations live on the existing confirm / checkout surfaces).
  confirmations: { kind: "none" },
  async buildAndWriteCanonicalDraft({ values, media, ctx }) {
    // Existing vehicle media shape (`MediaImageEntry`, `sourceType: "file"`): the preview's existing
    // `resolveAutosDraftPhotosForPublish` uploads these exactly as it does for the Full application.
    const mediaImages: MediaImageEntry[] = media.map((m, i) => ({ id: m.id, url: m.dataUrl, sourceType: "file", isPrimary: i === 0, sortOrder: i }));
    const year = numberOrUndefined(quickStr(values, "year"));
    const make = quickStr(values, "make") || undefined;
    const model = quickStr(values, "model") || undefined;
    const trim = quickStr(values, "trim") || undefined;
    // The vehicle sits at the dealership, so the business city / ZIP is the vehicle's location too.
    const city = resolveCity(values) || undefined;
    const zip = quickStr(values, "zip") || undefined;
    const listing: AutoDealerListing = syncDealerAddressFromStructured({
      ...createEmptyListing(),
      autosLane: "negocios",
      // Same derivation as the Full flush (`applyAutoTitle` → `buildVehicleTitle`), from the customer's own answers.
      vehicleTitle: buildVehicleTitle(year, make, model, trim) || undefined,
      year,
      make,
      model,
      trim,
      condition: conditionOrUndefined(quickStr(values, "condition")),
      mileage: numberOrUndefined(quickWholeDollars(values.mileage)),
      price: numberOrUndefined(quickWholeDollars(values.price)),
      vin: quickStr(values, "vin") || undefined,
      description: quickStr(values, "description") || undefined,
      city,
      zip,
      // Same visible defaults the Full vehicle step selects display (`AutosNegociosVehicleApplicationSteps.tsx`
      // state select falls back to AUTOS_DEFAULT_STATE) — identical to the certified Autos privado Quick adapter.
      state: AUTOS_DEFAULT_STATE,
      country: AUTOS_DEFAULT_COUNTRY,
      dealerName: quickStr(values, "dealerName") || undefined,
      dealerPhoneOffice: quickStr(values, "phone") || undefined,
      dealerWhatsapp: quickStr(values, "whatsapp") || undefined,
      dealerEmail: quickStr(values, "email") || undefined,
      dealerWebsite: quickStr(values, "website") || undefined,
      dealerAddressCity: city,
      dealerAddressZip: zip,
      dealerAddressCountry: AUTOS_DEFAULT_COUNTRY,
      mediaImages,
      heroImages: mediaImages.map((m) => m.url),
    });
    const issues = getAutosPreviewCompletenessIssues("negocios", listing);
    if (issues.length) return { ok: false, issues: issues.map((k) => issueText(k, ctx.lang)) };
    const ns = await resolveAutosNegociosDraftNamespace();
    rememberAutosDraftNamespaceHint("negocios", ns);
    await saveAutosNegociosDraftResolved(ns, {
      v: 1,
      vehicleTitleOverride: false,
      listing,
      editorStep: AUTOS_PUBLISH_FINAL_STEP_INDEX,
      editorMaxReached: AUTOS_PUBLISH_FINAL_STEP_INDEX,
      // First vehicle only — no bundled children; the included allowance and the inventory pack are untouched.
      additionalInventoryVehicles: [],
    });
    return {
      ok: true,
      handoff: {
        kind: "preview",
        href: withQuickPlanParam(withLangParam(AUTOS_DEALER_PREVIEW_ROUTE, ctx.routeLang as SupportedLang)),
      },
    };
  },
};
