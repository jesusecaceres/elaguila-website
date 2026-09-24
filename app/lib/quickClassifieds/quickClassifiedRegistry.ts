/**
 * Quick Classifieds — ONE registry of category metadata (server-safe: no `app/(site)` imports).
 *
 * Every value here is repository truth cited in
 * docs/quick-classifieds/LEONIX_QUICK_CLASSIFIEDS_CATEGORY_MATRIX.md. Field definitions (which need the
 * categories' own taxonomies) live with the client adapters under app/(site)/publicar/rapido/_adapters.
 *
 * Pricing here is POSTURE ONLY (`packageKey`); the amount is always resolved from
 * `app/lib/listingPlans/revenuePricingMatrix.ts` at render time. Lifecycle entries name EXISTING owner actions
 * (see matrix rows "Sold / End", "Renewal") — nothing is invented for Quick.
 */

import type {
  QuickClassifiedCategoryKey,
  QuickClassifiedDefinition,
  QuickClassifiedLifecycleAdapter,
  QuickClassifiedMediaContract,
} from "./quickClassifiedTypes";
import { QUICK_CLASSIFIED_CATEGORY_KEYS } from "./quickClassifiedTypes";

const MIS_ANUNCIOS = "/dashboard/mis-anuncios";

function media(maxImages: number | null, note: { es: string; en: string }): QuickClassifiedMediaContract {
  return { minImages: 1, maxImages, videoOptional: true, note };
}

const END_ARCHIVE: Pick<QuickClassifiedLifecycleAdapter, "endLabel" | "endKind"> = {
  endLabel: { es: "Finalizar anuncio", en: "End ad" },
  endKind: "archive",
};

export const QUICK_CLASSIFIED_DEFINITIONS: Record<QuickClassifiedCategoryKey, QuickClassifiedDefinition> = {
  "en-venta": {
    key: "en-venta",
    pipeline: "en_venta",
    status: "live",
    emoji: "🛍️",
    label: { es: "En Venta / Varios", en: "For Sale / Misc" },
    tagline: { es: "Vende algo que ya no usas. Gratis.", en: "Sell something you no longer use. Free." },
    standardApplicationPath: "/publicar/en-venta",
    pricing: { kind: "free" },
    // EN_VENTA_PREVIEW_MAX_PHOTOS.pro = 12 (buildEnVentaPreviewModel.ts) — LANE_MEDIA_REGISTRY en_venta/pro.
    media: media(12, { es: "Hasta 12 fotos. La primera será la portada.", en: "Up to 12 photos. The first one is the cover." }),
    lifecycle: {
      manageHref: `${MIS_ANUNCIOS}?cat=en-venta`,
      endLabel: { es: "Ya se vendió", en: "Mark sold" },
      endKind: "sold",
      renewSupported: false,
      renewLabel: null,
      editSupported: true,
      note: { es: "Tu anuncio no vence. Puedes refrescar su visibilidad desde Mis Anuncios.", en: "Your ad does not expire. You can refresh its visibility from My Ads." },
    },
    essentialQuestionCount: 8,
  },
  rentas: {
    key: "rentas",
    pipeline: "rentas_privado",
    status: "live",
    emoji: "🏠",
    label: { es: "Rentas", en: "Rentals" },
    tagline: { es: "Cuarto, casa, apartamento, garaje o local en renta.", en: "Room, house, apartment, garage or space for rent." },
    standardApplicationPath: "/clasificados/publicar/rentas",
    pricing: { kind: "paid", packageKey: "rentas_30d", category: "rentas" },
    // MAX_PHOTOS = 8 (rentasPrivadoFormState.ts) — LANE_MEDIA_REGISTRY rentas_privado.
    media: media(8, { es: "Hasta 8 fotos. La primera será la portada.", en: "Up to 8 photos. The first one is the cover." }),
    lifecycle: {
      manageHref: `${MIS_ANUNCIOS}?cat=rentas`,
      endLabel: { es: "Ya se rentó", en: "Mark rented" },
      endKind: "rented",
      renewSupported: true,
      renewLabel: { es: "Renovar 30 días", en: "Renew 30 days" },
      editSupported: true,
      note: { es: "Tu anuncio dura 30 días. Puedes renovarlo desde Mis Anuncios sin perder su ID ni sus fotos.", en: "Your ad runs 30 days. You can renew it from My Ads without losing its ID or photos." },
    },
    essentialQuestionCount: 9,
  },
  empleos: {
    key: "empleos",
    pipeline: "empleos",
    // Tier-1 Gate 5: unblocked by the narrow media wiring repair (empleosDraftMediaUpload.ts) — customer
    // photos are now hosted in the existing listing-images bucket before the envelope is built.
    status: "live",
    emoji: "💼",
    label: { es: "Empleos", en: "Jobs" },
    tagline: { es: "Publica una vacante en minutos.", en: "Post a job in minutes." },
    standardApplicationPath: "/publicar/empleos",
    pricing: { kind: "paid", packageKey: "empleos_job_post_paid", category: "empleos" },
    // No enforced count cap for Empleos images (LANE_MEDIA_REGISTRY: uncapped).
    media: media(null, { es: "Sube al menos una foto real del lugar o del equipo.", en: "Upload at least one real photo of the workplace or team." }),
    lifecycle: {
      manageHref: "/dashboard/empleos",
      endLabel: { es: "Puesto ocupado", en: "Position filled" },
      endKind: "archive",
      renewSupported: false,
      renewLabel: null,
      editSupported: true,
      note: { es: "Cada vacante es un anuncio pagado independiente.", en: "Each job is its own paid listing." },
    },
    essentialQuestionCount: 11,
  },
  autos: {
    key: "autos",
    pipeline: "autos_privado",
    status: "live",
    emoji: "🚗",
    label: { es: "Autos (particular)", en: "Autos (private seller)" },
    tagline: { es: "Vende tu carro, troca o moto como particular.", en: "Sell your car, truck or motorcycle as a private seller." },
    standardApplicationPath: "/publicar/autos",
    pricing: { kind: "paid", packageKey: "autos_privado_30d", category: "autos" },
    // No enforced count cap for autos_privado (LANE_MEDIA_REGISTRY: uncapped).
    media: media(null, { es: "Sube tus fotos. La primera será la portada.", en: "Upload your photos. The first one is the cover." }),
    lifecycle: {
      manageHref: `${MIS_ANUNCIOS}?cat=autos`,
      endLabel: { es: "Vehículo vendido", en: "Vehicle sold" },
      endKind: "unpublish",
      renewSupported: true,
      renewLabel: { es: "Renovar 30 días", en: "Renew 30 days" },
      // Active Autos privado rows are not editable today (PATCH only while unpaid) — repository truth.
      editSupported: false,
      note: { es: "Tu anuncio dura 30 días. Una vez activo no se edita; puedes renovarlo o marcarlo vendido.", en: "Your ad runs 30 days. Once active it cannot be edited; you can renew it or mark it sold." },
    },
    essentialQuestionCount: 10,
  },
  "bienes-raices": {
    key: "bienes-raices",
    pipeline: "bienes_raices_privado",
    status: "live",
    emoji: "🏡",
    label: { es: "Bienes Raíces (dueño directo)", en: "Real Estate (for sale by owner)" },
    tagline: { es: "Vende tu propiedad sin agente.", en: "Sell your property without an agent." },
    standardApplicationPath: "/clasificados/publicar/bienes-raices",
    pricing: { kind: "paid", packageKey: "br_fsbo_45d", category: "bienes-raices" },
    // MAX_PHOTOS = 8 (bienesRaicesPrivadoFormState.ts) — LANE_MEDIA_REGISTRY bienes_raices_privado.
    media: media(8, { es: "Hasta 8 fotos. La primera será la portada.", en: "Up to 8 photos. The first one is the cover." }),
    lifecycle: {
      manageHref: `${MIS_ANUNCIOS}?cat=bienes-raices`,
      endLabel: { es: "Ya se vendió", en: "Mark sold" },
      endKind: "sold",
      renewSupported: true,
      renewLabel: { es: "Renovar 45 días", en: "Renew 45 days" },
      editSupported: true,
      note: { es: "Tu anuncio dura 45 días. Puedes renovarlo desde Mis Anuncios sin perder su ID ni sus fotos.", en: "Your ad runs 45 days. You can renew it from My Ads without losing its ID or photos." },
    },
    essentialQuestionCount: 10,
  },
  clases: {
    key: "clases",
    pipeline: "clases",
    status: "live",
    emoji: "🎓",
    label: { es: "Clases", en: "Classes" },
    tagline: { es: "Anuncia tu clase, curso o taller. Gratis.", en: "Announce your class, course or workshop. Free." },
    standardApplicationPath: "/publicar/clases/quick",
    pricing: { kind: "free" },
    media: media(null, { es: "Sube al menos una imagen o el flyer como foto.", en: "Upload at least one image or your flyer as a photo." }),
    lifecycle: {
      manageHref: `${MIS_ANUNCIOS}?cat=clases`,
      ...END_ARCHIVE,
      renewSupported: false,
      renewLabel: null,
      editSupported: true,
      note: { es: "Tu anuncio no vence. Finalízalo cuando termine la clase.", en: "Your ad does not expire. End it when the class is over." },
    },
    essentialQuestionCount: 12,
  },
  comunidad: {
    key: "comunidad",
    pipeline: "comunidad",
    status: "live",
    emoji: "🎉",
    label: { es: "Comunidad y Eventos", en: "Community & Events" },
    tagline: { es: "Anuncia tu evento comunitario. Gratis.", en: "Announce your community event. Free." },
    standardApplicationPath: "/publicar/comunidad/quick",
    pricing: { kind: "free" },
    media: media(null, { es: "Sube al menos una imagen o el flyer como foto.", en: "Upload at least one image or your flyer as a photo." }),
    lifecycle: {
      manageHref: `${MIS_ANUNCIOS}?cat=comunidad`,
      ...END_ARCHIVE,
      renewSupported: false,
      renewLabel: null,
      editSupported: true,
      note: { es: "Los eventos dejan de mostrarse en resultados después de su fecha.", en: "Events stop showing in results after their date." },
    },
    essentialQuestionCount: 11,
  },
  busco: {
    key: "busco",
    pipeline: "busco",
    status: "live",
    emoji: "🔎",
    label: { es: "Busco / Se Busca", en: "Wanted" },
    tagline: { es: "Pide lo que necesitas. Gratis.", en: "Ask for what you need. Free." },
    standardApplicationPath: "/publicar/busco/quick",
    pricing: { kind: "free" },
    // Busco stores a single image (imageDataUrl) — LANE_MEDIA_REGISTRY busco: single.
    media: media(1, { es: "Una foto que ayude a explicar lo que buscas.", en: "One photo that helps explain what you are looking for." }),
    lifecycle: {
      manageHref: `${MIS_ANUNCIOS}?cat=busco`,
      ...END_ARCHIVE,
      renewSupported: false,
      renewLabel: null,
      editSupported: true,
      note: { es: "Tu anuncio no vence. Finalízalo cuando encuentres lo que buscas.", en: "Your ad does not expire. End it when you find what you need." },
    },
    essentialQuestionCount: 6,
  },
  "mascotas-y-perdidos": {
    key: "mascotas-y-perdidos",
    pipeline: "mascotas_y_perdidos",
    status: "live",
    emoji: "🐾",
    label: { es: "Mascotas y Perdidos", en: "Pets & Lost" },
    tagline: { es: "Mascota u objeto perdido, encontrado o en adopción. Gratis.", en: "Lost, found or adoptable pet or item. Free." },
    standardApplicationPath: "/publicar/mascotas-y-perdidos/quick",
    pricing: { kind: "free" },
    // MAX_MASCOTAS_PHOTOS = 4 (mascotasPerdidosQuickDraft.ts).
    media: media(4, { es: "Hasta 4 fotos. La primera será la portada.", en: "Up to 4 photos. The first one is the cover." }),
    lifecycle: {
      manageHref: `${MIS_ANUNCIOS}?cat=mascotas`,
      ...END_ARCHIVE,
      renewSupported: false,
      renewLabel: null,
      editSupported: true,
      note: { es: "Tu anuncio no vence. Finalízalo cuando se resuelva.", en: "Your ad does not expire. End it once it is resolved." },
    },
    essentialQuestionCount: 8,
  },
};

/** Owner priority order — Tier-1 (En Venta, Rentas, Empleos, Autos) first, then FSBO, then the community family. */
export const QUICK_CLASSIFIED_ORDER: readonly QuickClassifiedCategoryKey[] = [
  "en-venta",
  "rentas",
  "empleos",
  "autos",
  "bienes-raices",
  "busco",
  "mascotas-y-perdidos",
  "comunidad",
  "clases",
];

/** Tier-1 launch focus (PM Control Master §22). */
export const QUICK_TIER1_KEYS: readonly QuickClassifiedCategoryKey[] = ["en-venta", "rentas", "empleos", "autos"];

/** Community family — already short canonical forms; the staff launchpad shares their direct canonical link. */
export const QUICK_COMMUNITY_KEYS: readonly QuickClassifiedCategoryKey[] = ["busco", "mascotas-y-perdidos", "comunidad", "clases"];

export function getQuickClassifiedDefinition(key: QuickClassifiedCategoryKey): QuickClassifiedDefinition {
  return QUICK_CLASSIFIED_DEFINITIONS[key];
}

export function listQuickClassifiedDefinitions(): QuickClassifiedDefinition[] {
  return QUICK_CLASSIFIED_ORDER.map((k) => QUICK_CLASSIFIED_DEFINITIONS[k]);
}

export function listLiveQuickClassifiedKeys(): QuickClassifiedCategoryKey[] {
  return QUICK_CLASSIFIED_ORDER.filter((k) => QUICK_CLASSIFIED_DEFINITIONS[k].status === "live");
}

/** Self-check used by the Gate verifier: every declared key has a definition and vice versa. */
export function quickClassifiedRegistryIsComplete(): boolean {
  const declared = new Set<string>(QUICK_CLASSIFIED_CATEGORY_KEYS);
  const defined = new Set<string>(Object.keys(QUICK_CLASSIFIED_DEFINITIONS));
  if (declared.size !== defined.size) return false;
  for (const k of declared) if (!defined.has(k)) return false;
  return QUICK_CLASSIFIED_ORDER.length === declared.size;
}
