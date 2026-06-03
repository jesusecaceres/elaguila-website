/** Autos publish stepped shell — 7 steps; final review/preview is index 6 (Paso 7). */
export const AUTOS_PUBLISH_STEP_COUNT = 7;
export const AUTOS_PUBLISH_FINAL_STEP_INDEX = AUTOS_PUBLISH_STEP_COUNT - 1;

export function clampAutosEditorStep(step: unknown, stepCount = AUTOS_PUBLISH_STEP_COUNT): number {
  const n = typeof step === "number" && Number.isFinite(step) ? Math.floor(step) : 0;
  return Math.min(Math.max(0, n), stepCount - 1);
}

export function clampAutosEditorMaxReached(
  max: unknown,
  step: number,
  stepCount = AUTOS_PUBLISH_STEP_COUNT,
): number {
  const s = clampAutosEditorStep(step, stepCount);
  const m = typeof max === "number" && Number.isFinite(max) ? Math.floor(max) : s;
  return Math.max(s, clampAutosEditorStep(m, stepCount));
}

export type AutosEditorDraftStepMeta = {
  editorStep?: number;
  editorMaxReached?: number;
};
