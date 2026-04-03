"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useRef } from "react";
import type { RefObject } from "react";
import type { BusinessCardDesignerV2NativeObject } from "../../product-configurators/business-cards/types";
import { nativePreviewTransformCss } from "../../product-configurators/business-cards/designer-v2/studio/nativePreviewTransform";
import { clampPreviewDragPct } from "../../product-configurators/business-cards/preview/businessCardPreviewConstants";
import type { SnapGuideState } from "../../product-configurators/business-cards/preview/alignmentSnap";
import { snapTrimPosition } from "../../product-configurators/business-cards/preview/alignmentSnap";
import type { NativeResizeCorner } from "../../product-configurators/business-cards/designer-v2/studio/nativeCanvasTransform";
import {
  computeNativeResizePatchFromSession,
  fixedCornerForHandle,
  nativeCornerTrimPx,
  rotationDegFromPointerDelta,
  trimPointerPx,
  type NativeResizeSession,
} from "../../product-configurators/business-cards/designer-v2/studio/nativeCanvasTransform";

/** Slightly larger than desktop-only 9px so resize is easier on touch without shifting the hit test too far */
const HANDLE_PX = 12;
const ROT_ABOVE_PX = 22;

type Patch = Partial<
  Pick<BusinessCardDesignerV2NativeObject, "xPct" | "yPct" | "widthPct" | "heightPct" | "rotationDeg">
>;

function bindPointerDrag(
  el: HTMLElement,
  pointerId: number,
  onMove: (clientX: number, clientY: number) => void,
  onEnd: () => void
) {
  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== pointerId) return;
    onMove(ev.clientX, ev.clientY);
  };
  const up = (ev: PointerEvent) => {
    if (ev.pointerId !== pointerId) return;
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    onEnd();
  };
  try {
    el.setPointerCapture(pointerId);
  } catch {
    /* ignore */
  }
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}

/**
 * Transform UI for a selected studio-native object: OBB outline; optional resize/rotate handles when `interaction`.
 */
export function BusinessCardNativeV2TransformChrome(props: {
  trimRef: RefObject<HTMLDivElement | null>;
  o: BusinessCardDesignerV2NativeObject;
  /** When false, only the selection box is shown (Phase 1). When true, resize/rotate handles are active. */
  interaction: boolean;
  readOnly: boolean;
  locked: boolean;
  guidesVisible?: boolean;
  onSnapGuidesChange?: (guides: SnapGuideState | null) => void;
  onPatch: (patch: Patch) => void;
}) {
  const { trimRef, o, interaction, readOnly, locked, guidesVisible = false, onSnapGuidesChange, onPatch } = props;
  const oRef = useRef(o);
  oRef.current = o;
  const rotateBaseRef = useRef(0);
  const rotateStartRef = useRef({ x: 0, y: 0 });
  const z = o.zIndex + 400;

  const baseStyle: CSSProperties = {
    position: "absolute",
    left: `${o.xPct}%`,
    top: `${o.yPct}%`,
    width: `${o.widthPct}%`,
    height: `${o.heightPct}%`,
    transform: nativePreviewTransformCss(o.rotationDeg),
    zIndex: z,
    pointerEvents: "none",
    boxSizing: "border-box",
  };

  const trimPctFromClient = (clientX: number, clientY: number): { xPct: number; yPct: number } | null => {
    const trim = trimRef.current;
    if (!trim) return null;
    const r = trim.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return {
      xPct: clampPreviewDragPct(((clientX - r.left) / r.width) * 100),
      yPct: clampPreviewDragPct(((clientY - r.top) / r.height) * 100),
    };
  };

  const onResizePointerDown = (corner: NativeResizeCorner, e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!interaction || readOnly || locked) return;
    e.stopPropagation();
    e.preventDefault();
    const trim = trimRef.current;
    if (!trim) return;
    const o0 = oRef.current;
    const { width: tw, height: th } = trim.getBoundingClientRect();
    const fixed = fixedCornerForHandle(corner);
    const fixedTrimPx = nativeCornerTrimPx(o0, fixed, tw, th);
    const session: NativeResizeSession = {
      draggedCorner: corner,
      fixedTrimPx,
      rotationDeg: o0.rotationDeg,
      source: o0,
    };

    bindPointerDrag(
      e.currentTarget,
      e.pointerId,
      (cx, cy) => {
        const p = trimPctFromClient(cx, cy);
        if (!p) return;
        const t2 = trim.getBoundingClientRect();
        const raw = computeNativeResizePatchFromSession(session, p.xPct, p.yPct, t2.width, t2.height);
        const snapped = snapTrimPosition(raw.xPct, raw.yPct, { guidesVisible });
        onSnapGuidesChange?.(
          snapped.guides.vertical != null || snapped.guides.horizontal != null ? snapped.guides : null
        );
        onPatch({ ...raw, xPct: snapped.xPct, yPct: snapped.yPct });
      },
      () => {
        onSnapGuidesChange?.(null);
      }
    );
  };

  const onRotatePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!interaction || readOnly || locked) return;
    e.stopPropagation();
    e.preventDefault();
    const trim = trimRef.current;
    if (!trim) return;
    const r = trim.getBoundingClientRect();
    const tw = r.width;
    const th = r.height;
    rotateBaseRef.current = oRef.current.rotationDeg;
    rotateStartRef.current = trimPointerPx(
      clampPreviewDragPct(((e.clientX - r.left) / r.width) * 100),
      clampPreviewDragPct(((e.clientY - r.top) / r.height) * 100),
      tw,
      th
    );

    bindPointerDrag(
      e.currentTarget,
      e.pointerId,
      (cx, cy) => {
        const r2 = trim.getBoundingClientRect();
        const tw2 = r2.width;
        const th2 = r2.height;
        const curP = trimPointerPx(
          clampPreviewDragPct(((cx - r2.left) / r2.width) * 100),
          clampPreviewDragPct(((cy - r2.top) / r2.height) * 100),
          tw2,
          th2
        );
        const cxPx = (oRef.current.xPct / 100) * tw2;
        const cyPx = (oRef.current.yPct / 100) * th2;
        const next = rotationDegFromPointerDelta(cxPx, cyPx, rotateStartRef.current, curP, rotateBaseRef.current);
        onPatch({ rotationDeg: next });
      },
      () => {
        onSnapGuidesChange?.(null);
      }
    );
  };

  const corners: NativeResizeCorner[] = ["nw", "ne", "se", "sw"];
  const cornerClass: Record<NativeResizeCorner, string> = {
    nw: "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    ne: "absolute right-0 top-0 translate-x-1/2 -translate-y-1/2",
    se: "absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2",
    sw: "absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2",
  };
  const cursor: Record<NativeResizeCorner, string> = {
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize",
  };

  const showHandles = interaction && !readOnly && !locked;

  return (
    <div className="absolute inset-0" style={baseStyle} aria-hidden>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="none"
          stroke="rgba(201, 168, 74, 0.95)"
          strokeWidth={locked ? 1.5 : 2}
          strokeDasharray={locked ? "5 4" : undefined}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {showHandles
        ? corners.map((c) => (
            <button
              key={c}
              type="button"
              tabIndex={-1}
              aria-label={`Resize ${c}`}
              className={`rounded-sm border-2 border-white bg-[#c9a84a] shadow-md touch-none ${cornerClass[c]}`}
              style={{
                width: HANDLE_PX,
                height: HANDLE_PX,
                pointerEvents: "auto",
                cursor: cursor[c],
                touchAction: "none",
              }}
              onPointerDown={(e) => onResizePointerDown(c, e)}
            />
          ))
        : null}

      {showHandles ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Rotate"
          className="absolute left-1/2 flex h-8 w-8 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 border-white bg-[rgba(201,168,74,0.95)] shadow-md touch-none sm:min-h-0 sm:min-w-0 sm:h-7 sm:w-7"
          style={{
            top: -ROT_ABOVE_PX,
            transform: "translate(-50%, -50%)",
            pointerEvents: "auto",
            cursor: "grab",
            touchAction: "none",
          }}
          onPointerDown={onRotatePointerDown}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#2c2416]" aria-hidden>
            <path
              d="M12 5a7 7 0 1 1-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M8 5h4V1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
