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

export type BuscoQuickDraft = {
  /** Stable client id for LNX-XXXXXXXX preview display (not DB leonix_ad_id). */
  previewListingId: string;
  buscoType: BuscoTypeSlug;
  buscoTypeCustom: string;
  title: string;
  description: string;
  city: string;
  zone: string;
  budget: string;
  phone: string;
  email: string;
  imageDataUrl: string;
  imageFileName: string;
};
