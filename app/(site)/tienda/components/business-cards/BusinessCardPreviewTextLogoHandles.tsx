"use client";

import type { RefObject } from "react";
import { BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD } from "../../product-configurators/business-cards/preview/businessCardPreviewConstants";

/** Matches inspector text width input (min/max). */
export const TEXT_BLOCK_WIDTH_PCT_MIN = 20;
export const TEXT_BLOCK_WIDTH_PCT_MAX = 92;

/** Matches logo geom inspector width. */
export const LOGO_WIDTH_PCT_MIN = 8;
export const LOGO_WIDTH_PCT_MAX = 70;

function clampTextWidth(v: number): number {
  return Math.min(TEXT_BLOCK_WIDTH_PCT_MAX, Math.max(TEXT_BLOCK_WIDTH_PCT_MIN, v));
}

function clampLogoWidth(v: number): number {
  return Math.min(LOGO_WIDTH_PCT_MAX, Math.max(LOGO_WIDTH_PCT_MIN, v));
}

function bindPointerCapture(
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
 * Left/right edge resize for centered text blocks. Center fixed at (xPct, yPct) →
 * width delta ≈ ±2 × horizontal delta in trim % (right edge widens to the right; left edge mirrors).
 */
export function BusinessCardTextBlockWidthHandle(props: {
  trimRef: RefObject<HTMLDivElement | null>;
  blockId: string;
  startWidthPct: number;
  onPatchWidth: (id: string, widthPct: number) => void;
  edge?: "left" | "right";
}) {
  const { trimRef, blockId, startWidthPct, onPatchWidth, edge = "right" } = props;
  const isLeft = edge === "left";

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={isLeft ? "Resize text width (left edge)" : "Resize text width (right edge)"}
      className={[
        "absolute top-1/2 z-[2] min-h-[44px] min-w-[44px] -translate-y-1/2 rounded-sm border-2 border-white bg-[#c9a84a] shadow-md touch-none sm:min-h-0 sm:min-w-0 sm:h-7 sm:w-2.5",
        isLeft ? "left-1" : "right-1",
      ].join(" ")}
      style={{ cursor: "ew-resize", touchAction: "none", pointerEvents: "auto" }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        const trim = trimRef.current;
        if (!trim) return;
        const tw = trim.getBoundingClientRect().width;
        if (tw <= 0) return;
        const startX = e.clientX;
        let last = startWidthPct;
        bindPointerCapture(e.currentTarget, e.pointerId, (cx) => {
          const dxPct = ((cx - startX) / tw) * 100;
          const delta = isLeft ? -2 * dxPct : 2 * dxPct;
          const next = clampTextWidth(startWidthPct + delta);
          if (Math.abs(next - last) < BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD) return;
          last = next;
          onPatchWidth(blockId, next);
        }, () => {});
      }}
    />
  );
}

/**
 * Bottom-right corner resize for logo (square): center fixed; width changes with diagonal drag (average of dx, dy).
 */
export function BusinessCardLogoWidthHandle(props: {
  trimRef: RefObject<HTMLDivElement | null>;
  startWidthPct: number;
  onPatchWidth: (widthPct: number) => void;
}) {
  const { trimRef, startWidthPct, onPatchWidth } = props;

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Resize logo"
      className="absolute right-1 bottom-1 z-[2] min-h-[44px] min-w-[44px] rounded-sm border-2 border-white bg-[#c9a84a] shadow-md touch-none sm:min-h-0 sm:min-w-0 sm:h-3 sm:w-3"
      style={{ cursor: "nwse-resize", touchAction: "none", pointerEvents: "auto" }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        const trim = trimRef.current;
        if (!trim) return;
        const r = trim.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        const startX = e.clientX;
        const startY = e.clientY;
        let last = startWidthPct;
        bindPointerCapture(e.currentTarget, e.pointerId, (cx, cy) => {
          const dxPct = ((cx - startX) / r.width) * 100;
          const dyPct = ((cy - startY) / r.height) * 100;
          const next = clampLogoWidth(startWidthPct + dxPct + dyPct);
          if (Math.abs(next - last) < BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD) return;
          last = next;
          onPatchWidth(next);
        }, () => {});
      }}
    />
  );
}
