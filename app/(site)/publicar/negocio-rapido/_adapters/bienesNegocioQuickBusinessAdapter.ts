/**
 * Quick Business → BIENES RAÍCES NEGOCIO / AGENT. Professional identity + the customer's FIRST REAL property → the
 * EXISTING `AgenteIndividualResidencialFormState` (canonical merge + instance-scoped preview draft store used by the
 * Full agente application) → the EXISTING `…/negocio/agente-individual/preview`, which owns the pending insert
 * (`publishLeonixListingFromAgenteResidencialDraft`, `activationMode: "pending_payment"`), the agent checkout, the
 * `listing-images` upload and the lifecycle RPCs. Nothing is fabricated: title, price, city, property type,
 * condition and the property photos are the customer's own answers; license, brokerage, beds, baths, sqft, address
 * and amenities stay empty unless typed.
 *
 * The handoff carries the Quick plan marker, so that shared preview charges the Quick package
 * (`br_agent_quick_monthly`, SIMPLE, ONE active property) rather than the Full agent package.
 */

import { type BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { gateBienesRaicesNegocioPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import { withBrAgenteResLangParam } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialLang";
import { withQuickPlanParam } from "@/app/lib/listingPlans/businessQuickPlanSignal";
import {
  createBrAgenteResApplicationInstanceId,
  persistAgenteResApplicationDraftResolved,
  readAgenteResPreviewDraftRawForApplication,
  withBrAgenteResApplicationInstanceParam,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft";
import {
  COMERCIAL_TIPO_LABEL_EN,
  COMERCIAL_TIPO_OPCIONES,
  TERRENO_TIPO_LABEL_EN,
  TERRENO_TIPO_OPCIONES,
  normalizeComercialTipoCodigo,
  normalizeTerrenoTipoCodigo,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";
import {
  mergePartialAgenteIndividualResidencial,
  type AgenteIndividualResidencialFormState,
  type AgenteResidencialCondicionPropiedad,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import {
  TIPO_PROPIEDAD_LABEL_EN,
  TIPO_PROPIEDAD_OPCIONES,
  normalizeResidencialTipoPropiedadCodigo,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import { mapAgenteResidencialFormStateToNegocioForPublish } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish";
import { brAgenteApplicationPricingCopy } from "@/app/clasificados/publicar/bienes-raices/shared/brAgenteApplicationPricingCopy";
import type { QuickBusinessCategoryAdapter } from "@/app/lib/quickBusiness/quickBusinessTypes";
import type { QuickIntakeStep, QuickIntakeValues } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickStr, quickWholeDollars } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, resolveCity } from "@/app/publicar/rapido/_adapters/quickAdapterShared";
import { BUSINESS_CONTACT_AT_LEAST_ONE } from "./quickBusinessAdapterShared";

/** Existing preview route (`AgenteIndividualResidencialApplication.tsx` BR_AGENTE_RES_PREVIEW_ROUTE). */
const BR_AGENTE_PREVIEW_ROUTE = "/clasificados/publicar/bienes-raices/negocio/agente-individual/preview";

const CATEGORIA_OPTIONS = [
  { value: "residencial", label: { es: "Residencial", en: "Residential" } },
  { value: "comercial", label: { es: "Comercial", en: "Commercial" } },
  { value: "terreno_lote", label: { es: "Terreno / lote", en: "Land / lot" } },
] as const;

const TIPO_OPTIONS = TIPO_PROPIEDAD_OPCIONES.map((o) => ({ value: o.value, label: { es: o.label, en: TIPO_PROPIEDAD_LABEL_EN[o.value] ?? o.label } }));
const COMERCIAL_OPTIONS = COMERCIAL_TIPO_OPCIONES.map((o) => ({ value: o.value, label: { es: o.label, en: COMERCIAL_TIPO_LABEL_EN[o.value] ?? o.label } }));
const TERRENO_OPTIONS = TERRENO_TIPO_OPCIONES.map((o) => ({ value: o.value, label: { es: o.label, en: TERRENO_TIPO_LABEL_EN[o.value] ?? o.label } }));

/** Canonical `AgenteResidencialCondicionPropiedad` values — asked explicitly so no default condition is published. */
const CONDICION_OPTIONS = [
  { value: "excelente", label: { es: "Excelente", en: "Excellent" } },
  { value: "buena", label: { es: "Buena", en: "Good" } },
  { value: "regular", label: { es: "Regular", en: "Fair" } },
  { value: "necesita_reparacion", label: { es: "Necesita reparación", en: "Needs repair" } },
] as const;

const isResidencial = (v: QuickIntakeValues) => quickStr(v, "categoriaPropiedad") === "residencial";
const isComercial = (v: QuickIntakeValues) => quickStr(v, "categoriaPropiedad") === "comercial";
const isTerreno = (v: QuickIntakeValues) => quickStr(v, "categoriaPropiedad") === "terreno_lote";

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "agent",
    title: { es: "Tu perfil", en: "Your profile" },
    intro: { es: "Así aparece tu tarjeta de agente en cada propiedad que publiques.", en: "This is how your agent card appears on every property you list." },
    fields: [
      { key: "agenteNombre", kind: "text", label: { es: "Tu nombre", en: "Your name" }, placeholder: { es: "María López", en: "María López" }, required: true, autoComplete: "name", maxLength: 80 },
      { key: "agenteTitulo", kind: "text", label: { es: "Título (opcional)", en: "Title (optional)" }, placeholder: { es: "Agente de bienes raíces", en: "Real estate agent" }, maxLength: 80 },
      { key: "agenteLicencia", kind: "text", label: { es: "Licencia DRE (opcional)", en: "DRE license (optional)" }, maxLength: 40 },
      { key: "marcaNombre", kind: "text", label: { es: "Brokerage / oficina (opcional)", en: "Brokerage / office (optional)" }, maxLength: 80 },
      { key: "phone", kind: "phone", label: { es: "Teléfono", en: "Phone" }, placeholder: { es: "(408) 555-0123", en: "(408) 555-0123" }, autoComplete: "tel", inputMode: "tel" },
      // Bible §10.1: SMS explicit — distinct from phone; canonical model derives SMS CTA from agenteTelefonoPersonal
      // (no separate SMS field in AgenteIndividualResidencialFormState), so this collected value is advisory only.
      { key: "sms", kind: "phone", label: { es: "SMS / mensajes de texto", en: "SMS / text messages" }, hint: { es: "Número para mensajes de texto (si es distinto al teléfono).", en: "Number for text messages (if different from your phone)." }, inputMode: "tel" },
      { key: "whatsapp", kind: "phone", label: { es: "WhatsApp", en: "WhatsApp" }, hint: { es: "Si es el mismo número, escríbelo también aquí.", en: "If it is the same number, enter it here too." }, inputMode: "tel" },
      { key: "email", kind: "email", label: { es: "Correo electrónico", en: "Email" }, autoComplete: "email", inputMode: "email" },
      { key: "website", kind: "text", label: { es: "Sitio web (opcional)", en: "Website (optional)" }, placeholder: { es: "https://…", en: "https://…" }, autoComplete: "url", maxLength: 200 },
    ],
    // Bible §10.1: email and website cannot satisfy the direct-contact minimum; SMS is independent of phone.
    atLeastOne: { keys: ["phone", "sms", "whatsapp"], message: BUSINESS_CONTACT_AT_LEAST_ONE },
  },
  {
    id: "property",
    title: { es: "Tu primera propiedad", en: "Your first property" },
    intro: { es: "Una propiedad real en venta. Podrás agregar más desde tu panel.", en: "A real property for sale. You can add more from your dashboard." },
    fields: [
      { key: "categoriaPropiedad", kind: "chips", maxSelections: 1, label: { es: "Tipo de propiedad", en: "Property type" }, required: true, options: CATEGORIA_OPTIONS },
      { key: "tipoCodigo", kind: "select", label: { es: "Tipo de vivienda", en: "Home type" }, required: true, showWhen: isResidencial, options: TIPO_OPTIONS },
      { key: "comercialTipoCodigo", kind: "select", label: { es: "Tipo de propiedad comercial", en: "Commercial property type" }, required: true, showWhen: isComercial, options: COMERCIAL_OPTIONS },
      { key: "terrenoTipoCodigo", kind: "select", label: { es: "Tipo de terreno", en: "Land type" }, required: true, showWhen: isTerreno, options: TERRENO_OPTIONS },
      { key: "recamaras", kind: "number", label: { es: "Recámaras (opcional)", en: "Bedrooms (optional)" }, showWhen: isResidencial, inputMode: "numeric" },
      { key: "banos", kind: "number", label: { es: "Baños (opcional)", en: "Bathrooms (optional)" }, showWhen: isResidencial, inputMode: "decimal" },
      { key: "titulo", kind: "text", label: { es: "Título del anuncio", en: "Listing title" }, placeholder: { es: "Ej. Casa de 3 recámaras en Gilroy", en: "e.g. 3-bedroom house in Gilroy" }, required: true, maxLength: 120 },
      { key: "precio", kind: "currency", label: { es: "Precio (USD)", en: "Price (USD)" }, required: true, inputMode: "numeric" },
      { key: "condicionPropiedad", kind: "select", label: { es: "Condición de la propiedad", en: "Property condition" }, required: true, options: CONDICION_OPTIONS },
      { key: "descripcion", kind: "textarea", label: { es: "Descripción (opcional)", en: "Description (optional)" }, maxLength: 3000 },
      cityField("free"),
      { key: "areaCiudad", kind: "text", label: { es: "Zona, colonia o referencia (opcional)", en: "Area, neighborhood or reference (optional)" }, hint: { es: "No es necesario poner la dirección exacta.", en: "No need to enter the exact address." }, maxLength: 120 },
      { key: "zip", kind: "zip", label: { es: "Código postal (opcional)", en: "ZIP code (optional)" }, inputMode: "numeric", autoComplete: "postal-code" },
    ],
  },
];

function condicionOrUndefined(raw: string): AgenteResidencialCondicionPropiedad | undefined {
  return raw === "excelente" || raw === "buena" || raw === "regular" || raw === "necesita_reparacion" ? raw : undefined;
}

export const bienesNegocioQuickBusinessAdapter: QuickBusinessCategoryAdapter = {
  category: "bienes-negocio",
  steps: STEPS,
  // Exactly the four booleans the Full agente application requires before it opens its preview (`confirmAll`).
  confirmations: { kind: "property_agent" },
  async buildAndWriteCanonicalDraft({ values, media, confirmations, ctx }) {
    // Bible §10.1: explicit SMS field collected; AgenteIndividualResidencialFormState has no dedicated SMS field.
    // SMS CTA auto-derives from agenteTelefonoPersonal. REPAIR_TARGET: add smsTelefono to the canonical model.
    void quickStr(values, "sms");
    const catRaw = quickStr(values, "categoriaPropiedad");
    const categoriaPropiedad: BrNegocioCategoriaPropiedad = catRaw === "comercial" || catRaw === "terreno_lote" ? catRaw : "residencial";
    const condicionPropiedad = condicionOrUndefined(quickStr(values, "condicionPropiedad"));
    const state: AgenteIndividualResidencialFormState = mergePartialAgenteIndividualResidencial({
      sellerTipo: "agente_individual",
      categoriaPropiedad,
      // Property (customer's own answers). Type codes only for the chosen category; the others keep no meaning.
      tipoPropiedadCodigo: categoriaPropiedad === "residencial" ? normalizeResidencialTipoPropiedadCodigo(quickStr(values, "tipoCodigo")) : undefined,
      comercialTipoCodigo: categoriaPropiedad === "comercial" ? normalizeComercialTipoCodigo(quickStr(values, "comercialTipoCodigo")) : undefined,
      terrenoTipoCodigo: categoriaPropiedad === "terreno_lote" ? normalizeTerrenoTipoCodigo(quickStr(values, "terrenoTipoCodigo")) : undefined,
      recamaras: categoriaPropiedad === "residencial" ? quickStr(values, "recamaras") : "",
      banos: categoriaPropiedad === "residencial" ? quickStr(values, "banos") : "",
      titulo: quickStr(values, "titulo"),
      precio: quickWholeDollars(values.precio),
      ...(condicionPropiedad ? { condicionPropiedad } : {}),
      descripcionPrincipal: quickStr(values, "descripcion"),
      ciudad: resolveCity(values),
      areaCiudad: quickStr(values, "areaCiudad"),
      direccionCodigoPostal: quickStr(values, "zip"),
      // Existing property media shape: `fotosDataUrls` + cover index (offloaded to IndexedDB by the canonical store).
      fotosDataUrls: media.map((m) => m.dataUrl),
      fotoPortadaIndex: 0,
      // Agent card (customer's own answers; license / brokerage stay empty unless typed).
      agenteNombre: quickStr(values, "agenteNombre"),
      agenteTitulo: quickStr(values, "agenteTitulo"),
      agenteLicencia: quickStr(values, "agenteLicencia"),
      marcaNombre: quickStr(values, "marcaNombre"),
      agenteTelefonoPersonal: quickStr(values, "phone"),
      agenteWhatsapp: quickStr(values, "whatsapp"),
      correoPrincipal: quickStr(values, "email"),
      agenteSitioWeb: quickStr(values, "website"),
      confirmListingAccurate: confirmations.infoTruthful,
      confirmPhotosRepresentItem: confirmations.mediaAccurate,
      confirmCommunityRules: confirmations.rulesAccepted,
      confirmPaymentAfterPreview: confirmations.paymentAfterPreview,
    });
    // Same pre-preview requirement as the Full application (`confirmAll` in AgenteIndividualResidencialApplication.tsx).
    if (!(state.confirmListingAccurate && state.confirmPhotosRepresentItem && state.confirmCommunityRules && state.confirmPaymentAfterPreview)) {
      return { ok: false, issues: [brAgenteApplicationPricingCopy(ctx.lang).confirmIntro] };
    }
    // Category's own required-for-preview gate, run on the same canonical mapping the preview publishes through.
    const gate = gateBienesRaicesNegocioPreview(mapAgenteResidencialFormStateToNegocioForPublish(state));
    if (!gate.ok) return { ok: false, issues: [gate.message] };
    // Fresh application instance → the preview reads exactly this draft (`?applicationInstanceId=`), never a stale Full draft.
    const applicationInstanceId = createBrAgenteResApplicationInstanceId();
    await persistAgenteResApplicationDraftResolved(state, { applicationInstanceId, writeReturn: true });
    if (!readAgenteResPreviewDraftRawForApplication({ applicationInstanceId })) {
      return { ok: false, issues: [ctx.lang === "en" ? "We could not save your draft in this browser. Please try again." : "No pudimos guardar tu borrador en este navegador. Inténtalo de nuevo."] };
    }
    return {
      ok: true,
      handoff: {
        kind: "preview",
        href: withQuickPlanParam(
          withBrAgenteResLangParam(
            withBrAgenteResApplicationInstanceParam(BR_AGENTE_PREVIEW_ROUTE, applicationInstanceId),
            ctx.lang,
          ),
        ),
      },
    };
  },
};
