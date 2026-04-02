"use client";

import { Fragment, type CSSProperties, type RefObject } from "react";
import type { BusinessCardDesignerV2NativeObject } from "../../product-configurators/business-cards/types";
import {
  BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD,
  clampPreviewDragPct,
} from "../../product-configurators/business-cards/preview/businessCardPreviewConstants";
import { nativePreviewTransformCss } from "../../product-configurators/business-cards/designer-v2/studio/nativePreviewTransform";
import {
  nativeImageImgStyle,
  nativeImageWrapperStyle,
} from "../../product-configurators/business-cards/designer-v2/studio/nativeImagePreviewStyle";
import { BusinessCardNativeV2TransformChrome } from "./BusinessCardNativeV2TransformChrome";

type NativePatch = Partial<
  Pick<BusinessCardDesignerV2NativeObject, "xPct" | "yPct" | "widthPct" | "heightPct" | "rotationDeg">
>;

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
  /** Canvas resize/rotate — requires `transformInteraction` */
  onPatchV2Native?: (id: string, patch: NativePatch) => void;
  /** When true, resize/rotate handles are shown and wired (Phase 2+). */
  transformInteraction?: boolean;
}) {
  const {
    trimRef,
    objects,
    selectedId,
    readOnly,
    onSelect,
    onMove,
    onPatchV2Native,
    transformInteraction = false,
  } = props;

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

        const transformChrome = selected && !readOnly && onPatchV2Native;
        const ringClass = (() => {
          if (transformChrome && selected) {
            return "";
          }
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

        const hoverClass =
          !readOnly && canDrag && !selected ? "hover:ring-1 hover:ring-white/30 transition-shadow" : "";

        const commonClass = ["absolute", ringClass, hoverClass].filter(Boolean).join(" ");

        const objectStyle: CSSProperties = {
          left: `${o.xPct}%`,
          top: `${o.yPct}%`,
          width: `${o.widthPct}%`,
          height: `${o.heightPct}%`,
          transform: nativePreviewTransformCss(o.rotationDeg),
          zIndex: z,
          pointerEvents: pe,
          cursor,
          boxSizing: "border-box",
        };

        const chrome =
          selected && !readOnly && onPatchV2Native ? (
            <BusinessCardNativeV2TransformChrome
              trimRef={trimRef}
              o={o}
              interaction={transformInteraction}
              readOnly={readOnly}
              locked={locked}
              onPatch={(patch) => onPatchV2Native(o.id, patch)}
            />
          ) : null;

        if (o.kind === "native-shape") {
          const br: CSSProperties["borderRadius"] = o.shape === "ellipse" ? "9999px" : "4px";
          const fillOp = o.fillOpacity ?? 1;
          const sw = o.strokeWidthPx ?? 0;
          const sc = o.strokeColor;
          const showStroke = sw > 0 && sc;

          return (
            <Fragment key={o.id}>
              <div
                className={[commonClass, canDrag ? "active:cursor-grabbing touch-manipulation" : ""].filter(Boolean).join(" ")}
                style={{
                  ...objectStyle,
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
              {chrome}
            </Fragment>
          );
        }

        if (!o.previewUrl) return null;
        return (
          <Fragment key={o.id}>
            <div
              className={[commonClass, canDrag ? "active:cursor-grabbing touch-manipulation" : ""].filter(Boolean).join(" ")}
              style={objectStyle}
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
              <div style={nativeImageWrapperStyle(o)}>
                <img src={o.previewUrl} alt="" style={nativeImageImgStyle(o)} />
              </div>
            </div>
            {chrome}
          </Fragment>
        );
      })}
    </>
  );
}
