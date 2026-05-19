/** Slug values stored in draft / detail_pairs (B4 publish). */
export type MascotasPerdidosNoticeTypeSlug =
  | ""
  | "mascota-perdida"
  | "mascota-encontrada"
  | "adopcion-mascota"
  | "objeto-perdido"
  | "objeto-encontrado";

export type MascotasPerdidosQuickDraft = {
  /** Session-only id for preview handoff (not a Leonix Ad ID). */
  previewListingId: string;
  noticeType: MascotasPerdidosNoticeTypeSlug;
  title: string;
  description: string;
  city: string;
  lastSeenLocation: string;
  contactPhone: string;
  email: string;
  imageDataUrl: string;
  imageFileName: string;
};
