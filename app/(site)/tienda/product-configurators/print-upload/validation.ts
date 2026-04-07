import { PRINT_UPLOAD_MIN_PPI_PROXY } from "./constants";
import { getPrintUploadConfig, needsSeparateBackFile } from "./productConfigs";
import { isAcceptedMime, fileExceedsMaxBytes } from "./fileHelpers";
import type {
  PrintUploadDocument,
  PrintUploadProductConfig,
  PrintUploadValidationItem,
  PrintUploadValidationResult,
  SpecOptionSize,
} from "./types";

const ASPECT_RATIO_MISMATCH = 1.12;

function checkAspectMismatch(
  label: "front" | "back",
  f: NonNullable<PrintUploadDocument["frontFile"]>,
  size: SpecOptionSize,
  items: PrintUploadValidationItem[]
) {
  if (f.mime === "application/pdf") return;
  if (f.widthPx == null || f.heightPx == null) return;
  const trimR = size.widthIn / size.heightIn;
  const fileR = f.widthPx / f.heightPx;
  if (!(trimR > 0 && fileR > 0)) return;
  const skew = Math.max(trimR / fileR, fileR / trimR);
  if (skew > ASPECT_RATIO_MISMATCH) {
    items.push({
      id: `${label}-aspect`,
      severity: "soft",
      messageEs: `La proporción del archivo no coincide bien con el tamaño elegido (${size.labelEs}). Si hay sangrado amplio o piezas aparte, Leonix lo revisará.`,
      messageEn: `The file’s aspect ratio doesn’t closely match the selected trim (${size.labelEn}). If you included extra bleed or separate panels, Leonix will review.`,
    });
  }
}

export function validatePrintUploadDocument(doc: PrintUploadDocument): PrintUploadValidationResult {
  const items: PrintUploadValidationItem[] = [];
  const cfg = getPrintUploadConfig(doc.productSlug);
  if (!cfg) {
    return {
      items: [
        {
          id: "bad-product",
          severity: "hard",
          messageEs: "Producto no reconocido.",
          messageEn: "Unknown product.",
        },
      ],
      hardCount: 1,
      softCount: 0,
      hasBlockingIssues: true,
      approvalComplete: false,
      canContinue: false,
    };
  }

  if (!doc.frontFile) {
    items.push({
      id: "no-front-file",
      severity: "hard",
      messageEs: "Sube el archivo principal para continuar.",
      messageEn: "Upload the primary file to continue.",
    });
  } else {
    if (!isAcceptedMime(doc.frontFile.mime)) {
      items.push({
        id: "front-type",
        severity: "hard",
        messageEs: "Tipo de archivo no admitido. Usa PDF, PNG o JPG.",
        messageEn: "Unsupported file type. Use PDF, PNG, or JPG.",
      });
    }
    if (fileExceedsMaxBytes(doc.frontFile.file)) {
      items.push({
        id: "front-size",
        severity: "hard",
        messageEs: "El archivo es demasiado grande.",
        messageEn: "File is too large.",
      });
    }
  }

  if (needsSeparateBackFile(cfg, doc.specs)) {
    if (!doc.backFile) {
      items.push({
        id: "no-back-file",
        severity: "hard",
        messageEs: "Para dos lados, sube también el archivo del reverso.",
        messageEn: "For two‑sided printing, upload the back file too.",
      });
    } else {
      if (!isAcceptedMime(doc.backFile.mime)) {
        items.push({
          id: "back-type",
          severity: "hard",
          messageEs: "El reverso tiene un tipo de archivo no admitido.",
          messageEn: "Back file type is not supported.",
        });
      }
      if (fileExceedsMaxBytes(doc.backFile.file)) {
        items.push({
          id: "back-size",
          severity: "hard",
          messageEs: "El archivo del reverso es demasiado grande.",
          messageEn: "Back file is too large.",
        });
      }
    }
  }

  const size = cfg.sizes.find((s) => s.id === doc.specs.sizeId);
  if (!size) {
    items.push({
      id: "bad-size",
      severity: "hard",
      messageEs: "Selecciona un tamaño válido.",
      messageEn: "Pick a valid size.",
    });
  }

  if (!cfg.quantities.includes(doc.specs.quantity)) {
    items.push({
      id: "bad-qty",
      severity: "hard",
      messageEs: "Selecciona una cantidad válida.",
      messageEn: "Pick a valid quantity.",
    });
  }

  const checkDims = (label: "front" | "back", f: typeof doc.frontFile, minW: number, minH: number) => {
    if (!f) return;
    if (f.mime === "application/pdf") {
      items.push({
        id: `${label}-pdf-preview`,
        severity: "soft",
        messageEs:
          label === "front"
            ? "PDF: la vista previa es resumen solamente. Verifica el archivo final antes de aprobar."
            : "PDF (reverso): vista previa resumida.",
        messageEn:
          label === "front"
            ? "PDF: preview shows summary only. Verify your final PDF before approving."
            : "PDF (back): summary preview only.",
      });
      return;
    }
    if (f.widthPx != null && f.heightPx != null) {
      if (f.widthPx < minW || f.heightPx < minH) {
        items.push({
          id: `${label}-low-res`,
          severity: "soft",
          messageEs: `Imagen posiblemente baja resolución (~${minW}×${minH}px sugeridos para este tamaño).`,
          messageEn: `Image may be low resolution (~${minW}×${minH}px suggested for this trim size).`,
        });
      }
    }
  };

  if (size) {
    const minW = Math.round(size.widthIn * PRINT_UPLOAD_MIN_PPI_PROXY);
    const minH = Math.round(size.heightIn * PRINT_UPLOAD_MIN_PPI_PROXY);
    checkDims("front", doc.frontFile, minW, minH);
    checkDims("back", doc.backFile, minW, minH);
    if (doc.frontFile) checkAspectMismatch("front", doc.frontFile, size, items);
    if (doc.backFile) checkAspectMismatch("back", doc.backFile, size, items);
  }

  if (cfg.sideUploadMode === "second-when-two-sided" && doc.specs.sidesId === "one-sided" && doc.backFile) {
    items.push({
      id: "extra-back",
      severity: "soft",
      messageEs: "Pediste un lado; el archivo de reverso se ignorará al aprobar.",
      messageEn: "One‑sided selected; the back file will be ignored when you approve.",
    });
  }

  const hardCount = items.filter((i) => i.severity === "hard").length;
  const softCount = items.filter((i) => i.severity === "soft").length;

  const approvalComplete =
    doc.approval.reviewedSpecsAndFile &&
    doc.approval.printAsSubmitted &&
    doc.approval.noLeonixLiabilityForArtwork &&
    doc.approval.willContactForDesignHelp;

  const hasBlockingIssues = hardCount > 0;
  const canContinue = !hasBlockingIssues && approvalComplete;

  return {
    items,
    hardCount,
    softCount,
    hasBlockingIssues,
    approvalComplete,
    canContinue,
  };
}
