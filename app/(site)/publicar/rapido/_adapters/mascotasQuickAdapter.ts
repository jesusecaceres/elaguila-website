/** Quick → MASCOTAS Y PERDIDOS. Feeds `MascotasPerdidosQuickDraft` under its canonical session key. */

import { emptyMascotasPerdidosQuickDraft, normalizeMascotasPerdidosQuickDraft } from "@/app/publicar/mascotas-y-perdidos/shared/mascotasPerdidosQuickDraft";
import { MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY } from "@/app/publicar/mascotas-y-perdidos/shared/mascotasPerdidosSessionKeys";
import { mascotasPerdidosHandoffPreviewUrl } from "@/app/publicar/mascotas-y-perdidos/shared/mascotasPerdidosPublishRoutes";
import { gateMascotasPerdidosQuickPreview } from "@/app/publicar/mascotas-y-perdidos/shared/mascotasPerdidosRequiredForPreview";
import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "@/app/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";
import { isPetNoticeType, type MascotasPerdidosNoticeTypeSlug, type MascotasPerdidosQuickDraft } from "@/app/publicar/mascotas-y-perdidos/shared/mascotasPerdidosQuickTypes";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickClassifiedCategoryAdapter, QuickIntakeStep, QuickIntakeValues } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickStr } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, contactStep, mediaToEmpleosImageItems, optionsFromEsEn, resolveCity } from "./quickAdapterShared";

const notice = (v: QuickIntakeValues) => quickStr(v, "noticeType") as MascotasPerdidosNoticeTypeSlug;
const isPet = (v: QuickIntakeValues) => isPetNoticeType(notice(v));
const isObject = (v: QuickIntakeValues) => notice(v) === "objeto-perdido" || notice(v) === "objeto-encontrado";
const isLost = (v: QuickIntakeValues) => notice(v) === "mascota-perdida" || notice(v) === "objeto-perdido";
const isFound = (v: QuickIntakeValues) => notice(v) === "mascota-encontrada" || notice(v) === "objeto-encontrado";

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "notice",
    title: { es: "Tu aviso", en: "Your notice" },
    fields: [
      { key: "noticeType", kind: "select", label: { es: "Tipo de aviso", en: "Notice type" }, required: true, options: optionsFromEsEn(MASCOTAS_PERDIDOS_NOTICE_OPTIONS) },
      { key: "title", kind: "text", label: { es: "Título", en: "Title" }, placeholder: { es: "Ej. Perrita chihuahua perdida cerca de King Rd", en: "e.g. Lost chihuahua near King Rd" }, required: true, maxLength: 120 },
      { key: "petName", kind: "text", label: { es: "Nombre de la mascota", en: "Pet name" }, showWhen: isPet, maxLength: 60 },
      { key: "species", kind: "text", label: { es: "Especie / raza", en: "Species / breed" }, placeholder: { es: "Perro, gato, chihuahua…", en: "Dog, cat, chihuahua…" }, showWhen: isPet, maxLength: 60 },
      { key: "color", kind: "text", label: { es: "Color", en: "Color" }, showWhen: isPet, maxLength: 60 },
      { key: "objectType", kind: "text", label: { es: "Tipo de objeto", en: "Item type" }, placeholder: { es: "Cartera, llaves, teléfono…", en: "Wallet, keys, phone…" }, showWhen: isObject, maxLength: 60 },
      { key: "description", kind: "textarea", label: { es: "Descripción breve", en: "Short description" }, required: true, maxLength: 2000 },
      cityField("canonical"),
      { key: "lastSeenLocation", kind: "text", label: { es: "Área aproximada", en: "Approximate area" }, placeholder: { es: "Ej. King Rd y Story Rd", en: "e.g. King Rd & Story Rd" }, required: true, maxLength: 120 },
      { key: "lastSeenDate", kind: "date", label: { es: "Fecha en que se perdió", en: "Date lost" }, showWhen: isLost },
      { key: "foundDate", kind: "date", label: { es: "Fecha en que se encontró", en: "Date found" }, showWhen: isFound },
    ],
  },
  contactStep({ nameKey: null, includeSms: true }),
];

export const mascotasQuickAdapter: QuickClassifiedCategoryAdapter = {
  category: "mascotas-y-perdidos",
  steps: STEPS,
  confirmations: { kind: "community", variant: "mascotas" },
  async buildAndWriteCanonicalDraft({ values, media, confirmations, ctx }) {
    const draft: MascotasPerdidosQuickDraft = normalizeMascotasPerdidosQuickDraft({
      ...emptyMascotasPerdidosQuickDraft(),
      noticeType: notice(values),
      title: quickStr(values, "title"),
      description: quickStr(values, "description"),
      images: mediaToEmpleosImageItems(media),
      city: resolveCity(values),
      lastSeenLocation: quickStr(values, "lastSeenLocation"),
      petName: quickStr(values, "petName"),
      species: quickStr(values, "species"),
      color: quickStr(values, "color"),
      objectType: quickStr(values, "objectType"),
      lastSeenDate: quickStr(values, "lastSeenDate"),
      foundDate: quickStr(values, "foundDate"),
      phone: quickStr(values, "phone"),
      smsPhone: quickStr(values, "smsPhone"),
      whatsapp: quickStr(values, "whatsapp"),
      email: quickStr(values, "email"),
      publishConfirmations: { ...confirmations },
    });
    const gate = gateMascotasPerdidosQuickPreview(draft, ctx.lang);
    if (!gate.ok) return { ok: false, issues: gate.issues };
    try {
      sessionStorage.setItem(MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      return { ok: false, issues: [ctx.lang === "en" ? "Could not save your draft in this browser." : "No se pudo guardar tu borrador en este navegador."] };
    }
    return { ok: true, handoff: { kind: "preview", href: mascotasPerdidosHandoffPreviewUrl(ctx.routeLang as SupportedLang) } };
  },
};
