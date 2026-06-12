import type { AutosInventoryAddContext } from "./autosDealerInventoryAddFlow";
import { AUTOS_PUBLISH_FINAL_STEP_INDEX } from "./autosEditorDraftStep";

export const AUTOS_NEGOCIOS_EDITOR_RETURN_CONTEXT_KEY = "leonix:autos:negocios:editorReturnContext:v1";

export type AutosNegociosEditorReturnMode = "parent-preview" | "child-preview";

export type AutosNegociosEditorReturnContext = {
  v: 1;
  returnStep: number;
  returnMode: AutosNegociosEditorReturnMode;
  childId?: string | null;
  lang: "es" | "en";
  inventoryAddMode: boolean;
  inventoryAddContext?: AutosInventoryAddContext | null;
};

export function writeAutosNegociosEditorReturnContext(ctx: Omit<AutosNegociosEditorReturnContext, "v">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: AutosNegociosEditorReturnContext = { v: 1, ...ctx };
    sessionStorage.setItem(AUTOS_NEGOCIOS_EDITOR_RETURN_CONTEXT_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function readAutosNegociosEditorReturnContext(): AutosNegociosEditorReturnContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTOS_NEGOCIOS_EDITOR_RETURN_CONTEXT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as AutosNegociosEditorReturnContext;
    if (o?.v !== 1) return null;
    if (typeof o.returnStep !== "number") return null;
    if (o.returnMode !== "parent-preview" && o.returnMode !== "child-preview") return null;
    return o;
  } catch {
    return null;
  }
}

export function clearAutosNegociosEditorReturnContext(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTOS_NEGOCIOS_EDITOR_RETURN_CONTEXT_KEY);
  } catch {
    /* ignore */
  }
}

/** Default review step when legacy drafts lack `editorStep` after preview return. */
export function autosNegociosEditorReturnStepFallback(): number {
  const ctx = readAutosNegociosEditorReturnContext();
  if (ctx && Number.isFinite(ctx.returnStep)) return ctx.returnStep;
  return AUTOS_PUBLISH_FINAL_STEP_INDEX;
}
