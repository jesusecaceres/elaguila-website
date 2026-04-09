/** Private-lane Viajes draft — distinct from negocios / affiliate admin models. */

export type ViajesPrivadoCtaType = "whatsapp" | "phone" | "email";

export type ViajesPrivadoDraft = {
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
  familias: boolean;
  parejas: boolean;
  grupos: boolean;
  numeroPersonas: string;
  incluyeHotel: boolean;
  incluyeTransporte: boolean;
  incluyeComida: boolean;
  guiaEspanol: boolean;
  politicaReserva: string;
  idiomaAtencion: string;
  presupuestoTag: string;
  /** Remote image URL */
  imagenUrl: string;
  /** Base64 data URL from local file — omitted if too large when saving */
  localImageDataUrl: string | null;
  /** IndexedDB-backed hero when file exceeds localStorage-safe inline size */
  localHeroBlobId: string | null;
  displayName: string;
  ctaType: ViajesPrivadoCtaType;
  phone: string;
  whatsapp: string;
  email: string;
};
