/**
 * Durable Tienda asset storage contract — Blob + future Stripe/DB.
 */

import type { TiendaOrderSource } from "./orderHandoff";

export type TiendaAssetRole =
  | "business-card-front"
  | "business-card-back"
  | "upload-front"
  | "upload-back"
  | "design-json-snapshot";

/** One row persisted in Blob metadata / submission payload. */
export type TiendaOrderAssetReference = {
  role: TiendaAssetRole;
  orderId: string;
  source: TiendaOrderSource;
  productSlug: string;
  /** Original customer filename when applicable (print uploads). */
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  widthPx: number | null;
  heightPx: number | null;
  /** Vercel Blob pathname */
  storagePath: string;
  /** Public Blob URL for staff download */
  publicUrl: string;
  createdAtIso: string;
};

export type TiendaStoredAsset = TiendaOrderAssetReference;

export type TiendaAssetUploadResult = {
  ok: true;
  reference: TiendaOrderAssetReference;
};
