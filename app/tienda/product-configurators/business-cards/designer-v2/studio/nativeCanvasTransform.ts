/**
 * On-canvas resize/rotate math for studio-native objects (center-anchored, % of trim).
 */
import type { BusinessCardDesignerV2NativeObject } from "../../types";
import {
  imageHeightPctFromAspect,
  imageWidthPctFromAspectHeight,
} from "../factories/nativeObjectDefaults";
import {
  clampNativeCenterPct,
  clampNativeRotationDeg,
  clampNativeSizePct,
} from "./geometryClamp";

export type NativeResizeCorner = "nw" | "ne" | "sw" | "se";

const TWO_PI = Math.PI * 2;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Rotate (lx, ly) by θ radians (CSS positive = clockwise). */
function rot(lx: number, ly: number, θ: number): { x: number; y: number } {
  const c = Math.cos(θ);
  const s = Math.sin(θ);
  return { x: lx * c - ly * s, y: lx * s + ly * c };
}

function invRot(tx: number, ty: number, θ: number): { x: number; y: number } {
  return rot(tx, ty, -θ);
}

function trimPxFromPct(xPct: number, yPct: number, tw: number, th: number): { cx: number; cy: number } {
  return { cx: (xPct / 100) * tw, cy: (yPct / 100) * th };
}

function halfExtentsPx(o: BusinessCardDesignerV2NativeObject, tw: number, th: number): { hw: number; hh: number } {
  const hw = ((o.widthPct / 100) * tw) / 2;
  const hh = ((o.heightPct / 100) * th) / 2;
  return { hw, hh };
}

function localCornerOffset(corner: NativeResizeCorner, hw: number, hh: number): { lx: number; ly: number } {
  switch (corner) {
    case "nw":
      return { lx: -hw, ly: -hh };
    case "ne":
      return { lx: hw, ly: -hh };
    case "sw":
      return { lx: -hw, ly: hh };
    case "se":
      return { lx: hw, ly: hh };
    default:
      return { lx: 0, ly: 0 };
  }
}

/** Opposite corner stays fixed in trim space while dragging `draggedCorner`. */
export function fixedCornerForHandle(draggedCorner: NativeResizeCorner): NativeResizeCorner {
  switch (draggedCorner) {
    case "se":
      return "nw";
    case "nw":
      return "se";
    case "ne":
      return "sw";
    case "sw":
      return "ne";
    default:
      return "nw";
  }
}

/** Corner position in trim px. */
export function nativeCornerTrimPx(
  o: BusinessCardDesignerV2NativeObject,
  corner: NativeResizeCorner,
  tw: number,
  th: number
): { x: number; y: number } {
  const θ = toRad(o.rotationDeg);
  const { cx, cy } = trimPxFromPct(o.xPct, o.yPct, tw, th);
  const { hw, hh } = halfExtentsPx(o, tw, th);
  const local = localCornerOffset(corner, hw, hh);
  const r = rot(local.lx, local.ly, θ);
  return { x: cx + r.x, y: cy + r.y };
}

function centerFromFixedCornerTrim(
  fixedCorner: NativeResizeCorner,
  widthPct: number,
  heightPct: number,
  fixedPx: { x: number; y: number },
  tw: number,
  th: number,
  θ: number
): { xPct: number; yPct: number } {
  const hw2 = ((widthPct / 100) * tw) / 2;
  const hh2 = ((heightPct / 100) * th) / 2;
  const fl = localCornerOffset(fixedCorner, hw2, hh2);
  const r = rot(fl.lx, fl.ly, θ);
  const cx = fixedPx.x - r.x;
  const cy = fixedPx.y - r.y;
  return {
    xPct: clampNativeCenterPct((cx / tw) * 100),
    yPct: clampNativeCenterPct((cy / th) * 100),
  };
}

export type NativeResizeSession = {
  draggedCorner: NativeResizeCorner;
  /** Opposite corner — frozen in trim px for the whole drag */
  fixedTrimPx: { x: number; y: number };
  /** Rotation frozen for the drag (matches fixed corner math) */
  rotationDeg: number;
  /** For aspect-lock on images */
  source: BusinessCardDesignerV2NativeObject;
};

/**
 * Resize using a session from pointer-down (fixed corner must not move between moves).
 */
export function computeNativeResizePatchFromSession(
  session: NativeResizeSession,
  pointerXPct: number,
  pointerYPct: number,
  tw: number,
  th: number
): { xPct: number; yPct: number; widthPct: number; heightPct: number } {
  const θ = toRad(session.rotationDeg);
  const fixed = fixedCornerForHandle(session.draggedCorner);
  const { fixedTrimPx } = session;

  const px = Math.min(tw, Math.max(0, (pointerXPct / 100) * tw));
  const py = Math.min(th, Math.max(0, (pointerYPct / 100) * th));
  const P = { x: px, y: py };

  const d = invRot(P.x - fixedTrimPx.x, P.y - fixedTrimPx.y, θ);
  let widthPct = clampNativeSizePct((Math.abs(d.x) / tw) * 100);
  let heightPct = clampNativeSizePct((Math.abs(d.y) / th) * 100);

  const o = session.source;
  if (o.kind === "native-image" && o.lockAspectRatio !== false && o.naturalWidth && o.naturalHeight && o.naturalWidth > 0 && o.naturalHeight > 0) {
    const nw = o.naturalWidth;
    const nh = o.naturalHeight;
    const wPx = (widthPct / 100) * tw;
    const hPx = (heightPct / 100) * th;
    const ratioWH = (nw / nh) * (th / tw);
    const cur = wPx / hPx;
    if (cur > ratioWH) {
      widthPct = clampNativeSizePct(imageWidthPctFromAspectHeight(heightPct, nw, nh));
    } else {
      heightPct = clampNativeSizePct(imageHeightPctFromAspect(widthPct, nw, nh));
    }
  }

  const pos = centerFromFixedCornerTrim(fixed, widthPct, heightPct, fixedTrimPx, tw, th, θ);
  return { ...pos, widthPct, heightPct };
}

/**
 * Resize: dragged corner moves to pointer; opposite corner stays fixed in trim space (single-shot).
 */
export function computeNativeResizePatch(
  o: BusinessCardDesignerV2NativeObject,
  draggedCorner: NativeResizeCorner,
  pointerXPct: number,
  pointerYPct: number,
  tw: number,
  th: number
): { xPct: number; yPct: number; widthPct: number; heightPct: number } {
  const fixed = fixedCornerForHandle(draggedCorner);
  const fixedTrimPx = nativeCornerTrimPx(o, fixed, tw, th);
  return computeNativeResizePatchFromSession(
    { draggedCorner, fixedTrimPx, rotationDeg: o.rotationDeg, source: o },
    pointerXPct,
    pointerYPct,
    tw,
    th
  );
}

export function rotationDegFromPointerDelta(
  cxPx: number,
  cyPx: number,
  startPx: { x: number; y: number },
  currentPx: { x: number; y: number },
  baseRotationDeg: number
): number {
  const a0 = Math.atan2(startPx.y - cyPx, startPx.x - cxPx);
  const a1 = Math.atan2(currentPx.y - cyPx, currentPx.x - cxPx);
  let delta = a1 - a0;
  while (delta > Math.PI) delta -= TWO_PI;
  while (delta < -Math.PI) delta += TWO_PI;
  return clampNativeRotationDeg(baseRotationDeg + (delta * 180) / Math.PI);
}

export function trimPointerPx(xPct: number, yPct: number, tw: number, th: number): { x: number; y: number } {
  return { x: (xPct / 100) * tw, y: (yPct / 100) * th };
}
