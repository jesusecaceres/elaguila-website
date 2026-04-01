/**
 * One-way projection: canonical `BusinessCardDocument` → read model for a future design surface.
 * V1 reducer, persistence, LEO, and export stay on `BusinessCardDocument` until migration phases.
 */
import type {
  BusinessCardDocument,
  BusinessCardSide,
  BusinessCardSideState,
  TextFieldRole,
} from "../../types";
import { layoutPresetToLogoGeomCenter, scaleToLogoPercent, scaleToTextRem } from "../../layoutPresets";
import type {
  DesignerV2CanvasBackground,
  DesignerV2Document,
  DesignerV2ImageObject,
  DesignerV2Object,
  DesignerV2SideCompositionMode,
  DesignerV2SideModel,
  DesignerV2TextObject,
} from "../types";
import { DESIGNER_V2_SCHEMA_VERSION } from "../model/constants";

/** Matches legacy preview line order / editor field order */
const LEGACY_LINE_ORDER: TextFieldRole[] = [
  "company",
  "personName",
  "title",
  "tagline",
  "phone",
  "email",
  "website",
  "address",
];

function mapCanvasBackground(doc: BusinessCardDocument): DesignerV2CanvasBackground {
  const bg = doc.canvasBackground;
  if (bg.kind === "solid") return { kind: "solid", color: bg.color };
  return { kind: "preset", id: bg.id };
}

function textBlockToObject(state: BusinessCardSideState, b: BusinessCardSideState["textBlocks"][number]): DesignerV2TextObject {
  const visibleStandard =
    b.role !== "custom" ? state.textLayout.lineVisible[b.role as TextFieldRole] !== false : true;
  return {
    id: b.id,
    kind: "text",
    visible: visibleStandard,
    zIndex: b.zIndex,
    source: "v1-text-block",
    text: b.text,
    role: b.role,
    style: {
      fontSize: b.fontSize,
      fontWeight: b.fontWeight,
      color: b.color,
      textAlign: b.textAlign,
    },
    transform: {
      xPct: b.xPct,
      yPct: b.yPct,
      widthPct: b.widthPct,
      rotationDeg: 0,
    },
  };
}

function blockModeObjects(state: BusinessCardSideState): DesignerV2Object[] {
  const texts = state.textBlocks.map((b) => textBlockToObject(state, b));
  const logo: DesignerV2ImageObject = {
    id: "v1-logo",
    kind: "image",
    visible: state.logo.visible && Boolean(state.logo.previewUrl),
    zIndex: state.logoGeom.zIndex,
    source: "v1-logo",
    imageRole: "logo",
    transform: {
      xPct: state.logoGeom.xPct,
      yPct: state.logoGeom.yPct,
      widthPct: state.logoGeom.widthPct,
      rotationDeg: 0,
    },
  };
  return sortByZ([...texts, logo]);
}

function legacySyntheticTexts(state: BusinessCardSideState): DesignerV2TextObject[] {
  const baseRem = scaleToTextRem(state.textLayout.groupScale);
  const out: DesignerV2TextObject[] = [];
  let stackIndex = 0;
  for (const role of LEGACY_LINE_ORDER) {
    if (!state.textLayout.lineVisible[role]) continue;
    const t = state.fields[role].trim();
    if (!t) continue;
    const yPct = 30 + stackIndex * 9;
    stackIndex += 1;
    out.push({
      id: `v1-legacy-text-${role}`,
      kind: "text",
      visible: true,
      zIndex: 6,
      source: "v1-legacy-text-synthetic",
      role,
      text: t,
      style: {
        fontSize: baseRem,
        fontWeight: role === "company" ? 600 : 500,
        color: "var(--lx-text)",
        textAlign: "center",
      },
      transform: {
        xPct: 50,
        yPct: yPct,
        widthPct: 88,
        rotationDeg: 0,
      },
    });
  }
  return out;
}

function legacyLogoObject(state: BusinessCardSideState): DesignerV2ImageObject | null {
  if (!state.logo.visible || !state.logo.previewUrl) return null;
  const center = layoutPresetToLogoGeomCenter(state.logo.position);
  const widthPct = scaleToLogoPercent(state.logo.scale);
  return {
    id: "v1-legacy-logo",
    kind: "image",
    visible: true,
    zIndex: 5,
    source: "v1-legacy-logo-synthetic",
    imageRole: "logo",
    transform: {
      xPct: center.xPct,
      yPct: center.yPct,
      widthPct,
      rotationDeg: 0,
    },
  };
}

function legacyModeObjects(state: BusinessCardSideState): DesignerV2Object[] {
  const texts = legacySyntheticTexts(state);
  const logo = legacyLogoObject(state);
  return sortByZ(logo ? [...texts, logo] : texts);
}

function sortByZ(objects: DesignerV2Object[]): DesignerV2Object[] {
  return [...objects].sort((a, b) => a.zIndex - b.zIndex);
}

function sideToDesignerV2(side: BusinessCardSide, state: BusinessCardSideState): DesignerV2SideModel {
  const block = state.textBlocks.length > 0;
  const compositionMode: DesignerV2SideCompositionMode = block ? "block" : "legacy-stack";
  const objects = block ? blockModeObjects(state) : legacyModeObjects(state);
  return { side, compositionMode, objects };
}

export function designerV2FromBusinessCardDocument(doc: BusinessCardDocument): DesignerV2Document {
  return {
    schemaVersion: DESIGNER_V2_SCHEMA_VERSION,
    productSlug: doc.productSlug,
    sidedness: doc.sidedness,
    activeSide: doc.activeSide,
    canvasBackground: mapCanvasBackground(doc),
    textNudgeX: doc.textNudgeX,
    textNudgeY: doc.textNudgeY,
    logoNudgeX: doc.logoNudgeX,
    logoNudgeY: doc.logoNudgeY,
    guidesVisible: doc.guidesVisible,
    front: sideToDesignerV2("front", doc.front),
    back: sideToDesignerV2("back", doc.back),
    derivedFromDocumentId: doc.id,
  };
}
