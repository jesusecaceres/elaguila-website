import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";

/** Slug values stored in draft / detail_pairs (B4 publish). */
export type MascotasPerdidosNoticeTypeSlug =
  | ""
  | "mascota-perdida"
  | "mascota-encontrada"
  | "adopcion-mascota"
  | "objeto-perdido"
  | "objeto-encontrado";

/** True for the three pet-specific notice types (as opposed to object notices). */
export function isPetNoticeType(slug: MascotasPerdidosNoticeTypeSlug): boolean {
  return slug === "mascota-perdida" || slug === "mascota-encontrada" || slug === "adopcion-mascota";
}

export type MascotasPerdidosTriState = "" | "si" | "no" | "no_se";

export type MascotasPerdidosPublishConfirmations = {
  infoTruthful: boolean;
  mediaAccurate: boolean;
  rulesAccepted: boolean;
};

export type MascotasPerdidosQuickDraft = {
  /** Session-only id for preview handoff (not a Leonix Ad ID). */
  previewListingId: string;
  noticeType: MascotasPerdidosNoticeTypeSlug;
  title: string;
  description: string;

  /** Gate 3 — up to 4 photos, reusing the shared Empleos gallery editor/item shape. */
  images: EmpleosImageItem[];

  /** Global-ready location (Gate 3 Section G) — no private home address. */
  city: string;
  state: string;
  country: string;
  zip: string;
  /** Approximate last-seen (perdida) / found (encontrada) / lost (objeto) area. */
  lastSeenLocation: string;
  /** Optional landmark/intersection, e.g. "King Rd & Story Rd". */
  landmark: string;

  // ---- Pet fields (mascota-perdida / mascota-encontrada / adopcion-mascota) ----
  petName: string;
  species: string;
  breed: string;
  color: string;
  sex: MascotasPerdidosTriState;
  ageApprox: string;
  size: string;
  identifyingMarks: string;
  hasCollar: boolean;
  collarNote: string;
  microchip: MascotasPerdidosTriState;

  // ---- mascota-perdida only ----
  lastSeenDate: string;
  offersReward: boolean;
  rewardAmount: string;
  safetyNote: string;

  // ---- mascota-encontrada only ----
  foundDate: string;
  currentStatus: string;
  claimInstructions: string;

  // ---- adopcion-mascota only ----
  temperament: string;
  vaccinated: MascotasPerdidosTriState;
  spayedNeutered: MascotasPerdidosTriState;
  specialNeeds: string;
  adoptionDetails: string;

  // ---- objeto-perdido / objeto-encontrado ----
  objectType: string;

  // ---- Contact (Gate 3 Section I — fully separated, no combined phone/WhatsApp) ----
  phone: string;
  smsPhone: string;
  whatsapp: string;
  email: string;

  // ---- Social (Gate 3 Section L) ----
  facebook: string;
  instagram: string;

  // ---- Leonix confirmations (Gate 3 Section O) ----
  publishConfirmations: MascotasPerdidosPublishConfirmations;
};
