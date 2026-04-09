/** Negocios (business) Viajes draft — separate from privado and affiliate admin. */

export type ViajesNegociosCtaType = "whatsapp" | "telefono" | "correo" | "sitio";

export type ViajesNegociosDraft = {
  schemaVersion: 1;
  offerType: string;
  titulo: string;
  destino: string;
  ciudadSalida: string;
  precio: string;
  duracion: string;
  fechas: string;
  descripcion: string;
  incluye: string;
  ctaType: ViajesNegociosCtaType;
  familias: boolean;
  parejas: boolean;
  grupos: boolean;
  presupuestoTag: string;
  incluyeHotel: boolean;
  incluyeTransporte: boolean;
  incluyeComida: boolean;
  guiaEspanol: boolean;
  idiomaAtencion: string;
  imagenPrincipal: string;
  /** IndexedDB-backed hero blob id (Phase 5) */
  localHeroImageId: string | null;
  /** Inline small preview only; prefer localHeroImageId for files */
  localImageDataUrl: string | null;
  galeriaNota: string;
  logoSocio: string;
  videoUrl: string;
  businessName: string;
  phone: string;
  website: string;
  whatsapp: string;
  socials: string;
  destinationsServed: string;
  languages: string;
};
