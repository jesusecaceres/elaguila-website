/**
 * Single place for `BusinessCardDocument` state transitions from the builder (dispatch actions).
 * Template application, LEO finishing pass, and block/field sync are orchestrated here.
 */
import type { Lang } from "../../types/tienda";
import type {
  BusinessCardApprovalChecks,
  BusinessCardCanvasBackground,
  BusinessCardDesignerV2NativeObject,
  BusinessCardDocument,
  BusinessCardImageBlock,
  BusinessCardLogoGeom,
  BusinessCardSide,
  BusinessCardTextBlock,
  BusinessCardTextLayout,
  LayoutPreset,
  ScalePreset,
  TextFieldRole,
} from "./types";
import type { BusinessCardDesignIntake } from "./types";
import type { BusinessCardTemplateId } from "./templates";
import { applyLeoFinishingPass } from "./businessCardLeoAdvisor";
import { applyBusinessCardTemplateToDocument, syncFieldsFromBlocks, syncSideBlocksFromFields } from "./templates";
import {
  layoutPresetToLogoGeomCenter,
  scaleToLogoPercent,
  widthPctToNearestLogoScale,
} from "./layoutPresets";

export type BusinessCardBuilderAction =
  | { type: "SET_ACTIVE_SIDE"; side: BusinessCardSide }
  | { type: "SET_FIELD"; side: BusinessCardSide; role: TextFieldRole; value: string }
  | {
      type: "SET_LOGO";
      side: BusinessCardSide;
      payload: Pick<BusinessCardImageBlock, "file" | "previewUrl" | "naturalWidth" | "naturalHeight">;
    }
  | { type: "CLEAR_LOGO"; side: BusinessCardSide }
  | { type: "SET_LOGO_VISIBLE"; side: BusinessCardSide; visible: boolean }
  | { type: "SET_TEXT_GROUP_POSITION"; side: BusinessCardSide; position: LayoutPreset }
  | { type: "SET_LOGO_POSITION"; side: BusinessCardSide; position: LayoutPreset }
  | { type: "SET_TEXT_GROUP_SCALE"; side: BusinessCardSide; scale: ScalePreset }
  | { type: "SET_LOGO_SCALE"; side: BusinessCardSide; scale: ScalePreset }
  | { type: "TOGGLE_LINE"; side: BusinessCardSide; role: TextFieldRole; visible: boolean }
  | { type: "TOGGLE_GUIDES" }
  | { type: "SET_TEXT_NUDGE"; x: number; y: number }
  | { type: "SET_LOGO_NUDGE"; x: number; y: number }
  | { type: "SET_APPROVAL"; patch: Partial<BusinessCardApprovalChecks> }
  | { type: "SET_CANVAS_BACKGROUND"; payload: BusinessCardCanvasBackground }
  | { type: "APPLY_TEMPLATE"; templateId: BusinessCardTemplateId; lang: Lang }
  | { type: "SET_DESIGN_INTAKE"; designIntake: BusinessCardDesignIntake }
  | { type: "SET_TEXT_BLOCK"; side: BusinessCardSide; id: string; patch: Partial<BusinessCardTextBlock> }
  | { type: "ADD_CUSTOM_TEXT_BLOCK"; side: BusinessCardSide; lang: Lang }
  | { type: "REMOVE_TEXT_BLOCK"; side: BusinessCardSide; id: string }
  | {
      type: "DUPLICATE_CUSTOM_TEXT_BLOCK";
      side: BusinessCardSide;
      sourceId: string;
      newId: string;
      lang: Lang;
    }
  | { type: "SET_LOGO_GEOM"; side: BusinessCardSide; patch: Partial<BusinessCardLogoGeom> }
  | { type: "V2_ADD_NATIVE_IMAGE"; side: BusinessCardSide; object: Extract<BusinessCardDesignerV2NativeObject, { kind: "native-image" }> }
  | { type: "V2_ADD_NATIVE_SHAPE"; side: BusinessCardSide; object: Extract<BusinessCardDesignerV2NativeObject, { kind: "native-shape" }> }
  | {
      type: "V2_PATCH_NATIVE_OBJECT";
      side: BusinessCardSide;
      id: string;
      patch: Partial<BusinessCardDesignerV2NativeObject>;
    }
  | { type: "V2_DELETE_NATIVE_OBJECT"; side: BusinessCardSide; id: string }
  | { type: "V2_REORDER_NATIVE_OBJECT"; side: BusinessCardSide; id: string; delta: 1 | -1 }
  | { type: "RESET"; document: BusinessCardDocument };

function clampPctBlock(v: number): number {
  return Math.min(95, Math.max(5, v));
}

function ensureNativeList(s: BusinessCardDocument["front"]): BusinessCardDesignerV2NativeObject[] {
  return s.designerV2NativeObjects ?? [];
}

function reorderNativeZ(
  objects: BusinessCardDesignerV2NativeObject[],
  id: string,
  delta: 1 | -1
): BusinessCardDesignerV2NativeObject[] {
  if (objects.length <= 1) return objects;
  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);
  const i = sorted.findIndex((o) => o.id === id);
  if (i < 0) return objects;
  const j = i + delta;
  if (j < 0 || j >= sorted.length) return objects;
  const a = sorted[i];
  const b = sorted[j];
  return objects.map((o) => {
    if (o.id === a.id) return { ...o, zIndex: b.zIndex };
    if (o.id === b.id) return { ...o, zIndex: a.zIndex };
    return o;
  });
}

function patchSide(
  doc: BusinessCardDocument,
  side: BusinessCardSide,
  fn: (s: BusinessCardDocument["front"]) => BusinessCardDocument["front"]
): BusinessCardDocument {
  if (side === "front") {
    return { ...doc, front: fn(doc.front) };
  }
  return { ...doc, back: fn(doc.back) };
}

export function businessCardBuilderReducer(
  state: BusinessCardDocument,
  action: BusinessCardBuilderAction
): BusinessCardDocument {
  switch (action.type) {
    case "RESET":
      return action.document;
    case "SET_ACTIVE_SIDE":
      return { ...state, activeSide: action.side };
    case "SET_FIELD":
      return patchSide(state, action.side, (s) =>
        syncSideBlocksFromFields({
          ...s,
          fields: { ...s.fields, [action.role]: action.value },
        })
      );
    case "SET_LOGO":
      return patchSide(state, action.side, (s) => ({
        ...s,
        logo: {
          ...s.logo,
          ...action.payload,
        },
      }));
    case "CLEAR_LOGO":
      return patchSide(state, action.side, (s) => ({
        ...s,
        logo: {
          ...s.logo,
          file: null,
          previewUrl: null,
          naturalWidth: null,
          naturalHeight: null,
        },
      }));
    case "SET_LOGO_VISIBLE":
      return patchSide(state, action.side, (s) => ({
        ...s,
        logo: { ...s.logo, visible: action.visible },
      }));
    case "SET_TEXT_GROUP_POSITION":
      return patchSide(state, action.side, (s) => ({
        ...s,
        textLayout: { ...s.textLayout, groupPosition: action.position },
      }));
    case "SET_LOGO_POSITION":
      return patchSide(state, action.side, (s) => {
        const g = layoutPresetToLogoGeomCenter(action.position);
        return {
          ...s,
          logo: { ...s.logo, position: action.position },
          logoGeom: { ...s.logoGeom, xPct: g.xPct, yPct: g.yPct },
        };
      });
    case "SET_TEXT_GROUP_SCALE":
      return patchSide(state, action.side, (s) => ({
        ...s,
        textLayout: { ...s.textLayout, groupScale: action.scale },
      }));
    case "SET_LOGO_SCALE":
      return patchSide(state, action.side, (s) => ({
        ...s,
        logo: { ...s.logo, scale: action.scale },
        logoGeom: { ...s.logoGeom, widthPct: scaleToLogoPercent(action.scale) },
      }));
    case "TOGGLE_LINE":
      return patchSide(state, action.side, (s) => ({
        ...s,
        textLayout: {
          ...s.textLayout,
          lineVisible: { ...s.textLayout.lineVisible, [action.role]: action.visible },
        },
      }));
    case "TOGGLE_GUIDES":
      return { ...state, guidesVisible: !state.guidesVisible };
    case "SET_TEXT_NUDGE":
      return { ...state, textNudgeX: action.x, textNudgeY: action.y };
    case "SET_LOGO_NUDGE":
      return { ...state, logoNudgeX: action.x, logoNudgeY: action.y };
    case "SET_APPROVAL":
      return { ...state, approval: { ...state.approval, ...action.patch } };
    case "SET_CANVAS_BACKGROUND":
      return { ...state, canvasBackground: action.payload };
    case "SET_DESIGN_INTAKE":
      return {
        ...state,
        designIntake: action.designIntake,
        leoSnapshot: action.designIntake === "custom" ? undefined : state.leoSnapshot,
      };
    case "APPLY_TEMPLATE": {
      const { front, back, canvasBackground } = applyBusinessCardTemplateToDocument(
        action.templateId,
        action.lang,
        state.sidedness === "two-sided",
        { front: state.front, back: state.back }
      );
      const keepLeo = state.designIntake === "leo";
      /* Fresh template geometry — legacy nudges fight block positions and confuse the preview */
      const merged: typeof state = {
        ...state,
        version: 3,
        front,
        back,
        canvasBackground,
        designIntake: keepLeo ? "leo" : "template",
        leoSnapshot: keepLeo ? state.leoSnapshot : undefined,
        selectedTemplateId: action.templateId,
        textNudgeX: 0,
        textNudgeY: 0,
        logoNudgeX: 0,
        logoNudgeY: 0,
      };
      return keepLeo ? applyLeoFinishingPass(merged) : merged;
    }
    case "SET_TEXT_BLOCK":
      return patchSide(state, action.side, (s) => {
        const textBlocks = s.textBlocks.map((b) => (b.id === action.id ? { ...b, ...action.patch } : b));
        return syncFieldsFromBlocks({ ...s, textBlocks });
      });
    case "ADD_CUSTOM_TEXT_BLOCK":
      return patchSide(state, action.side, (s) => {
        const label = action.lang === "en" ? "Custom line" : "Línea personalizada";
        const nb: BusinessCardTextBlock = {
          id: `c-${Date.now().toString(36)}`,
          role: "custom",
          text: label,
          xPct: 50,
          yPct: 50,
          widthPct: 80,
          fontSize: 10,
          fontWeight: 500,
          color: "var(--lx-text)",
          textAlign: "center",
          zIndex: 12,
        };
        return syncFieldsFromBlocks({ ...s, textBlocks: [...s.textBlocks, nb] });
      });
    case "REMOVE_TEXT_BLOCK":
      return patchSide(state, action.side, (s) => ({
        ...s,
        textBlocks: s.textBlocks.filter((b) => !(b.id === action.id && b.role === "custom")),
      }));
    case "DUPLICATE_CUSTOM_TEXT_BLOCK":
      return patchSide(state, action.side, (s) => {
        const src = s.textBlocks.find((b) => b.id === action.sourceId && b.role === "custom");
        if (!src) return s;
        const copy: BusinessCardTextBlock = {
          ...src,
          id: action.newId,
          xPct: clampPctBlock(src.xPct + 4),
          yPct: clampPctBlock(src.yPct + 4),
          text:
            action.lang === "en" ? `${src.text.trim() || "Line"} (copy)` : `${src.text.trim() || "Línea"} (copia)`,
          zIndex: Math.min(30, src.zIndex + 1),
        };
        return { ...s, textBlocks: [...s.textBlocks, copy] };
      });
    case "SET_LOGO_GEOM":
      return patchSide(state, action.side, (s) => {
        const nextGeom = { ...s.logoGeom, ...action.patch };
        const nextLogo =
          action.patch.widthPct != null
            ? { ...s.logo, scale: widthPctToNearestLogoScale(action.patch.widthPct) }
            : s.logo;
        return {
          ...s,
          logoGeom: nextGeom,
          logo: nextLogo,
        };
      });
    case "V2_ADD_NATIVE_IMAGE":
      return patchSide(state, action.side, (s) => ({
        ...s,
        designerV2NativeObjects: [...ensureNativeList(s), action.object],
      }));
    case "V2_ADD_NATIVE_SHAPE":
      return patchSide(state, action.side, (s) => ({
        ...s,
        designerV2NativeObjects: [...ensureNativeList(s), action.object],
      }));
    case "V2_PATCH_NATIVE_OBJECT":
      return patchSide(state, action.side, (s) => ({
        ...s,
        designerV2NativeObjects: ensureNativeList(s).map((o) => {
          if (o.id !== action.id) return o;
          return { ...o, ...action.patch, id: o.id, kind: o.kind } as BusinessCardDesignerV2NativeObject;
        }),
      }));
    case "V2_DELETE_NATIVE_OBJECT":
      return patchSide(state, action.side, (s) => ({
        ...s,
        designerV2NativeObjects: ensureNativeList(s).filter((o) => o.id !== action.id),
      }));
    case "V2_REORDER_NATIVE_OBJECT":
      return patchSide(state, action.side, (s) => ({
        ...s,
        designerV2NativeObjects: reorderNativeZ(ensureNativeList(s), action.id, action.delta),
      }));
    default:
      return state;
  }
}
