/**
 * Output VM for BR Privado (particular / owner-seller only).
 * Consumed by `BienesRaicesPrivadoPreviewView`; filled from the Privado draft via the Privado mapper.
 */

import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type {
  BienesRaicesPreviewFact,
  BienesRaicesPreviewMediaVm,
  BienesRaicesPreviewQuickFactVm,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

export type BienesRaicesPrivadoSellerVm = {
  photoUrl: string | null;
  hasPhoto: boolean;
  name: string;
  /** Owner-facing line, e.g. "Propietario"; empty hides the row */
  byOwnerLabel: string;
  phoneDisplay: string;
  emailDisplay: string;
  whatsappDisplay: string;
  /** Optional short trust line; keep free of Negocio/broker language */
  noteLine: string;
};

export type BienesRaicesPrivadoContactRailVm = {
  /** mailto — shown as a simple “correo” action, not a business lead form */
  showSolicitarInfo: boolean;
  showLlamar: boolean;
  showWhatsapp: boolean;
  solicitarInfoHref: string | null;
  llamarHref: string | null;
  whatsappHref: string | null;
  instructionsLine: string;
};

export type BienesRaicesPrivadoLocationVm = {
  mapsUrl: string | null;
  line1: string;
  cityStateZip: string;
  hasMeaningfulAddress: boolean;
};

/** Category-aware listing output — same visual shell as Negocio; one particular seller, no business CTAs. */
export type BienesRaicesPrivadoPreviewVm = {
  categoria: BrNegocioCategoriaPropiedad;
  platformLogoUrl: string;
  heroTitle: string;
  addressLine: string;
  priceDisplay: string;
  listingStatusLabel: string;
  operationSummary: string;
  quickFacts: BienesRaicesPreviewQuickFactVm[];
  seller: BienesRaicesPrivadoSellerVm;
  media: BienesRaicesPreviewMediaVm;
  propertyDetailsRows: BienesRaicesPreviewFact[];
  highlightsRows: BienesRaicesPreviewFact[];
  hasHighlights: boolean;
  description: string;
  hasDescription: boolean;
  contactRailTitle: string;
  contact: BienesRaicesPrivadoContactRailVm;
  location: BienesRaicesPrivadoLocationVm;
  footerNote: string;
};
