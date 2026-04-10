/** Negocios (business) Viajes draft — separate from privado and affiliate admin. */

import type { ViajesDateMode } from "../../lib/viajesResolveFechasDisplay";

export type ViajesNegociosCtaType = "whatsapp" | "telefono" | "correo" | "sitio";

export type ViajesNegociosDraft = {
  schemaVersion: 1;
  offerType: string;
  titulo: string;
  destino: string;
  ciudadSalida: string;
  precio: string;
  duracion: string;
  /** Legacy single line — still synced for older drafts; prefer dateMode + structured fields */
  fechas: string;
  dateMode: ViajesDateMode;
  fechaInicio: string;
  fechaFin: string;
  fechasNota: string;
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
  /** Hero source tab UX: url | file */
  heroSourceMode: "url" | "file";
  /** Up to 8 gallery image URLs or data URLs (local) */
  galeriaUrls: string[];
  galeriaNota: string;
  logoSocio: string;
  logoLocalDataUrl: string | null;
  logoSourceMode: "url" | "file";
  videoUrl: string;
  videoLocalLabel: string;
  businessName: string;
  phone: string;
  phoneOffice: string;
  email: string;
  website: string;
  whatsapp: string;
  /** Legacy freeform social line — shown in notes if set; prefer structured fields */
  socials: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  socialYoutube: string;
  socialTwitter: string;
  destinationsServed: string;
  languages: string;
};
