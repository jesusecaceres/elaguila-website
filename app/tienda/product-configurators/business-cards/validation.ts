import { LOGO_MAX_MB, LOGO_MIN_PIXEL_DIM } from "./constants";
import type { BusinessCardDocument, BusinessCardSide, BusinessCardValidationItem, BusinessCardValidationResult } from "./types";

function hasContact(side: BusinessCardDocument["front"]): boolean {
  const f = side.fields;
  return [f.phone, f.email, f.website, f.address].some((s) => s.trim().length > 0);
}

function backIsEmpty(doc: BusinessCardDocument): boolean {
  const b = doc.back.fields;
  const allEmpty =
    Object.values(b).every((v) => !v.trim()) &&
    !doc.back.logo.file &&
    !doc.back.logo.previewUrl;
  return allEmpty;
}

function countFilledFields(side: BusinessCardDocument["front"]): number {
  return Object.values(side.fields).filter((v) => v.trim().length > 0).length;
}

function edgeProximityWarning(doc: BusinessCardDocument, side: BusinessCardSide): BusinessCardValidationItem | null {
  const s = side === "front" ? doc.front : doc.back;
  const pos = s.textLayout.groupPosition;
  const companyLen = s.fields.company.trim().length;
  const isEdge = pos.startsWith("top-") || pos.startsWith("bottom-");
  if (isEdge && companyLen > 34) {
    return {
      id: "edge-text",
      severity: "soft",
      messageEs: "Mucho texto cerca del borde puede acercarse al corte. Considera centrado o menos líneas.",
      messageEn: "Lots of text near the trim may sit close to the cut. Consider centering or fewer lines.",
    };
  }
  return null;
}

export function validateBusinessCardDocument(doc: BusinessCardDocument): BusinessCardValidationResult {
  const items: BusinessCardValidationItem[] = [];

  const company = doc.front.fields.company.trim();
  if (!company) {
    items.push({
      id: "company-required",
      severity: "hard",
      messageEs: "Agrega el nombre del negocio o empresa.",
      messageEn: "Add a business or company name.",
    });
  }

  if (!hasContact(doc.front)) {
    items.push({
      id: "contact-required",
      severity: "hard",
      messageEs: "Incluye al menos un dato de contacto (teléfono, correo, web o dirección).",
      messageEn: "Include at least one contact method (phone, email, website, or address).",
    });
  }

  if (doc.sidedness === "two-sided" && backIsEmpty(doc)) {
    items.push({
      id: "back-empty",
      severity: "hard",
      messageEs: "El reverso está vacío. Agrega contenido o desactiva líneas en el frente si no usarás reverso.",
      messageEn: "The back is empty. Add content—or adjust your plan for a two‑sided card.",
    });
  }

  const logo = doc.front.logo;
  if (!logo.previewUrl && !logo.file) {
    items.push({
      id: "logo-missing",
      severity: "soft",
      messageEs: "No hay logo. Puedes continuar, pero tu tarjeta se verá sin marca gráfica.",
      messageEn: "No logo uploaded. You can continue, but the card will lack brand artwork.",
    });
  }

  if (logo.file) {
    const mb = logo.file.size / (1024 * 1024);
    if (mb > LOGO_MAX_MB) {
      items.push({
        id: "logo-too-large",
        severity: "hard",
        messageEs: `El logo supera ${LOGO_MAX_MB} MB. Usa un archivo más liviano.`,
        messageEn: `Logo exceeds ${LOGO_MAX_MB} MB. Use a smaller file.`,
      });
    }
  }

  if (
    logo.naturalWidth != null &&
    logo.naturalHeight != null &&
    Math.min(logo.naturalWidth, logo.naturalHeight) < LOGO_MIN_PIXEL_DIM
  ) {
    items.push({
      id: "logo-low-res",
      severity: "soft",
      messageEs: `La imagen del logo es pequeña (menos de ~${LOGO_MIN_PIXEL_DIM}px). Podría verse suave al imprimir.`,
      messageEn: `Logo image is small (under ~${LOGO_MIN_PIXEL_DIM}px). It may print softly.`,
    });
  }

  if (countFilledFields(doc.front) < 2) {
    items.push({
      id: "front-sparse",
      severity: "soft",
      messageEs: "El frente tiene poca información. Verifica que sea suficiente para quien la reciba.",
      messageEn: "The front has very little information. Make sure it’s enough for recipients.",
    });
  }

  if (doc.sidedness === "two-sided") {
    const n = countFilledFields(doc.back);
    if (n > 0 && n < 2 && !doc.back.logo.previewUrl) {
      items.push({
        id: "back-sparse",
        severity: "soft",
        messageEs: "El reverso tiene poco contenido. Está bien si es intencional.",
        messageEn: "The back is light on content—that’s OK if intentional.",
      });
    }
  }

  const edgeFront = edgeProximityWarning(doc, "front");
  if (edgeFront) items.push(edgeFront);
  const edgeBack = edgeProximityWarning(doc, "back");
  if (edgeBack) items.push(edgeBack);

  const hardCount = items.filter((i) => i.severity === "hard").length;
  const softCount = items.filter((i) => i.severity === "soft").length;
  const approvalComplete =
    doc.approval.spellingReviewed &&
    doc.approval.layoutReviewed &&
    doc.approval.printAsApproved &&
    doc.approval.noRedesignExpectation;

  const hasBlockingContentIssues = hardCount > 0;
  const canContinue = !hasBlockingContentIssues && approvalComplete;

  return {
    items,
    hardCount,
    softCount,
    hasBlockingContentIssues,
    approvalComplete,
    canContinue,
  };
}
