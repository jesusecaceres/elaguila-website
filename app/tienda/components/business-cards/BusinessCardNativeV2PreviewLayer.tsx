"use client";

import type { CSSProperties, RefObject } from "react";
import type { BusinessCardDesignerV2NativeObject } from "../../product-configurators/business-cards/types";
import {
  BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD,
  clampPreviewDragPct,
} from "../../product-configurators/business-cards/preview/businessCardPreviewConstants";
import { nativePreviewTransformCss } from "../../product-configurators/business-cards/designer-v2/studio/nativePreviewTransform";

/**
 * Renders persisted Designer V2 native objects on top of V1 preview content (same trim box).
 */
export function BusinessCardNativeV2PreviewLayer(props: {
  trimRef: RefObject<HTMLDivElement | null>;
  objects: BusinessCardDesignerV2NativeObject[];
  selectedId: string | null;
  readOnly: boolean;
  onSelect: (id: string | null) => void;
  onMove: (id: string, xPct: number, yPct: number) => void;
}) {
  const { trimRef, objects, selectedId, readOnly, onSelect, onMove } = props;

  const bindDrag = (el: HTMLElement, oid: string, startX: number, startY: number, pointerId: number) => {
    const trim = trimRef.current;
    if (!trim) return;
    let lastX = startX;
    let lastY = startY;
    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const r = trim.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const x = clampPreviewDragPct(((ev.clientX - r.left) / r.width) * 100);
      const y = clampPreviewDragPct(((ev.clientY - r.top) / r.height) * 100);
      if (Math.hypot(x - lastX, y - lastY) < BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD) return;
      lastX = x;
      lastY = y;
      onMove(oid, x, y);
    };
    const onPointerUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
    try {
      el.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
  };

  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <>
      {sorted.map((o) => {
        if (!o.visible) return null;
        const selected = selectedId === o.id;
        const locked = o.locked === true;
        const z = o.zIndex;
        const pe = readOnly ? "none" : "auto";
        const canDrag = !readOnly && !locked;
        const cursor = readOnly ? "default" : locked ? "default" : "grab";

        const ringClass = (() => {
          if (selected && locked) {
            return "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-[rgba(0,0,0,0.15)] ring-dashed";
          }
          if (selected) {
            return "ring-2 ring-[#c9a84a] ring-offset-2 ring-offset-[rgba(0,0,0,0.15)]";
          }
          if (locked) {
            return "ring-1 ring-[rgba(251,191,36,0.45)] ring-dashed";
          }
          return "";
        })();

        const commonClass = ["absolute", ringClass].filter(Boolean).join(" ");

        if (o.kind === "native-shape") {
          const br: CSSProperties["borderRadius"] = o.shape === "ellipse" ? "9999px" : "4px";
          const fillOp = o.fillOpacity ?? 1;
          const sw = o.strokeWidthPx ?? 0;
          const sc = o.strokeColor;
          const showStroke = sw > 0 && sc;

          return (
            <div
              key={o.id}
              className={[commonClass, canDrag ? "active:cursor-grabbing touch-manipulation" : ""].filter(Boolean).join(" ")}
              style={{
                left: `${o.xPct}%`,
                top: `${o.yPct}%`,
                width: `${o.widthPct}%`,
                height: `${o.heightPct}%`,
                transform: nativePreviewTransformCss(o.rotationDeg),
                zIndex: z,
                pointerEvents: pe,
                cursor,
                boxSizing: "border-box",
                borderRadius: br,
                overflow: "hidden",
                background: "transparent",
              }}
              onPointerDown={
                readOnly
                  ? undefined
                  : (e) => {
                      e.stopPropagation();
                      onSelect(o.id);
                      if (!canDrag) return;
                      const trim = trimRef.current;
                      if (!trim) return;
                      const r = trim.getBoundingClientRect();
                      const x = clampPreviewDragPct(((e.clientX - r.left) / r.width) * 100);
                      const y = clampPreviewDragPct(((e.clientY - r.top) / r.height) * 100);
                      bindDrag(e.currentTarget, o.id, x, y, e.pointerId);
                    }
              }
            >
              <div
                className="absolute inset-0"
                style={{
                  borderRadius: br,
                  backgroundColor: o.fill,
                  opacity: fillOp,
                }}
              />
              {showStroke ? (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    borderRadius: br,
                    border: `${sw}px solid ${sc}`,
                    boxSizing: "border-box",
                  }}
                />
              ) : null}
            </div>
          );
        }

        if (!o.previewUrl) return null;
        return (
          <div
            key={o.id}
            className={[commonClass, canDrag ? "active:cursor-grabbing touch-manipulation" : ""].filter(Boolean).join(" ")}
            style={{
              left: `${o.xPct}%`,
              top: `${o.yPct}%`,
              width: `${o.widthPct}%`,
              height: `${o.heightPct}%`,
              transform: nativePreviewTransformCss(o.rotationDeg),
              zIndex: z,
              pointerEvents: pe,
              cursor,
            }}
            onPointerDown={
              readOnly
                ? undefined
                : (e) => {
                    e.stopPropagation();
                    onSelect(o.id);
                    if (!canDrag) return;
                    const trim = trimRef.current;
                    if (!trim) return;
                    const r = trim.getBoundingClientRect();
                    const x = clampPreviewDragPct(((e.clientX - r.left) / r.width) * 100);
                    const y = clampPreviewDragPct(((e.clientY - r.top) / r.height) * 100);
                    bindDrag(e.currentTarget, o.id, x, y, e.pointerId);
                  }
            }
          >
            <img src={o.previewUrl} alt="" className="h-full w-full object-contain pointer-events-none select-none" />
          </div>
        );
      })}
    </>
  );
}
