import { LOGO_MAX_MB, LOGO_MIN_PIXEL_DIM } from "./constants";
import type {
  BusinessCardDocument,
  BusinessCardSide,
  BusinessCardTextBlock,
  BusinessCardValidationItem,
  BusinessCardValidationResult,
  TextFieldRole,
} from "./types";

const SAFE_CENTER_MARGIN = 10;
const LOGO_EDGE_MARGIN = 8;

function hasContact(side: BusinessCardDocument["front"]): boolean {
  const f = side.fields;
  return [f.phone, f.email, f.website, f.address].some((s) => s.trim().length > 0);
}

/** True when this side has nothing meaningful to print (fields, logo, or visible text blocks). */
function sideHasRenderableContent(side: BusinessCardDocument["front"]): boolean {
  if (side.logo.file || side.logo.previewUrl) return true;
  if (Object.values(side.fields).some((v) => v.trim().length > 0)) return true;
  for (const b of side.textBlocks) {
    if (!b.text.trim()) continue;
    if (b.role === "custom") return true;
    if (side.textLayout.lineVisible[b.role as TextFieldRole]) return true;
  }
  return false;
}

function backIsEmpty(doc: BusinessCardDocument): boolean {
  return !sideHasRenderableContent(doc.back);
}

function countFilledFields(side: BusinessCardDocument["front"]): number {
  return Object.values(side.fields).filter((v) => v.trim().length > 0).length;
}

function edgeProximityLegacy(doc: BusinessCardDocument, side: BusinessCardSide): BusinessCardValidationItem | null {
  if (doc.front.textBlocks.length > 0 || doc.back.textBlocks.length > 0) return null;
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

function blockIsVisible(side: BusinessCardDocument["front"], b: BusinessCardTextBlock): boolean {
  if (!b.text.trim()) return false;
  if (b.role === "custom") return true;
  return side.textLayout.lineVisible[b.role as TextFieldRole];
}

function roughBlocksOverlap(a: BusinessCardTextBlock, b: BusinessCardTextBlock): boolean {
  const dyEst = Math.max(6, (a.fontSize + b.fontSize) * 0.35);
  const halfWidths = (a.widthPct + b.widthPct) / 2;
  const dx = Math.abs(a.xPct - b.xPct);
  const dy = Math.abs(a.yPct - b.yPct);
  return dx < halfWidths * 0.55 && dy < dyEst;
}

function freeformOverlapWarning(side: BusinessCardDocument["front"], sideKey: "front" | "back"): BusinessCardValidationItem | null {
  const visible = side.textBlocks.filter((b) => blockIsVisible(side, b));
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      if (roughBlocksOverlap(visible[i]!, visible[j]!)) {
        return {
          id: `overlap-${sideKey}`,
          severity: "soft",
          messageEs: "Algunos bloques de texto podrían superponerse en la tarjeta. Sepáralos o reduce tamaño.",
          messageEn: "Some text blocks may overlap on the card. Space them apart or reduce size.",
        };
      }
    }
  }
  return null;
}

function freeformNearTrimBlock(
  side: BusinessCardDocument["front"],
  sideKey: "front" | "back"
): BusinessCardValidationItem | null {
  for (const b of side.textBlocks) {
    if (!blockIsVisible(side, b)) continue;
    if (
      b.xPct < SAFE_CENTER_MARGIN ||
      b.xPct > 100 - SAFE_CENTER_MARGIN ||
      b.yPct < SAFE_CENTER_MARGIN ||
      b.yPct > 100 - SAFE_CENTER_MARGIN
    ) {
      return {
        id: `near-trim-text-${sideKey}`,
        severity: "soft",
        messageEs:
          sideKey === "front"
            ? "Un bloque queda cerca del borde de corte. Comprueba la zona segura (guías doradas al 8%)."
            : "Un bloque en el reverso queda cerca del borde. Revisa la zona segura.",
        messageEn:
          sideKey === "front"
            ? "A text block sits close to the trim. Check the safe zone (gold guides at 8% inset)."
            : "A back text block sits close to the trim. Check the safe zone.",
      };
    }
  }
  return null;
}

function logoNearTrim(side: BusinessCardDocument["front"], sideKey: "front" | "back"): BusinessCardValidationItem | null {
  if (!side.logo.visible || !side.logo.previewUrl) return null;
  const { xPct, yPct, widthPct } = side.logoGeom;
  const half = widthPct / 2;
  if (
    xPct - half < LOGO_EDGE_MARGIN ||
    xPct + half > 100 - LOGO_EDGE_MARGIN ||
    yPct - half < LOGO_EDGE_MARGIN ||
    yPct + half > 100 - LOGO_EDGE_MARGIN
  ) {
    return {
      id: `near-trim-logo-${sideKey}`,
      severity: "soft",
      messageEs:
        sideKey === "front"
          ? "El logo está cerca del corte o del límite seguro. Acércalo al centro o reduce ancho."
          : "El logo del reverso queda cerca del corte. Ajusta posición o tamaño.",
      messageEn:
        sideKey === "front"
          ? "The logo is close to the trim or safe edge. Move inward or reduce width."
          : "Back logo is close to the trim. Adjust position or size.",
    };
  }
  return null;
}

function logoLowRes(
  side: BusinessCardDocument["front"],
  sideKey: "front" | "back"
): BusinessCardValidationItem | null {
  const logo = side.logo;
  if (!logo.previewUrl && !logo.file) return null;
  if (
    logo.naturalWidth != null &&
    logo.naturalHeight != null &&
    Math.min(logo.naturalWidth, logo.naturalHeight) < LOGO_MIN_PIXEL_DIM
  ) {
    return {
      id: `logo-low-res-${sideKey}`,
      severity: "soft",
      messageEs:
        sideKey === "front"
          ? `Logo pequeño (menos de ~${LOGO_MIN_PIXEL_DIM}px). Podría perder nitidez al imprimir.`
          : `Logo del reverso pequeño (menos de ~${LOGO_MIN_PIXEL_DIM}px).`,
      messageEn:
        sideKey === "front"
          ? `Logo is small (under ~${LOGO_MIN_PIXEL_DIM}px). It may print softly.`
          : `Back logo is small (under ~${LOGO_MIN_PIXEL_DIM}px).`,
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
      messageEs: "El reverso está vacío. Agrega contenido, bloques o logo — o elige tarjeta a un lado.",
      messageEn: "The back is empty. Add content, blocks, or a logo—or choose a one‑sided product.",
    });
  }

  const frontLogo = doc.front.logo;
  if (!frontLogo.previewUrl && !frontLogo.file) {
    items.push({
      id: "logo-missing",
      severity: "soft",
      messageEs: "No hay logo en el frente. Puedes continuar, pero la marca será solo tipográfica.",
      messageEn: "No logo on the front. You can continue, but branding will be type-only.",
    });
  }

  if (frontLogo.file) {
    const mb = frontLogo.file.size / (1024 * 1024);
    if (mb > LOGO_MAX_MB) {
      items.push({
        id: "logo-too-large",
        severity: "hard",
        messageEs: `El logo supera ${LOGO_MAX_MB} MB. Usa un archivo más liviano.`,
        messageEn: `Logo exceeds ${LOGO_MAX_MB} MB. Use a smaller file.`,
      });
    }
  }

  if (doc.back.logo.file) {
    const mb = doc.back.logo.file.size / (1024 * 1024);
    if (mb > LOGO_MAX_MB) {
      items.push({
        id: "logo-back-too-large",
        severity: "hard",
        messageEs: `El logo del reverso supera ${LOGO_MAX_MB} MB.`,
        messageEn: `Back logo exceeds ${LOGO_MAX_MB} MB.`,
      });
    }
  }

  const lrFront = logoLowRes(doc.front, "front");
  if (lrFront) items.push(lrFront);
  const lrBack = logoLowRes(doc.back, "back");
  if (lrBack) items.push(lrBack);

  const hasFreeform =
    doc.front.textBlocks.length > 0 ||
    doc.back.textBlocks.length > 0 ||
    (doc.front.logo.visible && !!doc.front.logo.previewUrl);
  if (hasFreeform && !doc.guidesVisible) {
    items.push({
      id: "guides-hidden",
      severity: "soft",
      messageEs: "Activa las guías (zona segura y sangrado) para revisar antes de enviar.",
      messageEn: "Turn on trim/safe-zone guides to review positioning before submitting.",
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
    const hasBackLogo = Boolean(doc.back.logo.previewUrl || doc.back.logo.file);
    const hasCustomOnBack = doc.back.textBlocks.some((b) => b.role === "custom" && b.text.trim().length > 0);
    if (n > 0 && n < 2 && !hasBackLogo && !hasCustomOnBack && sideHasRenderableContent(doc.back)) {
      items.push({
        id: "back-sparse",
        severity: "soft",
        messageEs: "El reverso tiene poco contenido. Está bien si es intencional.",
        messageEn: "The back is light on content—that’s OK if intentional.",
      });
    }
  }

  const ovF = freeformOverlapWarning(doc.front, "front");
  if (ovF) items.push(ovF);
  const ovB = freeformOverlapWarning(doc.back, "back");
  if (ovB) items.push(ovB);

  const ntF = freeformNearTrimBlock(doc.front, "front");
  if (ntF) items.push(ntF);
  const ntB = freeformNearTrimBlock(doc.back, "back");
  if (ntB) items.push(ntB);

  const ntlF = logoNearTrim(doc.front, "front");
  if (ntlF) items.push(ntlF);
  const ntlB = logoNearTrim(doc.back, "back");
  if (ntlB) items.push(ntlB);

  const edgeFront = edgeProximityLegacy(doc, "front");
  if (edgeFront) items.push(edgeFront);
  const edgeBack = edgeProximityLegacy(doc, "back");
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
