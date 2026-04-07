"use client";

/**
 * Visual feedback for object-position on a selected Studio image (trim-relative %).
 * Pointer-events none — framing is edited via inspector pad and sliders.
 */
export function BusinessCardNativeImageFocalOverlay(props: {
  objectPositionXPct: number;
  objectPositionYPct: number;
}) {
  const x = Math.min(100, Math.max(0, props.objectPositionXPct));
  const y = Math.min(100, Math.max(0, props.objectPositionYPct));
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]">
      {/* Rule-of-thirds guides (very subtle) */}
      <div
        className="absolute inset-y-0 left-1/3 w-px bg-[rgba(201,168,74,0.12)]"
        aria-hidden
      />
      <div
        className="absolute inset-y-0 left-2/3 w-px bg-[rgba(201,168,74,0.12)]"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-1/3 h-px bg-[rgba(201,168,74,0.12)]"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-2/3 h-px bg-[rgba(201,168,74,0.12)]"
        aria-hidden
      />
      {/* Focal crosshair */}
      <div
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 bg-[#c9a84a]/85 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
        style={{ left: `${x}%`, top: `${y}%` }}
        aria-hidden
      />
      <div
        className="absolute h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-white/70"
        style={{ left: `${x}%`, top: `${y}%` }}
        aria-hidden
      />
      <div
        className="absolute h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-white/70"
        style={{ left: `${x}%`, top: `${y}%` }}
        aria-hidden
      />
    </div>
  );
}
