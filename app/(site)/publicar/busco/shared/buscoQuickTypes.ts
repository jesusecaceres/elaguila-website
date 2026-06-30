export type BuscoTypeSlug =
  | ""
  | "articulo"
  | "ayuda"
  | "servicio"
  | "grupo_actividad"
  | "transporte"
  | "voluntarios"
  | "recurso_comunitario"
  | "otro";

/** normal | pronto | urgente */
export type BuscoUrgency = "normal" | "pronto" | "urgente";

/** telefono | whatsapp | mensaje | correo */
export type BuscoPreferredContact = "telefono" | "whatsapp" | "mensaje" | "correo";

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
  budget: string;
  urgency: BuscoUrgency;
  /** Phone for calls. */
  phone: string;
  /** WhatsApp number (may differ from call phone). */
  whatsapp: string;
  /** SMS/text number (falls back to phone if blank). */
  smsPhone: string;
  email: string;
  preferredContact: BuscoPreferredContact;
  /** Optional Facebook profile/page URL. */
  facebook: string;
  /** Optional Instagram profile URL. */
  instagram: string;
  /** Optional TikTok profile URL. */
  tiktok: string;
  /** Optional other contact link label. */
  otherContactLabel: string;
  /** Optional other contact link URL. */
  otherContactUrl: string;
  imageDataUrl: string;
  imageFileName: string;
};
