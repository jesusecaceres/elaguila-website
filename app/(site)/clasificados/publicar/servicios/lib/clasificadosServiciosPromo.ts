import type { ClasificadosServiciosPromoRow, ClasificadosServiciosCouponRow } from "./clasificadosServiciosApplicationTypes";

export const MAX_CLASIFICADOS_PROMOTIONS = 4;
export const CLASIFICADOS_PROMO_TITLE_MAX = 120;
export const CLASIFICADOS_PROMO_DETAILS_MAX = 800;
export const CLASIFICADOS_PROMO_LINK_MAX = 2048;

export function createEmptyClasificadosPromoRow(): ClasificadosServiciosPromoRow {
  return {
    title: "",
    details: "",
    link: "",
    imageUrl: "",
    pdfUrl: "",
    pdfFileName: "",
    pdfFileSizeBytes: 0,
    primaryAsset: "none",
    qrLater: false,
  };
}

export function clasificadosPromoRowIsActive(row: ClasificadosServiciosPromoRow): boolean {
  return Boolean(
    row.title.trim() ||
      row.details.trim() ||
      row.link.trim() ||
      row.imageUrl.trim() ||
      row.pdfUrl.trim(),
  );
}

/** Leave-guard: any user intent on the row (including QR placeholder). */
export function clasificadosPromoRowHasProgress(row: ClasificadosServiciosPromoRow): boolean {
  return clasificadosPromoRowIsActive(row) || row.qrLater === true;
}

/** Check if a coupon row has any user input */
export function clasificadosCouponRowHasProgress(row: ClasificadosServiciosCouponRow): boolean {
  return Boolean(
    row.title.trim() ||
      row.description.trim() ||
      row.regularPrice.trim() ||
      row.specialPrice.trim() ||
      row.savings.trim() ||
      row.imageUrl.trim() ||
      row.url.trim() ||
      row.couponCode.trim() ||
      row.expirationDate.trim() ||
      row.redemptionNote.trim() ||
      row.ctaLabel.trim(),
  );
}
