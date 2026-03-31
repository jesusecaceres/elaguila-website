import type {
  PrintUploadApprovalChecks,
  PrintUploadDocument,
  PrintUploadFile,
  PrintUploadSpecSelection,
} from "./types";

export type PrintUploadAction =
  | { type: "SET_SPECS"; patch: Partial<PrintUploadSpecSelection> }
  | { type: "SET_FRONT_FILE"; file: PrintUploadFile | null }
  | { type: "SET_BACK_FILE"; file: PrintUploadFile | null }
  | { type: "SET_APPROVAL"; patch: Partial<PrintUploadApprovalChecks> }
  | { type: "RESET"; document: PrintUploadDocument };

export function printUploadReducer(state: PrintUploadDocument, action: PrintUploadAction): PrintUploadDocument {
  switch (action.type) {
    case "RESET":
      return action.document;
    case "SET_SPECS":
      return { ...state, specs: { ...state.specs, ...action.patch } };
    case "SET_FRONT_FILE":
      return { ...state, frontFile: action.file };
    case "SET_BACK_FILE":
      return { ...state, backFile: action.file };
    case "SET_APPROVAL":
      return { ...state, approval: { ...state.approval, ...action.patch } };
    default:
      return state;
  }
}
