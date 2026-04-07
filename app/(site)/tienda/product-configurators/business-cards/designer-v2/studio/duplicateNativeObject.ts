import type { BusinessCardDesignerV2NativeObject } from "../../types";
import {
  clampNativeCenterPct,
  clampNativeRotationDeg,
  clampNativeSizePct,
  clampNativeFillOpacity,
  clampNativeStrokeWidthPx,
} from "./geometryClamp";
import { nextDesignerV2NativeZIndex } from "../factories/nativeObjectDefaults";
import type { BusinessCardSideState } from "../../types";

const DUPLICATE_NUDGE_PCT = 3;

/**
 * Deep copy with a new id, offset position, unlocked, and on top of the studio stack.
 */
export function duplicateNativeObject(
  state: BusinessCardSideState,
  source: BusinessCardDesignerV2NativeObject,
  newId: string
): BusinessCardDesignerV2NativeObject {
  const zIndex = nextDesignerV2NativeZIndex(state);
  const dx = DUPLICATE_NUDGE_PCT;
  const dy = DUPLICATE_NUDGE_PCT;

  if (source.kind === "native-image") {
    return {
      ...source,
      id: newId,
      locked: false,
      visible: true,
      zIndex,
      xPct: clampNativeCenterPct(source.xPct + dx),
      yPct: clampNativeCenterPct(source.yPct + dy),
      widthPct: clampNativeSizePct(source.widthPct),
      heightPct: clampNativeSizePct(source.heightPct),
      rotationDeg: clampNativeRotationDeg(source.rotationDeg),
    };
  }

  return {
    ...source,
    id: newId,
    locked: false,
    visible: true,
    zIndex,
    xPct: clampNativeCenterPct(source.xPct + dx),
    yPct: clampNativeCenterPct(source.yPct + dy),
    widthPct: clampNativeSizePct(source.widthPct),
    heightPct: clampNativeSizePct(source.heightPct),
    rotationDeg: clampNativeRotationDeg(source.rotationDeg),
    fillOpacity: clampNativeFillOpacity(source.fillOpacity ?? 1),
    strokeWidthPx: clampNativeStrokeWidthPx(source.strokeWidthPx ?? 0),
  };
}
