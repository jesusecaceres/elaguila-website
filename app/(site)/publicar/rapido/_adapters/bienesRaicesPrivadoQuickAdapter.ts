/** Quick → BIENES RAÍCES privado (FSBO). Feeds `BienesRaicesPrivadoFormState` through `saveBienesRaicesPrivadoDraft`. */

import {
  createEmptyBienesRaicesPrivadoFormState,
  mergePartialBienesRaicesPrivadoState,
  type BienesRaicesPrivadoFormState,
} from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { saveBienesRaicesPrivadoDraft } from "@/app/clasificados/publicar/bienes-raices/privado/application/utils/bienesRaicesPrivadoDraft";
import { gateBienesRaicesPrivadoPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import {
  TIPO_PROPIEDAD_LABEL_EN,
  TIPO_PROPIEDAD_OPCIONES,
  normalizeResidencialTipoPropiedadCodigo,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import { BR_PREVIEW_PRIVADO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { BR_NEGOCIO_Q_PROPIEDAD, type BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickClassifiedCategoryAdapter, QuickIntakeStep } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickStr, quickWholeDollars } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, contactStep, resolveCity } from "./quickAdapterShared";

const CATEGORIA_OPTIONS = [
  { value: "residencial", label: { es: "Casa / vivienda", en: "Home / residential" } },
  { value: "comercial", label: { es: "Comercial", en: "Commercial" } },
  { value: "terreno_lote", label: { es: "Terreno / lote", en: "Land / lot" } },
] as const;

const TIPO_OPTIONS = TIPO_PROPIEDAD_OPCIONES.map((o) => ({ value: o.value, label: { es: o.label, en: TIPO_PROPIEDAD_LABEL_EN[o.value] ?? o.label } }));

const isResidencial = (v: Record<string, unknown>) => quickStr(v as never, "categoriaPropiedad") === "residencial";

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "property",
    title: { es: "Tu propiedad", en: "Your property" },
    fields: [
      { key: "categoriaPropiedad", kind: "chips", maxSelections: 1, label: { es: "Tipo de propiedad", en: "Property type" }, required: true, options: CATEGORIA_OPTIONS },
      { key: "tipoCodigo", kind: "select", label: { es: "Tipo de vivienda", en: "Home type" }, showWhen: isResidencial, options: TIPO_OPTIONS },
      { key: "recamaras", kind: "number", label: { es: "Recámaras", en: "Bedrooms" }, showWhen: isResidencial, inputMode: "numeric" },
      { key: "banos", kind: "number", label: { es: "Baños", en: "Bathrooms" }, showWhen: isResidencial, inputMode: "decimal" },
      { key: "titulo", kind: "text", label: { es: "Título del anuncio", en: "Ad title" }, placeholder: { es: "Ej. Casa de 3 recámaras en Gilroy", en: "e.g. 3-bedroom house in Gilroy" }, required: true, maxLength: 120 },
      { key: "precio", kind: "currency", label: { es: "Precio (USD)", en: "Price (USD)" }, required: true, inputMode: "numeric" },
      { key: "petsAllowed", kind: "chips", maxSelections: 1, label: { es: "¿Se permiten mascotas?", en: "Pets allowed?" }, required: true, options: [{ value: "yes", label: { es: "Sí", en: "Yes" } }, { value: "no", label: { es: "No", en: "No" } }] },
      { key: "descripcion", kind: "textarea", label: { es: "Descripción", en: "Description" }, required: true, maxLength: 3000 },
      cityField("free"),
      { key: "ubicacionLinea", kind: "text", label: { es: "Zona, colonia o referencia", en: "Area, neighborhood or reference" }, hint: { es: "No es necesario poner la dirección exacta.", en: "No need to enter the exact address." }, maxLength: 120 },
    ],
  },
  contactStep({ nameKey: "nombre", nameLabel: { es: "Tu nombre (dueño directo)", en: "Your name (owner)" }, includeSms: true }),
];

export const bienesRaicesPrivadoQuickAdapter: QuickClassifiedCategoryAdapter = {
  category: "bienes-raices",
  steps: STEPS,
  confirmations: { kind: "listing_rules", subject: "property" },
  async buildAndWriteCanonicalDraft({ values, media, confirmations, ctx }) {
    const base = createEmptyBienesRaicesPrivadoFormState();
    const catRaw = quickStr(values, "categoriaPropiedad");
    const categoriaPropiedad: BrNegocioCategoriaPropiedad = catRaw === "comercial" || catRaw === "terreno_lote" ? catRaw : "residencial";
    const pets = quickStr(values, "petsAllowed");
    const state: BienesRaicesPrivadoFormState = mergePartialBienesRaicesPrivadoState({
      categoriaPropiedad,
      titulo: quickStr(values, "titulo"),
      precio: quickWholeDollars(values.precio),
      ciudad: resolveCity(values),
      ubicacionLinea: quickStr(values, "ubicacionLinea"),
      descripcion: quickStr(values, "descripcion"),
      petsAllowed: pets === "yes" || pets === "no" ? pets : "",
      media: { ...base.media, photoDataUrls: media.map((m) => m.dataUrl), primaryImageIndex: 0 },
      seller: {
        ...base.seller,
        nombre: quickStr(values, "nombre"),
        telefono: quickStr(values, "phone"),
        whatsapp: quickStr(values, "whatsapp"),
        mensajesTexto: quickStr(values, "smsPhone"),
        correo: quickStr(values, "email"),
      },
      residencial:
        categoriaPropiedad === "residencial"
          ? {
              ...base.residencial,
              tipoCodigo: quickStr(values, "tipoCodigo") ? normalizeResidencialTipoPropiedadCodigo(quickStr(values, "tipoCodigo")) : base.residencial.tipoCodigo,
              recamaras: quickStr(values, "recamaras"),
              banos: quickStr(values, "banos"),
            }
          : base.residencial,
      confirmListingAccurate: confirmations.infoTruthful,
      confirmPhotosRepresentItem: confirmations.mediaAccurate,
      confirmCommunityRules: confirmations.rulesAccepted,
    });
    const gate = gateBienesRaicesPrivadoPreview(state);
    if (!gate.ok) return { ok: false, issues: [gate.message] };
    await saveBienesRaicesPrivadoDraft(state);
    return {
      ok: true,
      handoff: {
        kind: "preview",
        href: withClasificadosPublishLang(BR_PREVIEW_PRIVADO, ctx.routeLang as SupportedLang, { [BR_NEGOCIO_Q_PROPIEDAD]: state.categoriaPropiedad }),
      },
    };
  },
};
