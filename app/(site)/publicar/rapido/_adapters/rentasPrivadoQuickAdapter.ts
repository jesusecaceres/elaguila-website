/** Quick → RENTAS privado. Feeds `RentasPrivadoFormState` through `saveRentasPrivadoDraft` (async, awaited). */

import { mergePartialRentasPrivadoState, type RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { saveRentasPrivadoDraft } from "@/app/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft";
import { gateRentasPrivadoPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import {
  RENTAS_TIPO_DE_RENTA_IDS,
  coerceRentasTipoDeRentaId,
  rentasCategoriaPropiedadForTipo,
  rentasTipoDeRentaOptionLabel,
} from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import { RENTAS_PREVIEW_PRIVADO } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickClassifiedCategoryAdapter, QuickIntakeStep } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickStr, quickWholeDollars } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, contactStep, resolveCity } from "./quickAdapterShared";

const TIPO_OPTIONS = RENTAS_TIPO_DE_RENTA_IDS.map((id) => ({
  value: id,
  label: { es: rentasTipoDeRentaOptionLabel(id, "es"), en: rentasTipoDeRentaOptionLabel(id, "en") },
}));

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "rental",
    title: { es: "¿Qué rentas?", en: "What are you renting out?" },
    fields: [
      { key: "tipoDeRenta", kind: "select", label: { es: "Tipo de renta", en: "Rental type" }, required: true, options: TIPO_OPTIONS },
      { key: "titulo", kind: "text", label: { es: "Título del anuncio", en: "Ad title" }, placeholder: { es: "Ej. Cuarto amueblado en San José", en: "e.g. Furnished room in San José" }, required: true, maxLength: 120 },
      { key: "rentaMensual", kind: "currency", label: { es: "Renta mensual (USD)", en: "Monthly rent (USD)" }, required: true, inputMode: "numeric" },
      { key: "deposito", kind: "currency", label: { es: "Depósito (USD)", en: "Deposit (USD)" }, inputMode: "numeric" },
      { key: "disponibilidad", kind: "date", label: { es: "Disponible desde", en: "Available from" } },
      { key: "descripcion", kind: "textarea", label: { es: "Descripción", en: "Description" }, hint: { es: "Qué incluye, reglas y para quién es.", en: "What is included, rules and who it is for." }, required: true, maxLength: 3000 },
      cityField("free"),
      { key: "direccionCodigoPostal", kind: "zip", label: { es: "Código postal", en: "ZIP code" }, required: true, inputMode: "numeric", autoComplete: "postal-code" },
      { key: "direccionCruceCercano", kind: "text", label: { es: "Cruce de calles o referencia", en: "Cross streets or reference" }, hint: { es: "No pongas tu dirección exacta; solo una referencia pública.", en: "Do not enter your exact address; a public reference is enough." }, required: true, maxLength: 120 },
    ],
  },
  contactStep({ nameKey: "nombre", nameLabel: { es: "Tu nombre (como particular)", en: "Your name (as a private party)" } }),
];

export const rentasPrivadoQuickAdapter: QuickClassifiedCategoryAdapter = {
  category: "rentas",
  steps: STEPS,
  confirmations: { kind: "listing_rules", subject: "property" },
  async buildAndWriteCanonicalDraft({ values, media, confirmations, ctx }) {
    const tipo = coerceRentasTipoDeRentaId(quickStr(values, "tipoDeRenta"));
    const base = mergePartialRentasPrivadoState(null);
    const state: RentasPrivadoFormState = mergePartialRentasPrivadoState({
      tipoDeRenta: tipo,
      categoriaPropiedad: rentasCategoriaPropiedadForTipo(tipo),
      posterType: "owner_private",
      titulo: quickStr(values, "titulo"),
      rentaMensual: quickWholeDollars(values.rentaMensual),
      deposito: quickWholeDollars(values.deposito),
      disponibilidad: quickStr(values, "disponibilidad"),
      descripcion: quickStr(values, "descripcion"),
      ciudad: resolveCity(values),
      direccionEstado: base.direccionEstado || "CA",
      direccionPais: base.direccionPais || "United States",
      direccionCodigoPostal: quickStr(values, "direccionCodigoPostal"),
      direccionCruceCercano: quickStr(values, "direccionCruceCercano"),
      mostrarDireccionExacta: false,
      media: { ...base.media, photoDataUrls: media.map((m) => m.dataUrl), primaryImageIndex: 0 },
      seller: {
        ...base.seller,
        nombre: quickStr(values, "nombre"),
        telefono: quickStr(values, "phone"),
        whatsapp: quickStr(values, "whatsapp"),
        mensajesTexto: quickStr(values, "smsPhone"),
        correo: quickStr(values, "email"),
      },
      confirmListingAccurate: confirmations.infoTruthful,
      confirmPhotosRepresentItem: confirmations.mediaAccurate,
      confirmCommunityRules: confirmations.rulesAccepted,
    });
    const gate = gateRentasPrivadoPreview(state);
    if (!gate.ok) return { ok: false, issues: [gate.message] };
    await saveRentasPrivadoDraft(state);
    return {
      ok: true,
      handoff: {
        kind: "preview",
        href: withClasificadosPublishLang(RENTAS_PREVIEW_PRIVADO, ctx.routeLang as SupportedLang, { [BR_NEGOCIO_Q_PROPIEDAD]: state.categoriaPropiedad }),
      },
    };
  },
};
