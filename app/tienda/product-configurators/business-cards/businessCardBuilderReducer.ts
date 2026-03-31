import type {
  BusinessCardApprovalChecks,
  BusinessCardDocument,
  BusinessCardImageBlock,
  BusinessCardSide,
  BusinessCardTextLayout,
  LayoutPreset,
  ScalePreset,
  TextFieldRole,
} from "./types";

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
  | { type: "RESET"; document: BusinessCardDocument };

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
      return patchSide(state, action.side, (s) => ({
        ...s,
        fields: { ...s.fields, [action.role]: action.value },
      }));
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
      return patchSide(state, action.side, (s) => ({
        ...s,
        logo: { ...s.logo, position: action.position },
      }));
    case "SET_TEXT_GROUP_SCALE":
      return patchSide(state, action.side, (s) => ({
        ...s,
        textLayout: { ...s.textLayout, groupScale: action.scale },
      }));
    case "SET_LOGO_SCALE":
      return patchSide(state, action.side, (s) => ({
        ...s,
        logo: { ...s.logo, scale: action.scale },
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
    default:
      return state;
  }
}
