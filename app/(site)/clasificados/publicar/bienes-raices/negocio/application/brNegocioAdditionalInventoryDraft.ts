import { formatBrCityStatePostalLine } from "@/app/lib/clasificados/bienes-raices/brLocationHelpers";
import { formatUsdWhole } from "@/app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat";
import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import {
  labelForSubtipo,
  SUBTIPO_POR_TIPO,
  SUBTIPO_SUBVALUE_LABEL_EN,
  TIPO_PROPIEDAD_LABEL_EN,
  TIPO_PROPIEDAD_OPCIONES,
  type TipoPropiedadCodigo,
} from "../agente-individual/schema/agenteResidencialTipoMeta";

const MAX_CHILD_PHOTOS = 40;

export type BrNegocioInventoryPropertyTypeCode =
  | TipoPropiedadCodigo
  | "comercial"
  | "terreno"
  | "proyecto"
  | "otro";

export type BrNegocioAdditionalInventoryPropertyDraft = {
  id: string;
  title: string;
  propertyType: string;
  propertySubtype: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  interiorSqft: string;
  lotSqft: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  state: string;
  zip: string;
  /** Country / territory for worldwide listings (form-only; not a DB column). */
  country: string;
  showExactAddress: boolean;
  description: string;
  /** @deprecated Use photoUrls + primaryPhotoIndex; kept for old drafts. */
  mainPhotoUrl: string;
  /** Child property gallery (http/https/data:image in session). */
  photoUrls: string[];
  primaryPhotoIndex: number;
  videoUrl: string;
  tourUrl: string;
  brochureUrl: string;
  mlsUrl: string;
  listadoUrl: string;
  /** Full property-only Agente form slice (BR-INV-FIX-01D). */
  propertyForm?: Partial<AgenteIndividualResidencialFormState> | null;
  createdAt: string;
  updatedAt: string;
};

export type BrNegocioInventoryDrawerFieldErrors = Partial<
  Record<"title" | "propertyType" | "price" | "city" | "state", string>
>;

const RESIDENCIAL_TYPES = new Set<string>(TIPO_PROPIEDAD_OPCIONES.map((o) => o.value));

export function newBrLocalPropertyDraftId(): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 9);
  return `br-local-property-${Date.now()}-${suffix}`;
}

export function createEmptyBrNegocioAdditionalInventoryPropertyDraft(
  id = newBrLocalPropertyDraftId(),
): BrNegocioAdditionalInventoryPropertyDraft {
  const now = new Date().toISOString();
  return {
    id,
    title: "",
    propertyType: "",
    propertySubtype: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    interiorSqft: "",
    lotSqft: "",
    streetLine1: "",
    streetLine2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    showExactAddress: false,
    description: "",
    mainPhotoUrl: "",
    photoUrls: [],
    primaryPhotoIndex: 0,
    videoUrl: "",
    tourUrl: "",
    brochureUrl: "",
    mlsUrl: "",
    listadoUrl: "",
    propertyForm: null,
    createdAt: now,
    updatedAt: now,
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function clampPrimaryIndex(photoUrls: string[], index: number): number {
  if (!photoUrls.length) return 0;
  return Math.min(Math.max(0, index), photoUrls.length - 1);
}

function isDurablePhotoUrl(url: string): boolean {
  const u = url.trim();
  return u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/");
}

function coercePropertyForm(raw: unknown): Partial<AgenteIndividualResidencialFormState> | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as Partial<AgenteIndividualResidencialFormState>;
}

/** Migrate legacy mainPhotoUrl → photoUrls + primaryPhotoIndex; sync propertyForm media. */
export function normalizeChildInventoryDraft(
  raw: BrNegocioAdditionalInventoryPropertyDraft,
): BrNegocioAdditionalInventoryPropertyDraft {
  const photoUrls = (Array.isArray(raw.photoUrls) ? raw.photoUrls : [])
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter(isDurablePhotoUrl)
    .slice(0, MAX_CHILD_PHOTOS);

  const legacyMain = typeof raw.mainPhotoUrl === "string" ? raw.mainPhotoUrl.trim() : "";
  if (!photoUrls.length && legacyMain && isDurablePhotoUrl(legacyMain)) {
    photoUrls.push(legacyMain);
  }

  const primaryPhotoIndex = clampPrimaryIndex(photoUrls, Number(raw.primaryPhotoIndex) || 0);
  const cover = photoUrls[primaryPhotoIndex] ?? photoUrls[0] ?? "";

  return syncChildInventoryDraftMedia({
    ...raw,
    photoUrls,
    primaryPhotoIndex,
    mainPhotoUrl: cover,
    videoUrl: typeof raw.videoUrl === "string" ? raw.videoUrl.trim() : "",
    tourUrl: typeof raw.tourUrl === "string" ? raw.tourUrl.trim() : "",
    brochureUrl: typeof raw.brochureUrl === "string" ? raw.brochureUrl.trim() : "",
    mlsUrl: typeof raw.mlsUrl === "string" ? raw.mlsUrl.trim() : "",
    listadoUrl: typeof raw.listadoUrl === "string" ? raw.listadoUrl.trim() : "",
  });
}

function durableHttpUrl(raw: string): string {
  const u = raw.trim();
  return u.startsWith("http://") || u.startsWith("https://") ? u : "";
}

function durableVideoUrlList(urls: unknown, fallbackSingle: string): string[] {
  const list = Array.isArray(urls)
    ? urls.map((u) => durableHttpUrl(String(u ?? ""))).filter(Boolean)
    : [];
  if (list.length) return list.slice(0, 4);
  const one = durableHttpUrl(fallbackSingle);
  return one ? [one] : [];
}

/** Keep flat draft fields and propertyForm media in sync (save + edit rehydration). */
export function syncChildInventoryDraftMedia(
  raw: BrNegocioAdditionalInventoryPropertyDraft,
): BrNegocioAdditionalInventoryPropertyDraft {
  const form =
    raw.propertyForm && typeof raw.propertyForm === "object"
      ? ({ ...raw.propertyForm } as Partial<AgenteIndividualResidencialFormState>)
      : ({} as Partial<AgenteIndividualResidencialFormState>);

  const flatPhotos = (Array.isArray(raw.photoUrls) ? raw.photoUrls : [])
    .map((u) => String(u ?? "").trim())
    .filter(isDurablePhotoUrl)
    .slice(0, MAX_CHILD_PHOTOS);

  const legacyMain = typeof raw.mainPhotoUrl === "string" ? raw.mainPhotoUrl.trim() : "";
  if (!flatPhotos.length && legacyMain && isDurablePhotoUrl(legacyMain)) {
    flatPhotos.push(legacyMain);
  }

  const formPhotos = (Array.isArray(form.fotosDataUrls) ? form.fotosDataUrls : [])
    .map((u) => String(u ?? "").trim())
    .filter(isDurablePhotoUrl)
    .slice(0, MAX_CHILD_PHOTOS);

  const photos =
    formPhotos.length >= flatPhotos.length && formPhotos.length > 0
      ? formPhotos
      : flatPhotos.length > 0
        ? flatPhotos
        : formPhotos;

  const primaryFromForm = typeof form.fotoPortadaIndex === "number" ? form.fotoPortadaIndex : raw.primaryPhotoIndex;
  const primaryPhotoIndex = clampPrimaryIndex(photos, Number(primaryFromForm) || 0);
  const cover = photos[primaryPhotoIndex] ?? photos[0] ?? "";

  const formVideoUrls = durableVideoUrlList(form.videoUrls, form.videoUrl ?? "");
  const flatVideoUrls = durableVideoUrlList(null, raw.videoUrl ?? "");
  const videoUrls =
    formVideoUrls.length >= flatVideoUrls.length && formVideoUrls.length > 0
      ? formVideoUrls
      : flatVideoUrls.length > 0
        ? flatVideoUrls
        : formVideoUrls;
  const videoUrl = videoUrls[0] ?? "";

  const tourUrl = durableHttpUrl(String(form.tourUrl ?? "")) || durableHttpUrl(raw.tourUrl ?? "");
  const brochureUrl = durableHttpUrl(String(form.brochureUrl ?? "")) || durableHttpUrl(raw.brochureUrl ?? "");
  const listadoUrl = durableHttpUrl(String(form.listadoUrl ?? "")) || durableHttpUrl(raw.listadoUrl ?? "");

  const propertyForm: Partial<AgenteIndividualResidencialFormState> = {
    ...form,
    fotosDataUrls: photos,
    fotoPortadaIndex: primaryPhotoIndex,
    videoUrls: videoUrls.length ? videoUrls : form.videoUrls,
    videoUrl,
    tourUrl: tourUrl || form.tourUrl || "",
    brochureUrl: brochureUrl || form.brochureUrl || "",
    listadoUrl: listadoUrl || form.listadoUrl || "",
  };

  return {
    ...raw,
    photoUrls: photos,
    primaryPhotoIndex,
    mainPhotoUrl: cover,
    videoUrl,
    tourUrl,
    brochureUrl,
    listadoUrl,
    propertyForm,
  };
}

export function childInventoryCoverPhotoUrl(draft: BrNegocioAdditionalInventoryPropertyDraft): string {
  const normalized = normalizeChildInventoryDraft(draft);
  return normalized.photoUrls[normalized.primaryPhotoIndex] ?? normalized.photoUrls[0] ?? normalized.mainPhotoUrl ?? "";
}

export function sanitizeBrNegocioAdditionalInventoryPropertyDraft(
  raw: unknown,
): BrNegocioAdditionalInventoryPropertyDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id).trim();
  if (!id.startsWith("br-local-property-")) return null;
  const base = createEmptyBrNegocioAdditionalInventoryPropertyDraft(id);
  const createdAt = str(o.createdAt).trim() || base.createdAt;
  const updatedAt = str(o.updatedAt).trim() || base.updatedAt;
  return normalizeChildInventoryDraft({
    ...base,
    title: str(o.title),
    propertyType: str(o.propertyType),
    propertySubtype: str(o.propertySubtype),
    price: str(o.price),
    bedrooms: str(o.bedrooms),
    bathrooms: str(o.bathrooms),
    interiorSqft: str(o.interiorSqft),
    lotSqft: str(o.lotSqft),
    streetLine1: str(o.streetLine1),
    streetLine2: str(o.streetLine2),
    city: str(o.city),
    state: str(o.state),
    zip: str(o.zip),
    country: str(o.country) || "United States",
    showExactAddress: bool(o.showExactAddress, false),
    description: str(o.description),
    mainPhotoUrl: str(o.mainPhotoUrl),
    photoUrls: Array.isArray(o.photoUrls) ? o.photoUrls.map((u) => str(u)).filter(Boolean) : [],
    primaryPhotoIndex: typeof o.primaryPhotoIndex === "number" ? o.primaryPhotoIndex : 0,
    videoUrl: str(o.videoUrl),
    tourUrl: str(o.tourUrl),
    brochureUrl: str(o.brochureUrl),
    mlsUrl: str(o.mlsUrl),
    listadoUrl: str(o.listadoUrl),
    propertyForm: coercePropertyForm(o.propertyForm),
    createdAt,
    updatedAt,
  });
}

export function mergeAdditionalInventoryProperties(
  raw: unknown,
  fallback: BrNegocioAdditionalInventoryPropertyDraft[] = [],
): BrNegocioAdditionalInventoryPropertyDraft[] {
  if (!Array.isArray(raw)) return [...fallback];
  const out: BrNegocioAdditionalInventoryPropertyDraft[] = [];
  for (const item of raw) {
    const sanitized = sanitizeBrNegocioAdditionalInventoryPropertyDraft(item);
    if (sanitized) out.push(sanitized);
  }
  return out.map((item) => normalizeChildInventoryDraft(item));
}

export function validateBrNegocioAdditionalInventoryDraft(
  draft: BrNegocioAdditionalInventoryPropertyDraft,
  lang: "es" | "en",
): BrNegocioInventoryDrawerFieldErrors {
  const errors: BrNegocioInventoryDrawerFieldErrors = {};
  if (!draft.title.trim()) {
    errors.title = lang === "es" ? "El título es obligatorio." : "Title is required.";
  }
  if (!draft.propertyType.trim()) {
    errors.propertyType = lang === "es" ? "El tipo de propiedad es obligatorio." : "Property type is required.";
  }
  if (!draft.price.trim()) {
    errors.price = lang === "es" ? "El precio es obligatorio." : "Price is required.";
  }
  if (!draft.city.trim()) {
    errors.city = lang === "es" ? "La ciudad es obligatoria." : "City is required.";
  }
  if (!draft.state.trim()) {
    errors.state = lang === "es" ? "El estado es obligatorio." : "State is required.";
  }
  return errors;
}

export function brInventoryDrawerHasErrors(errors: BrNegocioInventoryDrawerFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function brInventoryPropertyTypeLabel(type: string, lang: "es" | "en"): string {
  const t = type.trim();
  if (!t) return "—";
  if (RESIDENCIAL_TYPES.has(t)) {
    if (lang === "en") return TIPO_PROPIEDAD_LABEL_EN[t as TipoPropiedadCodigo] ?? t;
    return TIPO_PROPIEDAD_OPCIONES.find((o) => o.value === t)?.label ?? t;
  }
  const generic: Record<string, { es: string; en: string }> = {
    comercial: { es: "Comercial", en: "Commercial" },
    terreno: { es: "Terreno", en: "Land" },
    proyecto: { es: "Proyecto nuevo", en: "New development" },
    otro: { es: "Otro", en: "Other" },
  };
  const hit = generic[t];
  if (hit) return lang === "en" ? hit.en : hit.es;
  return t;
}

export function brInventoryPropertySubtypeLabel(
  type: string,
  subtype: string,
  lang: "es" | "en",
): string {
  const sub = subtype.trim();
  if (!sub) return "";
  if (RESIDENCIAL_TYPES.has(type)) {
    const codigo = type as TipoPropiedadCodigo;
    if (lang === "en") {
      const list = SUBTIPO_POR_TIPO[codigo];
      const hit = list.find((x) => x.value === sub);
      return hit?.label ?? sub;
    }
    return labelForSubtipo(codigo, sub) || sub;
  }
  return sub;
}

export function brInventoryDraftPriceDisplay(price: string, lang: "es" | "en"): string {
  const formatted = formatUsdWhole(price);
  return formatted || (lang === "es" ? "Precio pendiente" : "Price pending");
}

export function brInventoryDraftLocationLine(draft: BrNegocioAdditionalInventoryPropertyDraft): string {
  const line = formatBrCityStatePostalLine(
    draft.city,
    draft.state,
    draft.zip,
    draft.country || "United States",
  );
  return line || "—";
}

export const BR_INVENTORY_DRAWER_PROPERTY_TYPES: ReadonlyArray<{
  value: BrNegocioInventoryPropertyTypeCode | "otro";
  labelEs: string;
  labelEn: string;
}> = [
  ...TIPO_PROPIEDAD_OPCIONES.map((o) => ({
    value: o.value as BrNegocioInventoryPropertyTypeCode,
    labelEs: o.label,
    labelEn: TIPO_PROPIEDAD_LABEL_EN[o.value],
  })),
  { value: "comercial", labelEs: "Comercial", labelEn: "Commercial" },
  { value: "terreno", labelEs: "Terreno", labelEn: "Land" },
  { value: "proyecto", labelEs: "Proyecto nuevo", labelEn: "New development" },
  { value: "otro", labelEs: "Otro", labelEn: "Other" },
];

export function brInventorySubtypeOptionsForType(
  type: string,
  lang: "es" | "en",
): ReadonlyArray<{ value: string; label: string }> {
  if (!RESIDENCIAL_TYPES.has(type)) return [];
  const codigo = type as TipoPropiedadCodigo;
  const list = SUBTIPO_POR_TIPO[codigo];
  if (lang === "en") {
    return list.map((x) => ({
      value: x.value,
      label: SUBTIPO_SUBVALUE_LABEL_EN[x.value] ?? x.label,
    }));
  }
  return list;
}
