"use client";

import type { CSSProperties, RefObject } from "react";
import type { BusinessCardDesignerV2NativeObject } from "../../product-configurators/business-cards/types";
import {
  BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD,
  clampPreviewDragPct,
} from "../../product-configurators/business-cards/preview/businessCardPreviewConstants";

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

  const tf = (rotationDeg: number): string =>
    rotationDeg === 0 ? "translate(-50%, -50%)" : `translate(-50%, -50%) rotate(${rotationDeg}deg)`;

  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <>
      {sorted.map((o) => {
        if (!o.visible) return null;
        const selected = selectedId === o.id;
        const z = o.zIndex;
        const pe = readOnly ? "none" : "auto";
        const cursor = readOnly ? "default" : "grab";
        const commonClass = [
          "absolute",
          selected ? "ring-2 ring-[#c9a84a] ring-offset-2 ring-offset-[rgba(0,0,0,0.15)]" : "",
        ]
          .filter(Boolean)
          .join(" ");

        if (o.kind === "native-shape") {
          const br: CSSProperties["borderRadius"] = o.shape === "ellipse" ? "9999px" : "4px";
          return (
            <div
              key={o.id}
              className={[commonClass, readOnly ? "" : "active:cursor-grabbing touch-manipulation"].join(" ")}
              style={{
                left: `${o.xPct}%`,
                top: `${o.yPct}%`,
                width: `${o.widthPct}%`,
                height: `${o.heightPct}%`,
                transform: tf(o.rotationDeg),
                zIndex: z,
                backgroundColor: o.fill,
                borderRadius: br,
                pointerEvents: pe,
                cursor,
              }}
              onPointerDown={
                readOnly
                  ? undefined
                  : (e) => {
                      e.stopPropagation();
                      onSelect(o.id);
                      const trim = trimRef.current;
                      if (!trim) return;
                      const r = trim.getBoundingClientRect();
                      const x = clampPreviewDragPct(((e.clientX - r.left) / r.width) * 100);
                      const y = clampPreviewDragPct(((e.clientY - r.top) / r.height) * 100);
                      bindDrag(e.currentTarget, o.id, x, y, e.pointerId);
                    }
              }
            />
          );
        }

        if (!o.previewUrl) return null;
        return (
          <div
            key={o.id}
            className={[commonClass, readOnly ? "" : "active:cursor-grabbing touch-manipulation"].join(" ")}
            style={{
              left: `${o.xPct}%`,
              top: `${o.yPct}%`,
              width: `${o.widthPct}%`,
              height: `${o.heightPct}%`,
              transform: tf(o.rotationDeg),
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
