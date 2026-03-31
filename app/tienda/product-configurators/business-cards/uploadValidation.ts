import { DEFAULT_MAX_FILE_MB } from "../print-upload/constants";
import { isAcceptedMime } from "../print-upload/fileHelpers";
import type { PrintUploadSessionPayloadV1 } from "../../order/mappers/printUploadDocumentToReview";

/** Business card customer uploads — aligned with print-upload MIME set. */
export const BUSINESS_CARD_UPLOAD_MAX_MB = Math.min(80, DEFAULT_MAX_FILE_MB);

export const BUSINESS_CARD_TRIM_RATIO = 3.5 / 2;

export type BcUploadFileSlotMeta = NonNullable<PrintUploadSessionPayloadV1["frontMeta"]>;

export type BcUploadValidationItem = {
  severity: "hard" | "soft";
  messageEs: string;
  messageEn: string;
};

function approxTrimRatio(w: number, h: number): number {
  const lo = Math.min(w, h);
  const hi = Math.max(w, h);
  return hi / lo;
}

export function validateBusinessCardUploadMeta(input: {
  front: BcUploadFileSlotMeta | null;
  back: BcUploadFileSlotMeta | null;
  sidedness: "one-sided" | "two-sided";
}): BcUploadValidationItem[] {
  const items: BcUploadValidationItem[] = [];
  const { front, back, sidedness } = input;

  if (!front?.dataUrl) {
    items.push({
      severity: "hard",
      messageEs: "Falta el archivo del frente.",
      messageEn: "Front artwork file is required.",
    });
    return items;
  }

  if (!isAcceptedMime(front.mime)) {
    items.push({
      severity: "hard",
      messageEs: "Tipo de archivo no admitido en el frente (usa PDF, PNG, JPG o TIFF).",
      messageEn: "Unsupported front file type (use PDF, PNG, JPG, or TIFF).",
    });
  }

  if (front.sizeBytes > BUSINESS_CARD_UPLOAD_MAX_MB * 1024 * 1024) {
    items.push({
      severity: "hard",
      messageEs: `El frente supera ${BUSINESS_CARD_UPLOAD_MAX_MB} MB.`,
      messageEn: `Front file exceeds ${BUSINESS_CARD_UPLOAD_MAX_MB} MB.`,
    });
  }

  if (sidedness === "two-sided") {
    if (!back?.dataUrl) {
      items.push({
        severity: "hard",
        messageEs: "Para tarjetas a dos caras, sube también el reverso.",
        messageEn: "Two-sided cards require a back artwork file.",
      });
    } else {
      if (!isAcceptedMime(back.mime)) {
        items.push({
          severity: "hard",
          messageEs: "Tipo de archivo no admitido en el reverso.",
          messageEn: "Unsupported back file type.",
        });
      }
      if (back.sizeBytes > BUSINESS_CARD_UPLOAD_MAX_MB * 1024 * 1024) {
        items.push({
          severity: "hard",
          messageEs: `El reverso supera ${BUSINESS_CARD_UPLOAD_MAX_MB} MB.`,
          messageEn: `Back file exceeds ${BUSINESS_CARD_UPLOAD_MAX_MB} MB.`,
        });
      }
    }
  }

  const hard = items.filter((i) => i.severity === "hard");
  if (hard.length) return hard;

  if (front.mime === "application/pdf") {
    items.push({
      severity: "soft",
      messageEs: "PDF: la vista previa en navegador es limitada. Leonix usará tu archivo original.",
      messageEn: "PDF: browser preview is limited. Leonix will use your original file.",
    });
  }

  const checkDims = (meta: BcUploadFileSlotMeta, sideLabelEs: string, sideLabelEn: string) => {
    if (meta.mime === "application/pdf") return;
    if (meta.widthPx == null || meta.heightPx == null) return;
    const short = Math.min(meta.widthPx, meta.heightPx);
    if (short < 600) {
      items.push({
        severity: "soft",
        messageEs: `${sideLabelEs}: resolución baja para impresión nítida (~300 dpi sugerido en 3.5×2″).`,
        messageEn: `${sideLabelEn}: resolution may be low for crisp print (~300 dpi suggested at 3.5×2″).`,
      });
    }
    const r = approxTrimRatio(meta.widthPx, meta.heightPx);
    if (Math.abs(r - BUSINESS_CARD_TRIM_RATIO) > 0.28) {
      items.push({
        severity: "soft",
        messageEs: `${sideLabelEs}: la proporción no coincide claramente con 3.5×2″ — verifica el arte final.`,
        messageEn: `${sideLabelEn}: aspect ratio is not clearly 3.5×2″ — confirm final trim artwork.`,
      });
    }
  };

  checkDims(front, "Frente", "Front");
  if (sidedness === "two-sided" && back?.dataUrl) {
    checkDims(back, "Reverso", "Back");
  }

  return items;
}

export function bcUploadHasHardStops(items: BcUploadValidationItem[]): boolean {
  return items.some((i) => i.severity === "hard");
}
