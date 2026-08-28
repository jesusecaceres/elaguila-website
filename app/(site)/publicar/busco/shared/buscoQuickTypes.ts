export type BuscoTypeSlug =
  | ""
  | "articulo"
  | "ayuda"
  | "servicio"
  | "grupo_actividad"
  | "transporte"
  | "voluntarios"
  | "recurso_comunitario"
  | "trabajo"
  | "otro";

/** Section G — normal | esta_semana | lo_antes_posible | urgente_hoy. */
export type BuscoUrgency = "normal" | "esta_semana" | "lo_antes_posible" | "urgente_hoy";

/** Section E — structured budget model. Replaces the old free-text budget field. */
export type BuscoBudgetMode = "tiene" | "gratis" | "intercambio" | "convenir" | "no_aplica";

/** Structurally identical to CommunityPublishConfirmations (Gate 2D/3 pattern) — no cross-import needed. */
export type BuscoPublishConfirmations = {
  infoTruthful: boolean;
  mediaAccurate: boolean;
  rulesAccepted: boolean;
};

export type BuscoQuickDraft = {
  /** Stable client id for LNX-XXXXXXXX preview display (not DB leonix_ad_id). */
  previewListingId: string;
  buscoType: BuscoTypeSlug;
  buscoTypeCustom: string;
  title: string;
  description: string;
  /** Approximate city — free text. */
  city: string;
  /** State or region — free text. */
  state: string;
  /** Country — defaults to empty (United States implied). */
  country: string;
  /** ZIP / postal code — optional. */
  zip: string;
  /** Area / neighborhood / last known location — optional. */
  zone: string;

  budgetMode: BuscoBudgetMode;
  /** Numeric string, no currency symbol — only meaningful when budgetMode === "tiene". */
  budgetAmount: string;
  urgency: BuscoUrgency;

  /** Section C — light conditional fields, reused across compatible types where sensible. */
  /** articulo only — optional preferred condition (e.g. Nuevo, Usado, Cualquiera). */
  preferredCondition: string;
  /** trabajo only. */
  workType: string;
  workSkills: string;
  workAvailability: string;
  /** transporte only. */
  transportOrigin: string;
  transportDestination: string;
  /** voluntarios only — approximate number of volunteers needed. */
  volunteersCount: string;
  /** Reused generic "when" field — servicio (timeframe), transporte/voluntarios (date/time),
   *  ayuda/recurso_comunitario/grupo_actividad ("¿Cuándo?"). Avoids one field per type. */
  whenNeeded: string;

  /** Phone for calls. */
  phone: string;
  /** WhatsApp number (may differ from call phone). */
  whatsapp: string;
  /** SMS/text number (falls back to phone if blank). */
  smsPhone: string;
  email: string;
  /** Optional Facebook profile/page URL. */
  facebook: string;
  /** Optional Instagram profile URL. */
  instagram: string;
  /** Optional TikTok profile URL. */
  tiktok: string;
  /** Optional YouTube channel/video URL. */
  youtube: string;
  /** Optional other contact link label. */
  otherContactLabel: string;
  /** Optional other contact link URL. */
  otherContactUrl: string;
  imageDataUrl: string;
  imageFileName: string;

  publishConfirmations: BuscoPublishConfirmations;
};
