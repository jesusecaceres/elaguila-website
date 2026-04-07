import type { BusinessCardBuilderAction } from "./businessCardBuilderReducer";

/** True when the action only nudges canvas position (drag) — throttled for undo stack. */
export function businessCardActionIsPositionOnly(action: BusinessCardBuilderAction): boolean {
  if (action.type === "SET_TEXT_BLOCK") {
    const keys = Object.keys(action.patch);
    return keys.length > 0 && keys.every((k) => k === "xPct" || k === "yPct");
  }
  if (action.type === "SET_LOGO_GEOM") {
    const keys = Object.keys(action.patch);
    return keys.length > 0 && keys.every((k) => k === "xPct" || k === "yPct");
  }
  if (action.type === "V2_PATCH_NATIVE_OBJECT") {
    const keys = Object.keys(action.patch);
    return keys.length > 0 && keys.every((k) => k === "xPct" || k === "yPct");
  }
  return false;
}
