"use client";

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { clampNativeObjectPositionPct } from "../../product-configurators/business-cards/designer-v2/studio/geometryClamp";

/**
 * Direct 2D control for CSS object-position (0–100%). Center-anchored dot inside a small pad.
 */
export function BusinessCardNativeImageFocalPad(props: {
  disabled: boolean;
  objectPositionXPct: number;
  objectPositionYPct: number;
  onChange: (patch: { objectPositionXPct: number; objectPositionYPct: number }) => void;
  labelId?: string;
}) {
  const { disabled, objectPositionXPct, objectPositionYPct, onChange, labelId } = props;
  const padRef = useRef<HTMLDivElement>(null);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el || disabled) return;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const x = clampNativeObjectPositionPct(((clientX - r.left) / r.width) * 100);
      const y = clampNativeObjectPositionPct(((clientY - r.top) / r.height) * 100);
      onChange({ objectPositionXPct: x, objectPositionYPct: y });
    },
    [disabled, onChange]
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    updateFromClient(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      updateFromClient(ev.clientX, ev.clientY);
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      el.releasePointerCapture(ev.pointerId);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const px = clampNativeObjectPositionPct(objectPositionXPct);
  const py = clampNativeObjectPositionPct(objectPositionYPct);

  return (
    <div
      ref={padRef}
      role="application"
      aria-labelledby={labelId}
      aria-disabled={disabled}
      className={[
        "relative mx-auto aspect-square w-full max-w-[140px] select-none rounded-lg border border-[rgba(201,168,74,0.35)] bg-[rgba(0,0,0,0.35)] touch-none",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-crosshair",
      ].join(" ")}
      onPointerDown={onPointerDown}
    >
      <div className="pointer-events-none absolute inset-[10%] rounded border border-[rgba(255,255,255,0.08)]" aria-hidden />
      <div
        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#c9a84a] shadow-md"
        style={{ left: `${px}%`, top: `${py}%` }}
        aria-hidden
      />
    </div>
  );
}
