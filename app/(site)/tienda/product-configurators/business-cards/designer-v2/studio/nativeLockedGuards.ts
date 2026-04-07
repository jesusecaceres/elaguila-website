import type { BusinessCardDesignerV2NativeObject } from "../../types";

/**
 * When `locked` is true, only visibility and explicit unlock (`locked: false`) may change.
 * Reorder and geometry/style patches are rejected in the reducer.
 * A patch that includes `locked: false` applies the full merge (unlock may ship with other edits).
 */
export function shouldRejectLockedNativePatch(
  o: BusinessCardDesignerV2NativeObject,
  patch: Partial<BusinessCardDesignerV2NativeObject>
): boolean {
  if (!o.locked) return false;
  if (patch.locked === false) return false;
  const keys = Object.keys(patch) as (keyof typeof patch)[];
  for (const k of keys) {
    if (k === "visible") continue;
    return true;
  }
  return false;
}
